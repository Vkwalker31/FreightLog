import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';

const defaultIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const truckIcon = new L.DivIcon({
  className: 'map-marker map-marker--truck',
  html: '<div class="map-marker__pin map-marker__pin--truck">🚛</div>',
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

function FitBounds({ points }) {
  const map = useMap();

  useEffect(() => {
    if (!points.length) return;
    if (points.length === 1) {
      map.setView([points[0].lat, points[0].lng], 8);
      return;
    }
    const bounds = L.latLngBounds(points.map((p) => [p.lat, p.lng]));
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 10 });
  }, [map, points]);

  return null;
}

const MapView = ({ points = [], height = 300, showRoute = true, highlightIndex = null }) => {
  if (!points.length) return null;

  const routeCoords = points.map((p) => [p.lat, p.lng]);
  const mapKey = points.map((p) => `${p.lat}-${p.lng}-${p.label || ''}`).join('|');

  return (
    <div className="map-container" style={{ height }}>
      <MapContainer
        key={mapKey}
        center={[points[0].lat, points[0].lng]}
        zoom={7}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds points={points} />
        {points.map((p, i) => (
          <Marker
            key={`${p.lat}-${p.lng}-${p.label || i}`}
            position={[p.lat, p.lng]}
            icon={highlightIndex === i ? truckIcon : defaultIcon}
          >
            {p.label && <Popup>{p.label}</Popup>}
          </Marker>
        ))}
        {showRoute && routeCoords.length > 1 && (
          <Polyline positions={routeCoords} color="var(--color-primary)" weight={4} />
        )}
      </MapContainer>
    </div>
  );
};

export default MapView;
