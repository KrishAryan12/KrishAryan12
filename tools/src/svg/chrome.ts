/**
 * Panel chrome shared by every card: dark fill, thin cyan border, small radius, corner ticks,
 * and an optional header label. Consistency here is what makes the README feel like one system.
 */
import { C, tokens } from '../tokens/tokens.ts';
import { r, type SvgDoc } from './doc.ts';

export interface ChromeOpts {
  x?: number;
  y?: number;
  w: number;
  h: number;
  /** Small label in the top-left, e.g. "// IMPACT". */
  label?: string;
  /** Right-aligned status chip text, e.g. "LIVE" or "PRIVATE". */
  status?: { text: string; tone: 'cyan' | 'orange' | 'dim'; icon?: '●' | '🔒' };
  accent?: 'cyan' | 'orange';
  /** Background fill; panels default to `panel`, the hero area uses `void`. */
  fill?: string;
  /** Status chip text size; 18 suits 400-unit cards, 800-unit panels pass their readable floor. */
  chipSize?: number;
}

export function chrome(doc: SvgDoc, o: ChromeOpts): string {
  const x = o.x ?? 0;
  const y = o.y ?? 0;
  const { w, h } = o;
  const inset = 1.5;
  const rad = tokens.space.radius;
  const stroke = o.accent === 'orange' ? C.orange : C.cyanMid;
  const t = tokens.space.tick;
  const parts: string[] = [];
  parts.push(
    `<rect x="${r(x + inset)}" y="${r(y + inset)}" width="${r(w - inset * 2)}" height="${r(h - inset * 2)}" rx="${rad}" fill="${o.fill ?? C.panel}" stroke="${stroke}" stroke-opacity=".55" stroke-width="1.5"/>`,
  );
  // Inner hairline gives the border a lit edge without a filter.
  parts.push(
    `<rect x="${r(x + inset + 3)}" y="${r(y + inset + 3)}" width="${r(w - inset * 2 - 6)}" height="${r(h - inset * 2 - 6)}" rx="${rad - 3}" fill="none" stroke="${C.cyan}" stroke-opacity=".07"/>`,
  );
  // Corner ticks.
  const c = 7;
  const tick = (px: number, py: number, dx: number, dy: number) =>
    `M${r(px)} ${r(py + dy * t)}V${r(py)}H${r(px + dx * t)}`;
  parts.push(
    `<path d="${[
      tick(x + c, y + c, 1, 1),
      tick(x + w - c, y + c, -1, 1),
      tick(x + c, y + h - c, 1, -1),
      tick(x + w - c, y + h - c, -1, -1),
    ].join('')}" fill="none" stroke="${o.accent === 'orange' ? C.orange : C.cyan}" stroke-width="2" stroke-linecap="square"/>`,
  );
  if (o.label) {
    parts.push(doc.text(o.label, x + 28, y + 40, { font: 'mono', size: 18, fill: C.dim, tracking: 1.5, cls: 'deco' }));
  }
  if (o.status) {
    const s = o.status;
    const col = s.tone === 'orange' ? C.orange : s.tone === 'dim' ? C.dim : C.cyan;
    const size = o.chipSize ?? 18;
    const k = size / 18;
    const tw = doc.atlas.measure(s.text, 'mono', size, 1.5);
    const iconW = s.icon ? 22 * k : 0;
    const ph = 30 * k;
    const pw = tw + iconW + 24 * k;
    const px = x + w - 24 - pw;
    const py = y + 20;
    parts.push(
      `<rect x="${r(px)}" y="${py}" width="${r(pw)}" height="${r(ph)}" rx="${r(ph / 2)}" fill="${col}" fill-opacity=".08" stroke="${col}" stroke-opacity=".6"/>`,
    );
    if (s.icon) {
      parts.push(doc.text(s.icon, px + 10 * k, py + 22 * k, { font: 'display', size, fill: col, cls: s.icon === '●' ? 'pulse' : undefined }));
    }
    parts.push(doc.text(s.text, px + 12 * k + iconW, py + 21 * k, { font: 'mono', size, fill: col, tracking: 1.5 }));
  }
  return parts.join('');
}

/** Faint background grid confined to a rect. */
export function backgroundGrid(x: number, y: number, w: number, h: number, step = 40, opacity = 0.06): string {
  const d: string[] = [];
  for (let gx = x + step; gx < x + w; gx += step) d.push(`M${r(gx)} ${y}V${y + h}`);
  for (let gy = y + step; gy < y + h; gy += step) d.push(`M${x} ${r(gy)}H${x + w}`);
  return `<path d="${d.join('')}" stroke="${C.cyan}" stroke-opacity="${opacity}" stroke-width="1" fill="none"/>`;
}
