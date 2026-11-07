import type { AdminState, Order } from '../shared/types';
import { esc, money, currency } from '../shared/format';
import { requireById, requireProduct } from '../shared/catalogue';
import { icon } from './icons';
import { thumb, badge, field, empty } from './components';
import { fmt, initials, statuses } from './format';
interface ViewContext {
  state: AdminState;
  query: string;
  filter: string;
  page: number;
  period: number;
  today: Date;
  remoteOrdersActive?: boolean;
}
export function createAdminViews({
  state,
  query,
  filter,
  page,
  period,
  today,
  remoteOrdersActive = false,
}: ViewContext) {
  const product = (id: string) => requireProduct(state.products, id);
  const total = (o: Order) => o.items.reduce((sum, item) => sum + item.qty * item.price, 0);
  function selectedOrders(days = period) {
    return state.orders.filter(
      (o) => new Date(o.date) >= new Date(today.getTime() - (days - 1) * 864e5),
    );
  }
  function revenue(orders: Order[]) {
    return orders.filter((o) => o.status !== 'Annulée').reduce((s, o) => s + total(o), 0);
  }
  function title(text: string, sub: string, actions = '') {
    return `<div class="page-heading"><div><p class="eyebrow">VOTRE BOUTIQUE, EN MOUVEMENT</p><h1>${text}</h1><p>${sub}</p></div><div class="actions">${actions}</div></div>`;
  }
  function periodSelect() {
    return `<select class="period-select" id="period" aria-label="Période"><option value="7" ${period === 7 ? 'selected' : ''}>7 derniers jours</option><option value="30" ${period === 30 ? 'selected' : ''}>30 derniers jours</option><option value="90" ${period === 90 ? 'selected' : ''}>90 derniers jours</option></select>`;
  }
  function stat(
    label: string,
    value: string | number,
    unit: string,
    foot: [string, string],
    ico: string,
    accent = false,
  ) {
    return `<article class="stat"><div class="stat-label">${label}${icon(ico)}</div><strong>${value} <small>${unit}</small></strong><div class="stat-foot"><b class="${accent ? 'amber' : ''}">${foot[0]}</b><span>${foot[1]}</span></div><svg class="stat-spark" viewBox="0 0 70 26" fill="none"><path d="M1 23 12 17 23 20 34 10 45 14 56 6 69 3" stroke="${accent ? '#d6a043' : '#9eb9aa'}" stroke-width="1.5"/></svg></article>`;
  }
  function metrics() {
    const os = selectedOrders(),
      rev = revenue(os),
      active = os.filter((o) => o.status !== 'Annulée'),
      pending = state.orders.filter((o) =>
        ['À confirmer', 'À préparer', 'En préparation'].includes(o.status),
      );
    if (remoteOrdersActive) {
      const awaitingContact = state.orders.filter((o) => o.status === 'À confirmer').length;
      const outOfStock = lowStock().filter((p) => p.stock === 0).length;
      return `<section class="stats" aria-label="Indicateurs">${stat('Demandes reçues', os.length, '', [`${pending.length} à suivre`, 'sur la période'], 'bag')}${stat('À confirmer', awaitingContact, '', ['Contacter le client', 'puis mettre à jour le statut'], 'users', true)}${stat('Sous-total indicatif', money(rev), 'MAD', ['Hors demandes annulées', 'prix à confirmer'], 'wallet')}${stat('Références en rupture', outOfStock, '', [`${lowStock().length} sous le seuil`, 'stock actuel'], 'alert')}</section>`;
    }
    return `<section class="stats" aria-label="Indicateurs">${stat('Chiffre d’affaires', money(rev), 'MAD', [`${active.length} commandes`, 'sur la période'], 'wallet')}${stat('Commandes', os.length, '', [`${pending.length} à traiter`, 'dans la boutique'], 'bag', true)}${stat('Panier moyen', money(active.length ? rev / active.length : 0), 'MAD', ['Hors annulations', 'sur la période'], 'trend')}${stat('Clients', new Set(os.map((o) => o.customerId)).size, '', [`${state.customers.length} au total`, 'dans votre fichier'], 'users')}</section>`;
  }
  function chart() {
    const days = period,
      segments = 7,
      vals = Array.from({ length: segments }, (_, i) => {
        const end = today.getTime() - (((segments - 1 - i) * days) / segments) * 864e5;
        return revenue(
          state.orders.filter(
            (o) =>
              new Date(o.date).getTime() <= end &&
              new Date(o.date).getTime() > end - (days / segments) * 864e5,
          ),
        );
      }),
      max = Math.max(...vals, 1) * 1.2,
      w = 650,
      h = 150;
    const pts = vals.map((v, i) => [45 + (i * (w - 60)) / 6, h - (v / max) * (h - 15)]);
    const line = pts.map((p, i) => (i ? 'L' : 'M') + p.join(',')).join(' ');
    return `<div class="chart-wrap" role="img" aria-label="${remoteOrdersActive ? 'Sous-total indicatif des demandes' : 'Ventes'} sur ${days} jours : ${currency(revenue(selectedOrders()))}"><svg viewBox="0 0 660 195" preserveAspectRatio="none"><defs><linearGradient id="chartfill" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#e8ad33" stop-opacity=".16"/><stop offset="1" stop-color="#e8ad33" stop-opacity="0"/></linearGradient></defs>${[
      0, 1, 2, 3,
    ]
      .map((i) => {
        const y = 15 + i * 45;
        return `<path d="M44 ${y}H645" stroke="#edf1f5" stroke-dasharray="3 4"/><text x="0" y="${y + 3}">${money(max * (1 - i / 3))}</text>`;
      })
      .join(
        '',
      )}<path d="${line}L635,157L45,157Z" fill="url(#chartfill)"/><path class="chart-line" d="${line}" fill="none" stroke="#dba234" stroke-width="2.4" stroke-linejoin="round"/>${pts.map((p, i) => `<circle class="chart-point" cx="${p[0]}" cy="${p[1]}" r="4" fill="#dba234"><title>${currency(vals[i])}</title></circle><text x="${p[0]}" y="184" text-anchor="middle">${fmt(new Date(today.getTime() - (((6 - i) * days) / 7) * 864e5))}</text>`).join('')}</svg></div>`;
  }
  function salesPanel() {
    return `<section class="panel"><div class="panel-head"><div><h2>${remoteOrdersActive ? 'Demandes reçues' : 'Évolution des ventes'}</h2><p class="panel-sub">${remoteOrdersActive ? 'Sous-total indicatif des demandes, hors annulations.' : 'Un regard sur votre activité'}</p></div><div class="chart-legend"><span><i class="legend-dot"></i>${remoteOrdersActive ? 'Sous-total indicatif · MAD' : 'Ventes · MAD'}</span></div></div><div class="revenue-summary"><strong>${currency(revenue(selectedOrders()))}</strong><span>${period} derniers jours</span></div>${chart()}</section>`;
  }
  function bestSellers() {
    const counts: Record<string, { quantity: number; subtotal: number }> = {};
    selectedOrders()
      .filter((o) => o.status !== 'Annulée')
      .forEach((o) =>
        o.items.forEach((i) => {
          const item = (counts[i.id] ||= { quantity: 0, subtotal: 0 });
          item.quantity += i.qty;
          item.subtotal += i.qty * i.price;
        }),
      );
    return Object.entries(counts)
      .sort((a, b) => b[1].quantity - a[1].quantity)
      .slice(0, 4);
  }
  function bestPanel() {
    return `<section class="panel"><div class="panel-head"><div><h2>${remoteOrdersActive ? 'Articles les plus demandés' : 'Les meilleures références'}</h2><p class="panel-sub">${remoteOrdersActive ? 'Quantités demandées, hors demandes annulées.' : 'Vos produits les plus commandés'}</p></div><button class="text-action" data-nav="products" aria-label="Voir tous les produits">${icon('arrow')}</button></div><div class="performance-list">${
      bestSellers()
        .map(([id, stats]) => {
          const p = product(id);
          return `<button class="best-product" data-edit-product="${id}" style="width:100%;text-align:left">${thumb(p)}<span class="best-copy"><strong>${esc(p.marque.replace('_', ' '))} ${esc(p.sous_reference)}</strong><small>${esc(p.viscosite)} · ${esc(p.litrage)}</small></span><span class="best-count"><strong>${stats.quantity} ${remoteOrdersActive ? 'demandés' : 'vendus'}</strong><small>${currency(stats.subtotal)}</small></span></button>`;
        })
        .join('') ||
      `<div class="empty-state">${remoteOrdersActive ? 'Aucune demande sur cette période.' : 'Aucune vente sur cette période.'}</div>`
    }</div></section>`;
  }
  function orderRows(os: Order[]) {
    return os
      .map((o) => {
        const c = requireById(state.customers, o.customerId);
        return `<tr><td><button class="order-link" data-order="${o.id}">#${o.id}</button></td><td><div class="customer-cell"><span class="avatar">${esc(initials(c.name))}</span><span><strong>${esc(c.name)}</strong><small>${esc(c.city)}</small></span></div></td><td>${fmt(o.date)}<small>${o.items.reduce((s, i) => s + i.qty, 0)} articles</small></td><td>${badge(o.status)}</td><td><strong>${currency(total(o))}</strong></td><td><button class="icon-button" data-order="${o.id}" aria-label="Ouvrir ${o.id}">${icon('arrow')}</button></td></tr>`;
      })
      .join('');
  }
  function orderTable(os: Order[]) {
    return `<div class="table-wrap"><table><thead><tr><th>Commande</th><th>Client</th><th>Date</th><th>Statut</th><th>Sous-total</th><th></th></tr></thead><tbody>${orderRows(os)}</tbody></table></div>`;
  }
  function lowStock() {
    return state.products
      .filter((p) => p.status === 'Actif' && p.stock <= state.settings.threshold)
      .sort((a, b) => a.stock - b.stock);
  }
  function overview() {
    return (
      title(
        'Vue d’ensemble',
        `Bonjour, l’équipe ENRM. Voici où en est votre boutique.`,
        periodSelect() +
          `<button class="btn primary" data-action="new-product">${icon('plus')} Ajouter un produit</button>`,
      ) +
      metrics() +
      `<div class="dashboard-grid">${salesPanel()}${bestPanel()}</div><section class="panel orders-panel"><div class="panel-head"><div><h2>${remoteOrdersActive ? 'Demandes récentes' : 'Dernières commandes'}</h2><p class="panel-sub">${remoteOrdersActive ? 'Contactez le client puis mettez à jour le statut.' : 'Les prochains départs se préparent ici.'}</p></div><button class="text-action" data-nav="orders">${remoteOrdersActive ? 'Toutes les demandes' : 'Tout voir'} ${icon('arrow')}</button></div>${orderTable(state.orders.slice(0, 5))}<div class="table-foot"><span>${state.orders.length} ${remoteOrdersActive ? 'demandes enregistrées' : 'commandes dans votre boutique'}</span>${remoteOrdersActive ? '' : `<button class="text-action" data-action="new-order">Créer une commande ${icon('plus')}</button>`}</div></section><div class="bottom-grid"><section class="panel"><div class="panel-head"><h2>À surveiller en stock <span class="badge amber">${lowStock().length}</span></h2><button class="text-action" data-nav="inventory">Gérer le stock ${icon('arrow')}</button></div><div class="stock-list">${
        lowStock()
          .slice(0, 3)
          .map(
            (p) =>
              `<div class="stock-item">${thumb(p)}<div><strong>${esc(p.marque.replace('_', ' '))} ${esc(p.sous_reference)}</strong><small>${esc(p.viscosite)} · ${esc(p.litrage)}</small></div><span class="stock-number">${p.stock} restant${p.stock > 1 ? 's' : ''}</span><button class="icon-button" data-edit-product="${p.id}" aria-label="Modifier ${esc(p.designation)}">${icon('edit')}</button></div>`,
          )
          .join('') || '<div class="empty-state">Tous les stocks sont au-dessus du seuil.</div>'
      }</div></section>${activityPanel()}</div>`
    );
  }
  function activityPanel() {
    const items = remoteOrdersActive
      ? state.orders.slice(0, 3).map((o) => ({
          text: `#${o.id} · ${o.history[o.history.length - 1]?.label || o.status}`,
          date: o.history[o.history.length - 1]?.date || o.date,
        }))
      : state.activity.length
        ? state.activity.slice(0, 3)
        : state.orders.slice(0, 3).map((o) => ({ text: `Commande #${o.id} reçue`, date: o.date }));
    return `<section class="panel"><div class="panel-head"><h2>${remoteOrdersActive ? 'Activité des demandes' : 'Le fil de votre activité'}</h2><span class="badge">${remoteOrdersActive ? 'Connecté' : 'Démo'}</span></div><div class="activity-list">${items.map((a) => `<div class="activity-item"><p>${esc(a.text)}</p><small>${fmt(a.date)} · ${new Date(a.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</small></div>`).join('')}</div></section>`;
  }
  function tablePage(count: number) {
    const pages = Math.max(1, Math.ceil(count / 12));
    page = Math.min(page, pages);
    return `<div class="table-foot"><span>${count ? `${(page - 1) * 12 + 1}–${Math.min(page * 12, count)}` : '0'} sur ${count} résultats</span><div class="pagination"><button data-page="${page - 1}" ${page === 1 ? 'disabled' : ''} aria-label="Page précédente">←</button><span>${page} / ${pages}</span><button data-page="${page + 1}" ${page === pages ? 'disabled' : ''} aria-label="Page suivante">→</button></div></div>`;
  }
  const matches = (s: string, q = query) =>
    String(s)
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .includes(
        q
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .toLowerCase(),
      );
  function searchInput(ph: string) {
    return `<input class="local-search" id="local-query" value="${esc(query)}" aria-label="${ph}" placeholder="${ph}">`;
  }
  function tabs(values: string[]) {
    return `<div class="tabs">${values.map((v) => `<button data-filter="${v}" class="${filter === v ? 'active' : ''}">${v}</button>`).join('')}</div>`;
  }

  function orders() {
    const rows = state.orders.filter((o) => {
      const c = requireById(state.customers, o.customerId);
      return (
        (filter === 'Tous' || o.status === filter) &&
        matches(o.id + ' ' + c.name + ' ' + c.city + ' ' + (c.phone || '') + ' ' + o.tracking)
      );
    });
    const shown = rows.slice((page - 1) * 12, page * 12);
    return (
      title(
        'Commandes',
        remoteOrdersActive
          ? 'Demandes reçues depuis la boutique.'
          : 'De la confirmation à la livraison, gardez le fil.',
        `<button class="btn" data-export="orders">${icon('download')} Exporter</button>${remoteOrdersActive ? '' : `<button class="btn primary" data-action="new-order">${icon('plus')} Nouvelle commande</button>`}`,
      ) +
      `<section class="panel"><div class="toolbar">${tabs(['Tous', ...statuses])}${searchInput('Rechercher une commande…')}</div>${shown.length ? orderTable(shown) : empty()}${tablePage(rows.length)}</section>`
    );
  }
  function products(inventory = false) {
    const rows = state.products.filter(
      (p) =>
        matches([p.designation, p.id, p.marque, p.viscosite, p.litrage].join(' ')) &&
        (filter === 'Tous' ||
          (filter === 'Stock faible'
            ? p.stock <= state.settings.threshold
            : filter === 'Rupture'
              ? p.stock === 0
              : p.status === filter)),
    );
    const shown = rows.slice((page - 1) * 12, page * 12);
    return (
      title(
        inventory ? 'Stock & inventaire' : 'Produits',
        inventory
          ? 'La bonne référence, disponible au bon moment.'
          : `${state.products.length} références. Un catalogue sous contrôle.`,
        `<button class="btn" data-export="products">${icon('download')} Exporter</button><button class="btn primary" data-action="new-product">${icon('plus')} Ajouter un produit</button>`,
      ) +
      `<section class="panel"><div class="toolbar">${tabs(inventory ? ['Tous', 'Stock faible', 'Rupture'] : ['Tous', 'Actif', 'Brouillon'])}${searchInput('Nom, marque, référence…')}</div>${shown.length ? `<div class="table-wrap"><table><thead><tr><th>Produit</th><th>Référence</th><th>${inventory ? 'Disponibilité' : 'Statut'}</th><th>${inventory ? 'Stock disponible' : 'Prix'}</th><th>${inventory ? 'Seuil d’alerte' : 'Stock'}</th><th></th></tr></thead><tbody>${shown.map((p) => `<tr><td><div class="product-name">${thumb(p)}<span><strong>${esc(p.marque.replace('_', ' '))} ${esc(p.sous_reference)}</strong><small>${esc(p.viscosite)} · ${esc(p.litrage)}</small></span></div></td><td>${esc(p.id)}</td><td>${badge(inventory ? (p.stock === 0 ? 'Rupture' : p.stock <= state.settings.threshold ? 'Stock faible' : 'Actif') : p.status)}</td><td>${inventory ? `<form class="inline-stock" data-stock="${p.id}"><input type="number" name="stock" aria-label="Stock de ${esc(p.id)}" value="${p.stock}" min="0" max="999999" required><button type="submit">Enregistrer</button></form>` : `<strong>${currency(p.price)}</strong>`}</td><td>${inventory ? state.settings.threshold + ' unités' : p.stock + ' disponibles'}</td><td><button class="icon-button" data-edit-product="${p.id}" aria-label="Modifier ${esc(p.id)}">${icon('edit')}</button></td></tr>`).join('')}</tbody></table></div>` : empty()}${tablePage(rows.length)}</section>`
    );
  }
  function customers() {
    const rows = state.customers.filter(
      (c) =>
        matches(c.name + ' ' + c.city + ' ' + c.email) && (filter === 'Tous' || c.type === filter),
    );
    return (
      title(
        'Clients',
        'Une relation qui se construit à chaque commande.',
        `<button class="btn" data-export="customers">${icon('download')} Exporter</button><button class="btn primary" data-action="new-customer">${icon('plus')} Ajouter un client</button>`,
      ) +
      `<section class="panel"><div class="toolbar">${tabs(['Tous', 'Particulier', 'Professionnel'])}${searchInput('Nom, email ou ville…')}</div>${
        rows.length
          ? `<div class="table-wrap"><table><thead><tr><th>Client</th><th>Ville</th><th>Profil</th><th>Commandes</th><th>Total commandé</th><th></th></tr></thead><tbody>${rows
              .map((c) => {
                const os = state.orders.filter((o) => o.customerId === c.id);
                return `<tr><td><div class="customer-cell"><span class="avatar">${esc(initials(c.name))}</span><span><strong>${esc(c.name)}</strong><small>${esc(c.email)}</small></span></div></td><td>${esc(c.city)}</td><td>${badge(c.type)}</td><td>${os.length}</td><td><strong>${currency(revenue(os))}</strong></td><td><button class="icon-button" data-customer="${c.id}" aria-label="Modifier ${esc(c.name)}">${icon('edit')}</button></td></tr>`;
              })
              .join('')}</tbody></table></div>`
          : empty()
      }</section>`
    );
  }
  function promotions() {
    return (
      title(
        'Promotions',
        'Donnez une nouvelle impulsion à votre boutique.',
        `<button class="btn primary" data-action="new-promo">${icon('plus')} Créer une promotion</button>`,
      ) +
      `<div class="promo-grid">${state.promotions.map((p) => `<article class="panel promo"><div style="display:flex;justify-content:space-between">${icon('tag')}${badge(p.status)}</div><h2 class="promo-code">${esc(p.code)}</h2><p class="promo-value">${p.type === 'Pourcentage' ? p.value + ' %' : currency(p.value)} de réduction</p><div class="promo-footer"><span>Jusqu’au ${fmt(p.expiry)}</span><button class="text-action" data-promo="${p.id}">Modifier ${icon('edit')}</button></div></article>`).join('')}</div><p class="form-note">Codes de démonstration : aucune remise n’est appliquée au panier de la boutique.</p>`
    );
  }
  function analytics() {
    const os = selectedOrders();
    return (
      title(
        'Statistiques',
        'Les chiffres utiles pour préparer la suite.',
        periodSelect() +
          `<button class="btn" data-export="orders">${icon('download')} Exporter les commandes</button>`,
      ) +
      metrics() +
      `<div class="dashboard-grid">${salesPanel()}${bestPanel()}</div><div class="bottom-grid"><section class="panel"><div class="panel-head"><h2>Répartition des commandes</h2></div><div class="settings-body">${statuses
        .map((s) => {
          const n = os.filter((o) => o.status === s).length;
          return `<div style="margin:15px 0"><div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:7px"><span>${s}</span><strong>${n}</strong></div><div style="height:7px;background:#f1f4f7;border-radius:5px;overflow:hidden"><div style="width:${os.length ? (n / os.length) * 100 : 0}%;height:100%;background:${s === 'Livrée' ? '#7eaf9a' : s === 'Annulée' ? '#d49b95' : '#dca73a'}"></div></div></div>`;
        })
        .join(
          '',
        )}</div></section><section class="panel"><div class="panel-head"><h2>Ventes par ville</h2></div><div class="table-wrap"><table><thead><tr><th>Ville</th><th>Commandes</th><th>Chiffre d’affaires</th></tr></thead><tbody>${[
        ...new Set(state.customers.map((c) => c.city)),
      ]
        .map((city) => {
          const orders = os.filter((o) => requireById(state.customers, o.customerId).city === city);
          return { city, orders, rev: revenue(orders) };
        })
        .sort((a, b) => b.rev - a.rev)
        .slice(0, 6)
        .map(
          (x) =>
            `<tr><td>${esc(x.city)}</td><td>${x.orders.length}</td><td><strong>${currency(x.rev)}</strong></td></tr>`,
        )
        .join('')}</tbody></table></div></section></div>`
    );
  }

  function settings() {
    return (
      title('Paramètres', 'Les préférences de votre espace ENRM.') +
      `<div class="settings-grid"><section class="panel"><div class="panel-head"><h2>Votre boutique</h2></div><form class="settings-body" id="settings-form"><div class="form-grid">${field('Nom de la boutique', 'name', state.settings.name, 'text', 'full maxlength="80"')}${field('Email de démonstration', 'email', state.settings.email, 'email', 'full')}${field('Seuil d’alerte stock', 'threshold', state.settings.threshold, 'number', 'min="0" max="9999" full')}</div><div class="form-actions"><button class="btn primary">Enregistrer</button></div></form></section><section class="panel"><div class="panel-head"><h2>Votre démonstration</h2></div><div class="settings-body"><p>Les produits, commandes, clients et promotions sont enregistrés dans ce navigateur. Le catalogue public reste inchangé.</p><p>Les commandes et données client sont fictives. Aucun paiement, envoi ou suivi transporteur réel.</p><button class="btn" data-action="backup">${icon('download')} Sauvegarder les données</button><div class="form-actions"><button class="btn danger" data-action="reset">Réinitialiser la démonstration</button></div></div></section></div>`
    );
  }
  function searchAll(q: string) {
    const ps = state.products.filter((p) =>
        matches(p.designation + ' ' + p.marque + ' ' + p.id, q),
      ),
      os = state.orders.filter((o) =>
        matches(o.id + ' ' + requireById(state.customers, o.customerId).name, q),
      ),
      cs = state.customers.filter((c) => matches(c.name + ' ' + c.city + ' ' + c.email, q));
    return (
      title('Recherche', `${ps.length + os.length + cs.length} résultats pour « ${esc(q)} »`) +
      `<div class="search-results">${
        (
          [
            [
              'Produits',
              ps
                .slice(0, 15)
                .map(
                  (p) =>
                    `<button class="search-result" data-edit-product="${p.id}" style="width:100%;text-align:left">${thumb(p)}<div><strong>${esc(p.designation)}</strong><small>${esc(p.id)} · ${currency(p.price)}</small></div>${icon('arrow')}</button>`,
                ),
            ],
            [
              'Commandes',
              os.map(
                (o) =>
                  `<button class="search-result" data-order="${o.id}" style="width:100%;text-align:left">${icon('bag')}<div><strong>#${o.id}</strong><small>${esc(requireById(state.customers, o.customerId).name)} · ${currency(total(o))}</small></div>${badge(o.status)}</button>`,
              ),
            ],
            [
              'Clients',
              cs.map(
                (c) =>
                  `<button class="search-result" data-customer="${c.id}" style="width:100%;text-align:left"><span class="avatar">${esc(initials(c.name))}</span><div><strong>${esc(c.name)}</strong><small>${esc(c.city)} · ${esc(c.email)}</small></div>${icon('arrow')}</button>`,
              ),
            ],
          ] as [string, string[]][]
        )
          .filter(([, rows]) => rows.length)
          .map(
            ([name, rows]) =>
              `<section class="panel"><div class="panel-head"><h2>${name}</h2></div>${rows.join('')}</section>`,
          )
          .join('') || empty()
      }</div>`
    );
  }

  return {
    overview,
    orders,
    products,
    inventory: () => products(true),
    customers,
    analytics,
    promotions,
    settings,
    search: () => searchAll(new URLSearchParams(location.hash.split('?')[1]).get('q') || ''),
  };
}
