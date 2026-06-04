import { User, VehicleEntry, PricingRule, SystemLog, Subscriber } from '../types';

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
  {
    id: '4',
    email: 'cajero3@parking.com',
    name: 'Ana Martínez',
    role: 'cashier',
    createdAt: '2024-03-10T08:00:00Z',
    isActive: false,
  },
];

// ARS pricing — basePrice = first full hour, fractionRate = each 10-min block,
// maxFractions = 5 max before a new full hour is charged
export const PRICING_RULES: PricingRule[] = [
  {
    id: '1',
    category: 'car',
    name: 'Automóvil / Camioneta',
    basePrice: 5000,
    fractionRate: 500,
    fraction: 10,
    maxFractions: 5,
  },
  {
    id: '2',
    category: 'motorcycle',
    name: 'Motocicleta',
    basePrice: 3000,
    fractionRate: 300,
    fraction: 10,
    maxFractions: 5,
  },
  {
    id: '3',
    category: 'van',
    name: 'Camioneta/SUV',
    basePrice: 5000,
    fractionRate: 500,
    fraction: 10,
    maxFractions: 5,
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
    amount: 11500, // 2h = base(5000) + 5fracs(2500) + base(5000) - 11000? or base+fracs+base = 5000+2500+5000 = ...
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
    amount: 6500,
    isPaid: true,
    paymentMethod: 'card',
    cashierId: '2',
    hasError: false,
  },
  {
    id: '7',
    licensePlate: 'PQ345RS',
    category: 'van',
    entryTime: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    exitTime: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    duration: 120,
    amount: 12500,
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
    message: 'Vehículo XYZ789 salió - ARS $11.500 pagado en efectivo',
    userId: '1',
    vehicleId: '5',
  },
  {
    id: '5',
    timestamp: new Date(Date.now() - 240 * 60 * 1000).toISOString(),
    type: 'payment',
    message: 'Vehículo KL012MN salió - ARS $6.500 pagado con tarjeta',
    userId: '2',
    vehicleId: '6',
  },
  {
    id: '6',
    timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    type: 'payment',
    message: 'Vehículo PQ345RS salió - ARS $12.500 pagado con tarjeta',
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
    status: 'active',
    expiryDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: '2023-12-01T08:00:00Z',
    notes: 'Abono vencido, no renovó',
  },
];

// Simulated license plates for LPR fallback
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

// Plate validation — Argentine formats: ABC123 or AB123CD
export const validatePlate = (plate: string): boolean => {
  const cleaned = plate.toUpperCase().trim();
  const format1 = /^[A-Z]{3}\d{3}$/.test(cleaned);
  const format2 = /^[A-Z]{2}\d{3}[A-Z]{2}$/.test(cleaned);
  return format1 || format2;
};

/**
 * Calculates parking fee (ARS).
 * Rule: basePrice covers the first hour.
 * Each additional 10 min = fractionRate.
 * Max maxFractions (5) fractions per period; when exceeded, a new full-hour base charge applies.
 *
 * Example (car): 0-60 min = $5.000 | 61-110 min += $500 each | 111+ min = new $5.000 base
 */
export const calculateParkingFee = (
  category: string,
  durationMinutes: number,
  rules?: PricingRule[]
): number => {
  const ruleset = rules || PRICING_RULES;
  const rule = ruleset.find((r) => r.category === category);
  if (!rule) return 0;

  if (durationMinutes <= 0) return 0;

  const FRAC_MIN = rule.fraction;          // 10
  const MAX_FRAC = rule.maxFractions;      // 5
  const PERIOD_MAX = 60 + MAX_FRAC * FRAC_MIN; // 110 min

  let total = 0;
  let remaining = durationMinutes;

  while (remaining > 0) {
    if (remaining <= 60) {
      total += rule.basePrice;
      remaining = 0;
    } else if (remaining <= PERIOD_MAX) {
      total += rule.basePrice;
      const extraFractions = Math.ceil((remaining - 60) / FRAC_MIN);
      total += extraFractions * rule.fractionRate;
      remaining = 0;
    } else {
      // Full period consumed (60 min base + MAX_FRAC fractions)
      total += rule.basePrice + MAX_FRAC * rule.fractionRate;
      remaining -= PERIOD_MAX;
    }
  }

  return total;
};

export const formatCurrency = (amount: number): string =>
  'ARS ' + new Intl.NumberFormat('es-AR', { minimumFractionDigits: 0 }).format(amount);

export const formatDuration = (minutes: number): string => {
  if (minutes < 60) return `${minutes} min`;
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
  };
  return translations[category] || category;
};

export const getCategoryIcon = (category: string): string => {
  const icons: { [key: string]: string } = {
    car: '🚗',
    motorcycle: '🏍️',
    van: '🚙',
  };
  return icons[category] || '🚗';
};

/** Returns effective subscription status accounting for actual expiry date */
export const getEffectiveSubscriberStatus = (sub: {
  type: string;
  status: string;
  expiryDate?: string;
}): 'active' | 'expired' | 'inactive' => {
  if (sub.status === 'inactive') return 'inactive';
  if (sub.type === 'monthly' && sub.expiryDate) {
    return new Date(sub.expiryDate) < new Date() ? 'expired' : 'active';
  }
  return 'active';
};
