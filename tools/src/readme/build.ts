/**
 * README builder: README.template.md + content/profile.json → README.md.
 *
 * The template holds structure and prose; every fact, link and list comes from the profile, so
 * editing a fact in one place updates the README and every panel that shows it.
 *
 * Dynamic sections (scoreboard, 3D contribution graph) are included only when the `output` branch
 * state says they exist. State is read from $DYNAMIC_STATE (a local file, used by the Action) or
 * fetched from the output branch; with neither, they are left out.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT } from '../lib/paths.ts';
import { derive, fill, formatYm, loadProfile, type Profile } from '../lib/content.ts';
import { slug } from '../panels/cards.ts';

export interface DynamicState {
  generatedAt: string;
  contributionsLastYear: number | null;
  contribGraph: boolean;
  scoreboard: boolean;
  /** Whether stats.svg (commits, lines, languages) exists on the output branch. */
  stats?: boolean;
  /** Last successful Teardown scan, kept so the panel can be re-rendered without re-scanning. */
  lastScan?: { scores: unknown; at: string };
}

export function dynamicBase(p: Profile): string {
  return `https://raw.githubusercontent.com/${p.githubUser}/${p.githubUser}/${p.dynamic.outputBranch}`;
}

async function loadState(p: Profile): Promise<DynamicState | null> {
  const local = process.env.DYNAMIC_STATE;
  if (local && existsSync(local)) return JSON.parse(readFileSync(local, 'utf8')) as DynamicState;
  try {
    const res = await fetch(`${dynamicBase(p)}/state.json`, { signal: AbortSignal.timeout(8000) });
    if (res.ok) return (await res.json()) as DynamicState;
  } catch {
    /* offline: dynamic extras stay out */
  }
  return null;
}

const mdEscape = (s: string) => s.replace(/\|/g, '\\|');

