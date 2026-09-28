/**
 * End-to-end QA for THE LAST ROOM.
 *
 *   npm run build && npm run e2e
 *
 * Starts `vite preview`, then plays the game in headless Chromium through the real UI:
 *   A. desktop — full normal playthrough with wrong answers, a mid-game refresh, and NEW GAME reset
 *   B. mobile 390×844 — debug shortcuts + the secret ending path
 *   C. robustness — corrupted save data, sound toggle persistence
 * Screenshots go to ./qa-artifacts.
 */
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { chromium } from 'playwright-core';

const PORT = Number(process.env.E2E_PORT || 4179);
const BASE = `http://localhost:${PORT}/`;
const OUT = 'qa-artifacts';
const CHROME = process.env.CHROME_PATH || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
mkdirSync(OUT, { recursive: true });

let failures = 0;
const log = (...args) => console.log('  ', ...args);
function expect(cond, message) {
  if (cond) log('✓', message);
  else {
    failures++;
    console.log('   ✗', message);
  }
}

async function startServer() {
  const server = spawn('npx', ['vite', 'preview', '--port', String(PORT), '--strictPort'], { stdio: 'pipe' });
  for (let i = 0; i < 50; i++) {
    try {
      const res = await fetch(BASE);
      if (res.ok) return server;
    } catch {
      /* not up yet */
    }
    await new Promise((r) => setTimeout(r, 200));
  }
  server.kill();
  throw new Error('preview server did not start — run `npm run build` first');
}

async function newPage(browser, viewport, { mobile = false, lang = 'en', query = '' } = {}) {
  const context = await browser.newContext({ viewport, hasTouch: mobile, isMobile: mobile, deviceScaleFactor: 1 });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await page.goto(BASE + query);
  await page.evaluate((l) => {
    localStorage.clear();
    localStorage.setItem('the-last-room.settings.v1', JSON.stringify({ lang: l, sound: true, volume: 0.8 }));
  }, lang);
  await page.reload();
  return { page, errors, context };
}

const wait = (page, ms) => page.waitForTimeout(ms);
const save = (page) => page.evaluate(() => JSON.parse(localStorage.getItem('the-last-room.save.v1') || 'null'));
const narration = (page) => page.locator('.narration').innerText();

/** Click a room object; falls back to keyboard activation when it is panned off-screen. */
async function tapObject(page, id) {
  const hotspot = page.locator(`[data-object="${id}"]`);
  const box = await hotspot.boundingBox();
  const vp = page.viewportSize();
  const cx = box ? box.x + box.width / 2 : -1;
  const cy = box ? box.y + box.height / 2 : -1;
  if (box && cx > 60 && cx < vp.width - 60 && cy > 0 && cy < vp.height) await page.mouse.click(cx, cy);
  else {
    await hotspot.focus();
    await page.keyboard.press('Enter');
  }
  await wait(page, 1100);
}

async function back(page) {
  await page.locator('.investigation-back').click();
  await wait(page, 900);
}

const slot = (page, name) => page.locator(`.slot[aria-label="${name}"]`);

async function startFresh(page) {
  await wait(page, 600);
  await page.getByRole('button', { name: 'START GAME' }).click();
  await wait(page, 1600);
  await page.screenshot({ path: `${OUT}/A-01-intro.png` });
  await page.getByRole('button', { name: 'Skip', exact: true }).click();
  await wait(page, 900);
}

async function step(page, label, times) {
  for (let i = 0; i < times; i++) {
    await page.getByRole('button', { name: label, exact: true }).click();
    await wait(page, 40);
  }
}

