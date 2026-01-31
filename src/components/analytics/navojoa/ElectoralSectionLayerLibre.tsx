import React, { useEffect, useState, useMemo } from 'react';
import { Source, Layer, useMap } from 'react-map-gl/maplibre';
import { NavojoaElectoralSection } from '../../../types/navojoa-electoral';
import { Person } from '../../../types';
import { navojoaElectoralService } from '../../../services/navojoaElectoralService';
import { DataService } from '../../../services/dataService';

// --- STYLES (Converted for MapLibre) ---
const PRIMARY_COLOR = '#235b4e';
const HIGHLIGHT_COLOR = '#3b82f6';
const SELECTED_COLOR = '#9f2241';

interface ElectoralSectionLayerProps {
    data?: Person[];
    onSectionSelect: (section: NavojoaElectoralSection | null) => void;
}

export const ElectoralSectionLayerLibre: React.FC<ElectoralSectionLayerProps> = ({ 
    data, 
    onSectionSelect
}) => {
    const { current: map } = useMap();
    const [geoJsonData, setGeoJsonData] = useState<any>(null);
    const [sectionStats, setSectionStats] = useState<Map<string, NavojoaElectoralSection>>(new Map());

    // --- DATA LOADING ---
    useEffect(() => {
        const loadData = async () => {
            try {
                // 1. Load GeoJSON
                const response = await fetch('/SECCION-Navojoa.json');
                if (!response.ok) throw new Error("Failed to fetch GeoJSON");
                const geojson = await response.json();
                
                // Add an 'id' property to each feature for MapLibre feature state if not present
                // Use SECCION as id
                const enhancedGeojson = {
                    ...geojson,
                    features: geojson.features.map((f: any) => ({
                        ...f,
                        id: f.properties.SECCION // Keep as is, usually number or string. MapLibre handles both but best if consistent.
                    }))
                };
                setGeoJsonData(enhancedGeojson);

                // 2. Load/Process Section Stats
                let hierarchicalData = data;
                if (!hierarchicalData) {
                    hierarchicalData = await DataService.getAllHierarchicalData();
                }

                const sections = navojoaElectoralService.transformHierarchicalDataToSections(hierarchicalData);
                const statsMap = new Map(sections.map(s => [s.sectionNumber.toString(), s]));
                setSectionStats(statsMap);

            } catch (error) {
                console.error('Error loading electoral section data:', error);
            }
        };
        loadData();
    }, [data]);

    // Layers definition
    const layers = useMemo(() => {
        if (!geoJsonData) return null;

        return (
            <Source id="sections-source" type="geojson" data={geoJsonData}>
                {/* Fill Layer */}
                <Layer
                    id="sections-fill"
                    type="fill"
                    paint={{
                        'fill-color': [
                            'case',
                            ['boolean', ['feature-state', 'selected'], false], SELECTED_COLOR,
                            ['boolean', ['feature-state', 'hover'], false], HIGHLIGHT_COLOR,
                            'transparent'
                        ],
                        'fill-opacity': [
                            'case',
                            ['boolean', ['feature-state', 'selected'], false], 0.4,
                            ['boolean', ['feature-state', 'hover'], false], 0.3,
                            0.1
                        ]
                    }}
                />
                
                {/* Outline Layer */}
                <Layer
                    id="sections-outline"
                    type="line"
                    paint={{
                        'line-color': [
                            'case',
                            ['boolean', ['feature-state', 'selected'], false], '#831843',
                            ['boolean', ['feature-state', 'hover'], false], '#2563eb',
                            PRIMARY_COLOR
                        ],
                        'line-width': [
                            'case',
                            ['boolean', ['feature-state', 'selected'], false], 4,
                            ['boolean', ['feature-state', 'hover'], false], 3,
                            1.5
                        ],
                        'line-opacity': 0.6
                    }}
                />

                {/* Section Labels Layer */}
                <Layer
                    id="sections-labels"
                    type="symbol"
                    layout={{
                        'text-field': ['get', 'SECCION'],
                        'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
                        'text-size': 12,
                        'text-allow-overlap': false,
                        'text-ignore-placement': false
                    }}
                    paint={{
                        'text-color': PRIMARY_COLOR,
                        'text-halo-color': 'rgba(255, 255, 255, 0.8)',
                        'text-halo-width': 2
                    }}
                />
            </Source>
        );
    }, [geoJsonData]);

    return (
        <>
            {layers}
        </>
    );
};
