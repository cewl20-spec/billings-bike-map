# Billings Bike Map

An interactive bike infrastructure map for Billings, MT and the surrounding area.
Built with React + Leaflet, pulling real data from OpenStreetMap.

## Features

- **Live OSM data** — pulls bike trails, lanes, and paths from OpenStreetMap via Overpass API
- **Auto-scored safety** — each segment gets a High / Medium / Low safety score based on infrastructure type
- **Manual overrides** — click any route to adjust its safety score and add local notes (stored locally)
- **Recreation / Commute toggle** — filter routes by intended use
- **24-hour data cache** — OSM data is cached locally so the map loads fast on repeat visits

## Setup

### Prerequisites
- Node.js 18+ ([nodejs.org](https://nodejs.org))
- npm (comes with Node)

### Run locally

```bash
npm install
npm start
```

Then open [http://localhost:3000](http://localhost:3000).

### Deploy to Vercel (free)

1. Push this folder to a GitHub repo
2. Go to [vercel.com](https://vercel.com) → New Project → import your repo
3. Vercel auto-detects Create React App — just click Deploy
4. Done. Your map is live at a public URL.

## Adding the Yellowstone County GIS layer

The official Yellowstone County bikeway GIS layer can be added as a second data source.
Once you have the ArcGIS REST endpoint URL:

1. In `useRoutes.js`, add a second fetch alongside the Overpass query
2. Parse the ArcGIS GeoJSON response (`f=geojson` query param)
3. Run each feature through `scoreSegment()` and `getRouteMode()` as usual
4. Merge with the OSM results before setting state

The scoring logic in `routeUtils.js` is designed to work with any GeoJSON source —
just map the field names from the county data to the tag keys the scorer expects.

## Manual overrides

Click any route on the map → "Override safety / mode" to:
- Adjust the auto-scored safety level based on real riding experience
- Change the recreation/commute classification
- Add a note (e.g. "rough pavement", "construction until June")

Overrides are saved to `localStorage` and persist across sessions.
To share overrides with others, export them: `localStorage.getItem('override_<id>')`.

## Data sources

- **OpenStreetMap** — primary bike infrastructure data (Overpass API)
- **Yellowstone County GIS** — official bikeway layer (add manually, see above)
- Manual overrides — your local knowledge, stored in the browser

## Project structure

```
src/
  App.js              — root component, state management
  useRoutes.js        — data fetching, caching, override reapplication
  routeUtils.js       — scoring logic, Overpass query builder, color helpers
  components/
    BikeMap.jsx       — Leaflet map, route rendering, click/hover interactions
    Sidebar.jsx       — mode toggle, safety filters, legend
    RoutePopup.jsx    — click popup with manual override UI
```
