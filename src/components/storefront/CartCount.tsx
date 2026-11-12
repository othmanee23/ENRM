'use client';

import { useEffect, useState } from 'react';

function readCount(): number {
  try {
    const value: unknown = JSON.parse(localStorage.getItem('enrm-demo-cart') || '[]');
    if (!Array.isArray(value)) return 0;
    return value.reduce((sum, item) => {
      if (
        !item ||
        typeof item.id !== 'string' ||
        !Number.isInteger(item.qty) ||
        item.qty < 1 ||
        item.qty > 99
      )
        return sum;
      return sum + item.qty;
    }, 0);
  } catch {
    return 0;
  }
}

export function CartCount() {
  const [count, setCount] = useState(0);
  useEffect(() => {
    const refresh = () => setCount(readCount());
    refresh();
    window.addEventListener('storage', refresh);
    window.addEventListener('enrm-cart-changed', refresh);
    return () => {
      window.removeEventListener('storage', refresh);
      window.removeEventListener('enrm-cart-changed', refresh);
    };
  }, []);
  return count;
}
