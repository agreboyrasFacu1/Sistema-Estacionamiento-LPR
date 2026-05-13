import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  DashboardStats,
  LPRCorrection,
  LPRDetection,
  PaymentMethod,
  PricingRule,
  Subscriber,
  SystemLog,
  TicketOperation,
  VehicleCategory,
  VehicleEntry,
  WhiteRunIncident,
} from '../types';
import {
  MOCK_LOGS,
  MOCK_SUBSCRIBERS,
  MOCK_TICKETS,
  MOCK_VEHICLES,
  MOCK_WHITE_RUN_INCIDENTS,
  PRICING_RULES,
} from '../data/mockData';
import { calculateDashboardStats } from '../domain/dashboard';
import { normalizePlate } from '../domain/plates';
import { calculateParkingFee, normalizePricingRule } from '../domain/pricing';
import {
  calculateDurationMinutes,
  createExitGraceUntil,
  isWithinExitGrace,
} from '../domain/stays';
import {
  getSubscriberByPlate as findSubscriberByPlate,
  getSubscriberValidity,
  isActiveMonthlySubscriber,
} from '../domain/subscribers';
import { createTicketNumber, createTicketOperation } from '../domain/tickets';
import {
  calculateLprAccuracy,
  simulatedLprProvider,
  TARGET_LPR_ACCURACY,
} from '../domain/lpr';
import { calculateWhiteRunDifference } from '../domain/whiteRun';
import { loadFromStorage, saveToStorage } from '../services/storage';
import { formatCurrencyARSWithCents } from '../utils/currency';
import { useAuth } from './AuthContext';

interface ParkingContextType {
  vehicles: VehicleEntry[];
  logs: SystemLog[];
  currentDetection: LPRDetection | null;
  stats: DashboardStats;
  pricingRules: PricingRule[];
  subscribers: Subscriber[];
  tickets: TicketOperation[];
  whiteRunIncidents: WhiteRunIncident[];
  lprCorrections: LPRCorrection[];
  lprAccuracy: number | null;
  lprTargetAccuracy: number;
  simulateDetection: () => Promise<void>;
  addVehicleEntry: (
    plate: string,
    category: VehicleCategory
  ) => Promise<VehicleEntry>;
  processPayment: (
    vehicleId: string,
    paymentMethod: PaymentMethod,
    manualAmount?: number
  ) => Promise<VehicleEntry>;
  confirmVehicleExit: (vehicleId: string) => Promise<VehicleEntry>;
  processExit: (
    vehicleId: string,
    paymentMethod: PaymentMethod
  ) => Promise<VehicleEntry>;
  searchVehicle: (plate: string) => VehicleEntry | undefined;
  searchVehicleByQuery: (query: string) => VehicleEntry | undefined;
  checkDuplicatePlate: (plate: string) => boolean;
  addLog: (
    type: SystemLog['type'],
    message: string,
    vehicleId?: string,
    metadata?: SystemLog['metadata']
  ) => void;
  addPricingRule: (rule: Omit<PricingRule, 'id'>) => void;
  updatePricingRule: (rule: PricingRule) => void;
  deletePricingRule: (id: string) => void;
  addSubscriber: (subscriber: Omit<Subscriber, 'id' | 'createdAt'>) => void;
  updateSubscriber: (subscriber: Subscriber) => void;
  deleteSubscriber: (id: string) => void;
  getSubscriberByPlate: (plate: string) => Subscriber | undefined;
  recordLprCorrection: (detectedPlate: string, correctedPlate: string, confidence: number) => void;
  addWhiteRunIncident: (payload: Omit<WhiteRunIncident, 'id' | 'createdAt' | 'userId' | 'status'>) => void;
  resolveWhiteRunIncident: (id: string) => void;
}

const ParkingContext = createContext<ParkingContextType | undefined>(undefined);

