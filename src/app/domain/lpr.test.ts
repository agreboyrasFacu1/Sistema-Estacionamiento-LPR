import { describe, expect, it } from 'vitest';
import {
  TARGET_LPR_ACCURACY,
  calculateLprValidationResult,
  calculateLprAccuracy,
  extractPlateCandidateFromText,
  extractPlateFromPlateRecognizerResponse,
  formatLprAccuracy,
  forceSimulatedDetection,
  getLprAccuracySummary,
  getLprQualityStatus,
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

  it('summarizes empty correction samples without reporting 0%', () => {
    const summary = getLprAccuracySummary([]);

    expect(summary).toEqual({
      totalReadings: 0,
      correctReadings: 0,
      manualCorrections: 0,
      accuracy: null,
      targetAccuracy: TARGET_LPR_ACCURACY,
      status: 'no_sample',
    });
    expect(formatLprAccuracy(summary.accuracy)).toBe('Sin muestra');
  });

  it('summarizes correct readings and manual corrections', () => {
    const summary = getLprAccuracySummary([
      {
        id: '1',
        detectedPlate: ' abc123 ',
        correctedPlate: 'ABC123',
        confidence: 0.98,
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
    ]);

    expect(summary.totalReadings).toBe(2);
    expect(summary.correctReadings).toBe(1);
    expect(summary.manualCorrections).toBe(1);
    expect(summary.accuracy).toBe(0.5);
    expect(summary.status).toBe('below_target');
  });

  it('evaluates quality status against the target', () => {
    expect(getLprQualityStatus(null, 0)).toBe('no_sample');
    expect(getLprQualityStatus(0.94, 100)).toBe('below_target');
    expect(getLprQualityStatus(0.95, 100)).toBe('target_met');
  });

  it('formats accuracy values for the UI', () => {
    expect(formatLprAccuracy(null)).toBe('Sin muestra');
    expect(formatLprAccuracy(0.951)).toBe('95.1%');
  });

  it('calculates controlled validation sample results without real OCR claims', () => {
    const result = calculateLprValidationResult([
      {
        expectedPlate: 'ABC123',
        detectedPlate: ' abc123 ',
        confidence: 0.98,
        source: 'controlled-sample',
        timestamp: '2026-05-13T10:00:00.000Z',
      },
      {
        expectedPlate: 'AB123CD',
        detectedPlate: 'AB123CD',
        confidence: 0.97,
        source: 'camera',
        timestamp: '2026-05-13T10:01:00.000Z',
      },
      {
        expectedPlate: 'ZZ999ZZ',
        detectedPlate: 'ZZ999ZY',
        confidence: 0.91,
        source: 'ip-camera',
        timestamp: '2026-05-13T10:02:00.000Z',
      },
    ]);

    expect(result.totalSamples).toBe(3);
    expect(result.exactMatches).toBe(2);
    expect(result.errors).toBe(1);
    expect(result.accuracy).toBe(2 / 3);
    expect(result.meetsTarget).toBe(false);
  });

  it('keeps forced detections valid for demos', () => {
    const detection = forceSimulatedDetection();

    expect(validatePlate(detection.plate)).toBe(true);
    expect(detection.isValid).toBe(true);
  });

  it('extracts legacy and Mercosur plates from OCR text', () => {
    expect(extractPlateCandidateFromText('PATENTE ABC123')).toBe('ABC123');
    expect(extractPlateCandidateFromText('AB 123 CD')).toBe('AB123CD');
  });

  it('normalizes common OCR confusions by plate position', () => {
    expect(extractPlateCandidateFromText('ABIZ3CD')).toBe('AB123CD');
    expect(extractPlateCandidateFromText('A8C12S')).toBe('ABC125');
    expect(extractPlateCandidateFromText('A67591H')).toBe('AG759LH');
    expect(extractPlateCandidateFromText('AGT59LH')).toBe('AG759LH');
  });

  it('returns null when OCR text has no valid plate candidate', () => {
    expect(extractPlateCandidateFromText('SIN VEHICULO')).toBeNull();
  });

  it('extracts the strongest valid plate from Plate Recognizer results', () => {
    expect(
      extractPlateFromPlateRecognizerResponse({
        results: [
          {
            plate: 'ag759lh',
            score: 0.87,
            candidates: [
              { plate: 'ag7591h', score: 0.91 },
              { plate: 'xyz', score: 0.99 },
            ],
          },
        ],
      })
    ).toEqual({ plate: 'AG759LH', confidence: 0.87 });
  });

  it('returns null when Plate Recognizer has no supported Argentine plate format', () => {
    expect(
      extractPlateFromPlateRecognizerResponse({
        results: [{ plate: '12345', score: 0.93 }],
      })
    ).toBeNull();
  });
});
