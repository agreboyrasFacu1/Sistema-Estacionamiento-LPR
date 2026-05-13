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
  if (corrections.length === 0) return null;
  const correctReads = corrections.filter(
    (correction) =>
      normalizePlate(correction.detectedPlate) ===
      normalizePlate(correction.correctedPlate)
  ).length;
  return correctReads / corrections.length;
};

export const getSimulatedPlates = (): string[] => [...SIMULATED_PLATES];
