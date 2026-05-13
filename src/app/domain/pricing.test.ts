import { describe, expect, it } from 'vitest';
import {
  BASE_BILLING_MINUTES,
  BILLING_FRACTION_MINUTES,
  calculateParkingFee,
} from './pricing';
import { PricingRule } from '../types';

const rules: PricingRule[] = [
  {
    id: 'auto',
    category: 'auto',
    name: 'Auto',
    basePrice: 600,
    hourlyRate: 300,
    dailyMax: 3000,
    fraction: BILLING_FRACTION_MINUTES,
    baseMinutes: BASE_BILLING_MINUTES,
  },
];

const arsRules: PricingRule[] = [
  {
    id: 'auto-ars',
    category: 'auto',
    name: 'Auto ARS',
    basePrice: 5000,
    hourlyRate: 3000,
    dailyMax: 40000,
    fraction: BILLING_FRACTION_MINUTES,
    baseMinutes: BASE_BILLING_MINUTES,
  },
  {
    id: 'camioneta-ars',
    category: 'camioneta',
    name: 'Camioneta ARS',
    basePrice: 5000,
    hourlyRate: 3000,
    dailyMax: 40000,
    fraction: BILLING_FRACTION_MINUTES,
    baseMinutes: BASE_BILLING_MINUTES,
  },
  {
    id: 'moto-ars',
    category: 'moto',
    name: 'Moto ARS',
    basePrice: 3000,
    hourlyRate: 1800,
    dailyMax: 24000,
    fraction: BILLING_FRACTION_MINUTES,
    baseMinutes: BASE_BILLING_MINUTES,
  },
];

describe('calculateParkingFee', () => {
  it('charges the base price for the first full hour', () => {
    expect(calculateParkingFee('auto', 1, rules)).toBe(600);
    expect(calculateParkingFee('auto', 60, rules)).toBe(600);
  });

  it('charges automated 10-minute fractions after the first hour', () => {
    expect(calculateParkingFee('auto', 61, rules)).toBe(650);
    expect(calculateParkingFee('auto', 70, rules)).toBe(650);
    expect(calculateParkingFee('auto', 71, rules)).toBe(700);
  });

  it('uses the canonical ARS amounts for auto and camioneta', () => {
    expect(calculateParkingFee('auto', 60, arsRules)).toBe(5000);
    expect(calculateParkingFee('auto', 120, arsRules)).toBe(8000);
    expect(calculateParkingFee('auto', 150, arsRules)).toBe(9500);

    expect(calculateParkingFee('camioneta', 60, arsRules)).toBe(5000);
    expect(calculateParkingFee('camioneta', 120, arsRules)).toBe(8000);
    expect(calculateParkingFee('camioneta', 150, arsRules)).toBe(9500);
  });

  it('uses the canonical ARS amounts for moto', () => {
    expect(calculateParkingFee('moto', 60, arsRules)).toBe(3000);
    expect(calculateParkingFee('moto', 120, arsRules)).toBe(4800);
    expect(calculateParkingFee('moto', 150, arsRules)).toBe(5700);
  });

  it('caps the amount at the daily maximum', () => {
    expect(calculateParkingFee('auto', 24 * 60, rules)).toBe(3000);
  });
});
