import { describe, expect, it } from 'vitest';
import {
  BASE_BILLING_MINUTES,
  BILLING_FRACTION_MINUTES,
  DEFAULT_FRACTION_PRICE_RATE,
  calculateParkingFee,
  normalizePricingRule,
} from './pricing';
import { PricingRule } from '../types';

const rules: PricingRule[] = [
  {
    id: 'auto',
    category: 'auto',
    name: 'Auto',
    basePrice: 600,
    fractionPrice: 90,
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
    fractionPrice: 750,
    fraction: BILLING_FRACTION_MINUTES,
    baseMinutes: BASE_BILLING_MINUTES,
  },
  {
    id: 'camioneta-ars',
    category: 'camioneta',
    name: 'Camioneta ARS',
    basePrice: 5000,
    fractionPrice: 750,
    fraction: BILLING_FRACTION_MINUTES,
    baseMinutes: BASE_BILLING_MINUTES,
  },
  {
    id: 'moto-ars',
    category: 'moto',
    name: 'Moto ARS',
    basePrice: 3000,
    fractionPrice: 450,
    fraction: BILLING_FRACTION_MINUTES,
    baseMinutes: BASE_BILLING_MINUTES,
  },
];

describe('calculateParkingFee', () => {
  it('charges the base price for the first full hour', () => {
    expect(calculateParkingFee('auto', 1, rules)).toBe(600);
    expect(calculateParkingFee('auto', 5, rules)).toBe(600);
    expect(calculateParkingFee('auto', 60, rules)).toBe(600);
  });

  it('charges automated 10-minute fractions after the first hour', () => {
    expect(calculateParkingFee('auto', 61, rules)).toBe(690);
    expect(calculateParkingFee('auto', 70, rules)).toBe(690);
    expect(calculateParkingFee('auto', 71, rules)).toBe(780);
  });

  it('uses the canonical ARS amounts for auto and camioneta', () => {
    expect(calculateParkingFee('auto', 60, arsRules)).toBe(5000);
    expect(calculateParkingFee('auto', 61, arsRules)).toBe(5750);
    expect(calculateParkingFee('auto', 70, arsRules)).toBe(5750);
    expect(calculateParkingFee('auto', 71, arsRules)).toBe(6500);
    expect(calculateParkingFee('auto', 120, arsRules)).toBe(9500);
    expect(calculateParkingFee('auto', 150, arsRules)).toBe(11750);

    expect(calculateParkingFee('camioneta', 60, arsRules)).toBe(5000);
    expect(calculateParkingFee('camioneta', 61, arsRules)).toBe(5750);
    expect(calculateParkingFee('camioneta', 70, arsRules)).toBe(5750);
    expect(calculateParkingFee('camioneta', 71, arsRules)).toBe(6500);
    expect(calculateParkingFee('camioneta', 120, arsRules)).toBe(9500);
    expect(calculateParkingFee('camioneta', 150, arsRules)).toBe(11750);
  });

  it('uses the canonical ARS amounts for moto', () => {
    expect(calculateParkingFee('moto', 60, arsRules)).toBe(3000);
    expect(calculateParkingFee('moto', 61, arsRules)).toBe(3450);
    expect(calculateParkingFee('moto', 70, arsRules)).toBe(3450);
    expect(calculateParkingFee('moto', 71, arsRules)).toBe(3900);
    expect(calculateParkingFee('moto', 120, arsRules)).toBe(5700);
    expect(calculateParkingFee('moto', 150, arsRules)).toBe(7050);
  });

  it('keeps charging fractions without a daily maximum', () => {
    expect(calculateParkingFee('auto', 24 * 60, rules)).toBe(13020);
  });

  it('defaults the fraction price to 15 percent of the first hour', () => {
    const normalized = normalizePricingRule({
      id: 'legacy',
      category: 'auto',
      name: 'Legacy',
      basePrice: 1000,
      fractionPrice: undefined as unknown as number,
      fraction: BILLING_FRACTION_MINUTES,
      baseMinutes: BASE_BILLING_MINUTES,
    });

    expect(DEFAULT_FRACTION_PRICE_RATE).toBe(0.15);
    expect(normalized.fractionPrice).toBe(150);
  });
});
