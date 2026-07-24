import {
  useEffect, useMemo, useState,
} from 'react';
import {
  MapContainer, TileLayer, Marker, Tooltip, Polyline, useMap,
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import RouteProfileToggle from './RouteProfileToggle';

const ROUTE_COLOR = '#c56a4a';
// FOSSGIS runs a keyless OSRM instance per profile (what the OSM site uses); the demo server
// is car-only, so walk vs drive would be identical there.
const ROUTER = { foot: 'routed-foot', driving: 'routed-car' };

// A route leg duration (seconds) → a short "24 min" / "1 hr 5 min" label.
function formatDuration(seconds) {
  const mins = Math.round(seconds / 60);
  if (mins < 1) return '<1 min';
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h} hr ${m} min` : `${h} hr`;
}

function pinIcon(order, active) {
  const cls = `itin-pin${order == null ? ' itin-pin--open' : ''}${active ? ' itin-pin--active' : ''}`;
  const inner = order == null ? `<div class="${cls}"></div>` : `<div class="${cls}"><span>${order}</span></div>`;
  return L.divIcon({
    className: 'itin-pin-wrap', html: inner, iconSize: [28, 28], iconAnchor: [14, 14],
  });
}

// Frames the viewport on the day's pins, and revalidates size (the map mounts inside a
// tab, so its container may have been hidden/resized — otherwise tiles render grey).
function FitBounds({ points }) {
  const map = useMap();
  useEffect(() => {
    map.invalidateSize();
    if (points.length === 0) return;
    if (points.length === 1) { map.setView(points[0], 14); return; }
    map.fitBounds(points, { padding: [42, 42] });
  }, [map, points]);
  return null;
}

// The itinerary day map: a pin per located to-do, the numbered stops joined by a real
// walking/driving route, and hover linking between the stops list and the pins.
function ItineraryDayMap({ pins }) {
  const points = useMemo(() => pins.map((p) => [p.lat, p.lng]), [pins]);
  const [hovered, setHovered] = useState(null);
  const [profile, setProfile] = useState('foot');
  const [route, setRoute] = useState(null); // { coords: [[lat,lng]…], fallback, legs: [sec…] } | null

  // Numbered (scheduled) stops in order, as a "lng,lat;…" string for the OSRM request.
  const coordStr = useMemo(
    () => pins.filter((p) => p.order != null).sort((a, b) => a.order - b.order)
      .map((p) => `${p.lng},${p.lat}`).join(';'),
    [pins],
  );
  const hasRoute = coordStr.includes(';');

  useEffect(() => {
    const coords = coordStr ? coordStr.split(';').map((c) => c.split(',').map(Number)) : [];
    if (coords.length < 2) { setRoute(null); return undefined; }
    const straight = coords.map(([lng, lat]) => [lat, lng]);
    let active = true;
    (async () => {
      try {
        const url = `https://routing.openstreetmap.de/${ROUTER[profile]}/route/v1/driving/${coordStr}?overview=full&geometries=geojson`;
        const data = await (await fetch(url)).json();
        if (!active) return;
        if (data.code === 'Ok' && data.routes?.[0]?.geometry) {
          const r = data.routes[0];
          setRoute({
            coords: r.geometry.coordinates.map(([lng, lat]) => [lat, lng]),
            legs: (r.legs || []).map((l) => l.duration),
            fallback: false,
          });
        } else {
          setRoute({ coords: straight, legs: [], fallback: true });
        }
      } catch {
        // Routing failed/rate-limited — a straight dashed connector keeps the day readable.
        if (active) setRoute({ coords: straight, legs: [], fallback: true });
      }
    })();
    return () => { active = false; };
  }, [coordStr, profile]);

  if (pins.length === 0) {
    return (
      <div className="itinerary-map itinerary-map--empty">
        <p>Add a location to this day&apos;s to-dos to see them on the map.</p>
      </div>
    );
  }

  return (
    <div className="itinerary-map-wrap">
      <div className="itinerary-map">
        {hasRoute && <RouteProfileToggle profile={profile} onChange={setProfile} />}
        <MapContainer center={points[0]} zoom={13} className="itinerary-map__canvas" scrollWheelZoom>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {route && (
            <Polyline
              positions={route.coords}
              pathOptions={{
                color: ROUTE_COLOR, weight: 4, opacity: 0.85, dashArray: route.fallback ? '6 8' : null,
              }}
            />
          )}
          {pins.map((p) => (
            <Marker
              key={p.id}
              position={[p.lat, p.lng]}
              icon={pinIcon(p.order, hovered === p.id)}
              eventHandlers={{ mouseover: () => setHovered(p.id), mouseout: () => setHovered(null) }}
            >
              <Tooltip>{p.order == null ? p.title : `${p.order}. ${p.title}`}</Tooltip>
            </Marker>
          ))}
          <FitBounds points={points} />
        </MapContainer>
      </div>

      <ul className="itinerary-stops">
        {pins.map((p) => {
          // Time from the previous numbered stop to this one (the OSRM leg into it).
          const legSeconds = p.order >= 2 ? route?.legs?.[p.order - 2] : null;
          return (
            <li
              key={p.id}
              className={`itinerary-stops__item${hovered === p.id ? ' itinerary-stops__item--active' : ''}`}
              onMouseEnter={() => setHovered(p.id)}
              onMouseLeave={() => setHovered(null)}
            >
              <span className={`itinerary-stops__badge${p.order == null ? ' itinerary-stops__badge--open' : ''}`}>
                {p.order ?? ''}
              </span>
              <span className="itinerary-stops__label">{p.title}</span>
              {legSeconds != null && (
                <span className="itinerary-stops__time">{formatDuration(legSeconds)}</span>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default ItineraryDayMap;