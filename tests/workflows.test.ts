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
  const routeName = route.split('?')[0];
  await act(async () => {
    history.replaceState(null, '', `/admin#${route}`);
    window.dispatchEvent(new HashChangeEvent('hashchange'));
    await new Promise((resolve) => setTimeout(resolve, 10));
  });
  const reactPanel =
    routeName === 'orders'
      ? '#react-admin-orders h1'
      : ['products', 'inventory'].includes(routeName)
        ? '#react-admin-products h1'
        : routeName === 'categories'
          ? '#react-admin-categories h1'
          : ['overview', 'analytics', 'promotions', 'settings', 'search'].includes(routeName)
            ? '#react-admin-summary h1'
            : route === 'customers'
              ? '#react-admin-customers h1'
              : '#workspace h1';
  await vi.waitFor(() => expect(q(reactPanel)).not.toBeNull());
}
async function submit(selector: string) {
  await act(async () => {
    q<HTMLFormElement>(selector).dispatchEvent(
      new Event('submit', { bubbles: true, cancelable: true }),
    );
    await Promise.resolve();
  });
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
    'search?q=Youssef%20D%C3%A9mo',
  ]) {
    await go(route);
    const routeName = route.split('?')[0];
    expect(
      (routeName === 'orders'
        ? q('#react-admin-orders')
        : ['products', 'inventory'].includes(routeName)
          ? q('#react-admin-products')
          : routeName === 'categories'
            ? q('#react-admin-categories')
            : ['overview', 'analytics', 'promotions', 'settings', 'search'].includes(routeName)
              ? q('#react-admin-summary')
              : route === 'customers'
                ? q('#react-admin-customers')
                : q('#workspace')
      ).textContent,
    ).not.toContain('undefined');
  }
  expect(q('#react-admin-summary').textContent).toContain('Youssef Démo');
  act(() =>
    window.dispatchEvent(
      new CustomEvent('enrm-admin-navigation', {
        detail: {
          view: 'orders',
          restricted: true,
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
          products: [],
          remoteProductsActive: false,
          remoteProductsTotal: 0,
          stockThreshold: 10,
          period: 30,
          dashboardSummary: null,
        },
      }),
    ),
  );
  expect(q('#react-admin-orders').textContent).toContain('Accès administrateur requis');
  expect(document.querySelector('[data-action="new-order"]')).toBeNull();
  await go('settings');
  change('#settings-form [name="threshold"]', '12');
  await submit('#settings-form');
  await vi.waitFor(() => {
    const saved: AdminState = JSON.parse(localStorage.getItem('enrm-admin-demo-v1')!);
    expect(saved.settings.threshold).toBe(12);
  });
  await go('promotions');
  act(() => q('[data-action="new-promo"]').click());
  await vi.waitFor(() => expect(q('#promo-form')).not.toBeNull());
  change('#promo-form [name="code"]', 'SPRING15');
  await submit('#promo-form');
  await vi.waitFor(() => {
    const saved: AdminState = JSON.parse(localStorage.getItem('enrm-admin-demo-v1')!);
    expect(saved.promotions.some((promotion) => promotion.code === 'SPRING15')).toBe(true);
  });
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
  act(() => q('[data-action="new-product"]').click());
  await vi.waitFor(() => expect(q('#product-form')).not.toBeNull());
  change('#product-form [name="name"]', 'Test formulation');
  change('#product-form [name="brand"]', 'ENRM Démo');
  change('#product-form [name="sku"]', 'ENRM-TEST-001');
  change('#product-form [name="viscosity"]', '5W-30');
  change('#product-form [name="price"]', '200');
  change('#product-form [name="stock"]', '10');
  await submit('#product-form');
  await vi.waitFor(() => expect(q<HTMLDialogElement>('#editor').open).toBe(false));
  act(() => q<HTMLButtonElement>('[data-edit-product="ENRM-TEST-001"]').click());
  await vi.waitFor(() => expect(q('#product-form')).not.toBeNull());
  change('#product-form [name="name"]', 'Updated formulation');
  await submit('#product-form');
  await vi.waitFor(() => {
    const saved: AdminState = JSON.parse(localStorage.getItem('enrm-admin-demo-v1')!);
    expect(saved.products.find((p) => p.id === 'ENRM-TEST-001')?.sous_reference).toBe(
      'Updated formulation',
    );
  });
  await go('orders');
  change('#local-query', 'EN-1048');
  await vi.waitFor(() =>
    expect(q('#react-admin-orders tbody tr').textContent).toContain('EN-1048'),
  );
  expect(document.querySelectorAll('#react-admin-orders tbody tr')).toHaveLength(1);
  change('#local-query', '');
  expect(q('[data-action="new-order"]')).not.toBeNull();
  act(() => q('[data-action="new-order"]').click());
  await vi.waitFor(() => expect(q('#new-order')).not.toBeNull());
  change('#new-order [name="product"]', 'ENRM-TEST-001');
  change('#new-order [name="quantity"]', '2');
  await submit('#new-order');
  const saved: AdminState = JSON.parse(localStorage.getItem('enrm-admin-demo-v1')!);
  expect(saved.products.find((p) => p.id === 'ENRM-TEST-001')?.stock).toBe(8);
  expect(saved.orders[0].id).toBe('EN-1049');
  expect(saved.orders[0].items[0].price).toBe(200);
  await vi.waitFor(() => expect(q('[data-order="EN-1049"]')).not.toBeNull());
  act(() => q<HTMLButtonElement>('[data-order="EN-1049"]').click());
  await vi.waitFor(() => expect(q('#order-update')).not.toBeNull());
  change('#order-update [name="status"]', 'Expédiée');
  change('#order-update [name="tracking"]', 'TRK-1049');
  await submit('#order-update');
  await vi.waitFor(() => {
    const updated: AdminState = JSON.parse(localStorage.getItem('enrm-admin-demo-v1')!);
    expect(updated.orders.find((order) => order.id === 'EN-1049')?.tracking).toBe('TRK-1049');
    expect(updated.orders.find((order) => order.id === 'EN-1049')?.status).toBe('Expédiée');
  });
  await go('customers');
  act(() => q<HTMLButtonElement>('[data-customer]').click());
  await vi.waitFor(() => expect(q('#customer-form')).not.toBeNull());
  change('#customer-form [name="name"]', 'Updated Demo Customer');
  await submit('#customer-form');
  await vi.waitFor(() => {
    const updated: AdminState = JSON.parse(localStorage.getItem('enrm-admin-demo-v1')!);
    expect(updated.customers.some((customer) => customer.name === 'Updated Demo Customer')).toBe(
      true,
    );
  });
  await go('promotions');
  const promotionState: AdminState = JSON.parse(localStorage.getItem('enrm-admin-demo-v1')!);
  const promotionId = promotionState.promotions.find(
    (promotion) => promotion.code === 'SPRING15',
  )!.id;
  act(() => q<HTMLButtonElement>(`[data-promo="${promotionId}"]`).click());
  await vi.waitFor(() => expect(q('#promo-form')).not.toBeNull());
  change('#promo-form [name="value"]', '20');
  expect(q<HTMLInputElement>('#promo-form [name="value"]').value).toBe('20');
  await submit('#promo-form');
  await vi.waitFor(() => {
    const updated: AdminState = JSON.parse(localStorage.getItem('enrm-admin-demo-v1')!);
    expect(updated.promotions.find((promotion) => promotion.id === promotionId)?.value).toBe(20);
  });
});
