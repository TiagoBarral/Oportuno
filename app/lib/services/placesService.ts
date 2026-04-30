import { PORTUGUESE_CITIES, normaliseCityKey, canonicaliseMunicipality } from "../cities";

export interface PlaceBasic {
  placeId: string;
  name: string;
  address: string;
}

export interface PlaceDetail extends PlaceBasic {
  website: string | null;
  phone: string | null;
  municipality: string | null;
  rawMunicipality: string | null;
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
  next_page_token?: string;
}

interface AddressComponent {
  long_name: string;
  short_name: string;
  types: string[];
}

interface PlaceDetailsResult {
  place_id: string;
  name: string;
  formatted_address: string;
  website?: string;
  formatted_phone_number?: string;
  address_components?: AddressComponent[];
}

interface PlaceDetailsResponse {
  status: string;
  result: PlaceDetailsResult;
  error_message?: string;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Search for businesses matching `industry` in `location` (a Portuguese city).
 *
 * Calls the Google Places Text Search (legacy REST) endpoint and fetches up to
 * 3 pages of results. Duplicate place IDs are deduplicated (first-page entry
 * wins). Continuation pages omit location/radius as required by the API.
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

  // --- Page 1 ---
  const page1Params = new URLSearchParams({
    query,
    key: apiKey,
    region: "pt",
    language: "pt",
  });

  if (cityCoords !== undefined) {
    page1Params.set("location", `${cityCoords.lat},${cityCoords.lng}`);
    page1Params.set("radius", String(radiusMeters));
  }

  const page1Url = `https://maps.googleapis.com/maps/api/place/textsearch/json?${page1Params.toString()}`;
  const page1Response = await fetch(page1Url);

  if (!page1Response.ok) {
    throw new Error(
      `Google Places Text Search request failed with HTTP ${page1Response.status}`
    );
  }

  const page1Data = (await page1Response.json()) as TextSearchResponse;

  if (page1Data.status === "ZERO_RESULTS") {
    return [];
  }

  if (page1Data.status !== "OK") {
    const detail = page1Data.error_message ?? page1Data.status;
    throw new Error(`Google Places Text Search error: ${detail}`);
  }

  // Accumulate results into a Map keyed on placeId for deduplication.
  const seen = new Map<string, PlaceBasic>();

  for (const result of page1Data.results) {
    if (!seen.has(result.place_id)) {
      seen.set(result.place_id, {
        placeId: result.place_id,
        name: result.name,
        address: result.formatted_address,
      });
    }
  }

  // --- Pages 2 and 3 (continuation) ---
  let pageToken: string | undefined = page1Data.next_page_token;

  for (let page = 2; page <= 3 && pageToken !== undefined; page++) {
    // Google requires a short delay before a next_page_token becomes valid.
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const contParams = new URLSearchParams({
      query,
      key: apiKey,
      region: "pt",
      language: "pt",
      pagetoken: pageToken,
    });

    const contUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?${contParams.toString()}`;
    const contResponse = await fetch(contUrl);

    if (!contResponse.ok) {
      // Non-OK HTTP on a continuation page: stop, return what we have.
      break;
    }

    const contData = (await contResponse.json()) as TextSearchResponse;

    if (
      contData.status === "ZERO_RESULTS" ||
      contData.status === "INVALID_REQUEST"
    ) {
      break;
    }

    if (contData.status !== "OK") {
      break;
    }

    for (const result of contData.results) {
      if (!seen.has(result.place_id)) {
        seen.set(result.place_id, {
          placeId: result.place_id,
          name: result.name,
          address: result.formatted_address,
        });
      }
    }

    pageToken = contData.next_page_token;
  }

  return Array.from(seen.values());
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
    fields: "place_id,name,formatted_address,website,formatted_phone_number,address_components",
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

  const rawMunicipality =
    r.address_components?.find((c) =>
      c.types.includes("administrative_area_level_2"),
    )?.long_name ?? null;

  const municipality =
    rawMunicipality !== null ? canonicaliseMunicipality(rawMunicipality) : null;

  return {
    placeId: r.place_id,
    name: r.name,
    address: r.formatted_address,
    website: r.website ?? null,
    phone: r.formatted_phone_number ?? null,
    municipality,
    rawMunicipality,
  };
}
