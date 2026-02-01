import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { AffiliateMarkerLayerLibre } from '../AffiliateMarkerLayerLibre';
import React from 'react';

// Mock react-map-gl/maplibre with prop capture
vi.mock('react-map-gl/maplibre', () => ({
    Source: ({ children }: any) => <div>{children}</div>,
    Layer: (props: any) => {
        const { id, layout } = props;
        return (
            <div 
                data-testid={`layer-${id}`}
                data-icon={layout?.['icon-image']}
            />
        );
    },
}));

describe('AffiliateMarkerLayerLibre Styling', () => {
    const mockData = [
        { id: '1', nombre: 'Lider', role: 'lider', lat: 27.0, lng: -109.0 },
        { id: '2', nombre: 'Brigadista', role: 'brigadista', lat: 27.1, lng: -109.1 },
    ];

    it('applies correct marker icons for roles', () => {
        render(<AffiliateMarkerLayerLibre data={mockData as any} selectedRole="all" />);
        
        const liderLayer = screen.getByTestId('layer-unclustered-point-lider');
        expect(liderLayer).toHaveAttribute('data-icon', 'marker-lider');
        
        const brigadistaLayer = screen.getByTestId('layer-unclustered-point-brigadista');
        expect(brigadistaLayer).toHaveAttribute('data-icon', 'marker-brigadista');
    });

    it('applies correct cluster icons for roles', () => {
        render(<AffiliateMarkerLayerLibre data={mockData as any} selectedRole="all" />);
        
        const liderCluster = screen.getByTestId('layer-clusters-lider');
        expect(liderCluster).toHaveAttribute('data-icon', 'cluster-lider');
        
        const brigadistaCluster = screen.getByTestId('layer-clusters-brigadista');
        expect(brigadistaCluster).toHaveAttribute('data-icon', 'cluster-brigadista');
    });
});
