/**
 * First-time player simulation (Korean, phone 390×844, touch).
 *
 *   npm run build && node scripts/playtest.mjs
 *
 * Plays like a newcomer: only taps what is on screen (panning with the edge arrows
 * when something is out of view), makes the usual mistakes, uses a hint once,
 * and screenshots every step to qa-artifacts/playtest/ for review.
 */
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { chromium } from 'playwright-core';

const PORT = 4181;
const BASE = `http://localhost:${PORT}/`;
const OUT = 'qa-artifacts/playtest';
const CHROME = process.env.CHROME_PATH || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
mkdirSync(OUT, { recursive: true });

const server = spawn('npx', ['vite', 'preview', '--port', String(PORT), '--strictPort'], { stdio: 'ignore' });
for (let i = 0; i < 50; i++) {
  try {
    if ((await fetch(BASE)).ok) break;
  } catch {
    /* starting */
  }
  await new Promise((r) => setTimeout(r, 200));
}

const browser = await chromium.launch({ executablePath: CHROME });
const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
const page = await context.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));

let n = 0;
const notes = [];
const wait = (ms) => page.waitForTimeout(ms);
async function shot(label, ms = 900) {
  await wait(ms);
  const name = `${String(++n).padStart(2, '0')}-${label}`;
  await page.screenshot({ path: `${OUT}/${name}.png` });
  const said = (await page.locator('.narration').innerText().catch(() => '')).replace(/\s+/g, ' ').trim();
  notes.push(`${name}${said ? `  ｢${said}｣` : ''}`);
}
const tapText = (name, exact = false) => page.getByRole('button', { name, exact }).first().tap();
const slot = (name) => page.locator(`.slot[aria-label="${name}"]`).tap();
const back = async () => {
  await page.locator('.investigation-back').tap();
  await wait(900);
};

/** Tap an object only once it is actually visible, panning like a person would. */
async function tapObject(id) {
  for (let tries = 0; tries < 6; tries++) {
    const box = await page.locator(`[data-object="${id}"]`).boundingBox();
    const cx = box.x + box.width / 2;
    const vw = 390;
    if (cx > 50 && cx < vw - 50) {
      // Aim at the part of the object that is on screen.
      const x = Math.min(Math.max(cx, box.x + 20, 60), Math.min(box.x + box.width - 20, vw - 60));
      await page.touchscreen.tap(x, box.y + box.height / 2);
      await wait(1100);
      return;
    }
    await page.getByRole('button', { name: cx < 50 ? '왼쪽 보기' : '오른쪽 보기' }).tap();
    await wait(1100);
  }
  throw new Error(`could not bring ${id} into view`);
}
async function step(label, times) {
  for (let i = 0; i < times; i++) await page.getByRole('button', { name: label, exact: true }).tap();
}

