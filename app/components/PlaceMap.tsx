"use client";

import React, { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix for default Leaflet icons
const customIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41]
});

export default function PlaceMap({ 
  latitude, 
  longitude, 
  name 
}: { 
  latitude: number; 
  longitude: number; 
  name: string; 
}) {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMap = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapRef.current) return;

    if (leafletMap.current) {
        leafletMap.current.remove();
        leafletMap.current = null;
    }

    const map = L.map(mapRef.current).setView([latitude, longitude], 13);
    leafletMap.current = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    L.marker([latitude, longitude], { icon: customIcon })
      .addTo(map)
      .bindPopup(name)
      .openPopup();

    return () => {
      if (leafletMap.current) {
         leafletMap.current.remove();
         leafletMap.current = null;
      }
    };
  }, [latitude, longitude, name]);

  return <div ref={mapRef} className="w-full h-[400px] rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-800 z-0" />;
}
