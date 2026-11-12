'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Download,
  Package,
  Plus,
  ShoppingBag,
  Users,
  Wallet,
} from 'lucide-react';
import type { AdminDashboardSummary } from '../../shared/catalogue';
import type { AdminState, Order } from '../../shared/types';
import { currency } from '../../shared/format';
import { statuses } from '../../admin/format';

type Snapshot = {
  view: string;
  restricted: boolean;
  state: AdminState | null;
  connectedAdmin: boolean;
  remoteOrdersActive: boolean;
  remoteProductsActive: boolean;
  dashboardSummary: AdminDashboardSummary | null;
  period: number;
  stockThreshold: number;
};

const empty: Snapshot = {
  view: 'overview',
  restricted: false,
  state: null,
  connectedAdmin: false,
  remoteOrdersActive: false,
  remoteProductsActive: false,
  dashboardSummary: null,
  period: 30,
  stockThreshold: 10,
};

function subtotal(order: Order) {
  return order.items.reduce((sum, item) => sum + item.qty * item.price, 0);
}

function AdminHeading({
  title,
  description,
  actions,
}: {
  title: string;
  description: string;
  actions?: ReactNode;
}) {
  return (
    <div className="page-heading">
      <div>
        <p className="eyebrow">VOTRE BOUTIQUE, EN MOUVEMENT</p>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {actions && <div className="actions">{actions}</div>}
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const cls =
    status === 'Livrée' || status === 'Actif'
      ? 'green'
      : status === 'Annulée' || status === 'Rupture'
        ? 'red'
        : 'amber';
  return <span className={`badge ${cls}`}>{status}</span>;
}

export function AdminDashboardPanel() {
  const [data, setData] = useState(empty);
  useEffect(() => {
    const update = (event: Event) => setData((event as CustomEvent<Snapshot>).detail);
    window.addEventListener('enrm-admin-navigation', update);
    return () => window.removeEventListener('enrm-admin-navigation', update);
  }, []);

  const state = data.state;
  const summary = data.dashboardSummary;
  const orders = state?.orders ?? [];
  const products = state?.products ?? [];
  const customers = state?.customers ?? [];
  const connected = data.connectedAdmin;
  const overviewUnavailable = connected && (!data.remoteOrdersActive || !data.remoteProductsActive);
  const analyticsUnavailable = connected && !data.remoteOrdersActive;
  const days = data.period;
  const periodOrders = useMemo(() => {
    const cutoff = Date.now() - days * 864e5;
    return orders.filter((order) => new Date(order.date).getTime() >= cutoff);
  }, [orders, days]);
  const periodSubtotal = useMemo(
    () =>
      periodOrders
        .filter((order) => order.status !== 'Annulée')
        .reduce((sum, order) => sum + subtotal(order), 0),
    [periodOrders],
  );
  const lowStock = products
    .filter((product) => product.status === 'Actif' && product.stock <= data.stockThreshold)
    .sort((a, b) => a.stock - b.stock);

  if (!['overview', 'analytics', 'promotions', 'settings', 'search'].includes(data.view))
    return null;
  if (data.restricted) {
    return (
      <main id="react-admin-summary">
        <section className="panel settings-body">
          <h2>Accès administrateur requis</h2>
          <p>Vérification de la session et des droits en cours.</p>
        </section>
      </main>
    );
  }

  if (data.view === 'search') {
    const query = new URLSearchParams(window.location.hash.split('?')[1] || '').get('q') || '';
    if (connected && !data.remoteOrdersActive) {
      return (
        <main id="react-admin-summary">
          <AdminHeading title="Recherche" description="Recherche des produits et demandes." />
          <section className="panel settings-body" role="status">
            <h2>Données indisponibles</h2>
            <p>Les demandes ne sont pas chargées. Réessayez après avoir vérifié la connexion.</p>
          </section>
        </main>
      );
    }
    const matches = (text: string) =>
      text
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLocaleLowerCase()
        .includes(
          query
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLocaleLowerCase(),
        );
    const productMatches = products
      .filter((product) => matches(`${product.designation} ${product.marque} ${product.id}`))
      .slice(0, 15);
    const orderMatches = orders.filter((order) =>
      matches(
        `${order.id} ${customers.find((customer) => customer.id === order.customerId)?.name || ''}`,
      ),
    );
    const customerMatches = customers.filter((customer) =>
      matches(`${customer.name} ${customer.city} ${customer.email}`),
    );
    const total = productMatches.length + orderMatches.length + customerMatches.length;
    return (
      <main id="react-admin-summary">
        <AdminHeading title="Recherche" description={`${total} résultats pour « ${query} »`} />
        {total ? (
          <div className="search-results">
            {productMatches.length > 0 && (
              <section className="panel">
                <div className="panel-head">
                  <h2>Produits</h2>
                </div>
                {productMatches.map((product) => (
                  <button className="search-result" data-edit-product={product.id} key={product.id}>
                    <span className="thumb">
                      {product.recto ? <img src={product.recto} alt="" /> : product.litrage}
                    </span>
                    <div>
                      <strong>{product.designation}</strong>
                      <small>
                        {product.id} · {currency(product.price)}
                      </small>
                    </div>
                    <ArrowRight size={16} />
                  </button>
                ))}
              </section>
            )}
            {orderMatches.length > 0 && (
              <section className="panel">
                <div className="panel-head">
                  <h2>Commandes</h2>
                </div>
                {orderMatches.map((order) => (
                  <button className="search-result" data-order={order.id} key={order.id}>
                    <ShoppingBag size={18} />
                    <div>
                      <strong>#{order.id}</strong>
                      <small>
                        {customers.find((customer) => customer.id === order.customerId)?.name ||
                          'Client'}{' '}
                        · {currency(subtotal(order))}
                      </small>
                    </div>
                    <StatusPill status={order.status} />
                  </button>
                ))}
              </section>
            )}
            {customerMatches.length > 0 && (
              <section className="panel">
                <div className="panel-head">
                  <h2>Clients</h2>
                </div>
                {customerMatches.map((customer) => (
                  <button className="search-result" data-customer={customer.id} key={customer.id}>
                    <Users size={18} />
                    <div>
                      <strong>{customer.name}</strong>
                      <small>
                        {customer.city} · {customer.email || customer.phone || ''}
                      </small>
                    </div>
                    <ArrowRight size={16} />
                  </button>
                ))}
              </section>
            )}
          </div>
        ) : (
          <section className="panel empty-state">
            <h2>Aucun résultat</h2>
            <p>Essayez un autre terme de recherche.</p>
          </section>
        )}
      </main>
    );
  }

  if (data.view === 'promotions') {
    return (
      <main id="react-admin-summary">
        <AdminHeading
          title="Promotions"
          description="Donnez une nouvelle impulsion à votre boutique."
          actions={
            !connected && (
              <button className="btn primary" data-action="new-promo">
                <Plus size={16} /> Créer une promotion
              </button>
            )
          }
        />
        {connected ? (
          <section className="panel settings-body">
            <h2>Promotions non configurées</h2>
            <p>
              Aucun code promo n’est enregistré dans la base ENRM et les remises ne sont pas
              appliquées aux demandes de commande.
            </p>
          </section>
        ) : (
          <>
            <div className="promo-grid">
              {(state?.promotions ?? []).map((promotion) => (
                <article className="panel promo" key={promotion.id}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Package aria-hidden="true" />
                    <StatusPill status={promotion.status} />
                  </div>
                  <h2 className="promo-code">{promotion.code}</h2>
                  <p className="promo-value">
                    {promotion.type === 'Pourcentage'
                      ? `${promotion.value} %`
                      : currency(promotion.value)}{' '}
                    de réduction
                  </p>
                  <div className="promo-footer">
                    <span>Jusqu’au {promotion.expiry}</span>
                    <button className="text-action" data-promo={promotion.id}>
                      Modifier
                    </button>
                  </div>
                </article>
              ))}
            </div>
            <p className="form-note">
              Codes de démonstration : aucune remise n’est appliquée au panier de la boutique.
            </p>
          </>
        )}
      </main>
    );
  }

  if (data.view === 'settings') {
    const settings = state?.settings ?? {
      name: 'ENRM Maroc',
      email: 'demo@example.com',
      threshold: data.stockThreshold,
    };
    return (
      <main id="react-admin-summary">
        <AdminHeading title="Paramètres" description="Les préférences de votre espace ENRM." />
        {connected ? (
          <section className="panel settings-body">
            <h2>Paramètres non configurés</h2>
            <p>Aucun réglage partagé n’est encore enregistré dans la base ENRM.</p>
            <p>Le seuil d’alerte de stock actuellement affiché est une valeur de démonstration.</p>
          </section>
        ) : (
          <div className="settings-grid">
            <section className="panel">
              <div className="panel-head">
                <h2>Votre boutique</h2>
              </div>
              <form className="settings-body" id="settings-form">
                <div className="form-grid">
                  <label className="field full">
                    Nom de la boutique
                    <input name="name" defaultValue={settings.name} maxLength={80} />
                  </label>
                  <label className="field full">
                    Email de démonstration
                    <input name="email" type="email" defaultValue={settings.email} />
                  </label>
                  <label className="field full">
                    Seuil d’alerte stock
                    <input
                      name="threshold"
                      type="number"
                      min={0}
                      max={9999}
                      defaultValue={settings.threshold}
                    />
                  </label>
                </div>
                <div className="form-actions">
                  <button className="btn primary" type="submit">
                    Enregistrer
                  </button>
                </div>
              </form>
            </section>
            <section className="panel">
              <div className="panel-head">
                <h2>Votre démonstration</h2>
              </div>
              <div className="settings-body">
                <p>
                  Les produits, commandes, clients et promotions sont enregistrés dans ce
                  navigateur. Le catalogue public reste inchangé.
                </p>
                <p>
                  Les commandes et données client sont fictives. Aucun paiement, envoi ou suivi
                  transporteur réel.
                </p>
                <button className="btn" data-action="backup">
                  <Download size={16} /> Sauvegarder les données
                </button>
                <div className="form-actions">
                  <button className="btn danger" data-action="reset">
                    Réinitialiser la démonstration
                  </button>
                </div>
              </div>
            </section>
          </div>
        )}
      </main>
    );
  }

  const analytics = data.view === 'analytics';
  const unavailable = analytics ? analyticsUnavailable : overviewUnavailable;
  if (unavailable) {
    return (
      <main id="react-admin-summary">
        <AdminHeading
          title={analytics ? 'Statistiques' : 'Vue d’ensemble'}
          description={
            analytics
              ? 'Les chiffres utiles pour préparer la suite.'
              : 'Les demandes et le stock ENRM.'
          }
        />
        <section className="panel settings-body" role="status">
          <h2>Données indisponibles</h2>
          <p>
            Les données partagées ne sont pas disponibles. Réessayez après avoir vérifié la
            connexion.
          </p>
        </section>
      </main>
    );
  }

  const pending =
    summary?.pending_order_count ??
    orders.filter((order) => ['À confirmer', 'À préparer', 'En préparation'].includes(order.status))
      .length;
  const awaiting =
    summary?.awaiting_contact_count ??
    orders.filter((order) => order.status === 'À confirmer').length;
  const revenue = summary ? Number(summary.period_revenue) : periodSubtotal;
  const orderCount = summary?.period_order_count ?? periodOrders.length;
  const cityRows =
    summary?.cities.map((city) => ({
      city: city.city,
      count: Number(city.order_count),
      value: Number(city.subtotal),
    })) ??
    [
      ...new Set(
        periodOrders.map(
          (order) =>
            order.city ||
            customers.find((customer) => customer.id === order.customerId)?.city ||
            '',
        ),
      ),
    ]
      .filter(Boolean)
      .map((city) => {
        const matches = periodOrders.filter(
          (order) =>
            (order.city || customers.find((customer) => customer.id === order.customerId)?.city) ===
            city,
        );
        return {
          city,
          count: matches.length,
          value: matches
            .filter((order) => order.status !== 'Annulée')
            .reduce((sum, order) => sum + subtotal(order), 0),
        };
      })
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  const bestProducts =
    summary?.best_products.map((item) => ({
      id: item.id,
      name: item.name,
      detail: item.volume,
      quantity: Number(item.quantity),
      value: Number(item.subtotal),
    })) ??
    (() => {
      const map = new Map<
        string,
        { id: string; name: string; detail: string; quantity: number; value: number }
      >();
      for (const order of periodOrders.filter((item) => item.status !== 'Annulée'))
        for (const item of order.items) {
          const row = map.get(item.id) ?? {
            id: item.id,
            name: item.name,
            detail: item.volume,
            quantity: 0,
            value: 0,
          };
          row.quantity += item.qty;
          row.value += item.qty * item.price;
          map.set(item.id, row);
        }
      return [...map.values()].sort((a, b) => b.quantity - a.quantity).slice(0, 4);
    })();
  const statusCounts =
    summary?.status_counts.map((item) => ({ status: item.status, count: Number(item.count) })) ??
    statuses.map((status) => ({
      status,
      count: periodOrders.filter((order) => order.status === status).length,
    }));
  const maxRevenue = Math.max(
    1,
    ...(summary?.daily_revenue.map((item) => Number(item.revenue)) ?? [revenue]),
  );
  const recentOrders = orders.slice(0, 5);

  return (
    <main id="react-admin-summary">
      <AdminHeading
        title={analytics ? 'Statistiques' : 'Vue d’ensemble'}
        description={
          analytics
            ? 'Les chiffres utiles pour préparer la suite.'
            : 'Bonjour, l’équipe ENRM. Voici où en est votre boutique.'
        }
        actions={
          <>
            <select className="period-select" id="period" aria-label="Période" defaultValue={days}>
              <option value="7">7 derniers jours</option>
              <option value="30">30 derniers jours</option>
              <option value="90">90 derniers jours</option>
            </select>
            {analytics ? (
              <button className="btn" data-export="orders">
                <Download size={16} /> Exporter les commandes
              </button>
            ) : (
              <button className="btn primary" data-action="new-product">
                <Plus size={16} /> Ajouter un produit
              </button>
            )}
          </>
        }
      />
      <section className="stats" aria-label="Indicateurs">
        <Stat
          icon={<ShoppingBag />}
          label={connected ? 'Demandes reçues' : 'Commandes'}
          value={orderCount}
          foot={`${pending} à suivre`}
        />
        <Stat
          icon={<Users />}
          label="À confirmer"
          value={awaiting}
          foot="Contacter le client"
          accent
        />
        <Stat
          icon={<Wallet />}
          label={connected ? 'Sous-total indicatif' : 'Chiffre d’affaires'}
          value={currency(revenue)}
          foot="Hors demandes annulées"
        />
        <Stat
          icon={<AlertTriangle />}
          label="Références en rupture"
          value={
            summary?.out_of_stock_count ?? lowStock.filter((product) => product.stock === 0).length
          }
          foot={`${summary?.low_stock_count ?? lowStock.length} sous le seuil`}
        />
      </section>
      <div className="dashboard-grid">
        <section className="panel">
          <div className="panel-head">
            <div>
              <h2>{connected ? 'Demandes reçues' : 'Évolution des ventes'}</h2>
              <p className="panel-sub">
                {connected
                  ? 'Sous-total indicatif, hors demandes annulées.'
                  : 'Un regard sur votre activité.'}
              </p>
            </div>
          </div>
          <div className="revenue-summary">
            <strong>{currency(revenue)}</strong>
            <span>{days} derniers jours</span>
          </div>
          <div
            className="chart-wrap"
            role="img"
            aria-label={`${connected ? 'Sous-total des demandes' : 'Ventes'} sur ${days} jours: ${currency(revenue)}`}
          >
            <div className="performance-list">
              {(
                summary?.daily_revenue ??
                Array.from({ length: 7 }, () => ({ revenue: revenue / 7 }))
              ).map((item, index) => (
                <div className="activity-item" key={index}>
                  <span>{currency(Number(item.revenue))}</span>
                  <div
                    style={{
                      height: 8,
                      width: `${Math.max(2, (Number(item.revenue) / maxRevenue) * 100)}%`,
                      background: '#dba234',
                      borderRadius: 5,
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        </section>
        <section className="panel">
          <div className="panel-head">
            <div>
              <h2>{connected ? 'Articles les plus demandés' : 'Les meilleures références'}</h2>
              <p className="panel-sub">
                {connected
                  ? 'Quantités demandées, hors annulations.'
                  : 'Vos produits les plus commandés.'}
              </p>
            </div>
            <button className="text-action" data-nav="products" aria-label="Voir tous les produits">
              <ArrowRight size={16} />
            </button>
          </div>
          <div className="performance-list">
            {bestProducts.map((item) => (
              <button className="best-product" data-edit-product={item.id} key={item.id}>
                <span className="best-copy">
                  <strong>{item.name}</strong>
                  <small>{item.detail}</small>
                </span>
                <span className="best-count">
                  <strong>{item.quantity} demandés</strong>
                  <small>{currency(item.value)}</small>
                </span>
              </button>
            ))}
            {!bestProducts.length && (
              <div className="empty-state">Aucune demande sur cette période.</div>
            )}
          </div>
        </section>
      </div>
      {!analytics ? (
        <section className="panel orders-panel">
          <div className="panel-head">
            <div>
              <h2>{connected ? 'Demandes récentes' : 'Dernières commandes'}</h2>
              <p className="panel-sub">Contactez le client puis mettez à jour le statut.</p>
            </div>
            <button className="text-action" data-nav="orders">
              Tout voir <ArrowRight size={16} />
            </button>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Commande</th>
                  <th>Client</th>
                  <th>Date</th>
                  <th>Statut</th>
                  <th>Sous-total</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => {
                  const customer = customers.find((item) => item.id === order.customerId);
                  return (
                    <tr key={order.id}>
                      <td>
                        <button className="order-link" data-order={order.id}>
                          #{order.id}
                        </button>
                      </td>
                      <td>{customer?.name || 'Client'}</td>
                      <td>{new Date(order.date).toLocaleDateString('fr-MA')}</td>
                      <td>
                        <StatusPill status={order.status} />
                      </td>
                      <td>{currency(subtotal(order))}</td>
                      <td>
                        <button
                          className="icon-button"
                          data-order={order.id}
                          aria-label={`Ouvrir ${order.id}`}
                        >
                          <ArrowRight size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="table-foot">
            <span>{summary?.total_order_count ?? orders.length} demandes enregistrées</span>
            {!connected && (
              <button className="text-action" data-action="new-order">
                Créer une commande <Plus size={14} />
              </button>
            )}
          </div>
        </section>
      ) : null}
      <div className="bottom-grid">
        <section className="panel">
          <div className="panel-head">
            <h2>{connected ? 'Statut des demandes' : 'Répartition des commandes'}</h2>
          </div>
          <div className="settings-body">
            {statusCounts.map((item) => (
              <div className="activity-item" key={item.status}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>{item.status}</span>
                  <strong>{item.count}</strong>
                </div>
                <div
                  style={{ height: 7, background: '#f1f4f7', borderRadius: 5, overflow: 'hidden' }}
                >
                  <div
                    style={{
                      width: `${orderCount ? (item.count / orderCount) * 100 : 0}%`,
                      height: '100%',
                      background: '#dca73a',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
        <section className="panel">
          <div className="panel-head">
            <h2>{connected ? 'Demandes par ville' : 'Ventes par ville'}</h2>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Ville</th>
                  <th>Demandes</th>
                  <th>Sous-total indicatif</th>
                </tr>
              </thead>
              <tbody>
                {cityRows.map((item) => (
                  <tr key={item.city}>
                    <td>{item.city}</td>
                    <td>{item.count}</td>
                    <td>{currency(item.value)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
      {!analytics && (
        <div className="bottom-grid">
          <section className="panel">
            <div className="panel-head">
              <h2>
                À surveiller en stock{' '}
                <span className="badge amber">{summary?.low_stock_count ?? lowStock.length}</span>
              </h2>
              <button className="text-action" data-nav="inventory">
                Gérer le stock <ArrowRight size={16} />
              </button>
            </div>
            <div className="stock-list">
              {lowStock.slice(0, 3).map((product) => (
                <div className="stock-item" key={product.id}>
                  <div>
                    <strong>
                      {product.marque.replace('_', ' ')} {product.sous_reference}
                    </strong>
                    <small>
                      {product.viscosite} · {product.litrage}
                    </small>
                  </div>
                  <span className="stock-number">{product.stock} restants</span>
                  <button
                    className="icon-button"
                    data-edit-product={product.id}
                    aria-label={`Modifier ${product.id}`}
                  >
                    <Package size={16} />
                  </button>
                </div>
              ))}
            </div>
          </section>
          <section className="panel">
            <div className="panel-head">
              <h2>Le fil de votre activité</h2>
              <span className="badge">{connected ? 'Connecté' : 'Démo'}</span>
            </div>
            <div className="activity-list">
              {orders.slice(0, 3).map((order) => (
                <div className="activity-item" key={order.id}>
                  <p>
                    #{order.id} · {order.history.at(-1)?.label || order.status}
                  </p>
                  <small>{new Date(order.date).toLocaleString('fr-MA')}</small>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}
    </main>
  );
}

function Stat({
  icon,
  label,
  value,
  foot,
  accent = false,
}: {
  icon: ReactNode;
  label: string;
  value: string | number;
  foot: string;
  accent?: boolean;
}) {
  return (
    <article className="stat">
      <div className="stat-label">
        {label}
        {icon}
      </div>
      <strong>{value}</strong>
      <div className="stat-foot">
        <b className={accent ? 'amber' : undefined}>{foot}</b>
      </div>
      <svg className="stat-spark" viewBox="0 0 70 26" fill="none" aria-hidden="true">
        <path
          d="M1 23 12 17 23 20 34 10 45 14 56 6 69 3"
          stroke={accent ? '#d6a043' : '#9eb9aa'}
          strokeWidth="1.5"
        />
      </svg>
    </article>
  );
}
