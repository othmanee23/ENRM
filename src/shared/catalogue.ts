import type { Category, Product } from './types';
import { supabase } from './supabase';
import fallbackCatalogue from '../../public/catalogue.json';
export const DEFAULT_CATEGORY_ID = '00000000-0000-4000-8000-000000000001';
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
  if (supabase) {
    const products: Product[] = [];
    for (let offset = 0; ; offset += 1000) {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_published', true)
        .eq('show_on_website', true)
        .order('id')
        .range(offset, offset + 999);
      if (error) throw new Error(`Catalogue inaccessible (${error.message})`);
      if (!Array.isArray(data) || !data.every(isProduct)) throw new Error('Catalogue invalide');
      products.push(...data);
      if (data.length < 1000) break;
    }
    return products;
  }
  const response = await fetch('/catalogue.json');
  if (!response.ok) throw new Error(`Catalogue inaccessible (${response.status})`);
  const values: unknown = await response.json();
  if (!Array.isArray(values) || !values.every(isProduct)) throw new Error('Catalogue invalide');
  return values;
}
export async function loadCatalogueProductsByIds(ids: string[]): Promise<Product[]> {
  const unique = [...new Set(ids.filter((id) => typeof id === 'string' && id.length > 0))];
  if (!unique.length) return [];
  if (
    typeof window !== 'undefined' &&
    ['localhost', '127.0.0.1'].includes(window.location.hostname)
  ) {
    return (fallbackCatalogue as Product[]).filter((product) => unique.includes(product.id));
  }
  if (!supabase)
    return (fallbackCatalogue as Product[]).filter((product) => unique.includes(product.id));
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .in('id', unique)
      .eq('is_published', true)
      .eq('show_on_website', true);
    if (error) throw new Error(`Références du panier inaccessibles (${error.message})`);
    return (data || []) as Product[];
  } catch (error) {
    if (
      typeof window !== 'undefined' &&
      ['localhost', '127.0.0.1'].includes(window.location.hostname)
    ) {
      return (fallbackCatalogue as Product[]).filter((product) => unique.includes(product.id));
    }
    throw error;
  }
}
export interface AdminPage<T> {
  rows: T[];
  total: number;
  actionableTotal?: number;
}

async function hasAdminSession() {
  if (!supabase) return false;
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();
  if (sessionError || !session) return false;
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .maybeSingle();
  return !error && profile?.role === 'admin';
}

function safeSearch(value: string) {
  return value
    .trim()
    .replace(/[^\p{L}\p{N}\s-]/gu, ' ')
    .replace(/\s+/g, ' ')
    .slice(0, 100);
}

export async function loadAdminCatalogue(options?: {
  page?: number;
  pageSize?: number;
  query?: string;
  filter?: string;
  all?: boolean;
}): Promise<
  ({ products: Product[]; stockByProductId: Map<string, number> } & AdminPage<Product>) | null
