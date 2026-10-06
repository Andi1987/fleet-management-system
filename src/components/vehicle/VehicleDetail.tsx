import {
  Clock3,
  Compass,
  Copy,
  Gauge,
  MapPin,
  Radio,
  Users,
  X,
} from "lucide-react";
import {
  useEffect,
  useState,
  type ReactNode,
} from "react";

import type { Vehicle } from "../../types/mbta";
import { FleetMap } from "../maps/FleetMap";

interface VehicleDetailProps {
  vehicle: Vehicle;
  onClose: () => void;
}

const MBTA_API_BASE_URL = "https://api-v3.mbta.com";

interface IncludedResource {
  id: string;
  type: string;
  attributes: Record<string, unknown>;
}

interface VehicleDetailResponse {
  data: {
    id: string;
    type: string;
    attributes: Record<string, unknown>;
    relationships?: {
      route?: {
        data?: {
          id: string;
          type: string;
        } | null;
      };
      trip?: {
        data?: {
          id: string;
          type: string;
        } | null;
      };
      stop?: {
        data?: {
          id: string;
          type: string;
        } | null;
      };
    };
  };
  included?: IncludedResource[];
}

interface RouteDetail {
  id: string;
  short_name: string | null;
  long_name: string | null;
  description: string | null;
  direction_names: string[];
  direction_destinations: string[];
  type: number | null;
}

interface TripDetail {
  id: string;
  block_id: string | null;
  direction_id: number | null;
  headsign: string | null;
  name: string | null;
  wheelchair_accessible: number | null;
  bikes_allowed: number | null;
}

interface StopDetail {
  id: string;
  name: string | null;
  municipality: string | null;
  latitude: number | null;
  longitude: number | null;
}

interface DetailData {
  route: RouteDetail | null;
  trip: TripDetail | null;
  stop: StopDetail | null;
}

function formatDate(
  value: string | null,
) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleString(
    "id-ID",
    {
      dateStyle: "medium",
      timeStyle: "medium",
    },
  );
}

function formatRelativeTime(
  value: string | null,
) {
  if (!value) {
    return "Tidak diketahui";
  }

  const timestamp =
    new Date(value).getTime();

  if (Number.isNaN(timestamp)) {
    return "Tidak diketahui";
  }

  const diffSeconds = Math.max(
    0,
    Math.floor(
      (Date.now() - timestamp) /
        1000,
    ),
  );

  if (diffSeconds < 60) {
    return `${diffSeconds} detik lalu`;
  }

  const diffMinutes =
    Math.floor(diffSeconds / 60);

  if (diffMinutes < 60) {
    return `${diffMinutes} menit lalu`;
  }

  const diffHours =
    Math.floor(diffMinutes / 60);

  if (diffHours < 24) {
    return `${diffHours} jam lalu`;
  }

  const diffDays =
    Math.floor(diffHours / 24);

  return `${diffDays} hari lalu`;
}

function statusLabel(
  status: string | null,
) {
  if (!status) {
    return "Unknown";
  }

  return status
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(
      /\b\w/g,
      (letter) =>
        letter.toUpperCase(),
    );
}

function getStatusClasses(
  status: string | null,
) {
  switch (status) {
    case "IN_TRANSIT_TO":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";

    case "STOPPED_AT":
      return "border-amber-200 bg-amber-50 text-amber-700";

    case "INCOMING_AT":
      return "border-sky-200 bg-sky-50 text-sky-700";

    default:
      return "border-slate-200 bg-slate-50 text-slate-600";
  }
}

function getRouteTypeLabel(
  type: number | null,
) {
  switch (type) {
    case 0:
      return "Tram / Streetcar";

    case 1:
      return "Subway";

    case 2:
      return "Rail";

    case 3:
      return "Bus";

    case 4:
      return "Ferry";

    default:
      return "Tidak diketahui";
  }
}

function getDirectionLabel(
  directionId: number | null,
) {
  if (directionId === 0) {
    return "Arah 0";
  }

  if (directionId === 1) {
    return "Arah 1";
  }

  return "Tidak diketahui";
}

function getWheelchairLabel(
  value: number | null,
) {
  switch (value) {
    case 1:
      return "Wheelchair accessible";

    case 2:
      return "Tidak wheelchair accessible";

    case 0:
    default:
      return "Tidak diketahui";
  }
}

function getOccupancyLabel(
  value: string | null,
) {
  if (!value) {
    return "Tidak tersedia";
  }

  return value
    .replaceAll("_", " ")
    .replace(
      /\b\w/g,
      (letter) =>
        letter.toUpperCase(),
    );
}

