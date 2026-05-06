import { User, VehicleEntry, PricingRule, SystemLog, Subscriber } from '../types';

export const MOCK_USERS: User[] = [
  {
    id: '1',
    email: 'cajero@parking.com',
    name: 'UsuarioCajero1',
    role: 'cashier',
    createdAt: '2024-01-15T08:00:00Z',
    isActive: true,
  },
  {
    id: '2',
    email: 'admin@parking.com',
    name: 'UsuarioAdmin1',
    role: 'admin',
    createdAt: '2024-01-10T08:00:00Z',
    isActive: true,
  },
  {
    id: '3',
    email: 'cajero2@parking.com',
    name: 'UsuarioCajero2',
    role: 'cashier',
    createdAt: '2024-02-01T08:00:00Z',
    isActive: true,
  },
  {
    id: '4',
    email: 'cajero3@parking.com',
    name: 'UsuarioCajero3',
    role: 'cashier',
    createdAt: '2024-03-10T08:00:00Z',
    isActive: false,
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
    fraction: 60,
    tolerance: 10,
  },
  {
    id: '2',
    category: 'motorcycle',
    name: 'Motocicleta',
    basePrice: 3.0,
    hourlyRate: 2.0,
    dailyMax: 20.0,
    fraction: 60,
    tolerance: 10,
  },
  {
    id: '3',
    category: 'truck',
    name: 'Camión/Vehículo Grande',
    basePrice: 8.0,
    hourlyRate: 5.0,
    dailyMax: 60.0,
    fraction: 60,
    tolerance: 5,
  },
  {
    id: '4',
    category: 'van',
    name: 'Camioneta/SUV',
    basePrice: 6.0,
    hourlyRate: 4.0,
    dailyMax: 50.0,
    fraction: 60,
    tolerance: 10,
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
  {
    id: '4',
    licensePlate: 'GH789IJ',
    category: 'van',
    entryTime: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    isPaid: false,
    cashierId: '1',
    hasError: false,
    isSubscriber: true,
  },
  // Completed exits
  {
    id: '5',
    licensePlate: 'XYZ789',
    category: 'car',
    entryTime: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    exitTime: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    duration: 120,
    amount: 11.0,
    isPaid: true,
    paymentMethod: 'cash',
    cashierId: '1',
    hasError: false,
  },
  {
    id: '6',
    licensePlate: 'KL012MN',
    category: 'motorcycle',
    entryTime: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    exitTime: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    duration: 120,
    amount: 7.0,
    isPaid: true,
    paymentMethod: 'card',
    cashierId: '2',
    hasError: false,
  },
  {
    id: '7',
    licensePlate: 'PQ345RS',
    category: 'truck',
    entryTime: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    exitTime: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    duration: 120,
    amount: 18.0,
    isPaid: true,
    paymentMethod: 'card',
    cashierId: '1',
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
  {
    id: '4',
    timestamp: new Date(Date.now() - 120 * 60 * 1000).toISOString(),
    type: 'payment',
    message: 'Vehículo XYZ789 salió - $11.00 pagado en efectivo',
    userId: '1',
    vehicleId: '5',
  },
  {
    id: '5',
    timestamp: new Date(Date.now() - 240 * 60 * 1000).toISOString(),
    type: 'payment',
    message: 'Vehículo KL012MN salió - $7.00 pagado con tarjeta',
    userId: '2',
    vehicleId: '6',
  },
  {
    id: '6',
    timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    type: 'payment',
    message: 'Vehículo PQ345RS salió - $18.00 pagado con tarjeta',
    userId: '1',
    vehicleId: '7',
  },
  {
    id: '7',
    timestamp: new Date(Date.now() - 180 * 60 * 1000).toISOString(),
    type: 'error',
    message: 'Fallo de conexión con cámara LPR - reconectando...',
    userId: '2',
  },
  {
    id: '8',
    timestamp: new Date(Date.now() - 200 * 60 * 1000).toISOString(),
    type: 'system',
    message: 'Sistema iniciado correctamente',
    userId: '2',
  },
];

export const MOCK_SUBSCRIBERS: Subscriber[] = [
  {
    id: '1',
    name: 'Roberto Silva',
    email: 'roberto.silva@email.com',
    phone: '+56 9 8765 4321',
    licensePlate: 'GH789IJ',
    additionalPlates: ['TU901VW'],
    type: 'monthly',
    status: 'active',
    expiryDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: '2024-01-01T08:00:00Z',
    notes: 'Cliente premium, pago puntual',
  },
  {
    id: '2',
    name: 'Lucia Fernández',
    email: 'lucia.f@empresa.com',
    phone: '+56 9 7654 3210',
    licensePlate: 'JK234LM',
    type: 'monthly',
    status: 'active',
    expiryDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: '2024-02-15T08:00:00Z',
  },
  {
    id: '3',
    name: 'Empresa ABC S.A.',
    email: 'admin@empresaabc.com',
    phone: '+56 2 2345 6789',
    licensePlate: 'NO567PQ',
    additionalPlates: ['RS890TU', 'VW123XY'],
    type: 'discounted',
    status: 'active',
    discount: 50,
    createdAt: '2024-01-20T08:00:00Z',
    notes: 'Convenio corporativo 50% descuento',
  },
  {
    id: '4',
    name: 'Miguel Torres',
    email: 'miguel.t@hotmail.com',
    phone: '+56 9 6543 2109',
    licensePlate: 'ZA456BC',
    type: 'monthly',
    status: 'inactive',
    expiryDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: '2023-12-01T08:00:00Z',
    notes: 'Abono vencido, no renovó',
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

// Plate validation
export const validatePlate = (plate: string): boolean => {
  const cleaned = plate.toUpperCase().trim();
  const format1 = /^[A-Z]{3}\d{3}$/.test(cleaned); // ABC123
  const format2 = /^[A-Z]{2}\d{3}[A-Z]{2}$/.test(cleaned); // AB123CD
  return format1 || format2;
};

export const calculateParkingFee = (
  category: string,
  durationMinutes: number,
  rules?: PricingRule[]
): number => {
  const ruleset = rules || PRICING_RULES;
  const rule = ruleset.find((r) => r.category === category);
  if (!rule) return 0;

  // Apply tolerance (grace period)
  const billableMinutes = Math.max(0, durationMinutes - rule.tolerance);
  if (billableMinutes === 0) return 0;

  // Calculate based on fraction
  const fractions = Math.ceil(billableMinutes / rule.fraction);
  const totalFractions = fractions;

  // First fraction at base price, additional at hourly rate
  let total: number;
  if (totalFractions <= 1) {
    total = rule.basePrice;
  } else {
    const additionalFractions = totalFractions - 1;
    total = rule.basePrice + additionalFractions * (rule.hourlyRate * rule.fraction / 60);
  }

  return Math.min(total, rule.dailyMax);
};

export const formatDuration = (minutes: number): string => {
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}min`;
};

export const translateCategory = (category: string): string => {
  const translations: { [key: string]: string } = {
    car: 'Automóvil',
    motorcycle: 'Motocicleta',
    van: 'Camioneta/SUV',
    truck: 'Camión',
  };
  return translations[category] || category;
};

export const getCategoryIcon = (category: string): string => {
  const icons: { [key: string]: string } = {
    car: '🚗',
    motorcycle: '🏍️',
    van: '🚙',
    truck: '🚚',
  };
  return icons[category] || '🚗';
};
