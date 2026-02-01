import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import NavojoaMapLibre from '../NavojoaMapLibre';
import React from 'react';

// Mock maplibre
vi.mock('react-map-gl/maplibre', () => ({
    default: ({ children }: any) => <div data-testid="map-root">{children}</div>,
    NavigationControl: () => <div data-testid="nav-control" />,
    Source: () => null,
    Layer: () => null,
    useMap: () => ({
        current: {
            getCanvas: () => ({ style: { cursor: '' } }),
            resize: vi.fn(),
            getMap: () => ({
                setFeatureState: vi.fn(),
                queryRenderedFeatures: vi.fn(() => []),
                getCanvas: () => ({ style: { cursor: '' } }),
                getSource: vi.fn(),
                easeTo: vi.fn(),
                hasImage: vi.fn(() => true),
                addImage: vi.fn()
            })
        }
    }),
    Marker: () => null,
    Popup: () => null
}));

// Mock services
vi.mock('../../../services/navojoaElectoralService', () => ({
    navojoaElectoralService: {
        transformHierarchicalDataToSections: vi.fn(() => [])
    }
}));

describe('NavojoaMapLibre UI', () => {
    it('renders with correct z-index classes for containment', () => {
        const { container } = render(<NavojoaMapLibre />);
        
        // Map container should have z-0 to establish stacking context
        const mapContainer = container.firstChild;
        expect(mapContainer).toHaveClass('z-0');
    });

    it('renders filter controls with appropriate z-index', () => {
        render(<NavojoaMapLibre />);
        
        // Role selector container should use z-10 (not z-[1000])
        const roleSelector = screen.getByRole('combobox');
        const selectorContainer = roleSelector.closest('div');
        expect(selectorContainer).toHaveClass('absolute');
        expect(selectorContainer).toHaveClass('z-10');
        expect(selectorContainer).not.toHaveClass('z-[1000]');
    });

    it('renders full screen toggle with appropriate z-index', () => {
        render(<NavojoaMapLibre />);
        
        const maximizeBtn = screen.getByTitle(/Pantalla completa/i);
        const controlsContainer = maximizeBtn.closest('div');
        expect(controlsContainer).toHaveClass('absolute');
        expect(controlsContainer).toHaveClass('z-10');
        expect(controlsContainer).not.toHaveClass('z-[1000]');
    });
});
