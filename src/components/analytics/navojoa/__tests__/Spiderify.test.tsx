import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { SpiderLegsLayer } from '../SpiderLegsLayer';
import { getSpiderOffsets } from '../../../../utils/spiderify';

// Mock maplibre components
vi.mock('react-map-gl/maplibre', () => ({
    Source: ({ children, data }: any) => (
        <div data-testid="map-source" data-features={data?.features?.length}>
            {children}
        </div>
    ),
    Layer: ({ id }: any) => <div data-testid="map-layer" data-id={id} />
}));

describe('Spiderify Integration', () => {
    it('generates offsets and renders layer correctly', () => {
        const count = 5;
        const offsets = getSpiderOffsets(count);
        const center = { lat: 27.07, lng: -109.44 };

        render(<SpiderLegsLayer center={center} offsets={offsets} />);

        const source = screen.getByTestId('map-source');
        expect(source).toBeInTheDocument();
        // Check if feature count matches offset count
        expect(source.getAttribute('data-features')).toBe('5');
        
        const layer = screen.getByTestId('map-layer');
        expect(layer).toBeInTheDocument();
        expect(layer.getAttribute('data-id')).toBe('spider-legs');
    });

    it('handles zero offsets gracefully', () => {
        render(<SpiderLegsLayer center={{ lat: 0, lng: 0 }} offsets={[]} />);
        expect(screen.queryByTestId('map-source')).not.toBeInTheDocument();
    });
});
