import { useState, useEffect } from 'react';
import { buildOverpassQuery, osmToFeature, BILLINGS_BOUNDS } from './routeUtils';

const CACHE_KEY = 'billings_routes_cache';
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

export function useRoutes() {
  const [routes, setRoutes] = useState([]);
  const [status, setStatus] = useState('idle'); // idle | loading | loaded | error
  const [error, setError] = useState(null);
  const [count, setCount] = useState(0);

  useEffect(() => {
    loadRoutes();
  }, []);

  async function loadRoutes() {
    // Check cache first
    try {
      const cached = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null');
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        setRoutes(cached.routes);
        setCount(cached.routes.length);
        setStatus('loaded');
        return;
      }
    } catch (e) {
      // ignore bad cache
    }

    setStatus('loading');

    try {
      const query = buildOverpassQuery(BILLINGS_BOUNDS);
      const res = await fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        body: 'data=' + encodeURIComponent(query),
      });

      if (!res.ok) throw new Error(`Overpass API error: ${res.status}`);

      const data = await res.json();
      const features = data.elements
        .map(osmToFeature)
        .filter(Boolean);

      // Cache it
      localStorage.setItem(CACHE_KEY, JSON.stringify({
        timestamp: Date.now(),
        routes: features,
      }));

      setRoutes(features);
      setCount(features.length);
      setStatus('loaded');
    } catch (err) {
      setError(err.message);
      setStatus('error');
    }
  }

  function refreshRoutes() {
    localStorage.removeItem(CACHE_KEY);
    loadRoutes();
  }

  // Called when a manual override is saved — re-apply overrides to cached data
  function reapplyOverrides() {
    setRoutes(prev => prev.map(r => {
      const overrideKey = `override_${r.id}`;
      const override = JSON.parse(localStorage.getItem(overrideKey) || 'null');
      if (override) {
        return { ...r, safety: override.safety || r.autoSafety, mode: override.mode || r.autoMode, notes: override.notes || null, hasOverride: true };
      }
      return { ...r, safety: r.autoSafety, mode: r.autoMode, notes: null, hasOverride: false };
    }));
  }

  return { routes, status, error, count, refreshRoutes, reapplyOverrides };
}
