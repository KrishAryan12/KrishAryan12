/**
 * "By the numbers": commit, line and language stats computed from git history, not a third-party card.
 *
 * Every owned, public, non-fork repo is cloned (bare) and walked with `git log --numstat`. Lines are
 * counted per file and only for code, configs and styles: data files, lockfiles, notebooks (their JSON
 * outputs would dwarf the code), generated files, binaries, logs and docs are excluded, so the
 * numbers describe code the owner wrote. Bot commits are excluded.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { C } from '../tokens/tokens.ts';
import { SvgDoc, r } from '../svg/doc.ts';
import { chrome } from '../svg/chrome.ts';

export interface RepoRef {
  name: string;
  cloneUrl: string;
}

export interface Stats {
  repos: number;
  commits: number;
  additions: number;
  deletions: number;
  languages: Array<{ name: string; lines: number; pct: number }>;
  /** Busiest hour of the day in IST (0–23). */
  peakHourIst: number;
  /** Commits made between 02:00 and 04:59 IST. */
  threeAmCommits: number;
  since: string;
}

const EXCLUDE = [
  /(^|\/)(node_modules|vendor|dist|build|out|coverage|\.next)\//,
  /(^|\/)generated\//,
  /(^|\/)(package-lock\.json|pnpm-lock\.yaml|yarn\.lock|poetry\.lock|Pipfile\.lock)$/,
  /\.(csv|tsv|zip|gz|weights|names|cfg|log|txt|ipynb|md|mdx|lock|map|min\.js|min\.css|svg|png|jpe?g|gif|webp|mp3|mp4|wav|mkv|pdf|ico|woff2?)$/i,
  /(^|\/)fixtures?\//,
];

const LANG: Record<string, string> = {
  ts: 'TypeScript', tsx: 'TypeScript', mts: 'TypeScript', cts: 'TypeScript',
  js: 'JavaScript', jsx: 'JavaScript', mjs: 'JavaScript', cjs: 'JavaScript',
  py: 'Python', java: 'Java', go: 'Go', rs: 'Rust', sh: 'Shell', bash: 'Shell',
  css: 'CSS', scss: 'CSS', html: 'HTML', sql: 'SQL',
  yml: 'YAML', yaml: 'YAML', json: 'JSON', toml: 'Config', ini: 'Config', conf: 'Config',
  dockerfile: 'Docker',
};

function languageOf(path: string): string | null {
  const base = path.split('/').pop()!.toLowerCase();
  if (base === 'dockerfile' || base.endsWith('.dockerfile')) return 'Docker';
  const ext = base.includes('.') ? base.split('.').pop()! : '';
  return LANG[ext] ?? null;
}

const isBot = (name: string, email: string) => /\[bot\]|dependabot|github-actions|renovate/i.test(`${name} ${email}`);

export function computeStats(repos: RepoRef[]): Stats {
  const work = mkdtempSync(join(tmpdir(), 'ka-stats-'));
  const byLang = new Map<string, number>();
  const hours = new Array<number>(24).fill(0);
  let commits = 0;
  let additions = 0;
  let deletions = 0;
  let threeAm = 0;
  let since = '9999';
  try {
    for (const repo of repos) {
      const dir = join(work, repo.name);
      execFileSync('git', ['clone', '--bare', '--quiet', repo.cloneUrl, dir], { stdio: 'ignore' });
      const log = execFileSync('git', ['--git-dir', dir, 'log', '--no-merges', '--numstat', '--format=@@%an%x09%ae%x09%aI'], {
        encoding: 'utf8',
        maxBuffer: 256 * 1024 * 1024,
      });
      let skip = false;
      for (const line of log.split('\n')) {
        if (line.startsWith('@@')) {
          const [name = '', email = '', iso = ''] = line.slice(2).split('\t');
          skip = isBot(name, email);
          if (skip) continue;
          commits++;
          if (iso.slice(0, 10) < since) since = iso.slice(0, 10);
          // Hour in IST (UTC+05:30), from the commit's own UTC instant.
          const d = new Date(iso);
          const ist = new Date(d.getTime() + 330 * 60_000);
          const h = ist.getUTCHours();
          hours[h]!++;
          if (h >= 2 && h <= 4) threeAm++;
          continue;
        }
        if (skip || !line.trim()) continue;
        const [a, dl, ...rest] = line.split('\t');
        const path = rest.join('\t');
        if (a === '-' || dl === '-') continue; // binary
        if (EXCLUDE.some((re) => re.test(path))) continue;
        const lang = languageOf(path);
        if (!lang) continue;
        const add = Number(a);
        additions += add;
        deletions += Number(dl);
        byLang.set(lang, (byLang.get(lang) ?? 0) + add);
      }
    }
  } finally {
    if (existsSync(work)) rmSync(work, { recursive: true, force: true });
  }
  const total = [...byLang.values()].reduce((x, y) => x + y, 0) || 1;
  const languages = [...byLang.entries()]
    .map(([name, lines]) => ({ name, lines, pct: (lines / total) * 100 }))
    .sort((x, y) => y.lines - x.lines);
  const peakHourIst = hours.indexOf(Math.max(...hours));
  return { repos: repos.length, commits, additions, deletions, languages, peakHourIst, threeAmCommits: threeAm, since };
}

