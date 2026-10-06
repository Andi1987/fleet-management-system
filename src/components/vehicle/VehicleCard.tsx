import {
  Clock3,
  Copy,
  ExternalLink,
  MapPin,
  Navigation,
  Route as RouteIcon,
} from "lucide-react";

import type { Vehicle } from "../../types/mbta";

interface VehicleCardProps {
  vehicle: Vehicle;
  onClick: (vehicle: Vehicle) => void;
}

function getStatusConfig(
  status: string | null,
) {
  switch (status) {
    case "IN_TRANSIT_TO":
      return {
        label: "IN_TRANSIT_TO",
        classes:
          "border-emerald-200 bg-emerald-50 text-emerald-700",
        dot: "bg-emerald-500",
      };

    case "STOPPED_AT":
      return {
        label: "STOPPED_AT",
        classes:
          "border-amber-200 bg-amber-50 text-amber-700",
        dot: "bg-amber-500",
      };

    case "INCOMING_AT":
      return {
        label: "INCOMING_AT",
        classes:
          "border-sky-200 bg-sky-50 text-sky-700",
        dot: "bg-sky-500",
      };

    default:
      return {
        label:
          status
            ?.replaceAll("_", " ")
            .toLowerCase()
            .replace(
              /\b\w/g,
              (letter) =>
                letter.toUpperCase(),
            ) ?? "UNKNOWN",

        classes:
          "border-slate-200 bg-slate-50 text-slate-600",

        dot: "bg-slate-400",
      };
  }
}

function formatRelativeTime(
  updatedAt: string | null,
): string {
  if (!updatedAt) {
    return "Tidak diketahui";
  }

  const updatedTime =
    new Date(
      updatedAt,
    ).getTime();

  if (
    Number.isNaN(updatedTime)
  ) {
    return "Tidak diketahui";
  }

  const diffSeconds =
    Math.max(
      0,
      Math.floor(
        (Date.now() -
          updatedTime) /
          1000,
      ),
    );

  if (diffSeconds < 60) {
    return `${diffSeconds} detik lalu`;
  }

  const diffMinutes =
    Math.floor(
      diffSeconds / 60,
    );

  if (diffMinutes < 60) {
    return `${diffMinutes} menit lalu`;
  }

  const diffHours =
    Math.floor(
      diffMinutes / 60,
    );

  if (diffHours < 24) {
    return `${diffHours} jam lalu`;
  }

  const diffDays =
    Math.floor(
      diffHours / 24,
    );

  return `${diffDays} hari lalu`;
}

function copyCoordinates(
  latitude: number | null,
  longitude: number | null,
) {
  if (
    latitude === null ||
    longitude === null
  ) {
    return;
  }

  void navigator.clipboard?.writeText(
    `${latitude}, ${longitude}`,
  );
}

export function VehicleCard({
  vehicle,
  onClick,
}: VehicleCardProps) {
  const {
    label,
    current_status,
    latitude,
    longitude,
    updated_at,
    bearing,
  } = vehicle.attributes;

  const routeId =
    vehicle.relationships.route
      .data?.id ?? null;

  const tripId =
    vehicle.relationships.trip
      .data?.id ?? null;

  /*
   * Route display:
   *
   * Prioritas:
   * 1. long_name
   * 2. short_name
   * 3. route ID
   */
  const routeName =
    vehicle.route?.attributes
      .long_name?.trim() ||
    vehicle.route?.attributes
      .short_name?.trim() ||
    routeId ||
    "Tidak tersedia";

  /*
   * Trip display:
   *
   * Prioritas:
   * 1. headsign
   * 2. name
   * 3. trip ID
   */
  const tripName =
    vehicle.trip?.attributes
      .headsign?.trim() ||
    vehicle.trip?.attributes
      .name?.trim() ||
    tripId ||
    "Tidak tersedia";

  const status =
    getStatusConfig(
      current_status,
    );

  const relativeTime =
    formatRelativeTime(
      updated_at,
    );

  const handleCardClick = () => {
    onClick(vehicle);
  };

  const handleCardKeyDown = (
    event: React.KeyboardEvent<HTMLElement>,
  ) => {
    if (
      event.key === "Enter" ||
      event.key === " "
    ) {
      event.preventDefault();
      onClick(vehicle);
    }
  };

  return (
    <article
      role="button"
      tabIndex={0}
      aria-label={`Lihat detail armada ${
        label ?? vehicle.id
      }`}
      onClick={handleCardClick}
      onKeyDown={
        handleCardKeyDown
      }
      className="group flex h-full cursor-pointer flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm outline-none transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-lg focus-visible:border-blue-400 focus-visible:ring-4 focus-visible:ring-blue-500/10"
    >
      {/* HEADER */}
      <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-4 py-4">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
            Armada
          </p>

          <h3 className="mt-1 truncate text-lg font-extrabold text-slate-950">
            {label ??
              vehicle.id}
          </h3>

          <p className="mt-0.5 truncate text-[10px] font-medium text-slate-400">
            ID: {vehicle.id}
          </p>
        </div>

        <span
          className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold ${status.classes}`}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${status.dot}`}
          />
          {status.label}
        </span>
      </div>

      {/* ROUTE / TRIP */}
      <div className="grid grid-cols-1 gap-3 px-4 pt-4 sm:grid-cols-2">
        <div className="min-w-0 rounded-xl bg-slate-50 p-3">
          <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            <RouteIcon
              size={12}
              className="text-blue-500"
            />
            Route
          </div>

          <p
            className="mt-1.5 break-words text-sm font-bold leading-5 text-slate-800"
            title={routeName}
          >
            {routeName}
          </p>
        </div>

        <div className="min-w-0 rounded-xl bg-slate-50 p-3">
          <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Trip
          </div>

          <p
            className="mt-1.5 break-words text-sm font-bold leading-5 text-slate-800"
            title={tripName}
          >
            {tripName}
          </p>
        </div>
      </div>

      {/* GPS */}
      <div className="px-4 pt-4">
        <div className="rounded-xl border border-slate-100 bg-white p-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              <MapPin
                size={12}
                className="text-red-500"
              />
              Posisi GPS
            </div>

            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();

                copyCoordinates(
                  latitude,
                  longitude,
                );
              }}
              disabled={
                latitude === null ||
                longitude === null
              }
              className="flex shrink-0 items-center gap-1 text-[10px] font-semibold text-blue-500 transition hover:text-blue-700 disabled:opacity-40"
            >
              <Copy size={12} />
              Salin
            </button>
          </div>

          <p className="mt-1.5 font-mono text-[11px] font-bold text-slate-700">
            {latitude !== null &&
            longitude !== null
              ? `${latitude}, ${longitude}`
              : "Tidak tersedia"}
          </p>
        </div>
      </div>

      {/* META */}
      <div className="mt-auto px-4 pb-4 pt-3">
        <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
          <Navigation size={12} />

          <span>
            Arah perjalanan{" "}
            <strong className="text-slate-600">
              {bearing !== null
                ? `${bearing}°`
                : "N/A"}
            </strong>
          </span>
        </div>

        <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-slate-400">
          <Clock3 size={12} />

          <span>
            Update{" "}
            <strong className="text-slate-600">
              {relativeTime}
            </strong>
          </span>
        </div>

        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onClick(vehicle);
          }}
          className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-blue-600"
        >
          Detail
          <ExternalLink size={13} />
        </button>
      </div>
    </article>
  );
}