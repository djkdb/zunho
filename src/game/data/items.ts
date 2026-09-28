import { L } from '../i18n';
import type { DocId, ItemId, LocalizedText } from '../types';

export type ItemCategory = 'key' | 'paper' | 'book' | 'photograph' | 'code' | 'finalKey';

export interface ItemDef {
  id: ItemId;
  name: LocalizedText;
  description: LocalizedText;
  category: ItemCategory;
  /** Items that can be read page-by-page in the inspector. */
  doc?: DocId;
}

export const ITEMS: Record<ItemId, ItemDef> = {
  note_left: {
    id: 'note_left',
    name: L('Torn Note (left)', '찢어진 메모 (왼쪽)'),
    description: L(
      'The left half of a note. The handwriting is careful, almost familiar.',
      '메모의 왼쪽 절반. 필체가 꼼꼼하다. 어딘가 낯익다.',
    ),
    category: 'paper',
    doc: 'note_left',
  },
  note_right: {
    id: 'note_right',
    name: L('Torn Note (right)', '찢어진 메모 (오른쪽)'),
    description: L('The right half of a torn note.', '찢어진 메모의 오른쪽 절반.'),
    category: 'paper',
    doc: 'note_right',
  },
  note_full: {
    id: 'note_full',
    name: L('Mended Note', '이어 붙인 메모'),
    description: L('Both halves, edge to edge. Now it reads clearly.', '두 조각을 맞붙였다. 이제 온전히 읽힌다.'),
    category: 'paper',
    doc: 'note_full',
  },
  brass_key: {
    id: 'brass_key',
    name: L('Brass Key', '황동 열쇠'),
    description: L(
      'Small and warm from the clock’s belly. A paper tag reads: DESK.',
      '시계 속에서 나온 작은 열쇠. 종이 꼬리표에 “책상”이라고 적혀 있다.',
    ),
    category: 'key',
  },
  photograph: {
    id: 'photograph',
    name: L('Old Photograph', '오래된 사진'),
    description: L(
      'A windowsill at night. Four objects, lined up with care.',
      '밤의 창틀. 네 가지 물건이 조심스럽게 놓여 있다.',
    ),
    category: 'photograph',
    doc: 'photograph',
  },
  journal: {
    id: 'journal',
    name: L('Old Journal', '낡은 일기장'),
    description: L('Leather, swollen with damp. Signed “E.”', '습기에 부푼 가죽 표지. “E.”라는 서명.'),
    category: 'book',
    doc: 'journal',
  },
  ink_page: {
    id: 'ink_page',
    name: L('Revealed Page', '드러난 페이지'),
    description: L(
      'Brown letters surfaced from the lamp’s heat.',
      '램프의 열기에 갈색 글씨가 떠올랐다.',
    ),
    category: 'code',
    doc: 'ink_page',
  },
  iron_key: {
    id: 'iron_key',
    name: L('Iron Key', '무쇠 열쇠'),
    description: L(
      'Cold and heavy. Its bow is shaped like a clock face.',
      '차갑고 묵직하다. 손잡이가 시계 문자판 모양이다.',
    ),
    category: 'finalKey',
  },
  letter: {
    id: 'letter',
    name: L('Sealed Letter', '봉인된 편지'),
    description: L('Wax seal already broken. Two pages.', '밀랍 봉인은 이미 뜯겨 있다. 두 장짜리 편지.'),
    category: 'paper',
    doc: 'letter',
  },
};
