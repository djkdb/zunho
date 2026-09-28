import { useSyncExternalStore } from 'react';
import { detectLang } from './i18n';
import { safeStorage } from './storage';
import type { Lang } from './types';

export interface Settings {
  sound: boolean;
  volume: number; // 0..1
  lang: Lang;
  reducedMotion: boolean;
  showHotspots: boolean; // debug overlay
}

const SETTINGS_KEY = 'the-last-room.settings.v1';

function prefersReducedMotion(): boolean {
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
}

function loadSettings(): Settings {
  const defaults: Settings = {
    sound: true,
    volume: 0.8,
    lang: detectLang(),
    reducedMotion: typeof window !== 'undefined' ? prefersReducedMotion() : false,
    showHotspots: false,
  };
  const raw = safeStorage.readJson<Partial<Settings>>(SETTINGS_KEY);
  if (!raw || typeof raw !== 'object') return defaults;
  return {
    sound: typeof raw.sound === 'boolean' ? raw.sound : defaults.sound,
    volume: typeof raw.volume === 'number' && raw.volume >= 0 && raw.volume <= 1 ? raw.volume : defaults.volume,
    lang: raw.lang === 'en' || raw.lang === 'ko' ? raw.lang : defaults.lang,
    reducedMotion: typeof raw.reducedMotion === 'boolean' ? raw.reducedMotion : defaults.reducedMotion,
    showHotspots: false,
  };
}

let settings: Settings = loadSettings();
const listeners = new Set<() => void>();

export const settingsStore = {
  get: (): Settings => settings,
  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  update(patch: Partial<Settings>): void {
    settings = { ...settings, ...patch };
    const { showHotspots: _debugOnly, ...persisted } = settings;
    void _debugOnly;
    safeStorage.writeJson(SETTINGS_KEY, persisted);
    for (const listener of listeners) listener();
  },
};

export function useSettings<T>(selector: (s: Settings) => T): T {
  return useSyncExternalStore(settingsStore.subscribe, () => selector(settings));
}
