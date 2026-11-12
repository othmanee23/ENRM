import 'server-only';

import importedCatalogue from '../../public/catalogue.json';
import { createSupabasePublicClient } from './supabase/public';
import type { Category, Product } from '../shared/types';
import { productIdFromSlug, productSlug } from '../shared/slugs';
export { productSlug } from '../shared/slugs';

const fallbackCatalogue = importedCatalogue as Product[];
const localDevelopment = process.env.NODE_ENV === 'development';
const fallbackCategory: Category = {
  id: '00000000-0000-4000-8000-000000000001',
  parent_id: null,
  name: 'Huiles moteur',
  slug: 'huiles-moteur',
  sort_order: 10,
  is_active: true,
};
export const DEFAULT_CATEGORY_ID = '00000000-0000-4000-8000-000000000001';
export const hasSupabaseConfig = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim(),
);

export function formatMad(value: number): string {
  return new Intl.NumberFormat('fr-MA', { maximumFractionDigits: 2 }).format(value);
}

export async function getPublicCatalogue(): Promise<Product[]> {
  const supabase = createSupabasePublicClient();
  if (!supabase) return fallbackCatalogue;

  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('is_published', true)
    .eq('show_on_website', true)
    .order('id')
    .range(0, 999);
  if (error) {
    if (localDevelopment) {
      console.warn('Supabase catalogue unavailable in local development; using bundled catalogue.');
      return fallbackCatalogue;
    }
    throw new Error(`Catalogue inaccessible: ${error.message}`);
  }
  if (!Array.isArray(data)) throw new Error('Catalogue invalide.');
  return data as Product[];
}

export async function getPublicProductsByIds(ids: string[]): Promise<Product[]> {
  const uniqueIds = [...new Set(ids.filter(Boolean))];
  if (!uniqueIds.length) return [];
  const supabase = createSupabasePublicClient();
  if (!supabase)
    return uniqueIds.flatMap((id) => fallbackCatalogue.filter((product) => product.id === id));
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .in('id', uniqueIds)
    .eq('is_published', true)
    .eq('show_on_website', true);
  if (error) {
    if (localDevelopment)
      return uniqueIds.flatMap((id) => fallbackCatalogue.filter((product) => product.id === id));
    throw new Error(`Références du catalogue inaccessibles: ${error.message}`);
  }
  return (data || []) as Product[];
}

export async function getPublicHomeProducts(): Promise<Product[]> {
  const [featured, grade530, litre, grade540] = await Promise.all([
    getPublicProductsByIds([
      'ENRM-HM-097',
      'ENRM-HM-067',
      'ENRM-HM-031',
      'ENRM-HM-006',
      'ENRM-HM-135',
      'ENRM-HM-155',
      'ENRM-HM-069',
      'ENRM-HM-156',
    ]),
    getPublicCataloguePage({ page: 1, pageSize: 6, viscosity: '5W-30', volume: '5 L' }),
    getPublicCataloguePage({ page: 1, pageSize: 6, volume: '1 L' }),
    getPublicCataloguePage({ page: 1, pageSize: 6, viscosity: '5W-40', volume: '5 L' }),
  ]);
  return [
    ...new Map(
      [...featured, ...grade530.rows, ...litre.rows, ...grade540.rows].map((product) => [
        product.id,
        product,
      ]),
    ).values(),
  ];
}

export async function getPublicProductContext(product: Product): Promise<Product[]> {
  const supabase = createSupabasePublicClient();
  const related = (products: Product[]) =>
    products.filter(
      (candidate) => candidate.id !== product.id && candidate.marque === product.marque,
    );
  const variants = (products: Product[]) =>
    products.filter(
      (candidate) =>
        candidate.marque === product.marque &&
        candidate.gamme === product.gamme &&
        candidate.viscosite === product.viscosite,
    );
  if (!supabase) {
    const all = fallbackCatalogue;
    return [
      ...new Map(
        [...variants(all), ...related(all).slice(0, 5)].map((item) => [item.id, item]),
      ).values(),
    ];
  }
  const base = () =>
    supabase
      .from('products')
      .select('*')
      .eq('is_published', true)
      .eq('show_on_website', true)
      .eq('marque', product.marque);
  const [variantResult, relatedResult] = await Promise.all([
    base().eq('gamme', product.gamme).eq('viscosite', product.viscosite).order('id').limit(60),
    base().neq('id', product.id).order('id').limit(5),
  ]);
  if (variantResult.error || relatedResult.error) {
    if (localDevelopment)
      return [
        ...new Map(
          [...variants(fallbackCatalogue), ...related(fallbackCatalogue).slice(0, 5)].map(
            (item) => [item.id, item],
          ),
        ).values(),
      ];
    throw new Error(
      `Références associées inaccessibles: ${(variantResult.error || relatedResult.error)?.message}`,
    );
  }
  return [
    ...new Map(
      [
        ...((variantResult.data || []) as Product[]),
        ...((relatedResult.data || []) as Product[]),
      ].map((item) => [item.id, item]),
    ).values(),
  ];
}

