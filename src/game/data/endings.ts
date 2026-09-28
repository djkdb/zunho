import { L } from '../i18n';
import type { AchievementId, Condition, EndingId, LocalizedText } from '../types';
import { OBJECT_IDS } from '../types';

export interface EndingDef {
  id: EndingId;
  title: LocalizedText;
  lines: LocalizedText[];
  /** Endings are checked in priority order; the first satisfied one wins. */
  priority: number;
  when: Condition;
}

/**
 * SECRET ENDING — entirely behaviour-based:
 *  1. read the letter to its last page (the P.S.),
 *  2. hold the photograph to the lit lamp,
 *  3. afterwards, set the wall clock back to 11:52 ("give the house back its hour").
 */
export const ENDINGS: EndingDef[] = [
  {
    id: 'secret',
    priority: 0,
    title: L('YOU REMEMBERED.', '당신은 기억해냈다.'),
    when: { all: [{ flag: 'psRead' }, { flag: 'photoTruth' }, { flag: 'houseRemembers' }] },
    lines: [
      L('The handwriting on every note was yours.', '모든 메모의 필체는 당신의 것이었다.'),
      L('The face in the glass was yours.', '유리창에 비친 얼굴도 당신의 것이었다.'),
      L('Elias Varn walks out of the last room —', '엘리아스 바른은 마지막 방을 걸어 나간다 —'),
      L('and, for the first time in forty-one days, goes home.', '그리고 마흔하루 만에 처음으로, 집으로 돌아간다.'),
    ],
  },
  {
    id: 'escaped',
    priority: 1,
    title: L('YOU ESCAPED.', '탈출했다.'),
    when: { flag: 'finalDoorUnlocked' },
    lines: [
      L('Cold morning air. Rain on your face.', '차가운 새벽 공기. 얼굴에 닿는 빗방울.'),
      L('Behind you, the room is only a room again.', '뒤를 돌아보니, 그 방은 다시 평범한 방일 뿐이다.'),
      L('But who was E.?', '그런데 E.는 누구였을까?'),
    ],
  },
];

export interface AchievementDef {
  id: AchievementId;
  title: LocalizedText;
  description: LocalizedText;
  secret?: boolean;
}

export const FAST_ESCAPE_MS = 10 * 60 * 1000;

export const ACHIEVEMENTS: AchievementDef[] = [
  { id: 'first_escape', title: L('FIRST ESCAPE', '첫 탈출'), description: L('Escape the room.', '방을 탈출한다.') },
  { id: 'no_hint', title: L('NO HINT', '힌트 없이'), description: L('Escape without a single hint.', '힌트 없이 탈출한다.') },
  {
    id: 'fast_escape',
    title: L('FAST ESCAPE', '빠른 탈출'),
    description: L('Escape in under 10 minutes.', '10분 안에 탈출한다.'),
  },
  {
    id: 'perfect_observer',
    title: L('PERFECT OBSERVER', '완벽한 관찰자'),
    description: L(`Examine all ${OBJECT_IDS.length} points of interest.`, `조사 가능한 ${OBJECT_IDS.length}곳을 모두 살핀다.`),
  },
  {
    id: 'true_ending',
    title: L('TRUE ENDING', '진짜 결말'),
    description: L('Remember who you are.', '당신이 누구인지 기억해낸다.'),
    secret: true,
  },
];
