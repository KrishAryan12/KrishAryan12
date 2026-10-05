/**
 * Grid geometry: the perspective floor used by dividers and the isometric tiles used by
 * the stack and credential panels. One light direction everywhere: light from the top-left,
 * so the left face is brighter than the right face.
 */
import { C } from '../tokens/tokens.ts';
import { r } from './doc.ts';

/** Isometric tile: a rhombus top face with two side faces, centred on (cx, cy). */
export function isoTile(cx: number, cy: number, w: number, depth: number, accent = false): string {
  const h = w / 2;
  const top = `M${r(cx)} ${r(cy - h / 2)}L${r(cx + w / 2)} ${r(cy)}L${r(cx)} ${r(cy + h / 2)}L${r(cx - w / 2)} ${r(cy)}Z`;
  const left = `M${r(cx - w / 2)} ${r(cy)}L${r(cx)} ${r(cy + h / 2)}V${r(cy + h / 2 + depth)}L${r(cx - w / 2)} ${r(cy + depth)}Z`;
  const right = `M${r(cx + w / 2)} ${r(cy)}L${r(cx)} ${r(cy + h / 2)}V${r(cy + h / 2 + depth)}L${r(cx + w / 2)} ${r(cy + depth)}Z`;
  const edge = accent ? C.cyan : C.cyanMid;
  return [
    `<path d="${left}" fill="${C.cyanDeep}" fill-opacity="${accent ? 0.55 : 0.35}"/>`,
    `<path d="${right}" fill="${C.cyanDeep}" fill-opacity="${accent ? 0.3 : 0.18}"/>`,
    `<path d="${top}" fill="${C.panelRaised}" stroke="${edge}" stroke-opacity="${accent ? 0.95 : 0.5}" stroke-width="${accent ? 1.6 : 1.1}"/>`,
  ].join('');
}

/** Perspective floor grid inside a rect, converging on a vanishing point at the top centre. */
export function perspectiveFloor(x: number, y: number, w: number, h: number, cols = 16, rows = 6, opacity = 0.12): string {
  const vx = x + w / 2;
  const d: string[] = [];
  for (let i = 0; i <= cols; i++) {
    const bx = x + (w * i) / cols;
    const tx = vx + (bx - vx) * 0.25;
    d.push(`M${r(tx)} ${r(y)}L${r(bx)} ${r(y + h)}`);
  }
  for (let j = 1; j <= rows; j++) {
    const t = (j / rows) ** 2;
    const yy = y + h * t;
    const half = (w / 2) * (0.25 + 0.75 * t);
    d.push(`M${r(vx - half)} ${r(yy)}H${r(vx + half)}`);
  }
  return `<path d="${d.join('')}" stroke="${C.cyan}" stroke-opacity="${opacity}" fill="none"/>`;
}
