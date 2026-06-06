import { PaymentBreakdownItem } from '../types';

export const getPaymentBreakdownTotal = (
  breakdown: PaymentBreakdownItem[] = []
): number =>
  Number(
    breakdown
      .reduce((sum, item) => sum + item.amount, 0)
      .toFixed(2)
  );

export const validatePaymentBreakdown = (
  expectedTotal: number,
  breakdown: PaymentBreakdownItem[] = []
): void => {
  if (breakdown.length === 0) {
    throw new Error('El pago mixto requiere al menos un medio de pago');
  }

  for (const item of breakdown) {
    if (item.amount < 0) {
      throw new Error('Los montos del pago mixto no pueden ser negativos');
    }
  }

  const total = getPaymentBreakdownTotal(breakdown);
  const expected = Number(expectedTotal.toFixed(2));
  if (total !== expected) {
    throw new Error('La suma del pago mixto debe coincidir con el total');
  }
};
