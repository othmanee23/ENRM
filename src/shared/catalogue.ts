import type { Category, Product } from './types';
import { supabase } from './supabase';
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
export async function loadAdminCatalogue(): Promise<{
  products: Product[];
  stockByProductId: Map<string, number>;
} | null> {
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

  const products: Product[] = [];
  for (let offset = 0; ; offset += 1000) {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('id')
      .range(offset, offset + 999);
    if (error) throw new Error(`Catalogue inaccessible (${error.message})`);
    if (!Array.isArray(data) || !data.every(isProduct)) throw new Error('Catalogue invalide');
    products.push(...data);
    if (data.length < 1000) break;
  }
  const stockByProductId = new Map<string, number>();
  for (let offset = 0; ; offset += 1000) {
    const { data, error } = await supabase
      .from('product_inventory')
      .select('product_id,quantity')
      .order('product_id')
      .range(offset, offset + 999);
    if (error) throw new Error(`Stock inaccessible (${error.message})`);
    for (const item of data || []) stockByProductId.set(item.product_id, item.quantity);
    if (!data || data.length < 1000) break;
  }
  return { products, stockByProductId };
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
}
export async function loadAdminOrders(): Promise<DatabaseOrder[] | null> {
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

  const orders: DatabaseOrder[] = [];
  for (let offset = 0; ; offset += 500) {
    const { data, error } = await supabase
      .from('orders')
      .select(
        'id,order_number,customer_name,phone,city,delivery_address,status,tracking_number,internal_note,created_at,order_items(product_id,product_name,volume,quantity,unit_price)',
      )
      .order('created_at', { ascending: false })
      .range(offset, offset + 499);
    if (error) throw new Error(`Commandes inaccessibles (${error.message})`);
    orders.push(...((data || []) as unknown as DatabaseOrder[]));
    if (!data || data.length < 500) break;
  }
  return orders;
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
