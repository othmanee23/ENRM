'use client';

import { useEffect } from 'react';

const pageForPath: Record<string, string> = {
  '/': 'home',
  '/catalogue': 'catalogue',
  '/produits': 'product',
  '/conseil': 'conseil',
  '/contact': 'contact',
  '/a-propos': 'a-propos',
  '/livraison': 'livraison',
  '/retours': 'retours',
  '/confidentialite': 'confidentialite',
  '/credits': 'credits',
  '/panier': 'panier',
  '/commande': 'commande',
};

export function StorefrontRuntime() {
  useEffect(() => {
    const path = window.location.pathname;
    const route = path.startsWith('/produits/') ? '/produits' : path;
    document.body.dataset.page = pageForPath[route] ?? 'site';
    void import('../../storefront/main');
  }, []);
  return null;
}
