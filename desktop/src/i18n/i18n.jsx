import React, { createContext, useContext, useState, useMemo } from 'react';
import en from './en.json';
import ur from './ur.json';
import { fontFamilyFor } from '../theme/theme';

const dictionaries = { en, ur };

const LangContext = createContext(null);

export function LangProvider({ children }) {
  const [lang, setLang] = useState('en'); // default English; user can switch to Urdu

  const value = useMemo(() => ({
    lang,
    setLang,
    isRTL: lang === 'ur',
    t: (key) => dictionaries[lang][key] ?? dictionaries.en[key] ?? key,
    fontFamily: (weight = 'regular') => fontFamilyFor(lang, weight)
  }), [lang]);

  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

export function useLang() {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error('useLang must be used inside LangProvider');
  return ctx;
}
