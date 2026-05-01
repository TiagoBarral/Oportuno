export interface LatLng {
  lat: number;
  lng: number;
}

/**
 * Coordinate lookup for Portuguese cities and municipalities.
 * Used by placesService.ts to bias Google Places Text Search results.
 *
 * When adding a new entry here, also add a matching display name to CITY_NAMES below.
 */
export const PORTUGUESE_CITIES: Record<string, LatLng> = {
  // Major cities
  lisboa:              { lat: 38.7169, lng: -9.1399 },
  porto:               { lat: 41.1579, lng: -8.6291 },
  braga:               { lat: 41.5454, lng: -8.4265 },
  coimbra:             { lat: 40.2033, lng: -8.4103 },
  aveiro:              { lat: 40.6405, lng: -8.6538 },
  faro:                { lat: 37.0193, lng: -7.9304 },
  setubal:             { lat: 38.5244, lng: -8.8882 },
  guimaraes:           { lat: 41.4425, lng: -8.2975 },
  viseu:               { lat: 40.6566, lng: -7.9122 },
  leiria:              { lat: 39.7436, lng: -8.8071 },
  // Greater Lisbon municipalities
  oeiras:              { lat: 38.6979, lng: -9.3169 },
  cascais:             { lat: 38.6967, lng: -9.4231 },
  sintra:              { lat: 38.7978, lng: -9.3917 },
  almada:              { lat: 38.6796, lng: -9.1648 },
  amadora:             { lat: 38.7596, lng: -9.2269 },
  loures:              { lat: 38.8307, lng: -9.1697 },
  odivelas:            { lat: 38.7935, lng: -9.1840 },
  barreiro:            { lat: 38.6630, lng: -9.0723 },
  montijo:             { lat: 38.7066, lng: -8.9740 },
  // Greater Porto municipalities
  matosinhos:          { lat: 41.1833, lng: -8.6961 },
  "vila nova de gaia": { lat: 41.1337, lng: -8.6127 },
  gondomar:            { lat: 41.1417, lng: -8.5337 },
  maia:                { lat: 41.2289, lng: -8.6176 },
  valongo:             { lat: 41.1893, lng: -8.4980 },
  // Other municipalities
  evora:               { lat: 38.5714, lng: -7.9092 },
  santarem:            { lat: 39.2374, lng: -8.6888 },
  portimao:            { lat: 37.1381, lng: -8.5378 },
  funchal:             { lat: 32.6498, lng: -16.9078 },
  "viana do castelo":  { lat: 41.6934, lng: -8.8330 },
  barcelos:            { lat: 41.5343, lng: -8.6108 },
};

/**
 * Normalise a city name to the lookup key: lower-case, strip accents/diacritics.
 * e.g. "Setubal" -> "setubal", "Guimaraes" -> "guimaraes"
 */
export function normaliseCityKey(city: string): string {
  return city
    .toLowerCase()
    .normalize("NFD")
    .replace(new RegExp("[\\u0300-\\u036f]", "g"), "");
}

/**
 * Display names for all cities in PORTUGUESE_CITIES, used for autocomplete.
 * Must stay in sync with the map above -- one entry per key, in matching order.
 */
export const CITY_NAMES: string[] = [
  // Major cities
  "Lisboa",
  "Porto",
  "Braga",
  "Coimbra",
  "Aveiro",
  "Faro",
  "Setúbal",
  "Guimarães",
  "Viseu",
  "Leiria",
  // Greater Lisbon municipalities
  "Oeiras",
  "Cascais",
  "Sintra",
  "Almada",
  "Amadora",
  "Loures",
  "Odivelas",
  "Barreiro",
  "Montijo",
  // Greater Porto municipalities
  "Matosinhos",
  "Vila Nova de Gaia",
  "Gondomar",
  "Maia",
  "Valongo",
  // Other municipalities
  "Évora",
  "Santarém",
  "Portimão",
  "Funchal",
  "Viana do Castelo",
  "Barcelos",
];

// Built once at module load: normalised key → canonical display name
const CITY_KEY_TO_DISPLAY: Record<string, string> = {};
for (const name of CITY_NAMES) {
  CITY_KEY_TO_DISPLAY[normaliseCityKey(name)] = name;
}

/**
 * Map a raw municipality string from Google Places to a canonical display
 * value from CITY_NAMES. Returns null and logs a warning if unmatched.
 */
export function canonicaliseMunicipality(raw: string): string | null {
  const key = normaliseCityKey(raw);
  const canonical = CITY_KEY_TO_DISPLAY[key] ?? null;
  if (canonical === null) {
    console.warn(`[cities] unmatched municipality: "${raw}" (key: "${key}")`);
  }
  return canonical;
}
