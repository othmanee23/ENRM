'use client';

import { useEffect, useState } from 'react';
import { useCart } from './CartProvider';
import { getSupabaseBrowserClient } from '../../lib/supabase/client';
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
  const [available, setAvailable] = useState<boolean | null>(null);
  useEffect(() => {
    let active = true;
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return () => { active = false; };
    void supabase
      .from('public_product_availability')
      .select('in_stock')
      .eq('product_id', id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (active) setAvailable(!error && data?.in_stock === true);
      });
    return () => { active = false; };
  }, [id]);
  return (
    <button
      className={className}
      type="button"
      aria-label={available === false ? 'Indisponible' : label}
      disabled={available !== true}
      title={available === false ? 'Indisponible' : undefined}
      onClick={() => {
        if (available !== true) return;
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
