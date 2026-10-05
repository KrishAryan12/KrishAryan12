/**
 * 400-unit cards (systems, websites, papers) and the button images used for links.
 * Each card is its own <img> inside an <a>, so every card is clickable and cards wrap
 * two-up on desktop and stack on phones.
 */
import { C } from '../tokens/tokens.ts';
import { SvgDoc, r } from '../svg/doc.ts';
import { chrome, backgroundGrid } from '../svg/chrome.ts';
import type { Card, Profile } from '../lib/content.ts';
import type { PanelOutput } from './types.ts';

const CW = 400;
const CH = 300;

export function slug(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

interface CardOpts {
  file: string;
  card: Card;
  status: { text: string; tone: 'cyan' | 'orange' | 'dim'; icon?: '●' | '🔒' };
  label: string;
  cta?: string;
}

function card(o: CardOpts): PanelOutput {
  const { card: c } = o;
  const live = o.status.icon === '●';
  const doc = new SvgDoc({
    width: CW, height: CH,
    title: `${c.name}: ${c.kicker}`,
    desc: `${o.status.text}. ${c.body}${c.stat ? ` ${c.stat}.` : ''}`,
    css: live ? `.pulse{animation:pu 3s ease-in-out infinite}@keyframes pu{0%,100%{opacity:1}50%{opacity:.35}}` : '',
    still: '.pulse{opacity:1}',
  });
  doc.add(chrome(doc, { w: CW, h: CH, label: o.label, status: o.status }));
  doc.add(backgroundGrid(2, 2, CW - 4, CH - 4, 25, 0.03));
  doc.add(doc.text(c.name, 28, 98, { font: 'displayBold', size: c.name.length > 16 ? 28 : 32, fill: C.white }));
  doc.add(doc.text(c.kicker, 28, 126, { font: 'mono', size: 15, fill: C.cyan }));
  const lines = doc.atlas.wrap(c.body, CW - 56, 'mono', 14.5).slice(0, 5);
  lines.forEach((l, i) => doc.add(doc.text(l, 28, 158 + i * 21, { font: 'mono', size: 14.5, fill: C.white, opacity: 0.88 })));
  doc.add(`<path d="M28 ${CH - 46}H${CW - 28}" stroke="${C.cyanMid}" stroke-opacity=".3"/>`);
  if (c.stat) doc.add(doc.text(c.stat, 28, CH - 20, { font: 'display', size: 17, fill: C.cyan, tracking: 0.5 }));
  if (o.cta) doc.add(doc.text(o.cta, CW - 28, CH - 20, { font: 'display', size: 17, fill: C.cyan, anchor: 'end' }));
  return { file: o.file, svg: doc.render(), budgetKB: 30, displayWidth: 400 };
}

export function systemCards(p: Profile): PanelOutput[] {
  return [
    ...p.systems.private.map((c) =>
      card({ file: `panels/system-${slug(c.name)}.svg`, card: c, label: '// PRODUCTION', status: { text: 'PRIVATE', tone: 'dim', icon: '🔒' }, cta: 'case study →' }),
    ),
    ...p.systems.public.map((c) =>
      card({ file: `panels/system-${slug(c.name)}.svg`, card: c, label: '// PUBLIC', status: { text: 'LIVE', tone: 'cyan', icon: '●' }, cta: 'open →' }),
    ),
  ];
}

export function websiteCards(p: Profile): PanelOutput[] {
  return p.freelance.projects.map((c) =>
    card({ file: `panels/web-${slug(c.name)}.svg`, card: c, label: '// WEBSITE', status: { text: 'LIVE', tone: 'cyan', icon: '●' }, cta: 'visit →' }),
  );
}

export function paperCards(p: Profile): PanelOutput[] {
  return p.publications.map((pub) => {
    const PH = 270;
    const doc = new SvgDoc({ width: CW, height: PH, title: `Paper: ${pub.title}`, desc: `${pub.venue}, ${pub.indexing}.` });
    doc.add(chrome(doc, { w: CW, h: PH, label: '// PAPER', status: { text: pub.indexing.toUpperCase(), tone: 'cyan' } }));
    const lines = doc.atlas.wrap(pub.title, CW - 56, 'displayBold', 24);
    lines.forEach((l, i) => doc.add(doc.text(l, 28, 100 + i * 30, { font: 'displayBold', size: 24, fill: C.white })));
    const vy = 100 + lines.length * 30 + 8;
    doc.atlas.wrap(pub.venue, CW - 56, 'mono', 14.5).forEach((l, i) => doc.add(doc.text(l, 28, vy + i * 21, { font: 'mono', size: 14.5, fill: C.dim })));
    doc.add(`<path d="M28 ${PH - 46}H${CW - 28}" stroke="${C.cyanMid}" stroke-opacity=".3"/>`);
    doc.add(doc.text('read the paper →', 28, PH - 20, { font: 'display', size: 17, fill: C.cyan }));
    return { file: `panels/paper-${slug(pub.indexing)}.svg`, svg: doc.render(), budgetKB: 25, displayWidth: 400 };
  });
}

/** Button-style link image. `primary` gets the filled treatment. */
export function button(file: string, text: string, sub: string | null, primary = false, width = 260): PanelOutput {
  const h = 64;
  const doc = new SvgDoc({ width, height: h, title: sub ? `${text}: ${sub}` : text });
  doc.add(
    `<rect x="1.5" y="1.5" width="${width - 3}" height="${h - 3}" rx="10" fill="${primary ? C.cyan : C.panel}" fill-opacity="${primary ? 0.14 : 1}" stroke="${C.cyan}" stroke-opacity="${primary ? 1 : 0.6}" stroke-width="1.5"/>`,
  );
  if (primary) doc.add(`<rect x="1.5" y="1.5" width="${width - 3}" height="${h - 3}" rx="10" fill="${C.panel}" fill-opacity=".75"/>`);
  const ty = sub ? 30 : 40;
  doc.add(doc.text(text, width / 2, ty, { font: 'displayBold', size: 20, fill: primary ? C.cyan : C.white, anchor: 'middle', tracking: 0.5 }));
  if (sub) doc.add(doc.text(sub, width / 2, 50, { font: 'mono', size: 13, fill: C.dim, anchor: 'middle' }));
  return { file, svg: doc.render(), budgetKB: 12, displayWidth: width };
}

export function buttons(): PanelOutput[] {
  return [
    button('panels/btn-conversation.svg', 'Start a conversation →', 'krisharyan.vercel.app/contact', true, 400),
    button('panels/btn-portfolio.svg', 'Portfolio', 'krisharyan.vercel.app'),
    button('panels/btn-linkedin.svg', 'LinkedIn', 'in/krisharyan'),
    button('panels/btn-resume-ai.svg', 'Résumé · AI Engineer', 'PDF'),
    button('panels/btn-resume-sre.svg', 'Résumé · SRE', 'PDF'),
    button('panels/btn-hire.svg', 'Hire me – free', 'terms apply. none, actually.', true),
  ];
}

export { r };
