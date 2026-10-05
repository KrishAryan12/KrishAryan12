/**
 * The first screen after the hero: boot strip, the two lanes, the impact readouts and the
 * career timeline. Calmer than the hero by design: one moving thing per panel.
 */
import { C } from '../tokens/tokens.ts';
import { SvgDoc, r } from '../svg/doc.ts';
import { chrome, backgroundGrid } from '../svg/chrome.ts';
import { fill, formatYm, type Derived, type Profile } from '../lib/content.ts';
import type { PanelOutput } from './types.ts';

const W = 800;

/** Terminal strip: lines type in one after another, hold, then reset. 12 s loop. */
export function boot(p: Profile): PanelOutput {
  const size = 24;
  const lineH = 38;
  const padX = 36;
  const top = 92;
  // Lay out: command column, then output if it fits, otherwise on its own line.
  const cmdCol = Math.max(...p.boot.map((b) => b.cmd.length)) + 2;
  const doc0 = new SvgDoc({ width: W, height: 10, title: '' });
  const charW = doc0.atlas.measure('M', 'mono', size);
  const outX = padX + (cmdCol + 1) * charW;
  type Row = { cmd?: string; out?: string; outX: number };
  const rows: Row[] = [];
  for (const b of p.boot) {
    const fits = outX + doc0.atlas.measure(b.out, 'mono', size) <= W - padX;
    if (fits) rows.push({ cmd: b.cmd, out: b.out, outX });
    else {
      rows.push({ cmd: b.cmd, outX });
      rows.push({ out: b.out, outX: padX + 2 * charW });
    }
  }
  const H = top + rows.length * lineH + 28;
  const loop = 12;
  const css: string[] = [];
  rows.forEach((_, i) => {
    const on = ((0.6 + i * 0.9) / loop) * 100;
    css.push(`.l${i}{animation:l${i} ${loop}s linear infinite}@keyframes l${i}{0%,${r(on)}%{opacity:0}${r(on + 1.5)}%,92%{opacity:1}97%,100%{opacity:0}}`);
  });
  css.push(`.cur{animation:cur 1s steps(1) infinite}@keyframes cur{50%{opacity:0}}`);
  // Begin in the hold phase so the strip is never seen empty.
  css.push(`[class^=l]{animation-delay:-${r(0.6 + rows.length * 0.9 + 1)}s}`);
  const doc = new SvgDoc({
    width: W,
    height: H,
    title: 'Terminal boot sequence',
    desc: p.boot.map((b) => `> ${b.cmd}: ${b.out}`).join(' '),
    css: css.join(''),
    still: rows.map((_, i) => `.l${i}`).join(',') + '{opacity:1}',
  });
  doc.add(chrome(doc, { w: W, h: H, fill: C.void }));
  // Title bar.
  doc.add(`<path d="M2 56H${W - 2}" stroke="${C.cyanMid}" stroke-opacity=".3"/>`);
  doc.add(
    [0, 1, 2].map((i) => `<rect x="${28 + i * 22}" y="23" width="12" height="12" rx="2" fill="none" stroke="${i === 0 ? C.cyan : C.dim}" stroke-opacity="${i === 0 ? 0.9 : 0.5}"/>`).join(''),
  );
  doc.add(doc.text('krish@grid: ~', W / 2, 37, { font: 'mono', size: 18, fill: C.dim, anchor: 'middle', cls: 'deco' }));
  rows.forEach((row, i) => {
    const y = top + i * lineH;
    const parts: string[] = [];
    if (row.cmd !== undefined) {
      parts.push(doc.text('>', padX, y, { font: 'mono', size, fill: C.cyan }));
      parts.push(doc.text(row.cmd, padX + 2 * charW, y, { font: 'mono', size, fill: C.cyan }));
    }
    if (row.out !== undefined) parts.push(doc.text(row.out, row.outX, y, { font: 'mono', size, fill: C.white }));
    doc.add(`<g class="l${i}">${parts.join('')}</g>`);
  });
  const lastY = top + (rows.length - 1) * lineH;
  doc.add(`<rect class="cur" x="${r(padX)}" y="${r(lastY + 14)}" width="${r(charW)}" height="4" fill="${C.cyan}" opacity=".8"/>`);
  return { file: 'panels/boot.svg', svg: doc.render(), budgetKB: 60, displayWidth: 800 };
}

