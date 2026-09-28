import { useCallback, useEffect, useRef, useState } from 'react';
import { OBJECTS } from '../../../game/data/objects';
import { dispatch, gameStore, playSfx, say, useGame } from '../../../game/store';
import { IconChevronDown, IconChevronUp, IconLock } from '../../common/icons';
import { useT } from '../../hooks';
import { UI } from '../../strings';
import { SceneFrame, UseItemChip } from '../SceneFrame';
import { useTargetTap } from '../useTargetTap';

/** Each wheel's range keeps the dial a plausible 12-hour time (HH:MM). */
const WHEEL_MAX = [1, 9, 5, 9];

function Wheel({ index, value, disabled, onChange }: { index: number; value: number; disabled: boolean; onChange: (v: number) => void }) {
  const max = WHEEL_MAX[index]!;
  const step = (d: number) => {
    playSfx('clockTick');
    onChange((value + d + max + 1) % (max + 1));
  };
  return (
    <div className="wheel" role="group" aria-label={`Digit ${index + 1}`}>
      <button type="button" className="wheel-btn" onClick={() => step(1)} disabled={disabled} aria-label={`Digit ${index + 1} up`}>
        <IconChevronUp />
      </button>
      <span className="wheel-value" aria-live="polite">
        <span key={value}>{value}</span>
      </span>
      <button type="button" className="wheel-btn" onClick={() => step(-1)} disabled={disabled} aria-label={`Digit ${index + 1} down`}>
        <IconChevronDown />
      </button>
    </div>
  );
}

export function DoorScene() {
  const t = useT();
  const keyInserted = useGame((s) => s.flags.doorKeyInserted);
  const holding = useGame((s) => s.heldItem);
  const [digits, setDigits] = useState([1, 2, 0, 0]);
  const [wrong, setWrong] = useState(0);

  useEffect(
    () =>
      gameStore.onEvent((event) => {
        if (event.type === 'puzzleFailed' && event.puzzle === 'door') setWrong((w) => w + 1);
      }),
    [],
  );

  const tapKeyhole = useTargetTap('door_keyhole', () => {
    playSfx('locked');
    say(keyInserted ? { en: 'The iron key is turned. The bolt has slid back.', ko: '무쇠 열쇠가 돌아가 있다. 빗장이 풀렸다.' } : UI.doorKeyNeeded, keyInserted ? 'info' : 'error');
  });

  const setDigit = useCallback((index: number, value: number) => {
    setDigits((d) => d.map((v, i) => (i === index ? value : v)));
  }, []);

  const turnHandle = useCallback(() => {
    if (!keyInserted) {
      playSfx('locked');
      say(UI.doorLocked, 'error');
      return;
    }
    dispatch({ type: 'SUBMIT_CODE', puzzle: 'door', code: digits.join('') });
  }, [digits, keyInserted]);

  // Keyboard: type the four digits (the cursor wraps), Enter turns the handle.
  const cursor = useRef(0);
  useEffect(() => {
    if (!keyInserted) return;
    const onKey = (e: KeyboardEvent) => {
      if (/^[0-9]$/.test(e.key)) {
        const index = cursor.current;
        setDigit(index, Math.min(Number(e.key), WHEEL_MAX[index]!));
        playSfx('clockTick');
        cursor.current = (index + 1) % WHEEL_MAX.length;
      } else if (e.key === 'Enter' && (e.target as HTMLElement)?.tagName !== 'BUTTON') {
        turnHandle();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [keyInserted, setDigit, turnHandle]);

  return (
    <SceneFrame
      id="door"
      title={t(OBJECTS.door.name)}
      caption={<p>{keyInserted ? t(UI.dialHelp) : t(UI.doorLocked)}</p>}
      actions={<UseItemChip item="iron_key" target="door_keyhole" visible={!keyInserted && !holding} />}
    >
      <div className={`door-close ${keyInserted ? 'is-keyed' : ''}`}>
        <div className="door-panel door-panel--top" aria-hidden="true" />
        <div className={`door-bolt ${keyInserted ? 'is-open' : ''}`} aria-hidden="true">
          <span />
        </div>
        <div key={wrong} className={`door-dial ${keyInserted ? '' : 'is-locked'} ${wrong > 0 ? 'is-wrong' : ''}`}>
          <p className="door-dial-label">{t({ en: 'THE HOUR I LEFT', ko: '내가 떠난 시각' })}</p>
          <div className="door-dial-wheels">
            <Wheel index={0} value={digits[0]!} disabled={!keyInserted} onChange={(v) => setDigit(0, v)} />
            <Wheel index={1} value={digits[1]!} disabled={!keyInserted} onChange={(v) => setDigit(1, v)} />
            <span className="door-dial-colon" aria-hidden="true">
              :
            </span>
            <Wheel index={2} value={digits[2]!} disabled={!keyInserted} onChange={(v) => setDigit(2, v)} />
            <Wheel index={3} value={digits[3]!} disabled={!keyInserted} onChange={(v) => setDigit(3, v)} />
          </div>
          {!keyInserted && (
            <span className="door-dial-lock" aria-hidden="true">
              <IconLock size={28} />
            </span>
          )}
        </div>
        <div className="door-hardware">
          <button type="button" className="door-handle" onClick={turnHandle} aria-label={t(UI.turnHandle)}>
            <span className="door-handle-rose" aria-hidden="true" />
            <span className="door-handle-lever" aria-hidden="true" />
          </button>
          <button
            type="button"
            className={`keyhole keyhole--iron ${keyInserted ? 'is-filled' : ''} ${holding ? 'is-target' : ''}`}
            onClick={tapKeyhole}
            aria-label={t(UI.keyhole)}
          >
            <span aria-hidden="true" />
          </button>
        </div>
        <button type="button" className="brass-button door-turn" onClick={turnHandle}>
          {t(UI.turnHandle)}
        </button>
      </div>
    </SceneFrame>
  );
}
