'use client';

import { useCart } from './CartProvider';

export function CartCount() {
  const { items, ready } = useCart();
  if (!ready) return 0;
  return items.reduce((sum, item) => sum + item.qty, 0);
}
