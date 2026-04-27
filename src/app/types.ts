// Core types for the Parking Access Control System

export type UserRole = 'cashier' | 'admin';

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
}

export interface PricingRule {
  id: string;
  category: VehicleCategory;
  name: string;
  basePrice: number; // first hour
  hourlyRate: number; // after first hour
  dailyMax: number; // maximum daily charge
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
