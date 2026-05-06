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
} from '../types';
import {
  MOCK_VEHICLES,
  MOCK_LOGS,
  MOCK_SUBSCRIBERS,
  SIMULATED_PLATES,
  PRICING_RULES,
  calculateParkingFee,
} from '../data/mockData';
import { useAuth } from './AuthContext';

interface ParkingContextType {
  vehicles: VehicleEntry[];
  logs: SystemLog[];
  currentDetection: LPRDetection | null;
  stats: DashboardStats;
  pricingRules: PricingRule[];
  subscribers: Subscriber[];
  simulateDetection: () => void;
  addVehicleEntry: (
    plate: string,
    category: VehicleCategory
  ) => Promise<VehicleEntry>;
  processExit: (
    vehicleId: string,
    paymentMethod: PaymentMethod
  ) => Promise<VehicleEntry>;
  searchVehicle: (plate: string) => VehicleEntry | undefined;
  checkDuplicatePlate: (plate: string) => boolean;
  addLog: (
    type: SystemLog['type'],
    message: string,
    vehicleId?: string
  ) => void;
  // Pricing CRUD
  addPricingRule: (rule: Omit<PricingRule, 'id'>) => void;
  updatePricingRule: (rule: PricingRule) => void;
  deletePricingRule: (id: string) => void;
  // Subscriber CRUD
  addSubscriber: (subscriber: Omit<Subscriber, 'id' | 'createdAt'>) => void;
  updateSubscriber: (subscriber: Subscriber) => void;
  deleteSubscriber: (id: string) => void;
  getSubscriberByPlate: (plate: string) => Subscriber | undefined;
}

const ParkingContext = createContext<ParkingContextType | undefined>(undefined);

