import '../styles/storefront.css';
import { setupMotion } from './motion';
import { photo, card } from './components';
import { productUrl, safeReturn } from './routing';

import { $, formData, formValues, fieldValue } from '../shared/dom';
import { esc, norm, brandName, currency as money } from '../shared/format';
import {
  DEFAULT_CATEGORY_ID,
  loadCatalogue,
  loadCategories,
  productGroup as groupKey,
  requireProduct,
} from '../shared/catalogue';
import { readJson, writeJson, sanitizeCart, CART_KEY } from '../shared/storage';
import { supabase } from '../shared/supabase';
import type { Category, Product, CartItem } from '../shared/types';
const params = new URLSearchParams(location.search),
  page = document.body.dataset.page;

const selection = [
  'ENRM-HM-006',
  'ENRM-HM-067',
  'ENRM-HM-031',
  'ENRM-HM-135',
  'ENRM-HM-155',
  'ENRM-HM-097',
];
const brands = [
  'Castrol',
  'Motul',
  'Liqui_Moly',
  'Shell',
  'TotalEnergies',
  'Meyle',
  'Petrom',
  'Valvoline',
];
let products: Product[] = [],
  categories: Category[] = [],
  filtered: Product[] = [],
  limit = 12,
  currentProduct: Product | undefined,
  cart: CartItem[] = [];
