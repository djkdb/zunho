import { ACHIEVEMENTS, FAST_ESCAPE_MS } from './data/endings';
import { safeStorage } from './storage';
import type { AchievementId, GameState } from './types';
import { OBJECT_IDS } from './types';

export const ACHIEVEMENTS_KEY = 'the-last-room.achievements.v1';

export type AchievementRecord = Partial<Record<AchievementId, number>>;

const KNOWN = new Set<string>(ACHIEVEMENTS.map((a) => a.id));

export function loadAchievements(): AchievementRecord {
  const raw = safeStorage.readJson<unknown>(ACHIEVEMENTS_KEY);
  const out: AchievementRecord = {};
  if (typeof raw !== 'object' || raw === null) return out;
  for (const [id, at] of Object.entries(raw as Record<string, unknown>)) {
    if (KNOWN.has(id) && typeof at === 'number' && Number.isFinite(at)) out[id as AchievementId] = at;
  }
  return out;
}

/** Pure: which achievements does this finished run earn? */
export function evaluateAchievements(state: GameState): AchievementId[] {
  if (!state.gameCompleted) return [];
  const earned: AchievementId[] = ['first_escape'];
  if (state.hintCount === 0) earned.push('no_hint');
  if (state.playTimeMs < FAST_ESCAPE_MS) earned.push('fast_escape');
  if (OBJECT_IDS.every((id) => state.discoveredObjects.includes(id))) earned.push('perfect_observer');
  if (state.ending === 'secret') earned.push('true_ending');
  return earned;
}

/** Records newly earned achievements and returns only the new ones. */
export function recordAchievements(state: GameState, now = Date.now()): AchievementId[] {
  const record = loadAchievements();
  const fresh = evaluateAchievements(state).filter((id) => record[id] === undefined);
  if (fresh.length === 0) return [];
  for (const id of fresh) record[id] = now;
  safeStorage.writeJson(ACHIEVEMENTS_KEY, record);
  return fresh;
}

export function clearAchievements(): void {
  safeStorage.remove(ACHIEVEMENTS_KEY);
}
