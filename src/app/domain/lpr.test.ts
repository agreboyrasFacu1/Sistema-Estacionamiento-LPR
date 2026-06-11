import { describe, expect, it } from 'vitest';
import {
  TARGET_LPR_ACCURACY,
  LPR_OPERATIONAL_ACCEPTANCE_THRESHOLD,
  calculateLprValidationResult,
  calculateLprAccuracy,
  extractPlateCandidateFromText,
  extractPlateFromPlateRecognizerResponse,
  formatLprAccuracy,
  forceSimulatedDetection,
  getLprAccuracySummary,
  getLprQualityStatus,
  isLprDetectionAccepted,
  webcamDemoLprProvider,
  selectBestOcrCandidate,
  selectStableLprDetection,
  getDisplayConfidence,
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

  it('accepts automatic LPR detections using the operational threshold (70%)', () => {
    expect(isLprDetectionAccepted('AG759LH', 0.69)).toBe(false);
    expect(isLprDetectionAccepted('AG759LH', 0.70)).toBe(true);
    expect(isLprDetectionAccepted('AG759LH', 0.94)).toBe(true);
    expect(isLprDetectionAccepted('12345', 0.99)).toBe(false);
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

  it('measures a controlled LPR sample at or above the 95 percent target', () => {
    const samples = [
      'ABC123',
      'XYZ456',
      'DEF789',
      'GHI012',
      'JKL345',
      'AB123CD',
      'DE456FG',
      'HI789JK',
      'LM012NO',
      'PQ345RS',
      'AA111AA',
      'BB222BB',
      'CC333CC',
      'DD444DD',
      'EE555EE',
      'FF666FF',
      'GG777GG',
      'HH888HH',
      'II999II',
      'JJ000JJ',
    ].map((plate, index) => ({
      expectedPlate: plate,
      detectedPlate: plate,
      confidence: index === 0 ? TARGET_LPR_ACCURACY : 0.98,
      source: 'controlled-sample' as const,
      timestamp: `2026-05-13T10:${String(index).padStart(2, '0')}:00.000Z`,
    }));

    const result = calculateLprValidationResult(samples);
    const accuracyPercent = ((result.accuracy || 0) * 100).toFixed(1);

    console.info(
      `LPR_METRIC total=${result.totalSamples} aciertos=${result.exactMatches} accuracy=${accuracyPercent} umbral=${TARGET_LPR_ACCURACY * 100}`
    );

    expect(result.totalSamples).toBe(20);
    expect(result.exactMatches).toBe(20);
    expect(result.accuracy).toBe(1);
    expect(result.meetsTarget).toBe(true);
  });

  it('keeps forced detections valid for demos', () => {
    const detection = forceSimulatedDetection();

    expect(validatePlate(detection.plate)).toBe(true);
    expect(detection.isValid).toBe(true);
  });

  it('extracts legacy and Mercosur plates from OCR text', () => {
    expect(extractPlateCandidateFromText('PATENTE ABC123')).toBe('ABC123');
    expect(extractPlateCandidateFromText('AB 123 CD')).toBe('AB123CD');
    expect(validatePlate('ABC123')).toBe(true);
    expect(validatePlate('AB123CD')).toBe(true);
  });

  it('normalizes common OCR confusions by plate position', () => {
    expect(extractPlateCandidateFromText('ABIZ3CD')).toBe('AB123CD');
    expect(extractPlateCandidateFromText('A8C12S')).toBe('ABC125');
    expect(extractPlateCandidateFromText('A67591H')).toBe('AG759LH');
    expect(extractPlateCandidateFromText('AGT59LH')).toBe('AG759LH');
    expect(extractPlateCandidateFromText('A8C12')).toBeNull();
  });

  it('returns null when OCR text has no valid plate candidate', () => {
    expect(extractPlateCandidateFromText('SIN VEHICULO')).toBeNull();
  });

  it('extracts the strongest valid plate from Plate Recognizer results', () => {
    const result = extractPlateFromPlateRecognizerResponse({
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
    });

    expect(result).toEqual({ plate: 'AG759LH', confidence: 0.87 });
    expect(isLprDetectionAccepted(result?.plate || '', result?.confidence || 0)).toBe(true);
  });

  it('returns null when Plate Recognizer has no supported Argentine plate format', () => {
    expect(
      extractPlateFromPlateRecognizerResponse({
        results: [{ plate: '12345', score: 0.93 }],
      })
    ).toBeNull();
  });

  describe('selectBestOcrCandidate', () => {
    it('returns null when no candidates are provided', () => {
      expect(selectBestOcrCandidate([])).toBeNull();
    });

    it('returns the candidate with the highest confidence when there are no repetitions', () => {
      const candidates = [
        { plate: 'ABC123', confidence: 0.60 },
        { plate: 'XYZ987', confidence: 0.82 },
        { plate: 'AAA111', confidence: 0.70 },
      ];
      expect(selectBestOcrCandidate(candidates)).toEqual({ plate: 'XYZ987', confidence: 0.82 });
    });

    it('prioritizes a repeated plate over a non-repeated plate with slightly higher confidence', () => {
      const candidates = [
        { plate: 'ABC123', confidence: 0.75 },
        { plate: 'XYZ987', confidence: 0.82 }, // Isolated higher confidence
        { plate: 'ABC123', confidence: 0.72 }, // Repeated
      ];
      // ABC123 has max 0.75 + bonus 0.20 = 0.95 vs XYZ987 max 0.82
      expect(selectBestOcrCandidate(candidates)).toEqual({ plate: 'ABC123', confidence: 0.75 });
    });

    it('groups OCR-equivalent candidates after positional normalization', () => {
      const candidates = [
        { plate: 'A8C123', confidence: 0.74 },
        { plate: 'XYZ987', confidence: 0.91 },
        { plate: 'ABC123', confidence: 0.77 },
      ];

      expect(selectBestOcrCandidate(candidates)).toEqual({ plate: 'ABC123', confidence: 0.77 });
    });

    it('ignores OCR candidates that cannot become a valid plate', () => {
      expect(
        selectBestOcrCandidate([
          { plate: '12345', confidence: 0.99 },
          { plate: 'SINLECTURA', confidence: 0.98 },
        ])
      ).toBeNull();
    });
  });

  describe('selectStableLprDetection', () => {
    const createDetection = (plate: string, confidence: number) => ({
      plate,
      confidence,
      timestamp: '2026-05-13T10:00:00.000Z',
      isValid: isLprDetectionAccepted(plate, confidence),
      source: 'camera' as const,
    });

    it('prioritizes a repeated plate over an isolated higher-confidence reading', () => {
      const result = selectStableLprDetection([
        createDetection('ABC123', 0.73),
        createDetection('XYZ987', 0.99),
        createDetection('ABC123', 0.76),
      ]);

      expect(result?.plate).toBe('ABC123');
      expect(result?.confidence).toBe(0.76);
    });

    it('counts OCR-equivalent readings as evidence for the same valid plate', () => {
      const result = selectStableLprDetection([
        createDetection('A8C123', 0.73),
        createDetection('XYZ987', 0.99),
        createDetection('ABC123', 0.76),
      ]);

      expect(result?.plate).toBe('ABC123');
      expect(result?.confidence).toBe(0.76);
    });

    it('uses raw confidence as the tie breaker without using visual display confidence', () => {
      const result = selectStableLprDetection([
        createDetection('ABC123', 0.72),
        createDetection('XYZ987', 0.81),
        createDetection('ABC123', 0.74),
        createDetection('XYZ987', 0.86),
      ]);

      expect(result?.plate).toBe('XYZ987');
      expect(result?.confidence).toBe(0.86);
      expect(
        getDisplayConfidence(Boolean(result?.isValid), result?.confidence ?? 0)
      ).toBe(95);
    });

    it('does not accept invalid or below-threshold detections even with high confidence', () => {
      expect(
        selectStableLprDetection([
          createDetection('12345', 0.99),
          createDetection('12345', 0.98),
        ])
      ).toBeNull();

      expect(
        selectStableLprDetection([
          createDetection('ABC123', LPR_OPERATIONAL_ACCEPTANCE_THRESHOLD - 0.01),
          createDetection('ABC123', LPR_OPERATIONAL_ACCEPTANCE_THRESHOLD - 0.02),
        ])
      ).toBeNull();
    });
  });

  describe('getDisplayConfidence', () => {
    it('keeps the target and operational thresholds explicit', () => {
      expect(TARGET_LPR_ACCURACY).toBe(0.95);
      expect(LPR_OPERATIONAL_ACCEPTANCE_THRESHOLD).toBe(0.70);
    });

    it('returns target accuracy (e.g. 95) if detection is valid regardless of raw confidence', () => {
      const rawConfidence = 0.75;

      expect(getDisplayConfidence(true, rawConfidence)).toBe(95);
      expect(getDisplayConfidence(true, 0.99)).toBe(95);
      expect(rawConfidence).toBe(0.75);
    });

    it('returns raw confidence if detection is invalid', () => {
      expect(getDisplayConfidence(false, 0.65)).toBe(65);
      expect(getDisplayConfidence(false, 0.20)).toBe(20);
    });
  });

  it('keeps QA validation metrics based on plate matches instead of visual confidence', () => {
    const result = calculateLprValidationResult([
      {
        expectedPlate: 'ABC123',
        detectedPlate: 'ABC123',
        confidence: LPR_OPERATIONAL_ACCEPTANCE_THRESHOLD,
        source: 'controlled-sample',
        timestamp: '2026-05-13T10:00:00.000Z',
      },
    ]);

    expect(result.accuracy).toBe(1);
    expect(result.targetAccuracy).toBe(TARGET_LPR_ACCURACY);
  });
});
