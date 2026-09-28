import { L } from '../i18n';
import type { BookId, ClockTime, Condition, Effect, GameState, LocalizedText, PuzzleId, PuzzleType } from '../types';
import { FRIEND_ORDER, SAFE_CODE } from './books';

export type PuzzleAnswer =
  | { kind: 'clock'; time: ClockTime }
  | { kind: 'sequence'; books: BookId[] }
  | { kind: 'code'; code: string };

export type PuzzleVerdict = { ok: true } | { ok: false; feedback?: LocalizedText; soft?: boolean };

export interface PuzzleDef {
  id: PuzzleId;
  /** 1-based position in the chain, used for display. */
  index: number;
  type: PuzzleType;
  title: LocalizedText;
  /** Must hold before an answer is even evaluated. */
  requires?: Condition;
  blockedText?: LocalizedText;
  /** Puzzles without an evaluator are solved by interaction/combination effects. */
  evaluate?: (answer: PuzzleAnswer, state: GameState) => PuzzleVerdict;
  onSolve: Effect[];
}

export const PAINTED_TIME: ClockTime = { hour: 9, minute: 45 };
export const STOPPED_TIME: ClockTime = { hour: 11, minute: 52 };
export const DOOR_CODE = '1152';

const WRONG = L('Something is wrong...', '무언가 잘못됐다...');

export function sameTime(a: ClockTime, b: ClockTime): boolean {
  return a.hour === b.hour && a.minute === b.minute;
}

export function digitsOnly(code: string): string {
  return code.replace(/\D/g, '');
}

export const PUZZLES: Record<PuzzleId, PuzzleDef> = {
  clock: {
    id: 'clock',
    index: 1,
    type: 'observation',
    title: L('When Both Clocks Agree', '두 시계가 같은 시간을 가리킬 때'),
    evaluate: (answer) => {
      if (answer.kind !== 'clock') return { ok: false };
      if (sameTime(answer.time, PAINTED_TIME)) return { ok: true };
      return {
        ok: false,
        soft: true,
        feedback: L('The hands settle. Nothing happens.', '바늘이 멈춘다. 아무 일도 일어나지 않는다.'),
      };
    },
    onSolve: [
      { type: 'setFlag', flag: 'clockCaseOpen', value: true },
      { type: 'sfx', id: 'clockChime' },
      { type: 'fx', id: 'flashWarm' },
      {
        type: 'narrate',
        tone: 'discovery',
        text: L('A soft chime. The pendulum case clicks open.', '낮은 종소리. 추 상자가 딸깍 열린다.'),
      },
    ],
  },
  note: {
    id: 'note',
    index: 2,
    type: 'combination',
    title: L('Two Halves', '두 조각'),
    onSolve: [],
  },
  bookshelf: {
    id: 'bookshelf',
    index: 3,
    type: 'sequence',
    title: L('Four Friends', '네 친구'),
    evaluate: (answer) => {
      if (answer.kind !== 'sequence') return { ok: false };
      const books = answer.books;
      if (books.length === FRIEND_ORDER.length && books.every((b, i) => b === FRIEND_ORDER[i])) return { ok: true };
      const rightSet =
        books.length === FRIEND_ORDER.length && FRIEND_ORDER.every((friend) => books.includes(friend));
      return {
        ok: false,
        feedback: rightSet
          ? L('The right friends — in the wrong order.', '맞는 친구들이다. 순서가 틀렸다.')
          : L('The books slide back with a dull thud.', '책들이 둔탁한 소리를 내며 제자리로 돌아간다.'),
      };
    },
    onSolve: [
      { type: 'setFlag', flag: 'shelfOpen', value: true },
      { type: 'sfx', id: 'unlock' },
      { type: 'fx', id: 'dust' },
      { type: 'fx', id: 'shakeSoft' },
      {
        type: 'narrate',
        tone: 'discovery',
        text: L(
          'Something shifts behind the books. A hidden compartment slides open.',
          '책 뒤에서 무언가 움직인다. 숨겨진 칸이 미끄러지듯 열린다.',
        ),
      },
    ],
  },
  ink: {
    id: 'ink',
    index: 4,
    type: 'discovery',
    title: L('Lemon Ink', '레몬 잉크'),
    onSolve: [],
  },
  safe: {
    id: 'safe',
    index: 5,
    type: 'numeric',
    title: L('What the Books Kept', '책들이 간직한 숫자'),
    evaluate: (answer) => {
      if (answer.kind !== 'code') return { ok: false };
      const code = digitsOnly(answer.code);
      if (code === SAFE_CODE) return { ok: true };
      if (code === [...SAFE_CODE].reverse().join('')) {
        return {
          ok: false,
          feedback: L('Close. But the photograph reads left to right.', '가깝다. 하지만 사진은 왼쪽부터 읽는다.'),
        };
      }
      if (code === DOOR_CODE || code === '0945' || code === '945') {
        return {
          ok: false,
          feedback: L('Not a time. The safe wants what the books kept.', '시간이 아니다. 금고는 책들이 간직한 것을 원한다.'),
        };
      }
      return { ok: false, feedback: WRONG };
    },
    onSolve: [
      { type: 'setFlag', flag: 'safeOpen', value: true },
      {
        type: 'narrate',
        tone: 'success',
        text: L('The bolts retract. The safe door swings open.', '빗장이 풀린다. 금고 문이 천천히 열린다.'),
      },
    ],
  },
  door: {
    id: 'door',
    index: 6,
    type: 'final',
    title: L('The Hour I Left', '내가 떠난 시각'),
    requires: { flag: 'doorKeyInserted' },
    blockedText: L('The dial won’t turn. The lock is still engaged.', '다이얼이 돌아가지 않는다. 자물쇠가 아직 잠겨 있다.'),
    evaluate: (answer) => {
      if (answer.kind !== 'code') return { ok: false };
      const code = digitsOnly(answer.code);
      if (code === DOOR_CODE) return { ok: true };
      if (code === '0945' || code === '945') {
        return {
          ok: false,
          feedback: L(
            'That is the hour he came home. The door wants the hour he left.',
            '그건 그가 돌아온 시각이다. 문은 그가 떠난 시각을 원한다.',
          ),
        };
      }
      return { ok: false, feedback: WRONG };
    },
    onSolve: [{ type: 'setFlag', flag: 'finalDoorUnlocked', value: true }],
  },
};

export const PUZZLE_LIST: PuzzleDef[] = Object.values(PUZZLES).sort((a, b) => a.index - b.index);
