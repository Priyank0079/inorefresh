import { createContext, useContext, useState, useCallback } from 'react';

const RefreshContext = createContext();

export const RefreshProvider = ({ children }) => {
  const [refreshKey, setRefreshKey] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshCallback, setRefreshCallback] = useState(null);

  const registerRefresh = useCallback((callback) => {
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
