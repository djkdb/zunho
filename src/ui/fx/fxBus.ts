import type { FxId } from '../../game/types';

export interface FxRequest {
  id: FxId;
  /** Optional screen position (px) for particle bursts; defaults to screen centre. */
  x?: number;
  y?: number;
}

type Listener = (fx: FxRequest) => void;
const listeners = new Set<Listener>();

/** Remembers when the last "reveal" happened, so a scene mounted a moment later can still animate it. */
export const fxMemory = { lastRevealAt: -Infinity };

/** UI-level effects channel: the game engine and cinematic scenes both emit into it. */
export const fxBus = {
  emit(fx: FxRequest): void {
    if (fx.id === 'reveal') fxMemory.lastRevealAt = performance.now();
    for (const listener of listeners) listener(fx);
  },
  on(listener: Listener): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};
