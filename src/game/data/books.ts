import { L } from '../i18n';
import type { BookId, LocalizedText } from '../types';

export interface BookDef {
  id: BookId;
  title: LocalizedText;
  /** Short title that fits on the spine; the full title shows on focus. */
  spine: LocalizedText;
  volume: number;
  shelf: 0 | 1 | 2;
  /** Spine colour. */
  color: string;
  /** Relative spine height 0..1 (visual variety). */
  height: number;
}

/** Left-to-right order inside each shelf is the array order. */
export const BOOKS: BookDef[] = [
  { id: 'anchor', title: L('Tidewater', '밀물'), spine: L('Tidewater', '밀물'), volume: 4, shelf: 0, color: '#3d4a52', height: 0.92 },
  { id: 'moon', title: L('Lunar Tables', '달의 표'), spine: L('Lunar Tables', '달의 표'), volume: 2, shelf: 0, color: '#2e3550', height: 0.98 },
  { id: 'leaf', title: L('The Quiet Garden', '고요한 정원'), spine: L('Garden', '정원'), volume: 6, shelf: 0, color: '#3f4a33', height: 0.86 },
  { id: 'candle', title: L('What the Fire Kept', '불이 간직한 것'), spine: L('The Fire', '불'), volume: 9, shelf: 0, color: '#6b2f24', height: 0.95 },

  { id: 'eye', title: L('A Grammar of Silence', '침묵의 문법'), spine: L('Silence', '침묵'), volume: 5, shelf: 1, color: '#4a3b52', height: 0.9 },
  { id: 'feather', title: L('On Flight', '비행에 관하여'), spine: L('On Flight', '비행'), volume: 7, shelf: 1, color: '#5b4a32', height: 1 },
  { id: 'sun', title: L('The Long Noon', '긴 정오'), spine: L('Long Noon', '정오'), volume: 10, shelf: 1, color: '#6e5a2a', height: 0.84 },

  { id: 'key', title: L('Letters Unsent', '부치지 못한 편지'), spine: L('Unsent', '편지'), volume: 1, shelf: 2, color: '#503026', height: 0.94 },
  { id: 'hourglass', title: L('The Patience of Sand', '모래의 인내'), spine: L('Sand', '모래'), volume: 3, shelf: 2, color: '#6a5a44', height: 0.97 },
  { id: 'star', title: L('Maps of Nowhere', '어디에도 없는 지도'), spine: L('Nowhere', '지도'), volume: 8, shelf: 2, color: '#26363f', height: 0.88 },
];

export function romanVolume(volume: number): string {
  const numerals: [number, string][] = [
    [10, 'X'],
    [9, 'IX'],
    [5, 'V'],
    [4, 'IV'],
    [1, 'I'],
  ];
  let rest = volume;
  let out = '';
  for (const [value, glyph] of numerals) {
    while (rest >= value) {
      out += glyph;
      rest -= value;
    }
  }
  return out;
}

export const BOOK_BY_ID: Record<BookId, BookDef> = Object.fromEntries(BOOKS.map((b) => [b.id, b])) as Record<
  BookId,
  BookDef
>;

/** The "four friends", in the order the photograph shows them. */
export const FRIEND_ORDER: BookId[] = ['feather', 'hourglass', 'candle', 'moon'];

/** Safe code = volumes of the four friends in photograph order. */
export const SAFE_CODE = FRIEND_ORDER.map((id) => String(BOOK_BY_ID[id].volume)).join('');
