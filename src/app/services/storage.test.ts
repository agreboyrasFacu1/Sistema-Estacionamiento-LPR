import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  DEMO_STORAGE_VERSION,
  ensureDemoStorageVersion,
  loadFromStorage,
  resetDemoStorage,
  saveToStorage,
} from './storage';

const createLocalStorage = () => {
  const data = new Map<string, string>();
  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => data.set(key, value),
    removeItem: (key: string) => data.delete(key),
    clear: () => data.clear(),
  };
};

describe('demo storage', () => {
  beforeEach(() => {
    Object.defineProperty(globalThis, 'window', {
      value: { localStorage: createLocalStorage() },
      configurable: true,
    });
  });

  afterEach(() => {
    Reflect.deleteProperty(globalThis, 'window');
  });

  it('resets demo keys and stores the current version', () => {
    saveToStorage('vehicles', [{ id: 'old' }]);

    resetDemoStorage();

    expect(loadFromStorage('vehicles', [])).toEqual([]);
    expect(window.localStorage.getItem('parking-lpr:demo-version')).toBe(
      DEMO_STORAGE_VERSION
    );
  });

  it('migrates stale demo storage on version mismatch', () => {
    window.localStorage.setItem('parking-lpr:demo-version', 'old-version');
    saveToStorage('vehicles', [{ id: 'old' }]);

    ensureDemoStorageVersion();

    expect(loadFromStorage('vehicles', [])).toEqual([]);
    expect(window.localStorage.getItem('parking-lpr:demo-version')).toBe(
      DEMO_STORAGE_VERSION
    );
  });
});