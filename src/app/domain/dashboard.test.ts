import { describe, expect, it } from 'vitest';
import { calculateDashboardStats } from './dashboard';
import { TicketOperation, VehicleEntry } from '../types';

const now = new Date('2026-05-13T15:00:00.000Z');

const vehicles: VehicleEntry[] = [
  {
    id: '1',
    licensePlate: 'ABC123',
    category: 'auto',
    entryTime: '2026-05-13T10:00:00.000Z',
    isPaid: false,
    cashierId: '1',
    hasError: false,
    status: 'entered',
  },
  {
    id: '2',
    licensePlate: 'XYZ789',
    category: 'auto',
    entryTime: '2026-05-13T08:00:00.000Z',
    paidAt: '2026-05-13T10:00:00.000Z',
    exitTime: '2026-05-13T10:02:00.000Z',
    duration: 120,
    amount: 8000,
    isPaid: true,
    paymentMethod: 'cash',
    cashierId: '1',
    hasError: false,
    status: 'exited',
  },
  {
    id: '3',
    licensePlate: 'KL012MN',
    category: 'moto',
    entryTime: '2026-05-13T07:00:00.000Z',
    paidAt: '2026-05-13T09:00:00.000Z',
    exitTime: '2026-05-13T09:02:00.000Z',
    duration: 120,
    amount: 4800,
    isPaid: true,
    paymentMethod: 'card',
    cashierId: '2',
    hasError: false,
    status: 'exited',
  },
];

const subscriptionTickets: TicketOperation[] = [
  {
    id: 'abono-hoy',
    ticketNumber: 'ABN-20260513-000001',
    operationType: 'subscription_renewal',
    vehicleId: 'subscriber-1',
    licensePlate: 'AB123CD',
    entryTime: '2026-05-13T11:00:00.000Z',
    paidAt: '2026-05-13T11:00:00.000Z',
    duration: 0,
    amount: 150000,
    paymentMethod: 'cash',
    subscriberId: '1',
    subscriberName: 'Abonado',
    validFrom: '2026-05-13T11:00:00.000Z',
    validUntil: '2026-06-13T11:00:00.000Z',
    isFiscal: false,
    cashierId: '1',
    createdAt: '2026-05-13T11:00:00.000Z',
  },
  {
    id: 'abono-ayer',
    ticketNumber: 'ABN-20260512-000001',
    operationType: 'subscription_renewal',
    vehicleId: 'subscriber-2',
    licensePlate: 'CD456EF',
    entryTime: '2026-05-12T11:00:00.000Z',
    paidAt: '2026-05-12T11:00:00.000Z',
    duration: 0,
    amount: 150000,
    paymentMethod: 'card',
    subscriberId: '2',
    subscriberName: 'Abonado anterior',
    validFrom: '2026-05-12T11:00:00.000Z',
    validUntil: '2026-06-12T11:00:00.000Z',
    isFiscal: false,
    cashierId: '1',
    createdAt: '2026-05-12T11:00:00.000Z',
  },
];

describe('calculateDashboardStats', () => {
  it('uses ARS demo amounts for same-day revenue', () => {
    const stats = calculateDashboardStats(vehicles, [], now);

    expect(stats.vehiclesInside).toBe(1);
    expect(stats.todayEntries).toBe(3);
    expect(stats.todayRevenue).toBe(12800);
    expect(stats.averageDuration).toBe(120);
  });

  it('includes same-day monthly subscription payments in daily revenue', () => {
    const stats = calculateDashboardStats(vehicles, subscriptionTickets, now);

    expect(stats.todayRevenue).toBe(162800);
  });
});
