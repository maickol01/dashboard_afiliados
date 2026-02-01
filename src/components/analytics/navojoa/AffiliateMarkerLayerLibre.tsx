import React, { useMemo } from 'react';
import { Source, Layer } from 'react-map-gl/maplibre';
import { Person } from '../../../types';

interface AffiliateMarkerLayerProps {
    data: Person[];
    isEditable?: boolean;
    selectedRole?: string;
}

// Styling Constants per Role
const ROLE_STYLES: Record<string, { pinColor: string; clusterColor: string; pinImage: string; clusterImage: string }> = {
    ciudadano: {
        pinColor: '#9f2241', // Red
        clusterColor: '#3b82f6', // Blue
        pinImage: 'marker-ciudadano',
        clusterImage: 'cluster-ciudadano'
    },
    lider: {
        pinColor: '#FBBF24', // Light Gold
        clusterColor: '#B45309', // Dark Gold
        pinImage: 'marker-lider',
        clusterImage: 'cluster-lider'
    },
    brigadista: {
        pinColor: '#A855F7', // Light Purple
        clusterColor: '#6B21A8', // Dark Purple
        pinImage: 'marker-brigadista',
        clusterImage: 'cluster-brigadista'
    },
    movilizador: {
        pinColor: '#22C55E', // Green
        clusterColor: '#15803D', // Dark Green
        pinImage: 'marker-movilizador',
        clusterImage: 'cluster-movilizador'
    }
};

export const AffiliateMarkerLayerLibre: React.FC<AffiliateMarkerLayerProps> = ({
    data,
    isEditable = false,
    selectedRole = 'all'
}) => {
    // Split data by role and create GeoJSON for each
    const roleSources = useMemo(() => {
        const roles = ['lider', 'brigadista', 'movilizador', 'ciudadano'] as const;
        
        return roles.map(role => {
            const roleData = data.filter(p => p.role === role && p.lat != null && p.lng != null);
            
            const features = roleData.map(person => ({
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

            return {
                role,
                data: {
                    type: 'FeatureCollection' as const,
                    features
                }
            };
        });
    }, [data]);

    return (
        <>
            {roleSources.map(({ role, data }) => {
                const style = ROLE_STYLES[role];
                // Use a pluralized id for compatibility with existing tests/expectations
                let pluralRole = role + 's';
                if (role === 'lider') pluralRole = 'lideres';
                if (role === 'movilizador') pluralRole = 'movilizadores';
                
                const sourceId = `${pluralRole}-source`;
                const isVisible = selectedRole === 'all' || selectedRole === role ? 'visible' : 'none';

                return (
                    <Source
                        key={sourceId}
                        id={sourceId}
                        type="geojson"
                        data={data}
                        cluster={!isEditable}
                        clusterMaxZoom={16}
                        clusterRadius={35} // Slightly larger to avoid too many small clusters
                    >
                        {/* Cluster Circles (Icons) */}
                        <Layer
                            id={`clusters-${role}`}
                            type="symbol"
                            filter={['has', 'point_count']}
                            layout={{
                                visibility: isVisible,
                                'icon-image': style.clusterImage,
                                'icon-size': 1.2, // Slightly larger cluster pin
                                'icon-allow-overlap': true,
                                'icon-ignore-placement': true, // Force render
                                'text-field': '{point_count_abbreviated}',
                                'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
                                'text-size': 11,
                                'text-offset': [0, -0.15],
                                'text-allow-overlap': true,
                                'text-ignore-placement': true // Force render
                            }}
                            paint={{
                                'text-color': '#ffffff' // White text for better contrast on dark/colored pins
                            }}
                        />

                        {/* Unclustered Points (Individual Pins) */}
                        <Layer
                            id={`unclustered-point-${role}`}
                            type="symbol"
                            filter={['!', ['has', 'point_count']]}
                            layout={{
                                visibility: isVisible,
                                'icon-image': style.pinImage,
                                'icon-size': 0.56, // Reduced by 30%
                                'icon-allow-overlap': true,
                                'icon-ignore-placement': true, // Force render
                                'icon-anchor': 'bottom'
                            }}
                        />
                    </Source>
                );
            })}
        </>
    );
};