interface MetricCardProps {
  label: string;
  value: string;
  icon: ReactNode;
}

function MetricCard({
  label,
  value,
  icon,
}: MetricCardProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
        {icon}
        {label}
      </div>

      <p className="mt-2 break-words text-base font-extrabold text-slate-900">
        {value}
      </p>
    </div>
  );
}

interface DetailCardProps {
  title: string;
  children: ReactNode;
  badge?: string;
}

function DetailCard({
  title,
  children,
  badge,
}: DetailCardProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="flex items-center gap-2 text-sm font-extrabold text-slate-900">
          {title}
        </h3>

        {badge && (
          <span className="max-w-[55%] truncate rounded-md bg-slate-600 px-2 py-1 text-[10px] font-bold text-white">
            {badge}
          </span>
        )}
      </div>

      {children}
    </div>
  );
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-slate-100 py-3 last:border-0 last:pb-0 first:pt-0">
      <span className="shrink-0 text-xs text-slate-400">
        {label}
      </span>

      <span className="max-w-[68%] break-words text-right text-xs font-bold text-slate-800">
        {value}
      </span>
    </div>
  );
}

function copyText(value: string) {
  void navigator.clipboard?.writeText(
    value,
  );
}

function getIncludedResource(
  included: IncludedResource[],
  type: string,
  id: string | null,
) {
  if (!id) {
    return undefined;
  }

  return included.find(
    (resource) =>
      resource.type === type &&
      resource.id === id,
  );
}

function readString(
  attributes: Record<string, unknown>,
  key: string,
) {
  const value = attributes[key];

  return typeof value === "string"
    ? value
    : null;
}

function readNumber(
  attributes: Record<string, unknown>,
  key: string,
) {
  const value = attributes[key];

  return typeof value === "number"
    ? value
    : null;
}

function readStringArray(
  attributes: Record<string, unknown>,
  key: string,
) {
  const value = attributes[key];

  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(
    (item): item is string =>
      typeof item === "string",
  );
}

function DetailLoading() {
  return (
    <div className="flex min-h-[520px] flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white px-6 py-16">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-slate-900" />
      </div>

      <h3 className="mt-5 text-base font-extrabold text-slate-900">
        Memuat Detail Armada
      </h3>

      <p className="mt-2 max-w-sm text-center text-xs leading-5 text-slate-500">
        Sedang mengambil data rute, trip,
        dan halte dari MBTA Realtime Transit
        API.
      </p>

      <div className="mt-6 w-full max-w-md space-y-3">
        <div className="h-3 animate-pulse rounded-full bg-slate-100" />
        <div className="h-3 w-4/5 animate-pulse rounded-full bg-slate-100" />
        <div className="h-3 w-3/5 animate-pulse rounded-full bg-slate-100" />
      </div>
    </div>
  );
}

function DetailError({
  onRetry,
}: {
  onRetry: () => void;
}) {
  return (
    <div className="flex min-h-[520px] flex-col items-center justify-center rounded-2xl border border-amber-200 bg-amber-50 px-6 py-16 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-amber-600 shadow-sm">
        <Radio size={24} />
      </div>

      <h3 className="mt-5 text-base font-extrabold text-slate-900">
        Detail Armada Tidak Dapat Dimuat
      </h3>

      <p className="mt-2 max-w-md text-xs leading-5 text-slate-600">
        Data detail rute, trip, atau halte
        dari MBTA tidak berhasil diambil.
        Silakan coba lagi.
      </p>

      <button
        type="button"
        onClick={onRetry}
        className="mt-5 rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-bold text-white transition hover:bg-blue-600"
      >
        Coba Lagi
      </button>
    </div>
  );
}

