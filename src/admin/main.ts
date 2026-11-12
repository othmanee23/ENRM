import { loadAdminState, saveAdminState } from './storage';
import { icon } from './icons';
import { createAdminViews } from './views';
import { createDemoState } from './seed';
import { thumb, badge, field, formActions, empty } from './components';
import { fmt, statuses } from './format';
import { mountCategoryManager } from './categories';

import { $, formData, formValues, fieldValue } from '../shared/dom';
import { esc, currency } from '../shared/format';
import {
  DEFAULT_CATEGORY_ID,
  loadAdminCatalogue,
  loadAdminOrders,
  loadAdminCustomers,
  loadAdminDashboard,
  loadCatalogue,
  loadCategories,
  requireProduct,
  requireById,
  emptyProduct,
} from '../shared/catalogue';
import { supabase } from '../shared/supabase';
import fallbackCatalogue from '../../public/catalogue.json';
import type {
  Product,
  AdminProduct,
  AdminState,
  Order,
  Customer,
  Promotion,
  Category,
} from '../shared/types';
const routes = [
  ['overview', 'Vue d’ensemble', 'grid'],
  ['orders', 'Commandes', 'bag'],
  ['products', 'Produits', 'box'],
  ['categories', 'Catégories', 'tag'],
  ['inventory', 'Stock & inventaire', 'layers'],
  ['customers', 'Clients', 'users'],
  ['analytics', 'Statistiques', 'chart'],
  ['promotions', 'Promotions', 'tag'],
  ['settings', 'Paramètres', 'settings'],
];
let state: AdminState,
  adminAuthenticated = !supabase,
  baseProducts: Product[] = [],
  productCategories: Category[] = [],
  remoteProductIds = new Set<string>(),
  remoteProductsActive = false,
  remoteOrdersActive = false,
  remoteOrdersLoading = false,
  remoteOrdersTotal = 0,
  remoteActionableCount = 0,
  remoteProductsTotal = 0,
  remoteCustomersTotal = 0,
  dashboardSummary = null as Awaited<ReturnType<typeof loadAdminDashboard>>,
  demoOrders: Order[] = [],
  demoCustomers: Customer[] = [],
  view = 'overview',
  query = '',
  filter = 'Tous',
  page = 1,
  remotePageRequest = 0,
  period = 30;
const today = new Date();
today.setHours(12, 0, 0, 0);
function lowStock() {
  return state.products
    .filter((p) => p.status === 'Actif' && p.stock <= state.settings.threshold)
    .sort((a, b) => a.stock - b.stock);
}
function product(id: string) {
  return requireProduct(state.products, id);
}
function total(o: Order) {
  return o.items.reduce((s, i) => s + i.qty * i.price, 0);
}

async function hasRemoteAdminAccess() {
  if (!supabase) return (adminAuthenticated = true);
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError || !sessionData.session) return (adminAuthenticated = false);
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', sessionData.session.user.id)
    .maybeSingle();
  // Keep the last verified admin identity for fail-closed rendering during a
  // transient profile-read outage. Callers still receive false and must not write.
  if (error) return false;
  adminAuthenticated = profile?.role === 'admin';
  return adminAuthenticated;
}

function toDatabaseProduct(item: AdminProduct) {
  const { status, stock: _stock, ...productData } = item;
  return {
    ...productData,
    category_id: item.category_id || DEFAULT_CATEGORY_ID,
    is_published: status === 'Actif',
    show_on_website: status === 'Actif',
  };
}

type RemoteProductSaveFailure = { message: string; productSaved: boolean };

async function saveRemoteProduct(
  item: AdminProduct,
  previousId = item.id,
): Promise<RemoteProductSaveFailure | null> {
  if (!supabase) return null;
  if (!(await hasRemoteAdminAccess()))
    return {
      message: 'Connectez-vous avec un compte administrateur dans Catégories.',
      productSaved: false,
    };
  const payload = toDatabaseProduct(item);
  const { error } = await supabase.rpc('save_enrm_product_with_stock', {
    p_previous_id: remoteProductIds.has(previousId) ? previousId : null,
    p_product: payload,
    p_quantity: item.stock,
  });
  if (error) return { message: error.message, productSaved: false };
  remoteProductIds.delete(previousId);
  remoteProductIds.add(item.id);
  return null;
}

async function refreshRemoteProducts(
  options?: { page?: number; query?: string; filter?: string; all?: boolean },
  requestId?: number,
) {
  if (!supabase) return false;
  remoteProductsActive = false;
  const loaded = await loadAdminCatalogue(options);
  if (requestId !== undefined && requestId !== remotePageRequest) return true;
  if (!loaded) return false;
  const fromDatabase = loaded.products.map((item) => ({
    ...emptyProduct(),
    ...item,
    category_id: item.category_id || DEFAULT_CATEGORY_ID,
    stock: loaded.stockByProductId.get(item.id) || 0,
    status: item.is_published ? 'Actif' : 'Brouillon',
  })) as AdminProduct[];
  remoteProductIds = new Set(fromDatabase.map((item) => item.id));
  state.products = fromDatabase;
  remoteProductsTotal = loaded.total;
  remoteProductsActive = true;
  return true;
}

