import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

export type Locale = 'en' | 'sw';

interface LocaleContextValue {
  locale: Locale;
  setLocale: (next: Locale) => void;
  toggleLocale: () => void;
}

const LocaleContext = createContext<LocaleContextValue | undefined>(undefined);

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en');

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = locale;
    }
  }, [locale]);

  const setLocale = (next: Locale) => {
    setLocaleState(next);
  };

  const toggleLocale = () => {
    setLocaleState((prev) => (prev === 'en' ? 'sw' : 'en'));
  };

  return (
    <LocaleContext.Provider value={{ locale, setLocale, toggleLocale }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale(): LocaleContextValue {
  const context = useContext(LocaleContext);
  if (!context) {
    return {
      locale: 'en',
      setLocale: () => undefined,
      toggleLocale: () => undefined,
    };
  }
  return context;
}