export interface CatalogueFacets {
  brands: string[];
  ranges: string[];
  viscosities: string[];
  volumes: string[];
}

export interface PublicCataloguePage {
  rows: Product[];
  total: number;
  page: number;
  pageSize: number;
}

export async function getPublicCatalogueFacets(): Promise<CatalogueFacets> {
  const supabase = createSupabasePublicClient();
  if (!supabase) {
    return {
      brands: [...new Set(fallbackCatalogue.map((product) => product.marque))].sort(),
      ranges: [
        ...new Set(fallbackCatalogue.map((product) => product.gamme).filter(Boolean)),
      ].sort(),
      viscosities: [
        ...new Set(fallbackCatalogue.map((product) => product.viscosite).filter(Boolean)),
      ].sort(),
      volumes: [
        ...new Set(fallbackCatalogue.map((product) => product.litrage).filter(Boolean)),
      ].sort(),
    };
  }
  const { data, error } = await supabase.rpc('get_enrm_catalogue_facets');
  if (error) {
    if (localDevelopment) return getPublicCatalogueFacetsFallback();
    throw new Error(`Filtres du catalogue inaccessibles: ${error.message}`);
  }
  return {
    brands: Array.isArray(data?.brands) ? data.brands : [],
    ranges: Array.isArray(data?.ranges) ? data.ranges : [],
    viscosities: Array.isArray(data?.viscosities) ? data.viscosities : [],
    volumes: Array.isArray(data?.volumes) ? data.volumes : [],
  };
}

function getPublicCatalogueFacetsFallback(): CatalogueFacets {
  return {
    brands: [...new Set(fallbackCatalogue.map((product) => product.marque))].sort(),
    ranges: [...new Set(fallbackCatalogue.map((product) => product.gamme).filter(Boolean))].sort(),
    viscosities: [
      ...new Set(fallbackCatalogue.map((product) => product.viscosite).filter(Boolean)),
    ].sort(),
    volumes: [
      ...new Set(fallbackCatalogue.map((product) => product.litrage).filter(Boolean)),
    ].sort(),
  };
}

export async function getPublicCataloguePage(options: {
  page?: number;
  pageSize?: number;
  query?: string;
  categoryId?: string;
  brand?: string;
  range?: string;
  viscosity?: string;
  volume?: string;
  sort?: string;
}): Promise<PublicCataloguePage> {
  const page = Math.max(1, Math.floor(options.page || 1));
  const pageSize = Math.min(60, Math.max(1, Math.floor(options.pageSize || 12)));
  const sort = ['price-up', 'price-down', 'name'].includes(options.sort || '')
    ? options.sort!
    : 'selection';
  const supabase = createSupabasePublicClient();
  if (!supabase) {
    const q = searchText(options.query || '');
    let matched = fallbackCatalogue.filter(
      (product) =>
        (!q ||
          searchText(
            [
              product.marque,
              product.gamme,
              product.sous_reference,
              product.viscosite,
              product.litrage,
              product.designation,
              product.references_articles,
              product.id,
            ].join(' '),
          ).includes(q)) &&
        (!options.categoryId ||
          (product.category_id || DEFAULT_CATEGORY_ID) === options.categoryId) &&
        (!options.brand || product.marque === options.brand) &&
        (!options.range || product.gamme === options.range) &&
        (!options.viscosity || product.viscosite === options.viscosity) &&
        (!options.volume || product.litrage === options.volume),
    );
    if (sort === 'price-up')
      matched = matched.sort((a, b) => a.price - b.price || a.id.localeCompare(b.id));
    else if (sort === 'price-down')
      matched = matched.sort((a, b) => b.price - a.price || a.id.localeCompare(b.id));
    else if (sort === 'name')
      matched = matched.sort(
        (a, b) =>
          `${a.marque} ${a.sous_reference}`.localeCompare(
            `${b.marque} ${b.sous_reference}`,
            'fr',
          ) || a.id.localeCompare(b.id),
      );
    else matched = matched.sort((a, b) => a.id.localeCompare(b.id));
    return {
      rows: matched.slice((page - 1) * pageSize, page * pageSize),
      total: matched.length,
      page,
      pageSize,
    };
  }
  const { data, error } = await supabase.rpc('get_enrm_catalogue_page', {
    p_page: page,
    p_page_size: pageSize,
    p_query: options.query || '',
    p_category_id: options.categoryId || null,
    p_brand: options.brand || '',
    p_range: options.range || '',
    p_viscosity: options.viscosity || '',
    p_volume: options.volume || '',
    p_sort: sort,
  });
  if (error) {
    if (localDevelopment) {
      const fallback = await getPublicCataloguePageFallback({ ...options, page, pageSize, sort });
      return fallback;
    }
    throw new Error(`Catalogue inaccessible: ${error.message}`);
  }
  const payload = data as { rows?: unknown; total?: number } | null;
  if (!payload || !Array.isArray(payload.rows)) throw new Error('Catalogue invalide.');
  return { rows: payload.rows as Product[], total: Number(payload.total || 0), page, pageSize };
}

