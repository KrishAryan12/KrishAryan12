/**
 * Link check: every external link in README.md must resolve.
 *
 * Some hosts block automated clients or sleep on free tiers; they are allow-listed with a reason
 * and reported as warnings rather than failures. Run with `pnpm lint:links` (needs network).
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT } from '../lib/paths.ts';

const ALLOW: Array<{ host: RegExp; reason: string }> = [
  { host: /(^|\.)linkedin\.com$/, reason: 'LinkedIn answers bots with 999/429' },
  { host: /(^|\.)ieeexplore\.ieee\.org$/, reason: 'IEEE Xplore returns 202/418 to scripts' },
  { host: /\.onrender\.com$/, reason: 'Render free tier sleeps; first request can time out' },
  { host: /(^|\.)credly\.com$/, reason: 'Credly sometimes rate limits scripts' },
  { host: /^raw\.githubusercontent\.com$/, reason: 'output branch may not exist on a fresh fork' },
];

const readme = readFileSync(join(ROOT, 'README.md'), 'utf8');
const urls = new Set<string>();
for (const m of readme.matchAll(/(?:href|src)="(https?:\/\/[^"]+)"|\]\((https?:\/\/[^)\s]+)\)/g)) urls.add((m[1] ?? m[2])!.replace(/&amp;/g, '&'));

async function check(url: string): Promise<{ url: string; status: number | string }> {
  for (const method of ['HEAD', 'GET'] as const) {
    try {
      const res = await fetch(url, { method, redirect: 'follow', signal: AbortSignal.timeout(25_000), headers: { 'user-agent': 'Mozilla/5.0 (link check; KrishAryan12 profile)' } });
      if (res.ok || method === 'GET') return { url, status: res.status };
    } catch (e) {
      if (method === 'GET') return { url, status: (e as Error).name };
    }
  }
  return { url, status: 'unknown' };
}

const results = await Promise.all([...urls].map(check));
let failed = 0;
for (const r of results.sort((a, b) => a.url.localeCompare(b.url))) {
  const ok = typeof r.status === 'number' && r.status < 400;
  const allow = ALLOW.find((a) => a.host.test(new URL(r.url).hostname));
  const tag = ok ? 'ok  ' : allow ? 'warn' : 'FAIL';
  if (!ok && !allow) failed++;
  console.log(`${tag} ${String(r.status).padEnd(12)} ${r.url}${!ok && allow ? `  (${allow.reason})` : ''}`);
  // In Actions, surface results as annotations (readable without opening the log).
  if (process.env.GITHUB_ACTIONS && !ok) console.log(`::${allow ? 'warning' : 'error'} title=link ${r.status}::${r.url}`);
}
console.log(`${results.length} links, ${failed} failed`);
if (failed) process.exit(1);
