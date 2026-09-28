import { memo, useMemo } from 'react';
import { FLOOR_Y, STAGE_HEIGHT, STAGE_WIDTH } from '../../game/data/layout';
import type { ClockTime } from '../../game/types';
import { clockAngles, seededRandom } from './random';

export interface RoomVisualState {
  lampOn: boolean;
  clock: ClockTime;
  clockCaseOpen: boolean;
  clockKeyTaken: boolean;
  memoVisible: boolean;
  drawerOpen: boolean;
  shelfOpen: boolean;
  journalTaken: boolean;
  safeOpen: boolean;
  safeEmpty: boolean;
  doorKeyInserted: boolean;
  houseRemembers: boolean;
}

const BRASS = 'url(#r-brass)';

/* ------------------------------------------------------------------ */
/* Static background — never re-renders                                */
/* ------------------------------------------------------------------ */

const Background = memo(function Background() {
  const planks = useMemo(() => {
    const lines: React.ReactNode[] = [];
    const count = 22;
    for (let i = 0; i <= count; i++) {
      const backX = (i / count) * STAGE_WIDTH;
      const frontX = -500 + (i / count) * (STAGE_WIDTH + 1000);
      lines.push(<line key={`p${i}`} x1={backX} y1={FLOOR_Y} x2={frontX} y2={STAGE_HEIGHT} />);
    }
    [888, 922, 962].forEach((y, i) =>
      lines.push(<line key={`h${i}`} x1={0} y1={y} x2={STAGE_WIDTH} y2={y} opacity={0.5} />),
    );
    return lines;
  }, []);

  return (
    <g>
      {/* Wall */}
      <rect width={STAGE_WIDTH} height={FLOOR_Y} fill="url(#r-wall)" />
      <rect width={STAGE_WIDTH} height={620} fill="url(#r-wallpaper)" opacity={0.55} />
      <rect width={STAGE_WIDTH} height={140} fill="url(#r-ceiling)" />
      {/* Crown molding */}
      <rect y={60} width={STAGE_WIDTH} height={10} fill="#15100c" />
      <rect y={70} width={STAGE_WIDTH} height={3} fill="#3a2a1d" opacity={0.6} />
      {/* Wainscoting */}
      <rect y={620} width={STAGE_WIDTH} height={FLOOR_Y - 620} fill="url(#r-wainscot)" />
      <rect y={612} width={STAGE_WIDTH} height={10} fill="#2c1f16" />
      <rect y={612} width={STAGE_WIDTH} height={2} fill="#5a4330" opacity={0.6} />
      {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
        <rect
          key={i}
          x={20 + i * 200}
          y={645}
          width={170}
          height={170}
          fill="none"
          stroke="#120c08"
          strokeWidth={3}
          opacity={0.7}
        />
      ))}
      {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
        <rect
          key={`hl${i}`}
          x={23 + i * 200}
          y={648}
          width={170}
          height={170}
          fill="none"
          stroke="#4a3526"
          strokeWidth={1}
          opacity={0.35}
        />
      ))}
      <rect y={FLOOR_Y - 22} width={STAGE_WIDTH} height={22} fill="#140e0a" />
      <rect y={FLOOR_Y - 22} width={STAGE_WIDTH} height={2} fill="#4a3526" opacity={0.5} />
      {/* Water stain & cracks: the room is old */}
      <ellipse cx={1030} cy={110} rx={140} ry={60} fill="#000" opacity={0.18} />
      <path d="M1040 70 q10 40 -8 70 t 4 60" stroke="#0b0806" strokeWidth={1.5} fill="none" opacity={0.5} />
      <path d="M380 560 l20 25 -6 18 14 20" stroke="#0b0806" strokeWidth={1.2} fill="none" opacity={0.45} />
      {/* Floor */}
      <rect y={FLOOR_Y} width={STAGE_WIDTH} height={STAGE_HEIGHT - FLOOR_Y} fill="url(#r-floor)" />
      <g stroke="#0c0806" strokeWidth={2} opacity={0.55}>
        {planks}
      </g>
      {/* Rug — the room's only red */}
      <path d="M560 876 L1080 876 L1190 998 L450 998 Z" fill="url(#r-rug)" />
      <path d="M580 884 L1060 884 L1160 990 L480 990 Z" fill="none" stroke="#a3643f" strokeWidth={2} opacity={0.35} />
      <path d="M600 892 L1040 892 L1132 982 L510 982 Z" fill="none" stroke="#2a0c0c" strokeWidth={6} opacity={0.5} />
    </g>
  );
});

/* ------------------------------------------------------------------ */
/* Objects                                                             */
/* ------------------------------------------------------------------ */

