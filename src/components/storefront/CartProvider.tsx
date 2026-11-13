'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { ReactNode } from 'react';
import type { CartItem } from '../../shared/types';
import { CART_KEY, readJson, sanitizeCart, writeJson } from '../../shared/storage';

type CartContextValue = {
  items: CartItem[];
  ready: boolean;
  addItem: (id: string, quantity?: number) => void;
  setQuantity: (id: string, quantity: number) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
  toast: (message: string) => void;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);
  const [notice, setNotice] = useState('');
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const toast = useCallback((message: string) => {
    setNotice(message);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setNotice(''), 2800);
  }, []);

  const commit = useCallback(
    (value: CartItem[]) => {
      const next = sanitizeCart(value);
      if (!writeJson(CART_KEY, next)) {
        toast('Impossible de sauvegarder votre panier sur cet appareil.');
        return false;
      }
      setItems(next);
      window.dispatchEvent(new CustomEvent('enrm-cart-changed'));
      return true;
    },
    [toast],
  );

  useEffect(() => {
    setItems(sanitizeCart(readJson(CART_KEY)));
    setReady(true);
    const refresh = (event: StorageEvent) => {
      if (event.key === CART_KEY) setItems(sanitizeCart(readJson(CART_KEY)));
    };
    window.addEventListener('storage', refresh);
    return () => {
      window.removeEventListener('storage', refresh);
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);

  const addItem = useCallback(
    (id: string, quantity = 1) => {
      if (!id || !Number.isInteger(quantity) || quantity < 1 || quantity > 99) return;
      const current = sanitizeCart(readJson(CART_KEY));
      const item = current.find((entry) => entry.id === id);
      const saved = commit(
        item
          ? current.map((entry) =>
              entry.id === id ? { ...entry, qty: Math.min(99, entry.qty + quantity) } : entry,
            )
          : [...current, { id, qty: quantity }],
      );
      if (saved) toast('Ajouté à votre panier');
    },
    [commit, toast],
  );

  const setQuantity = useCallback(
    (id: string, quantity: number) => {
      if (!Number.isInteger(quantity) || quantity > 99) return;
      const current = sanitizeCart(readJson(CART_KEY));
      if (quantity <= 0) return commit(current.filter((entry) => entry.id !== id));
      commit(
        current.map((entry) =>
          entry.id === id ? { ...entry, qty: Math.min(99, Math.floor(quantity)) } : entry,
        ),
      );
    },
    [commit],
  );

  const removeItem = useCallback(
    (id: string) => commit(sanitizeCart(readJson(CART_KEY)).filter((entry) => entry.id !== id)),
    [commit],
  );
  const clearCart = useCallback(() => commit([]), [commit]);

  const value = useMemo(
    () => ({ items, ready, addItem, setQuantity, removeItem, clearCart, toast }),
    [items, ready, addItem, setQuantity, removeItem, clearCart, toast],
  );

  return (
    <CartContext.Provider value={value}>
      {children}
      <div className={`toast${notice ? ' show' : ''}`} role="status" aria-live="polite">
        {notice}
      </div>
    </CartContext.Provider>
  );
}

export function useCart() {
  const value = useContext(CartContext);
  if (!value) throw new Error('useCart must be used inside CartProvider.');
  return value;
}
