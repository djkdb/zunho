import { L } from '../i18n';
import type { Condition, Effect, ItemId, LocalizedText, ObjectId, PickupId, TargetId } from '../types';

/* ------------------------------------------------------------------ */
/* Use item → target                                                   */
/* ------------------------------------------------------------------ */

export interface InteractionDef {
  item: ItemId;
  targets: TargetId[];
  requires?: Condition;
  /** Shown when the pairing is right but `requires` is not met yet. */
  blockedText?: LocalizedText;
  blockedEffects?: Effect[];
  effects: Effect[];
}

export const INTERACTIONS: InteractionDef[] = [
  {
    item: 'brass_key',
    targets: ['drawer', 'drawer_keyhole'],
    requires: { flag: 'drawerOpen', is: false },
    effects: [
      { type: 'removeItem', item: 'brass_key' },
      { type: 'setFlag', flag: 'drawerOpen', value: true },
      { type: 'sfx', id: 'unlock' },
      { type: 'sfx', id: 'drawerOpen' },
      { type: 'openScene', scene: { kind: 'object', id: 'drawer' } },
      {
        type: 'narrate',
        tone: 'success',
        text: L('The key turns. The drawer slides open.', '열쇠가 돌아간다. 서랍이 스르르 열린다.'),
      },
    ],
  },
  {
    item: 'journal',
    targets: ['lamp'],
    requires: { flag: 'lampOn' },
    blockedText: L(
      'The bulb is cold. Heat would need the lamp to be on.',
      '전구가 차갑다. 열을 내려면 램프가 켜져 있어야 한다.',
    ),
    blockedEffects: [{ type: 'sfx', id: 'locked' }],
    effects: [
      { type: 'setFlag', flag: 'inkRevealed', value: true },
      { type: 'solvePuzzle', puzzle: 'ink' },
      { type: 'giveItem', item: 'ink_page' },
      { type: 'sfx', id: 'discovery' },
      { type: 'fx', id: 'reveal' },
      { type: 'openScene', scene: { kind: 'item', id: 'journal', page: 3 } },
      {
        type: 'narrate',
        tone: 'discovery',
        text: L(
          'Heat blooms across the blank page. Brown letters rise out of nothing.',
          '빈 페이지에 열기가 번진다. 아무것도 없던 곳에서 갈색 글씨가 떠오른다.',
        ),
      },
    ],
  },
  {
    item: 'photograph',
    targets: ['lamp'],
    requires: { flag: 'lampOn' },
    blockedText: L('Too dark to see anything new.', '너무 어두워 새로운 것이 보이지 않는다.'),
    effects: [
      { type: 'setFlag', flag: 'photoTruth', value: true },
      { type: 'addClue', clue: 'photo_truth' },
      { type: 'sfx', id: 'discovery' },
      { type: 'fx', id: 'reveal' },
      { type: 'openScene', scene: { kind: 'item', id: 'photograph', page: 0 } },
      {
        type: 'narrate',
        tone: 'discovery',
        text: L(
          'In the lamplight, a reflection surfaces in the photograph’s window. Someone holding the camera.',
          '램프 불빛 아래, 사진 속 유리창에 비친 형체가 떠오른다. 카메라를 든 누군가.',
        ),
      },
    ],
  },
  {
    item: 'iron_key',
    targets: ['door', 'door_keyhole'],
    requires: { flag: 'doorKeyInserted', is: false },
    effects: [
      { type: 'removeItem', item: 'iron_key' },
      { type: 'setFlag', flag: 'doorKeyInserted', value: true },
      { type: 'sfx', id: 'unlock' },
      { type: 'sfx', id: 'bolt' },
      { type: 'fx', id: 'shakeSoft' },
      { type: 'openScene', scene: { kind: 'object', id: 'door' } },
      {
        type: 'narrate',
        tone: 'success',
        text: L(
          'The iron key turns with a deep clack. The first bolt slides back. The time dial wakes.',
          '무쇠 열쇠가 묵직하게 돌아간다. 첫 번째 빗장이 풀린다. 시간 다이얼이 깨어난다.',
        ),
      },
    ],
  },
];

export const DEFAULT_USE_FAIL = L('That doesn’t seem to work here.', '여기에는 쓸 수 없을 것 같다.');

/* ------------------------------------------------------------------ */
/* Combine item + item                                                 */
/* ------------------------------------------------------------------ */

export interface CombinationDef {
  items: [ItemId, ItemId];
  effects: Effect[];
}

export const COMBINATIONS: CombinationDef[] = [
  {
    items: ['note_left', 'note_right'],
    effects: [
      { type: 'removeItem', item: 'note_left' },
      { type: 'removeItem', item: 'note_right' },
      { type: 'giveItem', item: 'note_full' },
      { type: 'solvePuzzle', puzzle: 'note' },
      { type: 'addClue', clue: 'note_rule' },
      { type: 'sfx', id: 'combine' },
      { type: 'openScene', scene: { kind: 'item', id: 'note_full' } },
      {
        type: 'narrate',
        tone: 'discovery',
        text: L('The torn edges fit perfectly.', '찢어진 가장자리가 완벽하게 들어맞는다.'),
      },
    ],
  },
];

export const DEFAULT_COMBINE_FAIL = L('These don’t go together.', '이 둘은 맞지 않는다.');

/* ------------------------------------------------------------------ */
/* Pickups found inside scenes                                         */
/* ------------------------------------------------------------------ */

export interface PickupDef {
  id: PickupId;
  item: ItemId;
  /** Scene where the pickup physically sits. */
  object: ObjectId;
  requires?: Condition;
  /** Open the item inspector after picking up (for readable items). */
  inspect?: boolean;
}

export const PICKUPS: Record<PickupId, PickupDef> = {
  memo_note: { id: 'memo_note', item: 'note_left', object: 'memo', inspect: true },
  clock_key: { id: 'clock_key', item: 'brass_key', object: 'clock', requires: { flag: 'clockCaseOpen' } },
  drawer_photo: { id: 'drawer_photo', item: 'photograph', object: 'drawer', requires: { flag: 'drawerOpen' } },
  drawer_note: { id: 'drawer_note', item: 'note_right', object: 'drawer', requires: { flag: 'drawerOpen' } },
  shelf_journal: {
    id: 'shelf_journal',
    item: 'journal',
    object: 'bookshelf',
    requires: { flag: 'shelfOpen' },
    inspect: true,
  },
  safe_key: { id: 'safe_key', item: 'iron_key', object: 'safe', requires: { flag: 'safeOpen' } },
  safe_letter: { id: 'safe_letter', item: 'letter', object: 'safe', requires: { flag: 'safeOpen' }, inspect: true },
};
