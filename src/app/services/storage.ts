export const STORAGE_PREFIX = 'parking-lpr';
export const DEMO_STORAGE_VERSION = 'p2.2-ars-demo-v1';

export const DEMO_STORAGE_KEYS = [
  'users',
  'credentials',
  'current-user',
  'vehicles',
  'logs',
  'pricing-rules',
  'subscribers',
  'tickets',
  'white-run-incidents',
  'lpr-corrections',
];

const getKey = (key: string) => `${STORAGE_PREFIX}:${key}`;

export const loadFromStorage = <T,>(key: string, fallback: T): T => {
  if (typeof window === 'undefined') return fallback;
  const raw = window.localStorage.getItem(getKey(key));
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
};

export const saveToStorage = <T,>(key: string, value: T): void => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(getKey(key), JSON.stringify(value));
};

export const removeFromStorage = (key: string): void => {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(getKey(key));
};

export const resetDemoStorage = (keys: string[] = DEMO_STORAGE_KEYS): void => {
  if (typeof window === 'undefined') return;
  keys.forEach(removeFromStorage);
  window.localStorage.setItem(getKey('demo-version'), DEMO_STORAGE_VERSION);
};

export const ensureDemoStorageVersion = (): void => {
  if (typeof window === 'undefined') return;
  const versionKey = getKey('demo-version');
  const currentVersion = window.localStorage.getItem(versionKey);
  if (currentVersion === DEMO_STORAGE_VERSION) return;
  resetDemoStorage();
};
