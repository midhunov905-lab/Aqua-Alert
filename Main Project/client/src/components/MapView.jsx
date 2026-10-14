import { useEffect, useMemo } from 'react';
import { CircleMarker, MapContainer, Marker, Popup, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';

const INDIA_CENTER = [20.5937, 78.9629];
const typeColors = {
  Contamination: '#df5c4d',
  'Water Shortage': '#d99a24',
  'Infrastructure Damage': '#7b6bd6',
};

function ClickToSelect({ onSelect }) {
  useMapEvents({
    click(event) {
      onSelect?.({ latitude: Number(event.latlng.lat.toFixed(6)), longitude: Number(event.latlng.lng.toFixed(6)) });
    },
  });
  return null;
}

function KeepSelectedVisible({ position }) {
  const map = useMap();
  useEffect(() => {
    if (position) map.setView([position.latitude, position.longitude], Math.max(map.getZoom(), 12), { animate: false });
  }, [map, position?.latitude, position?.longitude]);
  return null;
}

function getDotIcon() {
  return L.divIcon({ className: 'map-picker-dot', html: '<span></span>', iconSize: [22, 22], iconAnchor: [11, 11] });
}

export default function MapView({ reports = [], selectedPosition = null, onSelect, height = '440px', zoom = 5 }) {
  const center = useMemo(() => selectedPosition ? [selectedPosition.latitude, selectedPosition.longitude] : INDIA_CENTER, [selectedPosition]);
  return (
    <div className="map-frame" style={{ height }}>
      <MapContainer center={center} zoom={selectedPosition ? 13 : zoom} scrollWheelZoom className="leaflet-map">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {onSelect && <ClickToSelect onSelect={onSelect} />}
        {selectedPosition && <KeepSelectedVisible position={selectedPosition} />}
        {reports.map((report) => (
          <CircleMarker
            key={report.id}
            center={[report.latitude, report.longitude]}
            radius={7}
            pathOptions={{ color: '#ffffff', weight: 2, fillColor: typeColors[report.issueType] || '#159c9b', fillOpacity: 0.94 }}
          >
            <Popup>
              <div className="map-popup">
                <strong>{report.title || report.issueType}</strong>
                <span>{report.locationText}</span>
                <span className="popup-status">{report.status}</span>
                {report.description && <p>{report.description.length > 150 ? `${report.description.slice(0, 150)}…` : report.description}</p>}
              </div>
            </Popup>
          </CircleMarker>
        ))}
        {selectedPosition && (
          <Marker position={[selectedPosition.latitude, selectedPosition.longitude]} icon={getDotIcon()}>
            <Popup>Selected report location</Popup>
          </Marker>
        )}
      </MapContainer>
      <div className="map-attribution-note">Map data © OpenStreetMap contributors</div>
    </div>
  );
}
