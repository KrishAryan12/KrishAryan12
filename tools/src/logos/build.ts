/**
 * Writes every logo the profile uses to assets/logos/ in the single house treatment
 * (monochrome cyan on transparent), and a manifest recording the source of each mark.
 * Brands without a Simple Icons mark are rendered as text chips inside the panels and listed here.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { LOGOS_DIR } from '../lib/paths.ts';
import { loadProfile } from '../lib/content.ts';
import { C } from '../tokens/tokens.ts';
import { getIcon } from './icons.ts';

const p = loadProfile();
mkdirSync(LOGOS_DIR, { recursive: true });

const used = new Map<string, string>(); // slug -> where used
const chips = new Map<string, string>(); // chip text -> brand
for (const g of p.stack) for (const it of g.items) {
  if (it.icon) used.set(it.icon, `stack: ${it.name}`);
  else chips.set(it.chip ?? it.name, it.note ?? it.name);
}
for (const c of p.certifications) {
  if (c.icon) used.set(c.icon, `credentials: ${c.issuer}`);
  else chips.set(c.chip ?? c.issuer, c.issuer);
}

const manifest: Array<{ file: string | null; brand: string; source: string; usedIn: string }> = [];
for (const [slug, where] of [...used].sort()) {
  const icon = getIcon(slug);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" role="img" aria-label="${icon.title}"><title>${icon.title}</title><path fill="${C.cyan}" d="${icon.path}"/></svg>`;
  writeFileSync(join(LOGOS_DIR, `${slug}.svg`), svg);
  manifest.push({ file: `assets/logos/${slug}.svg`, brand: icon.title, source: 'Simple Icons (CC0 1.0)', usedIn: where });
}
for (const [chip, brand] of [...chips].sort()) {
  manifest.push({ file: null, brand, source: `Text chip "${chip}" (no CC0 mark available; not a logo)`, usedIn: 'panels' });
}
writeFileSync(join(LOGOS_DIR, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
console.log(`${used.size} logos, ${chips.size} text chips → assets/logos/`);
