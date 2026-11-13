'use client';

import { useEffect, useMemo, useState } from 'react';
import type { Product } from '../../shared/types';
import { productSlug } from '../../shared/slugs';
import { loadCatalogueProductsByIds } from '../../shared/catalogue';
import { resolveMediaUrl } from '../../lib/seo';
import { useCart } from './CartProvider';
const mad = (price: number) =>
  `${new Intl.NumberFormat('fr-MA', { maximumFractionDigits: 2 }).format(price)} MAD`;

export function CartClient() {
  const { items, ready, setQuantity, removeItem } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const byId = useMemo(() => new Map(products.map((product) => [product.id, product])), [products]);

  useEffect(() => {
    if (!ready) return;
    let active = true;
    void loadCatalogueProductsByIds(items.map((item) => item.id))
      .then((rows) => {
        if (active) setProducts(rows);
      })
      .catch(() => {
        if (active) setProducts([]);
      });
    return () => {
      active = false;
    };
  }, [items, ready]);
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
      {!ready ? (
        <p className="loading" role="status">
          Chargement du panier…
        </p>
      ) : !items.length ? (
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
                      <button className="text-link" onClick={() => removeItem(item.id)}>
                        Retirer cette référence
                      </button>
                    </div>
                  </article>
                );
              const name = `${product.marque.replaceAll('_', ' ')} ${product.sous_reference}`;
              const imageUrl = resolveMediaUrl(product.recto);
              return (
                <article className="cart-item" key={item.id}>
                  <a href={`/produits/${productSlug(product)}`} className="cart-photo">
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={`${name} ${product.viscosite} ${product.litrage}`}
                        width="96"
                        height="96"
                      />
                    ) : (
                      <div className="placeholder">
                        <b>{product.litrage}</b>
                        <span>Visuel exact à venir</span>
                      </div>
                    )}
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
                        onClick={() => setQuantity(item.id, item.qty - 1)}
                        aria-label="Diminuer la quantité"
                      >
                        −
                      </button>
                      <span>{item.qty}</span>
                      <button
                        onClick={() => setQuantity(item.id, item.qty + 1)}
                        aria-label="Augmenter la quantité"
                        disabled={item.qty >= 99}
                      >
                        +
                      </button>
                      <button className="remove" onClick={() => removeItem(item.id)}>
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
