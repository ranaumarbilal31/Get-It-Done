import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { MapPin } from 'lucide-react';

// Custom modern SVG marker icon for Leaflet
const customPinIcon = new L.DivIcon({
  className: 'custom-map-pin',
  html: `
    <div style="
      background-color: #0d9488;
      width: 32px;
      height: 32px;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 10px rgba(0,0,0,0.3);
      border: 2px solid white;
    ">
      <div style="
        width: 10px;
        height: 10px;
        background-color: white;
        border-radius: 50%;
        transform: rotate(45deg);
      "></div>
    </div>
  `,
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

function LocationMarker({ position, setPosition, onLocationSelect }) {
  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      setPosition([lat, lng]);
      if (onLocationSelect) {
        onLocationSelect(lat, lng);
      }
    },
  });

  return position ? <Marker position={position} icon={customPinIcon} /> : null;
}

export default function MapPicker({ initialLat, initialLng, onLocationSelect }) {
  const defaultCenter = [initialLat || 40.7128, initialLng || -74.0060]; // Default New York / customizable
  const [position, setPosition] = useState(
    initialLat && initialLng ? [initialLat, initialLng] : defaultCenter
  );

  return (
    <div className="relative w-full h-64 rounded-2xl overflow-hidden border border-slate-200 shadow-inner">
      <MapContainer
        center={position || defaultCenter}
        zoom={13}
        scrollWheelZoom={false}
        className="w-full h-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <LocationMarker
          position={position}
          setPosition={setPosition}
          onLocationSelect={onLocationSelect}
        />
      </MapContainer>
      <div className="absolute top-2 left-2 z-[400] bg-white/95 backdrop-blur px-3 py-1.5 rounded-xl shadow-md border border-slate-200 text-xs font-semibold text-slate-700 flex items-center gap-1.5 pointer-events-none">
        <MapPin className="w-3.5 h-3.5 text-brand-600" />
        Click anywhere on the map to place task location pin
      </div>
    </div>
  );
}
