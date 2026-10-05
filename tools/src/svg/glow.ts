/**
 * A deliberately small set of glow filters. Filters are expensive, so panels use at most a couple,
 * keep them small, and never animate a filter itself (only the opacity of a filtered element).
 */
import { C } from '../tokens/tokens.ts';

const FILTERS = {
  cyan: `<filter id="gc" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="3" result="b"/><feFlood flood-color="${C.cyan}" flood-opacity=".55"/><feComposite in2="b" operator="in"/><feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge></filter>`,
  orange: `<filter id="go" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="3" result="b"/><feFlood flood-color="${C.orange}" flood-opacity=".7"/><feComposite in2="b" operator="in"/><feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge></filter>`,
  soft: `<filter id="gs" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="6"/></filter>`,
} as const;

export function glowDefs(which: Array<keyof typeof FILTERS>): string {
  return [...new Set(which)].map((k) => FILTERS[k]).join('');
}
