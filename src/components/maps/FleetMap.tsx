import { useEffect } from "react";
import {
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import type { Vehicle } from "../../types/mbta";

import "leaflet/dist/leaflet.css";

interface FleetMapProps {
  vehicles: Vehicle[];
  selectedVehicle?: Vehicle | null;
  onVehicleClick?: (vehicle: Vehicle) => void;
}

const vehicleIcon = L.divIcon({
  className: "",
  html: `
    <div style="
      width: 34px;
      height: 34px;
      border-radius: 50%;
      background: #2563eb;
      border: 4px solid white;
      box-shadow: 0 4px 14px rgba(15, 23, 42, 0.25);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 15px;
      line-height: 1;
    ">
      🚍
    </div>
  `,
  iconSize: [34, 34],
  iconAnchor: [17, 17],
});

function MapFocus({
  vehicle,
}: {
  vehicle?: Vehicle | null;
}) {
  const map = useMap();

  useEffect(() => {
    const latitude =
      vehicle?.attributes.latitude;

    const longitude =
      vehicle?.attributes.longitude;

    if (
      latitude === null ||
      latitude === undefined ||
      longitude === null ||
      longitude === undefined
    ) {
      return;
    }

    map.flyTo(
      [latitude, longitude],
      Math.max(map.getZoom(), 14),
      {
        duration: 0.8,
      },
    );
  }, [map, vehicle]);

  return null;
}

function getStatusLabel(
  status: string | null,
) {
  if (!status) {
    return "Unknown";
  }

  return status
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase(),
    );
}

export function FleetMap({
  vehicles,
  selectedVehicle,
  onVehicleClick,
}: FleetMapProps) {
  const firstVehicle = vehicles.find(
    (vehicle) =>
      vehicle.attributes.latitude !== null &&
      vehicle.attributes.longitude !== null,
  );

  const center: [number, number] =
    firstVehicle
      ? [
          firstVehicle.attributes.latitude!,
          firstVehicle.attributes.longitude!,
        ]
      : [42.3601, -71.0589];

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
        <div>
          <h3 className="font-bold text-slate-900">
            Peta Armada
          </h3>

          <p className="mt-0.5 text-xs text-slate-500">
            Monitoring posisi kendaraan secara real-time
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          {vehicles.length} kendaraan
        </div>
      </div>

      <div className="h-[520px]">
        <MapContainer
          center={center}
          zoom={12}
          scrollWheelZoom
          className="h-full w-full"
        >
          <TileLayer
            attribution="&copy; OpenStreetMap contributors"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <MapFocus vehicle={selectedVehicle} />

          {vehicles.map((vehicle) => {
            const {
              latitude,
              longitude,
              label,
              current_status,
            } = vehicle.attributes;

            if (
              latitude === null ||
              longitude === null
            ) {
              return null;
            }

            const vehicleLabel =
              label ?? vehicle.id;

            const status =
              getStatusLabel(
                current_status,
              );

            return (
              <Marker
                key={vehicle.id}
                position={[
                  latitude,
                  longitude,
                ]}
                icon={vehicleIcon}
                eventHandlers={{
                  click: () =>
                    onVehicleClick?.(
                      vehicle,
                    ),
                }}
              >
                <Popup>
                  <div className="min-w-[210px] py-1">
                    <p className="text-base font-bold text-slate-900">
                      Armada {vehicleLabel}
                    </p>

                    <div className="mt-3">
                      <p className="text-xs font-medium text-slate-400">
                        Status
                      </p>

                      <p className="mt-0.5 text-sm font-semibold text-slate-800">
                        {status}
                      </p>
                    </div>

                    <div className="mt-3">
                      <p className="text-xs font-medium text-slate-400">
                        Koordinat
                      </p>

                      <p className="mt-0.5 text-sm font-medium text-slate-800">
                        {latitude.toFixed(5)},{" "}
                        {longitude.toFixed(5)}
                      </p>
                    </div>

                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>
    </div>
  );
}