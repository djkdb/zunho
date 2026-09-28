/**
 * Core domain types for THE LAST ROOM.
 * Nothing in this file (or anything under src/game) depends on React.
 */

export type Lang = 'en' | 'ko';

export interface LocalizedText {
  en: string;
  ko: string;
}

/* ------------------------------------------------------------------ */
/* Identifiers                                                         */
/* ------------------------------------------------------------------ */

export const OBJECT_IDS = [
  'door',
  'clock',
  'painting',
  'bookshelf',
  'memo',
  'drawer',
  'lamp',
  'safe',
  'window',
  'basket',
] as const;
export type ObjectId = (typeof OBJECT_IDS)[number];

export const ITEM_IDS = [
  'note_left',
  'note_right',
  'note_full',
  'brass_key',
  'photograph',
  'journal',
  'ink_page',
  'iron_key',
  'letter',
] as const;
export type ItemId = (typeof ITEM_IDS)[number];

export const PUZZLE_IDS = ['clock', 'note', 'bookshelf', 'ink', 'safe', 'door'] as const;
export type PuzzleId = (typeof PUZZLE_IDS)[number];

export const CLUE_IDS = [
  'clock_stopped',
  'painting_plaque',
  'painting_tower',
  'note_rule',
  'photo_order',
  'journal_friends',
  'ink_safe',
  'letter_hour',
  'letter_ps',
  'photo_truth',
  'window_tally',
  'basket_draft',
] as const;
export type ClueId = (typeof CLUE_IDS)[number];

export const FLAG_IDS = [
  'lampOn',
  'clockCaseOpen',
  'drawerOpen',
  'shelfOpen',
  'inkRevealed',
  'safeOpen',
  'doorKeyInserted',
  'finalDoorUnlocked',
  'psRead',
  'photoTruth',
  'houseRemembers',
] as const;
export type FlagId = (typeof FLAG_IDS)[number];

export const BOOK_IDS = [
  'feather',
  'hourglass',
  'candle',
  'moon',
  'anchor',
  'leaf',
  'eye',
  'key',
  'star',
  'sun',
] as const;
export type BookId = (typeof BOOK_IDS)[number];

export const PICKUP_IDS = [
  'memo_note',
  'clock_key',
  'drawer_photo',
  'drawer_note',
  'shelf_journal',
  'safe_key',
  'safe_letter',
] as const;
export type PickupId = (typeof PICKUP_IDS)[number];

export const DOC_IDS = ['note_left', 'note_right', 'note_full', 'journal', 'ink_page', 'letter', 'photograph'] as const;
export type DocId = (typeof DOC_IDS)[number];

export type EndingId = 'escaped' | 'secret';

export type AchievementId = 'first_escape' | 'no_hint' | 'fast_escape' | 'perfect_observer' | 'true_ending';

/** Targets an item can be used on: room objects plus sub-parts inside scenes. */
export type TargetId = ObjectId | 'door_keyhole' | 'drawer_keyhole';

/** What the investigation layer is currently showing. */
export type SceneRef =
  | { kind: 'object'; id: ObjectId }
  | { kind: 'item'; id: ItemId; page?: number };

export type GamePhase = 'intro' | 'exploration' | 'investigation' | 'puzzle' | 'escape' | 'ending';

export type PuzzleType = 'observation' | 'combination' | 'sequence' | 'discovery' | 'numeric' | 'final';

export interface ClockTime {
  hour: number; // 1..12
  minute: number; // 0..55, step 5 (the stopped time 11:52 is the only off-grid value)
}

/* ------------------------------------------------------------------ */
/* State                                                               */
/* ------------------------------------------------------------------ */

export type Flags = Record<FlagId, boolean>;

export interface GameState {
  version: number;
  phase: GamePhase;
  scene: SceneRef | null;
  /** Scene to return to when the current (item) scene closes. */
  prevScene: SceneRef | null;
  /** Item currently "held" by the player (UI selection, not persisted). */
  heldItem: ItemId | null;

  discoveredObjects: ObjectId[];
  inventory: ItemId[];
  collectedItems: ItemId[];
  takenPickups: PickupId[];
  solvedPuzzles: PuzzleId[];
  clues: ClueId[];
  flags: Flags;

  clock: ClockTime;
  bookPulls: BookId[];
  readPages: Partial<Record<DocId, number>>;

  hintCount: number;
  hintTiers: Partial<Record<string, number>>;
  failedAttempts: number;
  playTimeMs: number;

