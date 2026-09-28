import { STOPPED_TIME } from '../data/puzzles';
import type { Flags, GameState } from '../types';
import { FLAG_IDS } from '../types';

export const SAVE_VERSION = 1;

export function createFlags(): Flags {
  return Object.fromEntries(FLAG_IDS.map((f) => [f, false])) as Flags;
}

export function createInitialState(): GameState {
  return {
    version: SAVE_VERSION,
    phase: 'intro',
    scene: null,
    prevScene: null,
    heldItem: null,
    discoveredObjects: [],
    inventory: [],
    collectedItems: [],
    takenPickups: [],
    solvedPuzzles: [],
    clues: [],
    flags: createFlags(),
    clock: { ...STOPPED_TIME },
    bookPulls: [],
    readPages: {},
    hintCount: 0,
    hintTiers: {},
    failedAttempts: 0,
    playTimeMs: 0,
    gameCompleted: false,
    ending: null,
  };
}