export const ParkingProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const { user } = useAuth();
  const [vehicles, setVehicles] = useState<VehicleEntry[]>(MOCK_VEHICLES);
  const [logs, setLogs] = useState<SystemLog[]>(MOCK_LOGS);
  const [currentDetection, setCurrentDetection] =
    useState<LPRDetection | null>(null);
  const [pricingRules, setPricingRules] = useState<PricingRule[]>(PRICING_RULES);
  const [subscribers, setSubscribers] = useState<Subscriber[]>(MOCK_SUBSCRIBERS);

  // Calculate dashboard stats
  const stats: DashboardStats = {
    vehiclesInside: vehicles.filter((v) => !v.exitTime).length,
    todayEntries: vehicles.filter((v) => {
      const today = new Date();
      const entry = new Date(v.entryTime);
      return entry.toDateString() === today.toDateString();
    }).length,
    todayRevenue: vehicles
      .filter((v) => v.isPaid && v.exitTime)
      .filter((v) => {
        const today = new Date();
        const exit = new Date(v.exitTime!);
        return exit.toDateString() === today.toDateString();
      })
      .reduce((sum, v) => sum + (v.amount || 0), 0),
    averageDuration: Math.round(
      vehicles
        .filter((v) => v.duration)
        .reduce((sum, v) => sum + (v.duration || 0), 0) /
        Math.max(vehicles.filter((v) => v.duration).length, 1)
    ),
  };

  // Check if plate is already inside (duplicate)
  const checkDuplicatePlate = (plate: string): boolean => {
    return vehicles.some(
      (v) =>
        v.licensePlate.toLowerCase() === plate.toLowerCase() && !v.exitTime
    );
  };

  // Simulate LPR detection
  const simulateDetection = () => {
    const randomPlate =
      SIMULATED_PLATES[Math.floor(Math.random() * SIMULATED_PLATES.length)];
    const confidence = Math.random() * 0.3 + 0.7; // 70-100% confidence

    setCurrentDetection({
      plate: randomPlate,
      confidence,
      timestamp: new Date().toISOString(),
      isValid: confidence > 0.8,
    });

    // Clear detection after 8 seconds
    setTimeout(() => setCurrentDetection(null), 8000);
  };

  const addVehicleEntry = async (
    plate: string,
    category: VehicleCategory
  ): Promise<VehicleEntry> => {
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
      `Vehículo ${plate.toUpperCase()} ingresó al estacionamiento${subscriber ? ' (Abonado: ' + subscriber.name + ')' : ''}`,
      newEntry.id
    );

    return newEntry;
  };

  const processExit = async (
    vehicleId: string,
    paymentMethod: PaymentMethod
  ): Promise<VehicleEntry> => {
    const vehicle = vehicles.find((v) => v.id === vehicleId);
    if (!vehicle) {
      throw new Error('Vehículo no encontrado');
    }

    const exitTime = new Date();
    const entryTime = new Date(vehicle.entryTime);
    const durationMinutes = Math.round(
      (exitTime.getTime() - entryTime.getTime()) / (1000 * 60)
    );

    // 5-minute no-charge rule
    const isFreeExit = durationMinutes <= 5;

    // Check if subscriber
    const subscriber = getSubscriberByPlate(vehicle.licensePlate);
    const isActiveSubscriber =
      subscriber &&
      subscriber.status === 'active' &&
      subscriber.type === 'monthly';

    let amount = 0;
    if (!isFreeExit && !isActiveSubscriber) {
      const baseAmount = calculateParkingFee(
        vehicle.category,
        durationMinutes,
        pricingRules
      );
      // Apply discount if discounted subscriber
      if (
        subscriber &&
        subscriber.status === 'active' &&
        subscriber.type === 'discounted' &&
        subscriber.discount
      ) {
        amount = baseAmount * (1 - subscriber.discount / 100);
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
      isFreeExit,
    };

    setVehicles((prev) =>
      prev.map((v) => (v.id === vehicleId ? updatedVehicle : v))
    );

    let logMsg = `Vehículo ${vehicle.licensePlate} salió`;
    if (isFreeExit) {
      logMsg += ' - Sin cargo (menos de 5 minutos)';
    } else if (isActiveSubscriber) {
      logMsg += ` - Sin cargo (abonado mensual: ${subscriber.name})`;
    } else {
      logMsg += ` - $${amount.toFixed(2)} pagado en ${paymentMethod === 'cash' ? 'efectivo' : 'tarjeta'}`;
    }

    addLog('payment', logMsg, vehicleId);

    return updatedVehicle;
  };

  const searchVehicle = (plate: string): VehicleEntry | undefined => {
    return vehicles.find(
      (v) =>
        v.licensePlate.toLowerCase() === plate.toLowerCase() && !v.exitTime
    );
  };

  const getSubscriberByPlate = (plate: string): Subscriber | undefined => {
    const upperPlate = plate.toUpperCase();
    return subscribers.find(
      (s) =>
        s.licensePlate === upperPlate ||
        (s.additionalPlates && s.additionalPlates.includes(upperPlate))
    );
  };

  const addLog = (
    type: SystemLog['type'],
    message: string,
    vehicleId?: string
  ) => {
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

  // Pricing CRUD
  const addPricingRule = (rule: Omit<PricingRule, 'id'>) => {
    const newRule: PricingRule = {
      ...rule,
      id: Date.now().toString(),
    };
    setPricingRules((prev) => [...prev, newRule]);
  };

  const updatePricingRule = (rule: PricingRule) => {
    setPricingRules((prev) => prev.map((r) => (r.id === rule.id ? rule : r)));
  };

  const deletePricingRule = (id: string) => {
    setPricingRules((prev) => prev.filter((r) => r.id !== id));
  };

  // Subscriber CRUD
  const addSubscriber = (subscriber: Omit<Subscriber, 'id' | 'createdAt'>) => {
    const newSubscriber: Subscriber = {
      ...subscriber,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    setSubscribers((prev) => [...prev, newSubscriber]);
  };

  const updateSubscriber = (subscriber: Subscriber) => {
    setSubscribers((prev) =>
      prev.map((s) => (s.id === subscriber.id ? subscriber : s))
    );
  };

  const deleteSubscriber = (id: string) => {
    setSubscribers((prev) => prev.filter((s) => s.id !== id));
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
        simulateDetection,
        addVehicleEntry,
        processExit,
        searchVehicle,
        checkDuplicatePlate,
        addLog,
        addPricingRule,
        updatePricingRule,
        deletePricingRule,
        addSubscriber,
        updateSubscriber,
        deleteSubscriber,
        getSubscriberByPlate,
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
