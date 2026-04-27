import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from 'react';
import {
  VehicleEntry,
  VehicleCategory,
  SystemLog,
  LPRDetection,
  DashboardStats,
} from '../types';
import {
  MOCK_VEHICLES,
  MOCK_LOGS,
  SIMULATED_PLATES,
  calculateParkingFee,
} from '../data/mockData';
import { useAuth } from './AuthContext';

interface ParkingContextType {
  vehicles: VehicleEntry[];
  logs: SystemLog[];
  currentDetection: LPRDetection | null;
  stats: DashboardStats;
  simulateDetection: () => void;
  addVehicleEntry: (
    plate: string,
    category: VehicleCategory
  ) => Promise<VehicleEntry>;
  processExit: (vehicleId: string) => Promise<VehicleEntry>;
  searchVehicle: (plate: string) => VehicleEntry | undefined;
  addLog: (
    type: SystemLog['type'],
    message: string,
    vehicleId?: string
  ) => void;
}

const ParkingContext = createContext<ParkingContextType | undefined>(
  undefined
);

export const ParkingProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const { user } = useAuth();
  const [vehicles, setVehicles] = useState<VehicleEntry[]>(MOCK_VEHICLES);
  const [logs, setLogs] = useState<SystemLog[]>(MOCK_LOGS);
  const [currentDetection, setCurrentDetection] =
    useState<LPRDetection | null>(null);

  // Calculate dashboard stats
  const stats: DashboardStats = {
    vehiclesInside: vehicles.filter((v) => !v.exitTime).length,
    todayEntries: vehicles.length,
    todayRevenue: vehicles
      .filter((v) => v.isPaid)
      .reduce((sum, v) => sum + (v.amount || 0), 0),
    averageDuration: Math.round(
      vehicles
        .filter((v) => v.duration)
        .reduce((sum, v) => sum + (v.duration || 0), 0) / vehicles.length || 0
    ),
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

    // Clear detection after 5 seconds
    setTimeout(() => setCurrentDetection(null), 5000);
  };

  const addVehicleEntry = async (
    plate: string,
    category: VehicleCategory
  ): Promise<VehicleEntry> => {
    const newEntry: VehicleEntry = {
      id: Date.now().toString(),
      licensePlate: plate.toUpperCase(),
      category,
      entryTime: new Date().toISOString(),
      isPaid: false,
      cashierId: user?.id || '1',
      hasError: false,
    };

    setVehicles((prev) => [...prev, newEntry]);
    addLog('entry', `Vehículo ${plate} ingresó al estacionamiento`, newEntry.id);

    return newEntry;
  };

  const processExit = async (vehicleId: string): Promise<VehicleEntry> => {
    const vehicle = vehicles.find((v) => v.id === vehicleId);
    if (!vehicle) {
      throw new Error('Vehicle not found');
    }

    const exitTime = new Date();
    const entryTime = new Date(vehicle.entryTime);
    const durationMinutes = Math.round(
      (exitTime.getTime() - entryTime.getTime()) / (1000 * 60)
    );
    const amount = calculateParkingFee(vehicle.category, durationMinutes);

    const updatedVehicle: VehicleEntry = {
      ...vehicle,
      exitTime: exitTime.toISOString(),
      duration: durationMinutes,
      amount,
      isPaid: true,
    };

    setVehicles((prev) =>
      prev.map((v) => (v.id === vehicleId ? updatedVehicle : v))
    );

    addLog(
      'payment',
      `Vehículo ${vehicle.licensePlate} salió - $${amount.toFixed(2)} pagado`,
      vehicleId
    );

    return updatedVehicle;
  };

  const searchVehicle = (plate: string): VehicleEntry | undefined => {
    return vehicles.find(
      (v) =>
        v.licensePlate.toLowerCase() === plate.toLowerCase() && !v.exitTime
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

  return (
    <ParkingContext.Provider
      value={{
        vehicles,
        logs,
        currentDetection,
        stats,
        simulateDetection,
        addVehicleEntry,
        processExit,
        searchVehicle,
        addLog,
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
