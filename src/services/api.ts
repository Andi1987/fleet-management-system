import type {
  MbtaApiResponse,
  MbtaIncludedResource,
  ResourceQueryParams,
  Route,
  Trip,
  Vehicle,
  VehicleQueryParams,
} from "../types/mbta";

const API_BASE_URL = "https://api-v3.mbta.com";

const RETRY_DELAYS = [1000, 2000, 4000];
const VEHICLE_TOTAL_CACHE_TTL = 60_000;

interface CachedTotal {
  total: number;
  expiresAt: number;
}

const vehicleTotalCache =
  new Map<string, CachedTotal>();

const vehicleTotalRequests =
  new Map<string, Promise<number>>();

function sleep(ms: number) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function getRetryDelay(
  response: Response,
  attempt: number,
) {
  const retryAfter =
    response.headers.get("Retry-After");

  if (retryAfter) {
    const seconds = Number(retryAfter);

    if (!Number.isNaN(seconds)) {
      return Math.max(
        seconds * 1000,
        1000,
      );
    }

    const retryDate =
      Date.parse(retryAfter);

    if (!Number.isNaN(retryDate)) {
      return Math.max(
        retryDate - Date.now(),
        1000,
      );
    }
  }

  return RETRY_DELAYS[attempt] ?? 4000;
}

async function fetchApi<T>(
  url: string,
): Promise<T> {
  for (
    let attempt = 0;
    attempt <= RETRY_DELAYS.length;
    attempt += 1
  ) {
    try {
      const response =
        await fetch(url);

      if (response.ok) {
        return response.json() as Promise<T>;
      }

      if (
        response.status === 429 &&
        attempt < RETRY_DELAYS.length
      ) {
        await sleep(
          getRetryDelay(
            response,
            attempt,
          ),
        );

        continue;
      }

      throw new Error(
        `MBTA API request failed with status ${response.status}.`,
      );
    } catch (error) {
      if (
        error instanceof DOMException &&
        error.name === "AbortError"
      ) {
        throw error;
      }

      if (
        attempt < RETRY_DELAYS.length &&
        error instanceof TypeError
      ) {
        await sleep(
          getRetryDelay(
            new Response(null, {
              status: 503,
            }),
            attempt,
          ),
        );

        continue;
      }

      throw error;
    }
  }

  throw new Error(
    "MBTA API request failed.",
  );
}

function buildVehicleUrl(
  page: number,
  pageSize: number,
  filter?: {
    id?: string;
    label?: string;
    routes?: string[];
    trips?: string[];
  },
) {
  const searchParams =
    new URLSearchParams();

  searchParams.set(
    "page[limit]",
    String(pageSize),
  );

  searchParams.set(
    "page[offset]",
    String(
      (page - 1) * pageSize,
    ),
  );

  /*
   * Include Route dan Trip supaya
   * VehicleCard dapat menampilkan
   * nama Route dan tujuan Trip.
   */
  searchParams.set(
    "include",
    "route,trip",
  );

  if (filter?.id?.trim()) {
    searchParams.set(
      "filter[id]",
      filter.id.trim(),
    );
  }

  if (filter?.label?.trim()) {
    searchParams.set(
      "filter[label]",
      filter.label.trim(),
    );
  }

  if (
    filter?.routes &&
    filter.routes.length > 0
  ) {
    searchParams.set(
      "filter[route]",
      filter.routes.join(","),
    );
  }

  if (
    filter?.trips &&
    filter.trips.length > 0
  ) {
    searchParams.set(
      "filter[trip]",
      filter.trips.join(","),
    );
  }

  return `${API_BASE_URL}/vehicles?${searchParams.toString()}`;
}

