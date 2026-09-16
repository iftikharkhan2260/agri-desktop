import React, { createContext, useContext, useState, useMemo } from 'react';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  // Map keyed by item_size_id -> { item_size_id, item_name, size_label, unit_price, quantity }
  const [lines, setLines] = useState({});

  function addOne(sizeInfo) {
    setLines((prev) => {
      const key = sizeInfo.item_size_id;
      const existingLine = prev[key];
      return {
        ...prev,
        [key]: existingLine
          ? { ...existingLine, quantity: existingLine.quantity + 1 }
          : { ...sizeInfo, quantity: 1 }
      };
    });
  }

  function removeOne(sizeId) {
    setLines((prev) => {
      const existingLine = prev[sizeId];
      if (!existingLine) return prev;
      if (existingLine.quantity <= 1) {
        const next = { ...prev };
        delete next[sizeId];
        return next;
      }
      return { ...prev, [sizeId]: { ...existingLine, quantity: existingLine.quantity - 1 } };
    });
  }

  function clear() {
    setLines({});
  }

  const items = useMemo(() => Object.values(lines), [lines]);
  const total = useMemo(() => items.reduce((sum, l) => sum + l.unit_price * l.quantity, 0), [items]);
  const count = useMemo(() => items.reduce((sum, l) => sum + l.quantity, 0), [items]);

  return (
    <CartContext.Provider value={{ items, total, count, addOne, removeOne, clear }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside CartProvider');
  return ctx;
}
