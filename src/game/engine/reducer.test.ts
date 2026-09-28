import { describe, expect, it } from 'vitest';
import { evaluateAchievements } from '../achievements';
import { SAFE_CODE } from '../data/books';
import { HINT_STAGES } from '../data/hints';
import { sanitizeSave } from '../persistence';
import type { GameAction, GameEvent, GameState } from '../types';
import { createInitialState } from './initialState';
import { currentHintStage, reduce } from './reducer';

function run(actions: GameAction[], start: GameState = createInitialState()) {
  let state = start;
  const events: GameEvent[] = [];
  for (const action of actions) {
    const result = reduce(state, action);
    state = result.state;
    events.push(...result.events);
  }
  return { state, events };
}

const narrations = (events: GameEvent[]) =>
  events.filter((e): e is Extract<GameEvent, { type: 'narrate' }> => e.type === 'narrate').map((e) => e.text.en);

/** The intended critical path, step by step. */
const CRITICAL_PATH: GameAction[] = [
  { type: 'BEGIN_EXPLORATION' },
  { type: 'OPEN_OBJECT', object: 'memo' },
  { type: 'CLOSE_SCENE' },
  { type: 'OPEN_OBJECT', object: 'painting' },
  { type: 'DISCOVER_CLUE', clue: 'painting_tower' },
  { type: 'CLOSE_SCENE' },
  { type: 'OPEN_OBJECT', object: 'clock' },
  { type: 'SET_CLOCK', time: { hour: 9, minute: 45 } },
  { type: 'TAKE', pickup: 'clock_key' },
  { type: 'CLOSE_SCENE' },
  { type: 'USE_ITEM', item: 'brass_key', target: 'drawer' },
  { type: 'TAKE', pickup: 'drawer_photo' },
  { type: 'TAKE', pickup: 'drawer_note' },
  { type: 'CLOSE_SCENE' },
  { type: 'COMBINE', a: 'note_left', b: 'note_right' },
  { type: 'CLOSE_SCENE' },
  { type: 'OPEN_ITEM', item: 'photograph' },
  { type: 'CLOSE_SCENE' },
  { type: 'OPEN_OBJECT', object: 'bookshelf' },
  { type: 'PULL_BOOK', book: 'feather' },
  { type: 'PULL_BOOK', book: 'hourglass' },
  { type: 'PULL_BOOK', book: 'candle' },
  { type: 'PULL_BOOK', book: 'moon' },
  { type: 'TAKE', pickup: 'shelf_journal' },
  { type: 'CLOSE_SCENE' },
  { type: 'CLOSE_SCENE' },
  { type: 'OPEN_OBJECT', object: 'lamp' },
  { type: 'USE_ITEM', item: 'journal', target: 'lamp' },
  { type: 'CLOSE_SCENE' },
  { type: 'OPEN_OBJECT', object: 'safe' },
  { type: 'SUBMIT_CODE', puzzle: 'safe', code: SAFE_CODE },
  { type: 'TAKE', pickup: 'safe_key' },
  { type: 'TAKE', pickup: 'safe_letter' },
  { type: 'READ_PAGE', doc: 'letter', page: 0 },
  { type: 'CLOSE_SCENE' },
  { type: 'CLOSE_SCENE' },
  { type: 'USE_ITEM', item: 'iron_key', target: 'door' },
  { type: 'SUBMIT_CODE', puzzle: 'door', code: '1152' },
];

