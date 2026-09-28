import { useEffect, useState } from 'react';
import { L } from '../../game/i18n';
import { dispatch, playSfx } from '../../game/store';
import { useReducedMotion, useT, useTimeouts } from '../hooks';
import { UI } from '../strings';

const LINES = [
  L('You wake to the smell of dust and old paper.', '먼지와 오래된 종이 냄새에 눈을 뜬다.'),
  L('The door is locked. The clock on the wall has stopped.', '문은 잠겨 있다. 벽시계는 멈춰 있다.'),
  L('Somebody wanted you here.', '누군가 당신이 여기 있길 원했다.'),
];

const LINE_MS = 2600;
const OPEN_MS = 2200;

/** Scene A — black screen, three lines, then the eyes open onto the room. */
export function IntroSequence() {
  const t = useT();
  const reducedMotion = useReducedMotion();
  const later = useTimeouts();
  const [line, setLine] = useState(-1);
  const [opening, setOpening] = useState(false);

  useEffect(() => {
    LINES.forEach((_, i) =>
      later(() => {
        setLine(i);
        playSfx(i === 1 ? 'locked' : 'objectClick');
      }, 600 + i * LINE_MS),
    );
    const openAt = 600 + LINES.length * LINE_MS;
    later(() => {
      setLine(-1);
      setOpening(true);
      playSfx('discovery');
    }, openAt);
    later(() => dispatch({ type: 'BEGIN_EXPLORATION' }), openAt + (reducedMotion ? 400 : OPEN_MS));
  }, [later, reducedMotion]);

  return (
    <div className={`intro ${opening ? 'is-opening' : ''}`} role="presentation">
      <div className="intro-lid intro-lid--top" />
      <div className="intro-lid intro-lid--bottom" />
      <div className="intro-lines" aria-live="polite">
        {LINES.map((text, i) => (
          <p key={i} className={`intro-line ${i === line ? 'is-visible' : ''}`} aria-hidden={i !== line}>
            {t(text)}
          </p>
        ))}
      </div>
      <button type="button" className="intro-skip" onClick={() => dispatch({ type: 'BEGIN_EXPLORATION' })}>
        {t(UI.skip)}
      </button>
    </div>
  );
}