/** The two lanes: "Hire the engineer" and "Hire the builder". 400-unit cards that stack on phones. */
export function lanes(): PanelOutput[] {
  const w = 400;
  const h = 280;
  const lane = (o: {
    file: string; n: string; title: string; sub: string; bullets: string[]; cta: string; motif: 'trace' | 'frame';
  }): PanelOutput => {
    const css =
      o.motif === 'trace'
        ? `.mv{stroke-dasharray:60 400;animation:mv 10s linear infinite}@keyframes mv{from{stroke-dashoffset:460}to{stroke-dashoffset:0}}`
        : `.mv{animation:mv 10s ease-in-out infinite;transform-origin:330px 120px}@keyframes mv{0%,100%{opacity:.35}50%{opacity:.9}}`;
    const doc = new SvgDoc({
      width: w, height: h, title: `${o.title}: ${o.sub}`, desc: o.bullets.join('. '), css, still: '.mv{stroke-dashoffset:0;opacity:.7}', glows: ['cyan'],
    });
    doc.add(chrome(doc, { w, h, label: o.n }));
    doc.add(backgroundGrid(2, 2, w - 4, h - 4, 25, 0.035));
    if (o.motif === 'trace') {
      // A request trace through three services.
      const d = 'M258 142L292 116L326 128L366 106';
      doc.add(`<path d="${d}" fill="none" stroke="${C.cyanDeep}" stroke-width="2"/>`);
      doc.add(`<path class="mv" d="${d}" fill="none" stroke="${C.cyan}" stroke-width="2.5" filter="url(#gc)"/>`);
      doc.add([[258, 142], [292, 116], [326, 128], [366, 106]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="4" fill="${C.panel}" stroke="${C.cyan}" stroke-width="1.5"/>`).join(''));
    } else {
      // A browser frame, being laid out.
      doc.add(`<g class="mv"><rect x="300" y="104" width="70" height="44" rx="4" fill="none" stroke="${C.cyan}" stroke-width="1.5"/><path d="M300 113H370M308 123H336M308 131H352M308 139H326" stroke="${C.cyan}" stroke-width="1.3"/><rect x="342" y="128" width="20" height="13" rx="2" fill="${C.cyan}" fill-opacity=".25" stroke="${C.cyan}"/></g>`);
    }
    doc.add(doc.text(o.title, 28, 94, { font: 'displayBold', size: 32, fill: C.white }));
    doc.add(doc.text(o.sub, 28, 124, { font: 'mono', size: 15, fill: C.cyan }));
    o.bullets.forEach((b, i) => {
      doc.add(doc.text('▸', 28, 168 + i * 26, { font: 'mono', size: 15, fill: C.cyanMid }));
      doc.add(doc.text(b, 48, 168 + i * 26, { font: 'mono', size: 15, fill: C.white }));
    });
    // CTA bar.
    doc.add(`<path d="M28 ${h - 44}H${w - 28}" stroke="${C.cyanMid}" stroke-opacity=".3"/>`);
    doc.add(doc.text(o.cta, 28, h - 17, { font: 'display', size: 17, fill: C.cyan, tracking: 1 }));
    doc.add(doc.text('→', w - 28, h - 17, { font: 'display', size: 18, fill: C.cyan, anchor: 'end' }));
    return { file: o.file, svg: doc.render(), budgetKB: 30, displayWidth: 400 };
  };
  return [
    lane({
      file: 'panels/lane-engineer.svg', n: '// LANE 01', title: 'Hire the engineer', sub: 'AI agents × SRE',
      bullets: ['Agents that investigate incidents', 'On call for 215+ services', 'Shipped to prod, not staging'],
      cta: 'SEE THE INVESTIGATION', motif: 'trace',
    }),
    lane({
      file: 'panels/lane-builder.svg', n: '// LANE 02', title: 'Hire the builder', sub: 'Web design + development',
      bullets: ['Sites with a point of view', 'Fast, accessible, no templates', 'Public proof, live today'],
      cta: 'SEE THE WEBSITES', motif: 'frame',
    }),
  ];
}

/** Impact strip: five readouts with a one-time quiet reveal (no count-up). */
export function impact(p: Profile): PanelOutput {
  const H = 258;
  const n = p.impact.length;
  const padX = 24;
  const colW = (W - padX * 2) / n;
  const css = p.impact
    .map((_, i) => `.r${i}{animation:rv 1.2s ease-out ${r(0.3 + i * 0.35)}s 1 both}`)
    .join('') + `@keyframes rv{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}`;
  const doc = new SvgDoc({
    width: W, height: H, title: 'Impact',
    desc: p.impact.map((i) => `${i.value} ${i.label} (${i.detail})`).join('; '),
    css, still: p.impact.map((_, i) => `.r${i}`).join(',') + '{opacity:1;transform:none}',
  });
  doc.add(chrome(doc, { w: W, h: H, label: '// IMPACT · FROM THE RESUME, NOT THE IMAGINATION' }));
  p.impact.forEach((m, i) => {
    const cx = padX + colW * i + colW / 2;
    const g: string[] = [];
    if (i > 0) g.push(`<path d="M${r(padX + colW * i)} 82V${H - 34}" stroke="${C.cyanMid}" stroke-opacity=".2"/>`);
    g.push(doc.text(m.value, cx, 128, { font: 'displayBold', size: 50, fill: C.cyan, anchor: 'middle' }));
    const label = doc.atlas.wrap(m.label, colW - 16, 'display', 24);
    label.forEach((l, j) => g.push(doc.text(l, cx, 170 + j * 28, { font: 'display', size: 24, fill: C.white, anchor: 'middle' })));
    const detailY = 170 + label.length * 28 + 6;
    // Detail is secondary (it is repeated in the text equivalent), so it shrinks to fit its column.
    const sz = Math.min(22, ((colW - 14) / doc.atlas.measure(m.detail, 'mono', 22)) * 22);
    g.push(doc.text(m.detail, cx, Math.max(detailY, 230), { font: 'mono', size: +sz.toFixed(1), fill: C.dim, anchor: 'middle', cls: 'deco' }));
    doc.add(`<g class="r${i}">${g.join('')}</g>`);
  });
  return { file: 'panels/impact.svg', svg: doc.render(), budgetKB: 40, displayWidth: 800 };
}

/** Career timeline. Climb speed and tenure are computed at build time. */
export function timeline(p: Profile, d: Derived): PanelOutput {
  const roles = p.experience.filter((e) => e.show).sort((a, b) => a.start.localeCompare(b.start));
  const H = 340;
  const lineY = 160;
  const x0 = 70;
  const x1 = W - 70;
  const step = (x1 - x0) / (roles.length - 1);
  const css = `.pl{stroke-dasharray:90 2000;animation:pl 10s linear infinite}@keyframes pl{from{stroke-dashoffset:${r(x1 - x0 + 90)}}to{stroke-dashoffset:-20}}`;
  const headline = fill(`Intern → Software Engineer in {{climbMonths}} months`, d);
  const doc = new SvgDoc({
    width: W, height: H, title: 'Career timeline',
    desc: `${headline}. ` + roles.map((e) => `${formatYm(e.start)}: ${e.title}, ${e.employer}. ${e.built}.`).join(' ') + ` ${d.tenure} at Netradyne so far.`,
    css, still: '.pl{opacity:0}', glows: ['cyan'],
  });
  doc.add(chrome(doc, { w: W, h: H }));
  doc.add(doc.text(headline, 32, 58, { font: 'displayBold', size: 28, fill: C.white }));
  doc.add(doc.text(`${d.tenure} at Netradyne and counting`, 32, 92, { font: 'mono', size: 24, fill: C.dim }));
  doc.add(`<path d="M${x0} ${lineY}H${x1}" stroke="${C.cyanDeep}" stroke-width="3"/>`);
  doc.add(`<path class="pl" d="M${x0} ${lineY}H${x1}" stroke="${C.cyan}" stroke-width="3" filter="url(#gc)"/>`);
  roles.forEach((e, i) => {
    const cx = x0 + step * i;
    const current = e.end === null;
    const anchor = i === 0 ? 'start' : i === roles.length - 1 ? 'end' : 'middle';
    const tx = i === 0 ? x0 - 38 : i === roles.length - 1 ? x1 + 38 : cx;
    doc.add(`<circle cx="${r(cx)}" cy="${lineY}" r="${current ? 11 : 8}" fill="${current ? C.cyan : C.panel}" stroke="${C.cyan}" stroke-width="2.5"/>`);
    doc.add(doc.text(formatYm(e.start), tx, lineY - 26, { font: 'mono', size: 24, fill: C.dim, anchor }));
    const title = e.title.includes(' - ') ? e.title.split(' - ') : doc.atlas.wrap(e.title, 240, 'displayBold', 26);
    title.forEach((l, j) => doc.add(doc.text(l, tx, lineY + 50 + j * 30, { font: 'displayBold', size: 26, fill: current ? C.cyan : C.white, anchor })));
    const by = lineY + 50 + title.length * 30 + 4;
    doc.atlas.wrap(e.built, 240, 'mono', 24).forEach((l, j) => doc.add(doc.text(l, tx, by + j * 28, { font: 'mono', size: 24, fill: C.dim, anchor })));
  });
  return { file: 'panels/timeline.svg', svg: doc.render(), budgetKB: 40, displayWidth: 800 };
}
