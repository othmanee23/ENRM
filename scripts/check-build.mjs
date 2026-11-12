import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';

const worker = resolve('.open-next/worker.js');
const assets = resolve('.open-next/assets');
const outputCatalogue = resolve(assets, 'catalogue.json');
const sourceCatalogue = resolve('public/catalogue.json');
const errors = [];

if (!existsSync(worker)) errors.push('Missing OpenNext Worker bundle: .open-next/worker.js');
if (!existsSync(resolve(assets, 'BUILD_ID')))
  errors.push('Missing OpenNext static asset manifest.');
if (!existsSync(outputCatalogue)) errors.push('Missing copied catalogue in OpenNext assets.');

const catalogue = JSON.parse(readFileSync(sourceCatalogue, 'utf8'));
if (catalogue.length !== 210 || new Set(catalogue.map((product) => product.id)).size !== 210)
  errors.push('Source catalogue must contain 210 unique product IDs.');

if (existsSync(outputCatalogue)) {
  const sourceHash = createHash('sha256').update(readFileSync(sourceCatalogue)).digest('hex');
  const outputHash = createHash('sha256').update(readFileSync(outputCatalogue)).digest('hex');
  if (sourceHash !== outputHash) errors.push('Catalogue changed while creating the Worker bundle.');
}

for (const file of [
  'assets/logo.svg',
  'assets/fonts/inter-tight.css',
  'assets/media/hero-oil.mp4',
  'assets/brands/Castrol.svg',
]) {
  if (!existsSync(resolve(assets, file))) errors.push(`Missing deployed asset: ${file}`);
}

for (const product of catalogue) {
  for (const field of ['recto', 'verso']) {
    if (product[field] && !existsSync(resolve(assets, product[field])))
      errors.push(`${product.id}: missing packaged ${field} image ${product[field]}`);
  }
}

if (errors.length) throw new Error(errors.join('\n'));
console.log('PASS — OpenNext Worker, public assets, and all 210 catalogue records verified.');
