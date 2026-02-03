import React, { useMemo } from 'react';
import { Source, Layer } from 'react-map-gl/maplibre';

interface SpiderLegsLayerProps {
    center: { lat: number; lng: number };
    offsets: number[][];
}

export const SpiderLegsLayer: React.FC<SpiderLegsLayerProps> = ({ center, offsets }) => {
    const data = useMemo(() => {
        if (!offsets || offsets.length === 0) return null;

        const features = offsets.map((offset, index) => ({
            type: 'Feature',
            geometry: {
                type: 'LineString',
                coordinates: [
                    [center.lng, center.lat],
                    [center.lng + offset[0], center.lat + offset[1]]
                ]
            },
            properties: { id: index }
        }));

        return {
            type: 'FeatureCollection',
            features
        };
    }, [center, offsets]);

    if (!data) return null;

    return (
        <Source type="geojson" data={data as any}>
            <Layer
                id="spider-legs"
                type="line"
                paint={{
                    'line-color': '#666',
                    'line-width': 1.5,
                    'line-opacity': 0.6
                }}
            />
        </Source>
    );
};
