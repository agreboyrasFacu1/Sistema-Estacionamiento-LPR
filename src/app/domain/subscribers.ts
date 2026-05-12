import { Subscriber, SubscriberValidity } from '../types';
import { normalizePlate } from './plates';

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

export const isActiveMonthlySubscriber = (
  subscriber: Subscriber | undefined,
  now: Date = new Date()
): boolean =>
  subscriber?.type === 'monthly' &&
  getSubscriberValidity(subscriber, now) === 'active';
