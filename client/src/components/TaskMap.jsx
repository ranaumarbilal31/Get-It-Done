import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Link } from 'react-router-dom';
import { DollarSign, Clock, MapPin } from 'lucide-react';

const createPricePin = (price) => {
  return new L.DivIcon({
    className: 'custom-price-pin',
    html: `
      <div style="
        background: #0f172a;
        color: white;
        font-weight: 700;
        font-size: 11px;
        padding: 4px 8px;
        border-radius: 9999px;
        border: 2px solid #14b8a6;
        box-shadow: 0 4px 12px rgba(0,0,0,0.25);
        white-space: nowrap;
        display: flex;
        align-items: center;
        gap: 2px;
      ">
        <span>$${price}</span>
      </div>
    `,
    iconSize: [45, 24],
    iconAnchor: [22, 12],
    popupAnchor: [0, -14],
  });
};

export default function TaskMap({ tasks = [], center = [40.7128, -74.006] }) {
  const geoTasks = tasks.filter(
    (t) => !t.isRemote && Number.isFinite(t.latitude) && Number.isFinite(t.longitude),
  );

  return (
    <div className="w-full h-full min-h-[450px] rounded-3xl overflow-hidden shadow-sm border border-slate-200">
      <MapContainer
        center={center}
        zoom={12}
        scrollWheelZoom={true}
        className="w-full h-full min-h-[450px]"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {geoTasks.map((task) => (
          <Marker
            key={task.id}
            title={task.title}
            alt={task.title}
            position={[task.latitude, task.longitude]}
            icon={createPricePin(task.budget)}
          >
            <Popup className="custom-task-popup">
              <div className="p-1 max-w-xs font-sans">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-brand-50 text-brand-700">
                  {task.category?.name || 'Task'}
                </span>
                <h4 className="font-bold text-slate-900 text-sm mt-1 line-clamp-2">{task.title}</h4>
                <div className="flex items-center gap-1 text-slate-500 text-xs mt-1">
                  <MapPin className="w-3 h-3 text-brand-600" />
                  <span className="truncate">{task.location}</span>
                </div>
                <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-100">
                  <span className="text-base font-extrabold text-slate-900">${task.budget}</span>
                  <Link
                    to={`/tasks/${task.id}`}
                    className="text-xs bg-brand-600 hover:bg-brand-700 text-white font-semibold px-2.5 py-1 rounded-lg transition"
                  >
                    View Task
                  </Link>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
