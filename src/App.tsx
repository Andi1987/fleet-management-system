import {
  useMemo,
  useState,
} from "react";
import {
  BusFront,
  CheckCircle2,
  Clock3,
  Layers3,
  Radio,
  RefreshCw,
  Search,
} from "lucide-react";

import { ErrorMessage } from "./components/common/ErrorMessage";
import { Loading } from "./components/common/Loading";
import { Pagination } from "./components/pagination/Pagination";
import { VehicleFilters } from "./components/filters/VehicleFilters";
import { FleetMap } from "./components/maps/FleetMap";
import { VehicleDetail } from "./components/vehicle/VehicleDetail";
import { VehicleGrid } from "./components/vehicle/VehicleGrid";
import { useVehicles } from "./hooks/useVehicles";
import type { Vehicle } from "./types/mbta";

type ViewMode = "grid" | "map";

function App() {
  const [selectedRoutes, setSelectedRoutes] =
    useState<string[]>([]);

  const [selectedTrips, setSelectedTrips] =
    useState<string[]>([]);

  const [selectedVehicle, setSelectedVehicle] =
    useState<Vehicle | null>(null);

  const [vehicleSearch, setVehicleSearch] =
    useState("");

  const [viewMode] =
    useState<ViewMode>("grid");

  const {
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
    setPage,
    setPageSize,
    refresh,
    retry,
  } = useVehicles({
    routes: selectedRoutes,
    trips: selectedTrips,
    vehicleId: vehicleSearch,
  });

  /*
   * Status summary is calculated from the vehicles
   * currently displayed on the active page.
   *
   * We intentionally do not fetch the entire fleet just
   * to calculate these counters because that would create
   * unnecessary MBTA API traffic.
   */
  const statusSummary = useMemo(() => {
    return vehicles.reduce(
      (summary, vehicle) => {
        switch (
          vehicle.attributes.current_status
        ) {
          case "IN_TRANSIT_TO":
            summary.inTransit += 1;
            break;

          case "STOPPED_AT":
            summary.stopped += 1;
            break;

          case "INCOMING_AT":
            summary.incoming += 1;
            break;

          default:
            break;
        }

        return summary;
      },
      {
        inTransit: 0,
        stopped: 0,
        incoming: 0,
      },
    );
  }, [vehicles]);

  const activeFilters =
    selectedRoutes.length +
    selectedTrips.length +
    (vehicleSearch.trim() ? 1 : 0);

  const formattedLastUpdated =
    lastUpdated
      ? lastUpdated.toLocaleTimeString(
          "id-ID",
          {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          },
        )
      : "—";

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900">
      {/* =====================================================
          HEADER
      ====================================================== */}
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-sm shadow-blue-600/20">
              <BusFront
                size={25}
                strokeWidth={2.2}
              />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="truncate text-[11px] font-bold uppercase tracking-[0.14em] text-blue-600">
                  TransJakarta Fleet System
                </p>

                <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-500" />
              </div>

              <h1 className="truncate text-xl font-extrabold tracking-tight text-slate-950 sm:text-2xl">
                Sistem Manajemen Armada
              </h1>
            </div>
          </div>

          <div className="hidden items-center gap-2 md:flex">
            <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1">
            
            </div>

            <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700">
              <Radio
                size={14}
                className="animate-pulse"
              />
              Auto-Sync (60s)
            </div>
          </div>

          <div className="flex items-center gap-2 md:hidden">
            <button
              type="button"
              onClick={refresh}
              disabled={loading}
              aria-label="Segarkan data"
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 disabled:opacity-50"
            >
              <RefreshCw
                size={16}
                className={
                  loading
                    ? "animate-spin"
                    : ""
                }
              />
            </button>
          </div>
        </div>
      </header>

      {/* =====================================================
          MAIN
      ====================================================== */}
      <main className="mx-auto max-w-[1440px] px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
        {/* ===================================================
            STATUS SUMMARY
        ==================================================== */}
        <section className="grid grid-cols-2 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm sm:grid-cols-4">
          <div className="flex items-center gap-3 border-b border-slate-100 p-4 sm:border-b-0 sm:border-r sm:p-5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
              <Layers3 size={18} />
            </div>

            <div>
              <p className="text-[10px] font-semibold text-slate-400">
                Total Armada
              </p>

              <p className="text-sm font-extrabold text-slate-950">
                {total.toLocaleString(
                  "id-ID",
                )}{" "}
                Armada
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 border-b border-slate-100 p-4 sm:border-b-0 sm:border-r sm:p-5">
            <span className="h-3 w-3 shrink-0 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/30" />

            <div>
              <p className="text-[10px] font-semibold text-slate-400">
                In Transit
              </p>

              <p className="text-sm font-extrabold text-emerald-600">
                {statusSummary.inTransit}{" "}
                Armada
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 border-slate-100 p-4 sm:border-r sm:p-5">
            <span className="h-3 w-3 shrink-0 rounded-full bg-amber-500 shadow-sm shadow-amber-500/30" />

            <div>
              <p className="text-[10px] font-semibold text-slate-400">
                Stopped At
              </p>

              <p className="text-sm font-extrabold text-amber-600">
                {statusSummary.stopped}{" "}
                Armada
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 border-slate-100 p-4 sm:p-5">
            <span className="h-3 w-3 shrink-0 rounded-full bg-sky-500 shadow-sm shadow-sky-500/30" />

            <div>
              <p className="text-[10px] font-semibold text-slate-400">
                Incoming At
              </p>

              <p className="text-sm font-extrabold text-sky-600">
                {statusSummary.incoming}{" "}
                Armada
              </p>
            </div>
          </div>
        </section>

        {/* ===================================================
            FILTER BAR
        ==================================================== */}
        <section className="mt-4 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
          <VehicleFilters
            selectedRoutes={
              selectedRoutes
            }
            selectedTrips={
              selectedTrips
            }
            vehicleSearch={
              vehicleSearch
            }
            onRoutesChange={
              setSelectedRoutes
            }
            onTripsChange={
              setSelectedTrips
            }
            onVehicleSearchChange={
              setVehicleSearch
            }
          />
        </section>

        {/* ===================================================
            CONTENT HEADER
        ==================================================== */}
        <section className="mt-7">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              
              <h2 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-950">
                Armada Aktif
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                {total.toLocaleString(
                  "id-ID",
                )}{" "}
                kendaraan ditemukan
                {activeFilters > 0
                  ? ` · ${activeFilters} filter aktif`
                  : ""}
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Clock3 size={14} />

              <span>
                Last sync:{" "}
                <span className="font-semibold text-slate-600">
                  {formattedLastUpdated}
                </span>
              </span>
            </div>
          </div>

          {/* =================================================
              CONTENT
          ================================================== */}
          <div className="mt-5">
            {error ? (
              <ErrorMessage
                message={error}
                onRetry={retry}
              />
            ) : loading ? (
              <Loading />
            ) : viewMode === "map" ? (
              <FleetMap
                vehicles={vehicles}
                selectedVehicle={
                  selectedVehicle
                }
                onVehicleClick={
                  setSelectedVehicle
                }
              />
            ) : vehicles.length === 0 ? (
              <div className="flex min-h-[280px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white px-6 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                  <Search size={22} />
                </div>

                <h3 className="mt-4 text-sm font-bold text-slate-800">
                  Tidak ada armada realtime 
                </h3>

                <p className="mt-1 max-w-md text-xs leading-5 text-slate-500">
                  Tidak ada kendaraan aktif yang tersedia untuk
                  Route atau Trip yang dipilih.
                </p>
              </div>
            ) : (
              <VehicleGrid
                vehicles={vehicles}
                onVehicleClick={
                  setSelectedVehicle
                }
              />
            )}
          </div>

          {!loading && !error && (
            <Pagination
              page={page}
              pageSize={pageSize}
              total={total}
              totalPages={totalPages}
              hasNextPage={
                hasNextPage
              }
              hasPreviousPage={
                hasPreviousPage
              }
              loading={loading}
              onPageChange={setPage}
              onPageSizeChange={
                setPageSize
              }
            />
          )}
        </section>
      </main>

      {/* =====================================================
          FOOTER
      ====================================================== */}
      <footer className="mt-8 border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-[1440px] flex-col gap-2 px-4 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <span className="text-xs font-semibold text-slate-950">
            TransJakarta - Sistem Manajemen Armada
          </span>

          <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-700">
            <CheckCircle2 size={14} />
            MBTA Realtime API Connected
          </span>
        </div>
      </footer>

      {/* =====================================================
          DETAIL MODAL
      ====================================================== */}
      {selectedVehicle && (
        <VehicleDetail
          vehicle={selectedVehicle}
          onClose={() =>
            setSelectedVehicle(null)
          }
        />
      )}
    </div>
  );
}

export default App;