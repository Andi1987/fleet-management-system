import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  getVehicleTotal,
  getVehicles,
} from "../services/api";

import type { Vehicle } from "../types/mbta";

interface UseVehiclesResult {
  vehicles: Vehicle[];
  loading: boolean;
  error: string | null;

  page: number;
  pageSize: number;

  total: number;
  totalPages: number;

  hasNextPage: boolean;
  hasPreviousPage: boolean;

  lastUpdated: Date | null;

  setPage: (page: number) => void;
  setPageSize: (pageSize: number) => void;

  refresh: () => void;
  retry: () => void;
}

interface UseVehiclesOptions {
  routes?: string[];
  trips?: string[];
  vehicleId?: string;
}

const EMPTY_ARRAY: string[] = [];

export function useVehicles(
  options: UseVehiclesOptions = {},
): UseVehiclesResult {
  const routes = options.routes ?? EMPTY_ARRAY;
  const trips = options.trips ?? EMPTY_ARRAY;
  const vehicleId = options.vehicleId ?? "";

  const [
    debouncedVehicleId,
    setDebouncedVehicleId,
  ] = useState(vehicleId.trim());

  const [vehicles, setVehicles] =
    useState<Vehicle[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  const [page, setPageState] =
    useState(1);

  const [pageSize, setPageSizeState] =
    useState(5);

  const [total, setTotal] =
    useState(0);

  const [hasNextPage, setHasNextPage] =
    useState(false);

  const [hasPreviousPage, setHasPreviousPage] =
    useState(false);

  const [lastUpdated, setLastUpdated] =
    useState<Date | null>(null);

  const requestIdRef =
    useRef(0);

  /*
   * Debounce Vehicle Label / ID search.
   *
   * Prevents an API request for every keystroke.
   */
  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedVehicleId(
        vehicleId.trim(),
      );
    }, 400);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [vehicleId]);

  /*
   * Reset pagination when filters/search change.
   */
  useEffect(() => {
    setPageState(1);
  }, [
    routes,
    trips,
    debouncedVehicleId,
  ]);

  const loadVehicles = useCallback(
    async (silent = false) => {
      const requestId =
        ++requestIdRef.current;

      try {
        if (!silent) {
          setLoading(true);
        }

        setError(null);

        const response =
          await getVehicles({
            page,
            pageSize,
            routes,
            trips,
            vehicleId:
              debouncedVehicleId,
          });

        /*
         * Ignore stale responses.
         *
         * Important when user changes search
         * before an older request finishes.
         */
        if (
          requestId !==
          requestIdRef.current
        ) {
          return;
        }

        setVehicles(response.data);

        setHasNextPage(
          Boolean(response.links?.next),
        );

        setHasPreviousPage(
          Boolean(response.links?.prev) ||
            page > 1,
        );

        setLastUpdated(
          new Date(),
        );

        /*
         * Only calculate total on first page.
         *
         * Auto-sync does not repeatedly request
         * the total endpoint.
         */
        if (page === 1) {
          try {
            const vehicleTotal =
              await getVehicleTotal(
                response,
                {
                  routes,
                  trips,
                  vehicleId:
                    debouncedVehicleId,
                },
              );

            if (
              requestId ===
              requestIdRef.current
            ) {
              setTotal(
                vehicleTotal,
              );
            }
          } catch {
            /*
             * Keep the last known total.
             */
          }
        }
      } catch (err) {
        if (
          requestId !==
          requestIdRef.current
        ) {
          return;
        }

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load vehicle data.",
        );

        /*
         * Keep existing vehicle cards
         * instead of clearing them.
         */
      } finally {
        if (
          !silent &&
          requestId ===
            requestIdRef.current
        ) {
          setLoading(false);
        }
      }
    },
    [
      page,
      pageSize,
      routes,
      trips,
      debouncedVehicleId,
    ],
  );

  /*
   * Initial load and whenever
   * pagination/filter/search changes.
   */
  useEffect(() => {
    loadVehicles();
  }, [loadVehicles]);

  /*
   * Auto-sync every 30 seconds.
   *
   * Silent refresh only.
   */
  useEffect(() => {
    const interval =
      window.setInterval(() => {
        loadVehicles(true);
      }, 60_000);

    return () => {
      window.clearInterval(
        interval,
      );
    };
  }, [loadVehicles]);

  const handleSetPage = (
    newPage: number,
  ) => {
    if (newPage < 1) {
      return;
    }

    if (
      total > 0 &&
      newPage >
        Math.ceil(
          total / pageSize,
        )
    ) {
      return;
    }

    setPageState(newPage);
  };

  const handleSetPageSize = (
    newPageSize: number,
  ) => {
    setPageSizeState(
      newPageSize,
    );

    setPageState(1);
  };

  const totalPages =
    total > 0
      ? Math.ceil(
          total / pageSize,
        )
      : 0;

  return {
    vehicles,

    loading,
    error,

    page,
    pageSize,

    total,
    totalPages,

    hasNextPage,
    hasPreviousPage,

    lastUpdated,

    setPage:
      handleSetPage,

    setPageSize:
      handleSetPageSize,

    refresh: () =>
      loadVehicles(false),

    retry: () =>
      loadVehicles(false),
  };
}