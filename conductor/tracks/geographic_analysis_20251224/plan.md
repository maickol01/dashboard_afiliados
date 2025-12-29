# Track Plan: Geographic Analysis - Navojoa Map

This plan outlines the steps to implement the interactive Navojoa map for geographic analysis, following the "Lazy Geocoding" and "Red Pin" specification.

## Phase 1: Data Engineering & Schema [checkpoint: db8c2eb]
- [x] Task: Verify and process `SECCION-Navojoa.json` (Ensure WGS84 projection and optimize size if needed) [ef578da]
- [x] Task: Create/Verify Supabase migration for geospatial columns (`lat`, `lng`, `geocode_status`, `geocoded_at`) on `lideres`, `brigadistas`, `movilizadores`, `ciudadanos` [64cfda7]
- [x] Task: Conductor - User Manual Verification 'Phase 1: Data Engineering & Schema' [7544088]

## Phase 2: Backend & Geocoding Service
- [x] Task: Research and obtain Mapbox API Key (or select Open Data alternative) and configure environment variables [4e20563]
- [x] Task: Implement "Lazy Geocoding" logic (Service or Edge Function) to process addresses into coordinates [1ce4a34]
- [x] Task: Implement database trigger or app-level hook to initiate geocoding on record insert/update [1ce4a34]
- [x] Task: Create specific data service methods to fetch geolocated affiliates with status filtering [1ce4a34]
- [~] Task: Conductor - User Manual Verification 'Phase 2: Backend & Geocoding Service'

## Phase 3: Frontend Map Component (React-Leaflet)
- [ ] Task: Install dependencies: `leaflet`, `react-leaflet`, `leaflet.markercluster`, `@types/leaflet`
- [ ] Task: Create `NavojoaMap` container with Base Layer (OSM/Carto) and `LayersControl`
- [ ] Task: Implement `ElectoralSectionLayer` rendering the GeoJSON polygons
- [ ] Task: Create Custom SVG "Red Pin" Icon component/asset
- [ ] Task: Implement `AffiliateMarkerLayer` with `MarkerClusterGroup` for performance
- [ ] Task: Conductor - User Manual Verification 'Phase 3: Frontend Map Component'

## Phase 4: Integration, UX & Manual Fallback
- [ ] Task: Integrate `NavojoaMap` into `GeographicAnalysisPage.tsx`
- [ ] Task: Connect map to global dashboard filters (Role, Date, etc.)
- [ ] Task: Implement interactive Popups (Name, Role badge, "View Profile" button)
- [ ] Task: Implement "Manual Fallback" mode: Allow dragging pins to correct location and update `lat`/`lng` in DB
- [ ] Task: Final responsive design check and mobile performance optimization
- [ ] Task: Conductor - User Manual Verification 'Phase 4: Integration, UX & Manual Fallback'