try {
  await page.goto(BASE);
  await page.evaluate(() => {
    localStorage.clear();
    localStorage.setItem('the-last-room.settings.v1', JSON.stringify({ lang: 'ko', sound: true, volume: 0.8 }));
  });
  await page.reload();
  await shot('title', 3400);
  await tapText('새로 시작');
  await shot('intro-line', 2600);
  await shot('eyes-open', 7200);
  await shot('first-look', 1500);

  // The memo on the desk.
  await tapObject('memo');
  await shot('memo');
  await back();

  // Newcomer instinct: the drawer.
  await tapObject('drawer');
  await page.getByRole('button', { name: '열쇠 구멍' }).tap();
  await shot('drawer-locked', 300);
  await back();

  // Look around: left to the clock and door.
  await tapObject('clock');
  await shot('clock');
  await page.getByRole('button', { name: '바늘 고정' }).tap();
  await shot('clock-wrong', 300);
  await back();

  await tapObject('painting');
  await page.locator('.painting-tower').tap();
  await shot('painting-tower', 1600);
  await back();

  await tapObject('clock');
  await step('시 −', 2);
  await step('분 −', 7);
  await shot('clock-945', 300);
  await tapText('바늘 고정');
  await shot('clock-solved', 1800);
  await page.getByRole('button', { name: /가져가기: 황동 열쇠/ }).tap();
  await shot('key-taken', 1200);
  await back();

  // Mistake: try the key on the safe.
  await slot('황동 열쇠');
  await shot('holding-key', 400);
  await tapObject('safe');
  await shot('key-on-safe', 400);
  await back().catch(() => undefined);

  await slot('황동 열쇠');
  await tapObject('drawer');
  await shot('drawer-open', 900);
  await page.getByRole('button', { name: /가져가기: 오래된 사진/ }).tap();
  await wait(400);
  await page.getByRole('button', { name: /가져가기: 찢어진 메모 \(오른쪽\)/ }).tap();
  await shot('drawer-emptied', 900);
  await back();

  // Stuck on the halves → ask for a hint.
  await page.getByRole('button', { name: /^힌트/ }).tap();
  await tapText('힌트 보기');
  await shot('hint-1', 500);
  await page.getByRole('button', { name: '닫기' }).tap();
  await wait(400);

  // Inspect the torn half: the inspector offers to fit the edges.
  await slot('찢어진 메모 (오른쪽)');
  await tapText('살펴보기');
  await shot('note-right', 900);
  await tapText('찢어진 가장자리 맞춰 보기');
  await shot('note-mended', 1000);
  await back();

  await slot('오래된 사진');
  await tapText('살펴보기');
  await shot('photograph', 900);
  await back();

  // Bookshelf: grab a wrong book, put it back, then the right order.
  await tapObject('bookshelf');
  await page.locator('.book[aria-label^="비행에 관하여"]').tap();
  await page.locator('.book[aria-label^="밀물"]').tap();
  await shot('shelf-slip', 400);
  await page.locator('.book[aria-label^="밀물"]').tap();
  await shot('shelf-undo', 400);
  for (const title of ['모래의 인내', '불이 간직한 것', '달의 표']) await page.locator(`.book[aria-label^="${title}"]`).tap();
  await shot('shelf-open', 1600);
  await page.getByRole('button', { name: /가져가기: 낡은 일기장/ }).tap();
  await shot('journal-p1', 900);
  for (let i = 0; i < 3; i++) await page.getByRole('button', { name: '다음 페이지' }).tap();
  await shot('journal-blank', 800);
  await tapText('램프를 켜고 가까이 대기');
  await shot('ink-reveal', 1400);
  await back();
  await back().catch(() => undefined);

  // Safe: a near miss, then the code.
  await tapObject('safe');
  const code = async (c) => {
    for (const d of c) await page.locator('.keypad-key', { hasText: new RegExp(`^${d}$`) }).tap();
    await page.getByRole('button', { name: '입력' }).tap();
  };
  await code('2937');
  await shot('safe-close-miss', 300);
  await wait(700);
  await code('7392');
  await shot('safe-unlocking', 1500);
  await shot('safe-open', 2000);
  await page.getByRole('button', { name: /가져가기: 무쇠 열쇠/ }).tap();
  await wait(400);
  await page.getByRole('button', { name: /가져가기: 봉인된 편지/ }).tap();
  await shot('letter', 1000);
  await page.getByRole('button', { name: '다음 페이지' }).tap();
  await shot('letter-ps', 800);
  await back();
  await back().catch(() => undefined);

  await page.getByRole('button', { name: '수첩' }).tap();
  await shot('notebook', 600);
  await page.getByRole('button', { name: '닫기' }).tap();
  await wait(400);

  // Door: first the "came home" hour, then the right one.
  await slot('무쇠 열쇠');
  await tapObject('door');
  await shot('door-keyed', 900);
  const wheel = (i, dir, times) => step(`Digit ${i} ${dir}`, times);
  await wheel(1, 'down', 1);
  await wheel(2, 'down', 3);
  await wheel(3, 'up', 4);
  await wheel(4, 'up', 5);
  await page.locator('.door-turn').tap();
  await shot('door-wrong', 300);
  await wheel(1, 'up', 1);
  await wheel(2, 'up', 2);
  await wheel(3, 'up', 1);
  await wheel(4, 'down', 3);
  await page.locator('.door-turn').tap();
  await shot('escape-bolts', 1600);
  await shot('escape-open', 2600);
  await shot('ending', 7000);
  await shot('ending-settled', 3500);
} catch (error) {
  errors.push(`SCRIPT: ${error.message.split('\n')[0]}`);
  await page.screenshot({ path: `${OUT}/zz-crash.png` }).catch(() => undefined);
} finally {
  await browser.close();
  server.kill();
}
console.log(notes.join('\n'));
console.log(errors.length ? `\nERRORS:\n${errors.join('\n')}` : '\nno errors');
