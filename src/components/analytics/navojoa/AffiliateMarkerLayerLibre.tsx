import React, { useMemo } from 'react';
import { Source, Layer } from 'react-map-gl/maplibre';
import { Person } from '../../../types';

interface AffiliateMarkerLayerProps {
    data: Person[];
    isEditable?: boolean;
}

const PRIMARY_COLOR = '#235b4e';
const SECONDARY_COLOR = '#9f2241';
const ACCENT_COLOR = '#3b82f6';

export const AffiliateMarkerLayerLibre: React.FC<AffiliateMarkerLayerProps> = ({
    data,
    isEditable = false
}) => {
    // Transform Person[] into GeoJSON for MapLibre
    const geojson = useMemo(() => {
        const features = data
            .filter(p => p.lat != null && p.lng != null)
            .map(person => ({
                type: 'Feature' as const,
                id: person.id,
                properties: {
                    id: person.id,
                    name: person.nombre,
                    role: person.role,
                    seccion: person.seccion,
                    status: person.geocode_status
                },
                geometry: {
                    type: 'Point' as const,
                    coordinates: [person.lng!, person.lat!]
                }
            }));

        console.log(`[AffiliateMarkerLayerLibre] Rendering ${features.length} valid features.`);

        return {
            type: 'FeatureCollection' as const,
            features
        };
    }, [data]);

    return (
        <Source
            id="affiliates-source"
            type="geojson"
            data={geojson}
            cluster={!isEditable}
            clusterMaxZoom={16}
            clusterRadius={27}
        >
            {/* Cluster Circles (Icons) */}
            <Layer
                id="clusters"
                type="symbol"
                filter={['has', 'point_count']}
                layout={{
                    'icon-image': 'marker-#3b82f6',
                    'icon-size': 1.2, // Slightly larger cluster pin
                    'icon-allow-overlap': true,
                    'icon-ignore-placement': true, // Force render
                    'text-field': '{point_count_abbreviated}',
                    'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
                    'text-size': [
                        'step',
                        ['get', 'point_count'],
                        12, // Default size
                        100, // If count >= 100
                        10, // Smaller size
                        1000, // If count >= 1000
                        9 // Even smaller
                    ],
                    'text-offset': [0, -0.2],
                    'text-allow-overlap': true,
                    'text-ignore-placement': true // Force render
                }}
                paint={{
                    'text-color': '#3b82f6'
                }}
            />

            {/* Unclustered Points (Individual Pins) */}
            <Layer
                id="unclustered-point"
                type="symbol"
                filter={['!', ['has', 'point_count']]}
                layout={{
                    'icon-image': 'marker-#9f2241', // Always Red Pin as requested
                    'icon-size': 0.56, // Reduced by 30%
                    'icon-allow-overlap': true,
                    'icon-ignore-placement': true, // Force render
                    'icon-anchor': 'bottom'
                }}
            />
        </Source>
    );
};
