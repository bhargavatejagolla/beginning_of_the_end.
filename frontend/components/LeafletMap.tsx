"use client";
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin } from "lucide-react";

export default function LeafletMap({ points }: { points: any[] }) {
  // Center roughly on India
  const center: [number, number] = [22.5937, 80.9629];
  
  return (
    <MapContainer 
      center={center} 
      zoom={4.5} 
      style={{ height: '100%', width: '100%', background: '#09090b', borderRadius: '1rem' }}
      zoomControl={false}
      scrollWheelZoom={true}
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; CARTO'
      />
      {points.map((point) => {
        const isCritical = point.risk_score >= 90;
        const color = isCritical ? "#ef4444" : point.risk_score >= 70 ? "#f97316" : "#eab308";
        
        return (
          <CircleMarker
            key={point.account_id}
            center={[point.latitude, point.longitude]}
            radius={isCritical ? 10 : 6}
            pathOptions={{
              color: color,
              fillColor: color,
              fillOpacity: 0.6,
              weight: 2
            }}
          >
            <Popup>
              <div className="w-48">
                 <div className="flex justify-between items-center border-b border-gray-200 pb-1.5 mb-2">
                   <div className="flex items-center space-x-1.5">
                     <MapPin className="w-4 h-4 text-red-500" />
                     <span className="font-bold text-gray-800 text-sm">{point.location}</span>
                   </div>
                 </div>
                 <div className="flex justify-between items-center font-mono text-xs">
                   <span className="text-gray-600">Risk Score:</span>
                   <span className="font-black text-red-600">{point.risk_score}%</span>
                 </div>
                 <div className="text-[10px] text-gray-500 italic mt-2 font-mono">
                   ACT-{point.account_id} | {point.type}
                 </div>
              </div>
            </Popup>
          </CircleMarker>
        );
      })}
    </MapContainer>
  );
}