function Door({ keyInserted }: { keyInserted: boolean }) {
  return (
    <g>
      {/* Frame */}
      <rect x={62} y={172} width={306} height={FLOOR_Y - 172} fill="#1b120d" />
      <rect x={62} y={172} width={306} height={14} fill="#3b2a1e" />
      <rect x={62} y={172} width={16} height={FLOOR_Y - 172} fill="#2f2118" />
      <rect x={352} y={172} width={16} height={FLOOR_Y - 172} fill="#120c08" />
      {/* Slab */}
      <rect x={86} y={196} width={258} height={FLOOR_Y - 198} fill="url(#r-door)" />
      {[
        [108, 222, 100, 176],
        [222, 222, 100, 176],
        [108, 470, 100, 350],
        [222, 470, 100, 350],
      ].map(([x, y, w, h], i) => (
        <g key={i}>
          <rect x={x} y={y} width={w} height={h} fill="#2c1e15" />
          <path d={`M${x} ${y! + h!} V${y} H${x! + w!}`} stroke="#120c08" strokeWidth={4} fill="none" />
          <path d={`M${x! + w!} ${y} V${y! + h!} H${x}`} stroke="#5b4332" strokeWidth={2} fill="none" opacity={0.6} />
          <rect x={x! + 12} y={y! + 12} width={w! - 24} height={h! - 24} fill="none" stroke="#1a110b" strokeWidth={2} />
        </g>
      ))}
      {/* Time dial on the middle rail */}
      <rect x={168} y={416} width={96} height={38} rx={4} fill={BRASS} />
      <rect x={174} y={422} width={84} height={26} rx={2} fill="#140f0a" />
      {[0, 1, 2, 3].map((i) => (
        <rect key={i} x={178 + i * 20 + (i > 1 ? 4 : 0)} y={425} width={14} height={20} fill="#2a2119" stroke="#6d5634" strokeWidth={0.8} />
      ))}
      <circle cx={216} cy={435} r={1.6} fill="#c9a765" />
      <circle cx={216} cy={441} r={1.6} fill="#c9a765" />
      {/* Heavy bolt */}
      <rect x={288} y={296} width={70} height={18} rx={3} fill="url(#r-iron)" />
      <rect x={300} y={286} width={14} height={38} rx={3} fill="url(#r-iron)" />
      <circle cx={307} cy={305} r={3} fill="#8c8d90" />
      {/* Handle & keyhole */}
      <circle cx={318} cy={540} r={11} fill={BRASS} />
      <path d="M318 540 h-44" stroke={BRASS} strokeWidth={9} strokeLinecap="round" />
      <rect x={303} y={566} width={30} height={52} rx={6} fill={BRASS} />
      <circle cx={318} cy={586} r={6} fill="#0b0806" />
      <path d="M315 588 h6 l-1 14 h-4z" fill="#0b0806" />
      {keyInserted && (
        <g>
          <rect x={316} y={580} width={5} height={26} fill="url(#r-iron)" />
          <circle cx={318.5} cy={612} r={10} fill="url(#r-iron)" stroke="#0e0f10" />
          <circle cx={318.5} cy={612} r={5} fill="#16171a" stroke="#c9b27f" strokeWidth={0.8} />
        </g>
      )}
      {/* Light leaking under the door */}
      <rect x={90} y={FLOOR_Y - 5} width={250} height={5} fill="#ffd9a0" opacity={0.75} filter="url(#r-glow)" />
      <path d={`M90 ${FLOOR_Y} L340 ${FLOOR_Y} L420 ${STAGE_HEIGHT} L0 ${STAGE_HEIGHT} Z`} fill="url(#r-leak)" />
    </g>
  );
}

