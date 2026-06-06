import { describe, expect, it } from 'vitest';
import { getPaymentBreakdownTotal, validatePaymentBreakdown } from './payments';

describe('payment breakdown domain', () => {
  it('accepts a mixed payment when the breakdown matches the total', () => {
    expect(() =>
      validatePaymentBreakdown(150000, [
        { method: 'cash', amount: 50000 },
        { method: 'card', amount: 100000 },
      ])
    ).not.toThrow();
    expect(
      getPaymentBreakdownTotal([
        { method: 'cash', amount: 50000 },
        { method: 'card', amount: 100000 },
      ])
    ).toBe(150000);
  });

  it('rejects incomplete or exceeded mixed payments', () => {
    expect(() =>
      validatePaymentBreakdown(150000, [
        { method: 'cash', amount: 50000 },
        { method: 'card', amount: 90000 },
      ])
    ).toThrow('La suma del pago mixto debe coincidir con el total');

    expect(() =>
      validatePaymentBreakdown(150000, [
        { method: 'cash', amount: 50000 },
        { method: 'card', amount: 110000 },
      ])
    ).toThrow('La suma del pago mixto debe coincidir con el total');
  });

  it('rejects negative mixed payment amounts', () => {
    expect(() =>
      validatePaymentBreakdown(150000, [
        { method: 'cash', amount: -1 },
        { method: 'card', amount: 150001 },
      ])
    ).toThrow('Los montos del pago mixto no pueden ser negativos');
  });
});
