import type { BookId } from '../../game/types';

/** Emblems stamped on book spines and echoed in the photograph (24×24 space, stroke art). */
const PATHS: Record<BookId, React.ReactNode> = {
  feather: (
    <>
      <path d="M19 3C11 4 6 10 5 20" />
      <path d="M19 3c-1 6-5 11-11 13M16 5c-3 1-6 3-7 6M18 8c-3 1-6 3-8 6" />
    </>
  ),
  hourglass: (
    <>
      <path d="M6 3h12M6 21h12" />
      <path d="M7 3c0 5 5 6 5 9s-5 4-5 9M17 3c0 5-5 6-5 9s5 4 5 9" />
      <path d="M9.5 18.5h5" />
    </>
  ),
  candle: (
    <>
      <path d="M12 3c2 2.5 2 4.2 0 5.5-2-1.3-2-3 0-5.5z" />
      <path d="M9 10h6v10H9zM6 20h12" />
    </>
  ),
  moon: <path d="M15 3a9 9 0 1 0 6 13A7 7 0 0 1 15 3z" />,
  anchor: (
    <>
      <circle cx="12" cy="5" r="2" />
      <path d="M12 7v14M8 11h8M4 14c1 4 4 7 8 7s7-3 8-7" />
    </>
  ),
  leaf: (
    <>
      <path d="M5 19C5 10 10 4 20 4c0 10-6 15-15 15z" />
      <path d="M5 19L14 10" />
    </>
  ),
  eye: (
    <>
      <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12z" />
      <circle cx="12" cy="12" r="2.5" />
    </>
  ),
  key: (
    <>
      <circle cx="7" cy="12" r="3.5" />
      <path d="M10.5 12H21M17 12v3M20 12v2.5" />
    </>
  ),
  star: <path d="M12 3l2.6 5.8 6.4.6-4.8 4.3 1.4 6.3L12 16.8 6.4 20l1.4-6.3L3 9.4l6.4-.6z" />,
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M5 19l2-2M17 7l2-2" />
    </>
  ),
};

export function BookSymbol({ id, size = 24, color = 'currentColor' }: { id: BookId; size?: number; color?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {PATHS[id]}
    </svg>
  );
}
