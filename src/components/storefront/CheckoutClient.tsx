'use client';

import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import type { CartItem, Product } from '../../shared/types';
import { productSlug } from '../../shared/slugs';
import { getSupabaseBrowserClient } from '../../lib/supabase/client';
import { loadCatalogueProductsByIds } from '../../shared/catalogue';

const CART_KEY = 'enrm-demo-cart';
type CheckoutResult = { orderNumber: string; total: number } | null;
function readCart(): CartItem[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(CART_KEY) || '[]');
    if (!Array.isArray(value)) return [];
    return value.filter(
      (item): item is CartItem =>
        Boolean(item) &&
        typeof item.id === 'string' &&
        Number.isInteger(item.qty) &&
        item.qty > 0 &&
        item.qty <= 99,
    );
  } catch {
    return [];
  }
}
const mad = (price: number) =>
  `${new Intl.NumberFormat('fr-MA', { maximumFractionDigits: 2 }).format(price)} MAD`;

export function CheckoutClient({ supabaseConfigured }: { supabaseConfigured: boolean }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [error, setError] = useState('');
  const [result, setResult] = useState<CheckoutResult>(null);
  const [sending, setSending] = useState(false);
  const requestId = useRef<string | null>(null);
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
      active = false;
      window.removeEventListener('storage', refresh);
      window.removeEventListener('enrm-cart-changed', refresh);
    };
  }, []);
  const unavailable = items.filter((item) => !byId.has(item.id));
  const subtotal = items.reduce((sum, item) => sum + (byId.get(item.id)?.price || 0) * item.qty, 0);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    if (!items.length) return setError('Votre panier est vide.');
    if (unavailable.length)
      return setError(
        'Retirez ou remplacez les références qui ne sont plus disponibles avant de continuer.',
      );
    const form = new FormData(event.currentTarget);
    if (form.get('privacy_ack') !== 'on')
      return setError('Veuillez confirmer la lecture de l’information de confidentialité.');
    if (!supabaseConfigured) {
      setResult(null);
      setError(
        'Le mode local est actif : aucune demande ne sera transmise à ENRM. Configurez Supabase pour créer une vraie demande.',
      );
      return;
    }
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return setError('La connexion à Supabase n’est pas configurée.');
    requestId.current ??= crypto.randomUUID();
    setSending(true);
    const { data, error: rpcError } = await supabase.rpc('place_enrm_order', {
      p_customer_name: String(form.get('name') || '').trim(),
      p_phone: String(form.get('phone') || '').trim(),
      p_city: String(form.get('city') || '').trim(),
      p_delivery_address: String(form.get('address') || '').trim(),
      p_items: items.map(({ id, qty }) => ({ id, qty })),
      p_request_id: requestId.current,
    });
    setSending(false);
    if (rpcError || !data?.[0]) {
      setError(
        rpcError?.message ||
          'La demande n’a pas pu être enregistrée. Vérifiez vos coordonnées et le stock, puis réessayez.',
      );
      return;
    }
    setResult({ orderNumber: data[0].order_number, total: Number(data[0].total) });
    localStorage.removeItem(CART_KEY);
    window.dispatchEvent(new CustomEvent('enrm-cart-changed'));
    setItems([]);
  }

  if (result)
    return (
      <main id="main" className="section checkout-page">
        <div className="success-icon">✓</div>
        <p className="eyebrow">DEMANDE ENREGISTRÉE</p>
        <h1>Merci. ENRM vous recontactera.</h1>
        <p>
          Référence : <strong>{result.orderNumber}</strong>
        </p>
        <p>
          Sous-total indicatif : <strong>{mad(result.total)}</strong>
        </p>
        <p className="muted">
          La disponibilité, le prix final et la livraison restent à confirmer. Aucun paiement n’a
          été effectué.
        </p>
        <a className="button primary" href="/catalogue">
          Retourner au catalogue ↗
        </a>
      </main>
    );

  return (
    <main id="main" className="section checkout-page">
      <div className="section-heading">
        <div>
          <p className="eyebrow">DEMANDE DE COMMANDE</p>
          <h1>Vos coordonnées.</h1>
        </div>
      </div>
      {!items.length ? (
        <div className="empty">
          <h2>Votre panier est vide.</h2>
          <a className="button primary" href="/catalogue">
            Explorer le catalogue ↗
          </a>
        </div>
      ) : (
        <>
          <div className="checkout-grid">
            <form className="checkout-form" onSubmit={submit}>
              <label>
                Nom complet
                <input name="name" autoComplete="name" minLength={2} maxLength={120} required />
              </label>
              <label>
                Téléphone
                <input
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  minLength={6}
                  maxLength={30}
                  required
                />
              </label>
              <label>
                Ville
                <input
                  name="city"
                  autoComplete="address-level2"
                  minLength={2}
                  maxLength={100}
                  required
                />
              </label>
              <label className="full">
                Adresse souhaitée pour la livraison
                <textarea
                  name="address"
                  autoComplete="street-address"
                  minLength={5}
                  maxLength={300}
                  required
                />
              </label>
              <label className="privacy-ack full">
                <input name="privacy_ack" type="checkbox" required /> J’ai lu l’
                <a href="/confidentialite" target="_blank" rel="noopener noreferrer">
                  information de confidentialité
                </a>{' '}
                et j’accepte l’utilisation de ces données pour traiter ma demande.
              </label>
              {!supabaseConfigured && (
                <p className="notice full">
                  Mode local : le formulaire ne transmet aucune demande. Connectez Supabase avant
                  d’utiliser le checkout en réel.
                </p>
              )}
              {error && (
                <p className="error full" role="alert">
                  {error}
                </p>
              )}
              <button
                className="button primary full"
                type="submit"
                disabled={sending || !items.length}
              >
                {sending
                  ? 'Enregistrement…'
                  : supabaseConfigured
                    ? 'Envoyer ma demande'
                    : 'Vérifier la configuration'}{' '}
                <span>→</span>
              </button>
            </form>
            <aside className="checkout-summary">
              <h2>Votre demande</h2>
              {items.map((item) => {
                const product = byId.get(item.id);
                return (
                  <div className="checkout-line" key={item.id}>
                    {product ? (
                      <>
                        <a href={`/produits/${productSlug(product)}`}>
                          {product.marque.replaceAll('_', ' ')} {product.sous_reference} ·{' '}
                          {product.litrage}
                        </a>
                        <span>
                          {item.qty} × {mad(product.price)}
                        </span>
                      </>
                    ) : (
                      <>
                        <span>Indisponible · {item.id}</span>
                        <span>Retirez du panier</span>
                      </>
                    )}
                  </div>
                );
              })}
              <div className="checkout-total">
                <span>Sous-total indicatif</span>
                <strong>{mad(subtotal)}</strong>
              </div>
              <p>
                ENRM vous contacte pour confirmer la disponibilité, le prix final et la livraison.
                Aucun paiement en ligne n’est demandé.
              </p>
              {unavailable.length > 0 && (
                <p className="error">
                  Références à retirer : {unavailable.map((item) => item.id).join(', ')}
                </p>
              )}
            </aside>
          </div>
        </>
      )}
    </main>
  );
}
