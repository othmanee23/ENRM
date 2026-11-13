'use client';

import { useEffect, useMemo, useState } from 'react';
import { Download, PackagePlus, Pencil } from 'lucide-react';
import type { AdminProduct } from '../../shared/types';

const currency = (amount: number) =>
  `${new Intl.NumberFormat('fr-MA', { maximumFractionDigits: 2 }).format(amount)} MAD`;
const normalize = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase();

type ProductsSnapshot = {
  view: string;
  restricted: boolean;
  actionableOrders: number | null;
  orders: unknown[];
  customers: unknown[];
  connectedAdmin: boolean;
  remoteOrdersActive: boolean;
  remoteOrdersLoading: boolean;
  remoteOrdersTotal: number;
  query: string;
  filter: string;
  page: number;
  products: AdminProduct[];
  remoteProductsActive: boolean;
  remoteProductsTotal: number;
  stockThreshold: number;
};

const emptySnapshot: ProductsSnapshot = {
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
  products: [],
  remoteProductsActive: false,
  remoteProductsTotal: 0,
  stockThreshold: 5,
};

export function AdminProductsPanel() {
  const [data, setData] = useState(emptySnapshot);
  useEffect(() => {
    const update = (event: Event) => setData((event as CustomEvent<ProductsSnapshot>).detail);
    window.addEventListener('enrm-admin-navigation', update);
    return () => window.removeEventListener('enrm-admin-navigation', update);
  }, []);

  const inventory = data.view === 'inventory';
  const rows = useMemo(() => {
    if (data.connectedAdmin && data.remoteProductsActive) return data.products;
    return data.products.filter((product) => {
      const matchesQuery = normalize(
        [product.designation, product.id, product.marque, product.viscosite, product.litrage].join(
          ' ',
        ),
      ).includes(normalize(data.query));
      const matchesFilter =
        data.filter === 'Tous' ||
        (inventory
          ? data.filter === 'Stock faible'
            ? product.stock <= data.stockThreshold
            : data.filter === 'Rupture'
              ? product.stock === 0
              : true
          : product.status === data.filter);
      return matchesQuery && matchesFilter;
    });
  }, [data, inventory]);

  if (!['products', 'inventory'].includes(data.view)) return null;
  const title = inventory ? 'Stock & inventaire' : 'Produits';
  if (data.restricted) {
    return (
      <main id="react-admin-products">
        <Heading title={title} inventory={inventory} />
        <section className="panel settings-body" role="status">
          <h2>Accès administrateur requis</h2>
          <p>Vérification de la session et des droits en cours.</p>
        </section>
      </main>
    );
  }
  if (data.connectedAdmin && !data.remoteProductsActive) {
    return (
      <main id="react-admin-products">
        <Heading title={title} inventory={inventory} />
        <section className="panel settings-body" role="status">
          <h2>Données indisponibles</h2>
          <p>Les produits et le stock ne sont pas disponibles. Réessayez dans quelques instants.</p>
        </section>
      </main>
    );
  }
  const total =
    data.connectedAdmin && data.remoteProductsActive ? data.remoteProductsTotal : rows.length;
  const pageCount = Math.max(1, Math.ceil(total / 12));
  const page = Math.min(data.page, pageCount);
  const shown =
    data.connectedAdmin && data.remoteProductsActive
      ? rows
      : rows.slice((page - 1) * 12, page * 12);
  const filters = inventory ? ['Tous', 'Stock faible', 'Rupture'] : ['Tous', 'Actif', 'Brouillon'];

  return (
    <main id="react-admin-products">
      <Heading
        title={title}
        inventory={inventory}
        count={
          data.connectedAdmin && data.remoteProductsActive
            ? data.remoteProductsTotal
            : data.products.length
        }
      />
      <section className="panel">
        <div className="toolbar">
          <div
            className="tabs"
            aria-label={inventory ? 'Filtrer le stock' : 'Filtrer les produits'}
          >
            {filters.map((filter) => (
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
            aria-label="Rechercher un produit"
            placeholder="Nom, marque, référence…"
          />
        </div>
        {shown.length ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Produit</th>
                  <th>Référence</th>
                  <th>{inventory ? 'Disponibilité' : 'Statut'}</th>
                  <th>{inventory ? 'Stock disponible' : 'Prix'}</th>
                  <th>{inventory ? 'Seuil d’alerte' : 'Stock'}</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {shown.map((product) => {
                  const availability =
                    product.stock === 0
                      ? 'Rupture'
                      : product.stock <= data.stockThreshold
                        ? 'Stock faible'
                        : 'Actif';
                  return (
                    <tr key={product.id}>
                      <td>
                        <div className="product-name">
                          {product.recto ? (
                            <span className="thumb">
                              <img src={product.recto} alt="" />
                            </span>
                          ) : (
                            <span className="thumb empty">{product.litrage}</span>
                          )}
                          <span>
                            <strong>
                              {product.marque.replaceAll('_', ' ')} {product.sous_reference}
                            </strong>
                            <small>
                              {product.viscosite} · {product.litrage}
                            </small>
                          </span>
                        </div>
                      </td>
                      <td>{product.id}</td>
                      <td>
                        <Badge status={inventory ? availability : product.status} />
                      </td>
                      <td>
                        {inventory ? (
                          <form className="inline-stock" data-stock={product.id}>
                            <input
                              type="number"
                              name="stock"
                              aria-label={`Stock de ${product.id}`}
                              defaultValue={product.stock}
                              min={0}
                              max={999999}
                              required
                            />
                            <button type="submit">Enregistrer</button>
                          </form>
                        ) : (
                          <strong>{currency(product.price)}</strong>
                        )}
                      </td>
                      <td>
                        {inventory
                          ? `${data.stockThreshold} unités`
                          : `${product.stock} disponibles`}
                      </td>
                      <td>
                        <button
                          className="icon-button"
                          type="button"
                          data-edit-product={product.id}
                          aria-label={`Modifier ${product.id}`}
                        >
                          <Pencil aria-hidden="true" />
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
            <h3>Aucun résultat</h3>
            <p>Essayez une autre recherche ou un autre filtre.</p>
          </div>
        )}
        <div className="table-foot">
          <span>
            {total ? `${(page - 1) * 12 + 1}–${Math.min(page * 12, total)}` : '0'} sur {total}{' '}
            résultats
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
              {page} / {pageCount}
            </span>
            <button
              type="button"
              data-page={page + 1}
              disabled={page >= pageCount}
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

function Heading({
  title,
  inventory,
  count = 0,
}: {
  title: string;
  inventory: boolean;
  count?: number;
}) {
  return (
    <div className="page-heading">
      <div>
        <p className="eyebrow">VOTRE BOUTIQUE, EN MOUVEMENT</p>
        <h1>{title}</h1>
        <p>
          {inventory
            ? 'La bonne référence, disponible au bon moment.'
            : `${count} références. Un catalogue sous contrôle.`}
        </p>
      </div>
      <div className="actions">
        <button className="btn" type="button" data-export="products">
          <Download aria-hidden="true" /> Exporter
        </button>
        <button className="btn primary" type="button" data-action="new-product">
          <PackagePlus aria-hidden="true" /> Ajouter un produit
        </button>
      </div>
    </div>
  );
}

function Badge({ status }: { status: string }) {
  const color =
    status === 'Actif'
      ? 'green'
      : status === 'Rupture'
        ? 'red'
        : status === 'Stock faible' || status === 'Brouillon'
          ? 'amber'
          : '';
  return <span className={`badge ${color}`}>{status}</span>;
}
