import { readJson, writeJson, ADMIN_KEY } from '../shared/storage';
import { emptyProduct } from '../shared/catalogue';
import type { AdminState } from '../shared/types';
import { DEFAULT_CATEGORY_ID } from '../shared/catalogue';
const record = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object';
const string = (v: unknown): v is string => typeof v === 'string';
const finite = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v) && v >= 0;
/** Accept the previous demo schema, filling catalogue fields on locally created products. */
export function isAdminState(value: unknown): value is AdminState {
  if (
    !record(value) ||
    !Array.isArray(value.products) ||
    !Array.isArray(value.orders) ||
    !Array.isArray(value.customers) ||
    !Array.isArray(value.promotions) ||
    !Array.isArray(value.activity) ||
    !record(value.settings)
  )
    return false;
  if (
    !string(value.settings.name) ||
    !string(value.settings.email) ||
    !finite(value.settings.threshold)
  )
    return false;
  if (
    !value.products.every(
      (p) =>
        record(p) &&
        ['id', 'marque', 'sous_reference', 'viscosite', 'litrage', 'status'].every((k) =>
          string(p[k]),
        ) &&
        finite(p.price) &&
        finite(p.stock),
    )
  )
    return false;
  if (
    !value.customers.every(
      (c) => record(c) && ['id', 'name', 'city', 'email', 'type'].every((k) => string(c[k])),
    )
  )
    return false;
  const productIds = new Set(value.products.map((p) => p.id)),
    customerIds = new Set(value.customers.map((c) => c.id));
  if (
    !value.orders.every(
      (o) =>
        record(o) &&
        ['id', 'customerId', 'date', 'status', 'payment', 'tracking', 'note'].every((k) =>
          string(o[k]),
        ) &&
        customerIds.has(o.customerId) &&
        Array.isArray(o.items) &&
        o.items.every(
          (i) =>
            record(i) &&
            productIds.has(i.id) &&
            finite(i.price) &&
            finite(i.qty) &&
            Number.isInteger(i.qty) &&
            i.qty > 0 &&
            string(i.name) &&
            string(i.volume),
        ) &&
        Array.isArray(o.history) &&
        o.history.every((h) => record(h) && string(h.label) && string(h.date)),
    )
  )
    return false;
  return (
    value.promotions.every(
      (p) =>
        record(p) &&
        ['id', 'code', 'type', 'status', 'expiry'].every((k) => string(p[k])) &&
        finite(p.value),
    ) && value.activity.every((a) => record(a) && string(a.text) && string(a.date))
  );
}
export function loadAdminState(fallback: () => AdminState): AdminState {
  const stored = readJson(ADMIN_KEY);
  if (!isAdminState(stored)) return fallback();
  return {
    ...stored,
    products: stored.products.map((p) => ({
      ...emptyProduct(),
      ...p,
      category_id: p.category_id || DEFAULT_CATEGORY_ID,
    })),
  };
}
export const saveAdminState = (state: AdminState): boolean => writeJson(ADMIN_KEY, state);