function WallClock({ time, caseOpen, keyTaken }: { time: ClockTime; caseOpen: boolean; keyTaken: boolean }) {
  const { hourDeg, minuteDeg } = clockAngles(time.hour, time.minute);
  const cx = 495;
  const cy = 238;
  return (
    <g>
      {/* Crown */}
      <path d="M440 176 Q495 132 550 176 Z" fill="#3b2619" />
      <circle cx={495} cy={150} r={7} fill={BRASS} />
      {/* Head */}
      <rect x={428} y={172} width={134} height={134} rx={10} fill="url(#r-clockwood)" />
      <circle cx={cx} cy={cy} r={60} fill={BRASS} />
      <circle cx={cx} cy={cy} r={53} fill="url(#r-dial)" />
      {Array.from({ length: 60 }, (_, i) => {
        const a = (i / 60) * Math.PI * 2;
        const long = i % 5 === 0;
        return (
          <line
            key={i}
            x1={cx + Math.sin(a) * (long ? 42 : 47)}
            y1={cy - Math.cos(a) * (long ? 42 : 47)}
            x2={cx + Math.sin(a) * 50}
            y2={cy - Math.cos(a) * 50}
            stroke="#2b2118"
            strokeWidth={long ? 2.4 : 0.8}
          />
        );
      })}
      <g style={{ transition: 'transform 0.6s cubic-bezier(.3,1.4,.5,1)' }}>
        <line
          x1={cx}
          y1={cy}
          x2={cx}
          y2={cy - 28}
          stroke="#1a130d"
          strokeWidth={4.5}
          strokeLinecap="round"
          transform={`rotate(${hourDeg} ${cx} ${cy})`}
        />
        <line
          x1={cx}
          y1={cy + 6}
          x2={cx}
          y2={cy - 42}
          stroke="#1a130d"
          strokeWidth={2.6}
          strokeLinecap="round"
          transform={`rotate(${minuteDeg} ${cx} ${cy})`}
        />
      </g>
      <circle cx={cx} cy={cy} r={4} fill={BRASS} />
      {/* Case */}
      <rect x={446} y={304} width={98} height={256} rx={6} fill="url(#r-clockwood)" />
      <rect x={458} y={318} width={74} height={220} rx={4} fill="#0e0a07" />
      <line x1={495} y1={320} x2={495} y2={478} stroke="#8e6f3d" strokeWidth={2} />
      <circle cx={495} cy={488} r={17} fill={BRASS} />
      <circle cx={490} cy={483} r={5} fill="#fff4d6" opacity={0.35} />
      {caseOpen ? (
        <g>
          {!keyTaken && (
            <g transform="translate(495 420) rotate(90)">
              <circle r={7} fill="none" stroke={BRASS} strokeWidth={3} />
              <rect x={6} y={-2} width={22} height={4} fill={BRASS} />
              <rect x={22} y={2} width={3} height={5} fill={BRASS} />
            </g>
          )}
          {/* Glass door swung open */}
          <path d="M458 318 L420 330 L420 530 L458 538 Z" fill="#9fb3bf" opacity={0.12} stroke={BRASS} strokeWidth={3} />
        </g>
      ) : (
        <rect x={458} y={318} width={74} height={220} rx={4} fill="url(#r-glass)" stroke={BRASS} strokeWidth={3} />
      )}
      <path d="M470 560 h50 l-8 14 h-34z" fill="#2f1f15" />
    </g>
  );
}

function Painting({ houseRemembers }: { houseRemembers: boolean }) {
  return (
    <g>
      <rect x={646} y={158} width={330} height={250} fill="#000" opacity={0.35} transform="translate(6 8)" />
      <rect x={640} y={150} width={330} height={250} fill="url(#r-gilt)" />
      <rect x={652} y={162} width={306} height={226} fill="#5a4220" />
      <rect x={662} y={172} width={286} height={206} fill="url(#r-dusk)" />
      {/* Distant hills */}
      <path d="M662 330 Q720 300 780 322 T900 310 T948 318 V378 H662 Z" fill="#3a2330" opacity={0.9} />
      <path d="M662 350 Q740 330 820 346 T948 340 V378 H662 Z" fill="#221521" />
      {/* House + tower */}
      <path d="M735 300 L775 272 L815 300 Z" fill="#170f16" />
      <rect x={740} y={300} width={140} height={62} fill="#170f16" />
      <path d="M845 300 L862 282 L880 300 Z" fill="#170f16" />
      <rect x={800} y={232} width={30} height={70} fill="#170f16" />
      <path d="M796 234 L815 200 L834 234 Z" fill="#170f16" />
      <circle cx={815} cy={255} r={8} fill="#e8d7a8" />
      {(() => {
        const { hourDeg, minuteDeg } = clockAngles(9, 45);
        return (
          <g stroke="#2a1d14" strokeWidth={1.2} strokeLinecap="round">
            <line x1={815} y1={255} x2={815} y2={250.5} transform={`rotate(${hourDeg} 815 255)`} />
            <line x1={815} y1={255} x2={815} y2={248.5} transform={`rotate(${minuteDeg} 815 255)`} />
          </g>
        );
      })()}
      {[
        [752, 318],
        [772, 318],
        [848, 318],
        [868, 318],
        [810, 318],
      ].map(([x, y], i) => (
        <rect
          key={i}
          x={x}
          y={y}
          width={10}
          height={14}
          fill={houseRemembers ? '#ffcf73' : '#f0a94f'}
          opacity={houseRemembers ? 1 : 0.85}
        />
      ))}
      <rect x={808} y={338} width={14} height={24} fill="#f0a94f" opacity={0.6} />
      {/* Brush texture */}
      <rect x={662} y={172} width={286} height={206} fill="url(#r-brush)" opacity={0.25} />
      <rect x={662} y={172} width={286} height={206} fill="url(#r-canvasShade)" />
      {/* Plaque */}
      <rect x={764} y={410} width={82} height={16} rx={2} fill={BRASS} />
      <rect x={770} y={416} width={70} height={2} fill="#6b4c22" opacity={0.7} />
    </g>
  );
}

