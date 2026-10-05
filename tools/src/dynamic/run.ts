/**
 * Dynamic content generator, run daily by .github/workflows/update-dynamic.yml.
 *
 *   pnpm dynamic --out <dir> [--scoreboard]
 *
 * Writes into <dir> (the checked-out `output` branch):
 *   activity.svg    recent public activity, same chrome as every other panel
 *   scoreboard.svg  "my portfolio, audited by my own tool" (only with --scoreboard; weekly)
 *   stamp.svg       "last regenerated" date for the footer
 *   state.json      contribution count and which optional panels exist (read by build:readme)
 *
 * Needs only GITHUB_TOKEN (optional locally). Every step fails safe: on any error the last good
 * file in <dir> is kept.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { loadProfile, type Profile } from '../lib/content.ts';
import { C } from '../tokens/tokens.ts';
import { SvgDoc } from '../svg/doc.ts';
import { chrome } from '../svg/chrome.ts';
import type { DynamicState } from '../readme/build.ts';

const W = 800;
const UA = { 'user-agent': 'KrishAryan12-profile-generator', accept: 'application/vnd.github+json' };

function ghHeaders(): Record<string, string> {
  const t = process.env.GITHUB_TOKEN;
  return t ? { ...UA, authorization: `Bearer ${t}` } : UA;
}

// ---------------------------------------------------------------- activity

interface Activity {
  date: string;
  verb: string;
  repo: string;
  detail: string;
}

interface GhEvent {
  type: string;
  repo: { name: string };
  created_at: string;
  public: boolean;
  payload: {
    ref?: string;
    ref_type?: string;
    commits?: Array<{ message: string }>;
    size?: number;
    action?: string;
    release?: { name?: string; tag_name?: string };
    pull_request?: { title?: string; merged?: boolean };
  };
}

export async function fetchActivity(p: Profile, limit = 5): Promise<Activity[]> {
  const res = await fetch(`https://api.github.com/users/${p.githubUser}/events/public?per_page=100`, { headers: ghHeaders() });
  if (!res.ok) throw new Error(`events API ${res.status}`);
  const events = (await res.json()) as GhEvent[];
  const self = `${p.githubUser}/${p.githubUser}`;
  const out: Activity[] = [];
  const seen = new Set<string>();
  for (const e of events) {
    if (!e.public || e.repo.name === self) continue;
    const repo = e.repo.name.split('/')[1]!;
    const date = e.created_at.slice(0, 10);
    let a: Activity | null = null;
    if (e.type === 'PushEvent') {
      const n = e.payload.size ?? e.payload.commits?.length ?? 0;
      const msg = e.payload.commits?.at(-1)?.message.split('\n')[0] ?? '';
      a = { date, verb: 'pushed', repo, detail: msg || `${n} commit${n === 1 ? '' : 's'}` };
    } else if (e.type === 'ReleaseEvent' && e.payload.action === 'published') {
      a = { date, verb: 'released', repo, detail: e.payload.release?.name || e.payload.release?.tag_name || '' };
    } else if (e.type === 'CreateEvent' && e.payload.ref_type === 'repository') {
      a = { date, verb: 'created', repo, detail: 'new repository' };
    } else if (e.type === 'PullRequestEvent' && (e.payload.action === 'opened' || e.payload.pull_request?.merged)) {
      a = { date, verb: e.payload.pull_request?.merged ? 'merged' : 'opened PR', repo, detail: e.payload.pull_request?.title ?? '' };
    }
    if (!a) continue;
    // One line per repo per day keeps the panel readable.
    const key = `${a.date}|${a.repo}|${a.verb}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(a);
    if (out.length >= limit) break;
  }
  return out;
}

export function activityPanel(items: Activity[], generatedAt: string): string {
  const rowH = 64;
  const top = 76;
  const H = top + Math.max(1, items.length) * rowH + 16;
  const doc = new SvgDoc({
    width: W, height: H, title: 'Recent public activity',
    desc: items.map((i) => `${i.date}: ${i.verb} ${i.repo}. ${i.detail}`).join(' ') || 'No recent public activity.',
  });
  doc.add(chrome(doc, { w: W, h: H, label: `// RECENT PUBLIC ACTIVITY · ${generatedAt}` }));
  if (!items.length) {
    doc.add(doc.text('Quiet week on the public grid. The private one is busy.', 34, top + 30, { font: 'mono', size: 24, fill: C.dim }));
  }
  items.forEach((it, i) => {
    const y = top + i * rowH;
    if (i > 0) doc.add(`<path d="M34 ${y - 8}H${W - 34}" stroke="${C.cyanMid}" stroke-opacity=".18"/>`);
    doc.add(doc.text(it.date, 34, y + 24, { font: 'mono', size: 24, fill: C.dim }));
    const head = `${it.verb} ${it.repo}`;
    doc.add(doc.text(head, 230, y + 24, { font: 'displayBold', size: 24, fill: C.white }));
    const max = W - 230 - 34;
    // Commit messages are free text: keep printable ASCII and truncate to the column.
    const clean = it.detail.replace(/[^\x20-\x7E]/g, '').trim();
    let detail = clean;
    while (detail && doc.atlas.measure(`${detail}...`, 'mono', 24) > max) detail = detail.slice(0, -1).trimEnd();
    if (detail !== clean) detail += '...';
    doc.add(doc.text(detail || ' ', 230, y + 52, { font: 'mono', size: 24, fill: C.cyanMid }));
  });
  return doc.render();
}

// ---------------------------------------------------------------- contributions

export async function contributionsLastYear(user: string): Promise<number | null> {
  const token = process.env.GITHUB_TOKEN;
  try {
    if (token) {
      const res = await fetch('https://api.github.com/graphql', {
        method: 'POST',
        headers: { ...ghHeaders(), 'content-type': 'application/json' },
        body: JSON.stringify({ query: `query($u:String!){user(login:$u){contributionsCollection{contributionCalendar{totalContributions}}}}`, variables: { u: user } }),
      });
      const json = (await res.json()) as { data?: { user?: { contributionsCollection?: { contributionCalendar?: { totalContributions?: number } } } } };
      const n = json.data?.user?.contributionsCollection?.contributionCalendar?.totalContributions;
      if (typeof n === 'number') return n;
    }
    // Fallback without a token: the public contributions fragment.
    const html = await (await fetch(`https://github.com/users/${user}/contributions`, { headers: UA })).text();
    const m = html.replace(/\s+/g, ' ').match(/([\d,]+) contributions? in the last year/);
    return m ? Number(m[1]!.replace(/,/g, '')) : null;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------- scoreboard (Teardown)

interface Scores {
  overall: number;
  performance: { score: number; source: string };
  seo: number;
  accessibility: number;
  ux: number;
  brand: number;
  security: number;
}

/** One scan of the portfolio through the owner's own Teardown instance. */
export async function scanPortfolio(p: Profile): Promise<{ scores: Scores; at: string }> {
  const res = await fetch(`${p.links.teardownLive}/api/scan/stream`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'user-agent': UA['user-agent'] },
    body: JSON.stringify({ url: p.links.portfolio, mode: 'single' }),
    signal: AbortSignal.timeout(300_000),
  });
  if (!res.ok) throw new Error(`scan HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const text = await res.text();
  for (const block of text.split('\n\n')) {
    const ev = block.match(/^event: (\w+)/m)?.[1];
    const data = block.match(/^data: (.*)$/m)?.[1];
    if (ev === 'report' && data) {
      const report = (JSON.parse(data) as { report: { scores: Scores; generatedAt: string } }).report;
      return { scores: report.scores, at: report.generatedAt.slice(0, 10) };
    }
    if (ev === 'error' && data) throw new Error(`scan error: ${data.slice(0, 200)}`);
  }
  throw new Error('scan finished without a report');
}

export function scoreboardPanel(s: Scores, at: string): string {
  const rows: Array<[string, number]> = [
    ['Overall', s.overall],
    ['Performance', s.performance.score],
    ['Accessibility', s.accessibility],
    ['SEO', s.seo],
    ['UX', s.ux],
    ['Brand', s.brand],
    ['Security', s.security],
  ];
  const H = 330;
  const doc = new SvgDoc({
    width: W, height: H, title: 'My portfolio, audited by my own tool',
    desc: `Teardown scan of krisharyan.vercel.app on ${at}: ` + rows.map(([k, v]) => `${k} ${Math.round(v)}`).join(', '),
  });
  doc.add(chrome(doc, { w: W, h: H, label: `// DOGFOOD · TEARDOWN VS MY PORTFOLIO · ${at}` }));
  doc.add(doc.text('My portfolio, audited by my own tool.', 34, 96, { font: 'displayBold', size: 28, fill: C.white }));
  const colW = (W - 68) / 4;
  rows.forEach(([k, v], i) => {
    const cx = 34 + (i % 4) * colW + colW / 2;
    const y = i < 4 ? 168 : 268;
    // Below 50 counts as an incident: orange, with a label so colour is not the only signal.
    const bad = v < 50;
    doc.add(doc.text(String(Math.round(v)), cx, y, { font: 'displayBold', size: 48, fill: bad ? C.orange : C.cyan, anchor: 'middle' }));
    doc.add(doc.text(bad ? `${k} (fix me)` : k, cx, y + 32, { font: 'mono', size: 24, fill: C.dim, anchor: 'middle' }));
  });
  return doc.render();
}

