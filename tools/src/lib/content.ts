/**
 * Typed access to content/profile.json plus values derived at build time.
 * Tenure and climb speed are computed here, never hard-coded.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT } from './paths.ts';

export interface Experience {
  employer: string;
  title: string;
  start: string; // YYYY-MM
  end: string | null;
  built: string;
  show: boolean;
  claim: string;
  pending?: string;
}

export interface StackItem {
  name: string;
  icon?: string;
  chip?: string;
  headline?: boolean;
  note?: string;
}

export interface Card {
  name: string;
  kicker: string;
  body: string;
  stat?: string;
  href?: string;
  claim: string;
}

export interface Certification {
  issuer: string;
  icon?: string;
  chip?: string;
  title: string;
  short: string;
  issued: string; // YYYY-MM
  group: 'Agents & LLMs' | 'Data' | 'Cloud';
  priority: 'high' | 'medium' | 'low';
  verifyUrl: string | null;
}

export interface Profile {
  name: string;
  githubUser: string;
  title: string;
  titlePlain: string;
  tagline: string;
  location: string;
  timezone: string;
  links: Record<string, string>;
  boot: Array<{ cmd: string; out: string; claim: string }>;
  positioning: string[];
  impact: Array<{ value: string; label: string; detail: string; claim: string }>;
  experience: Experience[];
  investigation: {
    command: string[];
    steps: Array<{ kind: 'think' | 'call' | 'obs'; text: string; claim?: string }>;
    hypotheses: Array<{ text: string; confidence: number }>;
    footer: string;
  };
  systems: { private: Card[]; public: Card[] };
  stack: Array<{ group: string; items: StackItem[] }>;
  freelance: {
    headline: string;
    pitch: string;
    projects: Card[];
    services: string[];
    availability: string | null;
    rates: string | null;
  };
  publications: Array<{
    title: string;
    venue: string;
    indexing: string;
    paperUrl: string;
    codeUrl: string | null;
    codeNote?: string;
    claim: string;
  }>;
  earlierWork: Array<{ name: string; what: string; tags: string; repo: string | null; claim: string }>;
  certifications: Certification[];
  education: { degree: string; school: string; years: string; gpa: string; claim: string };
  dynamic: { outputBranch: string; contribGraph: 'auto' | 'on' | 'off'; contribThreshold: number; scoreboard: boolean; stats?: boolean };
}

export function loadProfile(): Profile {
  return JSON.parse(readFileSync(join(ROOT, 'content', 'profile.json'), 'utf8')) as Profile;
}

/** Build date. BUILD_DATE=YYYY-MM-DD pins it for reproducible output. */
export function buildDate(): Date {
  const env = process.env.BUILD_DATE;
  return env ? new Date(`${env}T00:00:00Z`) : new Date();
}

function ym(s: string): { y: number; m: number } {
  const [y, m] = s.split('-').map(Number);
  return { y: y!, m: m! };
}

/** Whole months between two YYYY-MM values (end exclusive). */
export function monthsBetween(start: string, end: string): number {
  const a = ym(start);
  const b = ym(end);
  return (b.y - a.y) * 12 + (b.m - a.m);
}

export function currentYm(d = buildDate()): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

/** "1 yr 9 mos" style, counting the start month like LinkedIn does. */
export function formatTenure(months: number): string {
  const y = Math.floor(months / 12);
  const m = months % 12;
  const parts: string[] = [];
  if (y) parts.push(`${y} yr${y > 1 ? 's' : ''}`);
  if (m) parts.push(`${m} mo${m > 1 ? 's' : ''}`);
  return parts.join(' ') || '0 mos';
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export function formatYm(s: string): string {
  const { y, m } = ym(s);
  return `${MONTHS[m - 1]} ${y}`;
}

export interface Derived {
  /** Months from the first Netradyne role to the current Software Engineer title. */
  climbMonths: number;
  /** Total Netradyne tenure, inclusive of the start month. */
  tenure: string;
  buildDate: string;
}

export function derive(p: Profile): Derived {
  const roles = p.experience.filter((e) => e.employer === 'Netradyne');
  const first = roles.reduce((a, b) => (a.start < b.start ? a : b));
  const current = roles.find((e) => e.end === null)!;
  const now = currentYm();
  return {
    climbMonths: monthsBetween(first.start, current.start),
    tenure: formatTenure(monthsBetween(first.start, now) + 1),
    buildDate: buildDate().toISOString().slice(0, 10),
  };
}

/** Replace {{key}} placeholders with derived values. */
export function fill(s: string, d: Derived): string {
  return s.replace(/\{\{(\w+)\}\}/g, (_, k: string) => String((d as unknown as Record<string, unknown>)[k] ?? `{{${k}}}`));
}
