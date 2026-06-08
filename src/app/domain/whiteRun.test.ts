import { describe, expect, it } from 'vitest';
import { WhiteRunIncident } from '../types';
import { calculateWhiteRunDifference } from './whiteRun';

describe('white run domain', () => {
  it('calculates no difference when manual and system amounts match', () => {
    expect(calculateWhiteRunDifference(5750, 5750)).toBe(0);
  });

  it('calculates positive and negative operational differences', () => {
    expect(calculateWhiteRunDifference(5750, 5000)).toBe(750);
    expect(calculateWhiteRunDifference(5000, 5750)).toBe(-750);
  });

  it('can represent an exportable white-run incident with calculated difference', () => {
    const incident: WhiteRunIncident = {
      id: 'wr-1',
      vehicleId: 'veh-1',
      licensePlate: 'ABC123',
      systemAmount: 5750,
      manualAmount: 5000,
      difference: calculateWhiteRunDifference(5750, 5000),
      description: 'Diferencia detectada entre cobro sistema y control manual',
      createdAt: '2026-05-13T10:00:00.000Z',
      userId: 'cashier-1',
      status: 'open',
    };

    expect(incident).toMatchObject({
      systemAmount: 5750,
      manualAmount: 5000,
      difference: 750,
      status: 'open',
    });
  });
});