function Lamp({ on }: { on: boolean }) {
  return (
    <g>
      <ellipse cx={705} cy={584} rx={42} ry={8} fill="#0b0806" opacity={0.6} />
      <path d="M672 582 Q705 560 738 582 Z" fill={BRASS} />
      <rect x={701} y={482} width={8} height={86} fill={BRASS} />
      <path d="M705 486 v-8" stroke={BRASS} strokeWidth={10} />
      {/* Shade — green banker's glass */}
      <path d="M660 448 L750 448 L764 484 L646 484 Z" fill="url(#r-shade)" />
      <path d="M660 448 L750 448" stroke="#b9e0b0" strokeWidth={1.2} opacity={0.35} />
      <path d="M646 484 L764 484" stroke={BRASS} strokeWidth={3} />
      <line x1={742} y1={486} x2={742} y2={520} stroke="#c9a765" strokeWidth={1} />
      <circle cx={742} cy={522} r={2.5} fill={BRASS} />
      <ellipse cx={705} cy={486} rx={46} ry={5} fill="#fff1c9" opacity={on ? 0.95 : 0.05} filter="url(#r-glow)" className="room-lamp-bulb" />
    </g>
  );
}

function Desk({ drawerOpen, memoVisible }: { drawerOpen: boolean; memoVisible: boolean }) {
  return (
    <g>
      {/* Legs */}
      {[622, 976].map((x) => (
        <path key={x} d={`M${x} 700 h26 l-5 160 h-16z`} fill="url(#r-deskwood)" />
      ))}
      <rect x={612} y={603} width={396} height={104} fill="url(#r-deskwood)" />
      <rect x={612} y={700} width={396} height={8} fill="#140d09" />
      {/* Top slab */}
      <rect x={598} y={583} width={424} height={22} rx={2} fill="url(#r-desktop)" />
      <rect x={598} y={603} width={424} height={3} fill="#0d0805" />
      {/* Side panels */}
      <rect x={628} y={620} width={110} height={70} fill="none" stroke="#120b07" strokeWidth={3} />
      <rect x={972} y={620} width={0} height={0} />
      <rect x={968} y={620} width={28} height={70} fill="none" stroke="#120b07" strokeWidth={3} />
      {/* Drawer */}
      {drawerOpen ? (
        <g>
          <rect x={754} y={616} width={202} height={22} fill="#070504" />
          <path d="M744 636 H966 L972 716 H738 Z" fill="url(#r-deskwood)" />
          <rect x={738} y={700} width={234} height={16} fill="#1a110b" />
          <circle cx={855} cy={676} r={9} fill={BRASS} />
        </g>
      ) : (
        <g>
          <rect x={754} y={624} width={202} height={72} fill="url(#r-drawer)" stroke="#0e0906" strokeWidth={3} />
          <rect x={760} y={630} width={190} height={60} fill="none" stroke="#5a4130" strokeWidth={1} opacity={0.5} />
          <path d="M843 648 h24 v26 h-24z" fill={BRASS} />
          <circle cx={855} cy={657} r={4} fill="#0b0806" />
          <path d="M853 659 h4 l-1 9 h-2z" fill="#0b0806" />
        </g>
      )}
      {/* Inkwell & quill */}
      <path d="M978 584 h22 l-3 -16 h-16z" fill="#0f1418" stroke="#3b4a52" strokeWidth={1} />
      <path d="M990 570 Q1000 520 1022 500" stroke="#d8ccb0" strokeWidth={2} fill="none" />
      <path d="M1002 540 Q1012 520 1022 500 Q1008 525 998 552" fill="#cfc3a6" opacity={0.8} />
      {/* A closed book on the desk */}
      <path d="M770 584 L846 584 L850 572 L776 572 Z" fill="#3a1f1a" />
      <path d="M776 572 L850 572" stroke="#d9cdb0" strokeWidth={2} />
      {/* The memo */}
      {memoVisible && (
        <g>
          <path d="M872 594 L960 592 L956 568 L880 566 Z" fill="#e7dcc0" />
          <path d="M956 568 l-4 6 5 5 -4 6 5 7" stroke="#b5a47f" strokeWidth={1} fill="none" />
          {[572, 578, 584].map((y, i) => (
            <path key={y} d={`M${886 - i} ${y} q 18 -2 36 0 t ${22 - i * 4} 0`} stroke="#4b3b2a" strokeWidth={1.2} fill="none" opacity={0.7} />
          ))}
        </g>
      )}
    </g>
  );
}

