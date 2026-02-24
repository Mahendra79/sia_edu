import { useCallback, useEffect, useRef, useState } from "react";

function normalizePaginatedPayload(payload) {
  if (Array.isArray(payload)) {
    return { results: payload, count: payload.length };
  }

  const results = payload?.results || [];
  const count = Number(payload?.count ?? results.length ?? 0);
  return { results, count };
}

export function usePaginatedList({ queryKey, fetchPage, onError }) {
  const [items, setItems] = useState([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
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
      setLoading(true);
      try {
        const response = await fetchPage(targetPage);
        if (!mountedRef.current || requestId !== requestSequenceRef.current) {
          return;
        }
        const payload = response?.data ?? response;
        const normalized = normalizePaginatedPayload(payload);
        setItems(normalized.results);
        setCount(normalized.count);
      } catch (error) {
        if (!mountedRef.current || requestId !== requestSequenceRef.current) {
          return;
        }
        onError?.(error);
      } finally {
        if (mountedRef.current && requestId === requestSequenceRef.current) {
          setLoading(false);
        }
      }
    },
    [fetchPage, onError],
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
