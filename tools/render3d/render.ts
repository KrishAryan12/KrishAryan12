/**
 * Deterministic hero recorder.
 *
 *   pnpm render:hero                 full render + encode (frames → GIF / WebP / APNG candidates)
 *   pnpm render:hero --stills        only a few key frames, for quick review
 *   pnpm render:hero --encode-only   re-encode existing frames
 *
 * Frames are stepped exactly with window.renderFrame(t) in headless Chromium (software WebGL is
 * fine), rendered at 2× and downscaled by ffmpeg. Scratch output lives in tools/render3d/out/
 * (gitignored); only the chosen hero and the poster are copied to assets/.
 */
import { build } from 'esbuild';
import { existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { chromium } from 'playwright';
import { compactPath, loadFont } from '../src/svg/text.ts';
import { ROOT } from '../src/lib/paths.ts';
import { loadProfile } from '../src/lib/content.ts';
import { C, tokens } from '../src/tokens/tokens.ts';
import { encodeAll } from './encode.ts';

const HERE = join(ROOT, 'tools', 'render3d');
const OUT = join(HERE, 'out');
const FRAMES = join(OUT, 'frames');

export const HERO = {
  width: 1200,
  height: 440,
  scale: 2,
  fps: tokens.motion.heroFps,
  loop: tokens.motion.heroLoop,
  /** The powered-on title frame, used for the poster. */
  posterT: 6.2,
  /** Loop phase of the first frame. */
  startT: 5.6,
};

/** Advance in 100-unit em; a lone space reports NaN in some opentype.js builds. */
function advance(font: ReturnType<typeof loadFont>, ch: string): number {
  const w = font.getAdvanceWidth(ch, 100);
  return Number.isFinite(w) ? w : ((font.charToGlyph(ch).advanceWidth ?? 250) / font.unitsPerEm) * 100;
}

function titlePaths(): { d: string[]; width: number; subD: string[]; subWidth: number } {
  const p = loadProfile();
  const bold = loadFont('displayBold');
  const reg = loadFont('display');
  const title = p.name.toUpperCase();
  // Letter-spaced title, drawn glyph by glyph so tracking is exact.
  const tracking = 6;
  let x = 0;
  const d: string[] = [];
  for (const ch of title) {
    if (ch !== ' ') d.push(compactPath(bold.getPath(ch, x, 0, 100)));
    x += advance(bold, ch) + tracking;
  }
  const sub = 'AI ENGINEER  ×  SITE RELIABILITY ENGINEER';
  let sx = 0;
  const subD: string[] = [];
  for (const ch of sub) {
    if (ch !== ' ') subD.push(compactPath(reg.getPath(ch, sx, 0, 100)));
    sx += advance(reg, ch) + 14;
  }
  return { d, width: x - tracking, subD, subWidth: sx - 14 };
}

async function bundle(): Promise<string> {
  const res = await build({
    entryPoints: [join(HERE, 'scene.ts')],
    bundle: true,
    format: 'iife',
    write: false,
    minify: true,
    target: 'es2022',
  });
  return res.outputFiles[0]!.text;
}

async function renderFrames(times: Array<{ t: number; name: string }>): Promise<void> {
  mkdirSync(FRAMES, { recursive: true });
  const js = await bundle();
  const opts = {
    width: HERO.width * HERO.scale,
    height: HERO.height * HERO.scale,
    loop: HERO.loop,
    title: titlePaths(),
    colors: { void: C.void, cyan: C.cyan, cyanMid: C.cyanMid, orange: C.orange, white: C.white },
  };
  const html = `<!doctype html><html><body style="margin:0;background:#000"><canvas id="c" width="${opts.width}" height="${opts.height}"></canvas>
<script>window.__HERO__=${JSON.stringify(opts)};</script><script>${js}</script></body></html>`;
  const page_ = join(OUT, 'hero.html');
  writeFileSync(page_, html);
  const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  try {
    const page = await browser.newPage({ viewport: { width: opts.width, height: opts.height } });
    page.on('pageerror', (e) => console.error('page error:', e.message));
    await page.goto(`file:///${page_.replace(/\\/g, '/')}`);
    await page.waitForFunction(() => window.__READY__ === true, null, { timeout: 60_000 });
    const started = Date.now();
    for (const [i, f] of times.entries()) {
      const dataUrl = await page.evaluate((t) => {
        window.renderFrame!(t);
        return (document.getElementById('c') as HTMLCanvasElement).toDataURL('image/png');
      }, f.t);
      writeFileSync(join(FRAMES, `${f.name}.png`), Buffer.from(dataUrl.split(',')[1]!, 'base64'));
      if (i % 20 === 0) console.log(`frame ${i + 1}/${times.length} (${((Date.now() - started) / 1000).toFixed(0)} s)`);
    }
  } finally {
    await browser.close();
  }
}

async function main(): Promise<void> {
  const args = new Set(process.argv.slice(2));
  mkdirSync(OUT, { recursive: true });
  if (args.has('--stills')) {
    const ts = [0.5, 1.8, 2.7, 3.2, 3.8, 4.6, HERO.posterT, 7.6];
    await renderFrames(ts.map((t) => ({ t, name: `still-${t.toFixed(1)}` })));
    console.log(`stills in ${FRAMES}`);
    return;
  }
  if (!args.has('--encode-only')) {
    if (existsSync(FRAMES)) rmSync(FRAMES, { recursive: true });
    const n = HERO.fps * HERO.loop;
    // Start the loop on the lit title, so the first frame (what a slow connection shows first) is the name.
    const times = Array.from({ length: n }, (_, i) => ({ t: (i / HERO.fps + HERO.startT) % HERO.loop, name: `f${String(i).padStart(4, '0')}` }));
    times.push({ t: HERO.posterT, name: 'poster' });
    await renderFrames(times);
  }
  const frames = readdirSync(FRAMES).filter((f) => /^f\d{4}\.png$/.test(f)).length;
  console.log(`${frames} frames; encoding`);
  await encodeAll({ framesDir: FRAMES, outDir: OUT, fps: HERO.fps, width: HERO.width, height: HERO.height });
}

await main();
