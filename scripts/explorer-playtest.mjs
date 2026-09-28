/** Explorer persona: examines everything, misuses items, burns hints, switches language and refreshes mid-scene. Run after `npm run build`. */
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { chromium } from 'playwright-core';

const OUT = 'qa-artifacts/explorer';
mkdirSync(OUT, { recursive: true });
const server = spawn('npx', ['vite', 'preview', '--port', '4189', '--strictPort'], { stdio: 'ignore' });
await new Promise((r) => setTimeout(r, 2500));
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
const log = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
const wait = (ms) => page.waitForTimeout(ms);
const say = async () => (await page.locator('.narration').innerText()).replace(/\s+/g, ' ');
const clickObj = async (id) => {
  const b = await page.locator(`[data-object="${id}"]`).boundingBox();
  await page.mouse.click(b.x + b.width / 2, b.y + b.height / 2);
  await wait(1000);
};
const back = async () => {
  await page.keyboard.press('Escape');
  await wait(800);
};
const slot = (name) => page.locator(`.slot[aria-label="${name}"]`).click();
const save = () => page.evaluate(() => JSON.parse(localStorage.getItem('the-last-room.save.v1') || 'null'));

try {
  await page.goto('http://localhost:4189/');
  await page.evaluate(() => {
    localStorage.clear();
    localStorage.setItem('the-last-room.settings.v1', JSON.stringify({ lang: 'en', sound: true }));
  });
  await page.reload();
  await wait(2500);
  await page.getByRole('button', { name: 'START GAME' }).click();
  // Refresh during the intro.
  await wait(2000);
  await page.reload();
  await wait(1500);
  log.push(`after refresh in intro, CONTINUE disabled: ${await page.getByRole('button', { name: 'CONTINUE' }).isDisabled()}`);
  await page.getByRole('button', { name: 'START GAME' }).click();
  await wait(300);
  await page.getByRole('button', { name: 'Skip', exact: true }).click();
  await wait(900);

  // Examine everything.
  for (const id of ['window', 'basket', 'door', 'safe', 'bookshelf', 'painting', 'clock', 'drawer']) {
    await clickObj(id);
    await back();
  }
  await clickObj('lamp');
  await clickObj('lamp');
  log.push(`lamp twice → lampOn=${(await save())?.flags?.lampOn}`);
  await clickObj('memo');
  await back();

  // Hold the note and poke random things.
  await slot('Torn Note (left)');
  await clickObj('door');
  log.push(`note on door → ${await say()} | still holding: ${await page.locator('.slot.is-held').count()}`);
  await clickObj('painting');
  log.push(`next tap opens painting: ${await page.locator('.scene--painting').count()}`);
  await back();

  // Tap the wall while holding → put away.
  await slot('Torn Note (left)');
  await page.mouse.click(1000, 120);
  await wait(300);
  log.push(`wall tap put away: ${(await page.locator('.slot.is-held').count()) === 0}`);

  // Hints: all tiers.
  await page.getByRole('button', { name: /^Hint/ }).click();
  for (let i = 0; i < 4; i++) {
    const btn = page.getByRole('button', { name: /Reveal (next )?hint/ });
    if (await btn.count()) await btn.click();
    await wait(200);
  }
  await page.screenshot({ path: `${OUT}/hints-all.png` });
  await page.keyboard.press('Escape');
  await wait(300);

  // Switch language mid-game, inside a scene.
  await clickObj('clock');
  await page.getByRole('button', { name: 'Settings' }).click();
  await page.getByRole('radio', { name: '한국어' }).click();
  await wait(500);
  await page.keyboard.press('Escape');
  await wait(400);
  await page.screenshot({ path: `${OUT}/lang-switch-in-scene.png` });
  log.push(`scene title after switch: ${await page.locator('#scene-title').innerText()}`);

  // Refresh inside a scene.
  await wait(1700);
  await page.reload();
  await wait(1000);
  await page.getByRole('button', { name: '이어하기' }).click();
  await wait(1200);
  log.push(`after refresh-in-scene: scene open=${await page.locator('.investigation').count()} phase ok, inventory=${await page.locator('.slot').count()}`);
  await page.screenshot({ path: `${OUT}/resume.png` });

  // Save & return to title, then continue.
  await page.getByRole('button', { name: '설정' }).click();
  await page.getByRole('button', { name: '저장 후 타이틀로' }).click();
  await wait(800);
  await page.getByRole('button', { name: '이어하기' }).click();
  await wait(1000);
  log.push(`title→continue ok: ${await page.locator('.hud-timer').isVisible()}`);

  // Reduced motion on, open a scene.
  await page.getByRole('button', { name: '설정' }).click();
  await page.getByRole('switch', { name: '움직임 줄이기' }).click().catch(async () => {
    await page.locator('.setting-row', { hasText: '움직임 줄이기' }).locator('button').click();
  });
  await page.keyboard.press('Escape');
  await wait(300);
  await clickObj('painting');
  await page.screenshot({ path: `${OUT}/reduced-motion-scene.png` });
  await back();
  log.push(`discovered objects: ${(await save())?.discoveredObjects?.length}/10`);
  log.push(`timer: ${await page.locator('.hud-timer').innerText()}`);
} catch (e) {
  errors.push('SCRIPT: ' + e.message.split('\n')[0]);
  await page.screenshot({ path: `${OUT}/crash.png` });
} finally {
  await browser.close();
  server.kill();
}
console.log(log.join('\n'));
console.log(errors.length ? `ERRORS:\n${errors.join('\n')}` : 'no errors');
