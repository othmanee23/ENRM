import type { Product } from './types';
export function isProduct(value: unknown): value is Product {
  if (!value || typeof value !== 'object') return false;
  const p = value as Record<string, unknown>;
  return (
    [
      'id',
      'marque',
      'sous_reference',
      'viscosite',
      'litrage',
      'recto',
      'verso',
      'statut_recto',
    ].every((k) => typeof p[k] === 'string') &&
    typeof p.price === 'number' &&
    Number.isFinite(p.price) &&
    p.price >= 0
  );
}
export async function loadCatalogue(): Promise<Product[]> {
  const response = await fetch('/catalogue.json');
  if (!response.ok) throw new Error(`Catalogue inaccessible (${response.status})`);
  const values: unknown = await response.json();
  if (!Array.isArray(values) || !values.every(isProduct)) throw new Error('Catalogue invalide');
  return values;
}
export function productGroup(p: Product): string {
  return [p.marque, p.gamme, p.sous_reference, p.viscosite].join('|');
}
export function requireProduct<T extends Product>(products: T[], id: string): T {
  const product = products.find((p) => p.id === id);
  if (!product) throw new Error(`Unknown product: ${id}`);
  return product;
}
export function requireById<T extends { id: string }>(items: T[], id: string): T {
  const item = items.find((x) => x.id === id);
  if (!item) throw new Error(`Unknown record: ${id}`);
  return item;
}
export function emptyProduct(): Product {
  return {
    id: '',
    marque: '',
    gamme: '',
    sous_reference: '',
    viscosite: '',
    litrage: '',
    designation: '',
    price: 0,
    recto: '',
    verso: '',
    statut_recto: 'À obtenir',
    statut_verso: 'À obtenir',
    references_articles: '',
    reference_image: '',
    origine_image: '',
    preuves_maroc: '',
    source_recto: '',
    source_verso: '',
    url_recto: '',
    url_verso: '',
    photo_revendeur_url: '',
    note: '',
  };
}
