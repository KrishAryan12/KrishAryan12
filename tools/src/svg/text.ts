/**
 * Outlined text without font loading.
 *
 * SVGs shown through <img> cannot fetch fonts, so every glyph is converted to a path once per
 * document (in <defs>) and each character is placed with a <use>. A 600-character terminal costs
 * roughly 15 KB instead of the ~250 KB that fully expanded outlines would.
 */
import opentype from 'opentype.js';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

export type FontKey = 'display' | 'displayBold' | 'mono' | 'monoBold';

const require = createRequire(import.meta.url);
const FONT_FILES: Record<FontKey, string> = {
  display: '@fontsource/oxanium/files/oxanium-latin-500-normal.woff',
  displayBold: '@fontsource/oxanium/files/oxanium-latin-700-normal.woff',
  mono: '@fontsource/jetbrains-mono/files/jetbrains-mono-latin-400-normal.woff',
  monoBold: '@fontsource/jetbrains-mono/files/jetbrains-mono-latin-700-normal.woff',
};
const PREFIX: Record<FontKey, string> = { display: 'd', displayBold: 'D', mono: 'm', monoBold: 'M' };

const fontCache = new Map<FontKey, opentype.Font>();

export function loadFont(key: FontKey): opentype.Font {
  let font = fontCache.get(key);
  if (!font) {
    const buf = readFileSync(require.resolve(FONT_FILES[key]));
    font = opentype.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));
    fontCache.set(key, font);
  }
  return font;
}

/** Glyph geometry is stored at a reference size of 100 units, then scaled per text run. */
const REF = 100;

/**
 * Characters the latin subsets lack, drawn by hand on the same 100-unit em
 * (baseline at y=0, cap height about -70). Advance is in REF units.
 */
const CUSTOM: Record<string, { d: string; advance: number }> = {
  '→': { d: 'M8 -32h62l-20 -20l7 -7l32 32l-32 32l-7 -7l20 -20h-62z', advance: 100 },
  '✓': { d: 'M10 -34l8 -8l17 17l38 -42l8 8l-46 50z', advance: 90 },
  '●': { d: 'M50 -35m-26 0a26 26 0 1 0 52 0a26 26 0 1 0 -52 0z', advance: 100 },
  '■': { d: 'M20 -60h56v56h-56z', advance: 96 },
  '▸': { d: 'M22 -58l46 26l-46 26z', advance: 90 },
  '█': { d: 'M0 -82h60v104h-60z', advance: 60 },
  '↗': { d: 'M20 -6l46 -46v30h10v-46h-46v10h30l-46 46z', advance: 96 },
  '🔒': { d: 'M28 -40v-14a22 22 0 0 1 44 0v14h8v40h-60v-40zm10 0h24v-14a12 12 0 0 0 -24 0z', advance: 100 },
};

function round(n: number): string {
  const r = Math.round(n * 10) / 10;
  return Object.is(r, -0) ? '0' : String(r);
}

export function compactPath(path: opentype.Path): string {
  let out = '';
  let prev = '';
  for (const c of path.commands) {
    const cmd = c.type;
    const sep = cmd === prev && cmd !== 'Z' ? ' ' : cmd;
    switch (c.type) {
      case 'M':
      case 'L':
        out += `${sep}${round(c.x)} ${round(c.y)}`;
        break;
      case 'Q':
        out += `${sep}${round(c.x1)} ${round(c.y1)} ${round(c.x)} ${round(c.y)}`;
        break;
      case 'C':
        out += `${sep}${round(c.x1)} ${round(c.y1)} ${round(c.x2)} ${round(c.y2)} ${round(c.x)} ${round(c.y)}`;
        break;
      case 'Z':
        out += 'Z';
        break;
    }
    prev = cmd;
  }
  return out.replace(/ -/g, '-');
}