async function refreshRemoteOrders(
  options?: { page?: number; query?: string; filter?: string; all?: boolean },
  requestId?: number,
) {
  const wasRemoteOrdersActive = remoteOrdersActive || state.orders.some((order) => order.remote);
  remoteOrdersActive = false;
  if (!options && !(await refreshRemoteProducts({ all: true }))) return false;
  const loaded = await loadAdminOrders(options || { all: true });
  if (requestId !== undefined && requestId !== remotePageRequest) return true;
  if (!loaded) return false;
  if (!wasRemoteOrdersActive) {
    demoOrders = structuredClone(state.orders.filter((order) => !order.remote));
    demoCustomers = structuredClone(state.customers.filter((customer) => !customer.remote));
  }
  const remoteCustomersByKey = new Map<string, Customer>();
  const remoteCustomerIdByOrderId = new Map<string, string>();
  for (const order of loaded.rows) {
    const phoneKey = order.phone.replace(/\D/g, '');
    const fallbackKey = `${order.customer_name.trim().toLocaleLowerCase()}|${order.city.trim().toLocaleLowerCase()}`;
    const key = phoneKey ? `phone:${phoneKey}` : `name-city:${fallbackKey}`;
    let customer = remoteCustomersByKey.get(key);
    if (!customer) {
      customer = {
        id: `remote-customer-${remoteCustomersByKey.size + 1}`,
        name: order.customer_name,
        city: order.city,
        email: '',
        phone: order.phone,
        deliveryAddress: order.delivery_address,
        type: 'Particulier',
        remote: true,
      };
      remoteCustomersByKey.set(key, customer);
    }
    remoteCustomerIdByOrderId.set(order.id, customer.id);
  }
  const remoteCustomers = [...remoteCustomersByKey.values()];
  // Connected admin views must reflect only customers derived from real order requests.
  // Keep the demo records in local storage for the disconnected demo mode, but never display them
  // alongside live Supabase data.
  state.customers = remoteCustomers;
  state.orders = loaded.rows.map((order) => ({
    id: order.order_number,
    remoteId: order.id,
    remote: true,
    customerId: remoteCustomerIdByOrderId.get(order.id)!,
    city: order.city,
    date: order.created_at,
    status: order.status,
    payment: '',
    tracking: order.tracking_number,
    note: order.internal_note,
    items: order.order_items.map((item) => ({
      id: item.product_id,
      name: item.product_name,
      volume: item.volume,
      qty: item.quantity,
      price: Number(item.unit_price),
    })),
    history: order.status_history.length
      ? order.status_history.map((event) => ({
          label: event.previous_status
            ? `${event.previous_status} → ${event.status}`
            : `Demande reçue · ${event.status}`,
          date: event.created_at,
        }))
      : [{ label: `Demande enregistrée · ${order.status}`, date: order.created_at }],
  }));
  remoteOrdersTotal = loaded.total;
  remoteActionableCount = loaded.actionableTotal || 0;
  remoteOrdersActive = true;
  return true;
}

async function refreshRemoteCustomers(
  options?: { page?: number; query?: string },
  requestId?: number,
) {
  remoteOrdersActive = false;
  if (filter === 'Professionnel') {
    if (requestId !== undefined && requestId !== remotePageRequest) return true;
    state.customers = [];
    remoteCustomersTotal = 0;
    remoteOrdersActive = true;
    return true;
  }
  const loaded = await loadAdminCustomers(options);
  if (requestId !== undefined && requestId !== remotePageRequest) return true;
  if (!loaded) return false;
  state.customers = loaded.rows.map((customer) => ({
    id: customer.id,
    name: customer.name,
    city: customer.city,
    email: '',
    phone: customer.phone,
    deliveryAddress: customer.delivery_address,
    type: 'Particulier',
    remote: true,
    requestCount: Number(customer.request_count),
    subtotal: Number(customer.subtotal),
  }));
  remoteCustomersTotal = loaded.total;
  remoteActionableCount = loaded.actionableTotal || 0;
  remoteOrdersActive = true;
  return true;
}

async function refreshRemoteDashboard(requestId?: number) {
  remoteOrdersActive = false;
  remoteProductsActive = false;
  dashboardSummary = null;
  const loaded = await loadAdminDashboard(period, today.toISOString(), state.settings.threshold);
  if (requestId !== undefined && requestId !== remotePageRequest) return true;
  if (!loaded) return false;
  dashboardSummary = loaded;

  const customersByKey = new Map<string, Customer>();
  const customerIdByOrderId = new Map<string, string>();
  for (const order of loaded.recent_orders) {
    const digits = order.phone.replace(/\D/g, '');
    const key = digits
      ? `phone:${digits}`
      : `name-city:${order.customer_name.trim().toLocaleLowerCase()}|${order.city.trim().toLocaleLowerCase()}`;
    let customer = customersByKey.get(key);
    if (!customer) {
      customer = {
        id: `dashboard-customer-${customersByKey.size + 1}`,
        name: order.customer_name,
        city: order.city,
        phone: order.phone,
        deliveryAddress: order.delivery_address,
        email: '',
        type: 'Particulier',
        remote: true,
      };
      customersByKey.set(key, customer);
    }
    customerIdByOrderId.set(order.id, customer.id);
  }
  state.customers = [...customersByKey.values()];
  state.orders = loaded.recent_orders.map((order) => ({
    id: order.order_number,
    remoteId: order.id,
    remote: true,
    customerId: customerIdByOrderId.get(order.id)!,
    city: order.city,
    date: order.created_at,
    status: order.status,
    payment: '',
    tracking: order.tracking_number,
    note: order.internal_note,
    items: order.order_items.map((item) => ({
      id: item.product_id,
      name: item.product_name,
      volume: item.volume,
      qty: item.quantity,
      price: Number(item.unit_price),
    })),
    history: order.status_history.map((event) => ({
      label: event.previous_status
        ? `${event.previous_status} → ${event.status}`
        : `Demande reçue · ${event.status}`,
      date: event.created_at,
    })),
  }));
  state.products = loaded.low_stock_products.map(({ product, quantity }) => ({
    ...emptyProduct(),
    ...product,
    category_id: product.category_id || DEFAULT_CATEGORY_ID,
    stock: Number(quantity),
    status: product.is_published ? 'Actif' : 'Brouillon',
  })) as AdminProduct[];
  remoteProductIds = new Set(state.products.map((item) => item.id));
  remoteOrdersTotal = loaded.total_order_count;
  remoteActionableCount = loaded.pending_order_count;
  remoteProductsTotal = loaded.total_product_count;
  remoteOrdersActive = true;
  remoteProductsActive = true;
  return true;
}

