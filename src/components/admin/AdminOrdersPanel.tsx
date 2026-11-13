'use client';

import { useEffect, useMemo, useState } from 'react';
import { Download, Plus, ArrowRight } from 'lucide-react';
import type { Customer, Order } from '../../shared/types';

const statuses = [
  'Tous',
  'À confirmer',
  'À préparer',
  'En préparation',
  'Expédiée',
  'Livrée',
  'Annulée',
];
const currency = (amount: number) =>
  `${new Intl.NumberFormat('fr-MA', { maximumFractionDigits: 2 }).format(amount)} MAD`;
const normalize = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase();

type OrdersSnapshot = {
  view: string;
  restricted: boolean;
  actionableOrders: number | null;
  orders: Order[];
  customers: Customer[];
  connectedAdmin: boolean;
  remoteOrdersActive: boolean;
  remoteOrdersLoading: boolean;
  remoteOrdersTotal: number;
  query: string;
  filter: string;
  page: number;
};

const emptySnapshot: OrdersSnapshot = {
  view: 'overview',
  restricted: false,
  actionableOrders: null,
  orders: [],
  customers: [],
  connectedAdmin: false,
  remoteOrdersActive: false,
  remoteOrdersLoading: false,
  remoteOrdersTotal: 0,
  query: '',
  filter: 'Tous',
  page: 1,
};

export function AdminOrdersPanel() {
  const [data, setData] = useState(emptySnapshot);
  useEffect(() => {
    const update = (event: Event) => setData((event as CustomEvent<OrdersSnapshot>).detail);
    window.addEventListener('enrm-admin-navigation', update);
    return () => window.removeEventListener('enrm-admin-navigation', update);
  }, []);

  const customerById = useMemo(
    () => new Map(data.customers.map((customer) => [customer.id, customer])),
    [data.customers],
  );
  const displayed = useMemo(() => {
    if (data.connectedAdmin && data.remoteOrdersActive) return data.orders;
    return data.orders.filter((order) => {
      const customer = customerById.get(order.customerId);
      if (!customer || (data.filter !== 'Tous' && order.status !== data.filter)) return false;
      const haystack = [
        order.id,
        customer.name,
        customer.city,
        customer.phone || '',
        order.tracking,
      ].join(' ');
      return normalize(haystack).includes(normalize(data.query));
    });
  }, [data, customerById]);

  if (data.view !== 'orders') return null;
  if (data.restricted) {
    return (
      <main id="react-admin-orders">
        <PageHeading connected />
        <section className="panel settings-body" role="status">
          <h2>Accès administrateur requis</h2>
          <p>Vérification de la session et des droits en cours.</p>
        </section>
      </main>
    );
  }
  if (data.connectedAdmin && !data.remoteOrdersActive) {
    return (
      <main id="react-admin-orders">
        <PageHeading connected />
        <section className="panel settings-body" role="status" aria-live="polite">
          <h2>{data.remoteOrdersLoading ? 'Chargement des demandes…' : 'Données indisponibles'}</h2>
          <p>
            {data.remoteOrdersLoading
              ? 'Connexion aux demandes de la boutique ENRM.'
              : 'Les demandes de commande ne sont pas disponibles. Réessayez dans quelques instants.'}
          </p>
        </section>
      </main>
    );
  }

  const resultCount =
    data.connectedAdmin && data.remoteOrdersActive ? data.remoteOrdersTotal : displayed.length;
  const pageCount = Math.max(1, Math.ceil(resultCount / 12));
  const rows =
    data.connectedAdmin && data.remoteOrdersActive
      ? displayed
      : displayed.slice((data.page - 1) * 12, data.page * 12);
  const first = resultCount ? (data.page - 1) * 12 + 1 : 0;
  const last = Math.min(data.page * 12, resultCount);

  return (
    <main id="react-admin-orders">
      <PageHeading connected={data.remoteOrdersActive} />
      <section className="panel">
        <div className="toolbar">
          <div className="tabs" aria-label="Filtrer les demandes par statut">
            {statuses.map((status) => (
              <button
                type="button"
                data-filter={status}
                className={data.filter === status ? 'active' : undefined}
                aria-pressed={data.filter === status}
                key={status}
              >
                {status}
              </button>
            ))}
          </div>
          <input
            className="local-search"
            id="local-query"
            defaultValue={data.query}
            aria-label="Rechercher une commande"
            placeholder="Rechercher une commande…"
          />
        </div>
        {rows.length ? (
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
                {rows.map((order) => {
                  const customer = customerById.get(order.customerId);
                  if (!customer) return null;
                  const total = order.items.reduce((sum, item) => sum + item.qty * item.price, 0);
                  const count = order.items.reduce((sum, item) => sum + item.qty, 0);
                  return (
                    <tr key={order.id}>
                      <td>
                        <button type="button" className="order-link" data-order={order.id}>
                          #{order.id}
                        </button>
                      </td>
                      <td>
                        <div className="customer-cell">
                          <span className="avatar">
                            {customer.name
                              .split(/\s+/)
                              .slice(0, 2)
                              .map((part) => part[0])
                              .join('')
                              .toUpperCase()}
                          </span>
                          <span>
                            <strong>{customer.name}</strong>
                            <small>{customer.city}</small>
                          </span>
                        </div>
                      </td>
                      <td>
                        {new Intl.DateTimeFormat('fr-MA', { dateStyle: 'medium' }).format(
                          new Date(order.date),
                        )}
                        <small>{count} articles</small>
                      </td>
                      <td>
                        <StatusBadge status={order.status} />
                      </td>
                      <td>
                        <strong>{currency(total)}</strong>
                      </td>
                      <td>
                        <button
                          type="button"
                          className="icon-button"
                          data-order={order.id}
                          aria-label={`Ouvrir ${order.id}`}
                        >
                          <ArrowRight aria-hidden="true" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <h3>Aucune demande</h3>
            <p>Essayez une autre recherche ou un autre statut.</p>
          </div>
        )}
        <div className="table-foot">
          <span>
            {first}–{last} sur {resultCount} résultats
          </span>
          <div className="pagination">
            <button
              type="button"
              data-page={data.page - 1}
              disabled={data.page <= 1}
              aria-label="Page précédente"
            >
              ←
            </button>
            <span>
              {data.page} / {pageCount}
            </span>
            <button
              type="button"
              data-page={data.page + 1}
              disabled={data.page >= pageCount}
              aria-label="Page suivante"
            >
              →
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}

function PageHeading({ connected }: { connected: boolean }) {
  return (
    <div className="page-heading">
      <div>
        <p className="eyebrow">VOTRE BOUTIQUE, EN MOUVEMENT</p>
        <h1>Commandes</h1>
        <p>
          {connected
            ? 'Demandes reçues depuis la boutique.'
            : 'De la confirmation à la livraison, gardez le fil.'}
        </p>
      </div>
      <div className="actions">
        <button className="btn" type="button" data-export="orders">
          <Download aria-hidden="true" /> Exporter
        </button>
        {!connected && (
          <button className="btn primary" type="button" data-action="new-order">
            <Plus aria-hidden="true" /> Nouvelle commande
          </button>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const color =
    status === 'Livrée'
      ? 'green'
      : ['À confirmer', 'À préparer', 'En préparation'].includes(status)
        ? 'amber'
        : status === 'Expédiée'
          ? 'blue'
          : status === 'Annulée'
            ? 'red'
            : '';
  return <span className={`badge ${color}`}>{status}</span>;
}
