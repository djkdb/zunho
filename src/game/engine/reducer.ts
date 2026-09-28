import { DOCS } from '../data/docs';
import { ENDINGS } from '../data/endings';
import { HINT_STAGES } from '../data/hints';
import { COMBINATIONS, DEFAULT_COMBINE_FAIL, DEFAULT_USE_FAIL, INTERACTIONS, PICKUPS } from '../data/interactions';
import { ITEMS } from '../data/items';
import { OBJECTS } from '../data/objects';
import { FRIEND_ORDER } from '../data/books';
import { PUZZLES, STOPPED_TIME, sameTime } from '../data/puzzles';
import type { PuzzleAnswer } from '../data/puzzles';
import { L } from '../i18n';
import type {
  ClockTime,
  ClueId,
  DebugCommand,
  DocId,
  Effect,
  EndingId,
  GameAction,
  GameEvent,
  GamePhase,
  GameState,
  ItemId,
  NarrationTone,
  ObjectId,
  PickupId,
  PuzzleId,
  ReduceResult,
  SceneRef,
  LocalizedText,
  TargetId,
} from '../types';
import { BOOK_IDS, CLUE_IDS, ITEM_IDS, PUZZLE_IDS } from '../types';
import { check } from './conditions';
import { createInitialState } from './initialState';

const PLAYABLE_PHASES: ReadonlySet<GamePhase> = new Set(['exploration', 'investigation', 'puzzle']);
const MAX_TICK_MS = 5000;

/**
 * A small mutable wrapper used while reducing a single action.
 * Arrays/objects are replaced (never mutated) so unchanged slices keep
 * referential identity — React selectors rely on that.
 */
class Transaction {
  state: GameState;
  readonly events: GameEvent[] = [];

  constructor(base: GameState) {
    this.state = { ...base };
  }

  emit(event: GameEvent): void {
    this.events.push(event);
  }

  narrate(text: LocalizedText, tone: NarrationTone = 'info'): void {
    this.emit({ type: 'narrate', text, tone });
  }

  giveItem(item: ItemId): void {
    const s = this.state;
    if (!s.inventory.includes(item)) s.inventory = [...s.inventory, item];
    if (!s.collectedItems.includes(item)) s.collectedItems = [...s.collectedItems, item];
    this.emit({ type: 'itemAcquired', item });
  }

  removeItem(item: ItemId): void {
    const s = this.state;
    if (s.inventory.includes(item)) s.inventory = s.inventory.filter((i) => i !== item);
    if (s.heldItem === item) s.heldItem = null;
  }

  addClue(clue: ClueId): void {
    const s = this.state;
    if (s.clues.includes(clue)) return;
    s.clues = [...s.clues, clue];
    this.emit({ type: 'clueFound', clue });
  }

  setFlag(flag: keyof GameState['flags'], value: boolean): void {
    if (this.state.flags[flag] === value) return;
    this.state.flags = { ...this.state.flags, [flag]: value };
  }

  openScene(scene: SceneRef): void {
    const s = this.state;
    if (scene.kind === 'item' && s.scene?.kind === 'object') s.prevScene = s.scene;
    else if (scene.kind === 'object') s.prevScene = null;
    s.scene = scene;
    if (scene.kind === 'object') this.discover(scene.id);
    if (scene.kind === 'item' && ITEMS[scene.id].doc) this.readPage(ITEMS[scene.id].doc as DocId, scene.page ?? 0);
    this.syncPhase();
  }

  closeScene(): void {
    const s = this.state;
    s.scene = s.prevScene;
    s.prevScene = null;
    this.syncPhase();
  }

  discover(object: ObjectId): void {
    const s = this.state;
    if (!s.discoveredObjects.includes(object)) s.discoveredObjects = [...s.discoveredObjects, object];
  }

  readPage(doc: DocId, page: number): void {
    const def = DOCS[doc];
    const safePage = Math.max(0, Math.min(def.pages.length - 1, Math.floor(page)));
    const s = this.state;
    const prev = s.readPages[doc] ?? -1;
    if (safePage > prev) s.readPages = { ...s.readPages, [doc]: safePage };
    const pageDef = def.pages[safePage];
    if (pageDef?.onRead) this.apply(pageDef.onRead);
  }

