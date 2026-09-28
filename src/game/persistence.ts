import { createFlags, createInitialState, SAVE_VERSION } from './engine/initialState';
import { resolveEnding } from './engine/reducer';
import { safeStorage } from './storage';
import type { ClockTime, DocId, GamePhase, GameState } from './types';
import { BOOK_IDS, CLUE_IDS, DOC_IDS, FLAG_IDS, ITEM_IDS, OBJECT_IDS, PICKUP_IDS, PUZZLE_IDS } from './types';

export const SAVE_KEY = 'the-last-room.save.v1';

type Unknown = Record<string, unknown>;

function isRecord(value: unknown): value is Unknown {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Keeps only known ids, de-duplicated, preserving order. */
function idList<T extends string>(value: unknown, allowed: readonly T[]): T[] {
  if (!Array.isArray(value)) return [];
  const set = new Set<T>();
  for (const entry of value) if (typeof entry === 'string' && allowed.includes(entry as T)) set.add(entry as T);
  return [...set];
}

function finiteNumber(value: unknown, fallback: number, min = 0, max = Number.MAX_SAFE_INTEGER): number {
  return typeof value === 'number' && Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : fallback;
}

function clockTime(value: unknown, fallback: ClockTime): ClockTime {
  if (!isRecord(value)) return fallback;
  const hour = finiteNumber(value.hour, fallback.hour, 1, 12);
  const minute = finiteNumber(value.minute, fallback.minute, 0, 59);
  return { hour: Math.round(hour), minute: Math.round(minute) };
}

/**
 * Turns anything read from storage into a valid GameState.
 * Unknown/corrupted fields fall back to defaults instead of crashing the game.
 * Returns null when the payload is not a save at all.
 */
export function sanitizeSave(raw: unknown): GameState | null {
  if (!isRecord(raw) || raw.version !== SAVE_VERSION) return null;
  const base = createInitialState();

  const flags = createFlags();
  if (isRecord(raw.flags)) for (const f of FLAG_IDS) flags[f] = raw.flags[f] === true;

  const readPages: Partial<Record<DocId, number>> = {};
  if (isRecord(raw.readPages)) {
    for (const doc of DOC_IDS) {
      const page = raw.readPages[doc];
      if (typeof page === 'number' && Number.isInteger(page) && page >= 0 && page < 20) readPages[doc] = page;
    }
  }

  const hintTiers: Record<string, number> = {};
  if (isRecord(raw.hintTiers)) {
    for (const [key, tier] of Object.entries(raw.hintTiers)) {
      if (typeof tier === 'number' && tier >= 0 && tier <= 3) hintTiers[key] = Math.floor(tier);
    }
  }

  const state: GameState = {
    ...base,
    phase: typeof raw.phase === 'string' ? (raw.phase as GamePhase) : 'exploration',
    discoveredObjects: idList(raw.discoveredObjects, OBJECT_IDS),
    inventory: idList(raw.inventory, ITEM_IDS),
    collectedItems: idList(raw.collectedItems, ITEM_IDS),
    takenPickups: idList(raw.takenPickups, PICKUP_IDS),
    solvedPuzzles: idList(raw.solvedPuzzles, PUZZLE_IDS),
    clues: idList(raw.clues, CLUE_IDS),
    flags,
    clock: clockTime(raw.clock, base.clock),
    bookPulls: idList(raw.bookPulls, BOOK_IDS).slice(0, 4),
    readPages,
    hintCount: Math.floor(finiteNumber(raw.hintCount, 0, 0, 999)),
    hintTiers,
    failedAttempts: Math.floor(finiteNumber(raw.failedAttempts, 0, 0, 99999)),
    playTimeMs: finiteNumber(raw.playTimeMs, 0, 0, 1000 * 60 * 60 * 99),
    gameCompleted: raw.gameCompleted === true,
    ending: raw.ending === 'escaped' || raw.ending === 'secret' ? raw.ending : null,
  };

  // Inventory must be a subset of what was ever collected.
  for (const item of state.inventory) {
    if (!state.collectedItems.includes(item)) state.collectedItems = [...state.collectedItems, item];
  }
  // A bookshelf that was mid-sequence restarts cleanly.
  if (!state.solvedPuzzles.includes('bookshelf')) state.bookPulls = [];

  return normalizeForResume(state);
}

/**
 * Transient UI state (open scene, held item, mid-cinematic phases)
 * is never restored — the player resumes standing in the room.
 */
export function normalizeForResume(state: GameState): GameState {
  let phase: GamePhase = state.phase;
  let ending = state.ending;
  let gameCompleted = state.gameCompleted;

  if (phase === 'escape' || (state.flags.finalDoorUnlocked && !gameCompleted)) {
    // Refreshed during the door cinematic: the escape already happened.
    phase = 'ending';
    ending = resolveEnding(state);
    gameCompleted = true;
  } else if (gameCompleted) {
    phase = 'ending';
    ending = ending ?? resolveEnding(state);
  } else if (phase !== 'intro') {
    phase = 'exploration';
  }

  return { ...state, phase, ending, gameCompleted, scene: null, prevScene: null, heldItem: null };
}

export function loadGame(): GameState | null {
  return sanitizeSave(safeStorage.readJson<unknown>(SAVE_KEY));
}

/** A run that has not left the intro yet is not worth resuming. */
export function isWorthSaving(state: GameState): boolean {
  return !(state.phase === 'intro' && state.playTimeMs === 0 && state.discoveredObjects.length === 0);
}

export function saveGame(state: GameState): void {
  if (!isWorthSaving(state)) return;
  safeStorage.writeJson(SAVE_KEY, { ...state, scene: null, prevScene: null, heldItem: null });
}

export function clearSave(): void {
  safeStorage.remove(SAVE_KEY);
}

export function hasResumableSave(): boolean {
  const save = loadGame();
  return !!save && !save.gameCompleted;
}
