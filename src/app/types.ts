// Core types for the Parking Access Control System

export type UserRole = 'cashier' | 'admin';
export type PaymentMethod = 'cash' | 'card';
export type SubscriberType = 'monthly' | 'discounted';
export type SubscriberStatus = 'active' | 'inactive';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: string;
  isActive: boolean;
}

export type VehicleCategory = 'car' | 'motorcycle' | 'truck' | 'van';

export interface VehicleEntry {
  id: string;
  licensePlate: string;
  category: VehicleCategory;
  entryTime: string;
  exitTime?: string;
  duration?: number; // in minutes
  amount?: number;
  isPaid: boolean;
  cashierId: string;
  hasError: boolean;
  errorMessage?: string;
  paymentMethod?: PaymentMethod;
  isFreeExit?: boolean; // 5-minute no-charge rule
  isSubscriber?: boolean;
}

export interface PricingRule {
  id: string;
  category: VehicleCategory;
  name: string;
  basePrice: number; // first period
  hourlyRate: number; // after first period
  dailyMax: number; // maximum daily charge
  fraction: number; // billing fraction in minutes (e.g., 60 = per hour, 10 = per 10 min)
  tolerance: number; // grace period in minutes before charging
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

export interface SystemLog {
  id: string;
  timestamp: string;
  type: 'entry' | 'exit' | 'payment' | 'error' | 'manual' | 'system';
  message: string;
  userId: string;
  vehicleId?: string;
}

export interface LPRDetection {
  plate: string;
  confidence: number;
  timestamp: string;
  isValid: boolean;
}

export interface DashboardStats {
  vehiclesInside: number;
  todayEntries: number;
  todayRevenue: number;
  averageDuration: number;
}
