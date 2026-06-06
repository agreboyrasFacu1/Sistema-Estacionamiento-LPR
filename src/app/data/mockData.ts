import {
  PricingRule,
  Subscriber,
  SystemLog,
  TicketOperation,
  User,
  UserCredential,
  VehicleEntry,
  WhiteRunIncident,
} from '../types';
import { calculateParkingFee, getCategoryIcon, translateCategory } from '../domain/pricing';
import { formatDuration } from '../domain/stays';
import { validatePlate } from '../domain/plates';
import { getSimulatedPlates } from '../domain/lpr';
import { createTicketOperation } from '../domain/tickets';

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

export const MOCK_CREDENTIALS: UserCredential[] = [
  { userId: '1', password: 'demo' },
  { userId: '2', password: 'demo' },
  { userId: '3', password: 'demo' },
  { userId: '4', password: 'demo' },
];

export const PRICING_RULES: PricingRule[] = [
  {
    id: '1',
    category: 'auto',
    name: 'Auto',
    basePrice: 5000,
    hourlyRate: 3000,
    dailyMax: 40000,
    fraction: 10,
    baseMinutes: 60,
  },
  {
    id: '2',
    category: 'moto',
    name: 'Moto',
    basePrice: 3000,
    hourlyRate: 1800,
    dailyMax: 24000,
    fraction: 10,
    baseMinutes: 60,
  },
  {
    id: '3',
    category: 'camioneta',
    name: 'Camioneta',
    basePrice: 5000,
    hourlyRate: 3000,
    dailyMax: 40000,
    fraction: 10,
    baseMinutes: 60,
  },
];

export interface SubscriberPricingRule {
  id: string;
  category: 'auto' | 'moto' | 'camioneta';
  name: string;
  monthlyPrice: number; // monthly subscription cost
  discountedBasePrice?: number; // optional discounted base price
}

export const SUBSCRIBER_PRICING_RULES: SubscriberPricingRule[] = [
  {
    id: '1',
    category: 'auto',
    name: 'Auto',
    monthlyPrice: 150000,
    discountedBasePrice: 5000,
  },
  {
    id: '2',
    category: 'moto',
    name: 'Moto',
    monthlyPrice: 100000,
    discountedBasePrice: 3000,
  },
  {
    id: '3',
    category: 'camioneta',
    name: 'Camioneta',
    monthlyPrice: 150000,
    discountedBasePrice: 5000,
  },
];

export const MOCK_VEHICLES: VehicleEntry[] = [
  {
    id: '1',
    licensePlate: 'ABC123',
    category: 'auto',
    entryTime: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    isPaid: false,
    cashierId: '1',
    hasError: false,
    status: 'entered',
  },
  {
    id: '2',
    licensePlate: 'AB123CD',
    category: 'moto',
    entryTime: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    isPaid: false,
    cashierId: '1',
    hasError: false,
    status: 'entered',
  },
  {
    id: '3',
    licensePlate: 'DEF456',
    category: 'auto',
    entryTime: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    isPaid: false,
    cashierId: '2',
    hasError: false,
    status: 'entered',
  },
  {
    id: '4',
    licensePlate: 'GH789IJ',
    category: 'camioneta',
    entryTime: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    isPaid: false,
    cashierId: '1',
    hasError: false,
    isSubscriber: true,
    subscriberValidity: 'active',
    status: 'subscriber_active',
  },
  {
    id: '5',
    licensePlate: 'XYZ789',
    category: 'auto',
    entryTime: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    paidAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    exitGraceUntil: new Date(Date.now() - 2 * 60 * 60 * 1000 + 3 * 60 * 1000).toISOString(),
    exitTime: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    duration: 120,
    amount: 8000,
    isPaid: true,
    paymentMethod: 'cash',
    cashierId: '1',
    hasError: false,
    status: 'exited',
    ticketNumber: 'TKT-DEMO-000005',
  },
  {
    id: '6',
    licensePlate: 'KL012MN',
    category: 'moto',
    entryTime: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    paidAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    exitGraceUntil: new Date(Date.now() - 4 * 60 * 60 * 1000 + 3 * 60 * 1000).toISOString(),
    exitTime: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    duration: 120,
    amount: 4800,
    isPaid: true,
    paymentMethod: 'card',
    cashierId: '2',
    hasError: false,
    status: 'exited',
    ticketNumber: 'TKT-DEMO-000006',
  },
];

export const MOCK_LOGS: SystemLog[] = [
  {
    id: '1',
    timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    type: 'entry',
    message: 'Vehiculo ABC123 ingreso al estacionamiento',
    userId: '1',
    vehicleId: '1',
  },
  {
    id: '2',
    timestamp: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
    type: 'entry',
    message: 'Vehiculo AB123CD ingreso al estacionamiento',
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
    message: 'Vehiculo XYZ789 pago ticket interno TKT-DEMO-000005',
    userId: '1',
    vehicleId: '5',
  },
  {
    id: '5',
    timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
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
    phone: '+54 9 11 8765 4321',
    licensePlate: 'GH789IJ',
    additionalPlates: ['TU901VW'],
    type: 'monthly',
    status: 'active',
    expiryDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
    amount: 150000,
    createdAt: '2024-01-01T08:00:00Z',
    notes: 'Cliente premium, pago puntual',
  },
  {
    id: '2',
    name: 'Lucia Fernandez',
    email: 'lucia.f@empresa.com',
    phone: '+54 9 11 7654 3210',
    licensePlate: 'JK234LM',
    type: 'monthly',
    status: 'active',
    expiryDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    amount: 150000,
    createdAt: '2024-02-15T08:00:00Z',
  },
  {
    id: '3',
    name: 'Empresa ABC S.A.',
    email: 'admin@empresaabc.com',
    phone: '+54 11 2345 6789',
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
    phone: '+54 9 11 6543 2109',
    licensePlate: 'ZA456BC',
    type: 'monthly',
    status: 'active',
    expiryDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    amount: 150000,
    createdAt: '2023-12-01T08:00:00Z',
    notes: 'Abono vencido, pendiente de renovacion',
  },
];

export const MOCK_TICKETS: TicketOperation[] = MOCK_VEHICLES.filter(
  (vehicle) => vehicle.ticketNumber && vehicle.isPaid && vehicle.paymentMethod
).map((vehicle) =>
  createTicketOperation(
    vehicle,
    vehicle.paymentMethod!,
    vehicle.cashierId,
    new Date(vehicle.paidAt || vehicle.exitTime || vehicle.entryTime)
  )
);
export const MOCK_WHITE_RUN_INCIDENTS: WhiteRunIncident[] = [];
export const SIMULATED_PLATES = getSimulatedPlates();

export {
  calculateParkingFee,
  formatDuration,
  getCategoryIcon,
  translateCategory,
  validatePlate,
};
