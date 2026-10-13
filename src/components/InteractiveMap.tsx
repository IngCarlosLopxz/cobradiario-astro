import React, { useEffect, useRef, useState } from 'react';
import type { RouteMarker } from '../core/domain/types';
import { formatCOP } from '../core/services/loan-calculator';
import { Navigation } from 'lucide-react';

interface InteractiveMapProps {
  markers: RouteMarker[];
  onSelectMarker?: (marker: RouteMarker) => void;
}

export const InteractiveMap: React.FC<InteractiveMapProps> = ({
  markers,
  onSelectMarker,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersGroupRef = useRef<any>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !mapContainerRef.current) return;

    let isMounted = true;

    const loadLeafletScript = (): Promise<any> => {
      if ((window as any).L) {
        return Promise.resolve((window as any).L);
      }
      return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        script.async = true;
        script.onload = () => resolve((window as any).L);
        script.onerror = reject;
        document.head.appendChild(script);
      });
    };

    loadLeafletScript()
      .then((L) => {
        if (!isMounted || !mapContainerRef.current) return;

        if (!mapInstanceRef.current) {
          const map = L.map(mapContainerRef.current, {
            center: [9.563, -73.334],
            zoom: 14,
            zoomControl: false,
          });

          L.control.zoom({ position: 'bottomright' }).addTo(map);

          L.tileLayer(
            'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
            {
              attribution: '&copy; OpenStreetMap &copy; CARTO',
              maxZoom: 19,
            }
          ).addTo(map);

          markersGroupRef.current = L.layerGroup().addTo(map);
          mapInstanceRef.current = map;

          setMapLoaded(true);
        }
      })
      .catch((err) => {
        console.warn('Error loading Leaflet script:', err);
      });

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const L = typeof window !== 'undefined' ? (window as any).L : null;
    if (!mapLoaded || !mapInstanceRef.current || !markersGroupRef.current || !L) return;

    markersGroupRef.current.clearLayers();
    const bounds = L.latLngBounds([]);

    markers.forEach((m) => {
      if (!m.latitude || !m.longitude) return;

      bounds.extend([m.latitude, m.longitude]);

      const colorBg =
        m.status === 'paid'
          ? '#10b981'
          : m.status === 'overdue'
          ? '#ef4444'
          : '#0284c7';

      const customIcon = L.divIcon({
        className: 'custom-leaflet-marker',
        html: `
          <div style="
            width: 32px; 
            height: 32px; 
            background: ${colorBg}; 
            border: 3px solid #ffffff; 
            border-radius: 50%; 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            color: white; 
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            font-weight: bold;
            font-size: 11px;
            cursor: pointer;
            transition: transform 0.2s ease;
          ">
            ${m.status === 'paid' ? '✓' : '$'}
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      const marker = L.marker([m.latitude, m.longitude], { icon: customIcon });

      const popupContent = `
        <div style="font-family: inherit; min-width: 170px;">
          <p style="margin: 0; font-weight: 700; font-size: 13px; color: #0f172a;">${m.name}</p>
          <p style="margin: 2px 0 6px 0; font-size: 11px; color: #64748b;">${m.address}</p>
          <div style="background: #f1f5f9; padding: 6px 8px; border-radius: 8px; margin-bottom: 6px;">
            <span style="font-size: 10px; color: #64748b; display: block;">Cuota diaria:</span>
            <span style="font-size: 13px; font-weight: 800; color: #0f172a;">${formatCOP(m.daily_payment)}</span>
          </div>
          <div style="font-size: 11px; font-weight: 600; color: ${m.status === 'paid' ? '#059669' : '#0284c7'};">
            ${m.status === 'paid' ? '✓ Ya pagó hoy' : '⏳ Pendiente por cobrar'}
          </div>
        </div>
      `;

      marker.bindPopup(popupContent, {
        closeButton: false,
        offset: [0, -10],
      });

      marker.on('click', () => {
        if (onSelectMarker) onSelectMarker(m);
      });

      markersGroupRef.current.addLayer(marker);
    });

    if (bounds.isValid() && mapInstanceRef.current) {
      mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
    }
  }, [mapLoaded, markers, onSelectMarker]);

  return (
    <div className="relative w-full h-[360px] md:h-[420px] rounded-3xl overflow-hidden border border-slate-200/80 shadow-sm bg-slate-100">
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Map Legend Overlay */}
      <div className="absolute top-3 left-3 z-10 bg-white/90 backdrop-blur-md px-3 py-2 rounded-2xl shadow-md border border-slate-200/80 flex items-center gap-3 text-[11px] font-semibold text-slate-700">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          <span>Cobrado</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
          <span>Pendiente</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
          <span>En Mora</span>
        </div>
      </div>

      {/* Floating GPS Target Counter */}
      <div className="absolute bottom-3 left-3 z-10 bg-slate-900/90 text-white backdrop-blur-md px-3.5 py-1.5 rounded-2xl shadow-md flex items-center gap-2 text-xs font-medium">
        <Navigation className="w-3.5 h-3.5 text-sky-400 animate-pulse" />
        <span>{markers.filter((m) => !m.is_paid_today).length} clientes pendientes en ruta</span>
      </div>
    </div>
  );
};
