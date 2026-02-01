import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { AffiliateMarkerLayerLibre } from '../AffiliateMarkerLayerLibre';
import React from 'react';

// Mock react-map-gl/maplibre
vi.mock('react-map-gl/maplibre', () => ({
    Source: ({ children }: { children: React.ReactNode }) => <div data-testid="source">{children}</div>,
    Layer: ({ id }: { id: string }) => <div data-testid={`layer-${id}`} />,
}));

describe('AffiliateMarkerLayerLibre', () => {
    const mockData = [
        { id: '1', nombre: 'Test 1', role: 'lider', lat: 27.0, lng: -109.0, seccion: '1' },
        { id: '2', nombre: 'Test 2', role: 'brigadista', lat: 27.1, lng: -109.1, seccion: '2' }
    ];

    it('renders the source and layers', () => {
        render(<AffiliateMarkerLayerLibre data={mockData as any} />);
        
        // Should find multiple sources now
        const sources = screen.getAllByTestId('source');
        expect(sources.length).toBeGreaterThan(0);
        
        // Should find specific role layers
        expect(screen.getByTestId('layer-clusters-lider')).toBeInTheDocument();
        expect(screen.getByTestId('layer-unclustered-point-lider')).toBeInTheDocument();
        
        expect(screen.getByTestId('layer-clusters-brigadista')).toBeInTheDocument();
        expect(screen.getByTestId('layer-unclustered-point-brigadista')).toBeInTheDocument();
    });
});
