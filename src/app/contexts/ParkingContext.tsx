import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
} from 'react';
import {
  VehicleEntry,
  VehicleCategory,
  SystemLog,
  LPRDetection,
  DashboardStats,
  PricingRule,
  Subscriber,
  PaymentMethod,
  SubscriberPricingRule,
} from '../types';
import {
  MOCK_VEHICLES,
  MOCK_LOGS,
  MOCK_SUBSCRIBERS,
  SIMULATED_PLATES,
  PRICING_RULES,
  SUBSCRIBER_PRICING_RULES,
  calculateParkingFee,
  getEffectiveSubscriberStatus,
} from '../data/mockData';
import { useAuth } from './AuthContext';

interface ParkingContextType {
  vehicles: VehicleEntry[];
  logs: SystemLog[];
  currentDetection: LPRDetection | null;
  stats: DashboardStats;
  pricingRules: PricingRule[];
  subscriberPricingRules: SubscriberPricingRule[];
  subscribers: Subscriber[];
  simulateDetection: () => void;
  addVehicleEntry: (plate: string, category: VehicleCategory) => Promise<VehicleEntry>;
  processExit: (vehicleId: string, paymentMethod: PaymentMethod, paymentSplit?: { cash: number; card: number }) => Promise<VehicleEntry>;
  searchVehicle: (plate: string) => VehicleEntry | undefined;
  checkDuplicatePlate: (plate: string) => boolean;
  addLog: (type: SystemLog['type'], message: string, vehicleId?: string) => void;
  updatePricingRule: (rule: PricingRule) => void;
  updateSubscriberPricingRule: (rule: SubscriberPricingRule) => void;
  addSubscriber: (subscriber: Omit<Subscriber, 'id' | 'createdAt'>) => void;
  updateSubscriber: (subscriber: Subscriber) => void;
  deleteSubscriber: (id: string) => void;
  getSubscriberByPlate: (plate: string) => Subscriber | undefined;
  hasActiveSubscription: (plate: string, excludeId?: string) => boolean;
}

const ParkingContext = createContext<ParkingContextType | undefined>(undefined);