export interface TextOpts {
  font?: FontKey;
  size: number;
  fill?: string;
  /** Extra space between characters, in user units. */
  tracking?: number;
  anchor?: 'start' | 'middle' | 'end';
  opacity?: number;
  cls?: string;
}

/** Collects the glyphs a document uses and emits them once in <defs>. */
export class GlyphAtlas {
  private defs = new Map<string, string>();

  private glyphId(font: FontKey, ch: string): { id: string; advance: number } | null {
    if (ch === ' ') {
      return { id: '', advance: loadFont(font).getAdvanceWidth(' ', REF) };
    }
    const id = `${PREFIX[font]}${ch.codePointAt(0)!.toString(36)}`;
    const custom = CUSTOM[ch];
    if (custom) {
      if (!this.defs.has(id)) this.defs.set(id, `<path id="${id}" d="${custom.d}"/>`);
      // Mono text keeps its grid even for drawn glyphs.
      const adv = font.startsWith('mono') ? loadFont(font).getAdvanceWidth('M', REF) : custom.advance;
      return { id, advance: adv };
    }
    const f = loadFont(font);
    const glyph = f.charToGlyph(ch);
    if (!glyph || glyph.name === '.notdef' || glyph.index === 0) {
      throw new Error(`Glyph missing in ${font}: ${JSON.stringify(ch)} (U+${ch.codePointAt(0)!.toString(16)})`);
    }
    if (!this.defs.has(id)) {
      const d = compactPath(glyph.getPath(0, 0, REF));
      this.defs.set(id, `<path id="${id}" d="${d}"/>`);
    }
    return { id, advance: (glyph.advanceWidth! / f.unitsPerEm) * REF };
  }

  /** Width of a string in user units. */
  measure(text: string, font: FontKey, size: number, tracking = 0): number {
    let w = 0;
    const chars = [...text];
    for (const ch of chars) {
      const custom = CUSTOM[ch];
      const adv = ch === ' ' || !custom || font.startsWith('mono')
        ? loadFont(font).getAdvanceWidth(ch === ' ' || !custom ? ch : 'M', REF)
        : custom.advance;
      w += (adv * size) / REF;
    }
    return w + tracking * Math.max(0, chars.length - 1);
  }

  /** An outlined text run as an SVG fragment. */
  text(str: string, x: number, y: number, o: TextOpts): string {
    const font = o.font ?? 'display';
    const tracking = o.tracking ?? 0;
    const scale = o.size / REF;
    const width = this.measure(str, font, o.size, tracking);
    let startX = x;
    if (o.anchor === 'middle') startX = x - width / 2;
    if (o.anchor === 'end') startX = x - width;
    let cursor = 0; // in REF units
    const uses: string[] = [];
    for (const ch of [...str]) {
      const g = this.glyphId(font, ch);
      if (!g) continue;
      if (g.id) uses.push(`<use href="#${g.id}" x="${round(cursor)}"/>`);
      cursor += g.advance + tracking / scale;
    }
    const attrs = [
      `transform="translate(${round(startX)} ${round(y)}) scale(${+scale.toFixed(4)})"`,
      o.fill ? `fill="${o.fill}"` : '',
      o.opacity !== undefined ? `opacity="${o.opacity}"` : '',
      o.cls ? `class="${o.cls}"` : '',
    ].filter(Boolean).join(' ');
    return `<g ${attrs}>${uses.join('')}</g>`;
  }

  /** Greedy word wrap to a maximum width. */
  wrap(str: string, maxWidth: number, font: FontKey, size: number): string[] {
    const words = str.split(/\s+/);
    const lines: string[] = [];
    let line = '';
    for (const w of words) {
      const next = line ? `${line} ${w}` : w;
      if (this.measure(next, font, size) > maxWidth && line) {
        lines.push(line);
        line = w;
      } else line = next;
    }
    if (line) lines.push(line);
    return lines;
  }

  defsMarkup(): string {
    return [...this.defs.values()].join('');
  }
}
