import { L } from '../i18n';
import type { Condition, DocId, Effect, LocalizedText } from '../types';

export type DocStyle = 'hand' | 'journal' | 'type' | 'photo';

export interface DocPage {
  text: LocalizedText;
  /** Text that is invisible until `when` holds (e.g. lemon ink revealed by heat). */
  hidden?: { when: Condition; text: LocalizedText };
  onRead?: Effect[];
}

export interface DocDef {
  id: DocId;
  style: DocStyle;
  pages: DocPage[];
}

/**
 * The torn note is authored once, as [left, right] fragments per line,
 * so both halves and the mended note always stay consistent.
 */
const NOTE_LINES: { en: [string, string]; ko: [string, string] }[] = [
  { en: ['Whoever wakes ', 'here — listen.'], ko: ['여기서 눈을 ', '뜬 사람에게.'] },
  { en: ['The house remembers ', 'the hour I left.'], ko: ['이 집은 내가 ', '떠난 시각을 기억한다.'] },
  { en: ['Four friends kept me ', 'company on the long nights.'], ko: ['긴 밤마다 네 친구가 ', '곁을 지켜 주었다.'] },
  { en: ['Pull them in the order ', 'the photograph remembers,'], ko: ['사진이 기억하는 순서대로 ', '그들을 꺼내면,'] },
  { en: ['and the shelf ', 'will answer.  — E.'], ko: ['책장이 ', '대답할 것이다.  — E.'] },
];

function noteText(part: 'left' | 'right' | 'full'): LocalizedText {
  const pick = (pair: [string, string]) =>
    part === 'left' ? `${pair[0].trimEnd()}…` : part === 'right' ? `…${pair[1]}` : pair[0] + pair[1];
  return {
    en: NOTE_LINES.map((line) => pick(line.en)).join('\n'),
    ko: NOTE_LINES.map((line) => pick(line.ko)).join('\n'),
  };
}

export const DOCS: Record<DocId, DocDef> = {
  note_left: { id: 'note_left', style: 'hand', pages: [{ text: noteText('left') }] },
  note_right: { id: 'note_right', style: 'hand', pages: [{ text: noteText('right') }] },
  note_full: {
    id: 'note_full',
    style: 'hand',
    pages: [{ text: noteText('full'), onRead: [{ type: 'addClue', clue: 'note_rule' }] }],
  },
  journal: {
    id: 'journal',
    style: 'journal',
    pages: [
      {
        text: L(
          'Day 1.\nI built this room so that I would not forget.\nEvery object in it is a sentence.\nRead them in order.',
          '1일째.\n잊지 않기 위해 이 방을 만들었다.\n이 방의 모든 물건은 하나의 문장이다.\n순서대로 읽을 것.',
        ),
      },
      {
        text: L(
          'Day 9.\nThe clocks keep stopping — all but the one I painted.\nIn the painting it is always 9:45,\nthe hour I came home.',
          '9일째.\n시계들이 자꾸 멈춘다. 내가 그린 시계만 빼고.\n그림 속은 언제나 9시 45분,\n내가 집에 돌아온 시각.',
        ),
      },
      {
        text: L(
          'Day 23.\nFour friends kept me company on the long nights.\nI gave each a place on the shelf,\nand a number of its own.',
          '23일째.\n긴 밤마다 네 친구가 곁에 있었다.\n나는 그들에게 책장의 자리와\n저마다의 번호를 주었다.',
        ),
        onRead: [{ type: 'addClue', clue: 'journal_friends' }],
      },
      {
        text: L('Day 41.\n\n(The page looks blank.\nIt smells faintly of lemon.)', '41일째.\n\n(빈 페이지처럼 보인다.\n희미하게 레몬 냄새가 난다.)'),
        hidden: {
          when: { flag: 'inkRevealed' },
          text: L(
            'Day 41.\nSAFE — my four friends,\nin the photograph’s order.\nNot by name. By volume.',
            '41일째.\n금고 — 나의 네 친구,\n사진 속 순서대로.\n이름이 아니라, 권수로.',
          ),
        },
      },
    ],
  },
  ink_page: {
    id: 'ink_page',
    style: 'journal',
    pages: [
      {
        text: L(
          'SAFE — my four friends,\nin the photograph’s order.\nNot by name. By volume.',
          '금고 — 나의 네 친구,\n사진 속 순서대로.\n이름이 아니라, 권수로.',
        ),
        onRead: [{ type: 'addClue', clue: 'ink_safe' }],
      },
    ],
  },
  letter: {
    id: 'letter',
    style: 'type',
    pages: [
      {
        text: L(
          'If you are reading this, you have come further than I ever did.\n\nThe door will not listen to keys alone.\nIt asks for the hour I left — not the hour I came home.\nThe house remembers it, even if you moved the hands.\n\n— E.',
          '이 글을 읽고 있다면, 당신은 나보다 멀리 온 것이다.\n\n문은 열쇠만으로는 대답하지 않는다.\n문은 내가 떠난 시각을 묻는다 — 돌아온 시각이 아니라.\n당신이 바늘을 움직였더라도, 이 집은 그 시각을 기억한다.\n\n— E.',
        ),
        onRead: [{ type: 'addClue', clue: 'letter_hour' }],
      },
      {
        text: L(
          'P.S.\nYou never looked closely at the photograph, did you?\nHold it to the light.\n\nAnd when you understand,\ngive the house back its hour before you go.',
          '추신.\n사진을 제대로 들여다본 적은 없겠지?\n그것을 빛에 비춰 보라.\n\n그리고 이해했다면,\n떠나기 전에 이 집에 그 시각을 돌려주길.',
        ),
        onRead: [
          { type: 'setFlag', flag: 'psRead', value: true },
          { type: 'addClue', clue: 'letter_ps' },
        ],
      },
    ],
  },
  photograph: {
    id: 'photograph',
    style: 'photo',
    pages: [
      {
        text: L(
          'A windowsill at night: a quill feather, an hourglass, a candle — and a crescent moon in the glass.',
          '밤의 창틀: 깃털 펜, 모래시계, 촛불 — 그리고 유리창 속 초승달.',
        ),
        onRead: [{ type: 'addClue', clue: 'photo_order' }],
      },
      {
        text: L('On the back: “For the long nights. — E.”', '뒷면: “긴 밤들을 위해. — E.”'),
        hidden: {
          when: { flag: 'photoTruth' },
          text: L(
            'On the back: “For the long nights. — E.”\nBelow it, in lemon-brown ink: “E. — the night before I forgot.”',
            '뒷면: “긴 밤들을 위해. — E.”\n그 아래, 레몬빛 갈색 잉크로: “E. — 잊기 전날 밤.”',
          ),
        },
      },
    ],
  },
};
