import { useCallback, useEffect, useRef, useState } from 'react';
import { OBJECTS } from '../../../game/data/objects';
import { dispatch, gameStore, playSfx, useGame } from '../../../game/store';
import { fxBus } from '../../fx/fxBus';
import { useT, useTimeouts } from '../../hooks';
import { UI } from '../../strings';
import { PickupButton, SceneFrame } from '../SceneFrame';

const CODE_LENGTH = 4;
const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', 'E'] as const;

/** idle → freeze → handle → bolts → open → done */
type Stage = 'idle' | 'freeze' | 'handle' | 'bolts' | 'open' | 'done';

export function SafeScene() {
  const t = useT();
  const safeOpen = useGame((s) => s.flags.safeOpen);
  const keyTaken = useGame((s) => s.takenPickups.includes('safe_key'));
  const letterTaken = useGame((s) => s.takenPickups.includes('safe_letter'));
  const [code, setCode] = useState('');
  const [wrong, setWrong] = useState(0);
  const [stage, setStage] = useState<Stage>(() => (safeOpen ? 'done' : 'idle'));
  const later = useTimeouts();

  // Scene D: the unlock is choreographed here, beat by beat.
  useEffect(() => {
    return gameStore.onEvent((event) => {
      if (event.type === 'puzzleSolved' && event.puzzle === 'safe') {
        setStage('freeze');
        playSfx('success');
        later(() => {
          setStage('handle');
          playSfx('unlock');
        }, 550);
        later(() => {
          setStage('bolts');
          playSfx('bolt');
          fxBus.emit({ id: 'shakeSoft' });
        }, 1300);
        later(() => {
          setStage('open');
          playSfx('safeOpen');
          fxBus.emit({ id: 'flashWarm' });
          fxBus.emit({ id: 'sparks' });
          fxBus.emit({ id: 'shake' });
        }, 1900);
        later(() => setStage('done'), 3000);
      }
      if (event.type === 'puzzleFailed' && event.puzzle === 'safe') {
        setWrong((w) => w + 1);
        later(() => setCode(''), 650);
      }
    });
  }, [later]);

  const press = useCallback(
    (key: string) => {
      if (stage !== 'idle') return;
      if (key === 'C') {
        playSfx('keypad');
        setCode('');
        return;
      }
      if (key === 'E') {
        if (code.length === CODE_LENGTH) dispatch({ type: 'SUBMIT_CODE', puzzle: 'safe', code });
        else playSfx('locked');
        return;
      }
      playSfx('keypad');
      setCode((c) => (c.length >= CODE_LENGTH ? c : c + key));
    },
    [code, stage],
  );

  // Physical keyboard support. Typing moves focus to ⏎, so the next Enter submits
  // instead of "clicking" whichever keypad button happened to have focus.
  const enterRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (/^[0-9]$/.test(e.key)) {
        press(e.key);
        enterRef.current?.focus({ preventScroll: true });
      } else if (e.key === 'Backspace') {
        setCode((c) => c.slice(0, -1));
        playSfx('keypad');
      } else if (e.key === 'Enter' && (e.target as HTMLElement)?.tagName !== 'BUTTON') press('E');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [press]);

  const unlocked = stage !== 'idle';
  const doorOpen = stage === 'open' || stage === 'done';

  return (
    <SceneFrame
      id="safe"
      title={t(OBJECTS.safe.name)}
      caption={
        <p>
          {doorOpen
            ? keyTaken && letterTaken
              ? t(UI.empty)
              : t({ en: 'Inside: an iron key and a sealed letter.', ko: '안에는 무쇠 열쇠와 봉인된 편지가 있다.' })
            : t({ en: 'Four digits. A brass maker’s plate reads VARN & SONS, 1911.', ko: '네 자리 숫자. 황동 명판에 VARN & SONS, 1911이라고 적혀 있다.' })}
        </p>
      }
    >
      <div className={`safe safe--${stage}`}>
        <div className="safe-body">
          <div className="safe-interior">
            {doorOpen && !keyTaken && (
              <PickupButton item="iron_key" className="safe-item" onTake={() => dispatch({ type: 'TAKE', pickup: 'safe_key' })} />
            )}
            {doorOpen && !letterTaken && (
              <PickupButton item="letter" className="safe-item" onTake={() => dispatch({ type: 'TAKE', pickup: 'safe_letter' })} />
            )}
          </div>
          <div className="safe-door" aria-hidden={doorOpen}>
            <div className="safe-plate">{t(UI.safeMaker)}</div>
            <div className="safe-bolts" aria-hidden="true">
              <span />
              <span />
              <span />
            </div>
            <div className="safe-wheel" aria-hidden="true">
              <span />
            </div>
            <div className="safe-panel">
              <div key={wrong} className={`safe-display ${wrong > 0 && !unlocked ? 'is-wrong' : ''} ${unlocked ? 'is-open' : ''}`} aria-live="polite">
                {Array.from({ length: CODE_LENGTH }, (_, i) => (
                  <span key={i} className={code[i] ? 'is-filled' : ''}>
                    {code[i] ?? '·'}
                  </span>
                ))}
                <i className="safe-led" aria-hidden="true" />
              </div>
              <div className="keypad" role="group" aria-label="Keypad">
                {KEYS.map((key) => (
                  <button
                    key={key}
                    ref={key === 'E' ? enterRef : undefined}
                    type="button"
                    className={`keypad-key ${key === 'E' ? 'keypad-key--enter' : ''} ${key === 'C' ? 'keypad-key--clear' : ''}`}
                    onClick={() => press(key)}
                    disabled={unlocked}
                    aria-label={key === 'E' ? t(UI.enter) : key === 'C' ? t(UI.clear) : key}
                  >
                    {key === 'E' ? '⏎' : key}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </SceneFrame>
  );
}
