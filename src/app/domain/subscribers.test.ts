import { describe, expect, it } from 'vitest';
import {
  getSubscriberByPlate,
  getSubscriberValidity,
  isActiveMonthlySubscriber,
} from './subscribers';
import { Subscriber } from '../types';

const subscribers: Subscriber[] = [
  {
    id: '1',
    name: 'Activo',
    email: 'activo@example.com',
    phone: '',
    licensePlate: 'ABC123',
    type: 'monthly',
    status: 'active',
    expiryDate: '2026-12-31T00:00:00.000Z',
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: '2',
    name: 'Vencido',
    email: 'vencido@example.com',
    phone: '',
    licensePlate: 'ZZ999ZZ',
    type: 'monthly',
    status: 'active',
    expiryDate: '2025-01-01T00:00:00.000Z',
    createdAt: '2024-01-01T00:00:00.000Z',
  },
];

describe('subscriber domain', () => {
  it('finds subscribers by normalized plate', () => {
    expect(getSubscriberByPlate(subscribers, 'abc123')?.id).toBe('1');
  });

  it('distinguishes active and expired monthly subscribers', () => {
    const now = new Date('2026-05-12T00:00:00.000Z');
    expect(getSubscriberValidity(subscribers[0], now)).toBe('active');
    expect(getSubscriberValidity(subscribers[1], now)).toBe('expired');
    expect(isActiveMonthlySubscriber(subscribers[0], now)).toBe(true);
    expect(isActiveMonthlySubscriber(subscribers[1], now)).toBe(false);
  });
});
