import { PaymentMethod, TicketOperation, VehicleEntry } from '../types';

export const createTicketNumber = (vehicleId: string, createdAt: Date): string => {
  const day = createdAt.toISOString().slice(0, 10).replace(/-/g, '');
  const suffix = vehicleId.slice(-6).padStart(6, '0');
  return `TKT-${day}-${suffix}`;
};

export const createTicketOperation = (
  vehicle: VehicleEntry,
  paymentMethod: PaymentMethod,
  cashierId: string,
  createdAt: Date = new Date()
): TicketOperation => {
  const paidAt = vehicle.paidAt || createdAt.toISOString();
  const ticketNumber =
    vehicle.ticketNumber || createTicketNumber(vehicle.id, new Date(paidAt));

  return {
    id: `${ticketNumber}-${vehicle.id}`,
    ticketNumber,
    vehicleId: vehicle.id,
    licensePlate: vehicle.licensePlate,
    category: vehicle.category,
    entryTime: vehicle.entryTime,
    paidAt,
    exitTime: vehicle.exitTime,
    duration: vehicle.duration || 0,
    amount: vehicle.amount || 0,
    paymentMethod,
    cashierId,
    createdAt: createdAt.toISOString(),
  };
};
