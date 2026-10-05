import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
export const ASSETS = join(ROOT, 'assets');
export const PANELS_DIR = join(ASSETS, 'panels');
export const LOGOS_DIR = join(ASSETS, 'logos');
export const DIVIDERS_DIR = join(ASSETS, 'dividers');
export const INPUTS = join(ROOT, 'inputs');
export const DOCS = join(ROOT, 'docs');