// ---------------------------------------------------------------- stamp

export function stampSvg(date: string): string {
  const doc = new SvgDoc({ width: 300, height: 20, title: `Last regenerated ${date}` });
  doc.add(doc.text(`last regenerated ${date}`, 150, 15, { font: 'mono', size: 13, fill: C.dim, anchor: 'middle' }));
  return doc.render();
}

// ---------------------------------------------------------------- main

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const outIdx = args.indexOf('--out');
  const out = resolve(outIdx >= 0 ? args[outIdx + 1]! : '.dynamic');
  const doScoreboard = args.includes('--scoreboard');
  mkdirSync(out, { recursive: true });
  const p = loadProfile();
  const today = new Date().toISOString().slice(0, 10);
  const prevStatePath = join(out, 'state.json');
  const prev: Partial<DynamicState> = existsSync(prevStatePath) ? JSON.parse(readFileSync(prevStatePath, 'utf8')) : {};

  try {
    const items = await fetchActivity(p);
    writeFileSync(join(out, 'activity.svg'), activityPanel(items, today));
    console.log(`activity: ${items.length} items`);
  } catch (e) {
    console.warn(`activity skipped, keeping last good panel: ${(e as Error).message}`);
    if (!existsSync(join(out, 'activity.svg'))) writeFileSync(join(out, 'activity.svg'), activityPanel([], today));
  }

  const contributions = await contributionsLastYear(p.githubUser);
  console.log(`contributions in the last year: ${contributions ?? 'unknown'}`);

  let scoreboard = !!prev.scoreboard && existsSync(join(out, 'scoreboard.svg'));
  if (doScoreboard && p.dynamic.scoreboard) {
    try {
      const { scores, at } = await scanPortfolio(p);
      writeFileSync(join(out, 'scoreboard.svg'), scoreboardPanel(scores, at));
      scoreboard = true;
      console.log(`scoreboard: overall ${scores.overall}`);
    } catch (e) {
      console.warn(`scoreboard skipped, keeping last good panel: ${(e as Error).message}`);
    }
  }

  writeFileSync(join(out, 'stamp.svg'), stampSvg(today));
  const state: DynamicState = {
    generatedAt: new Date().toISOString(),
    contributionsLastYear: contributions ?? prev.contributionsLastYear ?? null,
    contribGraph: (contributions ?? 0) >= p.dynamic.contribThreshold,
    scoreboard,
  };
  writeFileSync(prevStatePath, JSON.stringify(state, null, 2) + '\n');
  console.log(`state: ${JSON.stringify(state)}`);
}

if (process.argv[1]?.replace(/\\/g, '/').endsWith('dynamic/run.ts')) await main();
