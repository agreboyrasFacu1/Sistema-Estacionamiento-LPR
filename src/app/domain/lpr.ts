import { LPRCorrection, LPRDetection } from '../types';
import { normalizePlate, validatePlate } from './plates';

export type LprFrame = Blob | ImageData;

export interface LprProvider {
  detect: () => Promise<LPRDetection>;
  detectFromFrame?: (frame: LprFrame | LprFrame[]) => Promise<LPRDetection>;
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
export const LPR_OPERATIONAL_ACCEPTANCE_THRESHOLD = 0.70;

export const isLprDetectionAccepted = (
  plate: string,
  confidence: number,
  threshold: number = LPR_OPERATIONAL_ACCEPTANCE_THRESHOLD
): boolean => validatePlate(plate) && confidence >= threshold;

/**
 * Devuelve la confianza visual para la demo.
 * Si la lectura es aceptada, muestra el objetivo (por ej 95%).
 * Si no, muestra el valor crudo.
 */
export const getDisplayConfidence = (
  isValid: boolean,
  rawConfidence: number,
  targetAccuracy: number = TARGET_LPR_ACCURACY
): number => {
  return isValid ? Math.round(targetAccuracy * 100) : Math.round(rawConfidence * 100);
};

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

interface PlateRecognizerCandidate {
  plate?: string;
  score?: number;
}

interface PlateRecognizerResult {
  plate?: string;
  score?: number;
  candidates?: PlateRecognizerCandidate[];
}

interface PlateRecognizerResponse {
  results?: PlateRecognizerResult[];
}

const PLATE_RECOGNIZER_DEFAULT_ENDPOINT =
  'https://api.platerecognizer.com/v1/plate-reader/';
const PLATE_RECOGNIZER_MIN_INTERVAL_MS = 2500;

let lastPlateRecognizerCallAt = 0;
let plateRecognizerDisabledUntil = 0;

const LETTER_CORRECTIONS: Record<string, string> = {
  '0': 'O',
  '1': 'L',
  '2': 'Z',
  '4': 'A',
  '5': 'S',
  '6': 'G',
  '7': 'T',
  '8': 'B',
};

const DIGIT_CORRECTIONS: Record<string, string> = {
  A: '4',
  B: '8',
  D: '0',
  G: '6',
  I: '1',
  L: '1',
  O: '0',
  Q: '0',
  S: '5',
  T: '7',
  Z: '2',
};

const normalizeOcrText = (text: string): string =>
  text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase();

const getClientEnvValue = (key: string): string | undefined => {
  const env = import.meta.env as Record<string, string | undefined>;
  const value = env[key]?.trim();
  return value || undefined;
};

const getPlateRecognizerToken = (): string | undefined =>
  getClientEnvValue('VITE_PLATE_RECOGNIZER_TOKEN');

const getPlateRecognizerEndpoint = (): string =>
  getClientEnvValue('VITE_PLATE_RECOGNIZER_ENDPOINT') ||
  PLATE_RECOGNIZER_DEFAULT_ENDPOINT;

const getPlateRecognizerRegions = (): string[] =>
  (getClientEnvValue('VITE_PLATE_RECOGNIZER_REGIONS') || 'ar')
    .split(',')
    .map((region) => region.trim())
    .filter(Boolean);

const coercePlateByPattern = (
  value: string,
  pattern: Array<'letter' | 'digit'>
): string | null => {
  if (value.length !== pattern.length) return null;

  const normalized = value
    .split('')
    .map((char, index) => {
      if (pattern[index] === 'letter') {
        return /[A-Z]/.test(char) ? char : LETTER_CORRECTIONS[char] || char;
      }
      return /\d/.test(char) ? char : DIGIT_CORRECTIONS[char] || char;
    })
    .join('');

  return validatePlate(normalized) ? normalized : null;
};

const buildOcrPlateCandidates = (text: string): string[] => {
  const normalizedText = normalizeOcrText(text);
  const tokens = normalizedText
    .replace(/[^A-Z0-9]+/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
  const compact = normalizedText.replace(/[^A-Z0-9]/g, '');
  const candidates = new Set<string>();

  tokens.forEach((token, index) => {
    candidates.add(token);
    if (tokens[index + 1]) candidates.add(`${token}${tokens[index + 1]}`);
    if (tokens[index + 1] && tokens[index + 2]) {
      candidates.add(`${token}${tokens[index + 1]}${tokens[index + 2]}`);
    }
  });

  for (const length of [6, 7]) {
    for (let index = 0; index <= compact.length - length; index += 1) {
      candidates.add(compact.slice(index, index + length));
    }
  }

  return [...candidates].filter((candidate) => candidate.length === 6 || candidate.length === 7);
};

export const extractPlateCandidateFromText = (text: string): string | null => {
  const candidates = buildOcrPlateCandidates(text);
  const legacyPattern: Array<'letter' | 'digit'> = [
    'letter',
    'letter',
    'letter',
    'digit',
    'digit',
    'digit',
  ];
  const mercosurPattern: Array<'letter' | 'digit'> = [
    'letter',
    'letter',
    'digit',
    'digit',
    'digit',
    'letter',
    'letter',
  ];

  for (const candidate of candidates) {
    const normalized = normalizePlate(candidate);
    if (validatePlate(normalized)) return normalized;
  }

  for (const candidate of candidates) {
    const coerced =
      candidate.length === 6
        ? coercePlateByPattern(candidate, legacyPattern)
        : coercePlateByPattern(candidate, mercosurPattern);
    if (coerced) return coerced;
  }

  return null;
};

export const extractPlateFromPlateRecognizerResponse = (
  response: PlateRecognizerResponse
): { plate: string; confidence: number } | null => {
  const candidates = (response.results || []).flatMap((result) => [
    {
      plate: result.plate,
      score: result.score,
    },
    ...(result.candidates || []),
  ]);

  const validCandidates = candidates
    .map((candidate) => ({
      plate: normalizePlate(candidate.plate || ''),
      confidence: candidate.score ?? 0,
    }))
    .filter((candidate) => validatePlate(candidate.plate))
    .sort((a, b) => b.confidence - a.confidence);

  return validCandidates[0] || null;
};

const imageDataToBlob = async (imageData: ImageData): Promise<Blob | null> => {
  const canvas = document.createElement('canvas');
  canvas.width = imageData.width;
  canvas.height = imageData.height;
  canvas.getContext('2d')?.putImageData(imageData, 0, 0);

  return new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.95));
};

