import { loadAdminState, saveAdminState } from './storage';
import '../styles/admin.css';
import { icon } from './icons';
import { createAdminViews } from './views';
import { createDemoState } from './seed';
import { thumb, badge, field, formActions, empty } from './components';
import { fmt, statuses } from './format';

import { $, formData, formValues, fieldValue } from '../shared/dom';
import { esc, currency } from '../shared/format';
import { loadCatalogue, requireProduct, requireById, emptyProduct } from '../shared/catalogue';
import type {
  Product,
  AdminProduct,
  AdminState,
  Order,
  Customer,
  Promotion,
} from '../shared/types';
const routes = [
  ['overview', 'Vue d’ensemble', 'grid'],
  ['orders', 'Commandes', 'bag'],
  ['products', 'Produits', 'box'],
  ['inventory', 'Stock & inventaire', 'layers'],
  ['customers', 'Clients', 'users'],
  ['analytics', 'Statistiques', 'chart'],
  ['promotions', 'Promotions', 'tag'],
  ['settings', 'Paramètres', 'settings'],
];
let state: AdminState,
  baseProducts: Product[] = [],
  view = 'overview',
  query = '',
  filter = 'Tous',
  page = 1,
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

function persist() {
  if (saveAdminState(state)) return true;
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
  $('#crumb').textContent = name;
  document.title = name + ' — ENRM Gestion';
  $('#admin-nav').innerHTML = routes
    .map(
      ([id, label, ico]) =>
        `<a href="#${id}" class="${view === id ? 'active' : ''}" ${view === id ? 'aria-current="page"' : ''}>${icon(ico)}<span>${label}</span>${id === 'orders' ? `<span class="nav-count">${state.orders.filter((o) => ['À préparer', 'En préparation'].includes(o.status)).length}</span>` : ''}</a>`,
    )
    .join('');
  const renderers: Record<string, () => string> = createAdminViews({
    state,
    query,
    filter,
    page,
    period,
    today,
  });
  $('#workspace').innerHTML = renderers[view]();
  $('#workspace').classList.remove('page-enter');
  requestAnimationFrame(() => $('#workspace').classList.add('page-enter'));
  document.body.classList.remove('menu-open');
  $('#scrim').hidden = true;
  $('#menu').setAttribute('aria-expanded', 'false');
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
  const p: AdminProduct = id ? product(id) : { ...emptyProduct(), status: 'Actif', stock: 0 };
  openDialog(
    id ? 'Modifier le produit' : 'Nouveau produit',
    `<form id="product-form"><div class="form-grid">${field('Nom du produit', 'name', p.sous_reference || '', 'text', 'full maxlength="100"')}${field('Marque', 'brand', p.marque || '', 'text', 'maxlength="50"')}${field('Référence / SKU', 'sku', p.id || 'ENRM-DEMO-' + Date.now().toString().slice(-6), 'text', 'maxlength="50" pattern="[A-Za-z0-9_-]+"')}${field('Viscosité', 'viscosity', p.viscosite || '', 'text', 'maxlength="30"')}${field('Contenance', 'volume', p.litrage || '5 L', 'text', 'maxlength="30"')}${field('Prix · MAD', 'price', p.price, 'number', 'min="0" max="9999999" step="0.01"')}${field('Stock disponible', 'stock', p.stock, 'number', 'min="0" max="999999"')}<label class="field full">Statut<select name="status"><option ${p.status === 'Actif' ? 'selected' : ''}>Actif</option><option ${p.status === 'Brouillon' ? 'selected' : ''}>Brouillon</option></select></label><label class="field full">Photo du produit<input type="file" name="image" accept="image/jpeg,image/png,image/webp"></label></div><p class="form-note">JPG, PNG ou WebP · 1 Mo maximum. Enregistrement dans la démo uniquement.</p>${formActions(id ? 'Enregistrer' : 'Ajouter le produit')}</form>`,
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
    let image = p.recto || '';
    if (file instanceof File && file.size) {
      if (
        !['image/jpeg', 'image/png', 'image/webp'].includes(file.type) ||
        file.size > 1024 * 1024
      ) {
        toast('Choisissez une image JPG, PNG ou WebP de moins de 1 Mo.');
        return;
      }
      image = await new Promise<string>((res, rej) => {
        const r = new FileReader();
        r.onload = () => res(String(r.result));
        r.onerror = rej;
        r.readAsDataURL(file);
      });
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
      status: fieldValue(f, 'status'),
      recto: image,
    };
    item.designation = [item.marque, item.sous_reference, item.viscosite, item.litrage].join(' ');
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
    toast(id ? 'Produit mis à jour.' : 'Produit ajouté à la démonstration.');
  };
}
function orderEditor(id: string) {
  const o = requireById(state.orders, id),
    c = requireById(state.customers, o.customerId);
  openDialog(
    'Commande #' + o.id,
    `<div class="detail-summary"><div>${badge(o.status)}<p class="form-note">Créée le ${fmt(o.date)}</p></div><strong>${currency(total(o))}</strong></div><div class="detail-grid"><div><small>CLIENT</small><p>${esc(c.name)}<br>${esc(c.email)}</p></div><div><small>DESTINATION</small><p>${esc(c.city)}<br>Maroc · Livraison démo</p></div></div><div class="order-lines">${o.items.map((i) => `<div>${thumb(product(i.id))}<div><strong>${esc(i.name)}</strong><small>${i.qty} × ${currency(i.price)} · ${esc(i.volume)}</small></div><span>${currency(i.qty * i.price)}</span></div>`).join('')}</div><form id="order-update"><div class="form-grid"><label class="field">Statut de la commande<select name="status">${statuses.map((s) => `<option ${s === o.status ? 'selected' : ''}>${s}</option>`).join('')}</select></label><label class="field">Paiement<select name="payment">${['Payée', 'À encaisser'].map((s) => `<option ${s === o.payment ? 'selected' : ''}>${s}</option>`).join('')}</select></label><label class="field full">Numéro de suivi fictif<input name="tracking" value="${esc(o.tracking)}" maxlength="70" placeholder="Ex. DEMO-1048"></label><label class="field full">Note interne<textarea name="note" maxlength="1000">${esc(o.note)}</textarea></label></div>${formActions('Mettre à jour')}</form><h3 class="timeline-title">Historique de la commande</h3><div class="activity-list">${[
      ...o.history,
    ]
      .reverse()
      .map(
        (h) =>
          `<div class="activity-item"><p>${esc(h.label)}</p><small>${fmt(h.date)}</small></div>`,
      )
      .join('')}</div>`,
  );
  $('#order-update').onsubmit = (e) => {
    e.preventDefault();
    const f = formData(e.target);
    if (o.status !== fieldValue(f, 'status'))
      o.history.push({ label: fieldValue(f, 'status'), date: new Date().toISOString() });
    Object.assign(o, {
      status: fieldValue(f, 'status'),
      payment: fieldValue(f, 'payment'),
      tracking: fieldValue(f, 'tracking').trim(),
      note: fieldValue(f, 'note').trim(),
    });
    activity(`Commande #${id} : ${o.status}`);
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
      )}</select></label>${field('Quantité', 'quantity', 1, 'number', 'min="1" max="999"')}<label class="field">Paiement<select name="payment"><option>À encaisser</option><option>Payée</option></select></label></div><p class="form-note">Commande fictive. Le stock est déduit à la création.</p>${formActions('Créer la commande')}</form>`,
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
      payment: fieldValue(f, 'payment'),
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
function exportCsv(kind: string) {
  let rows;
  if (kind === 'orders')
    rows = [
      ['Commande', 'Client', 'Date', 'Statut', 'Paiement', 'Montant MAD'],
      ...state.orders.map((o) => [
        o.id,
        requireById(state.customers, o.customerId).name,
        o.date,
        o.status,
        o.payment,
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
    `enrm-${kind}-demo.csv`,
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
    render();
  }
  if (t.dataset.page) {
    page = Number(t.dataset.page);
    render();
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
    render();
  }
});
document.addEventListener('submit', (e) => {
  if (!(e.target instanceof HTMLFormElement)) return;
  if (e.target.matches('[data-stock]')) {
    e.preventDefault();
    const p = product(e.target.dataset.stock!);
    p.stock = Number(formData(e.target).get('stock'));
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
$('#menu').onclick = () => {
  const open = document.body.classList.toggle('menu-open');
  $('#scrim').hidden = !open;
  $('#menu').setAttribute('aria-expanded', String(open));
};
$('#scrim').onclick = () => {
  document.body.classList.remove('menu-open');
  $('#scrim').hidden = true;
  $('#menu').setAttribute('aria-expanded', 'false');
};
$('#notifications').innerHTML = icon('bell');
$('#notifications').onclick = () => {
  openDialog(
    'Vos points d’attention',
    `<div class="stock-list"><div class="stock-item">${icon('bag')}<div><strong>${state.orders.filter((o) => ['À préparer', 'En préparation'].includes(o.status)).length} commandes à traiter</strong><small>Préparation et expédition</small></div><button class="btn" id="alert-orders">Voir</button></div><div class="stock-item">${icon('alert')}<div><strong>${lowStock().length} références à réapprovisionner</strong><small>Seuil : ${state.settings.threshold} unités</small></div><button class="btn" id="alert-stock">Voir</button></div></div>`,
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
addEventListener('hashchange', () => {
  query = '';
  filter = 'Tous';
  page = 1;
  render();
});
loadCatalogue()
  .then((data) => {
    baseProducts = data;
    state = loadAdminState(() => createDemoState(baseProducts, today));
    persist();
    render();
  })
  .catch(() => {
    $('#workspace').innerHTML = empty(
      'Chargement indisponible',
      'Rechargez la page pour retrouver votre espace.',
    );
  });
