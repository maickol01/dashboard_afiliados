import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { SpiderLegsLayer } from '../SpiderLegsLayer';

vi.mock('react-map-gl/maplibre', () => ({
    Source: ({ children, data }: any) => <div data-testid="spider-source" data-geojson={JSON.stringify(data)}>{children}</div>,
    Layer: () => <div data-testid="spider-layer" />
}));

describe('SpiderLegsLayer', () => {
    const center = { lat: 10, lng: 10 };
    const offsets = [[0.01, 0.01], [-0.01, -0.01]];
    
    it('renders nothing if no offsets', () => {
        render(<SpiderLegsLayer center={center} offsets={[]} />);
        expect(screen.queryByTestId('spider-source')).not.toBeInTheDocument();
    });

    it('renders lines for offsets', () => {
        render(<SpiderLegsLayer center={center} offsets={offsets} />);
        const source = screen.getByTestId('spider-source');
        expect(source).toBeInTheDocument();
        const geojson = JSON.parse(source.getAttribute('data-geojson') || '{}');
        expect(geojson.type).toBe('FeatureCollection');
        expect(geojson.features.length).toBe(2);
        expect(geojson.features[0].geometry.type).toBe('LineString');
    });
});
