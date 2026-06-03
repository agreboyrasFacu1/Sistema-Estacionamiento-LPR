import { describe, expect, it } from 'vitest';
import { normalizePlate, validatePlate, plateValidationMessage } from './plates';

describe('plate domain', () => {
  it('normalizes plates by trimming spaces and uppercasing', () => {
    expect(normalizePlate(' ab 123 cd ')).toBe('AB123CD');
  });

  it('accepts legacy and Mercosur formats', () => {
    expect(validatePlate('ABC123')).toBe(true);
    expect(validatePlate('AB123CD')).toBe(true);
  });

  it('rejects unsupported plate formats with a user-facing message available', () => {
    expect(validatePlate('A123BCD')).toBe(false);
    expect(plateValidationMessage).toContain('ABC123');
  });
});
