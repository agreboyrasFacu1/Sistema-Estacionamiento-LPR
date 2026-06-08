import { describe, expect, it } from 'vitest';
import { Subscriber, VehicleEntry } from '../types';
import {
  createSubscriptionRenewalTicket,
  createSubscriptionRenewalTicketNumber,
  createTicketNumber,
  createTicketOperation,
} from './tickets';

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

const subscriber: Subscriber = {
  id: 'sub-123',
  name: 'Cliente Mensual',
  email: 'mensual@example.com',
  phone: '',
  licensePlate: 'AB123CD',
  type: 'monthly',
  status: 'active',
  expiryDate: '2026-06-12T10:00:00.000Z',
  createdAt: '2026-01-01T00:00:00.000Z',
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
      operationType: 'parking_stay',
      vehicleId: 'veh-123',
      licensePlate: 'ABC123',
      amount: 5500,
      paymentMethod: 'cash',
      isFiscal: false,
      cashierId: 'cashier-1',
    });
  });

  it('records all operational payment methods in parking stay tickets', () => {
    for (const method of ['cash', 'card', 'subscriber', 'no_charge'] as const) {
      const ticket = createTicketOperation(
        { ...paidVehicle, paymentMethod: method },
        method,
        'cashier-1',
        new Date('2026-05-13T10:16:00.000Z')
      );

      expect(ticket.operationType).toBe('parking_stay');
      expect(ticket.ticketNumber).toMatch(/^TKT-/);
      expect(ticket.paymentMethod).toBe(method);
      expect(ticket.isFiscal).toBe(false);
    }
  });

  it('creates deterministic subscription renewal ticket numbers', () => {
    expect(
      createSubscriptionRenewalTicketNumber(
        'sub-123',
        new Date('2026-05-13T10:15:00.000Z')
      )
    ).toBe('ABN-20260513-ub-123');
  });

  it('creates a non-fiscal subscription renewal ticket', () => {
    const ticket = createSubscriptionRenewalTicket({
      subscriber,
      amount: 150000,
      paymentMethod: 'card',
      cashierId: 'cashier-1',
      validFrom: '2026-06-12T10:00:00.000Z',
      validUntil: '2026-07-12T10:00:00.000Z',
      createdAt: new Date('2026-05-13T10:15:00.000Z'),
    });

    expect(ticket).toMatchObject({
      id: 'ABN-20260513-ub-123-sub-123',
      ticketNumber: 'ABN-20260513-ub-123',
      operationType: 'subscription_renewal',
      vehicleId: 'subscriber-sub-123',
      subscriberId: 'sub-123',
      subscriberName: 'Cliente Mensual',
      licensePlate: 'AB123CD',
      amount: 150000,
      paymentMethod: 'card',
      validFrom: '2026-06-12T10:00:00.000Z',
      validUntil: '2026-07-12T10:00:00.000Z',
      isFiscal: false,
      cashierId: 'cashier-1',
    });
  });

  it('persists mixed payment breakdowns in subscription renewal tickets', () => {
    const ticket = createSubscriptionRenewalTicket({
      subscriber,
      amount: 150000,
      paymentMethod: 'mixed',
      paymentBreakdown: [
        { method: 'cash', amount: 50000 },
        { method: 'card', amount: 100000 },
      ],
      cashierId: 'cashier-1',
      validFrom: '2026-06-12T10:00:00.000Z',
      validUntil: '2026-07-12T10:00:00.000Z',
      createdAt: new Date('2026-05-13T10:15:00.000Z'),
    });

    expect(ticket.paymentBreakdown).toEqual([
      { method: 'cash', amount: 50000 },
      { method: 'card', amount: 100000 },
    ]);
  });
});