cart = sanitizeCart(readJson(CART_KEY));
let toastTimer: ReturnType<typeof setTimeout>;
function toast(message: string) {
  $('#toast').textContent = message;
  $('#toast').classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => $('#toast').classList.remove('show'), 2800);
}
function showDialog(id: string) {
  const d = document.querySelector<HTMLDialogElement>(id)!;
  if (!d.open) d.showModal();
  document.body.style.overflow = 'hidden';
}
function closeDialog(d: HTMLDialogElement) {
  d.close();
  if (!document.querySelector('dialog[open]')) document.body.style.overflow = '';
}
document.querySelectorAll<HTMLDialogElement>('dialog').forEach((d) => {
  d.querySelector<HTMLElement>('.close')!.onclick = () => closeDialog(d);
  d.addEventListener('close', () => {
    if (!document.querySelector('dialog[open]')) document.body.style.overflow = '';
  });
  d.addEventListener('click', (e) => {
    const r = d.getBoundingClientRect();
    if (
      e.target === d &&
      (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom)
    )
      closeDialog(d);
  });
});
function populate(id: string, values: string[]) {
  const select = document.querySelector<HTMLSelectElement>('#' + id)!;
  select.innerHTML =
    select.options[0].outerHTML +
    [...new Set(values)]
      .sort((a, b) => a.localeCompare(b, 'fr', { numeric: true }))
      .map((v) => `<option value="${esc(v)}">${esc(id === 'brand' ? brandName(v) : v)}</option>`)
      .join('');
}
function readState() {
  return Object.fromEntries(
    ['search', 'category', 'brand', 'range', 'viscosity', 'volume', 'sort'].map((k) => [
      k,
      document.querySelector<HTMLInputElement | HTMLSelectElement>('#' + k)!.value,
    ]),
  );
}
function updateCatalogue(reset = true) {
  if (reset) limit = 12;
  const state = readState(),
    q = norm(state.search);
  filtered = products.filter(
    (p) =>
      (!q ||
        norm(
          [
            p.marque,
            brandName(p.marque),
            p.gamme,
            p.sous_reference,
            p.viscosite,
            p.litrage,
            p.designation,
            p.references_articles,
            p.id,
          ].join(' '),
        ).includes(q)) &&
      (!state.category ||
        (p.category_id || DEFAULT_CATEGORY_ID) ===
          categories.find((category) => category.slug === state.category)?.id) &&
      (!state.brand || p.marque === state.brand) &&
      (!state.range || p.gamme === state.range) &&
      (!state.viscosity || p.viscosite === state.viscosity) &&
      (!state.volume || p.litrage === state.volume),
  );
  if (state.sort === 'price-up') filtered.sort((a, b) => a.price - b.price);
  else if (state.sort === 'price-down') filtered.sort((a, b) => b.price - a.price);
  else if (state.sort === 'name')
    filtered.sort((a, b) =>
      (a.marque + a.sous_reference).localeCompare(b.marque + b.sous_reference),
    );
  else
    filtered.sort((a, b) => {
      const rank = (p: Product) =>
        selection.includes(p.id) ? selection.indexOf(p.id) - 1000 : p.recto ? 0 : 100;
      return rank(a) - rank(b);
    });
  const url = new URL(location.href);
  Object.entries(state).forEach(([k, v]) =>
    v && v !== 'selection' ? url.searchParams.set(k, v) : url.searchParams.delete(k),
  );
  history.replaceState(null, '', url);
  $('#active-filters').textContent = [
    state.brand && brandName(state.brand),
    categories.find((category) => category.slug === state.category)?.name,
    state.range,
    state.viscosity,
    state.volume,
    state.search && `« ${state.search} »`,
  ]
    .filter(Boolean)
    .join(' / ');
  renderProducts();
}
function renderProducts() {
  $('#results-count').textContent =
    `${filtered.length} variante${filtered.length !== 1 ? 's' : ''} · ${Math.min(limit, filtered.length)} affichée${Math.min(limit, filtered.length) !== 1 ? 's' : ''}`;
  $('#product-grid').innerHTML =
    filtered.slice(0, limit).map(card).join('') ||
    `<div class="empty"><h2>${['Meyle', 'Valvoline'].includes($('#brand').value) ? 'Le catalogue arrive prochainement.' : 'Aucune référence trouvée.'}</h2><p>Les références et visuels sont ajoutés après validation par ENRM.</p><button class="text-link" data-reset>Explorer les autres références ↗</button></div>`;
  $('#load-more').hidden = limit >= filtered.length;
}
function resetFilters() {
  ['search', 'category', 'brand', 'range', 'viscosity', 'volume'].forEach(
    (k) => (document.querySelector<HTMLInputElement | HTMLSelectElement>('#' + k)!.value = ''),
  );
  $('#sort').value = 'selection';
  updateCatalogue();
}
function renderProduct(id: string | null, updateUrl = false) {
  const p = products.find((p) => p.id === id);
  if (!p) {
    $('#product-page').innerHTML =
      '<section class="section empty"><p class="eyebrow">RÉFÉRENCE INTROUVABLE</p><h1>Reprenons la route.</h1><p>Cette référence ne figure pas dans le catalogue de démonstration.</p><a class="button primary" href="catalogue.html">Explorer les huiles ↗</a></section>';
    document.title = 'Référence introuvable — ENRM';
    return;
  }
  currentProduct = p;
  if (updateUrl) {
    const u = new URL(location.href);
    u.searchParams.set('id', p.id);
    history.replaceState(null, '', u);
  }
  document.title = `${brandName(p.marque)} ${p.sous_reference} ${p.viscosite} ${p.litrage} — ENRM`;
  const variants = products.filter((v) => groupKey(v) === groupKey(p));
  $('#product-page').innerHTML =
    `<div class="product-breadcrumb"><a href="${esc(safeReturn())}" id="back-catalogue">← Revenir au catalogue</a><span>${esc(brandName(p.marque))} / ${esc(p.sous_reference)}</span></div><section class="product-layout"><div class="detail-visual"><div id="detail-photo">${photo(p, 'eager')}</div><p class="media-caption">${p.recto ? (p.statut_recto.includes('générique') ? 'Illustration générique du contenant.' : 'Visuel du conditionnement ' + esc(p.litrage) + '.') : 'La photo exacte de cette variante reste à compléter.'}</p>${p.verso ? '<div class="gallery-buttons"><button data-face="recto" aria-pressed="true">Recto</button><button data-face="verso" aria-pressed="false">Verso</button></div>' : ''}</div><div class="detail-copy"><p class="eyebrow">${esc(brandName(p.marque))}</p><h1>${esc(p.sous_reference)}<span>${esc(p.viscosite)}</span></h1><p class="detail-reference">${p.id} · Disponibilité à confirmer</p><div class="detail-price">${money(p.price)}</div><p class="muted">Prix de démonstration pour ${esc(p.litrage)}</p><fieldset class="variant-fieldset"><legend>Votre contenance</legend><div class="volume-options">${variants.map((v) => `<a href="${esc(productUrl(v.id))}" data-variant="${v.id}" class="${v.id === p.id ? 'selected' : ''}" ${v.id === p.id ? 'aria-current="true"' : ''}>${esc(v.litrage)}</a>`).join('')}</div></fieldset><div class="buy-line"><label>Quantité<input class="quantity" id="detail-qty" type="number" value="1" min="1" max="99"></label><button class="button primary" id="detail-add">Ajouter au panier <span>＋</span></button></div><p class="muted">Aucun achat réel. Prix et stock à valider par ENRM.</p><a href="conseil.html" class="detail-advice">Un doute sur votre moteur ? <span>Parlons-en ↗</span></a><div class="product-service"><span>Conditionnement exact</span><span>Référence identifiable</span></div></div></section><section class="product-specs section"><div><p class="eyebrow">CHAQUE DÉTAIL COMPTE</p><h2>La référence,<br>en toute clarté.</h2></div><div><dl><div><dt>Marque</dt><dd>${esc(brandName(p.marque))}</dd></div><div><dt>Gamme</dt><dd>${esc(p.gamme)}</dd></div><div><dt>Sous-référence</dt><dd>${esc(p.sous_reference)}</dd></div><div><dt>Grade SAE</dt><dd>${esc(p.viscosite)}</dd></div><div><dt>Contenance</dt><dd>${esc(p.litrage)}</dd></div><div><dt>Référence fabricant</dt><dd>${esc(p.references_articles || 'À confirmer')}</dd></div></dl><p>${esc(p.designation)}</p><p class="muted">La viscosité seule ne prouve pas la compatibilité. Vérifiez les normes et homologations avec la documentation du constructeur et du fabricant.</p><a class="text-link" href="${esc((p.source_recto || p.preuves_maroc).split(' | ')[0])}" target="_blank" rel="noopener noreferrer">Consulter la source catalogue ↗</a><p class="muted">Prix, stock, frais de livraison et version d’emballage à valider avant publication.</p></div></section><section class="section related-section"><div class="section-heading"><h2>Poursuivre la découverte.</h2><a href="catalogue.html" class="text-link">Toutes les huiles ↗</a></div><p class="muted">Autres références de la marque. Ces produits ne sont pas des substituts techniques.</p><div class="product-rail">${products
      .filter((v) => v.marque === p.marque && v.id !== p.id && v.recto)
      .slice(0, 4)
      .map(card)
      .join('')}</div></section>`;
  $('#detail-add').onclick = () => {
    const q = $('#detail-qty');
    if (!q.checkValidity()) {
      q.reportValidity();
      return;
    }
    addToCart(p.id, Number(q.value));
  };
}
function saveCart() {
  if (!writeJson(CART_KEY, cart)) toast('Panier conservé pour cette visite uniquement.');
  $('#cart-count').textContent = String(cart.reduce((s, c) => s + c.qty, 0));
}
function addToCart(id: string, qty = 1) {
  const item = cart.find((c) => c.id === id);
  if (item) item.qty = Math.min(99, item.qty + qty);
  else cart.push({ id, qty });
  saveCart();
  toast('Ajouté au panier de démonstration');
  if ($('#cart-dialog').open) renderCart();
}
function renderCart() {
  const total = cart.reduce((s, c) => s + requireProduct(products, c.id).price * c.qty, 0);
  $('#cart-content').innerHTML = cart.length
    ? cart
        .map((c) => {
          const p = requireProduct(products, c.id);
          return `<article class="cart-item"><a href="${esc(productUrl(p.id))}" class="cart-photo">${photo(p)}</a><div><h3><a href="${esc(productUrl(p.id))}">${esc(brandName(p.marque) + ' ' + p.sous_reference)}</a></h3><p>${esc(p.viscosite)} · ${esc(p.litrage)}</p><strong>${money(p.price * c.qty)}</strong><div class="cart-controls"><button data-change="${c.id}" data-delta="-1" aria-label="Diminuer la quantité">−</button><span>${c.qty}</span><button data-change="${c.id}" data-delta="1" aria-label="Augmenter la quantité">+</button><button class="remove" data-remove="${c.id}">Retirer</button></div></div></article>`;
        })
        .join('') +
      `<div class="cart-summary"><div><span>${supabase ? 'Sous-total indicatif' : 'Sous-total démo'}</span><strong>${money(total)}</strong></div><p class="muted">Frais de livraison non définis. Le total final sera confirmé avant tout achat.</p><button class="button primary" id="checkout">${supabase ? 'Demander une commande' : 'Simuler la commande'} <span>→</span></button>${supabase ? '<p class="muted">ENRM vous recontactera pour confirmer votre demande.</p>' : '<p class="muted">Aucune commande transmise.</p>'}</div>`
    : '<div class="empty"><h3>Le prochain départ se prépare ici.</h3><p>Votre panier est encore vide.</p><a class="button primary" href="catalogue.html">Explorer les huiles ↗</a></div>';
}
function formField(label: string, name: string, type = 'text', required = true) {
  return `<label>${label}${required ? ' *' : ''}<input name="${name}" type="${type}" ${required ? 'required' : ''} maxlength="150" ${type === 'number' ? 'min="1950" max="2027"' : ''}></label>`;
}
function openAdvice() {
  $('#flow-content').innerHTML =
    `<p class="eyebrow">VOTRE DEMANDE DE CONSEIL</p><h2>Faisons connaissance<br>avec votre moteur.</h2><p class="muted">Simulation locale · Champs obligatoires * · Aucune donnée envoyée. Le raccordement WhatsApp sera configuré ultérieurement.</p><form id="advice-form">${formField('Marque du véhicule', 'marque')}${formField('Modèle', 'modele')}${formField('Année', 'annee', 'number')}<label>Carburant *<select name="carburant" required><option value="">Choisir</option><option>Essence</option><option>Diesel</option><option>Hybride</option><option>Autre / à préciser</option></select></label>${formField('Motorisation (si connue)', 'moteur', 'text', false)}${formField('Votre prénom', 'prenom')}<label class="full">Votre question<textarea name="question" maxlength="1200" placeholder="Norme recommandée, usage, référence recherchée…"></textarea></label><button class="button primary full" type="submit">Vérifier ma demande <span>→</span></button></form>`;
  showDialog('#flow-dialog');
  $('#advice-form').onsubmit = (e) => {
    e.preventDefault();
    const data = formValues(formData(e.target));
    $('#flow-content').innerHTML =
      `<p class="eyebrow">RÉCAPITULATIF · DÉMONSTRATION</p><h2>Votre demande<br>est prête à relire.</h2><p><strong>${esc(data.marque)} ${esc(data.modele)}</strong><br>${esc(data.annee)} · ${esc(data.carburant)}<br>${esc(data.moteur)}</p><p style="margin:20px 0">${esc(data.question || 'Aucune précision supplémentaire.')}</p><p class="muted">Aucune recommandation automatique. Aucun envoi à un conseiller. Le service WhatsApp et les coordonnées ENRM seront ajoutés ultérieurement.</p><button class="text-link" id="edit-advice" style="margin-bottom:20px">Modifier ma demande</button><br><button class="button primary" id="finish-advice">Terminer la simulation <span>✓</span></button>`;
    $('#edit-advice').onclick = () => {
      openAdvice();
      Object.entries(data).forEach(([k, v]) => {
        const field = $('#advice-form').elements.namedItem(k);
        if (
          field instanceof HTMLInputElement ||
          field instanceof HTMLSelectElement ||
          field instanceof HTMLTextAreaElement
        )
          field.value = v;
      });
    };
    $('#finish-advice').onclick = () => closeDialog($('#flow-dialog'));
  };
}
function checkout() {
  if (!cart.length) return;
  const snapshot = cart.map((c) => ({ ...c }));
  const requestId = crypto.randomUUID();
  $('#flow-content').innerHTML =
    `<p class="eyebrow">${supabase ? 'DEMANDE DE COMMANDE' : 'COMMANDE DE DÉMONSTRATION'}</p><h2>Votre prochain départ,<br>en quelques étapes.</h2><p class="muted">${supabase ? 'Indiquez vos coordonnées. ENRM vous contactera pour confirmer la disponibilité, le prix et la livraison.' : 'Utilisez des informations fictives. Elles restent en mémoire uniquement pendant cette simulation.'}</p><form id="checkout-form">${formField(supabase ? 'Nom complet' : 'Nom fictif', 'nom')}${formField(supabase ? 'Téléphone' : 'Téléphone fictif', 'telephone', 'tel')}${formField(supabase ? 'Ville' : 'Ville fictive', 'ville')}<label class="full">${supabase ? 'Adresse souhaitée pour la livraison' : 'Adresse fictive'} *<textarea name="adresse" required maxlength="300"></textarea></label><p class="muted full">${supabase ? 'Les informations sont transmises à ENRM pour traiter cette demande. Aucune commande n’est finalisée sur ce formulaire.' : 'Aucune donnée ne sera transmise.'}</p>${supabase ? '<label class="full"><input type="checkbox" name="privacy_ack" required> J’ai lu l’<a href="confidentialite.html" target="_blank" rel="noopener noreferrer">information de confidentialité</a> et j’accepte l’utilisation de ces données pour traiter ma demande.</label>' : ''}<button class="button primary full" type="submit">Voir le récapitulatif <span>→</span></button></form>`;
  showDialog('#flow-dialog');
  $('#checkout-form').onsubmit = (e) => {
    e.preventDefault();
    const data = formValues(formData(e.target));
    $('#flow-content').innerHTML =
      `<p class="eyebrow">${supabase ? 'RÉCAPITULATIF DE COMMANDE' : 'VÉRIFICATION · DÉMONSTRATION'}</p><h2>Tout est en place.</h2><p>${esc(data.nom)} · ${esc(data.ville)}</p><div style="margin:20px 0">${snapshot
        .map((c) => {
          const p = requireProduct(products, c.id);
          return `<p>${c.qty} × ${esc(brandName(p.marque) + ' ' + p.sous_reference + ' ' + p.viscosite + ' · ' + p.litrage)} — ${money(p.price * c.qty)}</p>`;
        })
        .join(
          '',
        )}</div><p class="muted">Sous-total indicatif : ${money(snapshot.reduce((s, c) => s + requireProduct(products, c.id).price * c.qty, 0))}. Prix et disponibilité à confirmer par ENRM.</p><button class="button primary" id="confirm-demo">${supabase ? 'Envoyer ma demande' : 'Terminer la simulation'} <span>✓</span></button><p class="muted" id="order-error" role="alert"></p>`;
    $('#confirm-demo').onclick = async (event) => {
      const button = event.currentTarget as HTMLButtonElement;
      if (!supabase) {
        $('#flow-content').innerHTML =
          '<div class="success-icon">✓</div><p class="eyebrow">SIMULATION TERMINÉE</p><h2>Vous avez fait<br>le tour du parcours.</h2><p>Aucune commande créée, aucun paiement effectué et aucune donnée transmise.</p><p class="muted" style="margin-top:20px">Votre panier reste disponible pour poursuivre la découverte.</p>';
        return;
      }
      button.disabled = true;
      button.textContent = 'Enregistrement…';
      const { data: result, error } = await supabase.rpc('place_enrm_order', {
        p_customer_name: data.nom,
        p_phone: data.telephone,
        p_city: data.ville,
        p_delivery_address: data.adresse,
        p_items: snapshot,
        p_request_id: requestId,
      });
      if (error || !result?.[0]) {
        $('#order-error').textContent =
          error?.message || 'La commande n’a pas pu être enregistrée. Réessayez.';
        button.disabled = false;
        button.innerHTML = 'Réessayer <span>↻</span>';
        return;
      }
      cart = [];
      saveCart();
      renderCart();
      $('#flow-content').innerHTML =
        `<div class="success-icon">✓</div><p class="eyebrow">DEMANDE ENREGISTRÉE</p><h2>Merci. ENRM vous recontactera.</h2><p>Référence : <strong>${esc(result[0].order_number)}</strong></p><p>Sous-total indicatif : <strong>${money(Number(result[0].total))}</strong></p><p class="muted" style="margin-top:20px">Le prix final, la disponibilité et la livraison restent à confirmer. Aucun achat n’est finalisé par cette demande.</p><button class="button" id="close-order-success">Fermer</button>`;
      $('#close-order-success').onclick = () => closeDialog($('#flow-dialog'));
    };
  };
}

