import { useState } from 'react';
import { OBJECTS } from '../../../game/data/objects';
import { dispatch, playSfx, useGame } from '../../../game/store';
import { clockAngles } from '../../art/random';
import { useT } from '../../hooks';
import { UI } from '../../strings';
import { SceneFrame } from '../SceneFrame';

/** Tower clock position inside the painting art (600×440 space). */
const TOWER = { x: 318, y: 138 };

function PaintingArt({ houseRemembers }: { houseRemembers: boolean }) {
  const { hourDeg, minuteDeg } = clockAngles(9, 45);
  const windowFill = houseRemembers ? '#ffd27d' : '#f0a94f';
  return (
    <svg viewBox="0 0 600 440" className="painting-art" aria-hidden="true">
      <rect x="0" y="0" width="600" height="440" fill="url(#g-gilt)" />
      <rect x="14" y="14" width="572" height="412" fill="#4e3818" />
      <rect x="22" y="22" width="556" height="396" fill="none" stroke="#e6c67a" strokeWidth="1" opacity="0.5" />
      <rect x="34" y="34" width="532" height="372" fill="url(#g-dusk)" />
      {/* Clouds */}
      <path d="M60 110 q60 -20 120 0 t 110 -6" stroke="#f4b27a" strokeWidth="6" fill="none" opacity="0.25" />
      <path d="M340 80 q60 -18 130 4 t 80 -10" stroke="#f4b27a" strokeWidth="5" fill="none" opacity="0.2" />
      {/* Hills */}
      <path d="M34 300 Q140 250 250 285 T460 270 T566 282 V406 H34 Z" fill="#3a2330" />
      <path d="M34 330 Q160 300 300 322 T566 316 V406 H34 Z" fill="#221521" />
      {/* Trees */}
      <path d="M90 330 l14 -60 14 60z M118 334 l10 -40 10 40z M480 322 l14 -54 14 54z" fill="#130c13" />
      {/* House */}
      <path d="M200 236 L260 190 L320 236 Z" fill="#150d14" />
      <rect x="206" y="236" width="230" height="100" fill="#150d14" />
      <path d="M380 236 L408 208 L436 236 Z" fill="#150d14" />
      <rect x="294" y="100" width="48" height="140" fill="#150d14" />
      <path d="M288 104 L318 44 L348 104 Z" fill="#150d14" />
      <line x1="318" y1="44" x2="318" y2="26" stroke="#150d14" strokeWidth="3" />
      {/* Tower clock — 9:45, "the hour I came home" */}
      <circle cx={TOWER.x} cy={TOWER.y} r="14" fill="#efe0b4" stroke="#8a6a38" strokeWidth="2" />
      {Array.from({ length: 12 }, (_, i) => {
        const a = (i / 12) * Math.PI * 2;
        return (
          <line
            key={i}
            x1={TOWER.x + Math.sin(a) * 10.5}
            y1={TOWER.y - Math.cos(a) * 10.5}
            x2={TOWER.x + Math.sin(a) * 12.5}
            y2={TOWER.y - Math.cos(a) * 12.5}
            stroke="#3a2a1a"
            strokeWidth="1"
          />
        );
      })}
      <g stroke="#2a1d14" strokeLinecap="round">
        <line x1={TOWER.x} y1={TOWER.y} x2={TOWER.x} y2={TOWER.y - 6.5} strokeWidth="2" transform={`rotate(${hourDeg} ${TOWER.x} ${TOWER.y})`} />
        <line x1={TOWER.x} y1={TOWER.y} x2={TOWER.x} y2={TOWER.y - 10} strokeWidth="1.3" transform={`rotate(${minuteDeg} ${TOWER.x} ${TOWER.y})`} />
      </g>
      <circle cx={TOWER.x} cy={TOWER.y} r="1.4" fill="#2a1d14" />
      {/* Lit windows */}
      {[
        [222, 262],
        [252, 262],
        [372, 262],
        [402, 262],
        [308, 176],
      ].map(([x, y], i) => (
        <rect key={i} x={x} y={y} width="16" height="22" fill={windowFill} className="painting-window" />
      ))}
      <rect x="306" y="290" width="24" height="46" fill="#f0a94f" opacity="0.55" />
      <path d="M318 336 L300 406 L336 406 Z" fill="#f0a94f" opacity="0.12" />
      {/* Paint texture & varnish */}
      <rect x="34" y="34" width="532" height="372" fill="url(#g-brush)" opacity="0.14" />
      <rect x="34" y="34" width="532" height="372" fill="none" stroke="#000" strokeWidth="30" opacity="0.2" />
      <text x="548" y="396" fontSize="11" fontFamily="Caveat, cursive" fill="#2b1a10" opacity="0.8" textAnchor="end">
        E.V.
      </text>
    </svg>
  );
}

export function PaintingScene() {
  const t = useT();
  const [zoomed, setZoomed] = useState(false);
  const houseRemembers = useGame((s) => s.flags.houseRemembers);
  const found = useGame((s) => s.clues.includes('painting_tower'));

  const toggleZoom = () => {
    playSfx('uiClick');
    if (!zoomed) dispatch({ type: 'DISCOVER_CLUE', clue: 'painting_tower' });
    setZoomed(!zoomed);
  };

  return (
    <SceneFrame
      id="painting"
      title={t({ en: 'Varn House at Dusk', ko: '해 질 녘의 바른 저택' })}
      caption={
        <p>
          {zoomed
            ? t({ en: 'The tower clock reads 9:45.', ko: '탑시계는 9시 45분을 가리키고 있다.' })
            : t(OBJECTS.painting.hover)}
        </p>
      }
    >
      <div className="painting-wrap">
        <div
          className={`painting-canvas ${zoomed ? 'is-zoomed' : ''}`}
          style={{ transformOrigin: `${(TOWER.x / 600) * 100}% ${(TOWER.y / 440) * 100}%` }}
        >
          <PaintingArt houseRemembers={houseRemembers} />
          <button
            type="button"
            className={`painting-tower ${found ? 'is-found' : ''}`}
            style={{ left: `${(TOWER.x / 600) * 100}%`, top: `${(TOWER.y / 440) * 100}%` }}
            onClick={toggleZoom}
            aria-label={t(UI.towerZoom)}
            aria-pressed={zoomed}
          />
        </div>
        <div className="painting-plaque">
          <span>{t({ en: 'WHEN BOTH CLOCKS AGREE', ko: '두 시계가 같은 시간을 가리킬 때' })}</span>
        </div>
      </div>
    </SceneFrame>
  );
}
