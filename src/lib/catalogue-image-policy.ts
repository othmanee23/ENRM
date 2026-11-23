import catalogueData from '../../public/catalogue.json';
import additionalBrandData from '../../public/catalogue-2026-brands.json';
import type { Product } from '../shared/types';

// Valvoline rows in the original catalogue stay as drafts without images. Overlay
// them with audited packshots and add Ravenol without duplicating existing IDs.
const bundledProducts = [
  ...(catalogueData as Product[]).filter((product) => product.marque !== 'Valvoline'),
  ...(additionalBrandData as Product[]),
];
const bundledById = new Map(bundledProducts.map((product) => [product.id, product]));

/** Products without an approved front packshot stay available to admins, never the storefront. */
export const publicProductImageIds = bundledProducts
  .filter((product) => {
    const status = product.statut_recto.toLocaleLowerCase('fr');
    return (
      Boolean(product.recto.trim()) &&
      !status.includes('générique') &&
      product.is_published !== false &&
      product.show_on_website !== false
    );
  })
  .map((product) => product.id);

export function hasApprovedProductImage(product: Product): boolean {
  return publicProductImageIds.includes(product.id);
}

/** Prefer the reviewed, version-controlled packshot over stale URLs stored in Supabase. */
export function withCuratedProductImage(product: Product): Product {
  const bundled = bundledById.get(product.id);
  if (
    !bundled ||
    !bundled.recto ||
    bundled.statut_recto.toLocaleLowerCase('fr').includes('générique')
  ) {
    return product;
  }
  return { ...product, recto: bundled.recto, statut_recto: bundled.statut_recto };
}

export function withCuratedProductImages(products: Product[]): Product[] {
  return products.filter(hasApprovedProductImage).map(withCuratedProductImage);
}
