import type { Derived, Profile } from '../lib/content.ts';

export interface PanelOutput {
  /** Path relative to assets/, e.g. "panels/boot.svg". */
  file: string;
  svg: string;
  /** Size budget in KB (section 12 of the brief). */
  budgetKB: number;
  /** Width of the <img> in the README, used to compute the readable-text floor. */
  displayWidth: number;
}

export type PanelBuilder = (p: Profile, d: Derived) => PanelOutput | PanelOutput[];

/** Smallest text size (viewBox units) that still renders at 11px on a 375px-wide phone. */
export function minUnits(viewBoxWidth: number, displayWidth: number): number {
  // The brief's rule: 11px on a 375px-wide screen. A narrower image never grows past its own width.
  const shown = Math.min(displayWidth, 375);
  return Math.ceil((11 * viewBoxWidth) / shown);
}
