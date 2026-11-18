'use client';

import { useEffect, useState } from 'react';
import { getSupabaseBrowserClient } from '../../lib/supabase/client';

export function ProductAvailabilityBadge({ productId }: { productId: string }) {
  const [unavailable, setUnavailable] = useState(false);
  useEffect(() => {
    let active = true;
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return () => { active = false; };
    void supabase
      .from('public_product_availability')
      .select('in_stock')
      .eq('product_id', productId)
      .maybeSingle()
      .then(({ data, error }) => {
        if (active) setUnavailable(!error && data?.in_stock === false);
      });
    return () => { active = false; };
  }, [productId]);
  return unavailable ? <span className="availability-badge">Indisponible</span> : null;
}
