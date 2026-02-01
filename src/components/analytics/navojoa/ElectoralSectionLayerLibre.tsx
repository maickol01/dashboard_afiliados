import React, { useEffect, useState, useMemo } from 'react';
import { Source, Layer } from 'react-map-gl/maplibre';
import { NavojoaElectoralSection } from '../../../types/navojoa-electoral';
import { Person } from '../../../types';
import { navojoaElectoralService } from '../../../services/navojoaElectoralService';

// --- STYLES ---
const PRIMARY_COLOR = '#235b4e';
const HIGHLIGHT_COLOR = '#3b82f6';
const SELECTED_COLOR = '#9f2241';

interface ElectoralSectionLayerProps {
    data?: Person[];
    onSectionSelect: (section: NavojoaElectoralSection | null) => void;
    onLoad?: () => void;
}

export const ElectoralSectionLayerLibre: React.FC<ElectoralSectionLayerProps> = ({
    data,
    onSectionSelect,
    onLoad
}) => {
    const [geoJsonData, setGeoJsonData] = useState<any>(null);
    const [, setSectionStats] = useState<Map<string, NavojoaElectoralSection>>(new Map());

    // Helper to calculate approximate polygon area (for relative sizing)
    const calculatePolygonArea = (coordinates: number[][][]) => {
        let area = 0;
        if (coordinates && coordinates.length > 0) {
            const ring = coordinates[0];
            for (let i = 0; i < ring.length - 1; i++) {
                area += (ring[i][0] * ring[i + 1][1]) - (ring[i + 1][0] * ring[i][1]);
            }
        }
        return Math.abs(area) / 2.0;
    };

    // --- DATA LOADING ---
    useEffect(() => {
        const loadData = async () => {
            try {
                // 1. Load GeoJSON
                const response = await fetch('/SECCION-Navojoa.json');
                if (!response.ok) throw new Error("Failed to fetch GeoJSON");
                const geojson = await response.json();

                // Calculate areas to determine size factor
                let maxArea = 0;
                let minArea = Infinity;

                geojson.features.forEach((f: any) => {
                    let area = 0;
                    if (f.geometry.type === 'Polygon') {
                        area = calculatePolygonArea(f.geometry.coordinates);
                    } else if (f.geometry.type === 'MultiPolygon') {
                        f.geometry.coordinates.forEach((poly: any) => {
                            const polyArea = calculatePolygonArea(poly);
                            if (polyArea > area) area = polyArea;
                        });
                    }
                    f.properties.approx_area = area;
                    if (area > maxArea) maxArea = area;
                    if (area < minArea && area > 0) minArea = area;
                });

                // Add an 'id' property and 'size_factor'
                const enhancedGeojson = {
                    ...geojson,
                    features: geojson.features.map((f: any) => {
                        const area = f.properties.approx_area || minArea;
                        const normalized = maxArea === minArea ? 0 : (area - minArea) / (maxArea - minArea);
                        let sizeFactor = 1.0;
                        if (normalized > 0.1) {
                            sizeFactor = 1.0 + (Math.pow(normalized, 0.5) * 0.6);
                        }

                        return {
                            ...f,
                            id: f.properties.SECCION,
                            properties: {
                                ...f.properties,
                                size_factor: sizeFactor
                            }
                        };
                    })
                };
                setGeoJsonData(enhancedGeojson);
                if (onLoad) onLoad();

                // 2. Load/Process Section Stats
                let hierarchicalData = data;
                if (!hierarchicalData) {
                    const { DataService } = await import('../../../services/dataService');
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
    }, [data, onLoad]);

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

                {/* Section Labels - Small Sections */}
                <Layer
                    id="sections-labels-small"
                    type="symbol"
                    minzoom={7}
                    filter={['<=', ['get', 'size_factor'], 1.2]}
                    layout={{
                        'text-field': ['to-string', ['get', 'SECCION']],
                        'text-font': ['Noto Sans Regular'],
                        'text-size': [
                            'interpolate', ['linear'], ['zoom'],
                            7, 7,
                            10, 10,
                            15, 17
                        ],
                        'text-anchor': 'center',
                        'text-allow-overlap': false
                    }}
                    paint={{
                        'text-color': '#000000',
                        'text-halo-color': '#ffffff',
                        'text-halo-width': 2
                    }}
                />

                {/* Section Labels - Large Sections */}
                <Layer
                    id="sections-labels-large"
                    type="symbol"
                    minzoom={7}
                    filter={['>', ['get', 'size_factor'], 1.2]}
                    layout={{
                        'text-field': ['to-string', ['get', 'SECCION']],
                        'text-font': ['Noto Sans Regular'],
                        'text-size': [
                            'interpolate', ['linear'], ['zoom'],
                            7, 14,
                            10, 20,
                            15, 34
                        ],
                        'text-anchor': 'center',
                        'text-allow-overlap': false
                    }}
                    paint={{
                        'text-color': '#000000',
                        'text-halo-color': '#ffffff',
                        'text-halo-width': 2
                    }}
                />
            </Source>
        );
    }, [geoJsonData]);

    return <>{layers}</>;
};