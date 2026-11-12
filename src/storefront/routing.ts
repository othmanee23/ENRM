import catalogue from '../../public/catalogue.json';
import type { Product } from '../shared/types';
import { productSlug } from '../shared/slugs';

const fallbackProducts = catalogue as Product[];
const params = new URLSearchParams(typeof location === 'undefined' ? '' : location.search);
const page = typeof document === 'undefined' ? '' : document.body.dataset.page;

export function productUrl(id: string, currentProduct?: Product) {
  const product = currentProduct || fallbackProducts.find((item) => item.id === id);
  const slug = product ? productSlug(product) : `${id.toLowerCase()}--${id.toLowerCase()}`;
  return `/produits/${slug}`;
}

export function safeReturn() {
  const r = params.get('return');
  if (r) {
    try {
      const u = new URL(r, typeof location === 'undefined' ? 'https://enrm.ma' : location.href);
      if (
        u.origin === 'https://enrm.ma' ||
        (typeof location !== 'undefined' && u.origin === location.origin)
      )
        if (u.pathname === '/catalogue' || u.pathname.endsWith('/catalogue.html'))
          return '/catalogue' + u.search + u.hash;
    } catch {}
  }
  return '/catalogue';
}
