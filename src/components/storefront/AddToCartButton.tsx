'use client';

import { useCart } from './CartProvider';
import type { ReactNode } from 'react';

export function AddToCartButton({
  id,
  label,
  quantityFieldId,
  className = 'quick-add',
  children,
}: {
  id: string;
  label: string;
  quantityFieldId?: string;
  className?: string;
  children?: ReactNode;
}) {
  const { addItem } = useCart();
  return (
    <button
      className={className}
      type="button"
      aria-label={label}
      onClick={() => {
        const field = quantityFieldId
          ? (document.getElementById(quantityFieldId) as HTMLInputElement | null)
          : null;
        if (field && !field.reportValidity()) return;
        const quantity = field ? Number(field.value) : 1;
        if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99) return;
        addItem(id, quantity);
      }}
    >
      {children ?? '＋'}
    </button>
  );
}
