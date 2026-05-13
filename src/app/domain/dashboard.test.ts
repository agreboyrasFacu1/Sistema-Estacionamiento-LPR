import { describe, expect, it } from 'vitest';
import { calculateDashboardStats } from './dashboard';
import { VehicleEntry } from '../types';

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

describe('calculateDashboardStats', () => {
  it('uses ARS demo amounts for same-day revenue', () => {
    const stats = calculateDashboardStats(vehicles, now);

    expect(stats.vehiclesInside).toBe(1);
    expect(stats.todayEntries).toBe(3);
    expect(stats.todayRevenue).toBe(12800);
    expect(stats.averageDuration).toBe(120);
  });
});