export function compact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n >= 10_000_000 ? 0 : 1)}M`;
  if (n >= 10_000) return `${Math.round(n / 1000)}k`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

/** Shades of the healthy colour, distinguishable side by side; labels carry the meaning too. */
const SHADES = ['#66F6FF', '#18C8E0', '#0E97AB', '#5FB8C9', '#2E6F7E', '#B9F3FA', '#7FA6B5'];

export function statsPanel(s: Stats, contributions: number | null, generatedAt: string): string {
  const W = 800;
  const readouts: Array<[string, string]> = [
    [contributions === null ? '—' : compact(contributions), 'contributions, last year'],
    [compact(s.commits), 'public commits'],
    [String(s.repos), 'public repos'],
    [`+${compact(s.additions)}`, 'lines added'],
    [`−${compact(s.deletions)}`, 'lines deleted'],
  ];
  const top = s.languages.slice(0, 6);
  const rest = s.languages.slice(6).reduce((a, l) => a + l.pct, 0);
  const segs = rest > 0.5 ? [...top, { name: 'Other', lines: 0, pct: rest }] : top;
  // Layout first, so the chrome is drawn at the final height.
  const by = 250;
  const legendRows = Math.ceil(segs.length / 2);
  const fy = by + 70 + legendRows * 36 + 8;
  const H = fy + 30;
  const css =
    segs.map((_, i) => `.sg${i}{transform-box:fill-box;transform-origin:left;animation:sg 1.4s ease-out ${r(0.2 + i * 0.12)}s 1 both}`).join('') +
    `@keyframes sg{from{transform:scaleX(0)}to{transform:none}}`;
  const doc = new SvgDoc({
    width: W, height: H, title: 'By the numbers',
    desc: readouts.map(([v, l]) => `${v} ${l}`).join(', ') + '. Languages: ' + segs.map((l) => `${l.name} ${l.pct.toFixed(0)}%`).join(', '),
    css,
    still: segs.map((_, i) => `.sg${i}`).join(',') + '{transform:none}',
  });
  doc.add(chrome(doc, { w: W, h: H, label: `// BY THE NUMBERS · ${generatedAt}` }));
  const padX = 24;
  const colW = (W - padX * 2) / readouts.length;
  readouts.forEach(([v, l], i) => {
    const cx = padX + colW * i + colW / 2;
    if (i > 0) doc.add(`<path d="M${r(padX + colW * i)} 76V196" stroke="${C.cyanMid}" stroke-opacity=".2"/>`);
    const size = Math.min(46, ((colW - 14) / doc.atlas.measure(v, 'displayBold', 46)) * 46);
    doc.add(doc.text(v, cx, 124, { font: 'displayBold', size: +size.toFixed(1), fill: i === 4 ? C.dim : C.cyan, anchor: 'middle' }));
    doc.atlas.wrap(l, colW - 12, 'display', 24).forEach((ln, j) => doc.add(doc.text(ln, cx, 162 + j * 28, { font: 'display', size: 24, fill: C.white, anchor: 'middle' })));
  });
  // Language bar.
  const bx = 34;
  const bw = W - 68;
  doc.add(doc.text('CODE BY LANGUAGE · LINES WRITTEN', bx, by - 16, { font: 'mono', size: 18, fill: C.dim, tracking: 1.5, cls: 'deco' }));
  let x = bx;
  segs.forEach((l, i) => {
    const w = (bw * l.pct) / 100;
    doc.add(`<rect class="sg${i}" x="${r(x)}" y="${by}" width="${r(Math.max(w - 2, 1))}" height="22" rx="3" fill="${SHADES[i % SHADES.length]}"/>`);
    x += w;
  });
  // Legend: two columns of swatch + name + percentage, so colour is never the only label.
  segs.forEach((l, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const lx = bx + col * (bw / 2);
    const ly = by + 70 + row * 36;
    doc.add(`<rect x="${lx}" y="${ly - 18}" width="18" height="18" rx="3" fill="${SHADES[i % SHADES.length]}"/>`);
    doc.add(doc.text(l.name, lx + 30, ly, { font: 'display', size: 24, fill: C.white }));
    doc.add(doc.text(`${l.pct.toFixed(l.pct < 10 ? 1 : 0)}%`, lx + bw / 2 - 30, ly, { font: 'mono', size: 24, fill: C.dim, anchor: 'end' }));
  });
  const hh = String(s.peakHourIst).padStart(2, '0');
  const foot = s.threeAmCommits === 0
    ? `peak hour ${hh}:00 IST · 3AM commits: 0. The agent takes those.`
    : `peak hour ${hh}:00 IST · 3AM commits: ${s.threeAmCommits}`;
  doc.add(doc.text(foot, bx, fy, { font: 'mono', size: 24, fill: C.cyanMid }));
  return doc.render();
}
