import { useCallback, useRef, useState } from 'react';
import { OBJECTS } from '../../../game/data/objects';
import { dispatch, playSfx, useGame } from '../../../game/store';
import type { ClockTime } from '../../../game/types';
import { clockAngles } from '../../art/random';
import { IconChevronLeft, IconChevronRight } from '../../common/icons';
import { useHoldRepeat, useT } from '../../hooks';
import { UI } from '../../strings';
import { PickupButton, SceneFrame } from '../SceneFrame';

const ROMAN = ['XII', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI'];

function shiftTime(time: ClockTime, minutes: number): ClockTime {
  const total = (((time.hour % 12) * 60 + time.minute + minutes) % 720 + 720) % 720;
  const hour = Math.floor(total / 60);
  return { hour: hour === 0 ? 12 : hour, minute: total % 60 };
}

function ClockFace({ time, onDragMinute }: { time: ClockTime; onDragMinute: (minute: number) => void }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const dragging = useRef(false);
  const { hourDeg, minuteDeg } = clockAngles(time.hour, time.minute);

  const minuteFromPointer = (e: React.PointerEvent) => {
    const rect = svgRef.current!.getBoundingClientRect();
    const dx = e.clientX - (rect.left + rect.width / 2);
    const dy = e.clientY - (rect.top + rect.height / 2);
    const deg = (Math.atan2(dx, -dy) * 180) / Math.PI;
    return Math.round(((deg + 360) % 360) / 6) % 60;
  };

  return (
    <svg
      ref={svgRef}
      className="clock-face"
      viewBox="0 0 300 300"
      role="img"
      aria-label={`${time.hour}:${String(time.minute).padStart(2, '0')}`}
      onPointerDown={(e) => {
        dragging.current = true;
        (e.target as Element).setPointerCapture?.(e.pointerId);
        onDragMinute(minuteFromPointer(e));
      }}
      onPointerMove={(e) => dragging.current && onDragMinute(minuteFromPointer(e))}
      onPointerUp={() => (dragging.current = false)}
      onPointerCancel={() => (dragging.current = false)}
    >
      <defs>
        <radialGradient id="cf-dial" cx="0.45" cy="0.4" r="0.75">
          <stop offset="0" stopColor="#f3ead2" />
          <stop offset="0.8" stopColor="#d8caa5" />
          <stop offset="1" stopColor="#a8987a" />
        </radialGradient>
      </defs>
      <circle cx="150" cy="150" r="146" fill="url(#g-brass)" />
      <circle cx="150" cy="150" r="136" fill="#3b2619" />
      <circle cx="150" cy="150" r="128" fill="url(#cf-dial)" />
      {Array.from({ length: 60 }, (_, i) => {
        const a = (i / 60) * Math.PI * 2;
        const long = i % 5 === 0;
        return (
          <line
            key={i}
            x1={150 + Math.sin(a) * (long ? 110 : 116)}
            y1={150 - Math.cos(a) * (long ? 110 : 116)}
            x2={150 + Math.sin(a) * 122}
            y2={150 - Math.cos(a) * 122}
            stroke="#2b2118"
            strokeWidth={long ? 3 : 1}
          />
        );
      })}
      {ROMAN.map((numeral, i) => {
        const a = (i / 12) * Math.PI * 2;
        return (
          <text
            key={numeral}
            x={150 + Math.sin(a) * 92}
            y={150 - Math.cos(a) * 92 + 7}
            textAnchor="middle"
            fontSize="19"
            fontFamily="Cormorant Garamond, serif"
            fontWeight="600"
            fill="#2b2118"
          >
            {numeral}
          </text>
        );
      })}
      <text x="150" y="205" textAnchor="middle" fontSize="9" letterSpacing="3" fill="#6b5a44" fontFamily="Cormorant Garamond, serif">
        VARN · LONDON
      </text>
      <g className="clock-hands">
        <path
          d="M150 150 L145 150 L150 82 L155 150 Z"
          fill="#1a130d"
          style={{ transform: `rotate(${hourDeg}deg)`, transformOrigin: '150px 150px' }}
        />
        <path
          d="M150 162 L147 150 L150 40 L153 150 Z"
          fill="#1a130d"
          style={{ transform: `rotate(${minuteDeg}deg)`, transformOrigin: '150px 150px' }}
        />
      </g>
      <circle cx="150" cy="150" r="7" fill="url(#g-brass)" />
      <circle cx="146" cy="120" r="70" fill="#fff" opacity="0.06" pointerEvents="none" />
    </svg>
  );
}

function Stepper({ label, value, onStep }: { label: string; value: string; onStep: (delta: number) => void }) {
  const dec = useHoldRepeat(useCallback(() => onStep(-1), [onStep]));
  const inc = useHoldRepeat(useCallback(() => onStep(1), [onStep]));
  return (
    <div className="stepper" role="group" aria-label={label}>
      <button type="button" className="stepper-btn" aria-label={`${label} −`} {...dec}>
        <IconChevronLeft />
      </button>
      <span className="stepper-value">
        <small>{label}</small>
        {value}
      </span>
      <button type="button" className="stepper-btn" aria-label={`${label} +`} {...inc}>
        <IconChevronRight />
      </button>
    </div>
  );
}

export function ClockScene() {
  const t = useT();
  const committed = useGame((s) => s.clock);
  const solved = useGame((s) => s.solvedPuzzles.includes('clock'));
  const caseOpen = useGame((s) => s.flags.clockCaseOpen);
  const keyTaken = useGame((s) => s.takenPickups.includes('clock_key'));
  const [draft, setDraft] = useState<ClockTime>(committed);

  const stepHour = useCallback((d: number) => {
    playSfx('clockTick');
    setDraft((time) => shiftTime(time, d * 60));
  }, []);
  const stepMinute = useCallback((d: number) => {
    playSfx('clockTick');
    setDraft((time) => shiftTime(time, d));
  }, []);
  const dragMinute = useCallback((minute: number) => {
    setDraft((time) => {
      if (time.minute === minute) return time;
      playSfx('clockTick');
      // Carry the hour when the minute hand sweeps across XII.
      let hour = time.hour;
      if (time.minute >= 45 && minute < 15) hour = (hour % 12) + 1;
      else if (time.minute < 15 && minute >= 45) hour = hour === 1 ? 12 : hour - 1;
      return { hour, minute };
    });
  }, []);

  const changed = draft.hour !== committed.hour || draft.minute !== committed.minute;

  return (
    <SceneFrame
      id="clock"
      title={t(OBJECTS.clock.name)}
      caption={
        <p>
          {solved
            ? t({ en: 'The case is open. The hands move freely now.', ko: '추 상자가 열렸다. 이제 바늘이 자유롭게 움직인다.' })
            : t({ en: 'The pendulum hangs still. The hands stopped at 11:52.', ko: '추가 멈춰 있다. 바늘은 11시 52분에 멈춰 있다.' })}
        </p>
      }
    >
      <div className="clock-layout">
        <ClockFace time={draft} onDragMinute={dragMinute} />
        <div className="clock-controls">
          <Stepper label={t(UI.hour)} value={String(draft.hour)} onStep={stepHour} />
          <Stepper label={t(UI.minute)} value={String(draft.minute).padStart(2, '0')} onStep={stepMinute} />
          <button
            type="button"
            className="brass-button"
            onClick={() => dispatch({ type: 'SET_CLOCK', time: draft })}
            disabled={!changed && solved}
          >
            {t(UI.setHands)}
          </button>
        </div>
        <div className={`clock-case ${caseOpen ? 'is-open' : ''}`}>
          <div className="clock-case-inner">
            <span className="clock-pendulum" aria-hidden="true" />
            {caseOpen && !keyTaken && (
              <PickupButton item="brass_key" className="clock-key" onTake={() => dispatch({ type: 'TAKE', pickup: 'clock_key' })} />
            )}
          </div>
          <span className="clock-case-door" aria-hidden="true" />
        </div>
      </div>
    </SceneFrame>
  );
}
