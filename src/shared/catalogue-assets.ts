import type { Product } from './types';
import catalogue from '../../public/catalogue.json';
import additionalBrandCatalogue from '../../public/catalogue-2026-brands.json';

const bundledCatalogue = [
  ...(catalogue as Product[]).filter((product) => product.marque !== 'Valvoline'),
  ...(additionalBrandCatalogue as Product[]),
];

/** Read the bundled product snapshot for image-only rendering outside catalogue cards. */
export function getBundledProductById(id: string): Product | null {
  const normalizedId = id.trim().toLowerCase();
  if (!normalizedId) return null;
  return bundledCatalogue.find((product) => product.id.toLowerCase() === normalizedId) ?? null;
}