let remoteSearchTimer: ReturnType<typeof setTimeout>;
async function refreshCurrentRemotePage() {
  if (!supabase || !state) return;
  const requestId = ++remotePageRequest;
  const restoreSearch =
    document.activeElement instanceof HTMLInputElement &&
    document.activeElement.id === 'local-query';
  const selection = restoreSearch ? ($('#local-query') as HTMLInputElement).selectionStart : null;
  const restoreFocus = () => {
    if (!restoreSearch) return;
    const input = $('#local-query') as HTMLInputElement;
    input.focus();
    if (selection !== null) input.setSelectionRange(selection, selection);
  };
  if (view === 'orders' || view === 'customers') remoteOrdersActive = false;
  remoteOrdersLoading = view === 'orders';
  if (view === 'products' || view === 'inventory') remoteProductsActive = false;
  render();
  restoreFocus();
  try {
    const options = { page, query, filter };
    const ok =
      view === 'orders'
        ? await refreshRemoteOrders(options, requestId)
        : view === 'customers'
          ? await refreshRemoteCustomers(options, requestId)
          : await refreshRemoteProducts(options, requestId);
    if (requestId !== remotePageRequest) return;
    remoteOrdersLoading = false;
    if (!ok) toast('Les données ne sont pas disponibles. Réessayez.');
  } catch (error) {
    if (requestId !== remotePageRequest) return;
    remoteOrdersLoading = false;
    if (view === 'orders' || view === 'customers') remoteOrdersActive = false;
    if (view === 'products' || view === 'inventory') remoteProductsActive = false;
    toast(error instanceof Error ? error.message : 'Les données ne sont pas disponibles.');
  }
  render();
  restoreFocus();
}

function persist() {
  const savedState = remoteOrdersActive
    ? {
        ...state,
        orders: demoOrders,
        customers: demoCustomers,
      }
    : state;
  if (saveAdminState(savedState)) return true;
  toast('Stockage plein : utilisez une image plus légère.');
  return false;
}
function activity(text: string) {
  state.activity.unshift({ text, date: new Date().toISOString() });
  state.activity = state.activity.slice(0, 30);
}
let toastTimer: ReturnType<typeof setTimeout>;
function toast(s: string) {
  $('#admin-toast').textContent = s;
  $('#admin-toast').classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => $('#admin-toast').classList.remove('show'), 3200);
}
function navigate(v: string) {
  location.hash = v;
}
function render() {
  const route = (location.hash.slice(1) || 'overview').split('?')[0];
  view = routes.some((r) => r[0] === route) || route === 'search' ? route : 'overview';
  const name = routes.find((r) => r[0] === view)?.[1] || 'Recherche';
  const restricted = Boolean(supabase && !adminAuthenticated);
  $('#crumb').textContent = restricted ? 'Connexion administrateur' : name;
  document.title = (restricted ? 'Connexion administrateur' : name) + ' — ENRM Gestion';
  $('#store-label').textContent = supabase ? 'Boutique ENRM' : 'Boutique de démonstration';
  $('#profile-name').textContent = restricted
    ? 'Espace ENRM'
    : supabase
      ? 'Administrateur'
      : 'Équipe ENRM';
  $('#profile-role').textContent = restricted
    ? 'Connexion requise'
    : supabase
      ? 'Administrateur'
      : 'Administrateur · Démo';
  const environmentTag = document.getElementById('environment-tag');
  const remoteDataUnavailable = Boolean(
    supabase &&
    adminAuthenticated &&
    ((['overview', 'orders', 'customers', 'analytics', 'search'].includes(view) &&
      !remoteOrdersActive) ||
      (['products', 'inventory'].includes(view) && !remoteProductsActive)),
  );
  if (environmentTag)
    environmentTag.innerHTML = `<i></i>${restricted ? 'Connexion requise' : remoteDataUnavailable ? 'Données indisponibles' : supabase ? 'Espace privé' : 'Démo locale'}`;
  $('#global-search').hidden = restricted;
  $('#notifications').hidden = restricted;
  $('#mobile-menu').hidden = restricted;
  $('#nav-caption').hidden = restricted;
  const signOutButton = document.getElementById('admin-signout') as HTMLButtonElement | null;
  if (signOutButton) signOutButton.hidden = !supabase || restricted;
  $('#admin-footer-note').textContent = restricted
    ? 'Accès réservé aux administrateurs.'
    : supabase
      ? 'Données ENRM · Supabase'
      : 'Données fictives · Modifications enregistrées dans ce navigateur';
  $('#admin-nav').innerHTML = restricted
    ? ''
    : routes
        .map(
          ([id, label, ico]) =>
            `<a href="#${id}" class="${view === id ? 'active' : ''}" ${view === id ? 'aria-current="page"' : ''}>${icon(ico)}<span>${label}</span>${id === 'orders' ? `<span class="nav-count">${supabase && !remoteOrdersActive ? '—' : supabase ? remoteActionableCount : state.orders.filter((o) => ['À confirmer', 'À préparer', 'En préparation'].includes(o.status)).length}</span>` : ''}</a>`,
        )
        .join('');
  const renderers: Record<string, () => string> = createAdminViews({
    state,
    query,
    filter,
    page,
    period,
    today,
    remoteProductsActive,
    remoteOrdersActive,
    remoteOrdersLoading,
    connectedAdmin: Boolean(supabase && adminAuthenticated),
    remoteOrdersTotal,
    remoteProductsTotal,
    remoteCustomersTotal,
    dashboardSummary,
  });
  if (view === 'categories') mountCategoryManager($('#workspace'));
  else $('#workspace').innerHTML = renderers[view]();
  $('#workspace').classList.remove('page-enter');
  requestAnimationFrame(() => $('#workspace').classList.add('page-enter'));
  document.body.classList.remove('menu-open');
  $('#scrim').hidden = true;
  $('#mobile-menu').setAttribute('aria-expanded', 'false');
}
function openDialog(name: string, html: string) {
  $('#dialog-title').textContent = name;
  $('#dialog-content').innerHTML = html;
  $('#editor').showModal();
}
function closeDialog() {
  $('#editor').close();
}