  solvePuzzle(puzzle: PuzzleId): void {
    const s = this.state;
    if (s.solvedPuzzles.includes(puzzle)) return;
    s.solvedPuzzles = [...s.solvedPuzzles, puzzle];
    this.apply(PUZZLES[puzzle].onSolve);
    this.emit({ type: 'puzzleSolved', puzzle });
    this.syncPhase();
  }

  apply(effects: Effect[]): void {
    for (const effect of effects) {
      switch (effect.type) {
        case 'giveItem':
          this.giveItem(effect.item);
          break;
        case 'removeItem':
          this.removeItem(effect.item);
          break;
        case 'setFlag':
          this.setFlag(effect.flag, effect.value);
          break;
        case 'addClue':
          this.addClue(effect.clue);
          break;
        case 'solvePuzzle':
          this.solvePuzzle(effect.puzzle);
          break;
        case 'openScene':
          this.openScene(effect.scene);
          break;
        case 'sfx':
          this.emit({ type: 'sfx', id: effect.id });
          break;
        case 'fx':
          this.emit({ type: 'fx', id: effect.id });
          break;
        case 'narrate':
          this.narrate(effect.text, effect.tone);
          break;
      }
    }
  }

  /** Keeps `phase` consistent with what is on screen. */
  syncPhase(): void {
    const s = this.state;
    if (!PLAYABLE_PHASES.has(s.phase)) return;
    if (!s.scene) s.phase = 'exploration';
    else if (s.scene.kind === 'object') {
      const puzzle = OBJECTS[s.scene.id].puzzle;
      s.phase = puzzle && !s.solvedPuzzles.includes(puzzle) ? 'puzzle' : 'investigation';
    } else s.phase = 'investigation';
  }
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function attemptPuzzle(tx: Transaction, id: PuzzleId, answer: PuzzleAnswer): void {
  const def = PUZZLES[id];
  const s = tx.state;
  if (s.solvedPuzzles.includes(id) || !def.evaluate) return;
  if (!check(def.requires, s)) {
    if (def.blockedText) tx.narrate(def.blockedText, 'error');
    tx.emit({ type: 'sfx', id: 'locked' });
    return;
  }
  const verdict = def.evaluate(answer, s);
  if (verdict.ok) {
    tx.solvePuzzle(id);
    if (id === 'door') beginEscape(tx);
    return;
  }
  s.failedAttempts += 1;
  tx.emit({ type: 'puzzleFailed', puzzle: id });
  tx.emit({ type: 'sfx', id: verdict.soft ? 'clockTick' : 'error' });
  tx.emit({ type: 'fx', id: verdict.soft ? 'shakeSoft' : 'shake' });
  tx.narrate(verdict.feedback ?? L('Something is wrong...', '무언가 잘못됐다...'), 'error');
}

function beginEscape(tx: Transaction): void {
  const s = tx.state;
  s.phase = 'escape';
  s.scene = null;
  s.prevScene = null;
  s.heldItem = null;
  tx.emit({ type: 'escapeStarted' });
}

export function resolveEnding(state: GameState): EndingId {
  const sorted = [...ENDINGS].sort((a, b) => a.priority - b.priority);
  return (sorted.find((e) => check(e.when, state)) ?? sorted[sorted.length - 1]!).id;
}

function takePickup(tx: Transaction, pickupId: PickupId): void {
  const pickup = PICKUPS[pickupId];
  const s = tx.state;
  if (s.takenPickups.includes(pickupId) || !check(pickup.requires, s)) return;
  s.takenPickups = [...s.takenPickups, pickupId];
  tx.discover(pickup.object);
  tx.giveItem(pickup.item);
  tx.emit({ type: 'sfx', id: 'pickup' });
  const name = ITEMS[pickup.item].name;
  tx.narrate({ en: `Acquired: ${name.en}`, ko: `획득: ${name.ko}` }, 'success');
  if (pickup.inspect) tx.openScene({ kind: 'item', id: pickup.item });
}

function isValidTime(time: ClockTime): boolean {
  return (
    Number.isInteger(time.hour) &&
    Number.isInteger(time.minute) &&
    time.hour >= 1 &&
    time.hour <= 12 &&
    time.minute >= 0 &&
    time.minute <= 59
  );
}

function setClock(tx: Transaction, time: ClockTime): void {
  if (!isValidTime(time)) return;
  const s = tx.state;
  s.clock = { hour: time.hour, minute: time.minute };
  tx.emit({ type: 'sfx', id: 'clockTick' });

  if (!s.solvedPuzzles.includes('clock')) {
    attemptPuzzle(tx, 'clock', { kind: 'clock', time });
    return;
  }

  // After the first puzzle the clock becomes the key to the secret ending:
  // "give the house back its hour" — only meaningful once the truth is known.
  const atStoppedHour = sameTime(time, STOPPED_TIME);
  if (atStoppedHour && s.flags.psRead && s.flags.photoTruth) {
    if (!s.flags.houseRemembers) {
      tx.setFlag('houseRemembers', true);
      tx.emit({ type: 'sfx', id: 'clockChime' });
      tx.emit({ type: 'fx', id: 'flashWarm' });
      tx.narrate(
        L(
          'The hands come to rest at 11:52. Somewhere in the walls, something exhales. The house remembers.',
          '바늘이 11시 52분에 멈춘다. 벽 어딘가에서 숨을 내쉬는 소리. 이 집이 기억해냈다.',
        ),
        'discovery',
      );
    }
  } else {
    if (s.flags.houseRemembers) tx.setFlag('houseRemembers', false);
    if (atStoppedHour) {
      tx.narrate(
        L('11:52. The room seems to hold its breath — then nothing.', '11시 52분. 방이 숨을 죽인다 — 그리고 아무 일도 없다.'),
      );
    }
  }
}

function pullBook(tx: Transaction, book: (typeof BOOK_IDS)[number]): void {
  const s = tx.state;
  if (s.solvedPuzzles.includes('bookshelf') || s.bookPulls.includes(book)) return;
  s.bookPulls = [...s.bookPulls, book];
  tx.emit({ type: 'sfx', id: 'bookSlide' });
  if (s.bookPulls.length < FRIEND_ORDER.length) return;
  const pulled = s.bookPulls;
  attemptPuzzle(tx, 'bookshelf', { kind: 'sequence', books: pulled });
  if (!s.solvedPuzzles.includes('bookshelf')) {
    s.bookPulls = [];
    tx.emit({ type: 'sfx', id: 'bookReset' });
  }
}

export function currentHintStage(state: GameState) {
  return HINT_STAGES.find((stage) => !check(stage.done, state)) ?? null;
}

function requestHint(tx: Transaction): void {
  const s = tx.state;
  const stage = currentHintStage(s);
  if (!stage) return;
  const tier = s.hintTiers[stage.id] ?? 0;
  if (tier >= stage.tiers.length) return;
  s.hintTiers = { ...s.hintTiers, [stage.id]: tier + 1 };
  s.hintCount += 1;
  tx.emit({ type: 'sfx', id: 'uiClick' });
}

function runDebug(tx: Transaction, command: DebugCommand): void {
  const s = tx.state;
  switch (command.cmd) {
    case 'giveAllItems':
      for (const item of ITEM_IDS) tx.giveItem(item);
      break;
    case 'solvePuzzle':
      debugSolve(tx, command.puzzle);
      break;
    case 'solveAll':
      // Everything up to the final door, leaving the inventory exactly as a real run would.
      tx.setFlag('lampOn', true);
      tx.setFlag('drawerOpen', true);
      for (const id of PUZZLE_IDS) if (id !== 'door') debugSolve(tx, id);
      for (const pickup of Object.values(PICKUPS)) {
        if (s.takenPickups.includes(pickup.id)) continue;
        s.takenPickups = [...s.takenPickups, pickup.id];
        tx.giveItem(pickup.item);
      }
      for (const used of ['note_left', 'note_right', 'brass_key'] as const) tx.removeItem(used);
      s.scene = null;
      s.prevScene = null;
      tx.syncPhase();
      break;
    case 'setPlayTime':
      s.playTimeMs = Math.max(0, command.ms);
      break;
    case 'setFlag':
      tx.setFlag(command.flag, command.value);
      break;
    case 'prepareSecret':
      tx.setFlag('psRead', true);
      tx.setFlag('photoTruth', true);
      tx.addClue('letter_ps');
      tx.addClue('photo_truth');
      break;
    case 'forceEnding':
      s.phase = 'ending';
      s.scene = null;
      s.ending = command.ending;
      s.gameCompleted = true;
      tx.setFlag('finalDoorUnlocked', true);
      tx.emit({ type: 'ending', ending: command.ending });
      break;
  }
}

/** Solves a puzzle as if the player had done it, including prerequisite state. */
function debugSolve(tx: Transaction, puzzle: PuzzleId): void {
  const s = tx.state;
  switch (puzzle) {
    case 'clock':
      s.clock = { hour: 9, minute: 45 };
      break;
    case 'note':
      tx.removeItem('note_left');
      tx.removeItem('note_right');
      tx.giveItem('note_full');
      break;
    case 'bookshelf':
      s.bookPulls = [...FRIEND_ORDER];
      break;
    case 'ink':
      tx.setFlag('inkRevealed', true);
      tx.giveItem('ink_page');
      break;
    case 'door':
      tx.setFlag('doorKeyInserted', true);
      break;
    default:
      break;
  }
  tx.solvePuzzle(puzzle);
  if (puzzle === 'door') beginEscape(tx);
}

/* ------------------------------------------------------------------ */
/* Reducer                                                             */
/* ------------------------------------------------------------------ */

export function reduce(state: GameState, action: GameAction): ReduceResult {
  // Actions that bypass the playable-phase guard.
  switch (action.type) {
    case 'NEW_GAME':
      return { state: createInitialState(), events: [] };
    case 'LOAD':
      return { state: action.state, events: [] };
    case 'DEBUG': {
      const tx = new Transaction(state);
      runDebug(tx, action.command);
      return { state: tx.state, events: tx.events };
    }
    case 'BEGIN_EXPLORATION': {
      if (state.phase !== 'intro') return { state, events: [] };
      return { state: { ...state, phase: 'exploration' }, events: [] };
    }
    case 'FINISH_ESCAPE': {
      if (state.phase !== 'escape') return { state, events: [] };
      const ending = resolveEnding(state);
      return {
        state: { ...state, phase: 'ending', ending, gameCompleted: true },
        events: [{ type: 'ending', ending }],
      };
    }
    case 'TICK': {
      if (!PLAYABLE_PHASES.has(state.phase) || !(action.deltaMs > 0)) return { state, events: [] };
      const delta = Math.min(action.deltaMs, MAX_TICK_MS);
      return { state: { ...state, playTimeMs: state.playTimeMs + delta }, events: [] };
    }
    default:
      break;
  }

  if (!PLAYABLE_PHASES.has(state.phase)) return { state, events: [] };
  const tx = new Transaction(state);
  const s = tx.state;

  switch (action.type) {
    case 'OPEN_OBJECT': {
      const def = OBJECTS[action.object];
      if (!def || !check(def.visibleWhen, s)) break;
      if (def.open.kind === 'toggleLamp') {
        toggleLamp(tx);
      } else if (def.open.kind === 'pickup') {
        takePickup(tx, def.open.pickup);
      } else {
        tx.emit({ type: 'sfx', id: 'objectClick' });
        tx.openScene({ kind: 'object', id: def.id });
        if (def.onOpen) tx.apply(def.onOpen);
      }
      break;
    }
    case 'OPEN_ITEM': {
      if (!s.inventory.includes(action.item)) break;
      tx.emit({ type: 'sfx', id: ITEMS[action.item].doc ? 'paper' : 'uiClick' });
      tx.openScene({ kind: 'item', id: action.item, page: action.page });
      s.heldItem = null;
      break;
    }
    case 'CLOSE_SCENE':
      if (s.scene) {
        tx.closeScene();
        tx.emit({ type: 'sfx', id: 'uiClick' });
      }
      break;
    case 'HOLD_ITEM':
      if (action.item === null || s.inventory.includes(action.item)) {
        s.heldItem = action.item === s.heldItem ? null : action.item;
      }
      break;
    case 'TOGGLE_LAMP':
      toggleLamp(tx);
      break;
    case 'TAKE':
      if (PICKUPS[action.pickup]) takePickup(tx, action.pickup);
      break;
    case 'USE_ITEM':
      applyItemUse(tx, action.item, action.target);
      break;
    case 'COMBINE':
      combine(tx, action.a, action.b);
      break;
    case 'SET_CLOCK':
      setClock(tx, action.time);
      break;
    case 'PULL_BOOK':
      if ((BOOK_IDS as readonly string[]).includes(action.book)) pullBook(tx, action.book);
      break;
    case 'SUBMIT_CODE':
      tx.emit({ type: 'sfx', id: 'keypad' });
      attemptPuzzle(tx, action.puzzle, { kind: 'code', code: String(action.code) });
      break;
    case 'READ_PAGE': {
      const itemForDoc = (ITEM_IDS as readonly string[]).includes(action.doc) ? (action.doc as ItemId) : null;
      if (!itemForDoc || !s.inventory.includes(itemForDoc)) break;
      tx.readPage(action.doc, action.page);
      if (s.scene?.kind === 'item') s.scene = { ...s.scene, page: action.page };
      tx.emit({ type: 'sfx', id: 'pageTurn' });
      break;
    }
    case 'DISCOVER_CLUE':
      if ((CLUE_IDS as readonly string[]).includes(action.clue)) {
        const isNew = !s.clues.includes(action.clue);
        tx.addClue(action.clue);
        if (isNew) tx.emit({ type: 'sfx', id: 'discovery' });
      }
      break;
    case 'REQUEST_HINT':
      requestHint(tx);
      break;
    default:
      break;
  }

  return { state: tx.state, events: tx.events };
}

function toggleLamp(tx: Transaction): void {
  const firstTime = !tx.state.discoveredObjects.includes('lamp');
  const on = !tx.state.flags.lampOn;
  tx.setFlag('lampOn', on);
  tx.discover('lamp');
  tx.emit({ type: 'sfx', id: 'lampClick' });
  if (on && firstTime) {
    tx.narrate(L('Warm light spills across the desk.', '따뜻한 빛이 책상 위로 번진다.'));
  }
}

function applyItemUse(tx: Transaction, item: ItemId, target: TargetId): void {
  const s = tx.state;
  if (!s.inventory.includes(item)) return;
  const interaction = INTERACTIONS.find((i) => i.item === item && i.targets.includes(target));
  if (!interaction) {
    // Put the item away so the next tap simply examines the object.
    s.heldItem = null;
    tx.emit({ type: 'sfx', id: 'locked' });
    tx.narrate(DEFAULT_USE_FAIL, 'error');
    return;
  }
  if (!check(interaction.requires, s)) {
    if (interaction.blockedEffects) tx.apply(interaction.blockedEffects);
    tx.narrate(interaction.blockedText ?? DEFAULT_USE_FAIL, 'error');
    return;
  }
  s.heldItem = null;
  tx.apply(interaction.effects);
}

function combine(tx: Transaction, a: ItemId, b: ItemId): void {
  const s = tx.state;
  if (a === b || !s.inventory.includes(a) || !s.inventory.includes(b)) return;
  const combo = COMBINATIONS.find(
    (c) => (c.items[0] === a && c.items[1] === b) || (c.items[0] === b && c.items[1] === a),
  );
  if (!combo) {
    tx.emit({ type: 'sfx', id: 'error' });
    tx.narrate(DEFAULT_COMBINE_FAIL, 'error');
    return;
  }
  s.heldItem = null;
  tx.apply(combo.effects);
}