describe('puzzle chain', () => {
  it('safe code is derived from the four friends', () => {
    expect(SAFE_CODE).toBe('7392');
  });

  it('can be played from start to the normal ending', () => {
    const { state, events } = run(CRITICAL_PATH);
    expect(state.phase).toBe('escape');
    expect(state.solvedPuzzles).toEqual(['clock', 'note', 'bookshelf', 'ink', 'safe', 'door']);
    expect(events.some((e) => e.type === 'escapeStarted')).toBe(true);

    const finished = reduce(state, { type: 'FINISH_ESCAPE' }).state;
    expect(finished.phase).toBe('ending');
    expect(finished.ending).toBe('escaped');
    expect(finished.gameCompleted).toBe(true);
    expect(evaluateAchievements(finished)).toContain('first_escape');
    expect(evaluateAchievements(finished)).not.toContain('true_ending');
  });

  it('every puzzle depends on an earlier result', () => {
    // Drawer cannot be opened without the clock's key.
    const early = run([{ type: 'BEGIN_EXPLORATION' }, { type: 'TAKE', pickup: 'drawer_photo' }]).state;
    expect(early.inventory).not.toContain('photograph');

    // The door dial refuses input until the iron key is turned.
    const { state, events } = run([
      { type: 'BEGIN_EXPLORATION' },
      { type: 'OPEN_OBJECT', object: 'door' },
      { type: 'SUBMIT_CODE', puzzle: 'door', code: '1152' },
    ]);
    expect(state.solvedPuzzles).not.toContain('door');
    expect(narrations(events).join()).toMatch(/lock is still engaged/);
  });

  it('wrong inputs give feedback and allow retrying', () => {
    const { state, events } = run([
      ...CRITICAL_PATH.slice(0, 30),
      { type: 'SUBMIT_CODE', puzzle: 'safe', code: '1234' },
      { type: 'SUBMIT_CODE', puzzle: 'safe', code: '2937' },
    ]);
    expect(state.solvedPuzzles).not.toContain('safe');
    expect(state.failedAttempts).toBe(2);
    expect(events.filter((e) => e.type === 'puzzleFailed')).toHaveLength(2);
    expect(narrations(events)).toContain('Close. But the photograph reads left to right.');
    const retry = reduce(state, { type: 'SUBMIT_CODE', puzzle: 'safe', code: '7392' });
    expect(retry.state.solvedPuzzles).toContain('safe');
  });

  it('bookshelf resets after a wrong sequence and explains near misses', () => {
    const base = run(CRITICAL_PATH.slice(0, 19)).state;
    const { state, events } = run(
      [
        { type: 'PULL_BOOK', book: 'moon' },
        { type: 'PULL_BOOK', book: 'feather' },
        { type: 'PULL_BOOK', book: 'hourglass' },
        { type: 'PULL_BOOK', book: 'candle' },
      ],
      base,
    );
    expect(state.bookPulls).toEqual([]);
    expect(narrations(events)).toContain('The right friends — in the wrong order.');
  });

  it('door explains the 9:45 mistake', () => {
    const beforeDoorCode = run(CRITICAL_PATH.slice(0, -1)).state;
    const { state, events } = run([{ type: 'SUBMIT_CODE', puzzle: 'door', code: '0945' }], beforeDoorCode);
    expect(state.phase).not.toBe('escape');
    expect(narrations(events).join()).toMatch(/came home/);
  });

  it('lamp must be on to reveal the lemon ink', () => {
    const path = CRITICAL_PATH.slice(0, 26);
    const { state, events } = run([...path, { type: 'USE_ITEM', item: 'journal', target: 'lamp' }]);
    expect(state.flags.inkRevealed).toBe(false);
    expect(narrations(events).join()).toMatch(/bulb is cold/);
  });
});

describe('secret ending', () => {
  const SECRET_STEPS: GameAction[] = [
    ...CRITICAL_PATH.slice(0, 34),
    { type: 'READ_PAGE', doc: 'letter', page: 1 },
    { type: 'CLOSE_SCENE' },
    { type: 'CLOSE_SCENE' },
    { type: 'USE_ITEM', item: 'photograph', target: 'lamp' },
    { type: 'CLOSE_SCENE' },
    { type: 'OPEN_OBJECT', object: 'clock' },
    { type: 'SET_CLOCK', time: { hour: 11, minute: 52 } },
    { type: 'CLOSE_SCENE' },
    { type: 'USE_ITEM', item: 'iron_key', target: 'door' },
    { type: 'SUBMIT_CODE', puzzle: 'door', code: '1152' },
    { type: 'FINISH_ESCAPE' },
  ];

  it('is reached only through the three deliberate behaviours', () => {
    const { state } = run(SECRET_STEPS);
    expect(state.flags.psRead).toBe(true);
    expect(state.flags.photoTruth).toBe(true);
    expect(state.flags.houseRemembers).toBe(true);
    expect(state.ending).toBe('secret');
    expect(evaluateAchievements(state)).toContain('true_ending');
  });

  it('order matters: restoring the hour before learning the truth does nothing', () => {
    const steps = [...SECRET_STEPS];
    // Move the clock restore before reading the P.S.
    const clockIdx = steps.findIndex((a) => a.type === 'SET_CLOCK' && a.time.hour === 11);
    const [restore] = steps.splice(clockIdx, 1);
    const psIdx = steps.findIndex((a) => a.type === 'READ_PAGE' && a.doc === 'letter' && a.page === 1);
    steps.splice(psIdx, 0, { type: 'OPEN_OBJECT', object: 'clock' }, restore!, { type: 'CLOSE_SCENE' });
    const { state } = run(steps);
    expect(state.ending).toBe('escaped');
  });
});

