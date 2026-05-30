import { useState, useEffect, useRef } from 'react';

interface CacheEntry {
  data: any;
  timestamp: number;
  ttl: number;
}

const cache = new Map<string, CacheEntry>();

export const useCachedFetch = (
  fetchFn: () => Promise<any>,
  cacheKey: string,
  ttl: number = 5 * 60 * 1000 // 5 minutes default
) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isMounted = useRef(true);

  useEffect(() => {
    const fetchData = async () => {
      // Check if we have cached data that's still valid
      const cached = cache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < cached.ttl) {
        setData(cached.data);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const result = await fetchFn();

        if (isMounted.current) {
          setData(result);
          // Cache the result
          cache.set(cacheKey, {
            data: result,
            timestamp: Date.now(),
            ttl
          });
        }
      } catch (err: any) {
        if (isMounted.current) {
          setError(err.message || 'Failed to fetch data');
        }
      } finally {
        if (isMounted.current) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      isMounted.current = false;
    };
  }, [cacheKey, fetchFn, ttl]);

  const clearCache = () => {
    cache.delete(cacheKey);
  };

  return { data, loading, error, clearCache };
};

// Function to clear all cache
export const clearAllCache = () => {
  cache.clear();
};

// Function to clear cache by pattern
export const clearCacheByPattern = (pattern: string) => {
  const keysToDelete: string[] = [];
  cache.forEach((_, key) => {
    if (key.includes(pattern)) {
      keysToDelete.push(key);
    }
  });
  keysToDelete.forEach(key => cache.delete(key));
};
