'use client';

import {
  createContext,
  useContext,
  useEffect,
  useReducer,
  useState,
  type ReactNode,
} from 'react';
import { DEFAULT_CONSENT, type ConsentState, type ServiceConsent } from './types';
import { consentReducer } from './reducer';
import { loadConsent, saveConsent } from './storage';

type ConsentContextValue = {
  consent: ConsentState;
  hydrated: boolean;
  acceptAll: () => void;
  rejectAll: () => void;
  setServices: (services: Partial<ServiceConsent>) => void;
  reopen: () => void;
};

const ConsentContext = createContext<ConsentContextValue | null>(null);

export function ConsentProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(consentReducer, DEFAULT_CONSENT);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const loaded = loadConsent();
    dispatch({ type: 'hydrate', state: loaded });
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) saveConsent(state);
  }, [state, hydrated]);

  return (
    <ConsentContext.Provider
      value={{
        consent: state,
        hydrated,
        acceptAll: () => dispatch({ type: 'accept_all' }),
        rejectAll: () => dispatch({ type: 'reject_all' }),
        setServices: (services) => dispatch({ type: 'set_services', services }),
        reopen: () => dispatch({ type: 'reopen' }),
      }}
    >
      {children}
    </ConsentContext.Provider>
  );
}

export function useConsent(): ConsentContextValue {
  const ctx = useContext(ConsentContext);
  if (!ctx) throw new Error('useConsent must be used within ConsentProvider');
  return ctx;
}
