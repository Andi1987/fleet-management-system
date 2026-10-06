import type { Vehicle } from "../../types/mbta";
import { VehicleCard } from "./VehicleCard";

interface VehicleGridProps {
  vehicles: Vehicle[];
  onVehicleClick: (vehicle: Vehicle) => void;
}

export function VehicleGrid({
  vehicles,
  onVehicleClick,
}: VehicleGridProps) {
  if (vehicles.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center shadow-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            className="h-7 w-7"
            stroke="currentColor"
            strokeWidth="1.6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 17h14M6 17V8a3 3 0 0 1 3-3h6a3 3 0 0 1 3 3v9M4 17h16l-1 3H5l-1-3Zm3-6h10"
            />
          </svg>
        </div>

        <h2 className="mt-5 text-lg font-bold text-slate-900">
          No vehicles found
        </h2>

        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
          No vehicles match the selected filters. Try
          changing your route or trip selection.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {vehicles.map((vehicle) => (
        <VehicleCard
          key={vehicle.id}
          vehicle={vehicle}
          onClick={onVehicleClick}
        />
      ))}
    </div>
  );
}