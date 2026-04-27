import { User, VehicleEntry, PricingRule, SystemLog } from '../types';

export const MOCK_USERS: User[] = [
  {
    id: '1',
    email: 'cajero@parking.com',
    name: 'Juan Pérez',
    role: 'cashier',
    createdAt: '2024-01-15T08:00:00Z',
    isActive: true,
  },
  {
    id: '2',
    email: 'admin@parking.com',
    name: 'María González',
    role: 'admin',
    createdAt: '2024-01-10T08:00:00Z',
    isActive: true,
  },
  {
    id: '3',
    email: 'cajero2@parking.com',
    name: 'Carlos Rodríguez',
    role: 'cashier',
    createdAt: '2024-02-01T08:00:00Z',
    isActive: true,
  },
];

export const PRICING_RULES: PricingRule[] = [
  {
    id: '1',
    category: 'car',
    name: 'Automóvil Estándar',
    basePrice: 5.0,
    hourlyRate: 3.0,
    dailyMax: 40.0,
  },
  {
    id: '2',
    category: 'motorcycle',
    name: 'Motocicleta',
    basePrice: 3.0,
    hourlyRate: 2.0,
    dailyMax: 20.0,
  },
  {
    id: '3',
    category: 'truck',
    name: 'Camión/Vehículo Grande',
    basePrice: 8.0,
    hourlyRate: 5.0,
    dailyMax: 60.0,
  },
  {
    id: '4',
    category: 'van',
    name: 'Camioneta/SUV',
    basePrice: 6.0,
    hourlyRate: 4.0,
    dailyMax: 50.0,
  },
];

export const MOCK_VEHICLES: VehicleEntry[] = [
  {
    id: '1',
    licensePlate: 'ABC123',
    category: 'car',
    entryTime: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    isPaid: false,
    cashierId: '1',
    hasError: false,
  },
  {
    id: '2',
    licensePlate: 'AB123CD',
    category: 'motorcycle',
    entryTime: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    isPaid: false,
    cashierId: '1',
    hasError: false,
  },
  {
    id: '3',
    licensePlate: 'DEF456',
    category: 'car',
    entryTime: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    isPaid: false,
    cashierId: '2',
    hasError: false,
  },
];

export const MOCK_LOGS: SystemLog[] = [
  {
    id: '1',
    timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    type: 'entry',
    message: 'Vehículo ABC123 ingresó al estacionamiento',
    userId: '1',
    vehicleId: '1',
  },
  {
    id: '2',
    timestamp: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
    type: 'entry',
    message: 'Vehículo AB123CD ingresó al estacionamiento',
    userId: '1',
    vehicleId: '2',
  },
  {
    id: '3',
    timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    type: 'error',
    message: 'Error al leer la patente - se requiere entrada manual',
    userId: '1',
  },
];

// Simulated license plates for LPR detection
export const SIMULATED_PLATES = [
  'ABC123',
  'XYZ456',
  'DEF789',
  'GHI012',
  'JKL345',
  'AB123CD',
  'DE456FG',
  'HI789JK',
  'LM012NO',
  'PQ345RS',
];

export const calculateParkingFee = (
  category: string,
  durationMinutes: number
): number => {
  const rule = PRICING_RULES.find((r) => r.category === category);
  if (!rule) return 0;

  if (durationMinutes <= 60) {
    return rule.basePrice;
  }

  const additionalHours = Math.ceil((durationMinutes - 60) / 60);
  const total = rule.basePrice + additionalHours * rule.hourlyRate;

  return Math.min(total, rule.dailyMax);
};

export const formatDuration = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (hours === 0) {
    return `${mins}m`;
  }

  return `${hours}h ${mins}m`;
};

export const translateCategory = (category: string): string => {
  const translations: { [key: string]: string } = {
    car: 'Auto',
    motorcycle: 'Moto',
    van: 'Camioneta/SUV',
    truck: 'Camión',
  };
  return translations[category] || category;
};
