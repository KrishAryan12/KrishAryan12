/**
 * Renders every panel from content/profile.json and the tokens into assets/.
 * Run: pnpm build:panels
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { ASSETS } from '../lib/paths.ts';
import { derive, loadProfile } from '../lib/content.ts';
import type { PanelOutput } from './types.ts';
import { boot, impact, lanes, timeline } from './intro.ts';
import { investigation } from './investigation.ts';
import { buttons, paperCards, systemCards, websiteCards } from './cards.ts';
import { credentials, earlierWork, stack } from './lists.ts';

export function buildAllPanels(): PanelOutput[] {
  const p = loadProfile();
  const d = derive(p);
  return [
    boot(p),
    ...lanes(),
    impact(p),
    timeline(p, d),
    investigation(p, d),
    ...systemCards(p),
    stack(p),
    ...websiteCards(p),
    ...paperCards(p),
    earlierWork(p),
    credentials(p),
    ...buttons(),
  ];
}

if (process.argv[1]?.replace(/\\/g, '/').endsWith('panels/build.ts')) {
  const panels = buildAllPanels();
  for (const panel of panels) {
    const out = join(ASSETS, panel.file);
    mkdirSync(dirname(out), { recursive: true });
    writeFileSync(out, panel.svg);
    const kb = Buffer.byteLength(panel.svg) / 1024;
    const flag = kb > panel.budgetKB ? '  OVER BUDGET' : '';
    console.log(`${panel.file.padEnd(36)} ${kb.toFixed(1).padStart(6)} KB / ${panel.budgetKB} KB${flag}`);
  }
}