function Basket() {
  return (
    <g>
      <ellipse cx={1072} cy={862} rx={36} ry={6} fill="#000" opacity={0.5} />
      <path d="M1030 772 L1114 772 L1104 860 L1040 860 Z" fill="url(#r-wicker)" />
      {[790, 810, 830, 850].map((y) => (
        <line key={y} x1={1032} y1={y} x2={1112} y2={y} stroke="#1a110b" strokeWidth={2} opacity={0.6} />
      ))}
      <ellipse cx={1072} cy={772} rx={42} ry={7} fill="#1a110b" />
      <circle cx={1058} cy={764} r={13} fill="#d8cdb2" />
      <circle cx={1082} cy={760} r={11} fill="#cbbf9f" />
      <path d="M1050 760 l8 4 -3 6 M1078 756 l6 6" stroke="#9a8c6d" strokeWidth={1} fill="none" />
    </g>
  );
}

function BoardedWindow() {
  return (
    <g>
      <rect x={1108} y={168} width={154} height={204} fill="#1e140e" />
      <rect x={1120} y={180} width={130} height={180} fill="url(#r-night)" />
      <g stroke="#9fb4c8" strokeWidth={1} opacity={0.25}>
        {[1130, 1148, 1170, 1192, 1214, 1236].map((x, i) => (
          <line key={x} x1={x} y1={185 + (i % 3) * 20} x2={x - 6} y2={240 + (i % 3) * 30} />
        ))}
      </g>
      <line x1={1185} y1={180} x2={1185} y2={360} stroke="#1e140e" strokeWidth={6} />
      {[
        [1098, 196, -3],
        [1098, 254, 2],
        [1098, 318, -2],
      ].map(([x, y, rot], i) => (
        <g key={i} transform={`rotate(${rot} 1185 ${y! + 17})`}>
          <rect x={x} y={y} width={174} height={34} fill="url(#r-board)" />
          <circle cx={x! + 10} cy={y! + 17} r={2.5} fill="#6b6e72" />
          <circle cx={x! + 164} cy={y! + 17} r={2.5} fill="#6b6e72" />
        </g>
      ))}
      <rect x={1106} y={372} width={158} height={10} fill="#2a1d14" />
    </g>
  );
}

function Safe({ open, empty }: { open: boolean; empty: boolean }) {
  return (
    <g>
      <ellipse cx={1195} cy={862} rx={82} ry={8} fill="#000" opacity={0.55} />
      <rect x={1122} y={692} width={146} height={166} rx={6} fill="url(#r-safe)" />
      <rect x={1122} y={692} width={146} height={8} rx={4} fill="#3d4a44" opacity={0.6} />
      {open ? (
        <g>
          <rect x={1136} y={708} width={118} height={138} fill="#050606" />
          <rect x={1136} y={776} width={118} height={4} fill="#1d2320" />
          {!empty && (
            <g>
              <rect x={1150} y={758} width={36} height={16} fill="#d8ccb0" opacity={0.9} />
              <circle cx={1168} cy={766} r={3} fill="#7d1c1a" />
              <g transform="translate(1215 768)">
                <circle r={8} fill="url(#r-iron)" />
                <rect x={6} y={-2} width={20} height={4} fill="url(#r-iron)" />
              </g>
              <ellipse cx={1195} cy={770} rx={50} ry={22} fill="#ffd79a" opacity={0.08} />
            </g>
          )}
          <path d="M1136 708 L1098 700 L1098 856 L1136 846 Z" fill="url(#r-safe)" stroke="#c9a765" strokeWidth={1.5} />
        </g>
      ) : (
        <g>
          <rect x={1136} y={708} width={118} height={138} rx={3} fill="url(#r-safedoor)" stroke="#c9a765" strokeWidth={1.5} />
          <rect x={1142} y={714} width={106} height={126} rx={2} fill="none" stroke="#c9a765" strokeWidth={0.6} opacity={0.6} />
          <rect x={1160} y={722} width={60} height={10} rx={1} fill={BRASS} />
          <rect x={1214} y={744} width={28} height={36} rx={2} fill="#161a18" stroke="#c9a765" strokeWidth={1} />
          {[0, 1, 2].map((r) =>
            [0, 1, 2].map((c) => <circle key={`${r}${c}`} cx={1220 + c * 8} cy={752 + r * 9} r={2.2} fill="#c9a765" opacity={0.85} />),
          )}
          <circle cx={1170} cy={790} r={20} fill="none" stroke={BRASS} strokeWidth={4} />
          <path d="M1170 770 v40 M1150 790 h40" stroke={BRASS} strokeWidth={3.5} />
          <circle cx={1170} cy={790} r={5} fill={BRASS} />
        </g>
      )}
      <rect x={1130} y={856} width={14} height={6} fill="#0c0f0e" />
      <rect x={1246} y={856} width={14} height={6} fill="#0c0f0e" />
    </g>
  );
}

const SHELF_BOARDS = [150, 290, 430, 570, 710];