> {
  if (!supabase) return null;
  if (!(await hasAdminSession())) return null;
  const pageSize = options?.all ? 100 : Math.min(100, Math.max(1, options?.pageSize || 12));
  const page = Math.max(1, options?.page || 1);
  const query = safeSearch(options?.query || '');
  const { data, error } = await supabase.rpc('list_enrm_admin_products', {
    p_page: page,
    p_page_size: pageSize,
    p_query: query,
    p_filter: options?.filter || 'Tous',
  });
  if (error) throw new Error(`Catalogue inaccessible (${error.message})`);
  const result = (data || []) as { product: Product; quantity: number; total_count: number }[];
  if (!result.every((row) => isProduct(row.product) && Number.isInteger(row.quantity)))
    throw new Error('Catalogue invalide');
  const products = result.map((row) => row.product);
  const stockByProductId = new Map<string, number>();
  for (const row of result) stockByProductId.set(row.product.id, row.quantity);
  const total = result[0]?.total_count || 0;
  if (options?.all && total > products.length) {
    for (let nextPage = 2; (nextPage - 1) * pageSize < total; nextPage += 1) {
      const next = await loadAdminCatalogue({ ...options, all: false, page: nextPage, pageSize });
      if (!next) return null;
      products.push(...next.products);
      for (const [id, quantity] of next.stockByProductId) stockByProductId.set(id, quantity);
    }
  }
  return { products, stockByProductId, rows: products, total };
}
export interface DatabaseOrder {
  id: string;
  order_number: string;
  customer_name: string;
  phone: string;
  city: string;
  delivery_address: string;
  status: string;
  tracking_number: string;
  internal_note: string;
  created_at: string;
  order_items: {
    product_id: string;
    product_name: string;
    volume: string;
    quantity: number;
    unit_price: number;
  }[];
  status_history: {
    previous_status: string | null;
    status: string;
    created_at: string;
  }[];
}
export async function loadAdminOrders(options?: {
  page?: number;
  pageSize?: number;
  query?: string;
  filter?: string;
  all?: boolean;
}): Promise<AdminPage<DatabaseOrder> | null> {
  if (!supabase) return null;
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();
  if (sessionError || !session) return null;
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .maybeSingle();
  if (profileError || profile?.role !== 'admin') return null;

  const pageSize = options?.all ? 500 : Math.min(100, Math.max(1, options?.pageSize || 12));
  const page = Math.max(1, options?.page || 1);
  const query = safeSearch(options?.query || '');
  let request = supabase
    .from('orders')
    .select(
      'id,order_number,customer_name,phone,city,delivery_address,status,tracking_number,internal_note,created_at,order_items(product_id,product_name,volume,quantity,unit_price)',
      { count: 'exact' },
    )
    .order('created_at', { ascending: false })
    .order('id', { ascending: false });
  if (options?.filter && options.filter !== 'Tous') request = request.eq('status', options.filter);
  if (query)
    request = request.or(
      ['order_number', 'customer_name', 'phone', 'city', 'tracking_number']
        .map((field) => `${field}.ilike.%${query}%`)
        .join(','),
    );
  const { data, error, count } = await request.range((page - 1) * pageSize, page * pageSize - 1);
  if (error) throw new Error(`Commandes inaccessibles (${error.message})`);
  const orders = (data || []) as unknown as DatabaseOrder[];
  let pageActionableTotal = 0;
  if (options?.all && (count || 0) > orders.length) {
    for (let nextPage = 2; (nextPage - 1) * pageSize < (count || 0); nextPage += 1) {
      const { data: nextData, error: nextError } = await request.range(
        (nextPage - 1) * pageSize,
        nextPage * pageSize - 1,
      );
      if (nextError) throw new Error(`Commandes inaccessibles (${nextError.message})`);
      orders.push(...((nextData || []) as unknown as DatabaseOrder[]));
    }
  }
  if (!options?.all) {
    const { count: actionableTotal, error: actionableError } = await supabase
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .in('status', ['À confirmer', 'À préparer', 'En préparation']);
    if (actionableError)
      throw new Error(`Compteur des commandes inaccessible (${actionableError.message})`);
    if (!orders.length)
      return { rows: [], total: count || 0, actionableTotal: actionableTotal || 0 };
    pageActionableTotal = actionableTotal || 0;
  }
  if (!orders.length) return { rows: [], total: count || 0, actionableTotal: 0 };
  const historyByOrder = new Map<string, DatabaseOrder['status_history']>();
  const orderIds = orders.map((order) => order.id);
  for (let start = 0; start < orderIds.length; start += 200) {
    const batch = orderIds.slice(start, start + 200);
    for (let offset = 0; ; offset += 1000) {
      const { data, error } = await supabase
        .from('order_status_history')
        .select('order_id,previous_status,status,created_at')
        .in('order_id', batch)
        .order('created_at')
        .order('id')
        .range(offset, offset + 999);
      if (error) throw new Error(`Historique des commandes inaccessible (${error.message})`);
      for (const event of data || []) {
        const entries = historyByOrder.get(event.order_id) || [];
        entries.push({
          previous_status: event.previous_status,
          status: event.status,
          created_at: event.created_at,
        });
        historyByOrder.set(event.order_id, entries);
      }
      if (!data || data.length < 1000) break;
    }
  }
  for (const order of orders) order.status_history = historyByOrder.get(order.id) || [];
  const actionableTotal = options?.all
    ? orders.filter((order) =>
        ['À confirmer', 'À préparer', 'En préparation'].includes(order.status),
      ).length
    : pageActionableTotal;
  return { rows: orders, total: count || 0, actionableTotal };
}

