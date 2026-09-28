import { useEffect, useState } from 'react';
import { audio } from '../../audio/AudioEngine';
import { clearAchievements } from '../../game/achievements';
import { clearSave } from '../../game/persistence';
import { settingsStore, useSettings } from '../../game/settings';
import { dispatch, useGame } from '../../game/store';
import type { SfxId } from '../../game/types';
import { PUZZLE_IDS } from '../../game/types';

const SFX: SfxId[] = [
  'uiClick',
  'objectClick',
  'drawerOpen',
  'locked',
  'unlock',
  'error',
  'pickup',
  'safeOpen',
  'doorOpen',
  'success',
  'discovery',
  'clockChime',
  'bolt',
];

function StateView() {
  const state = useGame((s) => s);
  const { playTimeMs, ...rest } = state;
  return (
    <pre className="debug-state">
      {JSON.stringify({ ...rest, playTime: Math.round(playTimeMs / 1000) + 's' }, null, 1)}
    </pre>
  );
}

/**
 * Developer tools. Available in dev builds, or in production with `?debug=true`.
 * Toggle with Shift + D.
 */
export default function DebugPanel() {
  const [open, setOpen] = useState(() => new URLSearchParams(window.location.search).get('debug') === 'true');
  const [showState, setShowState] = useState(false);
  const showZones = useSettings((s) => s.showHotspots);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.shiftKey && (e.key === 'D' || e.key === 'd') && !(e.target as HTMLElement)?.closest('input')) {
        setOpen((o) => !o);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  if (!open) return null;

  return (
    <aside className="debug" aria-label="Debug panel">
      <header>
        <strong>DEBUG</strong>
        <button type="button" onClick={() => setOpen(false)} aria-label="Close debug panel">
          ×
        </button>
      </header>
      <section>
        <button type="button" onClick={() => dispatch({ type: 'BEGIN_EXPLORATION' })}>
          skip intro
        </button>
        <button type="button" onClick={() => dispatch({ type: 'DEBUG', command: { cmd: 'solveAll' } })}>
          solve all (up to door)
        </button>
        <button type="button" onClick={() => dispatch({ type: 'DEBUG', command: { cmd: 'giveAllItems' } })}>
          give all items
        </button>
        <button type="button" onClick={() => dispatch({ type: 'DEBUG', command: { cmd: 'prepareSecret' } })}>
          prep secret (P.S. + photo)
        </button>
      </section>
      <section>
        <span>solve:</span>
        {PUZZLE_IDS.map((id) => (
          <button key={id} type="button" onClick={() => dispatch({ type: 'DEBUG', command: { cmd: 'solvePuzzle', puzzle: id } })}>
            {id}
          </button>
        ))}
      </section>
      <section>
        <span>time:</span>
        {[0, 5, 9, 15].map((m) => (
          <button key={m} type="button" onClick={() => dispatch({ type: 'DEBUG', command: { cmd: 'setPlayTime', ms: m * 60_000 } })}>
            {m}m
          </button>
        ))}
      </section>
      <section>
        <span>ending:</span>
        <button type="button" onClick={() => dispatch({ type: 'DEBUG', command: { cmd: 'forceEnding', ending: 'escaped' } })}>
          escaped
        </button>
        <button type="button" onClick={() => dispatch({ type: 'DEBUG', command: { cmd: 'forceEnding', ending: 'secret' } })}>
          secret
        </button>
      </section>
      <section>
        <span>sfx:</span>
        {SFX.map((id) => (
          <button key={id} type="button" onClick={() => audio.play(id)}>
            {id}
          </button>
        ))}
      </section>
      <section>
        <label>
          <input type="checkbox" checked={showZones} onChange={(e) => settingsStore.update({ showHotspots: e.target.checked })} /> show
          interaction zones
        </label>
        <label>
          <input type="checkbox" checked={showState} onChange={(e) => setShowState(e.target.checked)} /> show game state
        </label>
      </section>
      <section>
        <button
          type="button"
          className="danger"
          onClick={() => {
            clearSave();
            clearAchievements();
            dispatch({ type: 'NEW_GAME' });
          }}
        >
          reset state + achievements
        </button>
      </section>
      {showState && <StateView />}
    </aside>
  );
}