/* ------------------------------------------------------------------ */
/* A. Desktop — normal ending                                          */
/* ------------------------------------------------------------------ */
async function scenarioDesktop(browser) {
  console.log('\nA. Desktop 1440×900 — full playthrough');
  const { page, errors, context } = await newPage(browser, { width: 1440, height: 900 });
  await page.screenshot({ path: `${OUT}/A-00-menu.png` });
  expect(await page.getByRole('button', { name: 'CONTINUE' }).isDisabled(), 'CONTINUE disabled without a save');
  await startFresh(page);
  expect(await page.locator('.hud-timer').isVisible(), 'HUD visible after intro');

  await tapObject(page, 'lamp');
  expect((await narration(page)).includes('Warm light'), 'lamp switched on');
  await page.screenshot({ path: `${OUT}/A-02-room-lit.png` });

  await tapObject(page, 'memo');
  expect(await slot(page, 'Torn Note (left)').isVisible(), 'memo → Torn Note (left) in inventory');
  await back(page);

  await tapObject(page, 'painting');
  await page.locator('.painting-tower').click();
  await wait(page, 1500);
  await page.screenshot({ path: `${OUT}/A-03-painting-tower.png` });
  await back(page);

  // Puzzle 1 — clock. Wrong first (unchanged 11:52), then 9:45.
  await tapObject(page, 'clock');
  await page.getByRole('button', { name: 'Set the hands' }).click();
  await wait(page, 300);
  expect((await narration(page)).includes('Nothing happens'), 'clock: wrong time gives soft feedback');
  await step(page, 'Hour −', 2);
  await step(page, 'Minute −', 7);
  await page.getByRole('button', { name: 'Set the hands' }).click();
  await wait(page, 1600);
  await page.screenshot({ path: `${OUT}/A-04-clock-open.png` });
  await page.getByRole('button', { name: /Take: Brass Key/ }).click();
  await wait(page, 600);
  expect(await slot(page, 'Brass Key').isVisible(), 'clock solved → Brass Key');
  await back(page);

  // Drawer — try without key held, then with it.
  await tapObject(page, 'drawer');
  await page.getByRole('button', { name: 'Keyhole' }).click();
  await wait(page, 200);
  expect((await narration(page)).includes('Locked'), 'drawer: locked feedback');
  await back(page);
  await slot(page, 'Brass Key').click();
  await tapObject(page, 'drawer');
  await wait(page, 900);
  await page.screenshot({ path: `${OUT}/A-05-drawer-open.png` });
  await page.getByRole('button', { name: /Take: Old Photograph/ }).click();
  await wait(page, 300);
  await page.getByRole('button', { name: /Take: Torn Note \(right\)/ }).click();
  await wait(page, 300);
  expect(await slot(page, 'Old Photograph').isVisible(), 'drawer → photograph');
  await back(page);

  // Puzzle 2 — combine the note halves.
  await slot(page, 'Torn Note (left)').click();
  await slot(page, 'Torn Note (right)').click();
  await wait(page, 900);
  expect(await slot(page, 'Mended Note').isVisible(), 'combination → Mended Note');
  await page.screenshot({ path: `${OUT}/A-06-mended-note.png` });
  await back(page);

  await slot(page, 'Old Photograph').click();
  await page.getByRole('button', { name: 'Inspect' }).click();
  await wait(page, 900);
  await page.screenshot({ path: `${OUT}/A-07-photograph.png` });
  await back(page);

  // Puzzle 3 — bookshelf. Right books, wrong order first.
  await tapObject(page, 'bookshelf');
  for (const title of ['Lunar Tables', 'On Flight', 'The Patience of Sand', 'What the Fire Kept']) {
    await page.locator(`.book[aria-label^="${title}"]`).click();
    await wait(page, 120);
  }
  await wait(page, 300);
  expect((await narration(page)).includes('wrong order'), 'bookshelf: near-miss feedback');
  for (const title of ['On Flight', 'The Patience of Sand', 'What the Fire Kept', 'Lunar Tables']) {
    await page.locator(`.book[aria-label^="${title}"]`).click();
    await wait(page, 150);
  }
  await wait(page, 1500);
  await page.screenshot({ path: `${OUT}/A-08-shelf-open.png` });
  await page.getByRole('button', { name: /Take: Old Journal/ }).click();
  await wait(page, 900);
  await back(page);
  await back(page);

  // Puzzle 4 — lemon ink: journal + lamp.
  await slot(page, 'Old Journal').click();
  await tapObject(page, 'lamp');
  await wait(page, 1200);
  await page.screenshot({ path: `${OUT}/A-09-ink-reveal.png` });
  expect(await page.locator('.doc-text--ink').isVisible(), 'ink revealed on the journal page');
  await back(page);

  // Puzzle 5 — safe. Wrong code, then 7392.
  await tapObject(page, 'safe');
  const typeCode = async (code) => {
    for (const d of code) await page.locator('.keypad-key', { hasText: new RegExp(`^${d}$`) }).click();
    await page.getByRole('button', { name: 'Enter' }).click();
  };
  await typeCode('1234');
  await wait(page, 250);
  await page.screenshot({ path: `${OUT}/A-10-safe-wrong.png` });
  expect((await narration(page)).includes('Something is wrong'), 'safe: wrong code feedback');
  await wait(page, 700);
  await typeCode('7392');
  await wait(page, 2000);
  await page.screenshot({ path: `${OUT}/A-11-safe-opening.png` });
  await wait(page, 1400);
  await page.getByRole('button', { name: /Take: Iron Key/ }).click();
  await wait(page, 300);
  await page.getByRole('button', { name: /Take: Sealed Letter/ }).click();
  await wait(page, 900);
  await page.screenshot({ path: `${OUT}/A-12-letter.png` });
  await back(page);
  await back(page);

  // Refresh mid-game → CONTINUE restores progress.
  await wait(page, 1700);
  await page.reload();
  await wait(page, 800);
  const cont = page.getByRole('button', { name: 'CONTINUE' });
  expect(!(await cont.isDisabled()), 'after refresh: CONTINUE enabled');
  await cont.click();
  await wait(page, 900);
  expect(await slot(page, 'Iron Key').isVisible(), 'after refresh: inventory restored (Iron Key)');
  const restored = await save(page);
  expect(restored?.solvedPuzzles?.length === 5, `after refresh: 5 puzzles solved (${restored?.solvedPuzzles})`);

  // Puzzle 6 — door.
  await slot(page, 'Iron Key').click();
  await tapObject(page, 'door');
  await wait(page, 700);
  const wheel = (i, dir, n) => step(page, `Digit ${i} ${dir}`, n);
  await wheel(1, 'down', 1);
  await wheel(2, 'down', 3);
  await wheel(3, 'up', 4);
  await wheel(4, 'up', 5);
  await page.locator('.door-turn').click();
  await wait(page, 300);
  expect((await narration(page)).includes('came home'), 'door: 9:45 explains the mistake');
  await wheel(1, 'up', 1);
  await wheel(2, 'up', 2);
  await wheel(3, 'up', 1);
  await wheel(4, 'down', 3);
  await page.screenshot({ path: `${OUT}/A-13-door-dial.png` });
  await page.locator('.door-turn').click();
  await wait(page, 3000);
  await page.screenshot({ path: `${OUT}/A-14-escape-handle.png` });
  await wait(page, 1600);
  await page.screenshot({ path: `${OUT}/A-15-escape-open.png` });
  await wait(page, 5200);
  await page.screenshot({ path: `${OUT}/A-16-ending.png` });
  const title = await page.locator('.ending-title').innerText();
  expect(title.includes('YOU ESCAPED'), `ending title: ${title}`);
  const stats = await page.locator('.ending-stats').innerText();
  expect(stats.includes('6 / 6'), 'ending shows 6 / 6 puzzles');
  const ach = await page.evaluate(() => JSON.parse(localStorage.getItem('the-last-room.achievements.v1') || '{}'));
  expect(!!ach.first_escape && !!ach.no_hint, `achievements recorded: ${Object.keys(ach).join(', ')}`);

  // NEW GAME from the ending wipes progress.
  await page.getByRole('button', { name: 'NEW GAME' }).click();
  await wait(page, 800);
  expect(await page.getByRole('button', { name: 'CONTINUE' }).isDisabled(), 'NEW GAME → no resumable save');
  expect((await save(page)) === null, 'NEW GAME → save cleared');
  expect(errors.length === 0, `no page errors (${errors.join(' | ')})`);
  await context.close();
}

