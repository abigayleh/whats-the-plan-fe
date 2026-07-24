import { apiFetch } from './client';

// Backend-proxied geocoding (Nominatim has no browser CORS). Returns [{ label, lat, lng }].
export const search = (q) => apiFetch(`/api/geocode?q=${encodeURIComponent(q)}`);