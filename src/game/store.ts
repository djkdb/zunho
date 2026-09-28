import { useSyncExternalStore } from 'react';
import { createInitialState } from './engine/initialState';
import { reduce } from './engine/reducer';
import type { GameAction, GameEvent, GameState, LocalizedText, NarrationTone, SfxId } from './types';

type Listener = () => void;
type EventListener = (event: GameEvent, state: GameState) => void;

/**
 * Framework-agnostic store around the pure reducer.
 * React subscribes with selectors, so e.g. the timer tick re-renders only the clock display.
 * Side effects (sound, camera, narration) listen to the event stream instead of state diffs.
 */
export class GameStore {
  private state: GameState;
  private readonly listeners = new Set<Listener>();
  private readonly eventListeners = new Set<EventListener>();

  constructor(initial: GameState) {
    this.state = initial;
  }

  getState = (): GameState => this.state;

  subscribe = (listener: Listener): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  onEvent = (listener: EventListener): (() => void) => {
    this.eventListeners.add(listener);
    return () => this.eventListeners.delete(listener);
  };

  /** Broadcast a presentation-only event (no state change), e.g. describing a keyhole. */
  emit = (event: GameEvent): void => {
    for (const listener of this.eventListeners) listener(event, this.state);
  };

  dispatch = (action: GameAction): void => {
    let result;
    try {
      result = reduce(this.state, action);
    } catch (error) {
      // An invalid puzzle state must never take the whole game down.
      console.error('[the-last-room] action failed', action, error);
      return;
    }
    const changed = result.state !== this.state;
    this.state = result.state;
    if (changed) for (const listener of this.listeners) listener();
    for (const event of result.events) for (const listener of this.eventListeners) listener(event, this.state);
  };
}

export const gameStore = new GameStore(createInitialState());
export const dispatch = gameStore.dispatch;

export function say(text: LocalizedText, tone: NarrationTone = 'info'): void {
  gameStore.emit({ type: 'narrate', text, tone });
}

export function playSfx(id: SfxId): void {
  gameStore.emit({ type: 'sfx', id });
}

export function useGame<T>(selector: (state: GameState) => T): T {
  return useSyncExternalStore(gameStore.subscribe, () => selector(gameStore.getState()));
}

function shallowEqual<T extends object>(a: T, b: T): boolean {
  const keysA = Object.keys(a) as (keyof T)[];
  if (keysA.length !== Object.keys(b).length) return false;
  return keysA.every((key) => Object.is(a[key], b[key]));
}

/**
 * Wraps a selector that builds a new object on every call so that it returns
 * the previous object while the result is shallowly equal. Create it once at module level.
 */
export function shallowSelector<T extends object>(selector: (state: GameState) => T): (state: GameState) => T {
  let cached: T | undefined;
  return (state) => {
    const next = selector(state);
    if (cached !== undefined && shallowEqual(cached, next)) return cached;
    cached = next;
    return next;
  };
}
