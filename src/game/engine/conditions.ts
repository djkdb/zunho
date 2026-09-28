import type { Condition, GameState } from '../types';

export function check(condition: Condition | undefined, state: GameState): boolean {
  if (!condition) return true;
  if ('has' in condition) return state.inventory.includes(condition.has);
  if ('lacks' in condition) return !state.inventory.includes(condition.lacks);
  if ('collected' in condition) return state.collectedItems.includes(condition.collected);
  if ('notCollected' in condition) return !state.collectedItems.includes(condition.notCollected);
  if ('flag' in condition) return state.flags[condition.flag] === (condition.is ?? true);
  if ('solved' in condition) return state.solvedPuzzles.includes(condition.solved);
  if ('notSolved' in condition) return !state.solvedPuzzles.includes(condition.notSolved);
  if ('clue' in condition) return state.clues.includes(condition.clue);
  if ('taken' in condition) return state.takenPickups.includes(condition.taken);
  if ('any' in condition) return condition.any.some((c) => check(c, state));
  if ('all' in condition) return condition.all.every((c) => check(c, state));
  return false;
}
