import { L } from '../i18n';
import type { Condition, Effect, LocalizedText, ObjectId, PickupId, PuzzleId } from '../types';

export type ObjectOpenBehavior =
  | { kind: 'scene' }
  | { kind: 'pickup'; pickup: PickupId }
  | { kind: 'toggleLamp' };

export interface RoomObjectDef {
  id: ObjectId;
  name: LocalizedText;
  /** Short line shown when hovering / focusing the object. */
  hover: LocalizedText;
  open: ObjectOpenBehavior;
  /** Puzzle hosted by this object's scene (drives the "puzzle" phase). */
  puzzle?: PuzzleId;
  /** When provided, the hotspot only exists while the condition holds. */
  visibleWhen?: Condition;
  /** Optional flavour/story objects count toward PERFECT OBSERVER only. */
  optional?: boolean;
  /** Applied every time the object is opened (clue effects are idempotent). */
  onOpen?: Effect[];
}

export const OBJECTS: Record<ObjectId, RoomObjectDef> = {
  door: {
    id: 'door',
    name: L('Door', '출입문'),
    hover: L('Heavy oak. It does not move.', '두꺼운 참나무 문. 꿈쩍도 하지 않는다.'),
    open: { kind: 'scene' },
    puzzle: 'door',
  },
  clock: {
    id: 'clock',
    name: L('Wall Clock', '벽시계'),
    hover: L('The pendulum hangs perfectly still.', '추가 미동도 없이 멈춰 있다.'),
    open: { kind: 'scene' },
    puzzle: 'clock',
    onOpen: [{ type: 'addClue', clue: 'clock_stopped' }],
  },
  painting: {
    id: 'painting',
    name: L('Painting', '그림 액자'),
    hover: L('An oil painting of a house at dusk.', '해 질 녘의 저택을 그린 유화.'),
    open: { kind: 'scene' },
    onOpen: [{ type: 'addClue', clue: 'painting_plaque' }],
  },
  bookshelf: {
    id: 'bookshelf',
    name: L('Bookshelf', '책장'),
    hover: L('Old books. Some spines are marked.', '오래된 책들. 몇몇 책등에 문양이 있다.'),
    open: { kind: 'scene' },
    puzzle: 'bookshelf',
  },
  memo: {
    id: 'memo',
    name: L('Memo', '메모'),
    hover: L('A torn scrap of paper.', '찢어진 종이 조각.'),
    open: { kind: 'pickup', pickup: 'memo_note' },
    visibleWhen: { notCollected: 'note_left' },
  },
  drawer: {
    id: 'drawer',
    name: L('Desk Drawer', '책상 서랍'),
    hover: L('A small brass keyhole.', '작은 황동 열쇠 구멍.'),
    open: { kind: 'scene' },
  },
  lamp: {
    id: 'lamp',
    name: L('Desk Lamp', '책상 램프'),
    hover: L('A brass lamp with a warm bulb.', '따뜻한 전구가 달린 황동 램프.'),
    open: { kind: 'toggleLamp' },
  },
  safe: {
    id: 'safe',
    name: L('Safe', '금고'),
    hover: L('Cast iron. A four-digit keypad.', '무쇠 금고. 네 자리 키패드.'),
    open: { kind: 'scene' },
    puzzle: 'safe',
  },
  window: {
    id: 'window',
    name: L('Boarded Window', '막힌 창문'),
    hover: L('Rain taps against the boards.', '판자 너머로 빗소리가 들린다.'),
    open: { kind: 'scene' },
    optional: true,
    onOpen: [{ type: 'addClue', clue: 'window_tally' }],
  },
  basket: {
    id: 'basket',
    name: L('Wastebasket', '휴지통'),
    hover: L('Crumpled paper.', '구겨진 종이들.'),
    open: { kind: 'scene' },
    optional: true,
    onOpen: [{ type: 'addClue', clue: 'basket_draft' }],
  },
};

export const OBJECT_LIST: RoomObjectDef[] = Object.values(OBJECTS);
