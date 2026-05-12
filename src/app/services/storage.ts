const STORAGE_PREFIX = 'parking-lpr';

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
