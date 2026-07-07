import { useCallback, useEffect, useRef, useState } from "react";

import { getCached, setCached } from "../utils/sessionCache";

function normalizePaginatedPayload(payload) {
  if (Array.isArray(payload)) {
    return { results: payload, count: payload.length };
  }

  const results = payload?.results || [];
  const count = Number(payload?.count ?? results.length ?? 0);
  return { results, count };
}

export function usePaginatedList({ queryKey, fetchPage, onError, cacheNamespace }) {
  const initialCacheKey = cacheNamespace ? `${cacheNamespace}:${queryKey}:1` : null;
  const initialCached = initialCacheKey ? getCached(initialCacheKey) : undefined;

  const [items, setItems] = useState(() => initialCached?.results || []);
  const [count, setCount] = useState(() => initialCached?.count || 0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(() => !initialCached);
  const latestQueryKeyRef = useRef(queryKey);
  const requestSequenceRef = useRef(0);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const loadPage = useCallback(
    async (targetPage) => {
      const requestId = requestSequenceRef.current + 1;
      requestSequenceRef.current = requestId;
      const cacheKey = cacheNamespace ? `${cacheNamespace}:${queryKey}:${targetPage}` : null;
      const cached = cacheKey ? getCached(cacheKey) : undefined;
      if (cached) {
        setItems(cached.results);
        setCount(cached.count);
        setLoading(false);
      } else {
        setLoading(true);
      }

      try {
        const response = await fetchPage(targetPage);
        if (!mountedRef.current || requestId !== requestSequenceRef.current) {
          return;
        }
        const payload = response?.data ?? response;
        const normalized = normalizePaginatedPayload(payload);
        setItems(normalized.results);
        setCount(normalized.count);
        if (cacheKey) {
          setCached(cacheKey, normalized);
        }
      } catch (error) {
        if (!mountedRef.current || requestId !== requestSequenceRef.current) {
          return;
        }
        if (!cached) {
          onError?.(error);
        }
      } finally {
        if (mountedRef.current && requestId === requestSequenceRef.current) {
          setLoading(false);
        }
      }
    },
    [fetchPage, onError, cacheNamespace, queryKey],
  );

  useEffect(() => {
    const queryChanged = latestQueryKeyRef.current !== queryKey;
    if (queryChanged) {
      latestQueryKeyRef.current = queryKey;
      if (page !== 1) {
        setPage(1);
        return;
      }
    }

    loadPage(page);
  }, [page, queryKey, loadPage]);

  const reload = useCallback(() => loadPage(page), [loadPage, page]);

  return {
    items,
    count,
    page,
    setPage,
    loading,
    reload,
  };
}
