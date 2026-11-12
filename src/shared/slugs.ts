import type { Product } from './types';

export function slugify(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export function productSlug(product: Product): string {
  const label = [
    product.marque,
    product.gamme || product.sous_reference,
    product.viscosite,
    product.litrage,
  ]
    .filter(Boolean)
    .join(' ');
  const idSuffix = product.id;
  return `${slugify(label) || 'produit'}--${idSuffix}`;
}

export function productIdFromSlug(slug: string): string | null {
  const marker = slug.indexOf('--');
  if (marker < 0) return null;
  const id = slug.slice(marker + 2);
  return /^[a-z0-9][a-z0-9_-]{0,79}$/i.test(id) ? id : null;
}