function productEditor(id?: string) {
  const p: AdminProduct = id
    ? product(id)
    : {
        ...emptyProduct(),
        category_id: productCategories[0]?.id || DEFAULT_CATEGORY_ID,
        status: 'Actif',
        stock: 0,
      };
  const categories = [...productCategories];
  if (p.category_id && !categories.some((category) => category.id === p.category_id))
    categories.unshift({
      id: p.category_id,
      parent_id: null,
      name: 'Catégorie masquée',
      slug: '',
      sort_order: -1,
      is_active: false,
    });
  openDialog(
    id ? 'Modifier le produit' : 'Nouveau produit',
    `<form id="product-form"><div class="form-grid">${field('Nom du produit', 'name', p.sous_reference || '', 'text', 'full maxlength="100"')}${field('Marque', 'brand', p.marque || '', 'text', 'maxlength="50"')}${field('Référence / SKU', 'sku', p.id || 'ENRM-DEMO-' + Date.now().toString().slice(-6), 'text', 'maxlength="80" pattern="[A-Za-z0-9][A-Za-z0-9_-]{0,79}"')}${field('Viscosité', 'viscosity', p.viscosite || '', 'text', 'maxlength="30"')}${field('Contenance', 'volume', p.litrage || '5 L', 'text', 'maxlength="30"')}${field('Prix · MAD', 'price', p.price, 'number', 'min="0" max="9999999" step="0.01"')}${field('Stock disponible', 'stock', p.stock, 'number', 'min="0" max="999999"')}<label class="field full">Catégorie<select name="category" required>${categories
      .map(
        (category) =>
          `<option value="${esc(category.id)}" ${category.id === p.category_id ? 'selected' : ''}>${esc(category.name)}</option>`,
      )
      .join(
        '',
      )}</select></label><label class="field full">Statut<select name="status"><option ${p.status === 'Actif' ? 'selected' : ''}>Actif</option><option ${p.status === 'Brouillon' ? 'selected' : ''}>Brouillon</option></select></label><label class="field full">Photo du produit<input type="file" name="image" accept="image/jpeg,image/png,image/webp"></label></div><p class="form-note">JPG, PNG ou WebP · 1 Mo maximum. ${supabase ? 'Image partagée avec la boutique.' : 'Image enregistrée dans cette démonstration.'}</p>${formActions(id ? 'Enregistrer' : 'Ajouter le produit')}</form>`,
  );
  $('#product-form').onsubmit = async (e) => {
    e.preventDefault();
    const f = formData(e.target),
      sku = fieldValue(f, 'sku').trim();
    if (state.products.some((x) => x.id === sku && x.id !== id)) {
      toast('Cette référence existe déjà.');
      return;
    }
    const file = f.get('image');
    let image = p.recto || '',
      uploadedPath = '';
    if (file instanceof File && file.size) {
      if (
        !['image/jpeg', 'image/png', 'image/webp'].includes(file.type) ||
        file.size > 1024 * 1024
      ) {
        toast('Choisissez une image JPG, PNG ou WebP de moins de 1 Mo.');
        return;
      }
      if (supabase) {
        if (!(await hasRemoteAdminAccess())) {
          toast('Connectez-vous avec un compte administrateur dans Catégories.');
          return;
        }
        const ext = file.type === 'image/jpeg' ? 'jpg' : file.type.slice('image/'.length);
        uploadedPath = `${sku}/${crypto.randomUUID()}.${ext}`;
        const { error } = await supabase.storage
          .from('product-media')
          .upload(uploadedPath, file, { contentType: file.type, upsert: false });
        if (error) {
          toast('La photo n’a pas été envoyée : ' + error.message);
          return;
        }
        image = supabase.storage.from('product-media').getPublicUrl(uploadedPath).data.publicUrl;
      } else {
        image = await new Promise<string>((res, rej) => {
          const r = new FileReader();
          r.onload = () => res(String(r.result));
          r.onerror = rej;
          r.readAsDataURL(file);
        });
      }
    }
    const item: AdminProduct = {
      ...p,
      id: sku,
      sous_reference: fieldValue(f, 'name').trim(),
      marque: fieldValue(f, 'brand').trim(),
      viscosite: fieldValue(f, 'viscosity').trim(),
      litrage: fieldValue(f, 'volume').trim(),
      price: Number(fieldValue(f, 'price')),
      stock: Number(fieldValue(f, 'stock')),
      category_id: fieldValue(f, 'category'),
      status: fieldValue(f, 'status'),
      recto: image,
    };
    item.designation = [item.marque, item.sous_reference, item.viscosite, item.litrage].join(' ');
    const remoteError = await saveRemoteProduct(item, id || item.id);
    if (remoteError) {
      if (uploadedPath && supabase && !remoteError.productSaved)
        await supabase.storage.from('product-media').remove([uploadedPath]);
      toast(
        remoteError.productSaved
          ? remoteError.message
          : 'Le produit n’a pas été enregistré : ' + remoteError.message,
      );
      return;
    }
    const backup = JSON.stringify(state);
    if (id) {
      const oldId = id;
      state.products[state.products.findIndex((x) => x.id === id)] = item;
      state.orders.forEach((o) =>
        o.items.forEach((i) => {
          if (i.id === oldId) i.id = sku;
        }),
      );
    } else state.products.unshift(item);
    activity(`${id ? 'Produit mis à jour' : 'Produit ajouté'} : ${item.sous_reference}`);
    if (!persist()) {
      state = JSON.parse(backup);
      return;
    }
    closeDialog();
    render();
    toast(
      id
        ? 'Produit mis à jour.'
        : supabase
          ? 'Produit ajouté au catalogue.'
          : 'Produit ajouté à la démonstration.',
    );
  };
}
function orderEditor(id: string) {
  const o = requireById(state.orders, id),
    c = requireById(state.customers, o.customerId);
  openDialog(
    'Commande #' + o.id,
    `<div class="detail-summary"><div>${badge(o.status)}<p class="form-note">Créée le ${fmt(o.date)}</p></div><strong>${currency(total(o))}</strong></div><div class="detail-grid"><div><small>CLIENT</small><p>${esc(c.name)}<br>${c.phone ? `<a href="tel:${esc(c.phone.replace(/[^+\d]/g, ''))}">${esc(c.phone)}</a>` : esc(c.email)}</p></div><div><small>DESTINATION</small><p>${esc(c.city)}<br>${c.deliveryAddress ? esc(c.deliveryAddress) : 'Maroc · Livraison démo'}</p></div></div><div class="order-lines">${o.items.map((i) => `<div>${thumb(state.products.find((item) => item.id === i.id))}<div><strong>${esc(i.name)}</strong><small>${i.qty} × ${currency(i.price)} · ${esc(i.volume)}</small></div><span>${currency(i.qty * i.price)}</span></div>`).join('')}</div>${o.remote ? '<p class="form-note">Demande client · Contactez le client pour confirmer les détails.</p>' : ''}<form id="order-update"><div class="form-grid"><label class="field">Statut de la commande<select name="status" ${o.status === 'Annulée' ? 'disabled' : ''}>${statuses.map((s) => `<option ${s === o.status ? 'selected' : ''}>${s}</option>`).join('')}</select></label><label class="field full">Numéro de suivi<input name="tracking" value="${esc(o.tracking)}" maxlength="70" placeholder="Ex. suivi transporteur"></label><label class="field full">Note interne<textarea name="note" maxlength="1000">${esc(o.note)}</textarea></label></div>${formActions('Mettre à jour')}</form><h3 class="timeline-title">Historique de la commande</h3><div class="activity-list">${[
      ...o.history,
    ]
      .reverse()
      .map(
        (h) =>
          `<div class="activity-item"><p>${esc(h.label)}</p><small>${new Date(h.date).toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' })}</small></div>`,
      )
      .join('')}</div>`,
  );
  $('#order-update').onsubmit = async (e) => {
    e.preventDefault();
    const f = formData(e.target);
    const nextStatus = o.status === 'Annulée' ? 'Annulée' : fieldValue(f, 'status');
    const nextTracking = fieldValue(f, 'tracking').trim();
    const nextNote = fieldValue(f, 'note').trim();
    if (o.remote) {
      const { error } = await supabase!.rpc('update_enrm_order', {
        p_order_id: o.remoteId,
        p_status: nextStatus,
        p_tracking_number: nextTracking,
        p_internal_note: nextNote,
      });
      if (error) {
        toast('La commande n’a pas été mise à jour : ' + error.message);
        return;
      }
    }
    if (o.status !== nextStatus)
      o.history.push({
        label: o.remote ? `${o.status} → ${nextStatus}` : nextStatus,
        date: new Date().toISOString(),
      });
    Object.assign(o, {
      status: nextStatus,
      tracking: nextTracking,
      note: nextNote,
    });
    activity(`Commande #${id} : ${o.status}`);
    if (o.remote && nextStatus === 'Annulée') await refreshRemoteProducts();
    persist();
    closeDialog();
    render();
    toast('Commande mise à jour.');
  };
}
function newOrder() {
  openDialog(
    'Nouvelle commande',
    `<form id="new-order"><div class="form-grid"><label class="field full">Client<select name="customer" required>${state.customers.map((c) => `<option value="${c.id}">${esc(c.name)} · ${esc(c.city)}</option>`).join('')}</select></label><label class="field full">Produit<select name="product" required>${state.products
      .filter((p) => p.status === 'Actif')
      .map(
        (p) =>
          `<option value="${p.id}">${esc(p.marque + ' ' + p.sous_reference + ' ' + p.viscosite + ' · ' + p.litrage)} — ${currency(p.price)}</option>`,
      )
      .join(
        '',
      )}</select></label>${field('Quantité', 'quantity', 1, 'number', 'min="1" max="999"')}</div><p class="form-note">Commande fictive. Le stock est déduit à la création.</p>${formActions('Créer la commande')}</form>`,
  );
  $('#new-order').onsubmit = (e) => {
    e.preventDefault();
    const f = formData(e.target),
      p = product(fieldValue(f, 'product')),
      qty = Number(fieldValue(f, 'quantity'));
    if (p.stock < qty) {
      toast('Stock insuffisant. Ajustez le stock ou la quantité.');
      return;
    }
    p.stock -= qty;
    const id = 'EN-' + (Math.max(1048, ...state.orders.map((o) => Number(o.id.split('-')[1]))) + 1);
    state.orders.unshift({
      id,
      customerId: fieldValue(f, 'customer'),
      date: new Date().toISOString(),
      status: 'À préparer',
      payment: '',
      tracking: '',
      note: '',
      items: [
        {
          id: p.id,
          name: p.marque + ' ' + p.sous_reference,
          volume: p.litrage,
          qty,
          price: p.price,
        },
      ],
      history: [{ label: 'Commande créée', date: new Date().toISOString() }],
    });
    activity(`Commande #${id} créée`);
    persist();
    closeDialog();
    render();
    toast('Commande de démonstration créée.');
  };
}
function customerEditor(id?: string) {
  const c: Partial<Customer> = id ? requireById(state.customers, id) : {};
  openDialog(
    id ? 'Modifier le client' : 'Nouveau client',
    `<form id="customer-form"><div class="form-grid">${field('Nom fictif', 'name', c.name || '', 'text', 'full maxlength="90"')}${field('Email fictif', 'email', c.email || '', 'email', 'full maxlength="150"')}${field('Ville', 'city', c.city || '', 'text', 'maxlength="60"')}<label class="field">Profil<select name="type"><option>Particulier</option><option ${c.type === 'Professionnel' ? 'selected' : ''}>Professionnel</option></select></label></div>${formActions()}</form>`,
  );
  $('#customer-form').onsubmit = (e) => {
    e.preventDefault();
    const f = formValues(formData(e.target));
    const item: Customer = {
      id: id || 'C' + Date.now(),
      name: f.name,
      email: f.email,
      city: f.city,
      type: f.type,
    };
    if (id) state.customers[state.customers.findIndex((c) => c.id === id)] = item;
    else state.customers.push(item);
    activity(`Fiche client enregistrée : ${item.name}`);
    persist();
    closeDialog();
    render();
    toast('Fiche client enregistrée.');
  };
}
function promoEditor(id?: string) {
  const p: Partial<Promotion> = state.promotions.find((p) => p.id === id) || {};
  openDialog(
    id ? 'Modifier la promotion' : 'Nouvelle promotion',
    `<form id="promo-form"><div class="form-grid">${field('Code promotionnel', 'code', p.code || '', 'text', 'full pattern="[A-Za-z0-9_-]+" maxlength="30"')}<label class="field">Type<select name="type"><option>Pourcentage</option><option ${p.type === 'Montant fixe' ? 'selected' : ''}>Montant fixe</option></select></label>${field('Valeur de la remise', 'value', p.value || 10, 'number', 'min="1" max="99999" step="0.01"')}${field('Date de fin', 'expiry', p.expiry || new Date(today.getTime() + 30 * 864e5).toISOString().slice(0, 10), 'date')}<label class="field">Statut<select name="status">${['Actif', 'Brouillon', 'Inactif'].map((s) => `<option ${s === p.status ? 'selected' : ''}>${s}</option>`).join('')}</select></label></div>${formActions()}</form>`,
  );
  $('#promo-form').onsubmit = (e) => {
    e.preventDefault();
    const f = formValues(formData(e.target));
    if (f.type === 'Pourcentage' && Number(f.value) > 100) {
      toast('Une remise en pourcentage ne peut pas dépasser 100 %.');
      return;
    }
    f.code = f.code.toUpperCase();
    if (state.promotions.some((x) => x.code === f.code && x.id !== id)) {
      toast('Ce code existe déjà.');
      return;
    }
    const item: Promotion = {
      id: id || 'P' + Date.now(),
      code: f.code,
      value: Number(f.value),
      type: f.type,
      status: f.status,
      expiry: f.expiry,
    };
    if (id) state.promotions[state.promotions.findIndex((x) => x.id === id)] = item;
    else state.promotions.push(item);
    activity(`Promotion enregistrée : ${f.code}`);
    persist();
    closeDialog();
    render();
    toast('Promotion enregistrée.');
  };
}
function download(name: string, data: string, type: string) {
  const url = URL.createObjectURL(new Blob(['\ufeff', data], { type }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
async function exportCsv(kind: string) {
  let rows;
  if (supabase && adminAuthenticated) {
    try {
      if (kind === 'orders') {
        const loaded = await loadAdminOrders({ all: true });
        if (!loaded) throw new Error('Accès administrateur requis.');
        rows = [
          ['Commande', 'Client', 'Date', 'Statut', 'Sous-total indicatif MAD'],
          ...loaded.rows.map((order) => [
            order.order_number,
            order.customer_name,
            order.created_at,
            order.status,
            order.order_items.reduce(
              (sum, item) => sum + Number(item.unit_price) * item.quantity,
              0,
            ),
          ]),
        ];
      } else if (kind === 'customers') {
        const first = await loadAdminCustomers({ page: 1, pageSize: 100 });
        if (!first) throw new Error('Accès administrateur requis.');
        const customers = [...first.rows];
        for (let current = 2; (current - 1) * 100 < first.total; current += 1) {
          const next = await loadAdminCustomers({ page: current, pageSize: 100 });
          if (!next) throw new Error('Accès administrateur requis.');
          customers.push(...next.rows);
        }
        rows = [
          ['Nom', 'Email', 'Ville', 'Profil', 'Demandes', 'Sous-total indicatif MAD'],
          ...customers.map((customer) => [
            customer.name,
            '',
            customer.city,
            'Particulier',
            customer.request_count,
            customer.subtotal,
          ]),
        ];
      } else {
        const loaded = await loadAdminCatalogue({ all: true });
        if (!loaded) throw new Error('Accès administrateur requis.');
        rows = [
          [
            'Référence',
            'Marque',
            'Produit',
            'Viscosité',
            'Contenance',
            'Prix MAD',
            'Stock',
            'Statut',
          ],
          ...loaded.products.map((product) => [
            product.id,
            product.marque,
            product.sous_reference,
            product.viscosite,
            product.litrage,
            product.price,
            loaded.stockByProductId.get(product.id) || 0,
            product.is_published ? 'Actif' : 'Brouillon',
          ]),
        ];
      }
    } catch (error) {
      toast(error instanceof Error ? error.message : 'Export indisponible.');
      return;
    }
  } else if (kind === 'orders')
    rows = [
      ['Commande', 'Client', 'Date', 'Statut', 'Sous-total indicatif MAD'],
      ...state.orders.map((o) => [
        o.id,
        requireById(state.customers, o.customerId).name,
        o.date,
        o.status,
        total(o),
      ]),
    ];
  else if (kind === 'customers')
    rows = [
      ['Nom', 'Email', 'Ville', 'Profil'],
      ...state.customers.map((c) => [c.name, c.email, c.city, c.type]),
    ];
  else
    rows = [
      ['Référence', 'Marque', 'Produit', 'Viscosité', 'Contenance', 'Prix MAD', 'Stock', 'Statut'],
      ...state.products.map((p) => [
        p.id,
        p.marque,
        p.sous_reference,
        p.viscosite,
        p.litrage,
        p.price,
        p.stock,
        p.status,
      ]),
    ];
  download(
    `enrm-${kind}-${supabase ? 'live' : 'demo'}.csv`,
    rows
      .map((r) =>
        r
          .map((v) => {
            let s = String(v);
            if (/^[=+@\-\t\r]/.test(s)) s = "'" + s;
            return '"' + s.replace(/"/g, '""') + '"';
          })
          .join(';'),
      )
      .join('\r\n'),
    'text/csv;charset=utf-8',
  );
  toast('Export téléchargé.');
}
$('#close-dialog').onclick = closeDialog;
$('#editor').addEventListener('click', (e) => {
  if (e.target === $('#editor')) {
    const r = $('#editor').getBoundingClientRect();
    if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom)
      closeDialog();
  }
});
document.addEventListener('click', (e) => {
  if (!(e.target instanceof Element)) return;
  const t = e.target.closest<HTMLElement>('button,a');
  if (!t || !state) return;
  if (t.dataset.nav) navigate(t.dataset.nav);
  if (t.dataset.order) orderEditor(t.dataset.order);
  if (t.dataset.editProduct) productEditor(t.dataset.editProduct);
  if (t.dataset.customer) customerEditor(t.dataset.customer);
  if (t.dataset.promo) promoEditor(t.dataset.promo);
  if (t.dataset.export) exportCsv(t.dataset.export);
  if (t.dataset.filter) {
    filter = t.dataset.filter;
    page = 1;
    if (supabase && ['orders', 'products', 'inventory', 'customers'].includes(view))
      void refreshCurrentRemotePage();
    else render();
  }
  if (t.dataset.page) {
    page = Number(t.dataset.page);
    if (supabase && ['orders', 'products', 'inventory', 'customers'].includes(view))
      void refreshCurrentRemotePage();
    else render();
  }
  const action = t.dataset.action;
  if (action === 'new-product') productEditor();
  if (action === 'new-order') newOrder();
  if (action === 'new-customer') customerEditor();
  if (action === 'new-promo') promoEditor();
  if (action === 'cancel') closeDialog();
  if (action === 'backup') {
    download('enrm-demo-sauvegarde.json', JSON.stringify(state, null, 2), 'application/json');
    toast('Sauvegarde téléchargée.');
  }
  if (action === 'reset') {
    openDialog(
      'Réinitialiser la démonstration',
      `<p>Les modifications locales seront remplacées par les données de départ. La boutique publique reste inchangée.</p><div class="form-actions"><button class="btn" data-action="cancel">Conserver mes données</button><button class="btn danger" id="confirm-reset">Réinitialiser</button></div>`,
    );
    $('#confirm-reset').onclick = () => {
      state = createDemoState(baseProducts, today);
      persist();
      closeDialog();
      render();
      toast('Démonstration réinitialisée.');
    };
  }
});
document.addEventListener('input', (e) => {
  if (!(e.target instanceof HTMLInputElement)) return;
  if (e.target.id === 'local-query') {
    const pos = e.target.selectionStart;
    query = e.target.value;
    page = 1;
    if (supabase && ['orders', 'products', 'inventory', 'customers'].includes(view)) {
      remotePageRequest += 1;
      clearTimeout(remoteSearchTimer);
      remoteSearchTimer = setTimeout(() => void refreshCurrentRemotePage(), 250);
      return;
    }
    render();
    const input = $('#local-query');
    input.focus();
    input.setSelectionRange(pos, pos);
  }
});
document.addEventListener('change', (e) => {
  if (!(e.target instanceof HTMLSelectElement)) return;
  if (e.target.id === 'period') {
    period = Number(e.target.value);
    if (supabase && ['overview', 'analytics'].includes(view)) {
      const requestId = ++remotePageRequest;
      remoteOrdersActive = false;
      remoteProductsActive = false;
      dashboardSummary = null;
      render();
      void refreshRemoteDashboard(requestId)
        .then(() => {
          if (requestId === remotePageRequest) render();
        })
        .catch((error) => {
          if (requestId !== remotePageRequest) return;
          toast(error instanceof Error ? error.message : 'Le tableau de bord est indisponible.');
          render();
        });
    } else render();
  }
});
document.addEventListener('submit', async (e) => {
  if (!(e.target instanceof HTMLFormElement)) return;
  if (e.target.matches('[data-stock]')) {
    e.preventDefault();
    const p = product(e.target.dataset.stock!);
    const nextStock = Number(formData(e.target).get('stock'));
    const remoteError = await saveRemoteProduct({ ...p, stock: nextStock });
    if (remoteError) {
      toast(
        remoteError.productSaved
          ? remoteError.message
          : 'Le stock n’a pas été enregistré : ' + remoteError.message,
      );
      return;
    }
    p.stock = nextStock;
    activity(`Stock ajusté : ${p.sous_reference} · ${p.stock} unités`);
    persist();
    render();
    toast('Stock enregistré.');
  }
  if (e.target.id === 'settings-form') {
    e.preventDefault();
    const f = formValues(formData(e.target));
    state.settings = { name: f.name, email: f.email, threshold: Number(f.threshold) };
    persist();
    render();
    toast('Préférences enregistrées.');
  }
});
$('#global-search').onsubmit = (e) => {
  e.preventDefault();
  const q = $('#global-query').value.trim();
  if (q) location.hash = 'search?q=' + encodeURIComponent(q);
};
document.addEventListener('keydown', (e) => {
  if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
    e.preventDefault();
    $('#global-query').focus();
  }
});
$('#mobile-menu').onclick = () => {
  const open = document.body.classList.toggle('menu-open');
  $('#scrim').hidden = !open;
  $('#mobile-menu').setAttribute('aria-expanded', String(open));
};
$('#scrim').onclick = () => {
  document.body.classList.remove('menu-open');
  $('#scrim').hidden = true;
  $('#mobile-menu').setAttribute('aria-expanded', 'false');
};
$('#notifications').innerHTML = icon('bell');
$('#notifications').onclick = () => {
  openDialog(
    'Vos points d’attention',
    `<div class="stock-list"><div class="stock-item">${icon('bag')}<div><strong>${state.orders.filter((o) => ['À confirmer', 'À préparer', 'En préparation'].includes(o.status)).length} commandes à traiter</strong><small>Demandes et préparation</small></div><button class="btn" id="alert-orders">Voir</button></div><div class="stock-item">${icon('alert')}<div><strong>${lowStock().length} références à réapprovisionner</strong><small>Seuil : ${state.settings.threshold} unités</small></div><button class="btn" id="alert-stock">Voir</button></div></div>`,
  );
  $('#alert-orders').onclick = () => {
    closeDialog();
    navigate('orders');
  };
  $('#alert-stock').onclick = () => {
    closeDialog();
    navigate('inventory');
  };
};
$('#search-icon').innerHTML = icon('search');
addEventListener('hashchange', async () => {
  remotePageRequest += 1;
  const requestedRoute = location.hash.slice(1).split('?')[0];
  if (!state) return;
  query = '';
  filter = 'Tous';
  page = 1;
  if (requestedRoute === 'products' || requestedRoute === 'inventory') remoteProductsActive = false;
  if (['orders', 'overview', 'customers', 'analytics', 'search'].includes(requestedRoute))
    remoteOrdersActive = false;
  remoteOrdersLoading = requestedRoute === 'orders';
  if (['overview', 'analytics'].includes(requestedRoute)) {
    remoteProductsActive = false;
    dashboardSummary = null;
  }
  // Render the requested route with remote data marked unavailable before any
  // network checks, so a slow database cannot leave the previous page visible.
  render();
  const hasAccess = !supabase || (await hasRemoteAdminAccess());
  if (!hasAccess && !adminAuthenticated && requestedRoute !== 'categories') {
    remoteOrdersLoading = false;
    navigate('categories');
    return;
  }
  const route = requestedRoute;
  try {
    if (route === 'products' || route === 'inventory') {
      productCategories = await loadCategories();
      if (!(await refreshRemoteProducts({ page, query, filter }))) {
        toast('Les produits et le stock ne sont pas disponibles. Réessayez.');
      }
    } else if (route === 'orders') {
      if (!(await refreshRemoteOrders({ page, query, filter })))
        toast('Les demandes ne sont pas disponibles. Réessayez.');
    } else if (route === 'customers') {
      if (!(await refreshRemoteCustomers({ page, query })))
        toast('Les clients ne sont pas disponibles. Réessayez.');
    } else if (['overview', 'analytics'].includes(route)) {
      if (!(await refreshRemoteDashboard(remotePageRequest)))
        toast('Le tableau de bord ne répond pas. Réessayez.');
    } else if (route === 'search') {
      if (!(await refreshRemoteOrders())) {
        toast('Les demandes ne sont pas disponibles. Réessayez.');
      }
    }
  } catch (error) {
    remoteOrdersLoading = false;
    if (route === 'products' || route === 'inventory') remoteProductsActive = false;
    if (['orders', 'overview', 'customers', 'analytics', 'search'].includes(route))
      remoteOrdersActive = false;
    if (['overview', 'analytics'].includes(route)) {
      remoteProductsActive = false;
      dashboardSummary = null;
    }
    toast(error instanceof Error ? error.message : 'Les données ne sont pas disponibles.');
  }
  remoteOrdersLoading = false;
  render();
});
addEventListener('enrm-admin-authenticated', async () => {
  await hasRemoteAdminAccess();
  render();
});
document.getElementById('admin-signout')?.addEventListener('click', async () => {
  if (!supabase) return;
  const { error } = await supabase.auth.signOut();
  if (error) {
    toast('Déconnexion impossible. Réessayez.');
    return;
  }
  dispatchEvent(new CustomEvent('enrm-sign-out'));
});
addEventListener('enrm-sign-out', () => {
  adminAuthenticated = !supabase;
  remoteProductIds.clear();
  remoteProductsActive = false;
  remoteOrdersActive = false;
  window.location.replace('/login');
});
Promise.all([
  supabase ? Promise.resolve(fallbackCatalogue as Product[]) : loadCatalogue(),
  loadCategories(),
])
  .then(async ([data, categories]) => {
    baseProducts = data;
    productCategories = categories;
    state = loadAdminState(() => createDemoState(baseProducts, today));
    demoOrders = structuredClone(state.orders);
    demoCustomers = structuredClone(state.customers);
    const route = location.hash.slice(1).split('?')[0];
    const hasAccess = !supabase || (await hasRemoteAdminAccess());
    if (!hasAccess && route !== 'categories') {
      navigate('categories');
      render();
      return;
    }
    if (route === 'products' || route === 'inventory')
      await refreshRemoteProducts({ page, query, filter });
    if (route === 'orders') await refreshRemoteOrders({ page, query, filter });
    if (route === 'customers') await refreshRemoteCustomers({ page, query });
    if (['overview', 'analytics'].includes(route)) await refreshRemoteDashboard(remotePageRequest);
    if (route === 'search') await refreshRemoteOrders();
    persist();
    render();
  })
  .catch(() => {
    if (!supabase || !adminAuthenticated) {
      state = createDemoState(fallbackCatalogue as Product[], today);
      demoOrders = structuredClone(state.orders);
      demoCustomers = structuredClone(state.customers);
      render();
      return;
    }
    $('#workspace').innerHTML = empty(
      'Chargement indisponible',
      'Rechargez la page pour retrouver votre espace.',
    );
  });