const Bookshelf = memo(function Bookshelf({ open, journalTaken }: { open: boolean; journalTaken: boolean }) {
  const books = useMemo(() => {
    const rand = seededRandom(1911);
    const palette = ['#3d2a22', '#2c3a3f', '#4a2a28', '#3b3a26', '#2a2b3d', '#5a4128', '#26302a', '#4b3c33', '#6b2f24'];
    const out: React.ReactNode[] = [];
    for (let s = 0; s < 3; s++) {
      const bottom = SHELF_BOARDS[s + 1]! - 2;
      let x = 1324;
      let i = 0;
      while (x < 1532) {
        const w = 12 + Math.floor(rand() * 12);
        if (x + w > 1536) break;
        const h = 92 + Math.floor(rand() * 36);
        const color = palette[Math.floor(rand() * palette.length)]!;
        const lean = rand() < 0.08 ? 6 : 0;
        const gap = open && s === 1 && x > 1404 && x < 1464;
        if (!gap) {
          out.push(
            <g key={`${s}-${i}`} transform={lean ? `rotate(${lean} ${x + w} ${bottom})` : undefined}>
              <rect x={x} y={bottom - h} width={w} height={h} fill={color} />
              <rect x={x} y={bottom - h + 10} width={w} height={2} fill="#c9a765" opacity={0.45} />
              <rect x={x} y={bottom - 16} width={w} height={2} fill="#c9a765" opacity={0.35} />
              <rect x={x} y={bottom - h} width={2} height={h} fill="#000" opacity={0.3} />
            </g>,
          );
        }
        x += w + 1;
        i++;
      }
    }
    return out;
  }, [open]);

  return (
    <g>
      <rect x={1296} y={124} width={268} height={FLOOR_Y - 124} fill="#000" opacity={0.3} transform="translate(8 0)" />
      <rect x={1300} y={130} width={260} height={FLOOR_Y - 130} fill="url(#r-shelfwood)" />
      <rect x={1318} y={150} width={224} height={FLOOR_Y - 170} fill="#0d0907" />
      <rect x={1292} y={126} width={276} height={16} fill="#3b2a1e" />
      {books}
      {open && (
        <g>
          <rect x={1406} y={300} width={58} height={128} fill="#040302" />
          <rect x={1406} y={300} width={58} height={128} fill="url(#r-compartment)" />
          {!journalTaken && <rect x={1418} y={384} width={34} height={42} rx={2} fill="#5a3320" stroke="#2e1a10" />}
        </g>
      )}
      {/* Lower shelf: lying books and a box */}
      <rect x={1330} y={548} width={90} height={20} fill="#3b2a22" />
      <rect x={1336} y={530} width={80} height={18} fill="#2a3036" />
      <rect x={1450} y={516} width={70} height={52} fill="#241912" stroke="#4a3526" strokeWidth={1} />
      {/* Cabinet */}
      <rect x={1322} y={716} width={106} height={136} fill="url(#r-shelfwood)" stroke="#120c08" strokeWidth={3} />
      <rect x={1432} y={716} width={106} height={136} fill="url(#r-shelfwood)" stroke="#120c08" strokeWidth={3} />
      <circle cx={1418} cy={784} r={4} fill={BRASS} />
      <circle cx={1442} cy={784} r={4} fill={BRASS} />
      {SHELF_BOARDS.map((y) => (
        <g key={y}>
          <rect x={1310} y={y - 4} width={240} height={10} fill="#3a2a1e" />
          <rect x={1310} y={y + 6} width={240} height={3} fill="#000" opacity={0.4} />
        </g>
      ))}
    </g>
  );
});

/* ------------------------------------------------------------------ */
/* Lighting                                                            */
/* ------------------------------------------------------------------ */

function Lighting({ lampOn, houseRemembers }: { lampOn: boolean; houseRemembers: boolean }) {
  return (
    <g pointerEvents="none">
      {/* Moonlight through the boards — visible mostly in the dark */}
      <g className="room-light" style={{ opacity: lampOn ? 0.35 : 1 }}>
        <path d="M1122 232 L1250 226 L1040 900 L760 900 Z" fill="url(#r-moonbeam)" />
        <path d="M1122 292 L1250 290 L1100 900 L900 900 Z" fill="url(#r-moonbeam)" opacity={0.7} />
      </g>
      {/* Lamp light */}
      <g className="room-light" style={{ opacity: lampOn ? 1 : 0 }}>
        <path d="M646 486 L764 486 L1000 600 L560 600 Z" fill="url(#r-cone)" />
        <ellipse cx={705} cy={590} rx={330} ry={46} fill="url(#r-pool)" />
        <rect width={STAGE_WIDTH} height={STAGE_HEIGHT} fill="url(#r-lampwash)" style={{ mixBlendMode: 'screen' }} />
      </g>
      {/* Darkness masks */}
      <rect width={STAGE_WIDTH} height={STAGE_HEIGHT} fill="url(#r-dark-lit)" className="room-light" style={{ opacity: lampOn ? 1 : 0 }} />
      <rect width={STAGE_WIDTH} height={STAGE_HEIGHT} fill="url(#r-dark-unlit)" className="room-light" style={{ opacity: lampOn ? 0 : 1 }} />
      {houseRemembers && <rect width={STAGE_WIDTH} height={STAGE_HEIGHT} fill="#ffb45a" opacity={0.05} />}
    </g>
  );
}