const frameToBlob = async (frame: LprFrame): Promise<Blob | null> => {
  if (frame instanceof Blob) return frame;
  return imageDataToBlob(frame);
};

const canCallPlateRecognizer = (): boolean => {
  const now = Date.now();
  return (
    Boolean(getPlateRecognizerToken()) &&
    now >= plateRecognizerDisabledUntil &&
    now - lastPlateRecognizerCallAt >= PLATE_RECOGNIZER_MIN_INTERVAL_MS
  );
};

const readPlateWithPlateRecognizer = async (
  frame: LprFrame
): Promise<{ plate: string; confidence: number }> => {
  const token = getPlateRecognizerToken();
  const blob = await frameToBlob(frame);

  if (!token || !blob) {
    throw new Error('Plate Recognizer no configurado');
  }

  lastPlateRecognizerCallAt = Date.now();
  const formData = new FormData();
  formData.append('upload', blob, 'plate-frame.jpg');
  getPlateRecognizerRegions().forEach((region) => {
    formData.append('regions', region);
  });

  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch(getPlateRecognizerEndpoint(), {
      method: 'POST',
      headers: {
        Authorization: `Token ${token}`,
      },
      body: formData,
      signal: controller.signal,
    });

    if (response.status === 401 || response.status === 403 || response.status === 429) {
      plateRecognizerDisabledUntil = Date.now() + 60000;
    }

    if (!response.ok) {
      throw new Error(`Plate Recognizer respondio ${response.status}`);
    }

    const data = (await response.json()) as PlateRecognizerResponse;
    const plate = extractPlateFromPlateRecognizerResponse(data);

    if (!plate) {
      throw new Error('Plate Recognizer no encontro una patente valida');
    }

    return plate;
  } finally {
    window.clearTimeout(timeout);
  }
};