export function VehicleDetail({
  vehicle,
  onClose,
}: VehicleDetailProps) {
  const {
    label,
    current_status,
    latitude,
    longitude,
    updated_at,
    speed,
    bearing,
    occupancy_status,
    direction_id,
    current_stop_sequence,
    revenue,
  } = vehicle.attributes;

  const routeId =
    vehicle.relationships.route.data?.id ??
    null;

  const tripId =
    vehicle.relationships.trip.data?.id ??
    null;

  const stopId =
    vehicle.relationships.stop.data?.id ??
    null;

  const [detailData, setDetailData] =
    useState<DetailData>({
      route: null,
      trip: null,
      stop: null,
    });

  const [detailLoading, setDetailLoading] =
    useState(true);

  const [detailError, setDetailError] =
    useState(false);

  const [retryCount, setRetryCount] =
    useState(0);

  const coordinateText =
    latitude !== null &&
    longitude !== null
      ? `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
      : "Tidak tersedia";

  useEffect(() => {
    let cancelled = false;

    async function loadDetail() {
      setDetailLoading(true);
      setDetailError(false);

      try {
        const response = await fetch(
          `${MBTA_API_BASE_URL}/vehicles/${encodeURIComponent(
            vehicle.id,
          )}?include=route,trip,stop`,
          {
            headers: {
              Accept:
                "application/vnd.api+json",
            },
          },
        );

        if (!response.ok) {
          throw new Error(
            `MBTA detail request failed: ${response.status}`,
          );
        }

        const result =
          (await response.json()) as VehicleDetailResponse;

        if (cancelled) {
          return;
        }

        const included =
          result.included ?? [];

        const responseRouteId =
          result.data.relationships?.route?.data
            ?.id ?? routeId;

        const responseTripId =
          result.data.relationships?.trip?.data
            ?.id ?? tripId;

        const responseStopId =
          result.data.relationships?.stop?.data
            ?.id ?? stopId;

        const routeResource =
          getIncludedResource(
            included,
            "route",
            responseRouteId,
          );

        const tripResource =
          getIncludedResource(
            included,
            "trip",
            responseTripId,
          );

        const stopResource =
          getIncludedResource(
            included,
            "stop",
            responseStopId,
          );

        const routeAttributes =
          routeResource?.attributes ?? {};

        const tripAttributes =
          tripResource?.attributes ?? {};

        const stopAttributes =
          stopResource?.attributes ?? {};

        setDetailData({
          route: routeResource
            ? {
                id: routeResource.id,
                short_name:
                  readString(
                    routeAttributes,
                    "short_name",
                  ),
                long_name:
                  readString(
                    routeAttributes,
                    "long_name",
                  ),
                description:
                  readString(
                    routeAttributes,
                    "description",
                  ),
                direction_names:
                  readStringArray(
                    routeAttributes,
                    "direction_names",
                  ),
                direction_destinations:
                  readStringArray(
                    routeAttributes,
                    "direction_destinations",
                  ),
                type:
                  readNumber(
                    routeAttributes,
                    "type",
                  ),
              }
            : null,

          trip: tripResource
            ? {
                id: tripResource.id,
                block_id:
                  readString(
                    tripAttributes,
                    "block_id",
                  ),
                direction_id:
                  readNumber(
                    tripAttributes,
                    "direction_id",
                  ),
                headsign:
                  readString(
                    tripAttributes,
                    "headsign",
                  ),
                name:
                  readString(
                    tripAttributes,
                    "name",
                  ),
                wheelchair_accessible:
                  readNumber(
                    tripAttributes,
                    "wheelchair_accessible",
                  ),
                bikes_allowed:
                  readNumber(
                    tripAttributes,
                    "bikes_allowed",
                  ),
              }
            : null,

          stop: stopResource
            ? {
                id: stopResource.id,
                name:
                  readString(
                    stopAttributes,
                    "name",
                  ),
                municipality:
                  readString(
                    stopAttributes,
                    "municipality",
                  ),
                latitude:
                  readNumber(
                    stopAttributes,
                    "latitude",
                  ),
                longitude:
                  readNumber(
                    stopAttributes,
                    "longitude",
                  ),
              }
            : null,
        });
      } catch {
        if (!cancelled) {
          setDetailError(true);
        }
      } finally {
        if (!cancelled) {
          setDetailLoading(false);
        }
      }
    }

    void loadDetail();

    return () => {
      cancelled = true;
    };
  }, [
    vehicle.id,
    routeId,
    tripId,
    stopId,
    retryCount,
  ]);

  useEffect(() => {
    const handleKeyDown = (
      event: KeyboardEvent,
    ) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener(
      "keydown",
      handleKeyDown,
    );

    document.body.style.overflow =
      "hidden";

    return () => {
      document.removeEventListener(
        "keydown",
        handleKeyDown,
      );

      document.body.style.overflow =
        "";
    };
  }, [onClose]);

  const route =
    detailData.route;

  const trip =
    detailData.trip;

  const stop =
    detailData.stop;

  const effectiveDirectionId =
    trip?.direction_id ??
    direction_id;

  const routeDestination =
    route?.direction_destinations
      .length
      ? route.direction_destinations.join(
          " ↔ ",
        )
      : "Tidak tersedia";

  const directionName =
    effectiveDirectionId !== null &&
    route?.direction_names?.[
      effectiveDirectionId
    ]
      ? route.direction_names[
          effectiveDirectionId
        ]
      : getDirectionLabel(
          effectiveDirectionId,
        );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-0 backdrop-blur-sm sm:p-4"
      onMouseDown={(event) => {
        if (
          event.target ===
          event.currentTarget
        ) {
          onClose();
        }
      }}
    >
      <div className="flex h-full w-full max-w-6xl flex-col overflow-hidden bg-slate-50 shadow-2xl sm:h-[94vh] sm:rounded-3xl">
        {/* HEADER */}
        <header className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-white px-5 py-4 sm:px-7">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white">
              <Radio size={18} />
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <h2 className="text-lg font-extrabold text-slate-950 sm:text-xl">
                  Armada{" "}
                  {label ??
                    vehicle.id}
                </h2>

                <span className="text-[10px] font-medium text-slate-400">
                  ID: {vehicle.id}
                </span>
              </div>

              <p className="text-[11px] text-slate-500">
                Detail Informasi Operasional Armada
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup detail armada"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-800"
          >
            <X size={20} />
          </button>
        </header>

        {/* BODY */}
        <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
          {detailLoading ? (
            <DetailLoading />
          ) : detailError ? (
            <DetailError
              onRetry={() =>
                setRetryCount(
                  (value) =>
                    value + 1,
                )
              }
            />
          ) : (
            <>
              {/* STATUS / GPS / UPDATE */}
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <div
                  className={`rounded-2xl border p-4 ${getStatusClasses(
                    current_status,
                  )}`}
                >
                  <p className="text-[10px] font-bold uppercase tracking-wider opacity-70">
                    Status Armada
                  </p>

                  <div className="mt-2 flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-current opacity-80" />

                    <p className="text-base font-extrabold">
                      {current_status ??
                        "UNKNOWN"}
                    </p>
                  </div>

                  <p className="mt-2 text-[11px] leading-5 opacity-70">
                    {statusLabel(
                      current_status,
                    )}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      <MapPin
                        size={13}
                        className="text-red-500"
                      />
                      Koordinat GPS
                    </p>

                    <button
                      type="button"
                      onClick={() =>
                        copyText(
                          coordinateText,
                        )
                      }
                      disabled={
                        coordinateText ===
                        "Tidak tersedia"
                      }
                      className="flex items-center gap-1 text-[10px] font-semibold text-blue-500 disabled:opacity-40"
                    >
                      <Copy size={12} />
                      Salin
                    </button>
                  </div>

                  <p className="mt-2 font-mono text-sm font-bold text-slate-900">
                    {coordinateText}
                  </p>

                  <p className="mt-1 text-[11px] text-slate-400">
                    Lat :{" "}
                    {latitude !== null
                      ? latitude.toFixed(6)
                      : "—"}{" "}
                    | Long :{" "}
                    {longitude !== null
                      ? longitude.toFixed(6)
                      : "—"}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    <Clock3 size={13} />
                    Waktu Update Terakhir
                  </p>

                  <p className="mt-2 text-base font-extrabold text-slate-900">
                    {formatRelativeTime(
                      updated_at,
                    )}
                  </p>

                  <p className="mt-1 text-[10px] text-slate-400">
                    {formatDate(
                      updated_at,
                    )}
                  </p>
                </div>
              </div>

              {/* MAP - TETAP ADA */}
              <div className="mt-5">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h3 className="flex items-center gap-2 text-sm font-extrabold text-slate-900">
                    <MapPin
                      size={16}
                      className="text-red-500"
                    />
                    Posisi Kendaraan pada
                    Peta
                  </h3>

                  <span className="text-[10px] font-semibold text-slate-400">
                    Live Interactive Map
                  </span>
                </div>

                <FleetMap
                  vehicles={[vehicle]}
                  selectedVehicle={
                    vehicle
                  }
                />
              </div>

              {/* DATA ROUTE / TRIP */}
              <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
                {/* DATA ROUTE */}
                <DetailCard
                  title="Data Rute"
                  badge={
                    route?.short_name ??
                    routeId ??
                    "—"
                  }
                >
                  <DetailRow
                    label="ID Rute"
                    value={
                      route?.id ??
                      routeId ??
                      "—"
                    }
                  />

                  <DetailRow
                    label="Nama Rute"
                    value={
                      route?.long_name ??
                      "Tidak tersedia"
                    }
                  />

                  <DetailRow
                    label="Tipe Armada"
                    value={
                      route?.type !== null &&
                      route?.type !== undefined
                        ? getRouteTypeLabel(
                            route.type,
                          )
                        : "Tidak tersedia"
                    }
                  />

                  <DetailRow
                    label="Tujuan"
                    value={
                      routeDestination
                    }
                  />

                  <DetailRow
                    label="Arah Lintasan"
                    value={
                      directionName
                    }
                  />

                  {route?.description && (
                    <DetailRow
                      label="Deskripsi"
                      value={
                        route.description
                      }
                    />
                  )}
                </DetailCard>

                {/* DATA TRIP */}
                <DetailCard
                  title="Data Trip"
                  badge={
                    trip?.id
                      ? `ID: ${trip.id}`
                      : tripId
                        ? `ID: ${tripId}`
                        : "—"
                  }
                >
                  <DetailRow
                    label="Trip ID"
                    value={
                      trip?.id ??
                      tripId ??
                      "—"
                    }
                  />

                  <DetailRow
                    label="Headsign"
                    value={
                      trip?.headsign ??
                      "Tidak tersedia"
                    }
                  />

                  <DetailRow
                    label="Arah"
                    value={
                      directionName
                    }
                  />

                  <DetailRow
                    label="Block ID"
                    value={
                      trip?.block_id ??
                      "Tidak tersedia"
                    }
                  />

                  <DetailRow
                    label="Accessibility"
                    value={
                      getWheelchairLabel(
                        trip?.wheelchair_accessible ??
                          null,
                      )
                    }
                  />

                  <DetailRow
                    label="Bikes Allowed"
                    value={
                      trip?.bikes_allowed ===
                      1
                        ? "Allowed"
                        : trip?.bikes_allowed ===
                            2
                          ? "Not allowed"
                          : "Tidak diketahui"
                    }
                  />
                </DetailCard>
              </div>

              {/* STOP & SENSOR */}
              <div className="mt-5">
                <DetailCard title="Informasi Halte & Sensor">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <MetricCard
                      label="Halte Terkait"
                      icon={
                        <MapPin
                          size={13}
                          className="text-red-500"
                        />
                      }
                      value={
                        stop?.name ??
                        stopId ??
                        "Tidak tersedia"
                      }
                    />

                    <MetricCard
                      label="Kecepatan"
                      icon={
                        <Gauge
                          size={13}
                          className="text-blue-500"
                        />
                      }
                      value={
                        speed !== null
                          ? `${speed} m/s`
                          : "N/A"
                      }
                    />

                    <MetricCard
                      label="Arah Gerak"
                      icon={
                        <Compass
                          size={13}
                          className="text-violet-500"
                        />
                      }
                      value={
                        bearing !== null
                          ? `${bearing}`
                          : "N/A"
                      }
                    />

                    <MetricCard
                      label="Sensor Muatan"
                      icon={
                        <Users
                          size={13}
                          className="text-emerald-500"
                        />
                      }
                      value={getOccupancyLabel(
                        occupancy_status,
                      )}
                    />
                  </div>

                  <div className="mt-4">
                    <DetailRow
                      label="Stop ID"
                      value={
                        stop?.id ??
                        stopId ??
                        "—"
                      }
                    />

                    <DetailRow
                      label="Municipality"
                      value={
                        stop?.municipality ??
                        "Tidak tersedia"
                      }
                    />

                    <DetailRow
                      label="Stop sequence"
                      value={
                        current_stop_sequence !==
                        null
                          ? String(
                              current_stop_sequence,
                            )
                          : "—"
                      }
                    />

                    <DetailRow
                      label="Revenue service"
                      value={
                        revenue ?? "—"
                      }
                    />

                    <DetailRow
                      label="Bearing"
                      value={
                        bearing !== null
                          ? `${bearing}°`
                          : "N/A"
                      }
                    />
                  </div>
                </DetailCard>
              </div>
            </>
          )}
        </div>

        {/* FOOTER */}
        <footer className="flex shrink-0 items-center justify-between gap-3 border-t border-slate-200 bg-white px-5 py-3 sm:px-6">
          <div className="flex items-center gap-2 text-[11px] text-slate-400">
            <Radio
              size={13}
              className="text-emerald-500"
            />
            MBTA Realtime Transit API
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-bold text-white transition hover:bg-blue-600"
          >
            Tutup
          </button>
        </footer>
      </div>
    </div>
  );
}