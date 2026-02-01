import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import NavojoaMapLibre from '../NavojoaMapLibre';

// Mock react-map-gl/maplibre
vi.mock('react-map-gl/maplibre', () => ({
    default: ({ children }: { children: React.ReactNode }) => <div data-testid="map-container">{children}</div>,
    NavigationControl: () => <div data-testid="nav-control" />,
    Source: ({ children }: { children: React.ReactNode }) => <div data-testid="source">{children}</div>,
    Layer: () => <div data-testid="layer" />,
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
    Marker: ({ children }: { children: React.ReactNode }) => <div data-testid="marker">{children}</div>,
    Popup: ({ children }: { children: React.ReactNode }) => <div data-testid="popup">{children}</div>
}));

describe('NavojoaMapLibre', () => {
    it('renders the map container', () => {
        render(<NavojoaMapLibre />);
        expect(screen.getByTestId('map-container')).toBeInTheDocument();
    });

    it('renders navigation controls', () => {
        render(<NavojoaMapLibre />);
        expect(screen.getByTestId('nav-control')).toBeInTheDocument();
    });
});
