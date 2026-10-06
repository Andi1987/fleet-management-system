import { useCallback, useEffect, useState } from "react";
import { getTrips } from "../services/api";
import type { Trip } from "../types/mbta";

interface UseTripsResult {
  trips: Trip[];
  loading: boolean;
  loadingMore: boolean;
  error: string | null;
  hasMore: boolean;
  loadMore: () => void;
  retry: () => void;
}

interface UseTripsOptions {
  routes?: string[];
  search?: string;
}

const PAGE_SIZE = 20;

export function useTrips(
  options: UseTripsOptions = {},
): UseTripsResult {
  const {
    routes = [],
    search = "",
  } = options;

  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);

  const loadInitial = useCallback(async () => {
    /*
     * MBTA /trips requires a filter.
     * Don't request trips until at least one route is selected.
     */
    if (routes.length === 0) {
      setTrips([]);
      setLoading(false);
      setLoadingMore(false);
      setError(null);
      setHasMore(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await getTrips({
        pageSize: PAGE_SIZE,
        offset: 0,
        search,
        routes,
      });

      setTrips(response.data);
      setHasMore(Boolean(response.links?.next));
    } catch (err) {
      setTrips([]);
      setHasMore(false);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load trips.",
      );
    } finally {
      setLoading(false);
    }
  }, [routes, search]);

  useEffect(() => {
    loadInitial();
  }, [loadInitial]);

  const loadMore = useCallback(async () => {
    if (
      routes.length === 0 ||
      loadingMore ||
      hasMore === false
    ) {
      return;
    }

    try {
      setLoadingMore(true);

      const response = await getTrips({
        pageSize: PAGE_SIZE,
        offset: trips.length,
        search,
        routes,
      });

      setTrips((current) => [
        ...current,
        ...response.data,
      ]);

      setHasMore(Boolean(response.links?.next));
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load more trips.",
      );
    } finally {
      setLoadingMore(false);
    }
  }, [
    routes,
    search,
    trips.length,
    loadingMore,
    hasMore,
  ]);

  return {
    trips,
    loading,
    loadingMore,
    error,
    hasMore,
    loadMore,
    retry: loadInitial,
  };
}