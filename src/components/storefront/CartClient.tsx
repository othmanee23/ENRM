'use client';

import { useEffect, useMemo, useState } from 'react';
import type { CartItem, Product } from '../../shared/types';
import { productSlug } from '../../shared/slugs';
import { loadCatalogueProductsByIds } from '../../shared/catalogue';

const CART_KEY = 'enrm-demo-cart';

type StoredCartItem = CartItem;
function readCart(): StoredCartItem[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(CART_KEY) || '[]');
    if (!Array.isArray(value)) return [];
    const result = new Map<string, number>();
    for (const item of value) {
      if (
        !item ||
        typeof item.id !== 'string' ||
        !item.id ||
        !Number.isInteger(item.qty) ||
        item.qty < 1 ||
        item.qty > 99
      )
        continue;
      result.set(item.id, Math.min(99, (result.get(item.id) || 0) + item.qty));
    }
    return [...result].map(([id, qty]) => ({ id, qty }));
  } catch {
    return [];
  }
}
function saveCart(items: StoredCartItem[]) {
  localStorage.setItem(CART_KEY, JSON.stringify(items));
  window.dispatchEvent(new CustomEvent('enrm-cart-changed'));
}
const mad = (price: number) =>
  `${new Intl.NumberFormat('fr-MA', { maximumFractionDigits: 2 }).format(price)} MAD`;

export function CartClient() {
  const [items, setItems] = useState<StoredCartItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const byId = useMemo(() => new Map(products.map((product) => [product.id, product])), [products]);

  useEffect(() => {
    let active = true;
    const refresh = () => {
      const next = readCart();
      setItems(next);
      void loadCatalogueProductsByIds(next.map((item) => item.id))
        .then((rows) => {
          if (active) setProducts(rows);
        })
        .catch(() => {
          if (active) setProducts([]);
        });
    };
    refresh();
    window.addEventListener('storage', refresh);
    window.addEventListener('enrm-cart-changed', refresh);
    return () => {
      window.removeEventListener('storage', refresh);
      window.removeEventListener('enrm-cart-changed', refresh);
      active = false;
    };
  }, []);

  function update(id: string, nextQty: number) {
    const next =
      nextQty < 1
        ? items.filter((item) => item.id !== id)
        : items.map((item) => (item.id === id ? { ...item, qty: Math.min(99, nextQty) } : item));
    setItems(next);
    saveCart(next);
  }
  const stale = items.filter((item) => !byId.has(item.id));
  const subtotal = items.reduce((sum, item) => sum + (byId.get(item.id)?.price || 0) * item.qty, 0);

  return (
    <main id="main" className="section cart-page">
      <div className="section-heading">
        <div>
          <p className="eyebrow">VOTRE SÉLECTION</p>
          <h1>Votre panier.</h1>
        </div>
        <a className="text-link" href="/catalogue">
          Continuer à explorer ↗
        </a>
      </div>
      {!items.length ? (
        <div className="empty">
          <h2>Votre panier est encore vide.</h2>
          <p>Ajoutez des références pour préparer une demande à ENRM.</p>
          <a className="button primary" href="/catalogue">
            Explorer le catalogue ↗
          </a>
        </div>
      ) : (
        <>
          <div className="cart-list" aria-live="polite">
            {items.map((item) => {
              const product = byId.get(item.id);
              if (!product)
                return (
                  <article className="cart-item unavailable" key={item.id}>
                    <div>
                      <h2>Référence indisponible</h2>
                      <p>
                        {item.id} n’est plus publiée ou n’est pas accessible. Elle n’a pas été
                        remplacée.
                      </p>
                      <button className="text-link" onClick={() => update(item.id, 0)}>
                        Retirer cette référence
                      </button>
                    </div>
                  </article>
                );
              const name = `${product.marque.replaceAll('_', ' ')} ${product.sous_reference}`;
              return (
                <article className="cart-item" key={item.id}>
                  <a href={`/produits/${productSlug(product)}`} className="cart-photo">
                    <img
                      src={`/${product.recto.replace(/^\//, '')}`}
                      alt={`${name} ${product.viscosite} ${product.litrage}`}
                      width="96"
                      height="96"
                    />
                  </a>
                  <div className="cart-product">
                    <h2>
                      <a href={`/produits/${productSlug(product)}`}>{name}</a>
                    </h2>
                    <p>
                      {product.viscosite} · {product.litrage} · {product.id}
                    </p>
                    <strong>{mad(product.price * item.qty)}</strong>
                    <div className="cart-controls">
                      <button
                        onClick={() => update(item.id, item.qty - 1)}
                        aria-label="Diminuer la quantité"
                      >
                        −
                      </button>
                      <span>{item.qty}</span>
                      <button
                        onClick={() => update(item.id, item.qty + 1)}
                        aria-label="Augmenter la quantité"
                        disabled={item.qty >= 99}
                      >
                        +
                      </button>
                      <button className="remove" onClick={() => update(item.id, 0)}>
                        Retirer
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
          <aside className="cart-summary">
            <div>
              <span>Sous-total indicatif</span>
              <strong>{mad(subtotal)}</strong>
            </div>
            <p>
              Le montant est indicatif. Le prix final, la disponibilité et les frais de livraison
              seront confirmés par ENRM. Aucun paiement n’est prélevé sur ce site.
            </p>
            <a
              className={`button primary ${stale.length ? 'disabled' : ''}`}
              aria-disabled={stale.length > 0}
              href={stale.length ? undefined : '/commande'}
            >
              Continuer vers ma demande <span>→</span>
            </a>
          </aside>
        </>
      )}
    </main>
  );
}