/* ------------------------------------------------------------------ */
/* Composition                                                         */
/* ------------------------------------------------------------------ */

function RoomArtImpl(props: RoomVisualState) {
  return (
    <svg
      className="room-art"
      viewBox={`0 0 ${STAGE_WIDTH} ${STAGE_HEIGHT}`}
      width={STAGE_WIDTH}
      height={STAGE_HEIGHT}
      aria-hidden="true"
      focusable="false"
    >
      <RoomDefs />
      <Background />
      <g className="art art--door">
        <Door keyInserted={props.doorKeyInserted} />
      </g>
      <g className="art art--clock">
        <WallClock time={props.clock} caseOpen={props.clockCaseOpen} keyTaken={props.clockKeyTaken} />
      </g>
      <g className="art art--painting">
        <Painting houseRemembers={props.houseRemembers} />
      </g>
      <g className="art art--window">
        <BoardedWindow />
      </g>
      <g className="art art--desk">
        <Desk drawerOpen={props.drawerOpen} memoVisible={props.memoVisible} />
      </g>
      <g className="art art--lamp">
        <Lamp on={props.lampOn} />
      </g>
      <g className="art art--basket">
        <Basket />
      </g>
      <g className="art art--safe">
        <Safe open={props.safeOpen} empty={props.safeEmpty} />
      </g>
      <g className="art art--bookshelf">
        <Bookshelf open={props.shelfOpen} journalTaken={props.journalTaken} />
      </g>
      <Lighting lampOn={props.lampOn} houseRemembers={props.houseRemembers} />
    </svg>
  );
}

export const RoomArt = memo(RoomArtImpl);

/* ------------------------------------------------------------------ */
/* Paint                                                               */
/* ------------------------------------------------------------------ */

