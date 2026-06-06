import {
  PaymentBreakdownItem,
  PaymentMethod,
  Subscriber,
  TicketOperation,
  VehicleEntry,
} from '../types';
import { validatePaymentBreakdown } from './payments';

export const createTicketNumber = (vehicleId: string, createdAt: Date): string => {
  const day = createdAt.toISOString().slice(0, 10).replace(/-/g, '');
  const suffix = vehicleId.slice(-6).padStart(6, '0');
  return `TKT-${day}-${suffix}`;
};

export const createSubscriptionRenewalTicketNumber = (
  subscriberId: string,
  createdAt: Date
): string => {
  const day = createdAt.toISOString().slice(0, 10).replace(/-/g, '');
  const suffix = subscriberId.slice(-6).padStart(6, '0');
  return `ABN-${day}-${suffix}`;
};

export const createTicketOperation = (
  vehicle: VehicleEntry,
  paymentMethod: PaymentMethod,
  cashierId: string,
  createdAt: Date = new Date(),
  paymentBreakdown?: PaymentBreakdownItem[]
): TicketOperation => {
  const paidAt = vehicle.paidAt || createdAt.toISOString();
  const ticketNumber =
    vehicle.ticketNumber || createTicketNumber(vehicle.id, new Date(paidAt));

  if (paymentMethod === 'mixed') {
    validatePaymentBreakdown(vehicle.amount || 0, paymentBreakdown);
  }

  return {
    id: `${ticketNumber}-${vehicle.id}`,
    ticketNumber,
    operationType: 'parking_stay',
    vehicleId: vehicle.id,
    licensePlate: vehicle.licensePlate,
    category: vehicle.category,
    entryTime: vehicle.entryTime,
    paidAt,
    exitTime: vehicle.exitTime,
    duration: vehicle.duration || 0,
    amount: vehicle.amount || 0,
    paymentMethod,
    paymentBreakdown: paymentMethod === 'mixed' ? paymentBreakdown : undefined,
    isFiscal: false,
    cashierId,
    createdAt: createdAt.toISOString(),
  };
};

export interface CreateSubscriptionRenewalTicketInput {
  subscriber: Subscriber;
  amount: number;
  paymentMethod: PaymentMethod;
  cashierId: string;
  validFrom: string;
  validUntil: string;
  createdAt?: Date;
  paymentBreakdown?: PaymentBreakdownItem[];
}

export const createSubscriptionRenewalTicket = ({
  subscriber,
  amount,
  paymentMethod,
  cashierId,
  validFrom,
  validUntil,
  createdAt = new Date(),
  paymentBreakdown,
}: CreateSubscriptionRenewalTicketInput): TicketOperation => {
  if (paymentMethod === 'mixed') {
    validatePaymentBreakdown(amount, paymentBreakdown);
  }

  const ticketNumber = createSubscriptionRenewalTicketNumber(
    subscriber.id,
    createdAt
  );
  const paidAt = createdAt.toISOString();

  return {
    id: `${ticketNumber}-${subscriber.id}`,
    ticketNumber,
    operationType: 'subscription_renewal',
    vehicleId: `subscriber-${subscriber.id}`,
    licensePlate: subscriber.licensePlate,
    entryTime: validFrom,
    paidAt,
    duration: 0,
    amount,
    paymentMethod,
    paymentBreakdown: paymentMethod === 'mixed' ? paymentBreakdown : undefined,
    subscriberId: subscriber.id,
    subscriberName: subscriber.name,
    validFrom,
    validUntil,
    isFiscal: false,
    cashierId,
    createdAt: paidAt,
  };
};