export interface AdminCustomerRow {
  id: string;
  name: string;
  city: string;
  phone: string;
  delivery_address: string;
  request_count: number;
  subtotal: number;
  total_count: number;
}

export interface AdminDashboardSummary {
  period_days: number;
  period_order_count: number;
  period_active_order_count: number;
  period_revenue: number;
  period_average: number;
  period_customer_count: number;
  total_order_count: number;
  pending_order_count: number;
  awaiting_contact_count: number;
  total_customer_count: number;
  total_product_count: number;
  low_stock_count: number;
  out_of_stock_count: number;
  daily_revenue: { revenue: number }[];
  status_counts: { status: string; count: number }[];
  cities: { city: string; order_count: number; subtotal: number }[];
  best_products: { id: string; name: string; volume: string; quantity: number; subtotal: number }[];
  recent_orders: DatabaseOrder[];
  low_stock_products: { product: Product; quantity: number }[];
}

export async function loadAdminDashboard(
  days: number,
  until: string,
  threshold: number,
): Promise<AdminDashboardSummary | null> {
  if (!supabase || !(await hasAdminSession())) return null;
  const { data, error } = await supabase.rpc('get_enrm_admin_dashboard', {
    p_days: days,
    p_until: until,
    p_stock_threshold: threshold,
  });
  if (error) throw new Error(`Tableau de bord inaccessible (${error.message})`);
  if (!data || typeof data !== 'object' || Array.isArray(data))
    throw new Error('Résumé du tableau de bord invalide');
  return data as unknown as AdminDashboardSummary;
}

export async function loadAdminCustomers(options?: {
  page?: number;
  pageSize?: number;
  query?: string;
  filter?: string;
}): Promise<AdminPage<AdminCustomerRow> | null> {
  if (!supabase || !(await hasAdminSession())) return null;
  const [{ data, error }, { count: actionableTotal, error: countError }] = await Promise.all([
    supabase.rpc('list_enrm_admin_customers', {
      p_page: Math.max(1, options?.page || 1),
      p_page_size: Math.min(100, Math.max(1, options?.pageSize || 12)),
      p_query: safeSearch(options?.query || ''),
    }),
    supabase
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .in('status', ['À confirmer', 'À préparer', 'En préparation']),
  ]);
  if (error) throw new Error(`Clients inaccessibles (${error.message})`);
  if (countError) throw new Error(`Compteur des commandes inaccessible (${countError.message})`);
  const rows = (data || []) as AdminCustomerRow[];
  return { rows, total: rows[0]?.total_count || 0, actionableTotal: actionableTotal || 0 };
}
export async function loadCategories(): Promise<Category[]> {
  if (supabase) {
    const categories: Category[] = [];
    for (let offset = 0; ; offset += 1000) {
      const { data, error } = await supabase
        .from('categories')
        .select('id,parent_id,name,slug,sort_order,is_active')
        .eq('is_active', true)
        .order('sort_order')
        .order('name')
        .range(offset, offset + 999);
      if (error) throw new Error(`Catégories inaccessibles (${error.message})`);
      categories.push(...(data || []));
      if (!data || data.length < 1000) break;
    }
    return categories;
  }
  return [
    {
      id: DEFAULT_CATEGORY_ID,
      parent_id: null,
      name: 'Huiles moteur',
      slug: 'huiles-moteur',
      sort_order: 10,
      is_active: true,
    },
  ];
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