/* ------------------------------------------------------------------ */
/* B. Mobile — secret ending                                           */
/* ------------------------------------------------------------------ */
async function scenarioMobileSecret(browser) {
  console.log('\nB. Mobile 390×844 — debug shortcuts + secret ending');
  const { page, errors, context } = await newPage(browser, { width: 390, height: 844 }, { mobile: true, query: '?debug=true' });
  await wait(page, 600);
  await page.screenshot({ path: `${OUT}/B-00-menu.png` });
  await page.getByRole('button', { name: 'START GAME' }).click();
  await wait(page, 400);
  await page.getByRole('button', { name: 'Skip', exact: true }).click();
  await wait(page, 900);
  expect(await page.locator('.debug').isVisible(), 'debug panel visible with ?debug=true');
  const audioReady = await page.evaluate(() => window.__TLR?.audio?.isReady);
  expect(audioReady === true, 'audio context running after the first gesture');
  await page.screenshot({ path: `${OUT}/B-01-room.png` });

  // Pan across the room.
  const right = page.getByRole('button', { name: 'Look right' });
  expect(await right.isVisible(), 'narrow screen offers look-right');
  await right.click();
  await wait(page, 1100);
  await page.screenshot({ path: `${OUT}/B-02-room-right.png` });

  await page.getByRole('button', { name: 'solve all (up to door)' }).click();
  await page.getByRole('button', { name: 'Close debug panel' }).click();
  await wait(page, 400);

  // Read the letter to its last page (the P.S.).
  await slot(page, 'Sealed Letter').tap();
  await page.getByRole('button', { name: 'Inspect' }).tap();
  await wait(page, 700);
  await page.getByRole('button', { name: 'Next page' }).tap();
  await wait(page, 700);
  await page.screenshot({ path: `${OUT}/B-03-letter-ps.png` });

  // The photograph, held to the light.
  await back(page);
  await slot(page, 'Old Photograph').tap();
  await page.getByRole('button', { name: 'Inspect' }).tap();
  await wait(page, 700);
  await page.getByRole('button', { name: 'Hold it near the lamp' }).tap();
  await wait(page, 2200);
  await page.screenshot({ path: `${OUT}/B-04-photo-truth.png` });
  await back(page);

  // Give the house back its hour: 9:45 → 11:52.
  await tapObject(page, 'clock');
  await step(page, 'Hour +', 2);
  await step(page, 'Minute +', 7);
  await page.getByRole('button', { name: 'Set the hands' }).tap();
  await wait(page, 600);
  expect((await narration(page)).includes('The house remembers'), 'secret: the house remembers');
  await back(page);

  await slot(page, 'Iron Key').tap();
  await tapObject(page, 'door');
  const wheel = (i, dir, n) => step(page, `Digit ${i} ${dir}`, n);
  await wheel(2, 'down', 1);
  await wheel(3, 'up', 5);
  await wheel(4, 'up', 2);
  await page.screenshot({ path: `${OUT}/B-05-door.png` });
  await page.locator('.door-turn').tap();
  await wait(page, 4200);
  await page.screenshot({ path: `${OUT}/B-06-escape.png` });
  await wait(page, 5800);
  await page.screenshot({ path: `${OUT}/B-07-secret-ending.png` });
  const title = await page.locator('.ending-title').innerText();
  expect(title.includes('YOU REMEMBERED'), `secret ending title: ${title}`);
  const ach = await page.evaluate(() => JSON.parse(localStorage.getItem('the-last-room.achievements.v1') || '{}'));
  expect(!!ach.true_ending, 'TRUE ENDING achievement recorded');
  expect(errors.length === 0, `no page errors (${errors.join(' | ')})`);
  await context.close();
}

