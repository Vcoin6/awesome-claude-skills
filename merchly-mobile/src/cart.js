// Cart context — persisted with AsyncStorage.
import { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'merchly_cart_v1';
const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);

  useEffect(() => {
    AsyncStorage.getItem(KEY).then((raw) => {
      if (raw) {
        try { setItems(JSON.parse(raw)); } catch {}
      }
    });
  }, []);

  const save = useCallback((next) => {
    setItems(next);
    AsyncStorage.setItem(KEY, JSON.stringify(next)).catch(() => {});
  }, []);

  const add = useCallback((listing, qty = 1) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.id === listing.id);
      let next;
      if (existing) {
        next = prev.map((i) => (i.id === listing.id ? { ...i, qty: i.qty + qty } : i));
      } else {
        next = [...prev, {
          id: listing.id,
          title: listing.title,
          priceCents: listing.priceCents,
          cover: listing.media?.[0]?.url || null,
          sellerName: listing.sellerName,
          qty,
        }];
      }
      AsyncStorage.setItem(KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const updateQty = useCallback((id, qty) => {
    save(items.map((i) => (i.id === id ? { ...i, qty: Math.max(1, qty) } : i)));
  }, [items, save]);

  const remove = useCallback((id) => save(items.filter((i) => i.id !== id)), [items, save]);
  const clear = useCallback(() => save([]), [save]);

  const count = useMemo(() => items.reduce((n, i) => n + i.qty, 0), [items]);
  const subtotal = useMemo(() => items.reduce((s, i) => s + i.priceCents * i.qty, 0), [items]);

  return (
    <CartContext.Provider value={{ items, add, updateQty, remove, clear, count, subtotal }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
