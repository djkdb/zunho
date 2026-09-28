/**
 * The photograph: a windowsill at night, four objects left to right —
 * quill feather, hourglass, candle, and the crescent moon in the glass.
 * With `truth`, the photographer's reflection surfaces in the window.
 */
export function PhotoArt({ truth }: { truth: boolean }) {
  return (
    <svg viewBox="0 0 400 300" className="photo-art" aria-hidden="true">
      <defs>
        <radialGradient id="ph-candle" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#ffe3a8" stopOpacity="0.8" />
          <stop offset="1" stopColor="#ffe3a8" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="ph-glass" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1f1a14" />
          <stop offset="1" stopColor="#3a2e22" />
        </linearGradient>
        <filter id="ph-sepia">
          <feColorMatrix
            type="matrix"
            values="0.39 0.77 0.19 0 0  0.35 0.69 0.17 0 0  0.27 0.53 0.13 0 0  0 0 0 1 0"
          />
        </filter>
      </defs>
      <g filter="url(#ph-sepia)">
        <rect width="400" height="300" fill="#4a3a2a" />
        {/* Window */}
        <rect x="210" y="20" width="170" height="190" fill="#1b1611" />
        <rect x="220" y="30" width="150" height="170" fill="url(#ph-glass)" />
        <line x1="295" y1="30" x2="295" y2="200" stroke="#1b1611" strokeWidth="6" />
        <line x1="220" y1="115" x2="370" y2="115" stroke="#1b1611" strokeWidth="6" />
        <path d="M338 50 a20 20 0 1 0 14 34 a16 16 0 0 1 -14 -34z" fill="#f4ead2" />
        {truth && (
          <g className="photo-reflection">
            <ellipse cx="262" cy="92" rx="22" ry="27" fill="#d8c8a8" opacity="0.28" />
            <path d="M226 200 q8 -60 36 -64 q28 4 36 64z" fill="#d8c8a8" opacity="0.22" />
            <rect x="244" y="118" width="36" height="24" rx="3" fill="#d8c8a8" opacity="0.3" />
            <circle cx="262" cy="130" r="7" fill="#1b1611" opacity="0.5" />
          </g>
        )}
        {/* Sill */}
        <rect x="0" y="210" width="400" height="16" fill="#2a2016" />
        <rect x="0" y="226" width="400" height="74" fill="#3a2d20" />
        {/* Inkwell + quill */}
        <path d="M40 210 h30 l-4 -22 h-22z" fill="#15120e" />
        <path d="M58 190 Q70 120 110 80" stroke="#e8dcc0" strokeWidth="3" fill="none" />
        <path d="M76 140 Q90 100 110 80 Q96 112 70 160z" fill="#ddd0b3" />
        {/* Hourglass */}
        <g transform="translate(118 140)">
          <rect x="0" y="0" width="44" height="6" fill="#2a2016" />
          <rect x="0" y="64" width="44" height="6" fill="#2a2016" />
          <path d="M6 6 q0 22 16 29 q-16 7 -16 29 h32 q0 -22 -16 -29 q16 -7 16 -29z" fill="#cfc2a3" opacity="0.5" />
          <path d="M12 56 q10 -10 20 0 v8 h-20z" fill="#b89a6a" />
        </g>
        {/* Candle */}
        <circle cx="200" cy="146" r="40" fill="url(#ph-candle)" />
        <rect x="190" y="160" width="20" height="50" fill="#e8dcc0" />
        <path d="M200 136 q7 10 0 20 q-7 -10 0 -20z" fill="#fff2cf" />
        <rect x="182" y="206" width="36" height="6" fill="#2a2016" />
      </g>
      {/* Photo grain & vignette */}
      <rect width="400" height="300" fill="none" stroke="#000" strokeWidth="40" opacity="0.25" />
    </svg>
  );
}
