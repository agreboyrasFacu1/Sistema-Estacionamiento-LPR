import { describe, expect, it } from 'vitest';
import { PricingRule, VehicleEntry } from '../types';
import { getPaymentBreakdownTotal, validatePaymentBreakdown } from './payments';
import { calculateParkingFee, BILLING_FRACTION_MINUTES, BASE_BILLING_MINUTES } from './pricing';
import { calculateDurationMinutes, createExitGraceUntil, isWithinExitGrace } from './stays';
import { createTicketNumber, createTicketOperation } from './tickets';

const pricingRules: PricingRule[] = [
  {
    id: 'auto',
    category: 'auto',
    name: 'Auto',
    basePrice: 5000,
    fractionPrice: 750,
    fraction: BILLING_FRACTION_MINUTES,
    baseMinutes: BASE_BILLING_MINUTES,
  },
];

describe('integrated parking flow domain', () => {
  it('covers entry, amount calculation, payment ticket and exit inside grace window', () => {
    const entryTime = '2026-05-13T09:00:00.000Z';
    const paidAtDate = new Date('2026-05-13T10:01:00.000Z');
    const paidAt = paidAtDate.toISOString();
    const duration = calculateDurationMinutes(entryTime, paidAtDate);
    const amount = calculateParkingFee('auto', duration, pricingRules);
    const ticketNumber = createTicketNumber('veh-123', paidAtDate);
    const exitGraceUntil = createExitGraceUntil(paidAt);
    const paymentBreakdown = [
      { method: 'cash' as const, amount: 3000 },
      { method: 'card' as const, amount: 2750 },
    ];

    validatePaymentBreakdown(amount, paymentBreakdown);

    const paidVehicle: VehicleEntry = {
      id: 'veh-123',
      licensePlate: 'ABC123',
      category: 'auto',
      entryTime,
      paidAt,
      exitGraceUntil,
      duration,
      amount,
      isPaid: true,
      paymentMethod: 'mixed',
      paymentBreakdown,
      ticketNumber,
      cashierId: 'cashier-1',
      hasError: false,
      status: 'paid',
    };

    const ticket = createTicketOperation(
      paidVehicle,
      'mixed',
      'cashier-1',
      paidAtDate,
      paymentBreakdown
    );

    const exitedVehicle: VehicleEntry = {
      ...paidVehicle,
      exitTime: '2026-05-13T10:02:59.000Z',
      status: 'exited',
    };

    expect(duration).toBe(61);
    expect(amount).toBe(5750);
    expect(getPaymentBreakdownTotal(paymentBreakdown)).toBe(amount);
    expect(ticket.ticketNumber).toMatch(/^TKT-/);
    expect(ticket.operationType).toBe('parking_stay');
    expect(ticket.paymentMethod).toBe('mixed');
    expect(ticket.paymentBreakdown).toEqual(paymentBreakdown);
    expect(isWithinExitGrace(exitGraceUntil, new Date(exitedVehicle.exitTime!))).toBe(true);
    expect(exitedVehicle.status).toBe('exited');
  });
});
