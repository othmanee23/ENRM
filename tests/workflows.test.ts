import { beforeEach, afterEach, it, expect, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { AdminWorkspace } from '../src/components/admin/AdminWorkspace';
import type { AdminState } from '../src/shared/types';
const catalogue = JSON.parse(readFileSync('public/catalogue.json', 'utf8'));
const listeners: Array<
  [string, EventListenerOrEventListenerObject, boolean | AddEventListenerOptions | undefined]
> = [];
const q = <T extends HTMLElement = HTMLElement>(s: string): T => document.querySelector(s)!;
let adminRoot: Root | null = null;
function mountAdmin(url: string) {
  const host = document.createElement('div');
  document.body.append(host);
  adminRoot = createRoot(host);
  history.replaceState(null, '', url);
}
function change(selector: string, value: string) {
  const el = q<HTMLInputElement | HTMLSelectElement>(selector);
  el.value = value;
  act(() =>
    el.dispatchEvent(
      new Event(el instanceof HTMLSelectElement ? 'change' : 'input', { bubbles: true }),
    ),
  );
}
async function go(route: string) {
  await act(async () => {
    history.replaceState(null, '', `/admin#${route}`);
    window.dispatchEvent(new HashChangeEvent('hashchange'));
    await new Promise((resolve) => setTimeout(resolve, 10));
  });
  const reactPanel =
    route === 'orders'
      ? '#react-admin-orders h1'
      : ['products', 'inventory'].includes(route)
        ? '#react-admin-products h1'
        : route === 'categories'
          ? '#react-admin-categories h1'
          : route === 'customers'
            ? '#react-admin-customers h1'
            : '#workspace h1';
  await vi.waitFor(() => expect(q(reactPanel)).not.toBeNull());
}
function submit(selector: string) {
  q<HTMLFormElement>(selector).dispatchEvent(
    new Event('submit', { bubbles: true, cancelable: true }),
  );
}
beforeEach(() => {
  Object.defineProperty(globalThis, 'IS_REACT_ACT_ENVIRONMENT', {
    configurable: true,
    value: true,
  });
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
  if (adminRoot) act(() => adminRoot?.unmount());
  adminRoot = null;
  for (const args of listeners.splice(0)) document.removeEventListener(...args);
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  document.body.innerHTML = '';
});
it('renders every admin screen, creates a product and order, and persists the stock deduction', async () => {
  mountAdmin('/admin');
  await act(async () => {
    adminRoot!.render(createElement(AdminWorkspace));
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
  await vi.waitFor(() => expect(q('#react-admin-categories h1')).not.toBeNull());
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
    await go(route);
    expect(
      (route === 'orders'
        ? q('#react-admin-orders')
        : ['products', 'inventory'].includes(route)
          ? q('#react-admin-products')
          : route === 'categories'
            ? q('#react-admin-categories')
            : route === 'customers'
              ? q('#react-admin-customers')
              : q('#workspace')
      ).textContent,
    ).not.toContain('undefined');
  }
  await go('customers');
  change('#local-query', 'Youssef Démo');
  await vi.waitFor(() =>
    expect(q('#react-admin-customers tbody tr').textContent).toContain('Youssef Démo'),
  );
  expect(document.querySelectorAll('#react-admin-customers tbody tr')).toHaveLength(1);
  change('#local-query', '');
  await go('products');
  change('#local-query', 'ENRM-HM-006');
  await vi.waitFor(() =>
    expect(q('#react-admin-products tbody tr').textContent).toContain('ENRM-HM-006'),
  );
  expect(document.querySelectorAll('#react-admin-products tbody tr')).toHaveLength(1);
  change('#local-query', '');
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
  await go('orders');
  change('#local-query', 'EN-1048');
  await vi.waitFor(() =>
    expect(q('#react-admin-orders tbody tr').textContent).toContain('EN-1048'),
  );
  expect(document.querySelectorAll('#react-admin-orders tbody tr')).toHaveLength(1);
  change('#local-query', '');
  expect(q('[data-action="new-order"]')).not.toBeNull();
  q('[data-action="new-order"]').click();
  change('#new-order [name="product"]', 'ENRM-TEST-001');
  change('#new-order [name="quantity"]', '2');
  submit('#new-order');
  const saved: AdminState = JSON.parse(localStorage.getItem('enrm-admin-demo-v1')!);
  expect(saved.products.find((p) => p.id === 'ENRM-TEST-001')?.stock).toBe(8);
  expect(saved.orders[0].id).toBe('EN-1049');
  expect(saved.orders[0].items[0].price).toBe(200);
});