export const ParkingProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const { user, isTrainingMode } = useAuth();
  const [vehicles, setVehicles] = useState<VehicleEntry[]>(() =>
    loadFromStorage('vehicles', MOCK_VEHICLES)
  );
  const [logs, setLogs] = useState<SystemLog[]>(() =>
    loadFromStorage('logs', MOCK_LOGS)
  );
  const [currentDetection, setCurrentDetection] =
    useState<LPRDetection | null>(null);
  const [pricingRules, setPricingRules] = useState<PricingRule[]>(() =>
    loadFromStorage('pricing-rules', PRICING_RULES)
  );
  const [subscribers, setSubscribers] = useState<Subscriber[]>(() =>
    loadFromStorage('subscribers', MOCK_SUBSCRIBERS)
  );
  const [tickets, setTickets] = useState<TicketOperation[]>(() =>
    loadFromStorage('tickets', MOCK_TICKETS)
  );
  const [whiteRunIncidents, setWhiteRunIncidents] = useState<WhiteRunIncident[]>(
    () => loadFromStorage('white-run-incidents', MOCK_WHITE_RUN_INCIDENTS)
  );
  const [lprCorrections, setLprCorrections] = useState<LPRCorrection[]>(() =>
    loadFromStorage('lpr-corrections', [])
  );

  useEffect(() => saveToStorage('vehicles', vehicles), [vehicles]);
  useEffect(() => saveToStorage('logs', logs), [logs]);
  useEffect(
    () => saveToStorage('pricing-rules', pricingRules),
    [pricingRules]
  );
  useEffect(() => saveToStorage('subscribers', subscribers), [subscribers]);
  useEffect(() => saveToStorage('tickets', tickets), [tickets]);
  useEffect(
    () => saveToStorage('white-run-incidents', whiteRunIncidents),
    [whiteRunIncidents]
  );
  useEffect(
    () => saveToStorage('lpr-corrections', lprCorrections),
    [lprCorrections]
  );

  const addLog = (
    type: SystemLog['type'],
    message: string,
    vehicleId?: string,
    metadata?: SystemLog['metadata']
  ) => {
    const newLog: SystemLog = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      type,
      message,
      userId: user?.id || 'system',
      vehicleId,
      metadata,
    };

    setLogs((prev) => [newLog, ...prev]);
  };

  const getSubscriberByPlate = (plate: string): Subscriber | undefined =>
    findSubscriberByPlate(subscribers, plate);

  const checkDuplicatePlate = (plate: string): boolean => {
    const normalized = normalizePlate(plate);
    return vehicles.some(
      (vehicle) =>
        normalizePlate(vehicle.licensePlate) === normalized &&
        vehicle.status !== 'exited' &&
        !vehicle.exitTime
    );
  };

  const searchVehicle = (plate: string): VehicleEntry | undefined => {
    const normalized = normalizePlate(plate);
    return vehicles.find(
      (vehicle) =>
        normalizePlate(vehicle.licensePlate) === normalized &&
        vehicle.status !== 'exited' &&
        !vehicle.exitTime
    );
  };

  const searchVehicleByQuery = (query: string): VehicleEntry | undefined => {
    const normalizedQuery = normalizePlate(query);
    return vehicles.find(
      (vehicle) =>
        normalizePlate(vehicle.licensePlate) === normalizedQuery ||
        vehicle.ticketNumber === query.trim()
    );
  };

  const calculateChargeForVehicle = (
    vehicle: VehicleEntry,
    paidAt: Date
  ): {
    amount: number;
    duration: number;
    paymentMethod: PaymentMethod;
    subscriberValidity?: VehicleEntry['subscriberValidity'];
  } => {
    const duration = calculateDurationMinutes(vehicle.entryTime, paidAt);
    const subscriber = getSubscriberByPlate(vehicle.licensePlate);
    const subscriberValidity = getSubscriberValidity(subscriber, paidAt);
    const activeMonthly = isActiveMonthlySubscriber(subscriber, paidAt);

    if (activeMonthly) {
      return {
        amount: 0,
        duration,
        paymentMethod: 'subscriber',
        subscriberValidity,
      };
    }

    const baseAmount = calculateParkingFee(
      vehicle.category,
      duration,
      pricingRules
    );
    const amount =
      subscriber &&
      subscriber.type === 'discounted' &&
      subscriberValidity === 'active' &&
      subscriber.discount
        ? Number((baseAmount * (1 - subscriber.discount / 100)).toFixed(2))
        : baseAmount;

    return {
      amount,
      duration,
      paymentMethod: amount === 0 ? 'no_charge' : 'cash',
      subscriberValidity,
    };
  };

  const stats: DashboardStats = useMemo(
    () => calculateDashboardStats(vehicles),
    [vehicles]
  );

  const lprAccuracy = useMemo(
    () => calculateLprAccuracy(lprCorrections),
    [lprCorrections]
  );

  const simulateDetection = async () => {
    const detection = await simulatedLprProvider.detect();
    setCurrentDetection(detection);
    setTimeout(() => setCurrentDetection(null), 8000);
  };

  const addVehicleEntry = async (
    plate: string,
    category: VehicleCategory
  ): Promise<VehicleEntry> => {
    const normalizedPlate = normalizePlate(plate);
    const subscriber = getSubscriberByPlate(normalizedPlate);
    const subscriberValidity = getSubscriberValidity(subscriber);
    const newEntry: VehicleEntry = {
      id: Date.now().toString(),
      licensePlate: normalizedPlate,
      category,
      entryTime: new Date().toISOString(),
      isPaid: false,
      cashierId: user?.id || 'system',
      hasError: false,
      isSubscriber: !!subscriber,
      subscriberValidity,
      status:
        subscriber?.type === 'monthly' && subscriberValidity === 'active'
          ? 'subscriber_active'
          : 'entered',
    };

    setVehicles((prev) => [...prev, newEntry]);
    addLog(
      'entry',
      `Vehiculo ${normalizedPlate} ingreso al estacionamiento${
        subscriber ? ` (Abonado: ${subscriber.name}, ${subscriberValidity})` : ''
      }`,
      newEntry.id,
      { category }
    );

    return newEntry;
  };

  const processPayment = async (
    vehicleId: string,
    paymentMethod: PaymentMethod,
    manualAmount?: number
  ): Promise<VehicleEntry> => {
    const vehicle = vehicles.find((item) => item.id === vehicleId);
    if (!vehicle) throw new Error('Vehiculo no encontrado');
    if (vehicle.exitTime) throw new Error('El vehiculo ya egreso');

    const paidAtDate = new Date();
    const charge = calculateChargeForVehicle(vehicle, paidAtDate);
    const effectivePaymentMethod =
      charge.paymentMethod === 'subscriber' || charge.paymentMethod === 'no_charge'
        ? charge.paymentMethod
        : paymentMethod;
    const paidAt = paidAtDate.toISOString();
    const ticketNumber =
      vehicle.ticketNumber || createTicketNumber(vehicle.id, paidAtDate);
    const whiteRunDifference =
      typeof manualAmount === 'number'
        ? calculateWhiteRunDifference(charge.amount, manualAmount)
        : undefined;

    const updatedVehicle: VehicleEntry = {
      ...vehicle,
      paidAt,
      exitGraceUntil: createExitGraceUntil(paidAt),
      duration: charge.duration,
      amount: charge.amount,
      isPaid: true,
      paymentMethod: effectivePaymentMethod,
      ticketNumber,
      subscriberValidity: charge.subscriberValidity,
      status: 'paid',
      whiteRunManualAmount: manualAmount,
      whiteRunDifference,
    };

    setVehicles((prev) =>
      prev.map((item) => (item.id === vehicleId ? updatedVehicle : item))
    );

    const ticket = createTicketOperation(
      updatedVehicle,
      effectivePaymentMethod,
      user?.id || 'system',
      paidAtDate
    );
    setTickets((prev) => {
      const withoutDuplicate = prev.filter(
        (item) => item.ticketNumber !== ticket.ticketNumber
      );
      return [ticket, ...withoutDuplicate];
    });

    if (isTrainingMode && typeof whiteRunDifference === 'number' && whiteRunDifference !== 0) {
      addWhiteRunIncident({
        vehicleId,
        licensePlate: updatedVehicle.licensePlate,
        systemAmount: charge.amount,
        manualAmount,
        difference: whiteRunDifference,
        description: 'Diferencia detectada durante marcha blanca',
      });
    }

    addLog(
      'payment',
      `Vehiculo ${updatedVehicle.licensePlate} pago ticket interno ${ticketNumber} por ${formatCurrencyARSWithCents(charge.amount)}`,
      vehicleId,
      {
        amount: charge.amount,
        paymentMethod: effectivePaymentMethod,
        ticketNumber,
      }
    );

    return updatedVehicle;
  };

  const confirmVehicleExit = async (
    vehicleId: string
  ): Promise<VehicleEntry> => {
    const vehicle = vehicles.find((item) => item.id === vehicleId);
    if (!vehicle) throw new Error('Vehiculo no encontrado');
    if (vehicle.exitTime) return vehicle;
    if (!vehicle.isPaid) throw new Error('El pago debe registrarse antes del egreso');

    const now = new Date();
    const currentDuration = calculateDurationMinutes(vehicle.entryTime, now);
    const currentCharge = calculateChargeForVehicle(vehicle, now);
    const graceIsValid = isWithinExitGrace(vehicle.exitGraceUntil, now);
    const additionalCharge = Number(
      Math.max(0, currentCharge.amount - (vehicle.amount || 0)).toFixed(2)
    );

    if (!graceIsValid && additionalCharge > 0) {
      const pendingVehicle: VehicleEntry = {
        ...vehicle,
        duration: currentDuration,
        amount: currentCharge.amount,
        isPaid: false,
        status: 'payment_pending',
      };
      setVehicles((prev) =>
        prev.map((item) => (item.id === vehicleId ? pendingVehicle : item))
      );
      addLog(
        'error',
        `Vehiculo ${vehicle.licensePlate} excedio la tolerancia post-pago de 3 minutos`,
        vehicleId,
        { additionalCharge }
      );
      throw new Error(
        'La tolerancia post-pago de 3 minutos expiro. Recalcule y registre el pago nuevamente.'
      );
    }

    const updatedVehicle: VehicleEntry = {
      ...vehicle,
      exitTime: now.toISOString(),
      duration: currentDuration,
      status: 'exited',
    };

    setVehicles((prev) =>
      prev.map((item) => (item.id === vehicleId ? updatedVehicle : item))
    );
    setTickets((prev) =>
      prev.map((ticket) =>
        ticket.vehicleId === vehicleId
          ? { ...ticket, exitTime: updatedVehicle.exitTime, duration: currentDuration }
          : ticket
      )
    );
    addLog(
      'exit',
      `Vehiculo ${vehicle.licensePlate} egreso con ticket ${vehicle.ticketNumber || 'sin ticket'}`,
      vehicleId,
      { duration: currentDuration }
    );

    return updatedVehicle;
  };

  const processExit = async (
    vehicleId: string,
    paymentMethod: PaymentMethod
  ): Promise<VehicleEntry> => {
    const vehicle = vehicles.find((item) => item.id === vehicleId);
    if (!vehicle) throw new Error('Vehiculo no encontrado');
    if (!vehicle.isPaid) {
      await processPayment(vehicleId, paymentMethod);
    }
    return confirmVehicleExit(vehicleId);
  };

  const addPricingRule = (rule: Omit<PricingRule, 'id'>) => {
    const newRule: PricingRule = normalizePricingRule({
      ...rule,
      id: Date.now().toString(),
    });
    setPricingRules((prev) => [...prev, newRule]);
  };

  const updatePricingRule = (rule: PricingRule) => {
    const normalized = normalizePricingRule(rule);
    setPricingRules((prev) =>
      prev.map((item) => (item.id === normalized.id ? normalized : item))
    );
  };

  const deletePricingRule = (id: string) => {
    setPricingRules((prev) => prev.filter((item) => item.id !== id));
  };

  const addSubscriber = (subscriber: Omit<Subscriber, 'id' | 'createdAt'>) => {
    const newSubscriber: Subscriber = {
      ...subscriber,
      licensePlate: normalizePlate(subscriber.licensePlate),
      additionalPlates: (subscriber.additionalPlates || []).map(normalizePlate),
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    setSubscribers((prev) => [...prev, newSubscriber]);
  };

  const updateSubscriber = (subscriber: Subscriber) => {
    const normalized: Subscriber = {
      ...subscriber,
      licensePlate: normalizePlate(subscriber.licensePlate),
      additionalPlates: (subscriber.additionalPlates || []).map(normalizePlate),
    };
    setSubscribers((prev) =>
      prev.map((item) => (item.id === normalized.id ? normalized : item))
    );
  };

  const deleteSubscriber = (id: string) => {
    setSubscribers((prev) => prev.filter((item) => item.id !== id));
  };

  const recordLprCorrection = (
    detectedPlate: string,
    correctedPlate: string,
    confidence: number
  ) => {
    const correction: LPRCorrection = {
      id: Date.now().toString(),
      detectedPlate: normalizePlate(detectedPlate),
      correctedPlate: normalizePlate(correctedPlate),
      confidence,
      timestamp: new Date().toISOString(),
      userId: user?.id || 'system',
    };
    setLprCorrections((prev) => [correction, ...prev]);
    addLog(
      'manual',
      `Correccion LPR: ${correction.detectedPlate} -> ${correction.correctedPlate}`,
      undefined,
      { confidence }
    );
  };

  const addWhiteRunIncident = (
    payload: Omit<WhiteRunIncident, 'id' | 'createdAt' | 'userId' | 'status'>
  ) => {
    const incident: WhiteRunIncident = {
      ...payload,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      userId: user?.id || 'system',
      status: 'open',
    };
    setWhiteRunIncidents((prev) => [incident, ...prev]);
    addLog(
      'white_run',
      `Incidencia de marcha blanca registrada: ${incident.description}`,
      incident.vehicleId,
      {
        systemAmount: incident.systemAmount ?? null,
        manualAmount: incident.manualAmount ?? null,
        difference: incident.difference ?? null,
      }
    );
  };

  const resolveWhiteRunIncident = (id: string) => {
    setWhiteRunIncidents((prev) =>
      prev.map((incident) =>
        incident.id === id ? { ...incident, status: 'resolved' } : incident
      )
    );
  };

  return (
    <ParkingContext.Provider
      value={{
        vehicles,
        logs,
        currentDetection,
        stats,
        pricingRules,
        subscribers,
        tickets,
        whiteRunIncidents,
        lprCorrections,
        lprAccuracy,
        lprTargetAccuracy: TARGET_LPR_ACCURACY,
        simulateDetection,
        addVehicleEntry,
        processPayment,
        confirmVehicleExit,
        processExit,
        searchVehicle,
        searchVehicleByQuery,
        checkDuplicatePlate,
        addLog,
        addPricingRule,
        updatePricingRule,
        deletePricingRule,
        addSubscriber,
        updateSubscriber,
        deleteSubscriber,
        getSubscriberByPlate,
        recordLprCorrection,
        addWhiteRunIncident,
        resolveWhiteRunIncident,
      }}
    >
      {children}
    </ParkingContext.Provider>
  );
};

export const useParking = () => {
  const context = useContext(ParkingContext);
  if (!context) {
    throw new Error('useParking must be used within ParkingProvider');
  }
  return context;
};
