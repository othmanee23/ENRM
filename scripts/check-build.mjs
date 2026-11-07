import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { createHash } from 'node:crypto';
const root = resolve('dist');
const pages = readdirSync(root).filter((f) => f.endsWith('.html'));
const errors = [];
for (const page of pages) {
  const html = readFileSync(resolve(root, page), 'utf8');
  for (const [, ref] of html.matchAll(/\b(?:href|src|poster)="([^"]+)"/g)) {
    if (/^(?:[a-z]+:|#|\/\/)/i.test(ref)) continue;
    const path = decodeURIComponent(ref.split(/[?#]/)[0]).replace(/^\//, '');
    if (path && !existsSync(resolve(root, path))) errors.push(`${page}: ${ref}`);
  }
  if (/layout:|src\/.*\.ts|app\.js\?/.test(html))
    errors.push(`${page}: unresolved source reference`);
}
const catalogue = JSON.parse(readFileSync(resolve(root, 'catalogue.json'), 'utf8'));
if (catalogue.length !== 210 || new Set(catalogue.map((p) => p.id)).size !== 210)
  errors.push('Catalogue identity mismatch');
for (const p of catalogue)
  for (const field of ['recto', 'verso'])
    if (p[field] && !existsSync(resolve(root, p[field]))) errors.push(`${p.id}: ${p[field]}`);
for (const file of [
  'assets/fonts/inter-tight.css',
  'assets/logo.svg',
  'assets/media/hero-oil.mp4',
  'admin.html',
])
  if (!existsSync(resolve(root, file))) errors.push(`Missing ${file}`);
if (pages.length !== 11) errors.push(`Expected 11 pages, found ${pages.length}`);
const sourceHash = createHash('sha256').update(readFileSync('public/catalogue.json')).digest('hex');
const outputHash = createHash('sha256')
  .update(readFileSync(resolve(root, 'catalogue.json')))
  .digest('hex');
if (sourceHash !== outputHash) errors.push('Catalogue changed during build');
if (errors.length) throw new Error(errors.join('\n'));
console.log(
  `PASS — ${pages.length} production pages, 210 unchanged variants, local links and media verified.`,
);
