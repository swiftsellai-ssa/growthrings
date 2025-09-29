'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export type AppView = 'landing' | 'tool' | 'analytics';

interface AppState {
  currentView: AppView;
  showXApiConfig: boolean;
  bearerToken: string;
}

interface AppContextType {
  state: AppState;
  navigateTo: (view: AppView) => void;
  setShowXApiConfig: (show: boolean) => void;
  setBearerToken: (token: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>({
    currentView: 'landing',
    showXApiConfig: false,
    bearerToken: typeof window !== 'undefined' ? localStorage.getItem('xapi_token') || '' : '',
  });

  const navigateTo = useCallback((view: AppView) => {
    setState(prev => ({
      ...prev,
      currentView: view,
      showXApiConfig: false,
    }));
  }, []);

  const setShowXApiConfig = useCallback((show: boolean) => {
    setState(prev => ({ ...prev, showXApiConfig: show }));
  }, []);

  const setBearerToken = useCallback((token: string) => {
    setState(prev => ({ ...prev, bearerToken: token }));
    if (typeof window !== 'undefined') {
      localStorage.setItem('xapi_token', token);
    }
  }, []);

  return (
    <AppContext.Provider value={{ state, navigateTo, setShowXApiConfig, setBearerToken }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
}