document.addEventListener('click', (e) => {
  if (!(e.target instanceof Element)) return;
  const el = e.target.closest<HTMLElement>('button,a');
  if (!el) return;
  if (el.dataset.add) addToCart(el.dataset.add);
  if (
    el.dataset.variant &&
    page === 'product' &&
    !e.metaKey &&
    !e.ctrlKey &&
    !e.shiftKey &&
    !e.altKey
  ) {
    e.preventDefault();
    renderProduct(el.dataset.variant, true);
  }
  if (el.hasAttribute('data-advice')) openAdvice();
  if (el.hasAttribute('data-reset')) resetFilters();
  if (el.dataset.face && currentProduct) {
    $('#detail-photo').innerHTML =
      `<img src="${esc(currentProduct[el.dataset.face as 'recto' | 'verso'])}" alt="${el.dataset.face === 'verso' ? 'Verso' : 'Recto'} ${esc(currentProduct.designation + ' ' + currentProduct.litrage)}">`;
    document
      .querySelectorAll('[data-face]')
      .forEach((b) => b.setAttribute('aria-pressed', String(b === el)));
  }
  if (el.dataset.change) {
    const c = cart.find((c) => c.id === el.dataset.change);
    if (!c) return;
    c.qty = Math.max(1, Math.min(99, c.qty + Number(el.dataset.delta)));
    saveCart();
    renderCart();
  }
  if (el.dataset.remove) {
    cart = sanitizeCart(cart, new Set(products.map((p) => p.id)));
    saveCart();
    renderCart();
  }
  if (el.id === 'checkout') checkout();
  if (el.dataset.scroll) {
    const rail = document.getElementById(el.dataset.scroll);
    if (!rail) return;
    rail.scrollBy({
      left: rail.clientWidth * 0.8 * Number(el.dataset.direction),
      behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
    });
  }
});
$('#open-cart').onclick = () => {
  renderCart();
  showDialog('#cart-dialog');
};
$('#menu-button').onclick = () => {
  const open = $('#mobile-nav').hidden;
  $('#mobile-nav').hidden = !open;
  $('#menu-button').setAttribute('aria-expanded', String(open));
};
async function init() {
  try {
    [products, categories] = await Promise.all([loadCatalogue(), loadCategories()]);
    cart = cart.filter(
      (c) =>
        products.some((p) => p.id === c.id) && Number.isInteger(c.qty) && c.qty > 0 && c.qty <= 99,
    );
    saveCart();
    if (page === 'catalogue') {
      const categorySelect = document.querySelector<HTMLSelectElement>('#category');
      if (categorySelect)
        categorySelect.innerHTML =
          categorySelect.options[0].outerHTML +
          categories
            .map(
              (category) => `<option value="${esc(category.slug)}">${esc(category.name)}</option>`,
            )
            .join('');
      populate('brand', [...products.map((p) => p.marque), 'Meyle', 'Valvoline']);
      populate(
        'range',
        products.map((p) => p.gamme),
      );
      populate(
        'viscosity',
        products.map((p) => p.viscosite),
      );
      populate(
        'volume',
        products.map((p) => p.litrage),
      );
      ['search', 'category', 'brand', 'range', 'viscosity', 'volume', 'sort'].forEach((k) => {
        if (params.has(k))
          document.querySelector<HTMLInputElement | HTMLSelectElement>('#' + k)!.value =
            params.get(k) || '';
        $('#' + k).addEventListener(k === 'search' ? 'input' : 'change', () => updateCatalogue());
      });
      $('#reset').onclick = resetFilters;
      $('#load-more').onclick = () => {
        limit += 12;
        renderProducts();
      };
      $('#toggle-filters').onclick = () => {
        const open = $('#filters').classList.toggle('open');
        $('#toggle-filters').setAttribute('aria-expanded', String(open));
      };
      updateCatalogue();
    }
    if (page === 'product') renderProduct(params.get('id'));
    if (page === 'home') {
      $('#hero-oils').innerHTML = ['ENRM-HM-097', 'ENRM-HM-067', 'ENRM-HM-031']
        .map((id) => {
          const p = requireProduct(products, id);
          return `<a class="hero-oil-item" href="${esc(productUrl(id))}" aria-label="${esc(brandName(p.marque) + ' ' + p.sous_reference + ' ' + p.viscosite + ' ' + p.litrage)}">${photo(p, 'eager')}</a>`;
        })
        .join('');
      if (location.hash.startsWith('#ENRM-HM-')) {
        location.replace(productUrl(location.hash.slice(1)));
        return;
      }
      $('#featured-products').innerHTML = selection
        .map((id) => requireProduct(products, id))
        .map(card)
        .join('');
      const formats = ['ENRM-HM-069', 'ENRM-HM-156', 'ENRM-HM-031', 'ENRM-HM-097'].map((id) =>
        requireProduct(products, id),
      );
      $('#atelier-rail').innerHTML = formats.map(card).join('');
      const homeCollections: [string, (p: Product) => boolean][] = [
        ['grade-530', (p) => p.viscosite === '5W-30' && p.litrage === '5 L'],
        ['litre-products', (p) => p.litrage === '1 L'],
        ['grade-540', (p) => p.viscosite === '5W-40' && p.litrage === '5 L'],
      ];
      homeCollections.forEach(([id, match]) => {
        const pool = products.filter((p) => match(p) && p.recto),
          chosen = [];
        for (let round = 0; chosen.length < 6 && round < pool.length; round++) {
          for (const brand of brands) {
            const p = pool.filter((p) => p.marque === brand)[round];
            if (p) chosen.push(p);
            if (chosen.length === 6) break;
          }
        }
        $('#' + id).innerHTML = chosen.map(card).join('');
      });
      const logoList = brands
        .map((b) => {
          const ext = b === 'TotalEnergies' ? 'png' : 'svg';
          return `<a class="brand-tile" href="catalogue.html?brand=${encodeURIComponent(b)}"><img src="assets/brands/${b}.${ext}?v=5" alt="${esc(brandName(b))}" loading="eager"></a>`;
        })
        .join('');
      $('#logo-track').innerHTML =
        `<div class="logo-group">${logoList}</div><div class="logo-group" aria-hidden="true">${logoList.replaceAll('<a ', '<a tabindex="-1" ')}</div>`;
    }
    const mini = $('#advice-mini');
    if (mini)
      mini.onsubmit = (event) => {
        event.preventDefault();
        const data = new FormData(mini);
        openAdvice();
        for (const name of ['marque', 'modele', 'annee']) {
          const field = $('#advice-form').elements.namedItem(name);
          if (field instanceof HTMLInputElement) field.value = fieldValue(data, name);
        }
      };
    setupMotion(page);
  } catch (error) {
    const target = $('#product-page') || $('#product-grid') || $('#featured-products');
    if (target)
      target.innerHTML =
        '<p class="empty">Le catalogue ne peut pas être chargé. Rechargez la page depuis le serveur local.</p>';
    console.error(error);
  }
}
document.addEventListener(
  'error',
  (event) => {
    const image = event.target;
    if (!(image instanceof HTMLImageElement)) return;
    const placeholder = document.createElement('div');
    placeholder.className = 'placeholder';
    placeholder.textContent = image.src.includes('/brands/')
      ? image.alt
      : 'Visuel indisponible · ' + image.alt;
    image.replaceWith(placeholder);
  },
  true,
);
init();
