import type { CartItem } from './types';
export const CART_KEY = 'enrm-demo-cart';
export const ADMIN_KEY = 'enrm-admin-demo-v1';
export function readJson(key: string): unknown {
  try {
    const text = localStorage.getItem(key);
    return text ? JSON.parse(text) : null;
  } catch {
    return null;
  }
}
export function writeJson(key: string, value: unknown): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}
export function sanitizeCart(value: unknown, validIds?: ReadonlySet<string>): CartItem[] {
  if (!Array.isArray(value)) return [];
  const result = new Map<string, number>();
  for (const item of value) {
    if (!item || typeof item !== 'object') continue;
    const { id, qty } = item as Record<string, unknown>;
    if (
      typeof id !== 'string' ||
      typeof qty !== 'number' ||
      !Number.isInteger(qty) ||
      qty < 1 ||
      qty > 99 ||
      (validIds && !validIds.has(id))
    )
      continue;
    result.set(id, Math.min(99, (result.get(id) || 0) + qty));
  }
  return [...result].map(([id, qty]) => ({ id, qty }));
}
