import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { AffiliateMarkerLayerLibre } from '../AffiliateMarkerLayerLibre';
import React from 'react';

// Mock react-map-gl/maplibre
vi.mock('react-map-gl/maplibre', () => ({
    Source: ({ id }: { id: string }) => <div data-testid={`source-${id}`} />,
    Layer: ({ id }: { id: string }) => <div data-testid={`layer-${id}`} />,
}));

describe('AffiliateMarkerLayerLibre Refactor', () => {
    const mockData = [
        { id: '1', nombre: 'Lider 1', role: 'lider', lat: 27.0, lng: -109.0 },
        { id: '2', nombre: 'Brigadista 1', role: 'brigadista', lat: 27.1, lng: -109.1 },
        { id: '3', nombre: 'Movilizador 1', role: 'movilizador', lat: 27.2, lng: -109.2 },
        { id: '4', nombre: 'Ciudadano 1', role: 'ciudadano', lat: 27.3, lng: -109.3 }
    ];

    it('renders separate sources for each role', () => {
        render(<AffiliateMarkerLayerLibre data={mockData as any} />);
        
        // Should have 4 sources
        expect(screen.getByTestId('source-lideres-source')).toBeInTheDocument();
        expect(screen.getByTestId('source-brigadistas-source')).toBeInTheDocument();
        expect(screen.getByTestId('source-movilizadores-source')).toBeInTheDocument();
        expect(screen.getByTestId('source-ciudadanos-source')).toBeInTheDocument();
    });
});
