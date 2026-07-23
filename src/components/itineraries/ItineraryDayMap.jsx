import { useEffect, useMemo } from 'react';
import {
  MapContainer, TileLayer, Marker, Tooltip, useMap,
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Numbered pins for scheduled stops; open (dashed, un-numbered) pins for same-day untimed ones.
function pinIcon(order) {
  const inner = order == null
    ? '<div class="itin-pin itin-pin--open"></div>'
    : `<div class="itin-pin"><span>${order}</span></div>`;
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

// The itinerary day map: one pin per located to-do for the focus day. Routing is added in Phase 5.
function ItineraryDayMap({ pins }) {
  const points = useMemo(() => pins.map((p) => [p.lat, p.lng]), [pins]);

  if (pins.length === 0) {
    return (
      <div className="itinerary-map itinerary-map--empty">
        <p>Add a location to this day&apos;s to-dos to see them on the map.</p>
      </div>
    );
  }

  return (
    <div className="itinerary-map">
      <MapContainer center={points[0]} zoom={13} className="itinerary-map__canvas" scrollWheelZoom>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {pins.map((p) => (
          <Marker key={p.id} position={[p.lat, p.lng]} icon={pinIcon(p.order)}>
            <Tooltip>{p.order == null ? p.title : `${p.order}. ${p.title}`}</Tooltip>
          </Marker>
        ))}
        <FitBounds points={points} />
      </MapContainer>
    </div>
  );
}

export default ItineraryDayMap;