describe('debug mode', () => {
  it('solveAll leaves a consistent state right before the door', () => {
    const { state } = run([{ type: 'BEGIN_EXPLORATION' }, { type: 'DEBUG', command: { cmd: 'solveAll' } }]);
    expect(state.solvedPuzzles).toHaveLength(5);
    expect([...state.inventory].sort()).toEqual(['ink_page', 'iron_key', 'journal', 'letter', 'note_full', 'photograph']);
    const escaped = run(
      [
        { type: 'USE_ITEM', item: 'iron_key', target: 'door' },
        { type: 'SUBMIT_CODE', puzzle: 'door', code: '11:52' },
      ],
      state,
    ).state;
    expect(escaped.phase).toBe('escape');
  });
});

describe('hints', () => {
  it('advance through three tiers and count usage', () => {
    const start = run([{ type: 'BEGIN_EXPLORATION' }]).state;
    expect(currentHintStage(start)?.id).toBe(HINT_STAGES[0]!.id);
    const { state } = run(
      [{ type: 'REQUEST_HINT' }, { type: 'REQUEST_HINT' }, { type: 'REQUEST_HINT' }, { type: 'REQUEST_HINT' }],
      start,
    );
    expect(state.hintCount).toBe(3);
    expect(state.hintTiers.memo).toBe(3);
  });

  it('stage follows progress', () => {
    const afterClock = run(CRITICAL_PATH.slice(0, 8)).state;
    expect(currentHintStage(afterClock)?.id).toBe('clock_key');
  });
});

describe('play time', () => {
  it('only accrues while playing', () => {
    let state = createInitialState();
    state = reduce(state, { type: 'TICK', deltaMs: 1000 }).state;
    expect(state.playTimeMs).toBe(0);
    state = reduce(state, { type: 'BEGIN_EXPLORATION' }).state;
    state = reduce(state, { type: 'TICK', deltaMs: 1000 }).state;
    state = reduce(state, { type: 'TICK', deltaMs: 60_000 }).state; // clamped (tab was asleep)
    expect(state.playTimeMs).toBe(6000);
  });
});

describe('save data', () => {
  it('round-trips a mid-game state', () => {
    const mid = run(CRITICAL_PATH.slice(0, 20)).state;
    const restored = sanitizeSave(JSON.parse(JSON.stringify(mid)));
    expect(restored).not.toBeNull();
    expect(restored!.inventory).toEqual(mid.inventory);
    expect(restored!.solvedPuzzles).toEqual(mid.solvedPuzzles);
    expect(restored!.scene).toBeNull();
    expect(restored!.phase).toBe('exploration');
  });

  it('survives corrupted data', () => {
    expect(sanitizeSave(null)).toBeNull();
    expect(sanitizeSave('garbage')).toBeNull();
    expect(sanitizeSave({ version: 999 })).toBeNull();
    const repaired = sanitizeSave({
      version: 1,
      inventory: ['brass_key', 'not_an_item', 42],
      flags: { lampOn: 'yes', drawerOpen: true },
      clock: { hour: 99, minute: -5 },
      playTimeMs: 'NaN',
      bookPulls: ['moon'],
    });
    expect(repaired).not.toBeNull();
    expect(repaired!.inventory).toEqual(['brass_key']);
    expect(repaired!.collectedItems).toContain('brass_key');
    expect(repaired!.flags.lampOn).toBe(false);
    expect(repaired!.flags.drawerOpen).toBe(true);
    expect(repaired!.clock).toEqual({ hour: 12, minute: 0 });
    expect(repaired!.playTimeMs).toBe(0);
    expect(repaired!.bookPulls).toEqual([]);
  });

  it('a refresh during the escape cinematic lands on the ending', () => {
    const escaping = run(CRITICAL_PATH).state;
    const restored = sanitizeSave(JSON.parse(JSON.stringify(escaping)));
    expect(restored!.phase).toBe('ending');
    expect(restored!.ending).toBe('escaped');
  });
});