async function getPublicCataloguePageFallback(options: {
  page: number;
  pageSize: number;
  query?: string;
  categoryId?: string;
  brand?: string;
  range?: string;
  viscosity?: string;
  volume?: string;
  sort: string;
}): Promise<PublicCataloguePage> {
  const q = searchText(options.query || '');
  let matched = fallbackCatalogue.filter(
    (product) =>
      (!q ||
        searchText(
          [
            product.marque,
            product.gamme,
            product.sous_reference,
            product.viscosite,
            product.litrage,
            product.designation,
            product.references_articles,
            product.id,
          ].join(' '),
        ).includes(q)) &&
      (!options.categoryId ||
        (product.category_id || DEFAULT_CATEGORY_ID) === options.categoryId) &&
      (!options.brand || product.marque === options.brand) &&
      (!options.range || product.gamme === options.range) &&
      (!options.viscosity || product.viscosite === options.viscosity) &&
      (!options.volume || product.litrage === options.volume),
  );
  if (options.sort === 'price-up')
    matched = matched.sort((a, b) => a.price - b.price || a.id.localeCompare(b.id));
  else if (options.sort === 'price-down')
    matched = matched.sort((a, b) => b.price - a.price || a.id.localeCompare(b.id));
  else if (options.sort === 'name')
    matched = matched.sort(
      (a, b) =>
        `${a.marque} ${a.sous_reference}`.localeCompare(`${b.marque} ${b.sous_reference}`, 'fr') ||
        a.id.localeCompare(b.id),
    );
  else matched = matched.sort((a, b) => a.id.localeCompare(b.id));
  return {
    rows: matched.slice((options.page - 1) * options.pageSize, options.page * options.pageSize),
    total: matched.length,
    page: options.page,
    pageSize: options.pageSize,
  };
}

export async function getPublicProductBySlug(slug: string): Promise<Product | null> {
  const id = productIdFromSlug(slug);
  if (!id) return null;
  const supabase = createSupabasePublicClient();
  if (!supabase)
    return (
      fallbackCatalogue.find((product) => product.id === id) ??
      fallbackCatalogue.find((product) => product.id === id.toUpperCase()) ??
      null
    );

  const ids = [...new Set([id, id.toUpperCase()])];
  for (const candidateId of ids) {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', candidateId)
      .eq('is_published', true)
      .eq('show_on_website', true)
      .maybeSingle();
    if (error) {
      if (localDevelopment)
        return (
          fallbackCatalogue.find((product) => product.id === id) ??
          fallbackCatalogue.find((product) => product.id === id.toUpperCase()) ??
          null
        );
      throw new Error(`Référence inaccessible: ${error.message}`);
    }
    if (data) return data as Product;
  }
  return null;
}

export async function getProductById(id: string): Promise<Product | null> {
  const supabase = createSupabasePublicClient();
  if (!supabase) return fallbackCatalogue.find((product) => product.id === id) ?? null;
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .eq('is_published', true)
    .eq('show_on_website', true)
    .maybeSingle();
  if (error) {
    if (localDevelopment) return fallbackCatalogue.find((product) => product.id === id) ?? null;
    throw new Error(`Référence inaccessible: ${error.message}`);
  }
  return (data as Product | null) ?? null;
}

export async function getPublicCategories(): Promise<Category[]> {
  const supabase = createSupabasePublicClient();
  if (!supabase) return [fallbackCategory];

  const { data, error } = await supabase
    .from('categories')
    .select('id,parent_id,name,slug,sort_order,is_active')
    .eq('is_active', true)
    .order('sort_order')
    .order('name');
  if (error) {
    if (localDevelopment) return [fallbackCategory];
    throw new Error(`Catégories inaccessibles: ${error.message}`);
  }
  return (data ?? []) as Category[];
}

export function searchText(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

export function getFallbackCatalogue(): Product[] {
  return fallbackCatalogue;
}