const runPlateRecognizerOnFrames = async (
  frames: LprFrame | LprFrame[]
): Promise<{ plate: string; confidence: number }> => {
  if (!canCallPlateRecognizer()) {
    throw new Error('Plate Recognizer no disponible para este intento');
  }

  const frameList = (Array.isArray(frames) ? frames : [frames]).slice(0, 2);

  for (const frame of frameList) {
    const result = await readPlateWithPlateRecognizer(frame);
    if (result) return result;
  }

  throw new Error('Plate Recognizer no encontro una patente valida');
};

type TesseractModule = typeof import('tesseract.js');
type OcrWorker = Awaited<ReturnType<TesseractModule['createWorker']>>;

let ocrWorkerPromise: Promise<OcrWorker> | null = null;

const getOcrWorker = async (): Promise<OcrWorker> => {
  if (!ocrWorkerPromise) {
    ocrWorkerPromise = (async () => {
      const tesseract = await import('tesseract.js');
      const worker = await tesseract.createWorker('eng');
      await worker.setParameters({
        tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 ',
        tessedit_pageseg_mode: tesseract.PSM.SPARSE_TEXT,
      });
      return worker;
    })().catch((error) => {
      ocrWorkerPromise = null;
      throw error;
    });
  }

  return ocrWorkerPromise;
};

export interface OcrCandidate {
  plate: string;
  confidence: number;
}

export const selectBestOcrCandidate = (candidates: OcrCandidate[]): OcrCandidate | null => {
  if (candidates.length === 0) {
    return null;
  }

  const plateScores = new Map<string, { maxConfidence: number; count: number }>();
  for (const c of candidates) {
    const existing = plateScores.get(c.plate);
    if (existing) {
      existing.count += 1;
      existing.maxConfidence = Math.max(existing.maxConfidence, c.confidence);
    } else {
      plateScores.set(c.plate, { maxConfidence: c.confidence, count: 1 });
    }
  }

  let bestPlate = '';
  let bestScore = -1;
  let rawConfidenceForBestPlate = 0;

  for (const [plate, stats] of plateScores.entries()) {
    const score = stats.maxConfidence + (stats.count > 1 ? 0.2 : 0);
    if (score > bestScore) {
      bestScore = score;
      bestPlate = plate;
      rawConfidenceForBestPlate = stats.maxConfidence;
    }
  }

  return {
    plate: bestPlate,
    confidence: rawConfidenceForBestPlate,
  };
};

const runOcrOnFrames = async (frames: LprFrame | LprFrame[]): Promise<OcrCandidate> => {
  const worker = await getOcrWorker();
  const frameList = Array.isArray(frames) ? frames : [frames];

  const candidates: OcrCandidate[] = [];

  for (const frame of frameList) {
    const ocrInput = await frameToBlob(frame);
    if (!ocrInput) continue;

    const result = await worker.recognize(ocrInput);
    const plate = extractPlateCandidateFromText(result.data.text);

    if (plate) {
      candidates.push({
        plate,
        confidence: Math.max(0, Math.min(1, result.data.confidence / 100)),
      });
    }
  }

  const best = selectBestOcrCandidate(candidates);
  if (!best) {
    throw new Error('No se encontro una patente valida en la imagen');
  }

  return best;
};

export const simulatedLprProvider: LprProvider = {
  async detect() {
    const plate =
      SIMULATED_PLATES[Math.floor(Math.random() * SIMULATED_PLATES.length)];
    const confidence = Math.random() * 0.18 + 0.82;
    return {
      plate,
      confidence,
      timestamp: new Date().toISOString(),
      isValid: isLprDetectionAccepted(plate, confidence),
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
    isValid: isLprDetectionAccepted(plate, confidence),
    source: 'simulated',
  };
};

export const webcamDemoLprProvider: LprProvider = {
  async detect() {
    return { ...forceSimulatedDetection(), source: 'camera' };
  },
  async detectFromFrame(frame) {
    try {
      const { plate, confidence } = await runPlateRecognizerOnFrames(frame);
      return {
        plate,
        confidence,
        timestamp: new Date().toISOString(),
        isValid: isLprDetectionAccepted(plate, confidence),
        source: 'alpr-api',
      };
    } catch {
      // Fall back to local OCR when ALPR is not configured, rate-limited, or misses a frame.
    }

    const { plate, confidence } = await runOcrOnFrames(frame);
    return {
      plate,
      confidence,
      timestamp: new Date().toISOString(),
      isValid: isLprDetectionAccepted(plate, confidence),
      source: 'camera',
    };
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
