/**
 * Shared SVG paint servers, mounted once at the app root.
 * Keeping them in a single always-rendered (but invisible) SVG avoids
 * gradients disappearing when the first element that defined them unmounts.
 */
export function GlobalDefs() {
  return (
    <svg className="global-defs" width="0" height="0" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="g-brass" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f0cf86" />
          <stop offset="0.45" stopColor="#b8893c" />
          <stop offset="1" stopColor="#5e4018" />
        </linearGradient>
        <linearGradient id="g-iron" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#7c7f83" />
          <stop offset="0.5" stopColor="#44474b" />
          <stop offset="1" stopColor="#1b1d20" />
        </linearGradient>
        <linearGradient id="ia-brass" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f2d38a" />
          <stop offset="0.45" stopColor="#c19343" />
          <stop offset="1" stopColor="#6e4b1c" />
        </linearGradient>
        <linearGradient id="ia-iron" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#8d8f92" />
          <stop offset="0.5" stopColor="#4a4d51" />
          <stop offset="1" stopColor="#1f2124" />
        </linearGradient>
        <linearGradient id="ia-paper" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#efe4cb" />
          <stop offset="1" stopColor="#cdbd98" />
        </linearGradient>
        <linearGradient id="ia-leather" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#6b3e25" />
          <stop offset="1" stopColor="#2e1a10" />
        </linearGradient>
        <radialGradient id="ia-sepia" cx="0.5" cy="0.45" r="0.7">
          <stop offset="0" stopColor="#8a6a45" />
          <stop offset="1" stopColor="#2e2217" />
        </radialGradient>
        <linearGradient id="g-wood" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#4a3020" />
          <stop offset="1" stopColor="#24160e" />
        </linearGradient>
        <linearGradient id="g-door" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#3a2a1e" />
          <stop offset="0.5" stopColor="#45311f" />
          <stop offset="1" stopColor="#2a1c13" />
        </linearGradient>
        <linearGradient id="g-safe" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#34423b" />
          <stop offset="1" stopColor="#111614" />
        </linearGradient>
        <linearGradient id="g-dusk" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1f1a33" />
          <stop offset="0.45" stopColor="#6b3b5c" />
          <stop offset="0.8" stopColor="#d77f47" />
          <stop offset="1" stopColor="#f0b56a" />
        </linearGradient>
        <linearGradient id="g-gilt" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#dcb86c" />
          <stop offset="0.35" stopColor="#8a6428" />
          <stop offset="0.7" stopColor="#c69c4f" />
          <stop offset="1" stopColor="#5c3f16" />
        </linearGradient>
        <linearGradient id="g-night" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#08121c" />
          <stop offset="1" stopColor="#1b2c3c" />
        </linearGradient>
        <pattern id="g-brush" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(35)">
          <line x1="0" y1="0" x2="0" y2="10" stroke="#000" strokeWidth="2.5" />
        </pattern>
      </defs>
    </svg>
  );
}
