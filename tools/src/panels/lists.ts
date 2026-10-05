/**
 * Static information panels: the stack grid, credentials and earlier work. None of them move.
 * Restraint rule: if an effect does not help, it is not here. (Section breaks are the 3D GIF
 * rendered by tools/render3d/divider.ts.)
 */
import { C } from '../tokens/tokens.ts';
import { SvgDoc, r } from '../svg/doc.ts';
import { chrome } from '../svg/chrome.ts';
import { isoTile } from '../svg/grid.ts';
import { chipAt, iconAt } from '../logos/icons.ts';
import { formatYm, type Profile } from '../lib/content.ts';
import type { PanelOutput } from './types.ts';

const W = 800;

/** The Grid: six groups in a 3×2 layout, each item an isometric tile with its label. */
export function stack(p: Profile): PanelOutput {
  const cols = 3;
  const padX = 22;
  const colW = (W - padX * 2) / cols;
  const itemH = 46;
  const headerH = 50;
  const groupsPerRow = Math.ceil(p.stack.length / cols);
  const rowsInBlock = (gi: number) => p.stack[gi]!.items.length;
  const blockH: number[] = [];
  for (let row = 0; row < groupsPerRow; row++) {
    const idx = [0, 1, 2].map((c) => row * cols + c).filter((i) => i < p.stack.length);
    blockH.push(headerH + Math.max(...idx.map(rowsInBlock)) * itemH + 16);
  }
  const top = 66;
  const H = top + blockH.reduce((a, b) => a + b, 0) + 12;
  const doc = new SvgDoc({
    width: W, height: H, title: 'The Grid: the stack',
    desc: p.stack.map((g) => `${g.group}: ${g.items.map((i) => i.name).join(', ')}`).join('. '),
  });
  doc.add(chrome(doc, { w: W, h: H, label: '// THE GRID · BRIGHT TILES ARE DAILY DRIVERS' }));
  let y = top;
  for (let row = 0; row < groupsPerRow; row++) {
    for (let c = 0; c < cols; c++) {
      const gi = row * cols + c;
      const g = p.stack[gi];
      if (!g) continue;
      const x = padX + c * colW;
      doc.add(doc.text(g.group.toUpperCase(), x + 12, y + 30, { font: 'mono', size: 18, fill: C.dim, tracking: 1.5, cls: 'deco' }));
      doc.add(`<path d="M${r(x + 12)} ${y + 42}H${r(x + colW - 14)}" stroke="${C.cyanMid}" stroke-opacity=".25"/>`);
      g.items.forEach((it, i) => {
        const cy = y + headerH + 18 + i * itemH;
        const tx = x + 36;
        const accent = !!it.headline;
        doc.add(isoTile(tx, cy - 4, 46, 7, accent));
        const iconCol = accent ? C.cyan : C.cyanMid;
        doc.add(it.icon ? iconAt(it.icon, tx, cy - 5, 17, iconCol) : chipAt(doc, it.chip ?? it.name.slice(0, 3), tx, cy - 5, 20, iconCol));
        const labelSize = 24;
        const maxW = colW - 76;
        const fit = Math.min(labelSize, (maxW / doc.atlas.measure(it.name, 'display', labelSize)) * labelSize);
        doc.add(doc.text(it.name, x + 66, cy + 4, { font: accent ? 'displayBold' : 'display', size: +fit.toFixed(1), fill: accent ? C.white : C.dim }));
      });
    }
    y += blockH[row]!;
  }
  return { file: 'panels/stack.svg', svg: doc.render(), budgetKB: 100, displayWidth: 800 };
}

/** Credentials: grouped course certificates and badges. Never worded as "certified". */
export function credentials(p: Profile): PanelOutput {
  const groups: Array<'Agents & LLMs' | 'Data' | 'Cloud'> = ['Agents & LLMs', 'Data', 'Cloud'];
  const shown = p.certifications.filter((c) => c.priority !== 'low');
  const rowH = 42;
  const top = 70;
  let H = top;
  for (const g of groups) H += 44 + shown.filter((c) => c.group === g).length * rowH + 8;
  H += 14;
  const doc = new SvgDoc({
    width: W, height: H, title: 'Credentials: courses and badges',
    desc: shown.map((c) => `${c.issuer}: ${c.title} (${formatYm(c.issued)})`).join('; '),
  });
  doc.add(chrome(doc, { w: W, h: H, label: '// CREDENTIALS · COURSES AND BADGES' }));
  let y = top;
  for (const g of groups) {
    const items = shown.filter((c) => c.group === g).sort((a, b) => b.issued.localeCompare(a.issued));
    doc.add(doc.text(g.toUpperCase(), 34, y + 26, { font: 'mono', size: 18, fill: C.cyan, tracking: 1.5, cls: 'deco' }));
    doc.add(`<path d="M34 ${y + 38}H${W - 34}" stroke="${C.cyanMid}" stroke-opacity=".25"/>`);
    y += 44;
    for (const c of items) {
      const cy = y + rowH / 2 + 4;
      doc.add(c.icon ? iconAt(c.icon, 52, cy - 8, 22, C.cyanMid) : chipAt(doc, c.chip ?? c.issuer.slice(0, 3), 52, cy - 8, 26, C.cyanMid));
      const dateW = doc.atlas.measure('Mmm 0000', 'mono', 24);
      const maxW = W - 90 - 40 - dateW - 34;
      const fit = Math.min(24, (maxW / doc.atlas.measure(c.short, 'display', 24)) * 24);
      doc.add(doc.text(c.short, 90, cy, { font: 'display', size: +fit.toFixed(1), fill: C.white }));
      doc.add(doc.text(formatYm(c.issued), W - 34, cy, { font: 'mono', size: 24, fill: C.dim, anchor: 'end' }));
      y += rowH;
    }
    y += 8;
  }
  return { file: 'panels/credentials.svg', svg: doc.render(), budgetKB: 60, displayWidth: 800 };
}

/** Earlier work: research and coursework, described only as far as the code supports. */
export function earlierWork(p: Profile): PanelOutput {
  const padX = 34;
  const blocks = p.earlierWork.map((e) => {
    const probe = new SvgDoc({ width: W, height: 1, title: '' });
    return { e, lines: probe.atlas.wrap(e.what, W - padX * 2, 'mono', 24) };
  });
  const top = 70;
  const H = top + blocks.reduce((a, b) => a + 36 + b.lines.length * 32 + 40, 0) + 4;
  const doc = new SvgDoc({
    width: W, height: H, title: 'Earlier work: mostly research and coursework',
    desc: p.earlierWork.map((e) => `${e.name}: ${e.what}`).join(' '),
  });
  doc.add(chrome(doc, { w: W, h: H, label: '// EARLIER WORK · MOSTLY RESEARCH AND COURSEWORK' }));
  let y = top;
  blocks.forEach(({ e, lines }, i) => {
    if (i > 0) doc.add(`<path d="M${padX} ${y - 14}H${W - padX}" stroke="${C.cyanMid}" stroke-opacity=".2"/>`);
    doc.add(doc.text(e.name, padX, y + 22, { font: 'displayBold', size: 26, fill: C.white }));
    lines.forEach((l, j) => doc.add(doc.text(l, padX, y + 58 + j * 32, { font: 'mono', size: 24, fill: C.white, opacity: 0.85 })));
    doc.add(doc.text(e.tags, padX, y + 58 + lines.length * 32, { font: 'mono', size: 24, fill: C.dim }));
    y += 36 + lines.length * 32 + 40;
  });
  return { file: 'panels/earlier-work.svg', svg: doc.render(), budgetKB: 50, displayWidth: 800 };
}
