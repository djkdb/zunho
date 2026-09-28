import { lazy, Suspense, useEffect, useRef } from 'react';
import { saveGame } from '../../game/persistence';
import { dispatch, gameStore, useGame } from '../../game/store';
import type { GamePhase } from '../../game/types';
import { EscapeSequence } from '../cinematics/EscapeSequence';
import { IntroSequence } from '../cinematics/IntroSequence';
import { FxLayer } from '../fx/FxLayer';
import { Hud } from '../hud/Hud';
import { Narration } from '../hud/Narration';
import { useReducedMotion } from '../hooks';
import { InvestigationLayer } from '../investigate/InvestigationLayer';
import { Room } from '../room/Room';
import { EndingScreen } from './EndingScreen';

const DebugPanel = lazy(() => import('../debug/DebugPanel'));

const TICK_MS = 1000;
const SAVE_THROTTLE_MS = 1500;
const TIMED_PHASES: ReadonlySet<GamePhase> = new Set(['exploration', 'investigation', 'puzzle']);

/** Play time only runs while the tab is visible and the player is actually playing. */
function usePlayClock() {
  useEffect(() => {
    let last = performance.now();
    const id = window.setInterval(() => {
      const now = performance.now();
      const delta = now - last;
      last = now;
      if (document.visibilityState === 'visible' && TIMED_PHASES.has(gameStore.getState().phase)) {
        dispatch({ type: 'TICK', deltaMs: delta });
      }
    }, TICK_MS);
    const onVisibility = () => {
      last = performance.now();
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.clearInterval(id);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);
}

/** Throttled autosave, plus a final save whenever the page is hidden or closed. */
function useAutosave() {
  useEffect(() => {
    let timer: number | null = null;
    const flush = () => {
      if (timer !== null) window.clearTimeout(timer);
      timer = null;
      saveGame(gameStore.getState());
    };
    const unsubscribe = gameStore.subscribe(() => {
      if (timer === null) timer = window.setTimeout(flush, SAVE_THROTTLE_MS);
    });
    const onHide = () => {
      if (document.visibilityState === 'hidden') flush();
    };
    window.addEventListener('pagehide', flush);
    document.addEventListener('visibilitychange', onHide);
    flush();
    return () => {
      unsubscribe();
      window.removeEventListener('pagehide', flush);
      document.removeEventListener('visibilitychange', onHide);
      flush();
    };
  }, []);
}

interface GameScreenProps {
  debugEnabled: boolean;
  onExitToTitle: () => void;
  onPlayAgain: () => void;
  onNewGame: () => void;
}

export function GameScreen({ debugEnabled, onExitToTitle, onPlayAgain, onNewGame }: GameScreenProps) {
  const phase = useGame((s) => s.phase);
  const reducedMotion = useReducedMotion();
  const shakeRef = useRef<HTMLDivElement>(null);
  usePlayClock();
  useAutosave();

  return (
    <div className={`game phase-${phase}`}>
      <div ref={shakeRef} className="game-world">
        {phase !== 'ending' && <Room />}
        <InvestigationLayer />
      </div>
      <div className="vignette" aria-hidden="true" />
      <div className="grain" aria-hidden="true" />
      <FxLayer shakeTarget={shakeRef} reducedMotion={reducedMotion} />
      <Hud onExitToTitle={onExitToTitle} />
      <Narration />
      {phase === 'intro' && <IntroSequence />}
      {phase === 'escape' && <EscapeSequence />}
      {phase === 'ending' && <EndingScreen onPlayAgain={onPlayAgain} onNewGame={onNewGame} />}
      {debugEnabled && (
        <Suspense fallback={null}>
          <DebugPanel />
        </Suspense>
      )}
    </div>
  );
}
