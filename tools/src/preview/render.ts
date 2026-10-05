/**
 * Builds a local page that approximates GitHub's README rendering: github-markdown-css in light
 * or dark, the same ~880 px column, relative image paths, and HTML stripped to GitHub's allowed
 * subset (no <style>, no inline style, no scripts). It is an approximation; github.com is the authority.
 */
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import { marked } from 'marked';
import { ROOT } from '../lib/paths.ts';

const require = createRequire(import.meta.url);

export type Theme = 'light' | 'dark';

/** Remove what GitHub's sanitiser would remove, so the preview cannot flatter us. */
export function sanitizeLikeGitHub(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, '')
    .replace(/\sstyle="[^"]*"/gi, '')
    .replace(/\son\w+="[^"]*"/gi, '');
}

export function previewHtml(theme: Theme, readmePath = join(ROOT, 'README.md')): string {
  const md = readFileSync(readmePath, 'utf8');
  const body = sanitizeLikeGitHub(marked.parse(md, { gfm: true, async: false }) as string);
  const cssFile = theme === 'dark' ? 'github-markdown-dark.css' : 'github-markdown-light.css';
  const css = readFileSync(require.resolve(`github-markdown-css/${cssFile}`), 'utf8');
  const bg = theme === 'dark' ? '#0d1117' : '#ffffff';
  // GitHub caps images at the column width and lets inline images wrap.
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<base href="file:///${ROOT.replace(/\\/g, '/')}/">
<style>${css}
body{margin:0;background:${bg}}
.wrap{box-sizing:border-box;max-width:912px;margin:0 auto;padding:16px}
.markdown-body{box-sizing:border-box;border:1px solid ${theme === 'dark' ? '#30363d' : '#d0d7de'};border-radius:6px;padding:16px 16px}
@media (min-width:768px){.markdown-body{padding:32px}}
.markdown-body img{max-width:100%;box-sizing:content-box;background-color:transparent}
</style></head><body><div class="wrap"><article class="markdown-body">${body}</article></div></body></html>`;
}
