export interface MbtaApiResponse<T> {
  data: T[];

  included?: MbtaIncludedResource[];

  links?: {
    first?: string;
    last?: string;
    next?: string;
    prev?: string;
  };
}

export interface MbtaIncludedResource {
  id: string;
  type: string;
  attributes: Record<string, unknown>;
}

export interface VehicleAttributes {
  bearing: number | null;
  carriages: VehicleCarriage[];
  current_status: string | null;
  current_stop_sequence: number | null;
  direction_id: number | null;
  label: string | null;
  latitude: number | null;
  longitude: number | null;
  occupancy_status: string | null;
  revenue: string | null;
  speed: number | null;
  updated_at: string | null;
}

export interface VehicleCarriage {
  label: string | null;
  occupancy_percentage: number | null;
  occupancy_status: string | null;
}

export interface MbtaRelationshipReference {
  data: {
    id: string;
    type: string;
  } | null;
}

export interface VehicleRelationships {
  route: MbtaRelationshipReference;
  stop: MbtaRelationshipReference;
  trip: MbtaRelationshipReference;
}

export interface VehicleLinks {
  self: string;
}

export interface Vehicle {
  id: string;
  type: "vehicle";
  attributes: VehicleAttributes;
  relationships: VehicleRelationships;
  links: VehicleLinks;

  /*
   * Included resources dari:
   *
   * /vehicles?include=route,trip
   *
   * Digunakan untuk menampilkan nama Route
   * dan tujuan Trip pada VehicleCard.
   */
  route?: Route;
  trip?: Trip;
}

export interface VehicleQueryParams {
  page?: number;
  pageSize?: number;
  routes?: string[];
  trips?: string[];
  vehicleId?: string;
}

export interface RouteAttributes {
  color: string | null;
  description: string | null;
  direction_names: string[];
  direction_destinations: string[];
  long_name: string | null;
  short_name: string | null;
  sort_order: number | null;
  text_color: string | null;
  type: number | null;
}

export interface Route {
  id: string;
  type: "route";
  attributes: RouteAttributes;
}

export interface TripAttributes {
  bikes_allowed: number | null;
  direction_id: number | null;
  headsign: string | null;
  name: string | null;
  wheelchair_accessible: number | null;
}

export interface Trip {
  id: string;
  type: "trip";
  attributes: TripAttributes;
  relationships: {
    route: MbtaRelationshipReference;
    service: MbtaRelationshipReference;
  };
}

export interface ResourceQueryParams {
  pageSize?: number;
  offset?: number;
  search?: string;
  routes?: string[];
}