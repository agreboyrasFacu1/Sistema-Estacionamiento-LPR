import { describe, expect, it } from 'vitest';
import {
  calculateSubscriberParkingAmount,
  findActiveSubscriberPlateConflict,
  getEffectiveSubscriberStatus,
  getSubscriberByPlate,
  getSubscriberValidity,
  hasActiveSubscriberPlateConflict,
  isActiveMonthlySubscriber,
  isSubscriberChargeExempt,
  renewMonthlySubscriber,
  shouldChargeAsRegularVehicle,
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
    expect(getEffectiveSubscriberStatus(subscribers[0], now)).toBe('active');
    expect(getSubscriberValidity(subscribers[1], now)).toBe('expired');
    expect(isActiveMonthlySubscriber(subscribers[0], now)).toBe(true);
    expect(isActiveMonthlySubscriber(subscribers[1], now)).toBe(false);
  });

  it('exempts only active monthly subscribers from regular stay charges', () => {
    const now = new Date('2026-05-12T00:00:00.000Z');
    const inactiveMonthly: Subscriber = {
      ...subscribers[0],
      id: 'inactive',
      status: 'inactive',
    };

    expect(isSubscriberChargeExempt(subscribers[0], now)).toBe(true);
    expect(shouldChargeAsRegularVehicle(subscribers[0], now)).toBe(false);
    expect(isSubscriberChargeExempt(subscribers[1], now)).toBe(false);
    expect(shouldChargeAsRegularVehicle(subscribers[1], now)).toBe(true);
    expect(isSubscriberChargeExempt(inactiveMonthly, now)).toBe(false);
    expect(shouldChargeAsRegularVehicle(inactiveMonthly, now)).toBe(true);
    expect(isSubscriberChargeExempt(undefined, now)).toBe(false);
  });

  it('calculates parking amount according to effective subscriber benefits', () => {
    const now = new Date('2026-05-12T00:00:00.000Z');
    const discountedActive: Subscriber = {
      id: 'discount-active',
      name: 'Bonificado',
      email: 'bonificado@example.com',
      phone: '',
      licensePlate: 'BO123NO',
      type: 'discounted',
      status: 'active',
      discount: 40,
      createdAt: '2026-01-01T00:00:00.000Z',
    };
    const discountedInactive: Subscriber = {
      ...discountedActive,
      id: 'discount-inactive',
      status: 'inactive',
    };

    expect(calculateSubscriberParkingAmount(5000, subscribers[0], now)).toBe(0);
    expect(calculateSubscriberParkingAmount(5000, subscribers[1], now)).toBe(5000);
    expect(calculateSubscriberParkingAmount(5000, discountedActive, now)).toBe(3000);
    expect(calculateSubscriberParkingAmount(5000, discountedInactive, now)).toBe(5000);
    expect(calculateSubscriberParkingAmount(5000, undefined, now)).toBe(5000);
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

  it('renews expired or inactive monthly subscribers from now', () => {
    const now = new Date('2026-05-12T10:00:00.000Z');
    const inactive: Subscriber = {
      ...subscribers[0],
      id: 'inactive-monthly',
      status: 'inactive',
    };

    const expiredRenewal = renewMonthlySubscriber(subscribers[1], now);
    const inactiveRenewal = renewMonthlySubscriber(inactive, now);

    expect(expiredRenewal.validFrom).toBe(now.toISOString());
    expect(expiredRenewal.subscriber.status).toBe('active');
    expect(expiredRenewal.amount).toBe(150000);
    expect(expiredRenewal.subscriber.expiryDate).toBe('2026-06-12T10:00:00.000Z');
    expect(inactiveRenewal.validFrom).toBe(now.toISOString());
    expect(inactiveRenewal.subscriber.expiryDate).toBe('2026-06-12T10:00:00.000Z');
  });

  it('renews active future monthly subscribers from their current expiry', () => {
    const now = new Date('2026-05-12T10:00:00.000Z');
    const renewal = renewMonthlySubscriber(subscribers[0], now);

    expect(renewal.validFrom).toBe('2026-12-31T00:00:00.000Z');
    expect(renewal.validUntil).toBe('2027-01-31T00:00:00.000Z');
    expect(renewal.subscriber.expiryDate).toBe('2027-01-31T00:00:00.000Z');
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