function getIncludedResource(
  included: MbtaIncludedResource[],
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

function normalizeRoute(
  resource:
    | MbtaIncludedResource
    | undefined,
): Route | undefined {
  if (
    !resource ||
    resource.type !== "route"
  ) {
    return undefined;
  }

  const attributes =
    resource.attributes;

  return {
    id: resource.id,
    type: "route",
    attributes: {
      color:
        readString(
          attributes,
          "color",
        ),

      description:
        readString(
          attributes,
          "description",
        ),

      direction_names:
        readStringArray(
          attributes,
          "direction_names",
        ),

      direction_destinations:
        readStringArray(
          attributes,
          "direction_destinations",
        ),

      long_name:
        readString(
          attributes,
          "long_name",
        ),

      short_name:
        readString(
          attributes,
          "short_name",
        ),

      sort_order:
        readNumber(
          attributes,
          "sort_order",
        ),

      text_color:
        readString(
          attributes,
          "text_color",
        ),

      type:
        readNumber(
          attributes,
          "type",
        ),
    },
  };
}

function normalizeTrip(
  resource:
    | MbtaIncludedResource
    | undefined,
): Trip | undefined {
  if (
    !resource ||
    resource.type !== "trip"
  ) {
    return undefined;
  }

  const attributes =
    resource.attributes;

  return {
    id: resource.id,
    type: "trip",
    attributes: {
      bikes_allowed:
        readNumber(
          attributes,
          "bikes_allowed",
        ),

      direction_id:
        readNumber(
          attributes,
          "direction_id",
        ),

      headsign:
        readString(
          attributes,
          "headsign",
        ),

      name:
        readString(
          attributes,
          "name",
        ),

      wheelchair_accessible:
        readNumber(
          attributes,
          "wheelchair_accessible",
        ),
    },

    /*
     * VehicleCard tidak membutuhkan
     * relationship Trip lainnya.
     *
     * Tetap disediakan dengan struktur
     * yang kompatibel dengan type Trip.
     */
    relationships: {
      route: {
        data: null,
      },

      service: {
        data: null,
      },
    },
  };
}

function enrichVehicles(
  response: MbtaApiResponse<Vehicle>,
): MbtaApiResponse<Vehicle> {
  const included =
    response.included ?? [];

  const enrichedVehicles =
    response.data.map(
      (vehicle) => {
        const routeId =
          vehicle.relationships.route
            .data?.id ?? null;

        const tripId =
          vehicle.relationships.trip
            .data?.id ?? null;

        const route =
          normalizeRoute(
            getIncludedResource(
              included,
              "route",
              routeId,
            ),
          );

        const trip =
          normalizeTrip(
            getIncludedResource(
              included,
              "trip",
              tripId,
            ),
          );

        return {
          ...vehicle,
          ...(route
            ? { route }
            : {}),
          ...(trip
            ? { trip }
            : {}),
        };
      },
    );

  return {
    ...response,
    data: enrichedVehicles,
  };
}

function mergeVehicles(
  responses:
    MbtaApiResponse<Vehicle>[],
): MbtaApiResponse<Vehicle> {
  const vehicles =
    new Map<string, Vehicle>();

  const includedMap =
    new Map<
      string,
      MbtaIncludedResource
    >();

  let firstLinks:
    MbtaApiResponse<Vehicle>["links"];

  for (const response of responses) {
    if (!firstLinks && response.links) {
      firstLinks =
        response.links;
    }

    for (
      const resource of
        response.included ?? []
    ) {
      includedMap.set(
        `${resource.type}:${resource.id}`,
        resource,
      );
    }

    for (const vehicle of response.data) {
      vehicles.set(
        vehicle.id,
        vehicle,
      );
    }
  }

  const included =
    Array.from(
      includedMap.values(),
    );

  return enrichVehicles({
    data: Array.from(
      vehicles.values(),
    ),
    included,
    links: firstLinks,
  });
}

export async function getVehicles(
  params: VehicleQueryParams = {},
): Promise<MbtaApiResponse<Vehicle>> {
  const {
    page = 1,
    pageSize = 5,
    routes = [],
    trips = [],
    vehicleId = "",
  } = params;

  const searchTerm =
    vehicleId.trim();

  /*
   * "Cari Label / ID Armada"
   *
   * MBTA mempunyai dua identifier:
   *
   * label:
   *   1981
   *
   * resource id:
   *   y1981
   *
   * Karena input search harus mendukung
   * keduanya, lakukan kedua filter
   * ketika user memasukkan keyword.
   */
  if (searchTerm) {
    const [
      labelResponse,
      idResponse,
    ] = await Promise.all([
      fetchApi<
        MbtaApiResponse<Vehicle>
      >(
        buildVehicleUrl(
          page,
          pageSize,
          {
            label: searchTerm,
            routes,
            trips,
          },
        ),
      ),

      fetchApi<
        MbtaApiResponse<Vehicle>
      >(
        buildVehicleUrl(
          page,
          pageSize,
          {
            id: searchTerm,
            routes,
            trips,
          },
        ),
      ),
    ]);

    return mergeVehicles([
      labelResponse,
      idResponse,
    ]);
  }

  /*
   * Normal vehicle listing
   * tanpa search.
   */
  const response =
    await fetchApi<
      MbtaApiResponse<Vehicle>
    >(
      buildVehicleUrl(
        page,
        pageSize,
        {
          routes,
          trips,
        },
      ),
    );

  return enrichVehicles(
    response,
  );
}

function createVehicleTotalCacheKey(
  params: VehicleQueryParams = {},
) {
  const routes = [
    ...(params.routes ?? []),
  ].sort();

  const trips = [
    ...(params.trips ?? []),
  ].sort();

  const vehicleId =
    params.vehicleId?.trim() ??
    "";

  return JSON.stringify({
    routes,
    trips,
    vehicleId,
  });
}

export async function getVehicleTotal(
  response: MbtaApiResponse<Vehicle>,
  params: VehicleQueryParams = {},
): Promise<number> {
  const cacheKey =
    createVehicleTotalCacheKey(
      params,
    );

  const cached =
    vehicleTotalCache.get(
      cacheKey,
    );

  if (
    cached &&
    cached.expiresAt >
      Date.now()
  ) {
    return cached.total;
  }

  const existingRequest =
    vehicleTotalRequests.get(
      cacheKey,
    );

  if (existingRequest) {
    return existingRequest;
  }

  /*
   * Search Label / ID menggunakan
   * dua endpoint filter dan response
   * hasil merge tidak memiliki links.last.
   *
   * Untuk exact label / ID search,
   * jumlah hasil dari response sudah
   * merupakan total hasil pencarian.
   */
  if (!response.links?.last) {
    const total =
      response.data.length;

    vehicleTotalCache.set(
      cacheKey,
      {
        total,
        expiresAt:
          Date.now() +
          VEHICLE_TOTAL_CACHE_TTL,
      },
    );

    return total;
  }

  const request =
    (async () => {
      const lastUrl =
        new URL(
          response.links!.last!,
        );

      const lastOffset =
        Number(
          lastUrl.searchParams.get(
            "page[offset]",
          ) ?? "0",
        );

      const lastPage =
        await fetchApi<
          MbtaApiResponse<Vehicle>
        >(
          response.links!.last!,
        );

      const total =
        lastOffset +
        lastPage.data.length;

      vehicleTotalCache.set(
        cacheKey,
        {
          total,
          expiresAt:
            Date.now() +
            VEHICLE_TOTAL_CACHE_TTL,
        },
      );

      return total;
    })();

  vehicleTotalRequests.set(
    cacheKey,
    request,
  );

  try {
    return await request;
  } finally {
    vehicleTotalRequests.delete(
      cacheKey,
    );
  }
}

export async function getRoutes(
  params: ResourceQueryParams = {},
): Promise<MbtaApiResponse<Route>> {
  const {
    pageSize = 20,
    offset = 0,
    search = "",
  } = params;

  const searchParams =
    new URLSearchParams();

  searchParams.set(
    "page[limit]",
    String(pageSize),
  );

  searchParams.set(
    "page[offset]",
    String(offset),
  );

  if (search.trim()) {
    searchParams.set(
      "filter[name]",
      search.trim(),
    );
  }

  return fetchApi<
    MbtaApiResponse<Route>
  >(
    `${API_BASE_URL}/routes?${searchParams.toString()}`,
  );
}

export async function getTrips(
  params: ResourceQueryParams = {},
): Promise<MbtaApiResponse<Trip>> {
  const {
    pageSize = 20,
    offset = 0,
    search = "",
    routes = [],
  } = params;

  const searchParams =
    new URLSearchParams();

  searchParams.set(
    "page[limit]",
    String(pageSize),
  );

  searchParams.set(
    "page[offset]",
    String(offset),
  );

  if (routes.length > 0) {
    searchParams.set(
      "filter[route]",
      routes.join(","),
    );
  }

  if (search.trim()) {
    searchParams.set(
      "filter[name]",
      search.trim(),
    );
  }

  return fetchApi<
    MbtaApiResponse<Trip>
  >(
    `${API_BASE_URL}/trips?${searchParams.toString()}`,
  );
}