export async function buildReadme(): Promise<string> {
  const p = loadProfile();
  const d = derive(p);
  const state = await loadState(p);
  const roles = p.experience.filter((e) => e.show).sort((a, b) => a.start.localeCompare(b.start));
  const climb = fill('{{climbMonths}}', d);

  const contribGraph =
    p.dynamic.contribGraph === 'on' ||
    (p.dynamic.contribGraph === 'auto' && !!state?.contribGraph && (state.contributionsLastYear ?? 0) >= p.dynamic.contribThreshold);

  const img = (file: string, alt: string, width: number) => `<img src="assets/${file}" width="${width}" alt="${alt.replace(/"/g, '&quot;')}">`;
  const cardLink = (href: string, file: string, alt: string) => `  <a href="${href}">${img(file, alt, 400)}</a>`;

  const invLines: string[] = [];
  p.investigation.command.forEach((c, i) => invLines.push(`${i === 0 ? '$' : ' '} ${c}`));
  invLines.push('');
  for (const s of p.investigation.steps) invLines.push(`${s.kind.toUpperCase().padEnd(6)} ${fill(s.text, d)}`);
  invLines.push('', 'RANKED HYPOTHESES');
  p.investigation.hypotheses.forEach((h, i) => invLines.push(`H${i + 1}  ${h.text.padEnd(32)} ${h.confidence.toFixed(2)}`));
  invLines.push('', `✓ ${p.investigation.footer}`);

  const shownCerts = p.certifications.filter((c) => c.priority !== 'low');
  const lowCerts = p.certifications.filter((c) => c.priority === 'low');
  const groups = ['Agents & LLMs', 'Data', 'Cloud'] as const;
  const certRows = groups.flatMap((g) =>
    shownCerts
      .filter((c) => c.group === g)
      .sort((a, b) => b.issued.localeCompare(a.issued))
      .map((c) => `| ${g} | ${mdEscape(c.title)} | ${c.issuer} | ${formatYm(c.issued)} | ${c.verifyUrl ? `[verify](${c.verifyUrl})` : 'no public link'} |`),
  );

  const values: Record<string, string> = {
    name: p.name,
    titlePlain: p.titlePlain,
    tagline: p.tagline,
    bootAlt: p.boot.map((b) => `${b.cmd}: ${b.out.replace(/\.$/, '')}`).join('. ') + '.',
    positioning: p.positioning.join('\n\n'),
    impactAlt: p.impact.map((i) => `${i.value} ${i.label}`).join(', '),
    impactText: p.impact.map((i) => `- **${i.value}** ${i.label} (${i.detail})`).join('\n'),
    timelineAlt: `Intern to Software Engineer in ${climb} months. ` + roles.map((e) => `${formatYm(e.start)}, ${e.title}`).join('; '),
    timelineText:
      `Intern to Software Engineer in ${climb} months (${d.tenure} at ${roles[0]!.employer} so far):\n\n` +
      roles.map((e) => `- **${formatYm(e.start)}**: ${e.title}, ${e.employer}. ${e.built}.`).join('\n'),
    investigationText: invLines.join('\n'),
    privateCards: p.systems.private
      .map((c) => cardLink(p.links.portfolioWork!, `panels/system-${slug(c.name)}.svg`, `${c.name}, production and private: ${c.body}`))
      .join('\n'),
    publicCards: p.systems.public
      .map((c) => cardLink(c.href!, `panels/system-${slug(c.name)}.svg`, `${c.name}, live: ${c.body}`))
      .join('\n'),
    stackAlt: p.stack.map((g) => `${g.group}: ${g.items.map((i) => i.name).join(', ')}`).join('. '),
    stackText: p.stack
      .map((g) => `- **${g.group}**: ${g.items.map((i) => (i.headline ? `**${i.name}**` : i.name) + (i.note ? ` (${i.note})` : '')).join(', ')}`)
      .join('\n') + '\n\nBold entries are the daily drivers.',
    freelancePitch: p.freelance.pitch,
    websiteCards: p.freelance.projects
      .map((c) => cardLink(c.href!, `panels/web-${slug(c.name)}.svg`, `${c.name}: ${c.body}`))
      .join('\n'),
    paperCards: p.publications
      .map((pub) => cardLink(pub.paperUrl, `panels/paper-${slug(pub.indexing)}.svg`, `Paper, ${pub.indexing}: ${pub.title}. ${pub.venue}.`))
      .join('\n'),
    paperLinks: p.publications
      .map((pub) => `- [${pub.title}](${pub.paperUrl}), ${pub.venue} (${pub.indexing})${pub.codeUrl ? ` · [code](${pub.codeUrl})` : ''}`)
      .join('\n'),
    earlierAlt: p.earlierWork.map((e) => e.name).join(', '),
    earlierText: p.earlierWork
      .map((e) => `- **${e.repo ? `[${e.name}](${e.repo})` : e.name}**: ${e.what} *${e.tags}*`)
      .join('\n'),
    credentialsTable:
      `These are course certificates and badges, not proctored certifications.\n\n| Group | Credential | Issuer | Issued | Verify |\n|---|---|---|---|---|\n${certRows.join('\n')}` +
      (lowCerts.length ? `\n\nAlso completed: ${lowCerts.map((c) => `${c.title} (${c.issuer}, ${formatYm(c.issued)})`).join('; ')}.` : ''),
    dynamicBase: dynamicBase(p),
    // 3D section break; reduced-motion visitors get the designed still frame.
    divider: [
      '<picture>',
      '  <source media="(prefers-reduced-motion: reduce)" srcset="assets/dividers/divider-still.png">',
      '  <img src="assets/dividers/divider.gif" width="100%" alt="">',
      '</picture>',
    ].join('\n'),
  };
  for (const [k, v] of Object.entries(p.links)) values[`links.${k}`] = v;
  for (const [k, v] of Object.entries(p.education)) values[`education.${k}`] = v;

  // Normalise line endings so Windows checkouts build byte-identical output to CI.
  let out = readFileSync(join(ROOT, 'README.template.md'), 'utf8').replace(/\r\n/g, '\n');
  // Header comment.
  out = out.replace(/^<!--[\s\S]*?-->\s*/, '<!-- Generated by tools/src/readme/build.ts from README.template.md and content/profile.json. Do not edit by hand. -->\n\n');
  // Conditionals.
  const flags: Record<string, boolean> = { contribGraph, scoreboard: p.dynamic.scoreboard && !!state?.scoreboard, stats: !!p.dynamic.stats && !!state?.stats };
  out = out.replace(/\{\{#if (\w+)\}\}\n?([\s\S]*?)\{\{\/if\}\}\n?/g, (_, k: string, body: string) => (flags[k] ? body : ''));
  out = out.replace(/\{\{([\w.]+)\}\}/g, (m, k: string) => {
    if (!(k in values)) throw new Error(`README template: unknown placeholder ${m}`);
    return values[k]!;
  });
  // Collapse runs of blank lines left by removed blocks.
  return out.replace(/\n{3,}/g, '\n\n');
}

if (process.argv[1]?.replace(/\\/g, '/').endsWith('readme/build.ts')) {
  const md = await buildReadme();
  writeFileSync(join(ROOT, 'README.md'), md);
  console.log(`README.md written (${(Buffer.byteLength(md) / 1024).toFixed(1)} KB)`);
}
