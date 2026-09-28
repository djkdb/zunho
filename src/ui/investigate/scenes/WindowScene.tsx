import { CLUES } from '../../../game/data/clues';
import { OBJECTS } from '../../../game/data/objects';
import { useT } from '../../hooks';
import { SceneFrame } from '../SceneFrame';

const TALLY_GROUPS = 8; // 8 × 5 + 1 = 41 days

function Tally() {
  const marks: React.ReactNode[] = [];
  for (let g = 0; g < TALLY_GROUPS; g++) {
    const x0 = 20 + (g % 4) * 70;
    const y0 = 30 + Math.floor(g / 4) * 70;
    for (let i = 0; i < 4; i++) {
      marks.push(<line key={`${g}-${i}`} x1={x0 + i * 10} y1={y0} x2={x0 + i * 10 + 2} y2={y0 + 40} />);
    }
    marks.push(<line key={`${g}-x`} x1={x0 - 6} y1={y0 + 32} x2={x0 + 38} y2={y0 + 8} />);
  }
  marks.push(<line key="last" x1={300} y1={170} x2={302} y2={210} />);
  return (
    <svg viewBox="0 0 320 230" className="tally" aria-hidden="true">
      <g stroke="#c9bfae" strokeWidth="2.2" strokeLinecap="round" opacity="0.8">
        {marks}
      </g>
    </svg>
  );
}

export function WindowScene() {
  const t = useT();
  return (
    <SceneFrame id="window" title={t(OBJECTS.window.name)} caption={<p>{t(CLUES.window_tally.text)}</p>}>
      <div className="window-close">
        <div className="window-rain" aria-hidden="true" />
        <div className="window-boards" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <div className="window-plaster">
          <Tally />
        </div>
      </div>
    </SceneFrame>
  );
}