export const ParkingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [vehicles, setVehicles] = useState<VehicleEntry[]>(MOCK_VEHICLES);
  const [logs, setLogs] = useState<SystemLog[]>(MOCK_LOGS);
  const [currentDetection, setCurrentDetection] = useState<LPRDetection | null>(null);
  const [pricingRules, setPricingRules] = useState<PricingRule[]>(PRICING_RULES);
  const [subscriberPricingRules, setSubscriberPricingRules] = useState<SubscriberPricingRule[]>(SUBSCRIBER_PRICING_RULES);
  const [subscribers, setSubscribers] = useState<Subscriber[]>(MOCK_SUBSCRIBERS);

  const stats: DashboardStats = {
    vehiclesInside: vehicles.filter((v) => !v.exitTime).length,
    todayEntries: vehicles.filter((v) => {
      const today = new Date();
      return new Date(v.entryTime).toDateString() === today.toDateString();
    }).length,
    todayRevenue: vehicles
      .filter((v) => v.isPaid && v.exitTime)
      .filter((v) => new Date(v.exitTime!).toDateString() === new Date().toDateString())
      .reduce((sum, v) => sum + (v.amount || 0), 0),
    averageDuration: Math.round(
      vehicles.filter((v) => v.duration).reduce((sum, v) => sum + (v.duration || 0), 0) /
        Math.max(vehicles.filter((v) => v.duration).length, 1)
    ),
  };

  const checkDuplicatePlate = (plate: string): boolean =>
    vehicles.some((v) => v.licensePlate.toLowerCase() === plate.toLowerCase() && !v.exitTime);

  const simulateDetection = () => {
    const randomPlate = SIMULATED_PLATES[Math.floor(Math.random() * SIMULATED_PLATES.length)];
    const confidence = Math.random() * 0.3 + 0.7;
    setCurrentDetection({
      plate: randomPlate,
      confidence,
      timestamp: new Date().toISOString(),
      isValid: confidence > 0.8,
    });
    setTimeout(() => setCurrentDetection(null), 8000);
  };

  const getSubscriberByPlate = (plate: string): Subscriber | undefined => {
    const upperPlate = plate.toUpperCase();
    return subscribers.find(
      (s) =>
        s.licensePlate === upperPlate ||
        (s.additionalPlates && s.additionalPlates.includes(upperPlate))
    );
  };

  /** Returns true if there's already an active (non-expired) monthly subscription for this plate */
  const hasActiveSubscription = (plate: string, excludeId?: string): boolean => {
    const upperPlate = plate.toUpperCase();
    return subscribers.some((s) => {
      if (excludeId && s.id === excludeId) return false;
      const platesMatch =
        s.licensePlate === upperPlate ||
        (s.additionalPlates && s.additionalPlates.includes(upperPlate));
      if (!platesMatch) return false;
      return getEffectiveSubscriberStatus(s) === 'active' && s.type === 'monthly';
    });
  };

  const addLog = (type: SystemLog['type'], message: string, vehicleId?: string) => {
    const newLog: SystemLog = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      type,
      message,
      userId: user?.id || '1',
      vehicleId,
    };
    setLogs((prev) => [newLog, ...prev]);
  };

  const addVehicleEntry = async (plate: string, category: VehicleCategory): Promise<VehicleEntry> => {
    const subscriber = getSubscriberByPlate(plate);
    const newEntry: VehicleEntry = {
      id: Date.now().toString(),
      licensePlate: plate.toUpperCase(),
      category,
      entryTime: new Date().toISOString(),
      isPaid: false,
      cashierId: user?.id || '1',
      hasError: false,
      isSubscriber: !!subscriber,
    };
    setVehicles((prev) => [...prev, newEntry]);
    addLog(
      'entry',
      `Vehículo ${plate.toUpperCase()} ingresó${subscriber ? ' (Abonado: ' + subscriber.name + ')' : ''}`,
      newEntry.id
    );
    return newEntry;
  };

  const processExit = async (vehicleId: string, paymentMethod: PaymentMethod, paymentSplit?: { cash: number; card: number }): Promise<VehicleEntry> => {
    const vehicle = vehicles.find((v) => v.id === vehicleId);
    if (!vehicle) throw new Error('Vehículo no encontrado');

    const exitTime = new Date();
    const durationMinutes = Math.round(
      (exitTime.getTime() - new Date(vehicle.entryTime).getTime()) / (1000 * 60)
    );

    const isFreeExit = durationMinutes <= 5;
    const subscriber = getSubscriberByPlate(vehicle.licensePlate);

    // Only truly active (non-expired) monthly subscribers get a free pass
    const effectiveStatus = subscriber ? getEffectiveSubscriberStatus(subscriber) : null;
    const isActiveMonthly =
      effectiveStatus === 'active' && subscriber?.type === 'monthly';

    let amount = 0;
    if (!isFreeExit && !isActiveMonthly) {
      const baseAmount = calculateParkingFee(vehicle.category, durationMinutes, pricingRules);
      if (
        subscriber &&
        effectiveStatus === 'active' &&
        subscriber.type === 'discounted' &&
        subscriber.discount
      ) {
        amount = Math.round(baseAmount * (1 - subscriber.discount / 100));
      } else {
        amount = baseAmount;
      }
    }

    const updatedVehicle: VehicleEntry = {
      ...vehicle,
      exitTime: exitTime.toISOString(),
      duration: durationMinutes,
      amount,
      isPaid: true,
      paymentMethod,
      paymentSplit: paymentMethod === 'mixed' ? paymentSplit : undefined,
      isFreeExit,
    };

    setVehicles((prev) => prev.map((v) => (v.id === vehicleId ? updatedVehicle : v)));

    let logMsg = `Vehículo ${vehicle.licensePlate} salió`;
    if (isFreeExit) {
      logMsg += ' — Sin cargo (menos de 5 min)';
    } else if (isActiveMonthly && subscriber) {
      logMsg += ` — Sin cargo (abonado mensual activo: ${subscriber.name})`;
    } else if (subscriber && effectiveStatus === 'expired') {
      logMsg += ` — ARS $${amount.toLocaleString('es-AR')} (abono VENCIDO, cobro normal)`;
    } else if (paymentMethod === 'mixed' && paymentSplit) {
      logMsg += ` — ARS $${amount.toLocaleString('es-AR')} (efectivo $${paymentSplit.cash.toLocaleString('es-AR')} + tarjeta $${paymentSplit.card.toLocaleString('es-AR')})`;
    } else {
      const method = paymentMethod === 'cash' ? 'efectivo' : 'tarjeta';
      logMsg += ` — ARS $${amount.toLocaleString('es-AR')} en ${method}`;
    }
    addLog('payment', logMsg, vehicleId);

    return updatedVehicle;
  };

  const searchVehicle = (plate: string): VehicleEntry | undefined =>
    vehicles.find(
      (v) => v.licensePlate.toLowerCase() === plate.toLowerCase() && !v.exitTime
    );

  // Pricing — only update, no add/delete
  const updatePricingRule = (rule: PricingRule) =>
    setPricingRules((prev) => prev.map((r) => (r.id === rule.id ? rule : r)));

  // Subscriber pricing — only update, no add/delete
  const updateSubscriberPricingRule = (rule: SubscriberPricingRule) =>
    setSubscriberPricingRules((prev) => prev.map((r) => (r.id === rule.id ? rule : r)));

  // Subscriber CRUD
  const addSubscriber = (subscriber: Omit<Subscriber, 'id' | 'createdAt'>) => {
    const newSubscriber: Subscriber = {
      ...subscriber,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    setSubscribers((prev) => [...prev, newSubscriber]);
  };

  const updateSubscriber = (subscriber: Subscriber) =>
    setSubscribers((prev) => prev.map((s) => (s.id === subscriber.id ? subscriber : s)));

  const deleteSubscriber = (id: string) =>
    setSubscribers((prev) => prev.filter((s) => s.id !== id));

  return (
    <ParkingContext.Provider
      value={{
        vehicles,
        logs,
        currentDetection,
        stats,
        pricingRules,
        subscriberPricingRules,
        subscribers,
        simulateDetection,
        addVehicleEntry,
        processExit,
        searchVehicle,
        checkDuplicatePlate,
        addLog,
        updatePricingRule,
        updateSubscriberPricingRule,
        addSubscriber,
        updateSubscriber,
        deleteSubscriber,
        getSubscriberByPlate,
        hasActiveSubscription,
      }}
    >
      {children}
    </ParkingContext.Provider>
  );
};

export const useParking = () => {
  const context = useContext(ParkingContext);
  if (!context) throw new Error('useParking must be used within ParkingProvider');
  return context;
};
