'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';

const FavoritesContext = createContext(null);

export function FavoritesProvider({ loggedIn, children }) {
  const [ids, setIds] = useState(new Set());

  useEffect(() => {
    if (!loggedIn) return;
    fetch('/api/favorites')
      .then((r) => r.json())
      .then((d) => setIds(new Set(d.ids || [])))
      .catch(() => {});
  }, [loggedIn]);

  const isFavorite = useCallback((id) => ids.has(id), [ids]);

  const toggle = useCallback(async (id) => {
    // Optimistic update.
    setIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
    try {
      const res = await fetch('/api/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listingId: id }),
      });
      if (!res.ok) throw new Error();
      const { favorited } = await res.json();
      setIds((prev) => {
        const next = new Set(prev);
        favorited ? next.add(id) : next.delete(id);
        return next;
      });
      window.dispatchEvent(new Event('merchly:favorites'));
    } catch {
      // Revert on failure.
      setIds((prev) => {
        const next = new Set(prev);
        next.has(id) ? next.delete(id) : next.add(id);
        return next;
      });
    }
  }, []);

  return (
    <FavoritesContext.Provider value={{ isFavorite, toggle, loggedIn }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  return useContext(FavoritesContext) || { isFavorite: () => false, toggle: () => {}, loggedIn: false };
}
