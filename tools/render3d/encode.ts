/**
 * Encodes rendered frames into hero candidates and a poster, then prints a size table.
 * GIF uses palettegen + paletteuse with dithering; WebP and APNG are encoded straight from frames.
 * Requires ffmpeg on PATH.
 */
import { execFileSync } from 'node:child_process';
import { copyFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { ASSETS } from '../src/lib/paths.ts';

export interface EncodeOpts {
  framesDir: string;
  outDir: string;
  fps: number;
  width: number;
  height: number;
}

function ffmpeg(args: string[]): void {
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', ...args], { stdio: 'inherit' });
}

const mb = (f: string) => statSync(f).size / 1024 / 1024;

export async function encodeAll(o: EncodeOpts): Promise<Record<string, number>> {
  const input = ['-framerate', String(o.fps), '-i', join(o.framesDir, 'f%04d.png')];
  const scale = `scale=${o.width}:${o.height}:flags=lanczos`;
  const out = (name: string) => join(o.outDir, name);
  const sizes: Record<string, number> = {};

  // GIF: one global palette tuned on the whole loop; sierra2_4a dithering hides glow banding best.
  ffmpeg([...input, '-vf', `${scale},palettegen=max_colors=256:stats_mode=full`, out('palette.png')]);
  ffmpeg([...input, '-i', out('palette.png'), '-lavfi', `${scale}[x];[x][1:v]paletteuse=dither=sierra2_4a:diff_mode=rectangle`, '-loop', '0', out('hero.gif')]);
  sizes['hero.gif'] = mb(out('hero.gif'));

  // Reduced GIF (12 fps, 960 px, 128 colours, bayer): the smallest GIF that still reads, for comparison.
  ffmpeg([...input, '-vf', 'fps=12,scale=960:352:flags=lanczos,palettegen=max_colors=128:stats_mode=diff', out('palette-small.png')]);
  ffmpeg([...input, '-i', out('palette-small.png'), '-lavfi', 'fps=12,scale=960:352:flags=lanczos[x];[x][1:v]paletteuse=dither=bayer:bayer_scale=3:diff_mode=rectangle', '-loop', '0', out('hero-small.gif')]);
  sizes['hero-small.gif'] = mb(out('hero-small.gif'));

  // Animated WebP (lossy). q88: q80 shows faint vertical streaks in the glow; q92 nears the budget.
  ffmpeg([...input, '-vf', scale, '-c:v', 'libwebp_anim', '-lossless', '0', '-q:v', '88', '-compression_level', '6', '-preset', 'picture', '-loop', '0', out('hero.webp')]);
  sizes['hero.webp'] = mb(out('hero.webp'));

  // APNG: lossless, for comparison only.
  ffmpeg([...input, '-vf', scale, '-plays', '0', '-f', 'apng', out('hero.apng.png')]);
  sizes['hero.apng.png'] = mb(out('hero.apng.png'));

  // Poster: the powered-on title frame, as an optimised PNG.
  ffmpeg(['-i', join(o.framesDir, 'poster.png'), '-vf', scale, '-compression_level', '9', out('hero-poster.png')]);
  sizes['hero-poster.png'] = mb(out('hero-poster.png'));

  for (const [k, v] of Object.entries(sizes)) console.log(`${k.padEnd(18)} ${v.toFixed(2)} MB`);
  ship(o.outDir, 'hero.webp');
  console.log('shipped assets/hero.webp and assets/hero-poster.png');
  return sizes;
}

/** Copy the chosen candidate and the poster into assets/. */
export function ship(outDir: string, chosen: 'hero.gif' | 'hero.webp'): void {
  copyFileSync(join(outDir, chosen), join(ASSETS, chosen));
  copyFileSync(join(outDir, 'hero-poster.png'), join(ASSETS, 'hero-poster.png'));
}
