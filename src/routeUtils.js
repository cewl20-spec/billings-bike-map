// Billings, MT bounding box
export const BILLINGS_BOUNDS = {
  south: 45.72,
  west: -108.62,
  north: 45.84,
  east: -108.38,
};

// Build Overpass QL query for bike infrastructure
export function buildOverpassQuery(bounds) {
  const { south, west, north, east } = bounds;
  const bbox = `${south},${west},${north},${east}`;
  return `
    [out:json][timeout:40];
    (
      way["highway"="cycleway"]["name"](${bbox});
      way["highway"="path"]["bicycle"!="no"]["name"](${bbox});      way["highway"="footway"]["bicycle"="yes"](${bbox});
      way["cycleway"~"lane|track|opposite_lane|opposite_track"](${bbox});
      way["bicycle"="designated"](${bbox});
      way["highway"~"residential|tertiary|secondary"]["cycleway"~"."](${bbox});
    );
    out geom;
  `.trim();
}

// Auto-score a segment from OSM tags
// Returns: 'high' | 'med' | 'low'
export function scoreSegment(tags) {
  const hw = tags.highway || '';
  const cy = tags.cycleway || tags['cycleway:both'] || tags['cycleway:right'] || '';
  const bicycle = tags.bicycle || '';
  const maxspeed = parseInt(tags.maxspeed) || 35;

  // High safety: protected infrastructure
  if (cy === 'track') return 'high';
  if (hw === 'cycleway') return 'high';
  if (hw === 'path' && bicycle === 'designated') return 'high';
  if (hw === 'path' && !tags.motor_vehicle) return 'high';

  // Medium safety: painted lanes, low-speed roads, shared paths
  if (cy === 'lane' || cy === 'opposite_lane') return 'med';
  if (bicycle === 'yes' || bicycle === 'permissive') return 'med';
  if (maxspeed <= 25) return 'med';
  if (hw === 'residential' || hw === 'living_street') return 'med';
  if (hw === 'footway' && bicycle === 'yes') return 'med';

  // Low safety: shared arterials
  return 'low';
}

// Determine best use mode from OSM tags
// Returns: 'rec' | 'commute' | 'both'
export function getRouteMode(tags) {
  const hw = tags.highway || '';
  const name = (tags.name || '').toLowerCase();
  const cy = tags.cycleway || '';

  const trailKeywords = ['trail', 'path', 'skyway', 'zimmerman', 'alkali', 'riverfront', 'skyline', 'rimrock trail'];
  const isNamedTrail = trailKeywords.some(k => name.includes(k));
  const isDedicatedInfra = hw === 'cycleway' || hw === 'path';

  if (isNamedTrail || isDedicatedInfra) return 'rec';
  if (cy === 'lane' || hw === 'tertiary' || hw === 'secondary') return 'commute';
  if (hw === 'residential') return 'both';
  return 'both';
}

// Convert OSM element to a GeoJSON-like feature with computed properties
export function osmToFeature(el) {
  if (!el.geometry || el.geometry.length < 2) return null;

  const tags = el.tags || {};
  const safety = scoreSegment(tags);
  const mode = getRouteMode(tags);

  // Allow manual overrides stored in localStorage
  const overrideKey = `override_${el.id}`;
  const override = JSON.parse(localStorage.getItem(overrideKey) || 'null');

  return {
    id: el.id,
    coordinates: el.geometry.map(p => [p.lat, p.lon]),
    tags,
    name: tags.name || tags.ref || null,
    type: inferType(tags),
    safety: override?.safety || safety,
    autoSafety: safety,
    mode: override?.mode || mode,
    autoMode: mode,
    hasOverride: !!override,
    notes: override?.notes || null,
  };
}

function inferType(tags) {
  const hw = tags.highway || '';
  const cy = tags.cycleway || tags['cycleway:both'] || '';
  if (cy === 'track') return 'Protected track';
  if (hw === 'cycleway') return 'Dedicated cycleway';
  if (cy === 'lane') return 'Painted bike lane';
  if (hw === 'path') return 'Shared path / trail';
  if (hw === 'footway') return 'Shared footway';
  if (hw === 'residential') return 'Residential road';
  return 'Shared road';
}

// Color by safety level
export function safetyColor(safety) {
  return { high: '#1a9e74', med: '#e09f27', low: '#e04a4a', primitive: '#a07840', planned: '#888888' }[safety] || '#888';
}

// Save a manual override for a segment
export function saveOverride(id, data) {
  localStorage.setItem(`override_${id}`, JSON.stringify(data));
}

// Clear a manual override
export function clearOverride(id) {
  localStorage.removeItem(`override_${id}`);
}
