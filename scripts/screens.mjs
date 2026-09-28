/**
 * Layout sweep: every screen and close-up, at several viewports.
 *
 *   npm run build && node scripts/screens.mjs [lang]
 *
 * Uses the debug hook (?debug=true → window.__TLR) to jump straight to each state,
 * then screenshots to qa-artifacts/screens/<viewport>/.
 */
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { chromium } from 'playwright-core';

const PORT = 4183;
const BASE = `http://localhost:${PORT}/?debug=true`;
const LANG = process.argv[2] || 'ko';
const CHROME = process.env.CHROME_PATH || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const VIEWPORTS = [
  { name: 'phone-landscape', width: 844, height: 390, mobile: true },
  { name: 'phone-small', width: 360, height: 640, mobile: true },
  { name: 'tablet', width: 768, height: 1024, mobile: true },
  { name: 'laptop', width: 1280, height: 720, mobile: false },
  { name: 'ultrawide', width: 2560, height: 1080, mobile: false },
];

const server = spawn('npx', ['vite', 'preview', '--port', String(PORT), '--strictPort'], { stdio: 'ignore' });
for (let i = 0; i < 50; i++) {
  try {
    if ((await fetch(`http://localhost:${PORT}/`)).ok) break;
  } catch {
    /* starting */
  }
  await new Promise((r) => setTimeout(r, 200));
}

const browser = await chromium.launch({ executablePath: CHROME });
const problems = [];
try {
  for (const vp of VIEWPORTS) {
    const dir = `qa-artifacts/screens/${vp.name}`;
    mkdirSync(dir, { recursive: true });
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      hasTouch: vp.mobile,
      isMobile: vp.mobile,
    });
    const page = await context.newPage();
    page.on('pageerror', (e) => problems.push(`${vp.name}: ${e.message}`));
    await page.goto(BASE);
    await page.evaluate((lang) => {
      localStorage.clear();
      localStorage.setItem('the-last-room.settings.v1', JSON.stringify({ lang, sound: false }));
    }, LANG);
    await page.reload();
    await page.waitForTimeout(3300);
    const shot = async (name, ms = 1300) => {
      await page.waitForTimeout(ms);
      await page.screenshot({ path: `${dir}/${name}.png` });
      // Anything interactive pushed outside the viewport is a layout bug.
      const offscreen = await page.evaluate(() => {
        const out = [];
        for (const el of document.querySelectorAll('.scene button, .hud button, .menu button, .ending button, .inventory button')) {
          const r = el.getBoundingClientRect();
          if (r.width === 0 || getComputedStyle(el).visibility === 'hidden' || el.closest('[aria-hidden="true"]')) continue;
          if (r.bottom > innerHeight + 1 || r.right > innerWidth + 1 || r.top < -1 || r.left < -1) {
            out.push(`${el.className || el.tagName} "${(el.getAttribute('aria-label') || el.textContent || '').trim().slice(0, 24)}"`);
          }
        }
        return out;
      });
      for (const o of offscreen) problems.push(`${vp.name}/${name}: off-screen ${o}`);
    };
    const act = (action) => page.evaluate((a) => window.__TLR.store.dispatch(a), action);
    const openObject = async (id) => {
      await act({ type: 'CLOSE_SCENE' });
      await act({ type: 'CLOSE_SCENE' });
      await act({ type: 'OPEN_OBJECT', object: id });
    };

    await shot('00-menu', 0);
    await page.locator('.menu-item').first().tap().catch(() => page.locator('.menu-item').first().click());
    await act({ type: 'BEGIN_EXPLORATION' });
    await page.locator('.debug header button').click();
    await shot('01-room');
    await act({ type: 'OPEN_OBJECT', object: 'memo' });
    await shot('02-memo');
    for (const id of ['clock', 'painting', 'bookshelf', 'drawer', 'safe', 'door', 'window', 'basket']) {
      await openObject(id);
      await shot(`03-${id}`);
    }
    await act({ type: 'CLOSE_SCENE' });
    await act({ type: 'DEBUG', command: { cmd: 'solveAll' } });
    await act({ type: 'OPEN_ITEM', item: 'journal', page: 3 });
    await shot('04-journal-ink');
    await act({ type: 'OPEN_ITEM', item: 'photograph' });
    await shot('05-photo');
    await openObject('safe');
    await shot('06-safe-open');
    await act({ type: 'CLOSE_SCENE' });
    await act({ type: 'HOLD_ITEM', item: 'iron_key' });
    await shot('07-holding', 500);
    await act({ type: 'USE_ITEM', item: 'iron_key', target: 'door' });
    await shot('08-door-keyed');
    await act({ type: 'CLOSE_SCENE' });
    await page.getByRole('button', { name: /^(힌트|Hint)/ }).first().click();
    await shot('09-hint-panel', 600);
    await page.keyboard.press('Escape');
    await act({ type: 'DEBUG', command: { cmd: 'forceEnding', ending: 'secret' } });
    await shot('10-ending', 6000);
    await context.close();
  }
} finally {
  await browser.close();
  server.kill();
}
console.log(problems.length ? problems.join('\n') : 'no layout problems detected');
