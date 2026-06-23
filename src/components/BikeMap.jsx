import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import ReactDOM from 'react-dom/client';
import { safetyColor } from '../routeUtils';
import RoutePopup from './RoutePopup';

const BILLINGS_CENTER = [45.783, -108.5007];

export default function BikeMap({ routes, mode, safetyVis, onOverrideSaved }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const layersRef = useRef([]);

  // Initialize map once
  useEffect(() => {
    if (mapInstanceRef.current) return;

    const map = L.map(mapRef.current, {
      center: BILLINGS_CENTER,
      zoom: 13,
      zoomControl: true,
    });

    // OpenStreetMap tiles
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
  attribution: '© <a href="https://openstreetmap.org/copyright">OpenStreetMap</a> contributors © <a href="https://carto.com/">CARTO</a>',
  maxZoom: 19,
}).addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Redraw routes when data or filters change
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Remove old layers
    layersRef.current.forEach(l => map.removeLayer(l));
    layersRef.current = [];

    routes.forEach(route => {
      // Filter by mode
      const modeMatch = mode === 'all' || route.mode === mode || route.mode === 'both';
      // Filter by safety visibility
      const safetyMatch = safetyVis[route.safety];
      if (!modeMatch || !safetyMatch) return;

      const color = safetyColor(route.safety);
      const weight = route.safety === 'high' ? 3 : 2.5;
      const dashArray = route.planned ? '8 5' : null;      // Highlight manually overridden segments
      const options = route.hasOverride
  ? { color, weight: weight + 2, opacity: 0.75, dashArray, className: 'route-edited' }
  : { color, weight: weight + 2, opacity: 0.75, dashArray };

      const layer = L.polyline(route.coordinates, options);

      layer.on('click', (e) => {
        const container = document.createElement('div');
        const popup = L.popup({ maxWidth: 340, minWidth: 300, autoClose: false, closeOnClick: false })          .setLatLng(e.latlng)
          .setContent(container)
          .openOn(map);

        // Render React popup into the Leaflet popup container
        const root = ReactDOM.createRoot(container);
        root.render(
          <RoutePopup
            route={route}
            onOverrideSaved={() => {
              popup.remove();
              onOverrideSaved?.();
            }}
          />
        );
      });

      layer.on('mouseover', () => {
        layer.setStyle({ weight: weight + 3, opacity: 1 });
      });

      layer.on('mouseout', () => {
        layer.setStyle({ weight, opacity: route.hasOverride ? 0.9 : 0.8 });
      });

      layer.addTo(map);
      layersRef.current.push(layer);
    });
  }, [routes, mode, safetyVis, onOverrideSaved]);

  return (
    <div
      ref={mapRef}
      style={{ flex: 1, minHeight: 0 }}
    />
  );
}
