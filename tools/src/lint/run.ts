/**
 * Quality gates (section 12 of the brief). Run with `pnpm check` locally and in CI.
 *
 *   privacy   no email addresses, phone-like numbers or anything listed as never-publish
 *   claims    every significant number on the README appears in docs/CLAIMS.md; claim ids resolve
 *   svg       well-formed, self-contained, no scripts or remote refs, motion within the rules
 *   text      text that matters is at least 11px on a 375px phone
 *   size      per-file budgets, hero, README source, total first-load weight
 *   a11y      alt text, text equivalents for information panels, token contrast
 *
 * Exit code 1 on any failure. Network link checking lives in links.ts.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { XMLValidator } from 'fast-xml-parser';
import { ASSETS, INPUTS, ROOT } from '../lib/paths.ts';
import { loadProfile } from '../lib/content.ts';
import { buildAllPanels } from '../panels/build.ts';
import { minUnits } from '../panels/types.ts';
import { tokens } from '../tokens/tokens.ts';

type Issue = { check: string; file: string; msg: string };
const issues: Issue[] = [];
const fail = (check: string, file: string, msg: string) => issues.push({ check, file, msg });

const readme = readFileSync(join(ROOT, 'README.md'), 'utf8');
const trackedFiles = execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard'], { cwd: ROOT, encoding: 'utf8' })
  .split('\n')
  .filter(Boolean)
  .filter((f) => existsSync(join(ROOT, f)));
const isText = (f: string) => /\.(md|json|ts|mjs|js|yml|yaml|svg|txt|html|css)$|^(LICENSE|NOTICE|\.gitignore|\.gitattributes)$/i.test(f) && !f.endsWith('pnpm-lock.yaml');

// ------------------------------------------------------------------ privacy
{
  const neverPublish: string[] = [];
  const local = join(INPUTS, 'never-publish.local.txt');
  if (existsSync(local)) neverPublish.push(...readFileSync(local, 'utf8').split('\n').map((s) => s.trim()).filter(Boolean));
  const owner = join(INPUTS, 'owner.json');
  if (existsSync(owner)) {
    const o = JSON.parse(readFileSync(owner, 'utf8')) as { privacy?: { neverPublish?: string[] } };
    // Entries that are descriptions ("phone number") rather than values are covered by the regexes.
    neverPublish.push(...(o.privacy?.neverPublish ?? []).filter((s) => /[@\d]/.test(s)));
  }
  const EMAIL = /[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}/g;
  // Allowed: commit trailers and placeholder addresses that are not anyone's inbox.
  const EMAIL_OK = /^(noreply@anthropic\.com|\d+\+KrishAryan12@users\.noreply\.github\.com|[\w.-]+@example\.(com|org))$/i;
  const PHONE = /(?:\+\d{1,3}[\s-]?)?(?:\(?\d{3,5}\)?[\s-]?)\d{3,4}[\s-]?\d{3,5}/g;
  for (const f of trackedFiles.filter(isText)) {
    let text = readFileSync(join(ROOT, f), 'utf8');
    // Geometry is not prose: drop path data, transforms and numeric attributes before scanning.
    if (f.endsWith('.svg')) text = text.replace(/\s(d|transform|points|viewBox|x|y|width|height|cx|cy|r|rx|x1|x2|y1|y2|stroke-[a-z]+|opacity|fill-opacity)="[^"]*"/g, '').replace(/<style>[\s\S]*?<\/style>/g, '');
    if (f.endsWith('.ts') && f.startsWith('tools/src/svg/')) text = text.replace(/d: '[^']*'/g, '');
    for (const m of text.match(EMAIL) ?? []) if (!EMAIL_OK.test(m) && !/\.(png|svg|webp|gif|js|ts|css)$/i.test(m)) fail('privacy', f, `email address: ${m}`);
    for (const m of text.match(PHONE) ?? []) {
      const digits = m.replace(/\D/g, '');
      // Phone-shaped: 10–13 digits with phone punctuation, or a +country prefix.
      if (digits.length >= 10 && digits.length <= 13 && (/[+()\s-]/.test(m) || digits.length === 10) && !/^(19|20)\d{2}/.test(digits)) {
        fail('privacy', f, `phone-like number: ${m.trim()}`);
      }
    }
    for (const s of neverPublish) if (text.toLowerCase().includes(s.toLowerCase())) fail('privacy', f, 'contains a never-publish value');
    if (/hf_[A-Za-z0-9]{20,}|ghp_[A-Za-z0-9]{20,}|sk-[A-Za-z0-9]{20,}/.test(text)) fail('privacy', f, 'looks like an API token');
  }
}

// ------------------------------------------------------------------ claims
{
  const claimsPath = join(ROOT, 'docs', 'CLAIMS.md');
  if (!existsSync(claimsPath)) fail('claims', 'docs/CLAIMS.md', 'missing');
  else {
    const claims = readFileSync(claimsPath, 'utf8');
    const prose = readme
      .replace(/<!--[\s\S]*?-->/g, '')
      .replace(/\s(src|href|srcset|width|height)="[^"]*"/g, '')
      .replace(/\]\([^)]*\)/g, ']')
      .replace(/https?:\/\/\S+/g, '');
    const nums = new Set<string>();
    for (const m of prose.matchAll(/(?<![A-Za-z\d.,-])(\d[\d,.]*\d|\d)([×+%]|\s?(?:months|services|tools|sources|tests|s|h)\b)?/g)) {
      const raw = m[1]!;
      const tok = raw + (m[2] && /[×+%]/.test(m[2]) ? m[2] : '');
      if (/^(19|20)\d{2}$/.test(raw)) continue; // years in dates
      if (raw.length < 2 && !m[2]) continue; // single digits without a unit are list labels
      nums.add(tok);
    }
    for (const n of nums) if (!claims.includes(n)) fail('claims', 'README.md', `number "${n}" is not in docs/CLAIMS.md`);
    const ids = JSON.stringify(loadProfile()).match(/"claim":\s*"([^"]+)"/g) ?? [];
    for (const raw of ids) {
      for (const id of raw.replace(/"claim":\s*"/, '').replace(/"$/, '').split(',')) {
        if (id !== 'JOKE' && !new RegExp(`\\|\\s*${id}\\s*\\|`).test(claims)) fail('claims', 'content/profile.json', `claim id ${id} has no row in docs/CLAIMS.md`);
      }
    }
  }
}

// ------------------------------------------------------------------ svg + text size
const readmeImgs = [...readme.matchAll(/<img\s+[^>]*src="([^"]+)"[^>]*>/g)].map((m) => {
  const tag = m[0];
  return {
    src: m[1]!,
    width: tag.match(/width="([^"]+)"/)?.[1] ?? '',
    alt: tag.match(/alt="([^"]*)"/)?.[1],
    tag,
  };
});
const displayWidthOf = (rel: string): number => {
  const hit = readmeImgs.find((i) => i.src === rel);
  if (!hit) return 800;
  return hit.width.endsWith('%') ? 880 : Number(hit.width) || 800;
};
{
  const svgs = trackedFiles.filter((f) => f.startsWith('assets/') && f.endsWith('.svg'));
  if (existsSync(join(ROOT, '.dynamic'))) {
    for (const f of ['activity.svg', 'scoreboard.svg', 'stamp.svg']) if (existsSync(join(ROOT, '.dynamic', f))) svgs.push(`.dynamic/${f}`);
  }
  for (const f of svgs) {
    const svg = readFileSync(join(ROOT, f), 'utf8');
    const valid = XMLValidator.validate(svg);
    if (valid !== true) fail('svg', f, `invalid XML: ${valid.err.msg}`);
    if (/<script/i.test(svg)) fail('svg', f, '<script> present');
    if (/<foreignObject/i.test(svg)) fail('svg', f, '<foreignObject> present');
    if (/@import|@font-face/i.test(svg)) fail('svg', f, '@import or @font-face present (text must be outlined)');
    if (/<text[\s>]/i.test(svg)) fail('svg', f, '<text> element present (text must be outlined)');
    if (/href="(?!#)/.test(svg) || /url\((?!#)/.test(svg)) fail('svg', f, 'reference to a resource outside the file');
    // Motion rules.
    for (const m of svg.matchAll(/animation:([\w-]+) ([\d.]+)s([^;}]*)/g)) {
      const [, name, durS, rest] = m;
      const dur = Number(durS);
      const infinite = /infinite/.test(rest!);
      if (!infinite) continue;
      const isCursor = name === 'cur' && /steps/.test(rest!);
      if (isCursor) {
        if (dur < 1) fail('svg', f, `cursor blink faster than 1 Hz (${dur}s)`);
        continue;
      }
      if (dur < tokens.motion.pulseMinPeriod) fail('svg', f, `looping animation "${name}" shorter than ${tokens.motion.pulseMinPeriod}s`);
      if (name !== 'pu' && (dur < tokens.motion.loopMin || dur > tokens.motion.loopMax)) fail('svg', f, `loop "${name}" is ${dur}s, outside ${tokens.motion.loopMin}-${tokens.motion.loopMax}s`);
    }
    if (/animation:/.test(svg) && !/prefers-reduced-motion/.test(svg)) fail('svg', f, 'animated without a reduced-motion still frame');
    // Readable text floor.
    const vbW = Number(svg.match(/viewBox="0 0 ([\d.]+)/)?.[1] ?? 800);
    const rel = f.startsWith('.dynamic/') ? '' : f;
    const floor = minUnits(vbW, rel ? displayWidthOf(rel) : 880);
    for (const g of svg.matchAll(/<g transform="translate\([^)]*\) scale\(([\d.]+)\)"([^>]*)>/g)) {
      if (/class="[^"]*deco/.test(g[2]!)) continue;
      const size = Number(g[1]) * 100;
      if (size + 0.05 < floor) fail('text', f, `text at ${size.toFixed(1)} units is below the ${floor}-unit floor for this panel`);
    }
  }
}

// ------------------------------------------------------------------ size
{
  const kb = (f: string) => statSync(join(ROOT, f)).size / 1024;
  for (const p of buildAllPanels()) {
    const f = `assets/${p.file}`;
    if (!existsSync(join(ROOT, f))) { fail('size', f, 'not built (run pnpm build)'); continue; }
    const s = kb(f);
    if (s > p.budgetKB) fail('size', f, `${s.toFixed(1)} KB over its ${p.budgetKB} KB budget`);
    if (f.includes('/dividers/') && s > 15) fail('size', f, 'divider over 15 KB');
    if (s > 120) fail('size', f, 'SVG over the 120 KB hard limit');
  }
  const hero = 'assets/hero.webp';
  if (!existsSync(join(ROOT, hero))) fail('size', hero, 'missing');
  else if (kb(hero) > 3.5 * 1024) fail('size', hero, `${(kb(hero) / 1024).toFixed(2)} MB over 3.5 MB`);
  const readmeKB = Buffer.byteLength(readme) / 1024;
  if (readmeKB > 25) fail('size', 'README.md', `${readmeKB.toFixed(1)} KB over 25 KB`);
  // First load: every distinct image the README references (the poster loads only for reduced motion).
  let total = 0;
  const seen = new Set<string>();
  for (const i of readmeImgs) {
    if (seen.has(i.src)) continue;
    seen.add(i.src);
    if (i.src.startsWith('assets/')) total += kb(i.src);
    else if (i.src.includes('/output/')) {
      const local = join(ROOT, '.dynamic', i.src.split('/').pop()!);
      total += existsSync(local) ? statSync(local).size / 1024 : 30;
    }
  }
  if (total > 5 * 1024) fail('size', 'README.md', `first-load image weight ${(total / 1024).toFixed(2)} MB over 5 MB`);
  console.log(`first-load image weight: ${(total / 1024).toFixed(2)} MB; README ${readmeKB.toFixed(1)} KB`);
}

// ------------------------------------------------------------------ a11y
{
  for (const i of readmeImgs) {
    const decorative = i.src.includes('/dividers/');
    if (i.alt === undefined) fail('a11y', 'README.md', `<img> without alt: ${i.src}`);
    else if (!i.alt.trim() && !decorative) fail('a11y', 'README.md', `<img> with empty alt: ${i.src}`);
  }
  // Information panels need a text equivalent in a <details> block close by.
  for (const panel of ['impact.svg', 'investigation.svg', 'stack.svg', 'earlier-work.svg', 'credentials.svg']) {
    const at = readme.indexOf(`assets/panels/${panel}`);
    if (at < 0) { fail('a11y', 'README.md', `${panel} not referenced`); continue; }
    const after = readme.slice(at, at + 900);
    if (!after.includes('<details>')) fail('a11y', 'README.md', `${panel} has no nearby text equivalent`);
  }
  const lum = (hex: string) => {
    const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
    return 0.2126 * c[0]! + 0.7152 * c[1]! + 0.0722 * c[2]!;
  };
  const ratio = (a: string, b: string) => {
    const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
    return (x! + 0.05) / (y! + 0.05);
  };
  const col = tokens.color;
  for (const fg of ['white', 'dim', 'cyan', 'cyanMid', 'orange'] as const) {
    for (const bg of ['panel', 'void', 'panelRaised'] as const) {
      const r = ratio(col[fg], col[bg]);
      if (r < 4.5) fail('a11y', 'tokens', `${fg} on ${bg} contrast ${r.toFixed(2)} < 4.5`);
    }
  }
}

// ------------------------------------------------------------------ report
const byCheck = new Map<string, Issue[]>();
for (const i of issues) byCheck.set(i.check, [...(byCheck.get(i.check) ?? []), i]);
for (const c of ['privacy', 'claims', 'svg', 'text', 'size', 'a11y']) {
  const list = byCheck.get(c) ?? [];
  console.log(`${list.length ? '✗' : '✓'} ${c}${list.length ? ` (${list.length})` : ''}`);
  for (const i of list.slice(0, 25)) console.log(`    ${i.file}: ${i.msg}`);
}
if (issues.length) process.exit(1);
