import { useEffect, useState } from 'react';
import { audio } from '../../audio/AudioEngine';
import { evaluateAchievements, loadAchievements, recordAchievements } from '../../game/achievements';
import { ACHIEVEMENTS, ENDINGS } from '../../game/data/endings';
import { PUZZLE_LIST } from '../../game/data/puzzles';
import { gameStore, useGame } from '../../game/store';
import type { AchievementId } from '../../game/types';
import { IconTrophy } from '../common/icons';
import { formatTime, useT } from '../hooks';
import { UI } from '../strings';

interface EndingScreenProps {
  onPlayAgain: () => void;
  onNewGame: () => void;
}

export function EndingScreen({ onPlayAgain, onNewGame }: EndingScreenProps) {
  const t = useT();
  const endingId = useGame((s) => s.ending) ?? 'escaped';
  const playTime = useGame((s) => s.playTimeMs);
  const hints = useGame((s) => s.hintCount);
  const solved = useGame((s) => s.solvedPuzzles.length);
  const ending = ENDINGS.find((e) => e.id === endingId)!;
  // Which achievements are new for this run (pure read), then persist them once.
  const [earned] = useState<AchievementId[]>(() => {
    const record = loadAchievements();
    return evaluateAchievements(gameStore.getState()).filter((id) => record[id] === undefined);
  });
  useEffect(() => {
    recordAchievements(gameStore.getState());
  }, []);

  useEffect(() => {
    const notes = endingId === 'secret' ? [196, 246.94, 293.66, 392] : [220, 277.18, 329.63, 415.3];
    const stop = audio.playPad(notes, 14);
    return stop;
  }, [endingId]);

  return (
    <div className={`ending ending--${endingId}`}>
      <div className="ending-sky" aria-hidden="true" />
      <main className="ending-card" aria-labelledby="ending-title">
        <p className="ending-kicker">{endingId === 'secret' ? t(UI.secretEnding) : t(UI.ending)}</p>
        <h1 id="ending-title" className="ending-title">
          {t(ending.title)}
        </h1>
        <div className="ending-lines">
          {ending.lines.map((line, i) => (
            <p key={i} style={{ animationDelay: `${1.2 + i * 0.9}s` }}>
              {t(line)}
            </p>
          ))}
        </div>
        <dl className="ending-stats">
          <div>
            <dt>{t(UI.time)}</dt>
            <dd>{formatTime(playTime)}</dd>
          </div>
          <div>
            <dt>{t(UI.hintsLabel)}</dt>
            <dd>{hints}</dd>
          </div>
          <div>
            <dt>{t(UI.puzzlesLabel)}</dt>
            <dd>
              {solved} / {PUZZLE_LIST.length}
            </dd>
          </div>
        </dl>
        {earned.length > 0 && (
          <ul className="ending-achievements" aria-label={t(UI.newAchievement)}>
            {earned.map((id, i) => {
              const def = ACHIEVEMENTS.find((a) => a.id === id)!;
              return (
                <li key={id} style={{ animationDelay: `${2.6 + i * 0.35}s` }}>
                  <IconTrophy size={18} />
                  <span>
                    <strong>{t(def.title)}</strong>
                    <small>{t(def.description)}</small>
                  </span>
                </li>
              );
            })}
          </ul>
        )}
        <div className="ending-actions">
          <button type="button" className="menu-item" onClick={onPlayAgain}>
            {t(UI.playAgain)}
          </button>
          <button type="button" className="menu-item" onClick={onNewGame}>
            {t(UI.newGame)}
          </button>
        </div>
      </main>
    </div>
  );
}
