import { useState } from 'react';
import { loadAchievements } from '../../game/achievements';
import { ACHIEVEMENTS } from '../../game/data/endings';
import { settingsStore, useSettings } from '../../game/settings';
import { playSfx } from '../../game/store';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { IconBack, IconTrophy } from '../common/icons';
import { useT } from '../hooks';
import { UI } from '../strings';

interface MainMenuProps {
  canContinue: boolean;
  onStart: () => void;
  onContinue: () => void;
}

type View = 'main' | 'how' | 'achievements';

function MenuBackdrop() {
  return (
    <div className="menu-backdrop" aria-hidden="true">
      <div className="menu-wall" />
      <div className="menu-door">
        <span className="menu-door-panel" />
        <span className="menu-door-panel" />
        <span className="menu-door-panel" />
        <span className="menu-door-panel" />
        <span className="menu-door-keyhole" />
      </div>
      <div className="menu-leak" />
      <div className="menu-floor" />
    </div>
  );
}

const TITLE_WORDS = ['THE', 'LAST', 'ROOM'];

export function MainMenu({ canContinue, onStart, onContinue }: MainMenuProps) {
  const t = useT();
  const sound = useSettings((s) => s.sound);
  const lang = useSettings((s) => s.lang);
  const [view, setView] = useState<View>('main');
  const [confirmRestart, setConfirmRestart] = useState(false);
  const [achievements] = useState(loadAchievements);
  const unlockedCount = ACHIEVEMENTS.filter((a) => achievements[a.id]).length;

  const click = (fn: () => void) => () => {
    playSfx('uiClick');
    fn();
  };

  return (
    <div className="menu">
      <MenuBackdrop />
      <main className="menu-main">
        <h1 className="menu-title" aria-label="The Last Room">
          {TITLE_WORDS.map((word, i) => (
            <span key={word} className="menu-title-word" style={{ animationDelay: `${0.4 + i * 0.35}s` }}>
              {word}
            </span>
          ))}
        </h1>
        <p className="menu-tagline">{t(UI.tagline)}</p>

        {view === 'main' && (
          <nav className="menu-list" aria-label="Main menu">
            <button type="button" className="menu-item" onClick={click(() => (canContinue ? setConfirmRestart(true) : onStart()))}>
              {t(UI.startGame)}
            </button>
            <button type="button" className="menu-item" onClick={click(onContinue)} disabled={!canContinue}>
              {t(UI.continueGame)}
            </button>
            <button type="button" className="menu-item" onClick={click(() => setView('how'))}>
              {t(UI.howToPlay)}
            </button>
            <button
              type="button"
              className="menu-item"
              onClick={click(() => settingsStore.update({ sound: !sound }))}
              aria-pressed={sound}
            >
              {t(UI.sound)}: {sound ? t(UI.on) : t(UI.off)}
            </button>
            <button
              type="button"
              className="menu-item menu-item--small"
              onClick={click(() => settingsStore.update({ lang: lang === 'en' ? 'ko' : 'en' }))}
            >
              {lang === 'en' ? 'ENGLISH · 한국어' : '한국어 · ENGLISH'}
            </button>
            <button type="button" className="menu-item menu-item--small" onClick={click(() => setView('achievements'))}>
              <IconTrophy size={16} /> {t(UI.achievements)} {unlockedCount}/{ACHIEVEMENTS.length}
            </button>
          </nav>
        )}

        {view === 'how' && (
          <section className="menu-panel" aria-labelledby="how-title">
            <h2 id="how-title">{t(UI.howTitle)}</h2>
            <ol className="how-list">
              {UI.howLines.map((line, i) => (
                <li key={i}>{t(line)}</li>
              ))}
            </ol>
            <p className="how-keys">{t(UI.howKeys)}</p>
            <button type="button" className="menu-item menu-item--small" onClick={click(() => setView('main'))} autoFocus>
              <IconBack size={16} /> {t(UI.back)}
            </button>
          </section>
        )}

        {view === 'achievements' && (
          <section className="menu-panel" aria-labelledby="ach-title">
            <h2 id="ach-title">{t(UI.achievements)}</h2>
            <ul className="achievement-list">
              {ACHIEVEMENTS.map((a) => {
                const unlocked = !!achievements[a.id];
                const hidden = a.secret && !unlocked;
                return (
                  <li key={a.id} className={unlocked ? 'is-unlocked' : ''}>
                    <IconTrophy size={18} />
                    <span>
                      <strong>{hidden ? t(UI.lockedAchievement) : t(a.title)}</strong>
                      <small>{hidden ? '—' : t(a.description)}</small>
                    </span>
                  </li>
                );
              })}
            </ul>
            <button type="button" className="menu-item menu-item--small" onClick={click(() => setView('main'))} autoFocus>
              <IconBack size={16} /> {t(UI.back)}
            </button>
          </section>
        )}
      </main>
      <footer className="menu-footer">{t(UI.credits)}</footer>

      {confirmRestart && (
        <ConfirmDialog
          title={t(UI.startOverTitle)}
          body={t(UI.startOverBody)}
          confirmLabel={t(UI.startGame)}
          onCancel={() => setConfirmRestart(false)}
          onConfirm={() => {
            setConfirmRestart(false);
            onStart();
          }}
        />
      )}
    </div>
  );
}
