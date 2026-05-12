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

  it('caps the amount at the daily maximum', () => {
    expect(calculateParkingFee('auto', 24 * 60, rules)).toBe(3000);
  });
});
