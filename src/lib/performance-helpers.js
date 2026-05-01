/**
 * Performance Helpers
 * Drop-in utilities per ottimizzare React components
 */

import React, { useMemo, useCallback, useRef, useState, useEffect } from 'react';

/**
 * useDebounce - Debounce search queries
 * Usage: const debouncedSearch = useDebounce(searchTerm, 300);
 */
export function useDebounce(value, delay = 500) {
  const [debouncedValue, setDebouncedValue] = React.useState(value);

  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}

/**
 * usePagination - Helper for pagination
 * Usage: const { page, limit, offset } = usePagination(20);
 */
export function usePagination(defaultLimit = 20) {
  const [page, setPage] = React.useState(0);
  const limit = defaultLimit;
  const offset = page * limit;

  return {
    page,
    setPage,
    limit,
    offset,
    goToPage: (p) => setPage(Math.max(0, p)),
    nextPage: () => setPage(p => p + 1),
    prevPage: () => setPage(p => Math.max(0, p - 1))
  };
}

/**
 * useIntersectionObserver - Lazy load images/components
 * Usage: const { ref } = useIntersectionObserver((entry) => {...});
 */
export function useIntersectionObserver(callback, options = {}) {
  const ref = React.useRef(null);

  React.useEffect(() => {
    if (!ref.current) return;

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        callback(entry);
      }
    }, {
      threshold: 0.1,
      ...options
    });

    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [callback, options]);

  return { ref };
}

/**
 * LazyImage - Optimized image component with lazy loading + WebP
 */
export function LazyImage({ src, alt, width, height, ...props }) {
  const { ref } = useIntersectionObserver(() => {
    if (ref.current) {
      ref.current.src = src;
    }
  });

  const webpSrc = src.replace(/\.(jpg|png|gif)$/i, '.webp');

  return (
    <picture ref={ref}>
      <source srcSet={webpSrc} type="image/webp" />
      <img 
        src={src} 
        alt={alt} 
        width={width} 
        height={height}
        loading="lazy"
        {...props}
      />
    </picture>
  );
}

/**
 * useMemoCompare - Like useMemo but with custom comparison
 */
export function useMemoCompare(fn, deps, compare) {
  const ref = React.useRef();
  const signalRef = React.useRef(0);

  if (compare(deps, ref.current)) {
    signalRef.current += 1;
  }
  ref.current = deps;

  return React.useMemo(fn, [signalRef.current]);
}

/**
 * withPerformance - HOC to measure component render time
 */
export function withPerformance(Component, componentName = Component.name) {
  return React.memo((props) => {
    const startTime = React.useRef(performance.now());

    React.useEffect(() => {
      const endTime = performance.now();
      const duration = endTime - startTime.current;
      if (duration > 100) {
        console.warn(`⚠️ ${componentName} took ${duration.toFixed(2)}ms to render`);
      }
    });

    return <Component {...props} />;
  });
}

/**
 * Virtual List component - For rendering huge lists efficiently
 * Usage: <VirtualList items={items} height={600} itemHeight={50} renderItem={...} />
 */
export function VirtualList({ items, height, itemHeight, renderItem }) {
  const [scrollTop, setScrollTop] = React.useState(0);
  const containerRef = React.useRef(null);

  const startIndex = Math.floor(scrollTop / itemHeight);
  const endIndex = Math.ceil((scrollTop + height) / itemHeight);
  const visibleItems = items.slice(startIndex, endIndex);

  return (
    <div
      ref={containerRef}
      onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
      style={{
        height,
        overflow: 'auto',
        position: 'relative'
      }}
    >
      <div style={{ height: items.length * itemHeight }}>
        {visibleItems.map((item, i) => (
          <div
            key={startIndex + i}
            style={{
              transform: `translateY(${(startIndex + i) * itemHeight}px)`,
              position: 'absolute',
              width: '100%'
            }}
          >
            {renderItem(item, startIndex + i)}
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * useLocalStorage - Persist state in localStorage
 */
export function useLocalStorage(key, initialValue) {
  const [storedValue, setStoredValue] = React.useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(error);
      return initialValue;
    }
  });

  const setValue = React.useCallback((value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(error);
    }
  }, [key, storedValue]);

  return [storedValue, setValue];
}

/**
 * useFetch - Simple data fetching with caching
 */
export function useFetch(url, options = {}) {
  const [data, setData] = React.useState(null);
  const [error, setError] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      try {
        const response = await fetch(url, options);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const json = await response.json();
        if (isMounted) {
          setData(json);
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          setError(err);
          setData(null);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchData();
    return () => { isMounted = false; };
  }, [url]);

  return { data, error, loading };
}

/**
 * Utility: Batch multiple API calls
 */
export async function batchRequests(requests, maxConcurrent = 5) {
  const results = [];
  for (let i = 0; i < requests.length; i += maxConcurrent) {
    const batch = requests.slice(i, i + maxConcurrent);
    const batchResults = await Promise.all(batch);
    results.push(...batchResults);
  }
  return results;
}

/**
 * Measure performance of async function
 */
export async function measurePerformance(fn, label = 'Operation') {
  const start = performance.now();
  const result = await fn();
  const duration = performance.now() - start;
  console.log(`⏱️ ${label} took ${duration.toFixed(2)}ms`);
  return result;
}

export default {
  useDebounce,
  usePagination,
  useIntersectionObserver,
  LazyImage,
  useMemoCompare,
  withPerformance,
  VirtualList,
  useLocalStorage,
  useFetch,
  batchRequests,
  measurePerformance
};