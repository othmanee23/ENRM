import 'server-only';

import importedCatalogue from '../../public/catalogue.json';
import { createSupabasePublicClient } from './supabase/public';
import type { Category, Product } from '../shared/types';
import { productIdFromSlug, productSlug } from '../shared/slugs';
import {
  hasApprovedProductImage,
  publicProductImageIds,
  withCuratedProductImages,
} from './catalogue-image-policy';
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

export async function getPublicCatalogue(): Promise<Product[]> {
  const supabase = createSupabasePublicClient();
  if (!supabase) return fallbackCatalogue.filter(hasApprovedProductImage);

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
      return fallbackCatalogue.filter(hasApprovedProductImage);
    }
    throw new Error(`Catalogue inaccessible: ${error.message}`);
  }
  if (!Array.isArray(data)) throw new Error('Catalogue invalide.');
  return withCuratedProductImages(data as Product[]);
}

export async function getPublicProductsByIds(ids: string[]): Promise<Product[]> {
  const uniqueIds = [...new Set(ids.filter(Boolean))];
  if (!uniqueIds.length) return [];
  const eligibleIds = uniqueIds.filter((id) => publicProductImageIds.includes(id));
  if (!eligibleIds.length) return [];
  const supabase = createSupabasePublicClient();
  if (!supabase)
    return eligibleIds.flatMap((id) => fallbackCatalogue.filter((product) => product.id === id));
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .in('id', eligibleIds)
    .eq('is_published', true)
    .eq('show_on_website', true);
  if (error) {
    if (localDevelopment)
      return eligibleIds.flatMap((id) => fallbackCatalogue.filter((product) => product.id === id));
    throw new Error(`Références du catalogue inaccessibles: ${error.message}`);
  }
  return withCuratedProductImages((data || []) as Product[]);
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
        candidate.sous_reference === product.sous_reference &&
        candidate.viscosite === product.viscosite,
    );
  if (!supabase) {
    const all = fallbackCatalogue.filter(hasApprovedProductImage);
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
      .in('id', publicProductImageIds)
      .eq('marque', product.marque);
  const [variantResult, relatedResult] = await Promise.all([
    base()
      .eq('gamme', product.gamme)
      .eq('sous_reference', product.sous_reference)
      .eq('viscosite', product.viscosite)
      .order('id')
      .limit(60),
    base().neq('id', product.id).order('id').limit(5),
  ]);
  if (variantResult.error || relatedResult.error) {
    if (localDevelopment)
      return [
        ...new Map(
          [
            ...variants(fallbackCatalogue.filter(hasApprovedProductImage)),
            ...related(fallbackCatalogue.filter(hasApprovedProductImage)).slice(0, 5),
          ].map((item) => [item.id, item]),
        ).values(),
      ];
    throw new Error(
      `Références associées inaccessibles: ${(variantResult.error || relatedResult.error)?.message}`,
    );
  }
  return [
    ...new Map(
      [
        ...withCuratedProductImages((variantResult.data || []) as Product[]),
        ...withCuratedProductImages((relatedResult.data || []) as Product[]),
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
      brands: [
        ...new Set(
          fallbackCatalogue.filter(hasApprovedProductImage).map((product) => product.marque),
        ),
      ].sort(),
      ranges: [
        ...new Set(
          fallbackCatalogue
            .filter(hasApprovedProductImage)
            .map((product) => product.gamme)
            .filter(Boolean),
        ),
      ].sort(),
      viscosities: [
        ...new Set(
          fallbackCatalogue
            .filter(hasApprovedProductImage)
            .map((product) => product.viscosite)
            .filter(Boolean),
        ),
      ].sort(),
      volumes: [
        ...new Set(
          fallbackCatalogue
            .filter(hasApprovedProductImage)
            .map((product) => product.litrage)
            .filter(Boolean),
        ),
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
    brands: [
      ...new Set(
        fallbackCatalogue.filter(hasApprovedProductImage).map((product) => product.marque),
      ),
    ].sort(),
    ranges: [
      ...new Set(
        fallbackCatalogue
          .filter(hasApprovedProductImage)
          .map((product) => product.gamme)
          .filter(Boolean),
      ),
    ].sort(),
    viscosities: [
      ...new Set(
        fallbackCatalogue
          .filter(hasApprovedProductImage)
          .map((product) => product.viscosite)
          .filter(Boolean),
      ),
    ].sort(),
    volumes: [
      ...new Set(
        fallbackCatalogue
          .filter(hasApprovedProductImage)
          .map((product) => product.litrage)
          .filter(Boolean),
      ),
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
        hasApprovedProductImage(product) &&
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
    // A newly-created Postgres RPC can briefly be absent from PostgREST's schema cache.
    // Use the equivalent paginated table query during that specific rollout condition so
    // a stale RPC cache cannot turn public catalogue pages into HTTP 500 responses.
    if (error.code === 'PGRST202') {
      console.warn(
        'Catalogue RPC is not in the PostgREST schema cache; using paginated table query.',
      );
      return getPublicCataloguePageFromTable(supabase, { ...options, page, pageSize, sort });
    }
    throw new Error(`Catalogue inaccessible: ${error.message}`);
  }
  const payload = data as { rows?: unknown; total?: number } | null;
  if (!payload || !Array.isArray(payload.rows)) throw new Error('Catalogue invalide.');
  return {
    rows: withCuratedProductImages(payload.rows as Product[]),
    total: Number(payload.total || 0),
    page,
    pageSize,
  };
}

async function getPublicCataloguePageFromTable(
  supabase: NonNullable<ReturnType<typeof createSupabasePublicClient>>,
  options: {
    page: number;
    pageSize: number;
    query?: string;
    categoryId?: string;
    brand?: string;
    range?: string;
    viscosity?: string;
    volume?: string;
    sort: string;
  },
): Promise<PublicCataloguePage> {
  const queryText = (options.query || '')
    .replace(/[^\p{L}\p{N}\s_-]/gu, ' ')
    .trim()
    .replace(/\s+/g, ' ')
    .slice(0, 100);
  let request = supabase
    .from('products')
    .select('*', { count: 'exact' })
    .eq('is_published', true)
    .eq('show_on_website', true)
    .in('id', publicProductImageIds);
  if (options.categoryId) request = request.eq('category_id', options.categoryId);
  if (options.brand) request = request.eq('marque', options.brand);
  if (options.range) request = request.eq('gamme', options.range);
  if (options.viscosity) request = request.eq('viscosite', options.viscosity);
  if (options.volume) request = request.eq('litrage', options.volume);
  if (queryText) {
    const pattern = `*${queryText.replace(/\s+/g, '*')}*`;
    request = request.or(
      [
        `marque.ilike.${pattern}`,
        `gamme.ilike.${pattern}`,
        `sous_reference.ilike.${pattern}`,
        `viscosite.ilike.${pattern}`,
        `litrage.ilike.${pattern}`,
        `designation.ilike.${pattern}`,
        `references_articles.ilike.${pattern}`,
        `id.ilike.${pattern}`,
      ].join(','),
    );
  }
  if (options.sort === 'price-up') request = request.order('price').order('id');
  else if (options.sort === 'price-down')
    request = request.order('price', { ascending: false }).order('id');
  else if (options.sort === 'name')
    request = request.order('marque').order('sous_reference').order('id');
  else request = request.order('id');

  const from = (options.page - 1) * options.pageSize;
  const { data, error, count } = await request.range(from, from + options.pageSize - 1);
  if (error) throw new Error(`Catalogue inaccessible: ${error.message}`);
  return {
    rows: withCuratedProductImages((data || []) as Product[]),
    total: count || 0,
    page: options.page,
    pageSize: options.pageSize,
  };
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
      hasApprovedProductImage(product) &&
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
  const candidateIds = [...new Set([id, id.toUpperCase()])];
  if (!candidateIds.some((candidateId) => publicProductImageIds.includes(candidateId))) return null;
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
      .in('id', publicProductImageIds)
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
    if (data) return withCuratedProductImages([data as Product])[0] ?? null;
  }
  return null;
}

export async function getProductById(id: string): Promise<Product | null> {
  if (!publicProductImageIds.includes(id)) return null;
  const supabase = createSupabasePublicClient();
  if (!supabase) return fallbackCatalogue.find((product) => product.id === id) ?? null;
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .in('id', publicProductImageIds)
    .eq('is_published', true)
    .eq('show_on_website', true)
    .maybeSingle();
  if (error) {
    if (localDevelopment) return fallbackCatalogue.find((product) => product.id === id) ?? null;
    throw new Error(`Référence inaccessible: ${error.message}`);
  }
  return data ? (withCuratedProductImages([data as Product])[0] ?? null) : null;
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
  return fallbackCatalogue.filter(hasApprovedProductImage);
}
