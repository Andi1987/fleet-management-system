import { useCallback, useEffect, useState } from "react";
import { getRoutes } from "../services/api";
import type { Route } from "../types/mbta";

interface UseRoutesResult {
  routes: Route[];
  loading: boolean;
  loadingMore: boolean;
  error: string | null;
  hasMore: boolean;
  loadMore: () => void;
  retry: () => void;
}

const PAGE_SIZE = 20;

export function useRoutes(
  search = "",
): UseRoutesResult {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);

  const loadInitial = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await getRoutes({
        pageSize: PAGE_SIZE,
        offset: 0,
        search,
      });

      setRoutes(response.data);
      setHasMore(Boolean(response.links?.next));
    } catch (err) {
      setRoutes([]);
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load routes.",
      );
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    loadInitial();
  }, [loadInitial]);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) {
      return;
    }

    try {
      setLoadingMore(true);

      const response = await getRoutes({
        pageSize: PAGE_SIZE,
        offset: routes.length,
        search,
      });

      setRoutes((current) => [
        ...current,
        ...response.data,
      ]);

      setHasMore(Boolean(response.links?.next));
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load more routes.",
      );
    } finally {
      setLoadingMore(false);
    }
  }, [
    hasMore,
    loadingMore,
    routes.length,
    search,
  ]);

  return {
    routes,
    loading,
    loadingMore,
    error,
    hasMore,
    loadMore,
    retry: loadInitial,
  };
}