const RoomDefs = memo(function RoomDefs() {
  return (
    <defs>
      <linearGradient id="r-wall" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#15110f" />
        <stop offset="0.6" stopColor="#221b16" />
        <stop offset="1" stopColor="#1a1411" />
      </linearGradient>
      <pattern id="r-wallpaper" width="56" height="84" patternUnits="userSpaceOnUse">
        <path d="M28 6 Q40 24 28 42 Q16 24 28 6Z M0 48 Q12 66 0 84 M56 48 Q44 66 56 84" fill="none" stroke="#3a2e25" strokeWidth="1.2" />
        <circle cx="28" cy="63" r="2" fill="#3a2e25" />
      </pattern>
      <linearGradient id="r-ceiling" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#050403" />
        <stop offset="1" stopColor="#050403" stopOpacity="0" />
      </linearGradient>
      <linearGradient id="r-wainscot" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#23180f" />
        <stop offset="1" stopColor="#170f0a" />
      </linearGradient>
      <linearGradient id="r-floor" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#1c130d" />
        <stop offset="1" stopColor="#2b1d13" />
      </linearGradient>
      <linearGradient id="r-rug" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#3b1414" />
        <stop offset="1" stopColor="#521d19" />
      </linearGradient>
      <linearGradient id="r-brass" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#e7c57b" />
        <stop offset="0.5" stopColor="#a67c36" />
        <stop offset="1" stopColor="#5a3d17" />
      </linearGradient>
      <linearGradient id="r-iron" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#6f7275" />
        <stop offset="1" stopColor="#1d1f21" />
      </linearGradient>
      <linearGradient id="r-door" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="#35261b" />
        <stop offset="0.5" stopColor="#3d2b1f" />
        <stop offset="1" stopColor="#261a12" />
      </linearGradient>
      <linearGradient id="r-clockwood" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="#4a2d1b" />
        <stop offset="0.5" stopColor="#5b3a23" />
        <stop offset="1" stopColor="#2e1b10" />
      </linearGradient>
      <radialGradient id="r-dial" cx="0.45" cy="0.4" r="0.7">
        <stop offset="0" stopColor="#efe4c8" />
        <stop offset="1" stopColor="#bcae8b" />
      </radialGradient>
      <linearGradient id="r-glass" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#c8d8e0" stopOpacity="0.18" />
        <stop offset="0.4" stopColor="#c8d8e0" stopOpacity="0.02" />
        <stop offset="1" stopColor="#c8d8e0" stopOpacity="0.1" />
      </linearGradient>
      <linearGradient id="r-gilt" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#d9b56a" />
        <stop offset="0.35" stopColor="#8a6428" />
        <stop offset="0.7" stopColor="#c69c4f" />
        <stop offset="1" stopColor="#5c3f16" />
      </linearGradient>
      <linearGradient id="r-dusk" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#1f1a33" />
        <stop offset="0.45" stopColor="#6b3b5c" />
        <stop offset="0.8" stopColor="#d77f47" />
        <stop offset="1" stopColor="#f0b56a" />
      </linearGradient>
      <pattern id="r-brush" width="12" height="12" patternUnits="userSpaceOnUse" patternTransform="rotate(35)">
        <line x1="0" y1="0" x2="0" y2="12" stroke="#000" strokeWidth="3" />
      </pattern>
      <radialGradient id="r-canvasShade" cx="0.5" cy="0.5" r="0.75">
        <stop offset="0.6" stopColor="#000" stopOpacity="0" />
        <stop offset="1" stopColor="#000" stopOpacity="0.55" />
      </radialGradient>
      <linearGradient id="r-shade" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#2f6b3c" />
        <stop offset="0.6" stopColor="#1c4a28" />
        <stop offset="1" stopColor="#0f2b17" />
      </linearGradient>
      <linearGradient id="r-deskwood" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#3a2518" />
        <stop offset="1" stopColor="#24160e" />
      </linearGradient>
      <linearGradient id="r-desktop" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#5a3a24" />
        <stop offset="1" stopColor="#35231a" />
      </linearGradient>
      <linearGradient id="r-drawer" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#402a1b" />
        <stop offset="1" stopColor="#2a1b11" />
      </linearGradient>
      <linearGradient id="r-wicker" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="#3b2a18" />
        <stop offset="0.5" stopColor="#57402a" />
        <stop offset="1" stopColor="#2b1e12" />
      </linearGradient>
      <linearGradient id="r-night" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#0b1622" />
        <stop offset="1" stopColor="#1b2c3c" />
      </linearGradient>
      <linearGradient id="r-board" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#4a3828" />
        <stop offset="1" stopColor="#2c2016" />
      </linearGradient>
      <linearGradient id="r-safe" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#26302b" />
        <stop offset="1" stopColor="#0c100e" />
      </linearGradient>
      <linearGradient id="r-safedoor" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#2e3a34" />
        <stop offset="1" stopColor="#131916" />
      </linearGradient>
      <linearGradient id="r-shelfwood" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="#2f2016" />
        <stop offset="0.5" stopColor="#3b291c" />
        <stop offset="1" stopColor="#22170f" />
      </linearGradient>
      <radialGradient id="r-compartment" cx="0.5" cy="0.8" r="0.8">
        <stop offset="0" stopColor="#ffcf8a" stopOpacity="0.25" />
        <stop offset="1" stopColor="#ffcf8a" stopOpacity="0" />
      </radialGradient>
      <linearGradient id="r-leak" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#ffd08a" stopOpacity="0.28" />
        <stop offset="1" stopColor="#ffd08a" stopOpacity="0" />
      </linearGradient>
      <linearGradient id="r-moonbeam" x1="0" y1="0" x2="-0.3" y2="1">
        <stop offset="0" stopColor="#a8c4e0" stopOpacity="0.16" />
        <stop offset="1" stopColor="#a8c4e0" stopOpacity="0" />
      </linearGradient>
      <linearGradient id="r-cone" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#ffe2a8" stopOpacity="0.4" />
        <stop offset="1" stopColor="#ffcf80" stopOpacity="0.05" />
      </linearGradient>
      <radialGradient id="r-pool">
        <stop offset="0" stopColor="#ffd899" stopOpacity="0.45" />
        <stop offset="1" stopColor="#ffd899" stopOpacity="0" />
      </radialGradient>
      <radialGradient id="r-lampwash" cx="705" cy="500" r="760" gradientUnits="userSpaceOnUse">
        <stop offset="0" stopColor="#ffb866" stopOpacity="0.32" />
        <stop offset="0.5" stopColor="#ff9a44" stopOpacity="0.08" />
        <stop offset="1" stopColor="#ff9a44" stopOpacity="0" />
      </radialGradient>
      <radialGradient id="r-dark-lit" cx="720" cy="520" r="980" gradientUnits="userSpaceOnUse">
        <stop offset="0" stopColor="#000" stopOpacity="0" />
        <stop offset="0.55" stopColor="#000" stopOpacity="0.28" />
        <stop offset="1" stopColor="#000" stopOpacity="0.72" />
      </radialGradient>
      <radialGradient id="r-dark-unlit" cx="1000" cy="560" r="1000" gradientUnits="userSpaceOnUse">
        <stop offset="0" stopColor="#02040a" stopOpacity="0.42" />
        <stop offset="0.6" stopColor="#02040a" stopOpacity="0.62" />
        <stop offset="1" stopColor="#000" stopOpacity="0.85" />
      </radialGradient>
      <filter id="r-glow" x="-50%" y="-200%" width="200%" height="500%">
        <feGaussianBlur stdDeviation="4" />
      </filter>
    </defs>
  );
});

