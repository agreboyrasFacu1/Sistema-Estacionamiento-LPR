import { describe, expect, it } from 'vitest';
import { VehicleEntry } from '../types';
import { createTicketNumber, createTicketOperation } from './tickets';

const paidVehicle: VehicleEntry = {
  id: 'veh-123',
  licensePlate: 'ABC123',
  category: 'auto',
  entryTime: '2026-05-13T09:00:00.000Z',
  paidAt: '2026-05-13T10:15:00.000Z',
  duration: 75,
  amount: 5500,
  isPaid: true,
  paymentMethod: 'cash',
  cashierId: 'cashier-1',
  hasError: false,
  status: 'paid',
};

describe('tickets domain', () => {
  it('creates deterministic internal ticket numbers from date and vehicle id', () => {
    expect(createTicketNumber('veh-123', new Date('2026-05-13T10:15:00.000Z'))).toBe(
      'TKT-20260513-eh-123'
    );
  });

  it('creates a ticket operation from a paid vehicle', () => {
    const ticket = createTicketOperation(
      paidVehicle,
      'cash',
      'cashier-1',
      new Date('2026-05-13T10:16:00.000Z')
    );

    expect(ticket).toMatchObject({
      id: 'TKT-20260513-eh-123-veh-123',
      ticketNumber: 'TKT-20260513-eh-123',
      vehicleId: 'veh-123',
      licensePlate: 'ABC123',
      amount: 5500,
      paymentMethod: 'cash',
      cashierId: 'cashier-1',
    });
  });
});
