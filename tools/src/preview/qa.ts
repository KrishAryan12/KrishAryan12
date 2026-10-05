/**
 * Visual QA: screenshots the README approximation at 375 / 768 / 880 px in light and dark,
 * plus a contact sheet of every panel in its reduced-motion still frame and at a mid-animation
 * moment. Output goes to .qa/ (gitignored). Inspect the PNGs; fix what looks wrong.
 *
 *   pnpm qa                 all screenshots
 *   pnpm qa sheet           only the panel contact sheet
 */
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { chromium } from 'playwright';
import { ASSETS, ROOT } from '../lib/paths.ts';
import { previewHtml, type Theme } from './render.ts';

const OUT = join(ROOT, '.qa');
const WIDTHS = [375, 768, 880];
const THEMES: Theme[] = ['light', 'dark'];

const fileUrl = (p: string) => `file:///${p.replace(/\\/g, '/')}`;

async function main(): Promise<void> {
  mkdirSync(OUT, { recursive: true });
  const only = process.argv[2];
  const browser = await chromium.launch();
  try {
    if (!only || only === 'sheet') {
      const panels = [
        ...readdirSync(join(ASSETS, 'panels')).map((f) => `panels/${f}`),
        ...readdirSync(join(ASSETS, 'dividers')).map((f) => `dividers/${f}`),
      ].filter((f) => f.endsWith('.svg'));
      // Playwright's reduced-motion emulation does not reach SVG documents loaded through <img>,
      // so the still sheet applies exactly what the SVG's reduced-motion block does: animation off.
      const stillSrc = (f: string) => {
        const svg = readFileSync(join(ASSETS, f), 'utf8').replace('<style>', '<style>*{animation:none!important}');
        return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
      };
      const sheetHtml = (still: boolean) => `<!doctype html><body style="margin:0;padding:16px;background:#fff;width:840px">${panels
        .map((f) => {
          const half = /lane-|system-|web-|paper-|btn-conversation/.test(f);
          const btn = f.includes('/btn-') && !f.includes('conversation');
          const src = still ? stillSrc(f) : fileUrl(join(ASSETS, f));
          return `<figure style="display:inline-block;margin:4px;vertical-align:top;width:${btn ? 260 : half ? 404 : 812}px"><img style="width:100%" src="${src}"><figcaption style="font:11px monospace">${f}</figcaption></figure>`;
        })
        .join('')}</body>`;
      for (const motion of ['reduce', 'no-preference'] as const) {
        const sheet = join(OUT, `sheet-${motion}.html`);
        writeFileSync(sheet, sheetHtml(motion === 'reduce'));
        const page = await browser.newPage({ viewport: { width: 872, height: 900 }, reducedMotion: motion });
        await page.goto(fileUrl(sheet));
        await page.waitForTimeout(motion === 'reduce' ? 300 : 6000);
        await page.screenshot({ path: join(OUT, `sheet-${motion === 'reduce' ? 'still' : 'motion'}.png`), fullPage: true });
        await page.close();
      }
      console.log('contact sheets written to .qa/');
    }
    if (!only || only === 'readme') {
      for (const theme of THEMES) {
        const file = join(OUT, `readme-${theme}.html`);
        writeFileSync(file, previewHtml(theme));
        for (const width of WIDTHS) {
          const page = await browser.newPage({ viewport: { width, height: 900 }, colorScheme: theme, reducedMotion: 'reduce' });
          await page.goto(fileUrl(file));
          await page.waitForTimeout(400);
          await page.screenshot({ path: join(OUT, `readme-${theme}-${width}.png`), fullPage: true });
          await page.close();
        }
      }
      console.log('README screenshots written to .qa/');
    }
  } finally {
    await browser.close();
  }
}

await main();
