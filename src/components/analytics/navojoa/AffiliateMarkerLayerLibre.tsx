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
        clusterColor: '#6b1426', // Dark Red
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
        pinColor: '#3b82f6', // Blue
        clusterColor: '#1d4ed8', // Dark Blue
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
                        clusterRadius={35}
                    >
                        {/* Cluster Circles (Icons) */}
                        <Layer
                            id={`clusters-${role}`}
                            type="symbol"
                            filter={['has', 'point_count']}
                            layout={{
                                visibility: isVisible,
                                'icon-image': style.clusterImage,
                                'icon-size': [
                                    'step',
                                    ['get', 'point_count'],
                                    1.1,   // Size for < 100
                                    100, 1.3,  // Size for 100-999
                                    1000, 1.6  // Size for 1000+
                                ],
                                'icon-allow-overlap': true,
                                'icon-ignore-placement': true
                            }}
                        />

                        {/* Cluster Count (Text) - Separate Layer */}
                        <Layer
                            id={`cluster-count-${role}`}
                            type="symbol"
                            filter={['has', 'point_count']}
                            layout={{
                                visibility: isVisible,
                                'text-field': ['get', 'point_count_abbreviated'],
                                'text-font': ['Noto Sans Regular'],
                                'text-size': [
                                    'step',
                                    ['get', 'point_count'],
                                    11,
                                    100, 12,
                                    1000, 14
                                ],
                                'text-offset': [0, -0.1],
                                'text-allow-overlap': true,
                                'text-ignore-placement': true
                            }}
                            paint={{
                                'text-color': '#ffffff',
                                'text-halo-color': '#000000',
                                'text-halo-width': 2
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
                                'icon-size': 0.56,
                                'icon-allow-overlap': true,
                                'icon-ignore-placement': true,
                                'icon-anchor': 'bottom'
                            }}
                        />
                    </Source>
                );
            })}
        </>
    );
};