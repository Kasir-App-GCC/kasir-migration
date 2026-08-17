import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Circle, useMap, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import MapSearchBar from "@/components/MapSearchBar";

const pinIcon = L.divIcon({
  className: "souqna-pin",
  html: '<div style="font-size:30px;line-height:1;transform:translateY(-2px)">📍</div>',
  iconSize: [32, 32],
  iconAnchor: [16, 30],
});

function MapReady() {
  const map = useMap();
  useEffect(() => {
    const t = setTimeout(() => map.invalidateSize(), 250);
    return () => clearTimeout(t);
  }, [map]);
  return null;
}

function Clicker({ onPick }) {
  useMapEvents({ click: (e) => onPick(e.latlng) });
  return null;
}

function FlyTo({ target }) {
  const map = useMap();
  useEffect(() => {
    if (target) map.flyTo([target.lat, target.lng], 14, { duration: 0.8 });
  }, [target]);
  return null;
}

export default function MapPinPicker({ center, radius, onPick }) {
  const [pos, setPos] = useState(center);
  const [flyTarget, setFlyTarget] = useState(null);

  const handle = (p) => {
    setPos(p);
    onPick(p);
  };

  const handleSearch = (r) => {
    const p = { lat: r.lat, lng: r.lng };
    setPos(p);
    setFlyTarget(r);
    onPick(p);
  };

  return (
    <div>
      <div className="mb-2">
        <MapSearchBar onSelect={handleSearch} />
      </div>
      <MapContainer
        center={center}
        zoom={11}
        scrollWheelZoom={false}
        style={{ height: 280, width: "100%", borderRadius: 16 }}
        className="relative z-0 overflow-hidden rounded-2xl"
      >
        <MapReady />
        <Clicker onPick={handle} />
        <FlyTo target={flyTarget} />
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap"
        />
        {pos && (
          <Marker
            position={pos}
            icon={pinIcon}
            draggable
            eventHandlers={{ dragend: (e) => handle(e.target.getLatLng()) }}
          />
        )}
        {pos && radius > 0 && (
          <Circle
            center={pos}
            radius={radius * 1000}
            pathOptions={{ color: "#0ea5e9", fillColor: "#0ea5e9", fillOpacity: 0.15, weight: 2 }}
          />
        )}
      </MapContainer>
    </div>
  );
}