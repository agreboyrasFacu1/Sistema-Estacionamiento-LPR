import { Subscriber, SubscriberValidity } from '../types';
import { normalizePlate } from './plates';

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

export const isActiveMonthlySubscriber = (
  subscriber: Subscriber | undefined,
  now: Date = new Date()
): boolean =>
  subscriber?.type === 'monthly' &&
  getSubscriberValidity(subscriber, now) === 'active';

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
