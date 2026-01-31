import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ElectoralSectionLayerLibre } from '../ElectoralSectionLayerLibre';
import React from 'react';

// Mock react-map-gl/maplibre
vi.mock('react-map-gl/maplibre', () => ({
    Source: ({ children }: { children: React.ReactNode }) => <div data-testid="source">{children}</div>,
    Layer: ({ id }: { id: string }) => <div data-testid={`layer-${id}`} />,
    useMap: () => ({
        current: {
            getCanvas: () => ({ style: { cursor: '' } })
        }
    })
}));

// Mock services
vi.mock('../../../services/navojoaElectoralService', () => ({
    navojoaElectoralService: {
        transformHierarchicalDataToSections: vi.fn(() => [])
    }
}));

vi.mock('../../../services/dataService', () => ({
    DataService: {
        getAllHierarchicalData: vi.fn(() => Promise.resolve([]))
    }
}));

describe('ElectoralSectionLayerLibre', () => {
    const mockOnSectionSelect = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        // Mock fetch for GeoJSON
        global.fetch = vi.fn(() =>
            Promise.resolve({
                ok: true,
                json: () => Promise.resolve({
                    type: 'FeatureCollection',
                    features: [
                        {
                            type: 'Feature',
                            properties: { SECCION: '123' },
                            geometry: { type: 'Polygon', coordinates: [] }
                        }
                    ]
                }),
            })
        ) as any;
    });

    it('renders the source and layers', async () => {
        render(
            <ElectoralSectionLayerLibre 
                onSectionSelect={mockOnSectionSelect} 
                selectedSectionId={null} 
                hoveredSectionId={null} 
            />
        );
        
        // Wait for async loading
        const source = await screen.findByTestId('source');
        expect(source).toBeInTheDocument();
        expect(screen.getByTestId('layer-sections-fill')).toBeInTheDocument();
        expect(screen.getByTestId('layer-sections-outline')).toBeInTheDocument();
        expect(screen.getByTestId('layer-sections-labels')).toBeInTheDocument();
    });
});
