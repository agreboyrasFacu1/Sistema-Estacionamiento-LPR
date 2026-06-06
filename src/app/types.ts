// Core types for the Parking Access Control System.

export type UserRole = 'cashier' | 'admin';
export type PaymentMethod = 'cash' | 'card' | 'mixed' | 'subscriber' | 'no_charge';
export type PaymentBreakdownMethod = 'cash' | 'card';
export type SubscriberType = 'monthly' | 'discounted';
export type SubscriberStatus = 'active' | 'inactive';
export type SubscriberValidity = 'active' | 'expired' | 'inactive';

export interface PaymentBreakdownItem {
  method: PaymentBreakdownMethod;
  amount: number;
}

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
  paymentBreakdown?: PaymentBreakdownItem[];
  whiteRunManualAmount?: number;
  whiteRunDifference?: number;
}

export interface PricingRule {
  id: string;
  category: VehicleCategory;
  name: string;
  basePrice: number; // first hour
  hourlyRate: number; // equivalent hourly rate used to derive post-base fractions
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
  category?: VehicleCategory;
  type: SubscriberType;
  status: SubscriberStatus;
  expiryDate?: string; // ISO date for monthly
  discount?: number; // percentage 0-100
  amount?: number; // subscription cost in ARS
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
  source: 'simulated' | 'camera' | 'manual' | 'ip-camera' | 'alpr-api';
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
  operationType?: 'parking_stay' | 'subscription_renewal';
  vehicleId: string;
  licensePlate: string;
  category?: VehicleCategory;
  entryTime: string;
  paidAt: string;
  exitTime?: string;
  duration: number;
  amount: number;
  paymentMethod: PaymentMethod;
  paymentBreakdown?: PaymentBreakdownItem[];
  subscriberId?: string;
  subscriberName?: string;
  validFrom?: string;
  validUntil?: string;
  isFiscal?: false;
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
