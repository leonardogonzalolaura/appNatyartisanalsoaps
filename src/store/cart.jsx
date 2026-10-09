import { createContext, useContext, useMemo, useState } from 'react';

const CartCtx = createContext(null);

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try { return JSON.parse(localStorage.getItem('naty_cart') || '[]'); } catch { return []; }
  });
  const [lastAdded, setLastAdded] = useState(null);
  const persist = (next) => { setItems(next); localStorage.setItem('naty_cart', JSON.stringify(next)); };
  const add = (product, qty = 1) => {
    let addedName = product.name;
    setItems((prev) => {
      const found = prev.find((i) => i.id === product.id);
      const next = found
        ? prev.map((i) => (i.id === product.id ? { ...i, qty: i.qty + qty } : i))
        : [...prev, { id: product.id, name: product.name, price: Number(product.offer_price || product.price), qty, image: product.images?.[0] || product.image }];
      localStorage.setItem('naty_cart', JSON.stringify(next));
      return next;
    });
    setLastAdded({ id: product.id, name: addedName, ts: Date.now() });
  };
  const remove = (id) => setItems((prev) => {
    const next = prev.filter((i) => i.id !== id);
    localStorage.setItem('naty_cart', JSON.stringify(next));
    return next;
  });
  const clear = () => { setItems([]); localStorage.setItem('naty_cart', '[]'); };
  const setQty = (id, qty) => setItems((prev) => {
    const next = prev.map((i) => (i.id === id ? { ...i, qty: Math.max(1, qty) } : i));
    localStorage.setItem('naty_cart', JSON.stringify(next));
    return next;
  });
  const qtyById = (id) => items.find((i) => i.id === id)?.qty || 0;
  const total = useMemo(() => items.reduce((s, i) => s + i.price * i.qty, 0), [items]);
  const count = useMemo(() => items.reduce((s, i) => s + i.qty, 0), [items]);
  return <CartCtx.Provider value={{ items, add, remove, clear, setQty, qtyById, total, count, lastAdded }}>{children}</CartCtx.Provider>;
}

export const useCart = () => useContext(CartCtx);
