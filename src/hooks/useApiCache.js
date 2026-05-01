import { useEffect, useState } from 'react';

/**
 * useApiCache Hook
 * Caches API responses in localStorage with TTL
 * 
 * Usage:
 * const { data, loading, error } = useApiCache(
 *   'departments',
 *   () => base44.entities.Department.filter({ ... }),
 *   60 * 60 * 1000  // 1 hour TTL
 * );
 */
export function useApiCache(cacheKey, fetchFn, ttlMs = 60 * 60 * 1000) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Check cache
        const cached = localStorage.getItem(`cache_${cacheKey}`);
        if (cached) {
          const { data: cachedData, timestamp } = JSON.parse(cached);
          const age = Date.now() - timestamp;

          // Cache still valid
          if (age < ttlMs) {
            console.log(`[CACHE HIT] ${cacheKey} (${(age / 1000).toFixed(1)}s old)`);
            setData(cachedData);
            setLoading(false);
            return;
          }
        }

        // Fetch fresh data
        console.log(`[CACHE MISS] ${cacheKey} - fetching fresh data`);
        const freshData = await fetchFn();

        // Store in cache
        localStorage.setItem(`cache_${cacheKey}`, JSON.stringify({
          data: freshData,
          timestamp: Date.now()
        }));

        setData(freshData);
      } catch (err) {
        console.error(`[CACHE ERROR] ${cacheKey}:`, err.message);
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [cacheKey, ttlMs]);

  return { data, loading, error };
}

/**
 * Clear specific cache
 */
export function clearApiCache(cacheKey) {
  localStorage.removeItem(`cache_${cacheKey}`);
  console.log(`[CACHE CLEARED] ${cacheKey}`);
}

/**
 * Clear all caches
 */
export function clearAllApiCaches() {
  const keys = Object.keys(localStorage).filter(k => k.startsWith('cache_'));
  keys.forEach(k => localStorage.removeItem(k));
  console.log(`[CACHE CLEARED ALL] ${keys.length} caches cleared`);
}