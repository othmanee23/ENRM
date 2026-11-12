import { beforeEach, afterEach, it, expect, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import type { AdminState } from '../src/shared/types';
const catalogue = JSON.parse(readFileSync('public/catalogue.json', 'utf8'));
const listeners: Array<
  [string, EventListenerOrEventListenerObject, boolean | AddEventListenerOptions | undefined]
> = [];
const q = <T extends HTMLElement = HTMLElement>(s: string): T => document.querySelector(s)!;
function mount(file: string, url: string) {
  let html = readFileSync(file, 'utf8').replace(
    /<!-- layout:(header|footer|dialogs) -->/g,
    (_, part: string) => readFileSync(`src/layout/${part}.html`, 'utf8'),
  );
  document.documentElement.innerHTML = html
    .replace(/<!doctype html>/i, '')
    .replace(/<\/?html[^>]*>/g, '');
  history.replaceState(null, '', url);
  const page =
    file === 'catalogue.html' ? 'catalogue' : file === 'product.html' ? 'product' : 'site';
  document.body.dataset.page = page;
  if (page === 'catalogue' || page === 'product') {
    const bootstrap = document.createElement('script');
    bootstrap.id = page === 'catalogue' ? 'catalogue-bootstrap' : 'product-bootstrap';
    bootstrap.type = 'application/json';
    bootstrap.textContent = JSON.stringify({ products: catalogue, categories: [] });
    document.body.append(bootstrap);
  }
}
function change(selector: string, value: string) {
  const el = q<HTMLInputElement | HTMLSelectElement>(selector);
  el.value = value;
  el.dispatchEvent(
    new Event(el instanceof HTMLSelectElement ? 'change' : 'input', { bubbles: true }),
  );
}
function submit(selector: string) {
  q<HTMLFormElement>(selector).dispatchEvent(
    new Event('submit', { bubbles: true, cancelable: true }),
  );
}
beforeEach(() => {
  vi.resetModules();
  localStorage.clear();
  Object.defineProperty(HTMLDialogElement.prototype, 'showModal', {
    configurable: true,
    value: function (this: HTMLDialogElement) {
      this.open = true;
    },
  });
  Object.defineProperty(HTMLDialogElement.prototype, 'close', {
    configurable: true,
    value: function (this: HTMLDialogElement) {
      this.open = false;
      this.dispatchEvent(new Event('close'));
    },
  });
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({ ok: true, json: async () => structuredClone(catalogue) }),
  );
  vi.stubGlobal(
    'matchMedia',
    vi
      .fn()
      .mockReturnValue({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() }),
  );
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
    cb(0);
    return 1;
  });
  vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue();
  vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {});
  const add = document.addEventListener.bind(document);
  vi.spyOn(document, 'addEventListener').mockImplementation((type, listener, options) => {
    listeners.push([type, listener, options]);
    add(type, listener, options);
  });
});
afterEach(() => {
  for (const args of listeners.splice(0)) document.removeEventListener(...args);
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  document.body.innerHTML = '';
});
it('uses GET filters and adds the exact catalogue variant to the persistent cart', async () => {
  mount('catalogue.html', '/catalogue.html');
  await import('../src/storefront/main');
  const form = q<HTMLFormElement>('#catalogue-filters');
  expect(form.method).toBe('get');
  expect(form.action).toContain('/catalogue');
  expect(q<HTMLSelectElement>('#brand').name).toBe('brand');
  expect(q<HTMLInputElement>('#search').name).toBe('search');
  const id = catalogue[0].id as string;
  const add = document.createElement('button');
  add.type = 'button';
  add.dataset.add = id;
  q('#product-grid').append(add);
  add.click();
  expect(JSON.parse(localStorage.getItem('enrm-demo-cart')!)).toEqual([{ id, qty: 1 }]);
  q('#open-cart').click();
  await vi.waitFor(() => expect(q<HTMLDialogElement>('#cart-dialog').open).toBe(true));
  expect(q('#cart-content').textContent).toContain('Sous-total indicatif');
});
it('switches product volumes without mixing the image, price, ID or quantity', async () => {
  mount('product.html', '/product.html?id=ENRM-HM-031');
  await import('../src/storefront/main');
  await vi.waitFor(() => expect(document.querySelector('#detail-add')).not.toBeNull());
  q<HTMLElement>('[data-variant="ENRM-HM-030"]').click();
  expect(location.search).toContain('ENRM-HM-030');
  const exact = catalogue.find((p: { id: string }) => p.id === 'ENRM-HM-030');
  expect(q<HTMLImageElement>('#detail-photo img').getAttribute('src')).toBe(exact.recto);
  change('#detail-qty', '3');
  q('#detail-add').click();
  expect(JSON.parse(localStorage.getItem('enrm-demo-cart')!)).toEqual([
    { id: 'ENRM-HM-030', qty: 3 },
  ]);
});
it('renders every admin screen, creates a product and order, and persists the stock deduction', async () => {
  mount('admin.html', '/admin.html');
  await import('../src/admin/main');
  await vi.waitFor(() => expect(q('#workspace').textContent).toContain('Vue d’ensemble'));
  for (const route of [
    'orders',
    'products',
    'inventory',
    'customers',
    'analytics',
    'promotions',
    'settings',
    'overview',
  ]) {
    history.replaceState(null, '', `/admin.html#${route}`);
    window.dispatchEvent(new HashChangeEvent('hashchange'));
    expect(q('#workspace h1')).not.toBeNull();
    expect(q('#workspace').textContent).not.toContain('undefined');
  }
  history.replaceState(null, '', '/admin.html#products');
  window.dispatchEvent(new HashChangeEvent('hashchange'));
  await vi.waitFor(() => expect(q('[data-action="new-product"]')).not.toBeNull());
  q('[data-action="new-product"]').click();
  change('#product-form [name="name"]', 'Test formulation');
  change('#product-form [name="brand"]', 'ENRM Démo');
  change('#product-form [name="sku"]', 'ENRM-TEST-001');
  change('#product-form [name="viscosity"]', '5W-30');
  change('#product-form [name="price"]', '200');
  change('#product-form [name="stock"]', '10');
  submit('#product-form');
  await vi.waitFor(() => expect(q<HTMLDialogElement>('#editor').open).toBe(false));
  history.replaceState(null, '', '/admin.html#orders');
  window.dispatchEvent(new HashChangeEvent('hashchange'));
  await vi.waitFor(() => expect(q('[data-action="new-order"]')).not.toBeNull());
  q('[data-action="new-order"]').click();
  change('#new-order [name="product"]', 'ENRM-TEST-001');
  change('#new-order [name="quantity"]', '2');
  submit('#new-order');
  const saved: AdminState = JSON.parse(localStorage.getItem('enrm-admin-demo-v1')!);
  expect(saved.products.find((p) => p.id === 'ENRM-TEST-001')?.stock).toBe(8);
  expect(saved.orders[0].id).toBe('EN-1049');
  expect(saved.orders[0].items[0].price).toBe(200);
});
