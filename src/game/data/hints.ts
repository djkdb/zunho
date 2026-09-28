import { L } from '../i18n';
import type { Condition, LocalizedText } from '../types';

export interface HintStage {
  id: string;
  objective: LocalizedText;
  /** The stage is complete once this condition holds. */
  done: Condition;
  /** Tier 1: direction · Tier 2: what to observe · Tier 3: nearly the answer. */
  tiers: [LocalizedText, LocalizedText, LocalizedText];
}

/**
 * The first stage whose `done` condition is false is the "current" stage.
 * Adding a new puzzle only requires adding a new stage here.
 */
export const HINT_STAGES: HintStage[] = [
  {
    id: 'memo',
    objective: L('Look around the room.', '방을 둘러보자.'),
    done: { collected: 'note_left' },
    tiers: [
      L('Someone spent long nights at that desk.', '누군가 저 책상에서 긴 밤을 보냈다.'),
      L('There is a scrap of paper on the desk.', '책상 위에 종이 조각이 있다.'),
      L('Tap the memo on the desk and read it.', '책상 위 메모를 눌러 읽어 보자.'),
    ],
  },
  {
    id: 'clock',
    objective: L('Find what the stopped clock is hiding.', '멈춘 시계가 숨긴 것을 찾자.'),
    done: { solved: 'clock' },
    tiers: [
      L('Two things in this room keep time.', '이 방에는 시간을 알려주는 것이 두 개 있다.'),
      L('Look closely at the painting — there is a clock inside it.', '그림을 자세히 보자. 그림 속에도 시계가 있다.'),
      L('The tower in the painting reads 9:45. Set the wall clock to match.', '그림 속 탑시계는 9시 45분. 벽시계를 똑같이 맞추자.'),
    ],
  },
  {
    id: 'clock_key',
    objective: L('Take what the clock gave you.', '시계가 내어준 것을 챙기자.'),
    done: { collected: 'brass_key' },
    tiers: [
      L('The clock opened for a reason.', '시계는 이유가 있어 열렸다.'),
      L('Look inside the pendulum case.', '추 상자 안을 들여다보자.'),
      L('Open the wall clock and take the brass key.', '벽시계를 열고 황동 열쇠를 집자.'),
    ],
  },
  {
    id: 'drawer',
    objective: L('Open the desk drawer.', '책상 서랍을 열자.'),
    done: { all: [{ collected: 'photograph' }, { collected: 'note_right' }] },
    tiers: [
      L('What came out of the clock belongs somewhere.', '시계에서 나온 것에는 제자리가 있다.'),
      L('The tag on the brass key says DESK.', '황동 열쇠의 꼬리표에는 “책상”이라고 적혀 있다.'),
      L(
        'Select the brass key in your inventory, then tap the desk drawer. Take everything inside.',
        '인벤토리에서 황동 열쇠를 선택한 뒤 책상 서랍을 누르자. 안에 든 것을 모두 챙기자.',
      ),
    ],
  },
  {
    id: 'note',
    objective: L('Make sense of the torn note.', '찢어진 메모의 뜻을 알아내자.'),
    done: { solved: 'note' },
    tiers: [
      L('Two halves make a whole.', '반쪽 둘이 모이면 하나가 된다.'),
      L('The torn edges of both notes match.', '두 메모의 찢어진 가장자리가 들어맞는다.'),
      L(
        'Select one half of the note, then tap the other half in your inventory.',
        '메모 한쪽을 선택한 뒤, 인벤토리의 다른 쪽을 누르자.',
      ),
    ],
  },
  {
    id: 'bookshelf',
    objective: L('Find the four friends.', '네 친구를 찾자.'),
    done: { solved: 'bookshelf' },
    tiers: [
      L('The note speaks of four friends and a photograph.', '메모는 네 친구와 사진에 대해 말한다.'),
      L(
        'The photograph shows four objects. Four books on the shelf bear the same symbols.',
        '사진에는 네 가지 물건이 있다. 책장의 책 네 권에 같은 문양이 있다.',
      ),
      L(
        'Pull the books marked feather, hourglass, candle, then moon.',
        '깃털, 모래시계, 촛불, 달 문양의 책을 차례대로 꺼내자.',
      ),
    ],
  },
  {
    id: 'journal',
    objective: L('Take what the shelf revealed.', '책장이 드러낸 것을 챙기자.'),
    done: { collected: 'journal' },
    tiers: [
      L('The shelf answered. Look again.', '책장이 대답했다. 다시 살펴보자.'),
      L('A hidden compartment opened behind the books.', '책 뒤에 숨겨진 칸이 열렸다.'),
      L('Open the bookshelf and take the journal.', '책장을 열고 일기장을 집자.'),
    ],
  },
  {
    id: 'ink',
    objective: L('Read the whole journal.', '일기장을 끝까지 읽자.'),
    done: { any: [{ solved: 'ink' }, { solved: 'safe' }] },
    tiers: [
      L('Not every page is as empty as it looks.', '모든 페이지가 보이는 것처럼 비어 있지는 않다.'),
      L(
        'The last page smells of lemon. Lemon ink appears with heat.',
        '마지막 페이지에서 레몬 냄새가 난다. 레몬즙 잉크는 열을 받으면 드러난다.',
      ),
      L('Turn the desk lamp on, select the journal, and tap the lamp.', '책상 램프를 켜고, 일기장을 선택한 뒤 램프를 누르자.'),
    ],
  },
  {
    id: 'safe',
    objective: L('Open the safe.', '금고를 열자.'),
    done: { solved: 'safe' },
    tiers: [
      L('The safe wants four digits. The books already keep them.', '금고는 네 자리 숫자를 원한다. 숫자는 이미 책들이 간직하고 있다.'),
      L('Look at the roman numerals on the four friends’ spines.', '네 친구 책등의 로마 숫자를 보자.'),
      L('Feather VII, hourglass III, candle IX, moon II — 7392.', '깃털 VII, 모래시계 III, 촛불 IX, 달 II — 7392.'),
    ],
  },
  {
    id: 'safe_contents',
    objective: L('Take what the safe kept.', '금고가 간직한 것을 챙기자.'),
    done: { all: [{ collected: 'iron_key' }, { collected: 'letter' }] },
    tiers: [
      L('The safe is open. It isn’t empty.', '금고가 열렸다. 비어 있지 않다.'),
      L('There is a key and a letter inside.', '안에 열쇠와 편지가 있다.'),
      L('Open the safe and take both the iron key and the letter.', '금고를 열고 무쇠 열쇠와 편지를 모두 집자.'),
    ],
  },
  {
    id: 'door_key',
    objective: L('Unlock the door.', '문을 열자.'),
    done: { flag: 'doorKeyInserted' },
    tiers: [
      L('Something from the safe was made for a bigger lock.', '금고에서 나온 것은 더 큰 자물쇠를 위한 것이다.'),
      L('The iron key’s bow is shaped like a clock face — like the door’s lock.', '무쇠 열쇠의 손잡이는 시계 모양이다. 문의 자물쇠처럼.'),
      L('Select the iron key and tap the door.', '무쇠 열쇠를 선택한 뒤 문을 누르자.'),
    ],
  },
  {
    id: 'door_time',
    objective: L('Tell the door the hour he left.', '그가 떠난 시각을 문에 알려주자.'),
    done: { solved: 'door' },
    tiers: [
      L('The door asks for a time. This room has shown you two.', '문은 시간을 묻는다. 이 방은 두 개의 시간을 보여줬다.'),
      L(
        'Read the letter again: the hour he left — not the hour he came home (9:45).',
        '편지를 다시 읽자. 떠난 시각이지, 돌아온 시각(9:45)이 아니다.',
      ),
      L('When you woke, the wall clock had stopped at 11:52. Enter 11:52.', '깨어났을 때 벽시계는 11시 52분에 멈춰 있었다. 11:52를 입력하자.'),
    ],
  },
];
