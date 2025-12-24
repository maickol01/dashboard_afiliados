# Track Spec: Geographic Analysis - Navojoa Map

## Overview
The goal of this track is to implement a comprehensive Geographic Analysis page. The centerpiece of this page will be an interactive map of Navojoa, Sonora. This map will allow users to visualize the distribution and density of registered citizens across different electoral sections.

## Functional Requirements
1.  **Interactive Map Component:**
    *   Display a map of Navojoa, Sonora.
    *   The map must be interactive (zoom, pan).
    *   The map must be segmented into official electoral sections.
2.  **Data Layers:**
    *   **Electoral Sections Layer:** Clear boundaries for each section.
    *   **Citizen Density Layer:** A heatmap or color-coded representation showing the number of registered citizens per section.
3.  **Information Display:**
    *   Tooltip or information panel that shows specific data (Section number, total citizens, etc.) when a section is hovered over or clicked.
4.  **Integration:**
    *   Fetch citizen data and section information from the existing Supabase backend.
    *   Integrate the page into the existing application navigation.
5.  **Data Quality Integration:**
    *   Optionally show data quality indicators per section (e.g., % of complete records).

## Technical Requirements
-   **Frontend:** React, Tailwind CSS.
-   **Mapping Library:** Use a suitable mapping library (e.g., Leaflet, Mapbox, or Google Maps) as compatible with the existing stack. (Need to verify if any mapping library is already used).
-   **GeoJSON:** Source or create GeoJSON data for Navojoa's electoral sections.
-   **Backend:** Use `dataService.ts` or a new service to fetch aggregated citizen data per section.

## Success Criteria
-   Users can view the Navojoa map with clear electoral section boundaries.
-   The map accurately reflects the citizen density from the Supabase database.
-   The page follows the existing design guidelines and is responsive.
