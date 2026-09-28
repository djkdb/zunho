import { useEffect, useState } from 'react';
import { useSettings, settingsStore } from '../../game/settings';
import { useGame } from '../../game/store';
import { IconGear, IconHint, IconHourglass, IconMute, IconNotebook, IconSound } from '../common/icons';
import { formatTime, useT } from '../hooks';
import { UI } from '../strings';
import { HintPanel } from './HintPanel';
import { Inventory } from './Inventory';
import { Notebook } from './Notebook';
import { SettingsPanel } from './SettingsPanel';

export type PanelId = 'hint' | 'notebook' | 'settings';

function Timer() {
  const ms = useGame((s) => s.playTimeMs);
  return (
    <span className="hud-timer" role="timer" aria-live="off">
      <IconHourglass size={16} />
      <span>{formatTime(ms)}</span>
    </span>
  );
}

function SoundToggle() {
  const t = useT();
  const sound = useSettings((s) => s.sound);
  return (
    <button
      type="button"
      className="hud-button"
      onClick={() => settingsStore.update({ sound: !sound })}
      aria-label={`${t(UI.sound)}: ${sound ? t(UI.on) : t(UI.off)}`}
      aria-pressed={sound}
    >
      {sound ? <IconSound /> : <IconMute />}
    </button>
  );
}

const IDLE_HINT_MS = 150_000;

/** After a long stretch without progress, the hint button starts to breathe. */
function useIdleNudge(): boolean {
  const progress = useGame((s) => s.solvedPuzzles.length * 100 + s.collectedItems.length * 10 + s.clues.length);
  const hintCount = useGame((s) => s.hintCount);
  const activity = `${progress}:${hintCount}`;
  const [idleAt, setIdleAt] = useState<string | null>(null);
  useEffect(() => {
    const id = window.setTimeout(() => setIdleAt(activity), IDLE_HINT_MS);
    return () => window.clearTimeout(id);
  }, [activity]);
  // Any new activity implicitly cancels the nudge.
  return idleAt === activity;
}

/** Dot on the notebook button whenever a clue arrives that the player has not looked at yet. */
function useUnreadClues(open: boolean): boolean {
  const clueCount = useGame((s) => s.clues.length);
  const [seen, setSeen] = useState(clueCount);
  if (open && seen !== clueCount) setSeen(clueCount);
  return clueCount > seen;
}

export function Hud({ onExitToTitle }: { onExitToTitle: () => void }) {
  const t = useT();
  const [openPanel, setPanel] = useState<PanelId | null>(null);
  const phase = useGame((s) => s.phase);
  const hintCount = useGame((s) => s.hintCount);
  const nudge = useIdleNudge();
  const hidden = phase === 'intro' || phase === 'escape' || phase === 'ending';
  // Panels never stay open over a cinematic.
  const panel = hidden ? null : openPanel;
  const unread = useUnreadClues(panel === 'notebook');
  const toggle = (id: PanelId) => setPanel((p) => (p === id ? null : id));

  // Escape closes panels before it closes scenes.
  useEffect(() => {
    if (!panel) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopImmediatePropagation();
        setPanel(null);
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [panel]);

  return (
    <div className={`hud ${hidden ? 'is-hidden' : ''}`}>
      <header className="hud-top">
        <span className="hud-title">{t(UI.title)}</span>
        <Timer />
      </header>

      <nav className="hud-side" aria-label="Game menu">
        <button
          type="button"
          className={`hud-button ${panel === 'hint' ? 'is-active' : ''} ${nudge ? 'is-nudging' : ''}`}
          onClick={() => toggle('hint')}
          aria-label={`${t(UI.hint)} (${hintCount})`}
          aria-expanded={panel === 'hint'}
        >
          <IconHint />
        </button>
        <button
          type="button"
          className={`hud-button ${panel === 'notebook' ? 'is-active' : ''}`}
          onClick={() => toggle('notebook')}
          aria-label={t(UI.notebook)}
          aria-expanded={panel === 'notebook'}
        >
          <IconNotebook />
          {unread && <span className="hud-badge" aria-hidden="true" />}
        </button>
        <SoundToggle />
        <button
          type="button"
          className={`hud-button ${panel === 'settings' ? 'is-active' : ''}`}
          onClick={() => toggle('settings')}
          aria-label={t(UI.settings)}
          aria-expanded={panel === 'settings'}
        >
          <IconGear />
        </button>
      </nav>

      <Inventory />

      {panel && <div className="panel-scrim" onClick={() => setPanel(null)} aria-hidden="true" />}
      {panel === 'hint' && <HintPanel onClose={() => setPanel(null)} />}
      {panel === 'notebook' && <Notebook onClose={() => setPanel(null)} />}
      {panel === 'settings' && (
        <SettingsPanel
          onClose={() => setPanel(null)}
          onExitToTitle={() => {
            setPanel(null);
            onExitToTitle();
          }}
        />
      )}
    </div>
  );
}
