import { useEffect, useRef, useState } from 'react';
import { CloseIcon } from '../layout/icons';

// Free OpenStreetMap geocoding — no key. Debounced + min length to respect its ~1 req/s policy.
const NOMINATIM = 'https://nominatim.openstreetmap.org/search';

// A place picker backed by Nominatim. `value` is { label, lat, lng } | null.
function LocationSearch({ value, onChange }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const timer = useRef();

  useEffect(() => {
    if (query.trim().length < 3) {
      setResults([]);
      setLoading(false);
      return undefined;
    }
    setLoading(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      try {
        const res = await fetch(`${NOMINATIM}?format=jsonv2&limit=5&q=${encodeURIComponent(query.trim())}`);
        const rows = await res.json();
        setResults(rows.map((r) => ({ label: r.display_name, lat: parseFloat(r.lat), lng: parseFloat(r.lon) })));
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 400);
    return () => clearTimeout(timer.current);
  }, [query]);

  function pick(loc) {
    onChange(loc);
    setQuery('');
    setResults([]);
    setOpen(false);
  }

  if (value) {
    return (
      <div className="location-search">
        <div className="location-search__chip">
          <span className="location-search__chip-label" title={value.label}>{value.label}</span>
          <button
            type="button"
            className="location-search__clear"
            onClick={() => onChange(null)}
            aria-label="Remove location"
          >
            <CloseIcon width={13} height={13} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="location-search">
      <input
        type="text"
        className="modal__input"
        value={query}
        placeholder="Search for a place…"
        onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
      />
      {open && query.trim().length >= 3 && (
        <ul className="location-search__results">
          {loading && <li className="location-search__empty">Searching…</li>}
          {!loading && results.length === 0 && <li className="location-search__empty">No matches</li>}
          {results.map((r) => (
            <li key={`${r.lat},${r.lng}`}>
              <button type="button" className="location-search__result" onClick={() => pick(r)}>
                {r.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default LocationSearch;