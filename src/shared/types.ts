/** Exact imported catalogue variant. Formulation and volume always remain distinct. */
export interface Product {
  id: string;
  category_id?: string;
  marque: string;
  gamme: string;
  sous_reference: string;
  viscosite: string;
  litrage: string;
  designation: string;
  price: number;
  recto: string;
  verso: string;
  statut_recto: string;
  statut_verso: string;
  references_articles: string;
  reference_image: string;
  origine_image: string;
  preuves_maroc: string;
  source_recto: string;
  source_verso: string;
  url_recto: string;
  url_verso: string;
  photo_revendeur_url: string;
  note: string;
  is_published?: boolean;
  show_on_website?: boolean;
}
export interface Category {
  id: string;
  parent_id: string | null;
  name: string;
  slug: string;
  sort_order: number;
  is_active: boolean;
}
export interface CartItem {
  id: string;
  qty: number;
}
export interface AdminProduct extends Product {
  stock: number;
  status: string;
}
export interface Customer {
  id: string;
  name: string;
  city: string;
  email: string;
  type: string;
}
export interface OrderItem {
  id: string;
  name: string;
  volume: string;
  qty: number;
  price: number;
}
export interface HistoryEntry {
  label: string;
  date: string;
}
export interface Order {
  id: string;
  customerId: string;
  date: string;
  status: string;
  payment: string;
  items: OrderItem[];
  tracking: string;
  note: string;
  history: HistoryEntry[];
}
export interface Promotion {
  id: string;
  code: string;
  value: number;
  type: string;
  status: string;
  expiry: string;
}
export interface Activity {
  text: string;
  date: string;
}
export interface AdminSettings {
  name: string;
  email: string;
  threshold: number;
}
export interface AdminState {
  products: AdminProduct[];
  orders: Order[];
  customers: Customer[];
  promotions: Promotion[];
  activity: Activity[];
  settings: AdminSettings;
}
