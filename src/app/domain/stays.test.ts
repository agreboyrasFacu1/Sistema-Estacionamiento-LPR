import { describe, expect, it } from 'vitest';
import {
  calculateDurationMinutes,
  createExitGraceUntil,
  isWithinExitGrace,
} from './stays';

describe('stay domain', () => {
  it('calculates duration in whole billable minutes', () => {
    expect(
      calculateDurationMinutes(
        '2026-05-12T10:00:00.000Z',
        new Date('2026-05-12T10:00:01.000Z')
      )
    ).toBe(1);
  });

  it('creates and validates a 3-minute post-payment exit grace window', () => {
    const paidAt = '2026-05-12T10:00:00.000Z';
    const graceUntil = createExitGraceUntil(paidAt);
    expect(graceUntil).toBe('2026-05-12T10:03:00.000Z');
    expect(isWithinExitGrace(graceUntil, new Date('2026-05-12T10:02:59.000Z'))).toBe(true);
    expect(isWithinExitGrace(graceUntil, new Date('2026-05-12T10:03:01.000Z'))).toBe(false);
  });
});
