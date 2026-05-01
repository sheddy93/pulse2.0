import { useState } from 'react';

/**
 * usePagination Hook
 * Reusable pagination logic for any list component
 * 
 * Usage:
 * const { page, limit, offset, goToPage, nextPage, prevPage } = usePagination(20);
 * const items = await base44.entities.Item.filter({ ... }, { skip: offset, limit });
 */
export function usePagination(itemsPerPage = 20) {
  const [page, setPage] = useState(0);

  return {
    page,
    limit: itemsPerPage,
    offset: page * itemsPerPage,
    goToPage: (newPage) => setPage(Math.max(0, newPage)),
    nextPage: () => setPage(prev => prev + 1),
    prevPage: () => setPage(prev => Math.max(0, prev - 1)),
    resetPage: () => setPage(0),
    setPage,
    hasNextPage: (itemCount) => itemCount >= itemsPerPage
  };
}