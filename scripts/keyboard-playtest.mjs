/** Keyboard-only persona: Tab / Enter / Esc / digits from title to ending. Run after `npm run build`. */
import { spawn } from 'node:child_process';
import { chromium } from 'playwright-core';

const server = spawn('npx', ['vite', 'preview', '--port', '4187', '--strictPort'], { stdio: 'ignore' });
await new Promise((r) => setTimeout(r, 2500));
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
const log = [];
const wait = (ms) => page.waitForTimeout(ms);
const focused = () =>
  page.evaluate(() => {
    const el = document.activeElement;
    return el ? `${el.tagName}.${el.className}|${el.getAttribute('aria-label') || el.textContent?.trim().slice(0, 30)}` : '';
  });

/** Press Tab until the focused element matches; this is exactly what a keyboard user does. */
async function tabTo(re, max = 80, shift = false) {
  for (let i = 0; i < max; i++) {
    const f = await focused();
    if (re.test(f)) return i;
    await page.keyboard.press(shift ? 'Shift+Tab' : 'Tab');
  }
  throw new Error(`could not Tab to ${re} (last: ${await focused()})`);
}
async function activate(re, label) {
  const presses = await tabTo(re);
  log.push(`${label}: ${presses} Tab presses`);
  await page.keyboard.press('Enter');
  await wait(1000);
}
const narration = () => page.locator('.narration').innerText();

try {
  await page.goto('http://localhost:4187/');
  await page.evaluate(() => {
    localStorage.clear();
    localStorage.setItem('the-last-room.settings.v1', JSON.stringify({ lang: 'en', sound: false }));
  });
  await page.reload();
  await wait(3000);
  await activate(/START GAME/, 'start');
  await activate(/Skip/, 'skip intro');
  await activate(/hotspot--memo/, 'memo');
  await page.keyboard.press('Escape');
  await wait(900);
  await activate(/hotspot--painting/, 'painting');
  await activate(/painting-tower/, 'tower');
  await page.keyboard.press('Escape');
  await wait(900);
  await activate(/hotspot--clock/, 'clock');
  await tabTo(/Hour −/);
  for (let i = 0; i < 2; i++) await page.keyboard.press('Enter');
  await tabTo(/Minute −/);
  for (let i = 0; i < 7; i++) await page.keyboard.press('Enter');
  await activate(/Set the hands/, 'set hands');
  await wait(800);
  await activate(/Take: Brass Key/, 'take key');
  await page.keyboard.press('Escape');
  await wait(900);
  await activate(/slot.*Brass Key/, 'hold key');
  await activate(/hotspot--drawer/, 'use key on drawer');
  await activate(/Take: Old Photograph/, 'photo');
  await activate(/Take: Torn Note \(right\)/, 'note right');
  await page.keyboard.press('Escape');
  await wait(900);
  await activate(/slot.*Torn Note \(right\)/, 'hold note');
  await activate(/slot.*Torn Note \(left\)/, 'combine');
  await page.keyboard.press('Escape');
  await wait(900);
  await activate(/hotspot--bookshelf/, 'bookshelf');
  for (const t of ['On Flight', 'The Patience of Sand', 'What the Fire Kept', 'Lunar Tables']) {
    await tabTo(new RegExp(`book.*${t}`));
    await page.keyboard.press('Enter');
    await wait(150);
  }
  await wait(1500);
  await activate(/Take: Old Journal/, 'journal');
  for (let i = 0; i < 3; i++) {
    await tabTo(/Next page/);
    await page.keyboard.press('Enter');
    await wait(400);
  }
  await activate(/Switch the lamp on|Hold it near the lamp/, 'lamp from inspector');
  await page.keyboard.press('Escape');
  await wait(900);
  await page.keyboard.press('Escape');
  await wait(900);
  await activate(/hotspot--safe/, 'safe');
  await page.keyboard.type('7392');
  await page.keyboard.press('Enter');
  await wait(3400);
  log.push(`safe → ${await narration()}`);
  await activate(/Take: Iron Key/, 'iron key');
  await activate(/Take: Sealed Letter/, 'letter');
  await page.keyboard.press('Escape');
  await wait(900);
  await page.keyboard.press('Escape');
  await wait(900);
  await activate(/slot.*Iron Key/, 'hold iron key');
  await activate(/hotspot--door/, 'door');
  await page.keyboard.type('1152');
  await page.keyboard.press('Enter');
  await wait(9000);
  log.push(`ending: ${await page.locator('.ending-title').innerText()}`);
} catch (e) {
  errors.push(e.message.split('\n')[0]);
  await page.screenshot({ path: 'qa-artifacts/keyboard-crash.png' });
} finally {
  await browser.close();
  server.kill();
}
console.log(log.join('\n'));
console.log(errors.length ? `ERRORS: ${errors.join(' | ')}` : 'no errors');
