import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT } from '../lib/paths.ts';
import { tokens } from './tokens.ts';

writeFileSync(join(ROOT, 'tokens.json'), JSON.stringify(tokens, null, 2) + '\n');
console.log('tokens.json written');
