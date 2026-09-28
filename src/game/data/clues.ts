import { L } from '../i18n';
import type { ClueId, LocalizedText } from '../types';

export interface ClueDef {
  id: ClueId;
  text: LocalizedText;
  /** Story-only clues are listed in the notebook but never required. */
  flavour?: boolean;
}

/**
 * Every clue the player has seen is written into the in-game notebook,
 * so no puzzle ever relies on the player's short-term memory.
 */
export const CLUES: Record<ClueId, ClueDef> = {
  clock_stopped: {
    id: 'clock_stopped',
    text: L('When you woke, the wall clock had stopped at 11:52.', '깨어났을 때, 벽시계는 11시 52분에 멈춰 있었다.'),
  },
  painting_plaque: {
    id: 'painting_plaque',
    text: L('Painting plaque: “WHEN BOTH CLOCKS AGREE.”', '액자 명판: “두 시계가 같은 시간을 가리킬 때.”'),
  },
  painting_tower: {
    id: 'painting_tower',
    text: L('In the painting, the tower clock reads 9:45.', '그림 속 탑시계는 9시 45분을 가리킨다.'),
  },
  note_rule: {
    id: 'note_rule',
    text: L(
      'Mended note: pull the four friends in the order the photograph remembers.',
      '이어 붙인 메모: 네 친구를 사진이 기억하는 순서대로 꺼낼 것.',
    ),
  },
  photo_order: {
    id: 'photo_order',
    text: L(
      'Photograph, left to right: feather, hourglass, candle, moon.',
      '사진 속 물건, 왼쪽부터: 깃털, 모래시계, 촛불, 달.',
    ),
  },
  journal_friends: {
    id: 'journal_friends',
    text: L('Journal: each friend has “a number of its own.”', '일기장: 친구마다 “저마다의 번호”가 있다.'),
  },
  ink_safe: {
    id: 'ink_safe',
    text: L('Hidden ink: SAFE — the four friends, in order, by volume.', '숨은 잉크: 금고 — 네 친구, 순서대로, 권수로.'),
  },
  letter_hour: {
    id: 'letter_hour',
    text: L(
      'Letter: the door asks for the hour E. left — not the hour he came home.',
      '편지: 문은 E.가 떠난 시각을 묻는다 — 돌아온 시각이 아니라.',
    ),
  },
  letter_ps: {
    id: 'letter_ps',
    text: L(
      'P.S. Hold the photograph to the light. Give the house back its hour.',
      '추신. 사진을 빛에 비춰 볼 것. 이 집에 그 시각을 돌려줄 것.',
    ),
  },
  photo_truth: {
    id: 'photo_truth',
    text: L(
      'Reflected in the photograph’s window: the one holding the camera. Your face.',
      '사진 속 유리창에 비친 사람 — 카메라를 든 사람. 당신의 얼굴이다.',
    ),
  },
  window_tally: {
    id: 'window_tally',
    text: L('Scratched between the boards: forty-one tally marks.', '판자 사이 벽에 긁힌 자국: 마흔한 개의 줄.'),
    flavour: true,
  },
  basket_draft: {
    id: 'basket_draft',
    text: L(
      'A crumpled draft: “If I write the numbers down, I will stop remembering. Let the books keep them.”',
      '구겨진 초안: “숫자를 적어 두면 기억하기를 멈출 것이다. 책들이 간직하게 하자.”',
    ),
    flavour: true,
  },
};
