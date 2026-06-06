import { Subscriber, SubscriberValidity } from '../types';
import { normalizePlate } from './plates';

export const MONTHLY_SUBSCRIPTION_AMOUNT_ARS = 150000;
export const MONTHLY_RENEWAL_MONTHS = 1;
export const MONTHLY_RENEWAL_WINDOW_DAYS = 5;

export interface SubscriberPlateConflict {
  plate: string;
  subscriber: Subscriber;
}

export const getSubscriberByPlate = (
  subscribers: Subscriber[],
  plate: string
): Subscriber | undefined => {
  const upperPlate = normalizePlate(plate);
  return subscribers.find(
    (subscriber) =>
      normalizePlate(subscriber.licensePlate) === upperPlate ||
      (subscriber.additionalPlates || []).some(
        (additionalPlate) => normalizePlate(additionalPlate) === upperPlate
      )
  );
};

export const getSubscriberValidity = (
  subscriber: Subscriber | undefined,
  now: Date = new Date()
): SubscriberValidity | undefined => {
  if (!subscriber) return undefined;
  if (subscriber.status === 'inactive') return 'inactive';
  if (
    subscriber.type === 'monthly' &&
    subscriber.expiryDate &&
    new Date(subscriber.expiryDate).getTime() < now.getTime()
  ) {
    return 'expired';
  }
  return 'active';
};

export const getEffectiveSubscriberStatus = getSubscriberValidity;

export const isActiveMonthlySubscriber = (
  subscriber: Subscriber | undefined,
  now: Date = new Date()
): boolean =>
  subscriber?.type === 'monthly' &&
  getSubscriberValidity(subscriber, now) === 'active';

export const isSubscriberChargeExempt = (
  subscriber: Subscriber | undefined,
  now: Date = new Date()
): boolean => isActiveMonthlySubscriber(subscriber, now);

export const shouldChargeAsRegularVehicle = (
  subscriber: Subscriber | undefined,
  now: Date = new Date()
): boolean => !isSubscriberChargeExempt(subscriber, now);

export const calculateSubscriberParkingAmount = (
  baseAmount: number,
  subscriber: Subscriber | undefined,
  now: Date = new Date()
): number => {
  const validity = getSubscriberValidity(subscriber, now);
  if (subscriber?.type === 'monthly' && validity === 'active') return 0;
  if (
    subscriber?.type === 'discounted' &&
    validity === 'active' &&
    typeof subscriber.discount === 'number'
  ) {
    return Number((baseAmount * (1 - subscriber.discount / 100)).toFixed(2));
  }
  return baseAmount;
};

export interface MonthlySubscriptionRenewal {
  subscriber: Subscriber;
  validFrom: string;
  validUntil: string;
  amount: number;
}

export const renewMonthlySubscriber = (
  subscriber: Subscriber,
  now: Date = new Date(),
  amount: number = subscriber.amount || MONTHLY_SUBSCRIPTION_AMOUNT_ARS
): MonthlySubscriptionRenewal => {
  if (subscriber.type !== 'monthly') {
    throw new Error('Solo se pueden renovar abonados mensuales');
  }

  const currentExpiry =
    subscriber.expiryDate && !Number.isNaN(new Date(subscriber.expiryDate).getTime())
      ? new Date(subscriber.expiryDate)
      : undefined;
  const validity = getSubscriberValidity(subscriber, now);
  const startsAt =
    validity === 'active' && currentExpiry && currentExpiry.getTime() > now.getTime()
      ? currentExpiry
      : now;
  const validUntil = new Date(startsAt);
  validUntil.setMonth(validUntil.getMonth() + MONTHLY_RENEWAL_MONTHS);

  return {
    subscriber: {
      ...subscriber,
      status: 'active',
      expiryDate: validUntil.toISOString(),
      amount,
    },
    validFrom: startsAt.toISOString(),
    validUntil: validUntil.toISOString(),
    amount,
  };
};

export const getDaysUntilMonthlyExpiry = (
  subscriber: Subscriber,
  now: Date = new Date()
): number | null => {
  if (subscriber.type !== 'monthly' || !subscriber.expiryDate) return null;
  const expiryTime = new Date(subscriber.expiryDate).getTime();
  if (Number.isNaN(expiryTime)) return null;
  return Math.ceil((expiryTime - now.getTime()) / (1000 * 60 * 60 * 24));
};

export const canRenewMonthlySubscriber = (
  subscriber: Subscriber,
  now: Date = new Date()
): boolean => {
  if (subscriber.type !== 'monthly') return false;
  if (subscriber.status === 'inactive') return true;
  const days = getDaysUntilMonthlyExpiry(subscriber, now);
  return days === null || days <= MONTHLY_RENEWAL_WINDOW_DAYS;
};

const getSubscriberPlates = (subscriber: Subscriber): string[] => [
  subscriber.licensePlate,
  ...(subscriber.additionalPlates || []),
];

export const findActiveSubscriberPlateConflict = (
  subscribers: Subscriber[],
  candidate: Subscriber,
  now: Date = new Date()
): SubscriberPlateConflict | null => {
  if (getSubscriberValidity(candidate, now) !== 'active') return null;

  const candidatePlates = new Set(
    getSubscriberPlates(candidate).map(normalizePlate).filter(Boolean)
  );

  for (const subscriber of subscribers) {
    if (subscriber.id === candidate.id) continue;
    if (getSubscriberValidity(subscriber, now) !== 'active') continue;

    const matchingPlate = getSubscriberPlates(subscriber)
      .map(normalizePlate)
      .find((plate) => candidatePlates.has(plate));

    if (matchingPlate) {
      return { plate: matchingPlate, subscriber };
    }
  }

  return null;
};

export const hasActiveSubscriberPlateConflict = (
  subscribers: Subscriber[],
  candidate: Subscriber,
  now: Date = new Date()
): boolean => findActiveSubscriberPlateConflict(subscribers, candidate, now) !== null;
