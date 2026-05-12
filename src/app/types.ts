// Core types for the Parking Access Control System.

export type UserRole = 'cashier' | 'admin';
export type PaymentMethod = 'cash' | 'card' | 'subscriber' | 'no_charge';
export type SubscriberType = 'monthly' | 'discounted';
export type SubscriberStatus = 'active' | 'inactive';
export type SubscriberValidity = 'active' | 'expired' | 'inactive';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: string;
  isActive: boolean;
}

export interface UserCredential {
  userId: string;
  password: string;
}

export type VehicleCategory = 'auto' | 'camioneta' | 'moto';

export type StayStatus =
  | 'entered'
  | 'payment_pending'
  | 'paid'
  | 'exited'
  | 'cancelled'
  | 'subscriber_active';

export interface VehicleEntry {
  id: string;
  licensePlate: string;
  category: VehicleCategory;
  entryTime: string;
  paidAt?: string;
  exitGraceUntil?: string;
  exitTime?: string;
  duration?: number; // in minutes
  amount?: number;
  isPaid: boolean;
  paymentMethod?: PaymentMethod;
  cashierId: string;
  hasError: boolean;
  errorMessage?: string;
  isSubscriber?: boolean;
  subscriberValidity?: SubscriberValidity;
  status: StayStatus;
  ticketNumber?: string;
  whiteRunManualAmount?: number;
  whiteRunDifference?: number;
}

export interface PricingRule {
  id: string;
  category: VehicleCategory;
  name: string;
  basePrice: number; // first hour
  hourlyRate: number; // rate used to calculate each 10-minute fraction after first hour
  dailyMax: number; // maximum daily charge
  fraction: number; // must remain 10 minutes for project scope
  baseMinutes: number; // must remain 60 minutes for project scope
}

export interface Subscriber {
  id: string;
  name: string;
  email: string;
  phone: string;
  licensePlate: string;
  additionalPlates?: string[];
  type: SubscriberType;
  status: SubscriberStatus;
  expiryDate?: string; // ISO date for monthly
  discount?: number; // percentage 0-100
  createdAt: string;
  notes?: string;
}

export type SystemLogType =
  | 'entry'
  | 'exit'
  | 'payment'
  | 'ticket'
  | 'error'
  | 'manual'
  | 'white_run'
  | 'system';

export interface SystemLog {
  id: string;
  timestamp: string;
  type: SystemLogType;
  message: string;
  userId: string;
  vehicleId?: string;
  metadata?: Record<string, string | number | boolean | null>;
}

export interface LPRDetection {
  plate: string;
  confidence: number;
  timestamp: string;
  isValid: boolean;
  source: 'simulated' | 'camera' | 'manual';
}

export interface LPRCorrection {
  id: string;
  detectedPlate: string;
  correctedPlate: string;
  confidence: number;
  timestamp: string;
  userId: string;
}

export interface TicketOperation {
  id: string;
  ticketNumber: string;
  vehicleId: string;
  licensePlate: string;
  category: VehicleCategory;
  entryTime: string;
  paidAt: string;
  exitTime?: string;
  duration: number;
  amount: number;
  paymentMethod: PaymentMethod;
  cashierId: string;
  createdAt: string;
}

export interface WhiteRunIncident {
  id: string;
  vehicleId?: string;
  licensePlate?: string;
  systemAmount?: number;
  manualAmount?: number;
  difference?: number;
  description: string;
  createdAt: string;
  userId: string;
  status: 'open' | 'resolved';
}

export interface DashboardStats {
  vehiclesInside: number;
  todayEntries: number;
  todayRevenue: number;
  averageDuration: number;
}
