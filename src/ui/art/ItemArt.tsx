import { memo } from 'react';
import type { ItemId } from '../../game/types';

/**
 * Hand-authored SVG art for every item (100×100 space).
 * The same drawing is used in the inventory slot and in the inspector.
 */
function ItemArtImpl({ item, className }: { item: ItemId; className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden="true" focusable="false">
      {renderItem(item)}
    </svg>
  );
}

function scribbles(x: number, y: number, width: number, lines: number, color = '#4b3b2a', gap = 7) {
  return Array.from({ length: lines }, (_, i) => (
    <path
      key={i}
      d={`M${x} ${y + i * gap} q ${width * 0.25} -2 ${width * 0.5} 0 t ${width * (0.35 + ((i * 37) % 13) / 100)} 0`}
      stroke={color}
      strokeWidth="1.3"
      fill="none"
      strokeLinecap="round"
      opacity="0.75"
    />
  ));
}

function renderItem(item: ItemId) {
  switch (item) {
    case 'brass_key':
      return (
        <g>
          <path d="M22 26 Q 14 10 30 12" stroke="#b9a27a" strokeWidth="1" fill="none" />
          <rect x="8" y="10" width="20" height="13" rx="1.5" fill="url(#ia-paper)" transform="rotate(-14 18 16)" />
          <text x="11" y="20" fontSize="5.5" fill="#4b3b2a" fontFamily="JetBrains Mono, monospace" transform="rotate(-14 18 16)">
            DESK
          </text>
          <g transform="rotate(38 50 50)">
            <circle cx="28" cy="50" r="13" fill="none" stroke="url(#ia-brass)" strokeWidth="6" />
            <circle cx="28" cy="50" r="4" fill="url(#ia-brass)" />
            <rect x="40" y="47" width="44" height="6" rx="2" fill="url(#ia-brass)" />
            <path d="M72 53h5v9h-5zM80 53h4v6h-4z" fill="url(#ia-brass)" />
          </g>
        </g>
      );
    case 'iron_key':
      return (
        <g transform="rotate(32 50 50)">
          <circle cx="27" cy="50" r="17" fill="url(#ia-iron)" stroke="#111" strokeWidth="1" />
          <circle cx="27" cy="50" r="11" fill="#191a1c" stroke="#9a8a6a" strokeWidth="0.8" />
          {Array.from({ length: 12 }, (_, i) => {
            const a = (i / 12) * Math.PI * 2;
            return (
              <line
                key={i}
                x1={27 + Math.cos(a) * 8.5}
                y1={50 + Math.sin(a) * 8.5}
                x2={27 + Math.cos(a) * 10.5}
                y2={50 + Math.sin(a) * 10.5}
                stroke="#c9b27f"
                strokeWidth="0.9"
              />
            );
          })}
          <path d="M27 50 L27 43 M27 50 L32 52" stroke="#c9b27f" strokeWidth="1.1" strokeLinecap="round" />
          <rect x="43" y="46" width="44" height="8" rx="2" fill="url(#ia-iron)" />
          <path d="M74 54h6v12h-6zM82 54h5v8h-5z" fill="url(#ia-iron)" />
        </g>
      );
    case 'note_left':
      return (
        <g transform="rotate(-4 50 50)">
          <path d="M18 14 H56 l-3 8 4 7 -4 9 5 8 -4 9 3 8 -5 9 4 8 -3 6 H18z" fill="url(#ia-paper)" />
          {scribbles(23, 26, 28, 8)}
        </g>
      );
    case 'note_right':
      return (
        <g transform="rotate(5 50 50)">
          <path d="M44 14 H82 V86 H47 l3-6 -4-8 5-9 -3-8 4-9 -5-8 4-9 -4-7z" fill="url(#ia-paper)" />
          {scribbles(52, 26, 26, 8)}
        </g>
      );
    case 'note_full':
      return (
        <g transform="rotate(-2 50 50)">
          <rect x="14" y="14" width="72" height="72" fill="url(#ia-paper)" />
          <path d="M50 14 l-3 8 4 7 -4 9 5 8 -4 9 3 8 -5 9 4 8 -3 6" stroke="#9c8a66" strokeWidth="0.8" fill="none" />
          {scribbles(20, 26, 60, 8)}
        </g>
      );
    case 'photograph':
      return (
        <g transform="rotate(-6 50 50)">
          <rect x="12" y="18" width="76" height="64" fill="#e9dfc8" />
          <rect x="17" y="23" width="66" height="48" fill="url(#ia-sepia)" />
          <rect x="20" y="58" width="60" height="4" fill="#3a2a1c" />
          <path d="M28 57 L33 42" stroke="#e6d4b0" strokeWidth="1.3" />
          <path d="M39 44h7M39 57h7M40 44 q3 6.5 0 13 M45 44 q-3 6.5 0 13" stroke="#d8c29a" strokeWidth="1" fill="none" />
          <rect x="53" y="49" width="4" height="8" fill="#e6d4b0" />
          <path d="M55 43 q2 3 0 5 q-2 -2 0 -5z" fill="#ffd27a" />
          <path d="M72 33 a6 6 0 1 0 4 9 a5 5 0 0 1 -4 -9z" fill="#efe2c3" />
        </g>
      );
    case 'journal':
      return (
        <g>
          <rect x="22" y="14" width="56" height="72" rx="3" fill="url(#ia-leather)" />
          <rect x="22" y="14" width="8" height="72" fill="#24140c" opacity="0.6" />
          <rect x="74" y="16" width="4" height="68" fill="#e1d4b6" />
          <rect x="26" y="46" width="52" height="7" fill="#3b2415" />
          <circle cx="72" cy="49.5" r="3" fill="url(#ia-brass)" />
          <text x="50" y="38" fill="#c9a86a" fontSize="12" fontFamily="Cormorant Garamond, serif" fontStyle="italic" textAnchor="middle">
            E.
          </text>
        </g>
      );
    case 'ink_page':
      return (
        <g transform="rotate(3 50 50)">
          <path d="M20 12 H80 V88 H24 l2-5 -3-6 3-7 -2-6 3-7 -3-6 2-8 -3-6 3-7 -2-6 3-7z" fill="url(#ia-paper)" />
          {scribbles(30, 28, 42, 6, '#8a5a24', 8)}
          <circle cx="60" cy="60" r="22" fill="#e7a24a" opacity="0.08" />
        </g>
      );
    case 'letter':
      return (
        <g>
          <rect x="12" y="24" width="76" height="52" fill="url(#ia-paper)" />
          <path d="M12 24 L50 54 L88 24" fill="none" stroke="#a8966f" strokeWidth="1.2" />
          <circle cx="50" cy="53" r="8" fill="#7d1c1a" />
          <path d="M46 49 l3 4 -2 5 M53 48 l-2 6 3 4" stroke="#4b0e0d" strokeWidth="1" fill="none" />
          <text x="50" y="56" fill="#c46d62" fontSize="7" fontFamily="Cormorant Garamond, serif" textAnchor="middle">
            E
          </text>
        </g>
      );
  }
}

export const ItemArt = memo(ItemArtImpl);
