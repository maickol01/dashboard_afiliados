# Track Plan: Geographic Analysis - Navojoa Map

This plan outlines the steps to implement the interactive Navojoa map for geographic analysis, following the "Geoapify + Supabase Edge Functions" specification.

## Phase 1: Data Engineering & Schema [checkpoint: db8c2eb]
- [x] Task: Verify and process `SECCION-Navojoa.json` (Ensure WGS84 projection and optimize size if needed) [ef578da]
- [x] Task: Create/Verify Supabase migration for geospatial columns (`lat`, `lng`, `geocode_status`, `geocoded_at`) on `lideres`, `brigadistas`, `movilizadores`, `ciudadanos` [64cfda7]
- [x] Task: Conductor - User Manual Verification 'Phase 1: Data Engineering & Schema' [7544088]

## Phase 2: Backend & Geocoding Service (Revised for Edge Functions)
- [x] Task: Research and obtain Mapbox/Geoapify API Key and configure environment variables [1ce4a34] (Replaced with Geoapify)
- [x] Task: Disable/Remove client-side `useGeocodingTrigger` and `GeocodingService` (Reverting previous approach) [25ede72]
- [x] Task: Provide Edge Function code for manual deployment (Geoapify + Webhook)
- [ ] Task: Create specific data service methods to fetch geolocated affiliates (Already done, verify compatibility)
- [ ] Task: Conductor - User Manual Verification 'Phase 2: Backend & Geocoding Service'

## Phase 3: Frontend Map Component (React-Leaflet)
- [x] Task: Install dependencies: `leaflet`, `react-leaflet`, `react-leaflet-cluster`, `@types/leaflet`
- [x] Task: Create `NavojoaMap` container with Base Layer (OSM/Carto) and `LayersControl`
- [x] Task: Implement `ElectoralSectionLayer` rendering the GeoJSON polygons
- [x] Task: Create Custom SVG "Red Pin" Icon component/asset
- [x] Task: Implement `AffiliateMarkerLayer` with `react-leaflet-cluster` for performance
- [x] Task: Conductor - User Manual Verification 'Phase 3: Frontend Map Component'

## Phase 4: Integration, UX & Manual Fallback
- [x] Task: Integrate `NavojoaMap` into `GeographicAnalysisPage.tsx`
- [x] Task: Connect map to global dashboard filters (Role, Date, etc.)
- [x] Task: Implement interactive Popups (Name, Role badge, "View Profile" button)
- [x] Task: Implement "Manual Fallback" mode: Allow dragging pins to correct location and update `lat`/`lng` in DB
- [x] Task: Final responsive design check and mobile performance optimization
- [x] Task: Conductor - User Manual Verification 'Phase 4: Integration, UX & Manual Fallback'
