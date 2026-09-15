import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../api/client';

const ShopSettingsContext = createContext(null);

export function ShopSettingsProvider({ children }) {
  const [settings, setSettings] = useState({ shop_name: 'Agri Shop', address: '', branch_name: '' });

  const refresh = useCallback(async () => {
    try {
      const data = await api.get('/api/settings');
      if (data) setSettings(data);
    } catch {
      // Not logged in yet, or offline — keep defaults; screens that need this
      // will refresh again once authenticated.
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  return (
    <ShopSettingsContext.Provider value={{ settings, refresh }}>
      {children}
    </ShopSettingsContext.Provider>
  );
}

export function useShopSettings() {
  const ctx = useContext(ShopSettingsContext);
  if (!ctx) throw new Error('useShopSettings must be used inside ShopSettingsProvider');
  return ctx;
}
