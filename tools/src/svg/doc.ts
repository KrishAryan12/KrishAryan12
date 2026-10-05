/**
 * Standalone SVG document builder.
 *
 * Every panel is a self-contained dark card: own background, inlined CSS animation, outlined text,
 * no external references. Reduced-motion users get the panel's designed still frame, declared via
 * `still` CSS that runs inside `@media (prefers-reduced-motion: reduce)`.
 */
import { GlyphAtlas } from './text.ts';
import { glowDefs } from './glow.ts';

export interface SvgDocOpts {
  width: number;
  height: number;
  title: string;
  desc?: string;
  /** Animation CSS (keyframes and selectors). */
  css?: string;
  /** CSS applied under prefers-reduced-motion: freeze on the designed still frame. */
  still?: string;
  /** Which glow filters to include. */
  glows?: Array<'cyan' | 'orange' | 'soft'>;
  extraDefs?: string;
}

export class SvgDoc {
  readonly atlas = new GlyphAtlas();
  private body: string[] = [];
  constructor(readonly o: SvgDocOpts) {}

  add(...fragments: string[]): this {
    this.body.push(...fragments);
    return this;
  }

  text(...args: Parameters<GlyphAtlas['text']>): string {
    return this.atlas.text(...args);
  }

  render(): string {
    const { width, height, title, desc, css, still, glows = [], extraDefs = '' } = this.o;
    const styleParts: string[] = [];
    if (css) styleParts.push(css);
    // Freeze every animation, then let the panel restore its designed still frame.
    styleParts.push(
      `@media (prefers-reduced-motion: reduce){*{animation:none!important}${still ?? ''}}`,
    );
    const style = `<style>${minifyCss(styleParts.join(''))}</style>`;
    return [
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" role="img" aria-labelledby="t">`,
      `<title id="t">${esc(title)}</title>`,
      desc ? `<desc>${esc(desc)}</desc>` : '',
      style,
      `<defs>${glowDefs(glows)}${extraDefs}${this.atlas.defsMarkup()}</defs>`,
      ...this.body,
      `</svg>`,
    ].join('');
  }
}

export function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function minifyCss(css: string): string {
  return css.replace(/\s+/g, ' ').replace(/\s*([{}:;,>])\s*/g, '$1').replace(/;}/g, '}').trim();
}

/** Round to one decimal for compact markup. */
export function r(n: number): string {
  const v = Math.round(n * 10) / 10;
  return Object.is(v, -0) ? '0' : String(v);
}
