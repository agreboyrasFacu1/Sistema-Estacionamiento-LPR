import { LPRCorrection, LPRDetection } from '../types';
import { normalizePlate, validatePlate } from './plates';

export interface LprProvider {
  detect: () => Promise<LPRDetection>;
  detectFromFrame?: (frame: Blob | ImageData) => Promise<LPRDetection>;
  listDevices?: () => Promise<MediaDeviceInfo[]>;
}

const SIMULATED_PLATES = [
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
];

export const TARGET_LPR_ACCURACY = 0.95;

export type LprQualityStatus =
  | 'no_sample'
  | 'below_target'
  | 'target_met';

export interface LprAccuracySummary {
  totalReadings: number;
  correctReadings: number;
  manualCorrections: number;
  accuracy: number | null;
  targetAccuracy: number;
  status: LprQualityStatus;
}

export interface LprValidationSample {
  expectedPlate: string;
  detectedPlate: string;
  confidence: number;
  source: LPRDetection['source'] | 'controlled-sample';
  timestamp: string;
}

export interface LprValidationResult {
  totalSamples: number;
  exactMatches: number;
  errors: number;
  accuracy: number | null;
  targetAccuracy: number;
  meetsTarget: boolean;
}

export const simulatedLprProvider: LprProvider = {
  async detect() {
    const plate =
      SIMULATED_PLATES[Math.floor(Math.random() * SIMULATED_PLATES.length)];
    const confidence = Math.random() * 0.18 + 0.82;
    return {
      plate,
      confidence,
      timestamp: new Date().toISOString(),
      isValid: validatePlate(plate) && confidence >= TARGET_LPR_ACCURACY,
      source: 'simulated',
    };
  },
};

export const forceSimulatedDetection = (): LPRDetection => {
  const plate =
    SIMULATED_PLATES[Math.floor(Math.random() * SIMULATED_PLATES.length)];
  const confidence = Math.random() * 0.05 + TARGET_LPR_ACCURACY;
  return {
    plate,
    confidence,
    timestamp: new Date().toISOString(),
    isValid: validatePlate(plate),
    source: 'simulated',
  };
};

export const webcamDemoLprProvider: LprProvider = {
  async detect() {
    return { ...forceSimulatedDetection(), source: 'camera' };
  },
  async detectFromFrame() {
    return { ...forceSimulatedDetection(), source: 'camera' };
  },
  async listDevices() {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.enumerateDevices) {
      return [];
    }
    const devices = await navigator.mediaDevices.enumerateDevices();
    return devices.filter((device) => device.kind === 'videoinput');
  },
};

export const calculateLprAccuracy = (
  corrections: LPRCorrection[]
): number | null => {
  return getLprAccuracySummary(corrections).accuracy;
};

export const getLprQualityStatus = (
  accuracy: number | null,
  totalReadings: number,
  targetAccuracy: number = TARGET_LPR_ACCURACY
): LprQualityStatus => {
  if (totalReadings === 0 || accuracy === null) return 'no_sample';
  return accuracy >= targetAccuracy ? 'target_met' : 'below_target';
};

export const getLprAccuracySummary = (
  corrections: LPRCorrection[],
  targetAccuracy: number = TARGET_LPR_ACCURACY
): LprAccuracySummary => {
  const totalReadings = corrections.length;
  const correctReadings = corrections.filter(
    (correction) =>
      normalizePlate(correction.detectedPlate) ===
      normalizePlate(correction.correctedPlate)
  ).length;
  const manualCorrections = totalReadings - correctReadings;
  const accuracy = totalReadings === 0 ? null : correctReadings / totalReadings;

  return {
    totalReadings,
    correctReadings,
    manualCorrections,
    accuracy,
    targetAccuracy,
    status: getLprQualityStatus(accuracy, totalReadings, targetAccuracy),
  };
};

export const formatLprAccuracy = (accuracy: number | null): string =>
  accuracy === null ? 'Sin muestra' : `${(accuracy * 100).toFixed(1)}%`;

export const calculateLprValidationResult = (
  samples: LprValidationSample[],
  targetAccuracy: number = TARGET_LPR_ACCURACY
): LprValidationResult => {
  const totalSamples = samples.length;
  const exactMatches = samples.filter(
    (sample) =>
      normalizePlate(sample.expectedPlate) === normalizePlate(sample.detectedPlate)
  ).length;
  const errors = totalSamples - exactMatches;
  const accuracy = totalSamples === 0 ? null : exactMatches / totalSamples;

  return {
    totalSamples,
    exactMatches,
    errors,
    accuracy,
    targetAccuracy,
    meetsTarget: accuracy !== null && accuracy >= targetAccuracy,
  };
};

export const getSimulatedPlates = (): string[] => [...SIMULATED_PLATES];
