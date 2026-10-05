/**
 * Logo access in one treatment: monochrome cyan from Simple Icons (CC0), or a clean text chip
 * when Simple Icons has no mark for the brand (AWS, Azure OpenAI, DynamoDB, DeepLearning.AI...).
 */
import * as si from 'simple-icons';
import { C } from '../tokens/tokens.ts';
import { r, type SvgDoc } from '../svg/doc.ts';

interface SimpleIcon {
  slug: string;
  title: string;
  path: string;
}

const bySlug = new Map<string, SimpleIcon>(
  (Object.values(si) as unknown[])
    .filter((x): x is SimpleIcon => typeof x === 'object' && x !== null && 'slug' in x && 'path' in x)
    .map((i) => [i.slug, i]),
);

export function getIcon(slug: string): SimpleIcon {
  const icon = bySlug.get(slug);
  if (!icon) throw new Error(`Simple Icons has no "${slug}"`);
  return icon;
}

export function hasIcon(slug: string): boolean {
  return bySlug.has(slug);
}

/** Draw a Simple Icons mark (24×24 source) centred on (cx, cy) at `size`. */
export function iconAt(slug: string, cx: number, cy: number, size: number, fill: string = C.cyan): string {
  const s = size / 24;
  return `<path transform="translate(${r(cx - size / 2)} ${r(cy - size / 2)}) scale(${+s.toFixed(4)})" fill="${fill}" d="${getIcon(slug).path}"/>`;
}

/** Monochrome text chip for brands without a CC0 mark. */
export function chipAt(doc: SvgDoc, text: string, cx: number, cy: number, size: number, color: string = C.cyan): string {
  const fontSize = text.length <= 2 ? size * 0.62 : text.length === 3 ? size * 0.5 : size * 0.42;
  const w = size * 1.1;
  const h = size * 0.82;
  return [
    `<rect x="${r(cx - w / 2)}" y="${r(cy - h / 2)}" width="${r(w)}" height="${r(h)}" rx="${r(size * 0.16)}" fill="none" stroke="${color}" stroke-width="1.6"/>`,
    doc.text(text, cx, cy + fontSize * 0.36, { font: 'displayBold', size: fontSize, fill: color, anchor: 'middle', cls: 'deco' }),
  ].join('');
}
