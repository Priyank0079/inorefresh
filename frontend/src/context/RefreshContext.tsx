import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface RefreshContextType {
  trigger: () => Promise<void>;
  registerRefresh: (callback: () => Promise<void> | void) => void;
  unregisterRefresh: () => void;
  isRefreshing: boolean;
}

const RefreshContext = createContext<RefreshContextType | undefined>(undefined);

export const RefreshProvider = ({ children }: { children: ReactNode }) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshCallback, setRefreshCallback] = useState<(() => Promise<void> | void) | null>(null);

  const registerRefresh = useCallback((callback: () => Promise<void> | void) => {
    setRefreshCallback(() => callback);
  }, []);

  const unregisterRefresh = useCallback(() => {
    setRefreshCallback(null);
  }, []);

  const trigger = useCallback(async () => {
    setIsRefreshing(true);
    try {
      if (refreshCallback) {
        await refreshCallback();
      } else {
        window.location.reload();
      }
    } finally {
      setIsRefreshing(false);
    }
  }, [refreshCallback]);

  return (
    <RefreshContext.Provider value={{ trigger, registerRefresh, unregisterRefresh, isRefreshing }}>
      {children}
    </RefreshContext.Provider>
  );
};

export const useRefresh = () => {
  const context = useContext(RefreshContext);
  if (!context) {
    throw new Error('useRefresh must be used within RefreshProvider');
  }
  return context;
};