/* ------------------------------------------------------------------ */
/* C. Robustness                                                       */
/* ------------------------------------------------------------------ */
async function scenarioRobustness(browser) {
  console.log('\nC. Robustness — corrupted save, sound toggle, Korean UI');
  const { page, errors, context } = await newPage(browser, { width: 1280, height: 720 }, { lang: 'ko' });
  await page.evaluate(() => localStorage.setItem('the-last-room.save.v1', '{not json'));
  await page.reload();
  await wait(page, 800);
  expect(await page.locator('.menu-title').isVisible(), 'corrupted save: title screen still renders');
  expect(await page.getByRole('button', { name: '이어하기' }).isDisabled(), 'corrupted save: CONTINUE disabled');
  await page.screenshot({ path: `${OUT}/C-00-menu-ko.png` });

  await page.getByRole('button', { name: /사운드/ }).click();
  let settings = await page.evaluate(() => JSON.parse(localStorage.getItem('the-last-room.settings.v1')));
  expect(settings.sound === false, 'sound OFF persisted');
  await page.getByRole('button', { name: /사운드/ }).click();
  settings = await page.evaluate(() => JSON.parse(localStorage.getItem('the-last-room.settings.v1')));
  expect(settings.sound === true, 'sound ON persisted');

  await page.getByRole('button', { name: '새로 시작' }).click();
  await wait(page, 400);
  await page.getByRole('button', { name: '건너뛰기' }).click();
  await wait(page, 900);
  await page.getByRole('button', { name: /힌트/ }).click();
  await wait(page, 400);
  await page.getByRole('button', { name: /힌트 보기/ }).click();
  await wait(page, 300);
  await page.screenshot({ path: `${OUT}/C-01-hint-ko.png` });
  const hints = await save(page);
  await wait(page, 1700);
  expect(((await save(page)) ?? hints)?.hintCount === 1, 'hint usage counted');
  expect(errors.length === 0, `no page errors (${errors.join(' | ')})`);
  await context.close();
}

const server = await startServer();
const browser = await chromium.launch({ executablePath: CHROME });
try {
  await scenarioDesktop(browser);
  await scenarioMobileSecret(browser);
  await scenarioRobustness(browser);
} catch (error) {
  failures++;
  console.error('\n   ✗ scenario crashed:', error.message);
  for (const ctx of browser.contexts()) for (const p of ctx.pages()) await p.screenshot({ path: `${OUT}/crash.png` }).catch(() => {});
} finally {
  await browser.close();
  server.kill();
}
console.log(failures === 0 ? '\nE2E: all checks passed' : `\nE2E: ${failures} check(s) failed`);
process.exit(failures === 0 ? 0 : 1);
