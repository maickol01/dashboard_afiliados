import React, { useEffect, useState } from 'react';
import { GeoJSON, Tooltip, Marker } from 'react-leaflet';
import L from 'leaflet';
import { navojoaElectoralService } from '../../../services/navojoaElectoralService';
import { NavojoaElectoralSection } from '../../../types/navojoa-electoral';
import { Person } from '../../../types';
import { DataService } from '../../../services/dataService';

interface ElectoralSectionLayerProps {
    data?: Person[]; // Optional hierarchical data to calculate real stats
}

export const ElectoralSectionLayer: React.FC<ElectoralSectionLayerProps> = ({ data }) => {
    const [geoJsonData, setGeoJsonData] = useState<any>(null);
    const [sectionStats, setSectionStats] = useState<Map<string, NavojoaElectoralSection>>(new Map());
    const [sectionLabels, setSectionLabels] = useState<{ num: string, center: [number, number] }[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            try {
                // 1. Load GeoJSON
                const response = await fetch('/SECCION-Navojoa.json');
                const geojson = await response.json();
                setGeoJsonData(geojson);

                // Create labels with centroids
                const labels: { num: string, center: [number, number] }[] = geojson.features.map((feature: any) => {
                    const polygon = L.geoJSON(feature);
                    const center = polygon.getBounds().getCenter();
                    return {
                        num: feature.properties.SECCION?.toString(),
                        center: [center.lat, center.lng] as [number, number]
                    };
                });
                setSectionLabels(labels);

                // 2. Load/Process Section Stats
                let hierarchicalData = data;
                if (!hierarchicalData) {
                    hierarchicalData = await DataService.getAllHierarchicalData();
                }
                
                const sections = navojoaElectoralService.transformHierarchicalDataToSections(hierarchicalData);
                const statsMap = new Map();
                sections.forEach(s => statsMap.set(s.sectionNumber.toString(), s));
                setSectionStats(statsMap);
            } catch (error) {
                console.error('Error loading electoral section data:', error);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [data]);

    const defaultStyle = {
        fillColor: "transparent",
        weight: 1.5,
        opacity: 0.6,
        color: '#235b4e', // Primary color
        fillOpacity: 0.1
    };

    const highlightStyle = {
        fillColor: "#9f2241", // Secondary color
        weight: 3,
        color: "#9f2241",
        fillOpacity: 0.3,
    };

    const onEachFeature = (feature: any, layer: any) => {
        const sectionNumber = feature.properties.SECCION?.toString();
        const stats = sectionStats.get(sectionNumber);
        
        const tooltipContent = `
            <div class="p-2 font-sans">
                <div class="font-bold border-b border-gray-200 mb-1 pb-1">Sección ${sectionNumber}</div>
                ${stats ? `
                    <div class="text-xs space-y-1">
                        <div class="flex justify-between gap-4"><span>Total:</span> <span class="font-bold">${stats.totalRegistrations}</span></div>
                        <div class="flex justify-between gap-4"><span>Ciudadanos:</span> <span>${stats.ciudadanos}</span></div>
                        <div class="flex justify-between gap-4"><span>Lideres/Equipos:</span> <span>${stats.lideres + stats.brigadistas + stats.movilizadores}</span></div>
                    </div>
                ` : '<div class="text-xs italic text-gray-500">Sin registros</div>'}
            </div>
        `;

        layer.bindTooltip(tooltipContent, {
            sticky: true,
            direction: 'top',
            className: 'custom-leaflet-tooltip'
        });

        layer.on({
            mouseover: (e: any) => {
                e.target.setStyle(highlightStyle);
            },
            mouseout: (e: any) => {
                e.target.setStyle(defaultStyle);
            },
            click: (e: any) => {
                // Future enhancement: Zoom to feature or open details panel
                console.log(`Clicked section ${sectionNumber}`);
            }
        });
    };

    if (loading || !geoJsonData) return null;

    return (
        <>
            <GeoJSON 
                key="sections"
                data={geoJsonData} 
                style={defaultStyle}
                onEachFeature={onEachFeature}
            />
            {sectionLabels.map(label => (
                <Marker 
                    key={`label-${label.num}`}
                    position={label.center}
                    icon={L.divIcon({
                        className: 'leaflet-section-label',
                        html: `<span class="text-xs font-bold text-primary opacity-80">${label.num}</span>`
                    })}
                />
            ))}
        </>
    );
};

export default ElectoralSectionLayer;

