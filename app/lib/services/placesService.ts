export interface PlaceBasic {
  placeId: string;
  name: string;
  address: string;
}

export interface PlaceDetail extends PlaceBasic {
  website: string | null;
  phone: string | null;
}

// ---------------------------------------------------------------------------
// Internal types for Google Places API responses
// ---------------------------------------------------------------------------

interface TextSearchResult {
  place_id: string;
  name: string;
  formatted_address: string;
}

interface TextSearchResponse {
  status: string;
  results: TextSearchResult[];
  error_message?: string;
}

interface PlaceDetailsResult {
  place_id: string;
  name: string;
  formatted_address: string;
  website?: string;
  formatted_phone_number?: string;
}

interface PlaceDetailsResponse {
  status: string;
  result: PlaceDetailsResult;
  error_message?: string;
}

// ---------------------------------------------------------------------------
// Portuguese city → lat/lng lookup table
// ---------------------------------------------------------------------------

interface LatLng {
  lat: number;
  lng: number;
}

const PORTUGUESE_CITIES: Record<string, LatLng> = {
  lisboa: { lat: 38.7169, lng: -9.1399 },
  porto: { lat: 41.1579, lng: -8.6291 },
  braga: { lat: 41.5454, lng: -8.4265 },
  coimbra: { lat: 40.2033, lng: -8.4103 },
  aveiro: { lat: 40.6405, lng: -8.6538 },
  faro: { lat: 37.0193, lng: -7.9304 },
  setubal: { lat: 38.5244, lng: -8.8882 },
  guimaraes: { lat: 41.4425, lng: -8.2975 },
  viseu: { lat: 40.6566, lng: -7.9122 },
  leiria: { lat: 39.7436, lng: -8.8071 },
};

/**
 * Normalise a city name to the lookup key: lower-case, strip accents/diacritics.
 * e.g. "Setúbal" → "setubal", "Guimarães" → "guimaraes"
 */
function normaliseCityKey(city: string): string {
  return city
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Search for businesses matching `industry` in `location` (a Portuguese city).
 *
 * Calls the Google Places Text Search (legacy REST) endpoint and returns at
 * most 20 results from the first page. Pagination is intentionally omitted.
 */
export async function searchPlaces(
  industry: string,
  location: string,
  radiusMeters: number
): Promise<PlaceBasic[]> {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    throw new Error("GOOGLE_API_KEY environment variable is not set");
  }

  const query = `${industry} em ${location} Portugal`;
  const cityKey = normaliseCityKey(location);
  const cityCoords = PORTUGUESE_CITIES[cityKey];

  const params = new URLSearchParams({
    query,
    key: apiKey,
  });

  if (cityCoords !== undefined) {
    params.set("location", `${cityCoords.lat},${cityCoords.lng}`);
    params.set("radius", String(radiusMeters));
  }

  const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?${params.toString()}`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(
      `Google Places Text Search request failed with HTTP ${response.status}`
    );
  }

  const data = (await response.json()) as TextSearchResponse;

  if (data.status === "ZERO_RESULTS") {
    return [];
  }

  if (data.status !== "OK") {
    const detail = data.error_message ?? data.status;
    throw new Error(`Google Places Text Search error: ${detail}`);
  }

  return data.results.slice(0, 20).map((result) => ({
    placeId: result.place_id,
    name: result.name,
    address: result.formatted_address,
  }));
}

/**
 * Fetch detailed information for a single place by its Place ID.
 *
 * Calls the Google Places Details (legacy REST) endpoint requesting only the
 * fields needed to populate a `PlaceDetail`.
 */
export async function getPlaceDetail(placeId: string): Promise<PlaceDetail> {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    throw new Error("GOOGLE_API_KEY environment variable is not set");
  }

  const params = new URLSearchParams({
    place_id: placeId,
    fields: "place_id,name,formatted_address,website,formatted_phone_number",
    key: apiKey,
  });

  const url = `https://maps.googleapis.com/maps/api/place/details/json?${params.toString()}`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(
      `Google Places Details request failed with HTTP ${response.status}`
    );
  }

  const data = (await response.json()) as PlaceDetailsResponse;

  if (data.status !== "OK") {
    const detail = data.error_message ?? data.status;
    throw new Error(`Google Places Details error: ${detail}`);
  }

  const r = data.result;

  return {
    placeId: r.place_id,
    name: r.name,
    address: r.formatted_address,
    website: r.website ?? null,
    phone: r.formatted_phone_number ?? null,
  };
}
