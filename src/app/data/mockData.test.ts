import { describe, expect, it } from 'vitest';
import {
  MOCK_LOGS,
  MOCK_SUBSCRIBERS,
  MOCK_TICKETS,
  MOCK_VEHICLES,
  MOCK_WHITE_RUN_INCIDENTS,
} from './mockData';
import { validatePlate } from '../domain/plates';
import { getSubscriberValidity } from '../domain/subscribers';
import { DEMO_STORAGE_VERSION } from '../services/storage';

const RESERVED_LPR_PLATES = ['ODM957', 'AB123CD', 'NVZ087', 'KNJ605', 'AE622RW'];
const PREVIOUS_DEMO_STORAGE_VERSION = 'p2.3-fresh-demo-vehicles-v1';

describe('mock demo data consistency', () => {
  it('has enough seeded vehicles and subscribers for a complete demo', () => {
    expect(MOCK_VEHICLES.length).toBeGreaterThanOrEqual(20);
    expect(MOCK_SUBSCRIBERS.length).toBeGreaterThanOrEqual(15);
    expect(MOCK_LOGS.length).toBeGreaterThanOrEqual(20);
    expect(MOCK_WHITE_RUN_INCIDENTS.length).toBeGreaterThanOrEqual(4);
  });

  it('does not use reserved LPR demo plates in versioned mock data', () => {
    const vehiclePlates = MOCK_VEHICLES.map((vehicle) => vehicle.licensePlate);
    const subscriberPlates = MOCK_SUBSCRIBERS.flatMap((subscriber) => [
      subscriber.licensePlate,
      ...(subscriber.additionalPlates || []),
    ]);
    const ticketPlates = MOCK_TICKETS.map((ticket) => ticket.licensePlate);
    const incidentPlates = MOCK_WHITE_RUN_INCIDENTS.flatMap((incident) =>
      incident.licensePlate ? [incident.licensePlate] : []
    );
    const logMessages = MOCK_LOGS.map((log) => log.message.toUpperCase());

    for (const reservedPlate of RESERVED_LPR_PLATES) {
      expect(vehiclePlates).not.toContain(reservedPlate);
      expect(subscriberPlates).not.toContain(reservedPlate);
      expect(ticketPlates).not.toContain(reservedPlate);
      expect(incidentPlates).not.toContain(reservedPlate);
      expect(logMessages.some((message) => message.includes(reservedPlate))).toBe(false);
    }
  });

  it('keeps vehicle and subscriber plates in supported Argentine formats', () => {
    const plates = [
      ...MOCK_VEHICLES.map((vehicle) => vehicle.licensePlate),
      ...MOCK_SUBSCRIBERS.flatMap((subscriber) => [
        subscriber.licensePlate,
        ...(subscriber.additionalPlates || []),
      ]),
    ];

    expect(plates.every(validatePlate)).toBe(true);
  });

  it('does not duplicate active vehicle plates or active valid subscriber plates', () => {
    const activeVehiclePlates = MOCK_VEHICLES.filter((vehicle) =>
      ['entered', 'payment_pending', 'paid', 'subscriber_active'].includes(vehicle.status)
    ).map((vehicle) => vehicle.licensePlate);
    const activeValidSubscriberPlates = MOCK_SUBSCRIBERS.filter(
      (subscriber) => getSubscriberValidity(subscriber) === 'active'
    ).map((subscriber) => subscriber.licensePlate);

    expect(new Set(activeVehiclePlates).size).toBe(activeVehiclePlates.length);
    expect(new Set(activeValidSubscriberPlates).size).toBe(activeValidSubscriberPlates.length);
  });

  it('keeps current non-subscriber stays below six hours', () => {
    const now = Date.now();
    const currentNonSubscriberVehicles = MOCK_VEHICLES.filter(
      (vehicle) =>
        !vehicle.isSubscriber &&
        ['entered', 'payment_pending', 'paid'].includes(vehicle.status)
    );

    expect(currentNonSubscriberVehicles.length).toBeGreaterThan(0);
    for (const vehicle of currentNonSubscriberVehicles) {
      const ageMinutes = (now - Date.parse(vehicle.entryTime)) / (60 * 1000);
      expect(ageMinutes).toBeGreaterThanOrEqual(0);
      expect(ageMinutes).toBeLessThanOrEqual(6 * 60);
    }
  });

  it('keeps paid and exited vehicle records coherent', () => {
    const exitedVehicles = MOCK_VEHICLES.filter((vehicle) => vehicle.status === 'exited');
    const paidVehicles = MOCK_VEHICLES.filter((vehicle) => vehicle.status === 'paid');

    expect(exitedVehicles.length).toBeGreaterThanOrEqual(4);
    expect(paidVehicles.length).toBeGreaterThanOrEqual(3);

    for (const vehicle of exitedVehicles) {
      expect(vehicle.isPaid).toBe(true);
      expect(vehicle.paidAt).toBeTruthy();
      expect(vehicle.exitTime).toBeTruthy();
      expect(vehicle.duration).toBeGreaterThan(0);
      expect(vehicle.amount).toBeGreaterThan(0);
      expect(vehicle.paymentMethod).toBeTruthy();
      expect(vehicle.ticketNumber).toMatch(/^TKT-/);
    }
  });

  it('covers active, expiring, expired, inactive, and discounted subscribers', () => {
    const now = Date.now();
    const monthlySubscribers = MOCK_SUBSCRIBERS.filter((subscriber) => subscriber.type === 'monthly');
    const activeSubscribers = MOCK_SUBSCRIBERS.filter(
      (subscriber) => getSubscriberValidity(subscriber) === 'active'
    );
    const expiringSubscribers = MOCK_SUBSCRIBERS.filter((subscriber) => {
      if (!subscriber.expiryDate || subscriber.status !== 'active') return false;
      const daysUntilExpiry = (Date.parse(subscriber.expiryDate) - now) / (24 * 60 * 60 * 1000);
      return daysUntilExpiry >= 1 && daysUntilExpiry <= 5;
    });
    const expiredSubscribers = MOCK_SUBSCRIBERS.filter(
      (subscriber) => getSubscriberValidity(subscriber) === 'expired'
    );
    const inactiveSubscribers = MOCK_SUBSCRIBERS.filter(
      (subscriber) => getSubscriberValidity(subscriber) === 'inactive'
    );
    const discountedSubscribers = MOCK_SUBSCRIBERS.filter(
      (subscriber) => subscriber.type === 'discounted' && Number.isFinite(subscriber.discount)
    );

    expect(monthlySubscribers.every((subscriber) => Boolean(subscriber.expiryDate))).toBe(true);
    expect(activeSubscribers.length).toBeGreaterThan(0);
    expect(expiringSubscribers.length).toBeGreaterThan(0);
    expect(expiredSubscribers.length).toBeGreaterThan(0);
    expect(inactiveSubscribers.length).toBeGreaterThan(0);
    expect(discountedSubscribers.length).toBeGreaterThan(0);
  });

  it('seeds internal tickets, mixed payments, and white run incidents', () => {
    expect(MOCK_TICKETS.length).toBeGreaterThanOrEqual(7);
    expect(MOCK_TICKETS.every((ticket) => ticket.ticketNumber.startsWith('TKT-'))).toBe(true);
    expect(MOCK_TICKETS.every((ticket) => ticket.isFiscal === false)).toBe(true);
    expect(MOCK_TICKETS.some((ticket) => ticket.paymentMethod === 'mixed')).toBe(true);

    expect(MOCK_WHITE_RUN_INCIDENTS.some((incident) => incident.status === 'open')).toBe(true);
    expect(MOCK_WHITE_RUN_INCIDENTS.some((incident) => incident.status === 'resolved')).toBe(true);
    expect(MOCK_WHITE_RUN_INCIDENTS.some((incident) => (incident.difference || 0) > 0)).toBe(true);
    expect(MOCK_WHITE_RUN_INCIDENTS.some((incident) => (incident.difference || 0) < 0)).toBe(true);
  });

  it('bumps demo storage version for browsers with previous localStorage data', () => {
    expect(DEMO_STORAGE_VERSION).toBe('p2.5-expanded-demo-data-v1');
    expect(DEMO_STORAGE_VERSION).not.toBe(PREVIOUS_DEMO_STORAGE_VERSION);
  });
});
