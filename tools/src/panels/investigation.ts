/**
 * The investigation: a ReAct trace whose subject is "Who is Krish Aryan?".
 * A parody of TraceLens output using only resume-level facts and synthetic tool names.
 *
 * Story in one 16 s loop: the status chip starts orange (INVESTIGATING), the trace prints line by
 * line, the hypothesis bars fill, and the chip turns cyan (RESOLVED). Orange is used only for the
 * unresolved state, as the palette rules require.
 */
import { C } from '../tokens/tokens.ts';
import { SvgDoc, r } from '../svg/doc.ts';
import { chrome } from '../svg/chrome.ts';
import { fill, type Derived, type Profile } from '../lib/content.ts';
import type { PanelOutput } from './types.ts';

const W = 800;
const LOOP = 16;

const TAGS: Record<'think' | 'call' | 'obs', { tag: string; color: string }> = {
  think: { tag: 'THINK', color: C.dim },
  call: { tag: 'CALL', color: C.cyanMid },
  obs: { tag: 'OBS', color: C.cyan },
};

export function investigation(p: Profile, d: Derived): PanelOutput {
  const inv = p.investigation;
  const size = 24;
  const lineH = 36;
  const padX = 34;
  const top = 108;
  const probe = new SvgDoc({ width: W, height: 1, title: '' });
  const charW = probe.atlas.measure('M', 'mono', size);
  const tagCol = padX + 7 * charW;

  type Line = { kind: 'cmd' | 'think' | 'call' | 'obs' | 'gap' | 'hyp' | 'result' | 'foot'; text: string; i?: number };
  const lines: Line[] = [];
  inv.command.forEach((c, i) => lines.push({ kind: 'cmd', text: c, i }));
  lines.push({ kind: 'gap', text: '' });
  for (const s of inv.steps) lines.push({ kind: s.kind, text: fill(s.text, d) });
  lines.push({ kind: 'gap', text: '' });
  lines.push({ kind: 'result', text: 'RANKED HYPOTHESES' });
  inv.hypotheses.forEach((h, i) => lines.push({ kind: 'hyp', text: h.text, i }));
  lines.push({ kind: 'gap', text: '' });
  lines.push({ kind: 'foot', text: inv.footer });

  const H = top + lines.length * lineH + 6;
  const printEnd = 9.5; // seconds by which every line is printed
  const printable = lines.filter((l) => l.kind !== 'gap').length;
  const css: string[] = [];
  const stillSel: string[] = [];
  let k = 0;
  const body: string[] = [];
  const doc = new SvgDoc({
    width: W, height: H,
    title: 'The investigation: an agent trace answering "Who is Krish Aryan?"',
    desc: lines.filter((l) => l.kind !== 'gap').map((l) => l.text).join(' / '),
    glows: ['orange', 'cyan'],
  });

  lines.forEach((l, idx) => {
    const y = top + idx * lineH;
    if (l.kind === 'gap') return;
    const t = 0.5 + (k / printable) * printEnd;
    const on = (t / LOOP) * 100;
    css.push(`.q${k}{animation:q${k} ${LOOP}s linear infinite}@keyframes q${k}{0%,${r(on)}%{opacity:0}${r(on + 0.8)}%,94%{opacity:1}98%,100%{opacity:0}}`);
    stillSel.push(`.q${k}`);
    const g: string[] = [];
    switch (l.kind) {
      case 'cmd':
        g.push(doc.text(l.i === 0 ? '$' : ' ', padX, y, { font: 'mono', size, fill: C.cyan }));
        g.push(doc.text(l.text, padX + 2 * charW, y, { font: 'mono', size, fill: C.white }));
        break;
      case 'think':
      case 'call':
      case 'obs': {
        const tg = TAGS[l.kind];
        g.push(doc.text(tg.tag, padX, y, { font: 'mono', size, fill: tg.color }));
        g.push(doc.text(l.text, tagCol, y, { font: 'mono', size, fill: l.kind === 'think' ? C.dim : C.white }));
        break;
      }
      case 'result':
        g.push(doc.text(l.text, padX, y, { font: 'monoBold', size, fill: C.cyan, tracking: 1 }));
        break;
      case 'hyp': {
        const h = inv.hypotheses[l.i!]!;
        const label = `H${l.i! + 1}`;
        g.push(doc.text(label, padX, y, { font: 'mono', size, fill: C.dim }));
        g.push(doc.text(h.text, padX + 4 * charW, y, { font: 'mono', size, fill: l.i === 0 ? C.white : C.dim }));
        // Confidence bar + value, right aligned.
        const bx = W - padX - 230;
        const bw = 140;
        g.push(`<rect x="${r(bx)}" y="${r(y - 15)}" width="${bw}" height="14" rx="3" fill="${C.cyanDeep}" fill-opacity=".35"/>`);
        const fillW = Math.max(3, bw * h.confidence);
        const barCls = `b${l.i}`;
        g.push(`<rect class="${barCls}" x="${r(bx)}" y="${r(y - 15)}" width="${r(fillW)}" height="14" rx="3" fill="${l.i === 0 ? C.cyan : C.cyanMid}"/>`);
        const barStart = ((t + 0.3) / LOOP) * 100;
        css.push(`.${barCls}{transform-box:fill-box;transform-origin:left;animation:${barCls} ${LOOP}s ease-out infinite}@keyframes ${barCls}{0%,${r(barStart)}%{transform:scaleX(0)}${r(barStart + 6)}%,100%{transform:scaleX(1)}}`);
        stillSel.push(`.${barCls}`);
        g.push(doc.text(h.confidence.toFixed(2), W - padX, y, { font: 'mono', size, fill: l.i === 0 ? C.cyan : C.dim, anchor: 'end' }));
        break;
      }
      case 'foot':
        g.push(doc.text('✓', padX, y, { font: 'mono', size, fill: C.cyan }));
        g.push(doc.text(l.text, padX + 2 * charW, y, { font: 'mono', size, fill: C.dim }));
        break;
    }
    body.push(`<g class="q${k}">${g.join('')}</g>`);
    k++;
  });

  // Status chip swaps from orange INVESTIGATING to cyan RESOLVED once the trace completes.
  const resolveAt = ((0.5 + printEnd + 0.6) / LOOP) * 100;
  css.push(`.st-a{opacity:0;animation:sta ${LOOP}s steps(1) infinite}@keyframes sta{0%{opacity:1}${r(resolveAt)}%{opacity:0}}`);
  css.push(`.st-b{animation:stb ${LOOP}s steps(1) infinite}@keyframes stb{0%{opacity:0}${r(resolveAt)}%{opacity:1}}`);
  css.push(`.cur{animation:cur 1s steps(1) infinite}@keyframes cur{50%{opacity:0}}`);
  doc.o.css = css.join('');
  doc.o.still = `${stillSel.join(',')}{opacity:1;transform:none}.st-a{opacity:0}.st-b{opacity:1}`;

  doc.add(chrome(doc, { w: W, h: H, fill: C.void }));
  doc.add(`<path d="M2 64H${W - 2}" stroke="${C.cyanMid}" stroke-opacity=".3"/>`);
  doc.add(doc.text('investigation · subject: krish aryan', padX, 44, { font: 'mono', size: 18, fill: C.dim, cls: 'deco' }));
  const chip = (cls: string, text: string, col: string) => {
    const tw = doc.atlas.measure(text, 'mono', size, 1);
    const pw = tw + 48;
    const px = W - padX - pw;
    return `<g class="${cls}"><rect x="${r(px)}" y="16" width="${r(pw)}" height="36" rx="18" fill="${col}" fill-opacity=".1" stroke="${col}"/>${doc.text('●', px + 12, 43, { font: 'display', size: 20, fill: col, cls: 'deco' })}${doc.text(text, px + 36, 42, { font: 'mono', size, fill: col, tracking: 1 })}</g>`;
  };
  doc.add(chip('st-a', 'INVESTIGATING', C.orange));
  doc.add(chip('st-b', 'RESOLVED', C.cyan));
  doc.add(...body);
  return { file: 'panels/investigation.svg', svg: doc.render(), budgetKB: 80, displayWidth: 800 };
}
