# Track Spec: Geographic Analysis - Navojoa Map

## Overview
Transform the existing dashboard into a geospatial command tool by implementing an interactive map for Navojoa, Sonora (District 07). This feature will visualize the distribution of the operational force (Leaders, Brigadistas, Mobilizers) and electoral sections, enabling tactical decision-making based on territorial coverage and "heat zones".

## Architecture & Tech Stack
*   **Frontend:** React (Vite) + TypeScript.
*   **Visualization:** `react-leaflet` (Leaflet) for the map interface.
    *   Why: Superior control over DOM for React components, efficient marker clustering, and deep CSS customization compared to Google Maps.
*   **Clustering:** `react-leaflet-markercluster` to handle high volumes of affiliate points.
*   **Backend/Data:** Supabase (PostgreSQL).
*   **Geocoding:** Mapbox Geocoding API (Primary) with a "Lazy" incremental strategy.
    *   Alternatives: Open data sources if feasible.
    *   Storage: Coordinates (`lat`, `lng`) cached in Supabase to minimize API costs.

## Functional Requirements

### 1. Interactive Map Interface
*   **Base Layer:** High-contrast street map (e.g., OpenStreetMap or CartoDB Voyager) for clear readability.
*   **Electoral Sections Layer:**
    *   Render polygons from `SECCION-Navojoa.json`.
    *   **Style:** Thin black borders, transparent or choropleth fill (based on progress metrics).
    *   **Interaction:** Click to view section statistics (total citizens, target vs. actual).
*   **Affiliate Layer (Points):**
    *   Display affiliates (Leaders, Brigadistas, etc.) as **Custom Red Vector Pins** (SVG).
    *   **Clustering:** Group nearby points at low zoom levels to prevent clutter ("Ocean of Red").
    *   **Drill-down:** Clicking a cluster zooms in ("Spiderfy"); clicking a pin opens a detailed Popup.

### 2. Geocoding & Data Management
*   **Lazy Geocoding:**
    *   Trigger geocoding asynchronously when records are created/updated.
    *   Store results: `lat`, `lng`, `geocode_status` ('pending', 'success', 'failed', 'manual'), `geocoded_at`.
*   **Manual Fallback:**
    *   UI capability for operators to manually "drag & drop" a pin to correct locations for records with `geocode_status = 'failed'` or low precision.

### 3. Integration & Filtering
*   **Sync with Dashboard Filters:** The map must react to global filters (Role, Date, Campaign).
*   **Popups:** Display Name, Role (color-coded badge), Address, and "View Profile" action.

## Data Structure (Schema Reference)
The system relies on the following schema extensions for `brigadistas`, `ciudadanos`, `lideres`, `movilizadores`:
*   `lat` (double precision)
*   `lng` (double precision)
*   `geocode_status` (text: 'pending', 'success', 'failed', 'manual')
*   `geocoded_at` (timestamp)

## Assets
*   **GeoJSON:** `SECCION-Navojoa.json` (Located in project root).
*   **Icons:** Custom SVG for the "Red Pin".

## Success Criteria
1.  Map accurately renders Navojoa electoral sections from GeoJSON.
2.  Affiliates appear as clustered red pins at correct coordinates.
3.  Geocoding service successfully populates `lat`/`lng` for valid addresses.
4.  Manual correction (drag-pin) works and updates the database.
5.  Performance remains smooth (60fps) with thousands of points using clustering.