  gameCompleted: boolean;
  ending: EndingId | null;
}

/* ------------------------------------------------------------------ */
/* Data-driven rules                                                   */
/* ------------------------------------------------------------------ */

export type Condition =
  | { has: ItemId }
  | { lacks: ItemId }
  | { collected: ItemId }
  | { notCollected: ItemId }
  | { flag: FlagId; is?: boolean }
  | { solved: PuzzleId }
  | { notSolved: PuzzleId }
  | { clue: ClueId }
  | { taken: PickupId }
  | { any: Condition[] }
  | { all: Condition[] };

export type SfxId =
  | 'uiClick'
  | 'uiHover'
  | 'objectClick'
  | 'drawerOpen'
  | 'locked'
  | 'unlock'
  | 'error'
  | 'pickup'
  | 'safeOpen'
  | 'doorOpen'
  | 'success'
  | 'discovery'
  | 'pageTurn'
  | 'bookSlide'
  | 'bookReset'
  | 'keypad'
  | 'clockTick'
  | 'clockChime'
  | 'lampClick'
  | 'paper'
  | 'combine'
  | 'bolt';

export type FxId = 'flash' | 'flashWarm' | 'shake' | 'shakeSoft' | 'sparks' | 'dust' | 'reveal' | 'pulse';

export type NarrationTone = 'info' | 'error' | 'success' | 'discovery';

export type Effect =
  | { type: 'giveItem'; item: ItemId }
  | { type: 'removeItem'; item: ItemId }
  | { type: 'setFlag'; flag: FlagId; value: boolean }
  | { type: 'addClue'; clue: ClueId }
  | { type: 'solvePuzzle'; puzzle: PuzzleId }
  | { type: 'openScene'; scene: SceneRef }
  | { type: 'sfx'; id: SfxId }
  | { type: 'fx'; id: FxId }
  | { type: 'narrate'; text: LocalizedText; tone?: NarrationTone };

export type GameEvent =
  | { type: 'sfx'; id: SfxId }
  | { type: 'fx'; id: FxId }
  | { type: 'narrate'; text: LocalizedText; tone: NarrationTone }
  | { type: 'itemAcquired'; item: ItemId }
  | { type: 'clueFound'; clue: ClueId }
  | { type: 'puzzleSolved'; puzzle: PuzzleId }
  | { type: 'puzzleFailed'; puzzle: PuzzleId }
  | { type: 'escapeStarted' }
  | { type: 'ending'; ending: EndingId };

/* ------------------------------------------------------------------ */
/* Actions                                                             */
/* ------------------------------------------------------------------ */

export type DebugCommand =
  | { cmd: 'solveAll' }
  | { cmd: 'giveAllItems' }
  | { cmd: 'solvePuzzle'; puzzle: PuzzleId }
  | { cmd: 'setPlayTime'; ms: number }
  | { cmd: 'setFlag'; flag: FlagId; value: boolean }
  | { cmd: 'prepareSecret' }
  | { cmd: 'forceEnding'; ending: EndingId };

export type GameAction =
  | { type: 'NEW_GAME' }
  | { type: 'LOAD'; state: GameState }
  | { type: 'BEGIN_EXPLORATION' }
  | { type: 'OPEN_OBJECT'; object: ObjectId }
  | { type: 'OPEN_ITEM'; item: ItemId; page?: number }
  | { type: 'CLOSE_SCENE' }
  | { type: 'HOLD_ITEM'; item: ItemId | null }
  | { type: 'TOGGLE_LAMP' }
  | { type: 'TAKE'; pickup: PickupId }
  | { type: 'USE_ITEM'; item: ItemId; target: TargetId }
  | { type: 'COMBINE'; a: ItemId; b: ItemId }
  | { type: 'SET_CLOCK'; time: ClockTime }
  | { type: 'PULL_BOOK'; book: BookId }
  | { type: 'SUBMIT_CODE'; puzzle: 'safe' | 'door'; code: string }
  | { type: 'READ_PAGE'; doc: DocId; page: number }
  | { type: 'DISCOVER_CLUE'; clue: ClueId }
  | { type: 'REQUEST_HINT' }
  | { type: 'TICK'; deltaMs: number }
  | { type: 'FINISH_ESCAPE' }
  | { type: 'DEBUG'; command: DebugCommand };

export interface ReduceResult {
  state: GameState;
  events: GameEvent[];
}
