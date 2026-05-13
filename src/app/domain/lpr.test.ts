import { describe, expect, it } from 'vitest';
import {
  calculateLprAccuracy,
  forceSimulatedDetection,
  webcamDemoLprProvider,
} from './lpr';
import { validatePlate } from './plates';

describe('lpr demo provider', () => {
  it('creates simulated camera detections without claiming real OCR', async () => {
    const detection = await webcamDemoLprProvider.detect();

    expect(detection.source).toBe('camera');
    expect(validatePlate(detection.plate)).toBe(true);
    expect(detection.confidence).toBeGreaterThanOrEqual(0.95);
  });

  it('calculates accuracy from accepted and corrected readings', () => {
    expect(
      calculateLprAccuracy([
        {
          id: '1',
          detectedPlate: 'ABC123',
          correctedPlate: 'ABC123',
          confidence: 0.96,
          timestamp: '2026-05-13T10:00:00.000Z',
          userId: '1',
        },
        {
          id: '2',
          detectedPlate: 'ABC123',
          correctedPlate: 'AB123CD',
          confidence: 0.86,
          timestamp: '2026-05-13T10:01:00.000Z',
          userId: '1',
        },
      ])
    ).toBe(0.5);
  });

  it('keeps forced detections valid for demos', () => {
    const detection = forceSimulatedDetection();

    expect(validatePlate(detection.plate)).toBe(true);
    expect(detection.isValid).toBe(true);
  });
});