import {
  Filter,
  Search,
  X,
  RotateCcw,
} from "lucide-react";

import { MultiSelect } from "./MultiSelect";
import { useRoutes } from "../../hooks/useRoutes";
import { useTrips } from "../../hooks/useTrips";

interface VehicleFiltersProps {
  selectedRoutes: string[];
  selectedTrips: string[];
  vehicleSearch: string;
  onRoutesChange: (
    routes: string[],
  ) => void;
  onTripsChange: (
    trips: string[],
  ) => void;
  onVehicleSearchChange: (
    value: string,
  ) => void;
}

export function VehicleFilters({
  selectedRoutes,
  selectedTrips,
  vehicleSearch,
  onRoutesChange,
  onTripsChange,
  onVehicleSearchChange,
}: VehicleFiltersProps) {
  const routes = useRoutes();

  const trips = useTrips({
    routes: selectedRoutes,
  });

  const routeOptions =
    routes.routes.map(
      (route) => ({
        value: route.id,
        label:
          route.attributes.long_name ??
          route.attributes.short_name ??
          route.id,
      }),
    );

  const tripOptions =
    trips.trips.map(
      (trip) => ({
        value: trip.id,
        label:
          trip.attributes.headsign ??
          trip.attributes.name ??
          trip.id,
      }),
    );

  const hasActiveFilters =
    selectedRoutes.length > 0 ||
    selectedTrips.length > 0 ||
    vehicleSearch.trim().length > 0;

  const selectedRouteLabels =
    selectedRoutes.map(
      (routeId) =>
        routeOptions.find(
          (option) =>
            option.value === routeId,
        )?.label ?? routeId,
    );

  const selectedTripLabels =
    selectedTrips.map(
      (tripId) =>
        tripOptions.find(
          (option) =>
            option.value === tripId,
        )?.label ?? tripId,
    );

  const clearFilters = () => {
    onRoutesChange([]);
    onTripsChange([]);
    onVehicleSearchChange("");
  };

  const handleRoutesChange = (
    routes: string[],
  ) => {
    onRoutesChange(routes);

    /*
     * Selected trips may no longer belong to
     * the newly selected routes, so reset them.
     */
    onTripsChange([]);
  };

  return (
    <div className="w-full space-y-3">
      {/* ===================================================
          FILTER CONTROLS
      ==================================================== */}
      <div className="flex flex-col gap-2 xl:flex-row xl:items-end">
        {/* Filter label */}
        <div className="flex shrink-0 items-center gap-2 px-1 pb-1 xl:pb-4">
          <Filter
            size={16}
            className="text-slate-400"
          />

          <span className="text-[12px] font-bold uppercase tracking-[0.16em] text-slate-500">
            Filter
          </span>
        </div>

        {/* Route */}
        <div className="min-w-0 flex-1">
          <MultiSelect
            label="Route"
            placeholder="Pilih Rute"
            options={routeOptions}
            selectedValues={
              selectedRoutes
            }
            loading={routes.loading}
            loadingMore={
              routes.loadingMore
            }
            hasMore={routes.hasMore}
            onChange={
              handleRoutesChange
            }
            onLoadMore={
              routes.loadMore
            }
          />
        </div>

        {/* Trip */}
        <div className="min-w-0 flex-1">
          <MultiSelect
            label="Trip"
            placeholder={
              selectedRoutes.length > 0
                ? "Pilih Trip"
                : "Pilih Trip"
            }
            options={tripOptions}
            selectedValues={
              selectedTrips
            }
            loading={trips.loading}
            loadingMore={
              trips.loadingMore
            }
            hasMore={trips.hasMore}
            onChange={
              onTripsChange
            }
            onLoadMore={
              trips.loadMore
            }
          />
        </div>

        {/* Vehicle Search */}
        <div className="relative min-w-0 flex-1 xl:max-w-[320px]">
          <label
            htmlFor="vehicle-search"
            className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500"
          >
            Search
          </label>

          <Search
            size={16}
            className="pointer-events-none absolute left-3.5 top-[47px] -translate-y-1/2 text-slate-400"
          />

          <input
            id="vehicle-search"
            type="search"
            value={vehicleSearch}
            onChange={(event) =>
              onVehicleSearchChange(
                event.target.value,
              )
            }
            placeholder="Cari Label / ID Armada..."
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-10 text-xs font-medium text-slate-800 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
          />

          {vehicleSearch && (
            <button
              type="button"
              onClick={() =>
                onVehicleSearchChange("")
              }
              aria-label="Hapus pencarian"
              className="absolute right-2.5 top-[35px] flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Reset */}
        {hasActiveFilters && (
          <button
            type="button"
            onClick={clearFilters}
            className="flex h-[42px] shrink-0 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-bold text-slate-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
          >
            <RotateCcw size={13} />
            Reset
          </button>
        )}
      </div>

      {/* ===================================================
          ACTIVE FILTER CHIPS
      ==================================================== */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Aktif:
          </span>

          {selectedRouteLabels.map(
            (label, index) => (
              <span
                key={`route-${selectedRoutes[index]}`}
                className="inline-flex max-w-full items-center gap-1.5 rounded-lg bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-700"
              >
                <span className="truncate max-w-[180px]">
                  Route: {label}
                </span>

                <button
                  type="button"
                  aria-label={`Hapus route ${label}`}
                  onClick={() => {
                    const nextRoutes =
                      selectedRoutes.filter(
                        (_, routeIndex) =>
                          routeIndex !==
                          index,
                      );

                    handleRoutesChange(
                      nextRoutes,
                    );
                  }}
                  className="shrink-0 rounded-full p-0.5 transition hover:bg-blue-100"
                >
                  <X size={11} />
                </button>
              </span>
            ),
          )}

          {selectedTripLabels.map(
            (label, index) => (
              <span
                key={`trip-${selectedTrips[index]}`}
                className="inline-flex max-w-full items-center gap-1.5 rounded-lg bg-violet-50 px-2.5 py-1 text-[11px] font-semibold text-violet-700"
              >
                <span className="truncate max-w-[180px]">
                  Trip: {label}
                </span>

                <button
                  type="button"
                  aria-label={`Hapus trip ${label}`}
                  onClick={() => {
                    onTripsChange(
                      selectedTrips.filter(
                        (_, tripIndex) =>
                          tripIndex !==
                          index,
                      ),
                    );
                  }}
                  className="shrink-0 rounded-full p-0.5 transition hover:bg-violet-100"
                >
                  <X size={11} />
                </button>
              </span>
            ),
          )}

          {vehicleSearch.trim() && (
            <span className="inline-flex max-w-full items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700">
              <span className="truncate max-w-[180px]">
                Search: {vehicleSearch}
              </span>

              <button
                type="button"
                aria-label="Hapus pencarian"
                onClick={() =>
                  onVehicleSearchChange("")
                }
                className="shrink-0 rounded-full p-0.5 transition hover:bg-slate-200"
              >
                <X size={11} />
              </button>
            </span>
          )}
        </div>
      )}

      {/* ===================================================
          FILTER ERROR
      ==================================================== */}
      {(routes.error ||
        trips.error) && (
        <div className="rounded-xl bg-red-50 px-3 py-2 text-xs font-semibold text-red-600">
          Gagal memuat opsi filter.
        </div>
      )}
    </div>
  );
}