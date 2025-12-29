import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { GeoJSON, Marker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { navojoaElectoralService } from '../../../services/navojoaElectoralService';
import { NavojoaElectoralSection } from '../../../types/navojoa-electoral';
import { Person } from '../../../types';
import { DataService } from '../../../services/dataService';

// --- STYLES ---
const STYLE_DEFAULTS = {
    fillColor: "transparent",
    weight: 1.5,
    opacity: 0.6,
    color: '#235b4e', // Primary color for borders
    fillOpacity: 0.1
};

const STYLE_HIGHLIGHT = {
    ...STYLE_DEFAULTS,
    fillColor: "#3b82f6", // Blue
    color: "#2563eb",
    weight: 3,
    fillOpacity: 0.3,
};

const STYLE_SELECTED = {
    ...STYLE_DEFAULTS,
    fillColor: "#9f2241", // Secondary color (Red)
    color: "#831843",
    weight: 4,
    fillOpacity: 0.4,
};

// --- PROPS ---
interface ElectoralSectionLayerProps {
    data?: Person[]; // Hierarchical data to calculate stats
    onSectionSelect: (section: NavojoaElectoralSection | null) => void;
}

// --- HELPER COMPONENT FOR ZOOM LOGIC ---
const MapZoomHandler: React.FC<{ setZoom: (zoom: number) => void }> = ({ setZoom }) => {
    const map = useMap();
    useMapEvents({
        zoomend: () => {
            setZoom(map.getZoom());
        },
    });
    // Set initial zoom
    useEffect(() => {
        setZoom(map.getZoom());
    }, [map, setZoom]);
    return null;
};


// --- MAIN COMPONENT ---
export const ElectoralSectionLayer: React.FC<ElectoralSectionLayerProps> = ({ data, onSectionSelect }) => {
    const [geoJsonData, setGeoJsonData] = useState<any>(null);
    const [sectionStats, setSectionStats] = useState<Map<string, NavojoaElectoralSection>>(new Map());
    const [sectionLabels, setSectionLabels] = useState<{ num: string, center: [number, number] }[]>([]);
    
    const [highlightedFeature, setHighlightedFeature] = useState<any>(null);
    const [selectedFeature, setSelectedFeature] = useState<any>(null);
    const [zoomLevel, setZoomLevel] = useState<number>(13);
    const [loading, setLoading] = useState(true);

    // --- DATA LOADING ---
    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            try {
                // 1. Load GeoJSON
                const response = await fetch('/SECCION-Navojoa.json');
                if (!response.ok) throw new Error("Failed to fetch GeoJSON");
                const geojson = await response.json();
                setGeoJsonData(geojson);

                // 2. Create labels with centroids
                const labels = geojson.features.map((feature: any) => {
                    const polygon = L.geoJSON(feature);
                    const center = polygon.getBounds().getCenter();
                    return {
                        num: feature.properties.SECCION?.toString(),
                        center: [center.lat, center.lng] as [number, number]
                    };
                });
                setSectionLabels(labels);

                // 3. Load/Process Section Stats
                let hierarchicalData = data;
                if (!hierarchicalData) {
                    hierarchicalData = await DataService.getAllHierarchicalData();
                }
                
                const sections = navojoaElectoralService.transformHierarchicalDataToSections(hierarchicalData);
                const statsMap = new Map(sections.map(s => [s.sectionNumber.toString(), s]));
                setSectionStats(statsMap);

            } catch (error) {
                console.error('Error loading electoral section data:', error);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [data]);

    // --- INTERACTION HANDLERS ---
    const onEachFeature = useCallback((feature: any, layer: any) => {
        layer.setStyle({ cursor: 'pointer' });

        layer.on({
            mouseover: () => setHighlightedFeature(feature),
            mouseout: () => setHighlightedFeature(null),
            click: () => {
                const sectionNumber = feature.properties.SECCION?.toString();
                if (selectedFeature?.properties.SECCION === feature.properties.SECCION) {
                    setSelectedFeature(null);
                    onSectionSelect(null);
                } else {
                    setSelectedFeature(feature);
                    const stats = sectionStats.get(sectionNumber);
                    if (stats) onSectionSelect(stats);
                }
            }
        });
    }, [onSectionSelect, sectionStats, selectedFeature]);
    
    // --- RENDER LOGIC ---
    if (loading || !geoJsonData) {
        return null; // Or a loading spinner
    }

    return (
        <>
            <MapZoomHandler setZoom={setZoomLevel} />
            
            {/* Main layer with all sections */}
            <GeoJSON 
                key="sections-base"
                data={geoJsonData} 
                style={STYLE_DEFAULTS}
                onEachFeature={onEachFeature}
            />

            {/* Hover highlight layer */}
            {highlightedFeature && (
                <GeoJSON
                    key={`highlight-${highlightedFeature.properties.SECCION}`}
                    data={highlightedFeature}
                    style={STYLE_HIGHLIGHT}
                    interactive={false} 
                />
            )}

            {/* Click selection layer */}
            {selectedFeature && (
                <GeoJSON
                    key={`selected-${selectedFeature.properties.SECCION}`}
                    data={selectedFeature}
                    style={STYLE_SELECTED}
                    interactive={false}
                />
            )}
            
            {/* Section number labels (visible on zoom) */}
            {zoomLevel > 13 && sectionLabels.map(label => (
                <Marker 
                    key={`label-${label.num}`}
                    position={label.center}
                    interactive={false}
                    icon={L.divIcon({
                        className: 'leaflet-section-label',
                        html: `<span class="bg-white/70 px-1 py-0.5 rounded text-xs font-bold text-primary tracking-tighter">${label.num}</span>`
                    })}
                />
            ))}
        </>
    );
};

export default ElectoralSectionLayer;