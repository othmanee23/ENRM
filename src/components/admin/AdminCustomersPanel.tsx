'use client';

import { useEffect, useMemo, useState } from 'react';
import { Download, UserRoundPlus, Pencil } from 'lucide-react';
import type { Customer, Order } from '../../shared/types';

const currency = (amount: number) =>
  `${new Intl.NumberFormat('fr-MA', { maximumFractionDigits: 2 }).format(amount)} MAD`;
const normalize = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase();

type CustomersSnapshot = {
  view: string;
  restricted: boolean;
  actionableOrders: number | null;
  orders: Order[];
  customers: Customer[];
  connectedAdmin: boolean;
  remoteOrdersActive: boolean;
  remoteOrdersLoading: boolean;
  remoteOrdersTotal: number;
  remoteCustomersTotal: number;
  query: string;
  filter: string;
  page: number;
};

const emptySnapshot: CustomersSnapshot = {
  view: 'overview',
  restricted: false,
  actionableOrders: null,
  orders: [],
  customers: [],
  connectedAdmin: false,
  remoteOrdersActive: false,
  remoteOrdersLoading: false,
  remoteOrdersTotal: 0,
  remoteCustomersTotal: 0,
  query: '',
  filter: 'Tous',
  page: 1,
};

export function AdminCustomersPanel() {
  const [data, setData] = useState(emptySnapshot);
  useEffect(() => {
    const update = (event: Event) => setData((event as CustomEvent<CustomersSnapshot>).detail);
    window.addEventListener('enrm-admin-navigation', update);
    return () => window.removeEventListener('enrm-admin-navigation', update);
  }, []);

  const ordersByCustomer = useMemo(() => {
    const map = new Map<string, Order[]>();
    for (const order of data.orders)
      map.set(order.customerId, [...(map.get(order.customerId) || []), order]);
    return map;
  }, [data.orders]);
  const rows = useMemo(
    () =>
      data.customers.filter((customer) => {
        const matchesQuery = normalize(
          [customer.name, customer.city, customer.email, customer.phone || ''].join(' '),
        ).includes(normalize(data.query));
        return matchesQuery && (data.filter === 'Tous' || customer.type === data.filter);
      }),
    [data],
  );

  if (data.view !== 'customers') return null;
  if (data.connectedAdmin && !data.remoteOrdersActive)
    return (
      <main id="react-admin-customers">
        <Heading connected />
        <section className="panel settings-body" role="status">
          <h2>{data.remoteOrdersLoading ? 'Chargement des clients…' : 'Données indisponibles'}</h2>
          <p>
            Les clients dérivés des demandes ne sont pas disponibles. Réessayez dans quelques
            instants.
          </p>
        </section>
      </main>
    );

  const total = data.connectedAdmin ? data.remoteCustomersTotal : rows.length;
  const pages = Math.max(1, Math.ceil(total / 12));
  const page = Math.min(data.page, pages);
  const shown = data.connectedAdmin ? rows : rows.slice((page - 1) * 12, page * 12);
  const first = total ? (page - 1) * 12 + 1 : 0;
  const last = Math.min(page * 12, total);

  return (
    <main id="react-admin-customers">
      <Heading connected={data.connectedAdmin} />
      {data.connectedAdmin && (
        <p className="form-note">
          Clients regroupés à partir des demandes de commande. Les commandes ne créent pas de compte
          client.
        </p>
      )}
      <section className="panel">
        <div className="toolbar">
          <div className="tabs" aria-label="Filtrer les clients">
            {['Tous', 'Particulier', 'Professionnel'].map((filter) => (
              <button
                type="button"
                data-filter={filter}
                className={data.filter === filter ? 'active' : undefined}
                aria-pressed={data.filter === filter}
                key={filter}
              >
                {filter}
              </button>
            ))}
          </div>
          <input
            className="local-search"
            id="local-query"
            defaultValue={data.query}
            aria-label="Rechercher un client"
            placeholder="Nom, email ou ville…"
          />
        </div>
        {shown.length ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Client</th>
                  <th>Ville</th>
                  <th>Profil</th>
                  <th>{data.connectedAdmin ? 'Demandes' : 'Commandes'}</th>
                  <th>{data.connectedAdmin ? 'Sous-total indicatif' : 'Total commandé'}</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {shown.map((customer) => {
                  const orders = ordersByCustomer.get(customer.id) || [];
                  const subtotal =
                    customer.remote && customer.subtotal !== undefined
                      ? customer.subtotal
                      : orders
                          .filter((order) => order.status !== 'Annulée')
                          .reduce(
                            (sum, order) =>
                              sum +
                              order.items.reduce(
                                (orderTotal, item) => orderTotal + item.qty * item.price,
                                0,
                              ),
                            0,
                          );
                  return (
                    <tr key={customer.id}>
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
                            <small>{customer.remote ? customer.phone : customer.email}</small>
                          </span>
                        </div>
                      </td>
                      <td>{customer.city}</td>
                      <td>
                        <Badge status={customer.type} />
                      </td>
                      <td>
                        {customer.remote && customer.requestCount !== undefined
                          ? customer.requestCount
                          : orders.length}
                      </td>
                      <td>
                        <strong>{currency(subtotal)}</strong>
                      </td>
                      <td>
                        {customer.remote ? (
                          <span className="form-note">Issu des commandes</span>
                        ) : (
                          <button
                            type="button"
                            className="icon-button"
                            data-customer={customer.id}
                            aria-label={`Modifier ${customer.name}`}
                          >
                            <Pencil aria-hidden="true" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <h3>Aucun résultat</h3>
            <p>Essayez une autre recherche ou un autre filtre.</p>
          </div>
        )}
        {data.connectedAdmin ? (
          <div className="table-foot">
            <span>
              {first}–{last} sur {total} résultats
            </span>
            <div className="pagination">
              <button
                type="button"
                data-page={page - 1}
                disabled={page <= 1}
                aria-label="Page précédente"
              >
                ←
              </button>
              <span>
                {page} / {pages}
              </span>
              <button
                type="button"
                data-page={page + 1}
                disabled={page >= pages}
                aria-label="Page suivante"
              >
                →
              </button>
            </div>
          </div>
        ) : null}
      </section>
    </main>
  );
}

function Heading({ connected }: { connected: boolean }) {
  return (
    <div className="page-heading">
      <div>
        <p className="eyebrow">VOTRE BOUTIQUE, EN MOUVEMENT</p>
        <h1>Clients</h1>
        <p>Une relation qui se construit à chaque commande.</p>
      </div>
      <div className="actions">
        <button className="btn" type="button" data-export="customers">
          <Download aria-hidden="true" /> Exporter
        </button>
        {!connected && (
          <button className="btn primary" type="button" data-action="new-customer">
            <UserRoundPlus aria-hidden="true" /> Ajouter un client
          </button>
        )}
      </div>
    </div>
  );
}

function Badge({ status }: { status: string }) {
  return (
    <span
      className={`badge ${status === 'Particulier' ? 'blue' : status === 'Professionnel' ? 'amber' : ''}`}
    >
      {status}
    </span>
  );
}
