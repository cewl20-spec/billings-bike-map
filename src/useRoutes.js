import { useState, useEffect } from 'react';
import { buildOverpassQuery, osmToFeature, BILLINGS_BOUNDS } from './routeUtils';
import residentialRoads from './residential-roads.json';

const CACHE_KEY = 'billings_routes_cache';
const CACHE_TTL = 24 * 60 * 60 * 1000;

const GIS_BASE = 'https://billingsgis.com/arcgis_public/rest/services/ArcOnline_Public/Multi_Use_Trails_EXT/MapServer';

// Score a City GIS bikeway segment from its CLASS + EXISTING fields
function scoreGisSegment(cls, existing) {
  const c = (cls || '').toLowerCase();
  const e = (existing || '').toLowerCase();
  // Dedicated trails — high
  if (c.includes('multi-use trail')) return 'high';
  if (c.includes('neighborhood trail')) return 'high';
  if (c.includes('soft-surface')) return 'high';
  if (c === 'trail') return 'high';
  if (c.includes('connector') || c.includes('bridge') || c.includes('underpass')) return 'high';
  // Designated bike routes — high
  if (c.includes('primary bikeway')) return 'high';
  if (c.includes('secondary bikeway')) return 'high';
  if (c.includes('neighborhood bikeway')) return 'high';
  // Existing infrastructure — scored by EXISTING field
  if (e.includes('bike lane') && !e.includes('shared')) return 'high';
  if (e.includes('bike lane - shared') || e.includes('sharrow')) return 'med';
  // Arterials — low
  if (c.includes('arterial')) return 'low';
  if (c.includes('principal vehicular')) return 'low';
  // Primitive
  if (c.includes('primitive')) return 'primitive';
  return 'med';
}

function modeFromGisClass(cls) {
  const c = (cls || '').toLowerCase();
  if (c.includes('multi-use trail') || c.includes('neighborhood trail') || c.includes('soft-surface') || c.includes('primitive')) return 'rec';
  if (c.includes('arterial') || c.includes('primary bikeway') || c.includes('secondary bikeway')) return 'commute';
  if (c.includes('neighborhood bikeway')) return 'both';
  return 'both';
}

// Fetch a GIS layer as GeoJSON and convert to our feature format
async function fetchGisLayer(layerId, nameField, classField, existingField) {
  const params = new URLSearchParams({
    where: '1=1',
    outFields: '*',
    f: 'geojson',
    outSR: '4326',
  });
  const url = `${GIS_BASE}/${layerId}/query?${params}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`GIS layer ${layerId} error: ${res.status}`);
  const data = await res.json();

  return (data.features || [])
    .filter(f => f.geometry && f.geometry.coordinates && f.geometry.coordinates.length > 0)
    .map(f => {
      const props = f.properties || {};
      const cls = props[classField] || props['Class'] || props['CLASS'] || '';
      const existing = props[existingField] || props['EXISTING'] || '';
      const name = props[nameField] || props['NAME'] || props['Name_Local'] || null;
      const safety = scoreGisSegment(cls, existing);
      const mode = modeFromGisClass(cls);

      // Handle both LineString and MultiLineString
      let coordinates;
      if (f.geometry.type === 'LineString') {
        coordinates = f.geometry.coordinates.map(c => [c[1], c[0]]);
      } else if (f.geometry.type === 'MultiLineString') {
        coordinates = f.geometry.coordinates[0].map(c => [c[1], c[0]]);
      } else {
        return null;
      }

      const overrideKey = `override_${layerId}_${props.OBJECTID}`;
      const override = JSON.parse(localStorage.getItem(overrideKey) || 'null');
      const isPlanned = existing.includes('proposed') || 
                  cls.toLowerCase().includes('proposed') ||
                  (existing.trim() === '' && cls.toLowerCase().includes('bikeway'));

return {
  id: `gis_${layerId}_${props.OBJECTID}`,
  coordinates,
  tags: {},
  name,
  type: cls || 'City bikeway',
  existing,
  safety: override?.safety || (isPlanned ? 'planned' : safety),
  autoSafety: isPlanned ? 'planned' : safety,
  mode: override?.mode || mode,
  autoMode: mode,
  hasOverride: !!override,
  notes: override?.notes || null,
  source: 'city',
  planned: isPlanned,
};
    })
    .filter(Boolean);
}

export function useRoutes() {
  const [routes, setRoutes] = useState([]);
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState(null);
  const [count, setCount] = useState(0);

  useEffect(() => { loadRoutes(); }, []);

  async function loadRoutes() {
    try {
      const cached = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null');
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        setRoutes(cached.routes);
        setCount(cached.routes.length);
        setStatus('loaded');
        return;
      }
    } catch (e) {}

    setStatus('loading');

    try {
      // Fetch OSM and both GIS layers in parallel
      const [osmRes, recTrails, bikeways] = await Promise.allSettled([
        fetch('https://overpass.kumi.systems/api/interpreter', {
          method: 'POST',
          body: 'data=' + encodeURIComponent(buildOverpassQuery(BILLINGS_BOUNDS)),
        }).then(r => r.json()),
        fetchGisLayer(1, 'NAME', 'Class', 'LifecycleStatus'),
        fetchGisLayer(2, 'NAME', 'CLASS', 'EXISTING'),
      ]);

      let features = [];

// Static residential roads — loaded instantly from CDN
const residentialFeatures = residentialRoads.map(r => {
  const overrideKey = `override_${r.id}`;
  const override = JSON.parse(localStorage.getItem(overrideKey) || 'null');
  return override
    ? { ...r, safety: override.safety || r.safety, mode: override.mode || r.mode, notes: override.notes || null, hasOverride: true }
    : r;
});
features = features.concat(residentialFeatures);

      

      // OSM routes
      if (osmRes.status === 'fulfilled') {
        const osmFeatures = (osmRes.value.elements || [])
          .map(osmToFeature)
          .filter(Boolean)
          .map(f => ({ ...f, source: 'osm' }));
        features = features.concat(osmFeatures);
      }

      // City GIS recreational trails
      if (recTrails.status === 'fulfilled') {
        features = features.concat(recTrails.value);
      }

      // City GIS bikeways
      if (bikeways.status === 'fulfilled') {
        features = features.concat(bikeways.value);
      }

      if (features.length === 0) throw new Error('No routes returned from any source');

      localStorage.setItem(CACHE_KEY, JSON.stringify({ timestamp: Date.now(), routes: features }));
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
