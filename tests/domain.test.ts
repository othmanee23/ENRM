import { describe, it, expect, beforeEach, vi } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import type { Product } from '../src/shared/types';
import { isProduct, productGroup, requireProduct, loadCatalogue } from '../src/shared/catalogue';
import { esc, norm } from '../src/shared/format';
import { sanitizeCart, readJson, writeJson, CART_KEY, ADMIN_KEY } from '../src/shared/storage';
import { createDemoState } from '../src/admin/seed';
import { loadAdminState, isAdminState, saveAdminState } from '../src/admin/storage';
const raw = readFileSync('public/catalogue.json', 'utf8');
const products: Product[] = JSON.parse(raw);
beforeEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
describe('catalogue integrity', () => {
  it('preserves every imported field and exact image mapping', () => {
    expect(products).toHaveLength(210);
    expect(new Set(products.map((p) => p.id)).size).toBe(210);
    expect(createHash('sha256').update(raw).digest('hex')).toBe(
      '4af4e3b6cff151c7ae8b6baa6e16d1777ac2381f27ad823269967c58b2aebcca',
    );
    for (const p of products) {
      expect(isProduct(p)).toBe(true);
      for (const field of ['recto', 'verso'] as const)
        if (p[field]) expect(existsSync('public/' + p[field])).toBe(true);
    }
  });
  it('groups formulations while keeping the selected volume explicit', () => {
    const small = requireProduct(products, 'ENRM-HM-030'),
      large = requireProduct(products, 'ENRM-HM-031');
    expect(productGroup(small)).toBe(productGroup(large));
    expect(small.litrage).not.toBe(large.litrage);
    expect(small.recto).not.toBe(large.recto);
    expect(() => requireProduct(products, 'missing')).toThrow('Unknown product');
  });
  it('rejects malformed network catalogue data', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, json: async () => [{ id: 'wrong' }] }),
    );
    await expect(loadCatalogue()).rejects.toThrow('Catalogue invalide');
  });
});
describe('cart compatibility and persistence', () => {
  it('drops invalid records, preserves variant IDs and caps duplicates', () => {
    expect(
      sanitizeCart(
        [
          { id: 'A', qty: 80 },
          { id: 'A', qty: 30 },
          { id: 'B', qty: 2 },
          { id: 'C', qty: 0 },
          { id: 'D', qty: 1.5 },
          null,
        ],
        new Set(['A', 'B']),
      ),
    ).toEqual([
      { id: 'A', qty: 99 },
      { id: 'B', qty: 2 },
    ]);
  });
  it('survives malformed or inaccessible browser storage', () => {
    localStorage.setItem(CART_KEY, 'broken');
    expect(readJson(CART_KEY)).toBeNull();
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('Quota exceeded');
    });
    expect(writeJson(CART_KEY, [])).toBe(false);
  });
});
describe('admin schema compatibility', () => {
  const factory = () => createDemoState(products, new Date('2026-11-05T12:00:00Z'));
  it('creates coherent fictitious orders referencing valid customers and variants', () => {
    const s = factory();
    expect(isAdminState(s)).toBe(true);
    expect(s.orders).toHaveLength(48);
    for (const order of s.orders) {
      expect(s.customers.some((c) => c.id === order.customerId)).toBe(true);
      for (const item of order.items)
        expect(requireProduct(s.products, item.id).price).toBe(item.price);
    }
  });
  it('retains saved changes across reloads and rejects broken relations', () => {
    const s = factory();
    s.products[0].stock = 17;
    s.orders[0].tracking = 'DEMO-123';
    expect(saveAdminState(s)).toBe(true);
    const restored = loadAdminState(factory);
    expect(restored.products[0].stock).toBe(17);
    expect(restored.orders[0].tracking).toBe('DEMO-123');
    s.orders[0].customerId = 'missing';
    localStorage.setItem(ADMIN_KEY, JSON.stringify(s));
    expect(loadAdminState(factory).orders[0].customerId).not.toBe('missing');
  });
});
it('escapes user input and normalizes catalogue search', () => {
  expect(esc('<img onerror="x">')).toBe('&lt;img onerror=&quot;x&quot;&gt;');
  expect(norm('5 W-30')).toBe(norm('5w30'));
});
