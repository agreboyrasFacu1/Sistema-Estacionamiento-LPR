import { describe, expect, it } from 'vitest';
import {
  findActiveSubscriberPlateConflict,
  getSubscriberByPlate,
  getSubscriberValidity,
  hasActiveSubscriberPlateConflict,
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

  it('detects active subscriber plate conflicts with normalized plates', () => {
    const now = new Date('2026-05-12T00:00:00.000Z');
    const candidate: Subscriber = {
      id: 'new',
      name: 'Duplicado',
      email: 'dup@example.com',
      phone: '',
      licensePlate: ' abc123 ',
      type: 'monthly',
      status: 'active',
      expiryDate: '2026-12-31T00:00:00.000Z',
      createdAt: '2026-05-01T00:00:00.000Z',
    };

    const conflict = findActiveSubscriberPlateConflict(subscribers, candidate, now);

    expect(conflict?.subscriber.id).toBe('1');
    expect(conflict?.plate).toBe('ABC123');
    expect(hasActiveSubscriberPlateConflict(subscribers, candidate, now)).toBe(true);
  });

  it('does not report a conflict when editing the same subscriber', () => {
    const now = new Date('2026-05-12T00:00:00.000Z');

    expect(
      findActiveSubscriberPlateConflict(subscribers, subscribers[0], now)
    ).toBeNull();
  });

  it('allows renewal when the previous subscriber is expired or inactive', () => {
    const now = new Date('2026-05-12T00:00:00.000Z');
    const inactive: Subscriber = {
      id: '3',
      name: 'Inactivo',
      email: 'inactivo@example.com',
      phone: '',
      licensePlate: 'IN123AC',
      type: 'monthly',
      status: 'inactive',
      expiryDate: '2026-12-31T00:00:00.000Z',
      createdAt: '2026-01-01T00:00:00.000Z',
    };
    const expiredRenewal: Subscriber = {
      ...subscribers[1],
      id: 'new-expired-renewal',
      expiryDate: '2026-12-31T00:00:00.000Z',
    };
    const inactiveRenewal: Subscriber = {
      ...inactive,
      id: 'new-inactive-renewal',
      status: 'active',
    };

    expect(
      findActiveSubscriberPlateConflict(subscribers, expiredRenewal, now)
    ).toBeNull();
    expect(
      findActiveSubscriberPlateConflict([...subscribers, inactive], inactiveRenewal, now)
    ).toBeNull();
  });

  it('detects conflicts against additional plates', () => {
    const now = new Date('2026-05-12T00:00:00.000Z');
    const withAdditional: Subscriber = {
      ...subscribers[0],
      additionalPlates: ['AB123CD'],
    };
    const candidate: Subscriber = {
      id: 'new',
      name: 'Adicional duplicada',
      email: 'adicional@example.com',
      phone: '',
      licensePlate: 'ZZ999ZZ',
      additionalPlates: ['ab123cd'],
      type: 'monthly',
      status: 'active',
      expiryDate: '2026-12-31T00:00:00.000Z',
      createdAt: '2026-05-01T00:00:00.000Z',
    };

    const conflict = findActiveSubscriberPlateConflict(
      [withAdditional],
      candidate,
      now
    );

    expect(conflict?.subscriber.id).toBe('1');
    expect(conflict?.plate).toBe('AB123CD');
  });
});
