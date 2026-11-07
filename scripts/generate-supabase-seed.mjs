import { readFile, writeFile } from 'node:fs/promises';

const catalogue = JSON.parse(
  await readFile(new URL('../public/catalogue.json', import.meta.url), 'utf8'),
);
const categoryId = '00000000-0000-4000-8000-000000000001';
const columns = [
  'id',
  'category_id',
  'marque',
  'gamme',
  'sous_reference',
  'viscosite',
  'litrage',
  'designation',
  'price',
  'recto',
  'verso',
  'statut_recto',
  'statut_verso',
  'references_articles',
  'reference_image',
  'origine_image',
  'preuves_maroc',
  'source_recto',
  'source_verso',
  'url_recto',
  'url_verso',
  'photo_revendeur_url',
  'note',
  'is_published',
  'show_on_website',
];
const sqlValue = (value) => {
  if (typeof value === 'number') return String(value);
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (value === null || value === undefined) return 'null';
  return `'${String(value).replaceAll("'", "''")}'`;
};
const rows = catalogue.map((product) =>
  [
    product.id,
    categoryId,
    product.marque,
    product.gamme,
    product.sous_reference,
    product.viscosite,
    product.litrage,
    product.designation,
    product.price,
    product.recto,
    product.verso,
    product.statut_recto,
    product.statut_verso,
    product.references_articles,
    product.reference_image,
    product.origine_image,
    product.preuves_maroc,
    product.source_recto,
    product.source_verso,
    product.url_recto,
    product.url_verso,
    product.photo_revendeur_url,
    product.note,
    true,
    true,
  ].map(sqlValue),
);

const sql = [
  '-- Generated from public/catalogue.json by scripts/generate-supabase-seed.mjs.',
  '-- Demo prices and the initial category assignment require business review before production.',
  `insert into public.products (${columns.join(', ')}) values`,
  rows.map((row) => `  (${row.join(', ')})`).join(',\n'),
  'on conflict (id) do update set',
  columns
    .filter((column) => column !== 'id')
    .map((column) => `  ${column} = excluded.${column}`)
    .join(',\n'),
  '  , updated_at = now();',
  '',
].join('\n');
await writeFile(new URL('../supabase/seed.sql', import.meta.url), sql);
console.log(`Generated Supabase seed for ${catalogue.length} products.`);
