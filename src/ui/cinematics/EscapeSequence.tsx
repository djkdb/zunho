import { useEffect, useState } from 'react';
import { resolveEnding } from '../../game/engine/reducer';
import { dispatch, gameStore, playSfx } from '../../game/store';
import { audio } from '../../audio/AudioEngine';
import { fxBus } from '../fx/fxBus';
import { useReducedMotion, useT, useTimeouts } from '../hooks';
import { UI } from '../strings';

type Beat = 'dial' | 'bolt1' | 'bolt2' | 'flicker' | 'handle' | 'open' | 'white';

const BEATS: { beat: Beat; at: number }[] = [
  { beat: 'dial', at: 0 },
  { beat: 'bolt1', at: 800 },
  { beat: 'bolt2', at: 1500 },
  { beat: 'flicker', at: 2200 },
  { beat: 'handle', at: 2900 },
  { beat: 'open', at: 3600 },
  { beat: 'white', at: 6200 },
];
const FINISH_AT = 7600;

/**
 * Scenes E & F — the final lock gives way and the door opens.
 * Every beat has sound, motion and light; the engine only learns the result at the end.
 */
export function EscapeSequence() {
  const t = useT();
  const reducedMotion = useReducedMotion();
  const later = useTimeouts();
  const [beat, setBeat] = useState<Beat>('dial');
  const [secret] = useState(() => resolveEnding(gameStore.getState()) === 'secret');

  useEffect(() => {
    const cues: Record<Beat, () => void> = {
      dial: () => playSfx('success'),
      bolt1: () => {
        playSfx('bolt');
        fxBus.emit({ id: 'shakeSoft' });
      },
      bolt2: () => {
        playSfx('bolt');
        fxBus.emit({ id: 'shakeSoft' });
      },
      flicker: () => playSfx('lampClick'),
      handle: () => playSfx('unlock'),
      open: () => {
        playSfx('doorOpen');
        audio.stopAmbience(3);
        fxBus.emit({ id: secret ? 'flashWarm' : 'flash' });
        fxBus.emit({ id: 'dust' });
      },
      white: () => undefined,
    };
    for (const { beat: b, at } of BEATS) {
      later(() => {
        setBeat(b);
        cues[b]();
      }, reducedMotion ? at * 0.6 : at);
    }
    later(() => dispatch({ type: 'FINISH_ESCAPE' }), reducedMotion ? FINISH_AT * 0.6 : FINISH_AT);
  }, [later, reducedMotion, secret]);

  const reached = (b: Beat) => BEATS.findIndex((x) => x.beat === beat) >= BEATS.findIndex((x) => x.beat === b);

  return (
    <div
      className={`escape ${secret ? 'escape--secret' : ''} ${BEATS.map((b) => (reached(b.beat) ? `at-${b.beat}` : '')).join(' ')}`}
      role="presentation"
    >
      <div className="escape-light" />
      <div className="escape-frame">
        <div className="escape-door">
          <div className="escape-door-panels" />
          <span className="escape-bolt escape-bolt--1" />
          <span className="escape-bolt escape-bolt--2" />
          <div className="escape-dial">
            <span>1</span>
            <span>1</span>
            <i>:</i>
            <span>5</span>
            <span>2</span>
          </div>
          <span className="escape-handle" />
          <span className="escape-key" />
        </div>
      </div>
      <div className="escape-flicker" />
      <div className="escape-white" />
      <button type="button" className="intro-skip" onClick={() => dispatch({ type: 'FINISH_ESCAPE' })}>
        {t(UI.skip)}
      </button>
    </div>
  );
}
