import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import KPICards from '../KPICards';
import SectionStackedBarChart from '../SectionStackedBarChart';
import SectionHeatMap from '../SectionHeatMap';
import { NavojoaElectoralSection } from '../../../../types/navojoa-electoral';

// Mock the mobile detection hook
vi.mock('../../../../hooks/useMobileDetection', () => ({
  useMobileDetection: vi.fn()
}));

import { useMobileDetection } from '../../../../hooks/useMobileDetection';
const mockUseMobileDetection = vi.mocked(useMobileDetection);

// Mock recharts components
vi.mock('recharts', () => ({
  BarChart: ({ children }: any) => <div data-testid="bar-chart">{children}</div>,
  Bar: () => <div data-testid="bar" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  ResponsiveContainer: ({ children }: unknown) => <div data-testid="responsive-container">{children}</div>,
  Cell: () => <div data-testid="cell" />
}));

const mockSectionData: NavojoaElectoralSection[] = [
  {
    sectionNumber: '0001',
    lideres: 5,
    brigadistas: 8,
    movilizadores: 12,
    ciudadanos: 25,
    totalRegistrations: 50,
    hasMinimumData: true,
    lastUpdated: new Date(),
    colonia: 'Centro'
  },
  {
    sectionNumber: '0002',
    lideres: 2,
    brigadistas: 3,
    movilizadores: 5,
    ciudadanos: 15,
    totalRegistrations: 25,
    hasMinimumData: true,
    lastUpdated: new Date(),
    colonia: 'Norte'
  }
];

describe('Mobile Responsiveness', () => {

  beforeEach(() => {
    // Reset mocks
    mockUseMobileDetection.mockReset();
  });

  describe('KPICards Mobile Layout', () => {
    it('should render mobile layout correctly', () => {
      mockUseMobileDetection.mockReturnValue({
        isMobile: true,
        isTablet: false,
        isDesktop: false,
        screenWidth: 600
      });

      render(<KPICards sectionData={mockSectionData} />);

      // Check that component renders without errors in mobile mode
      expect(screen.getByText('Cobertura Electoral de Navojoa')).toBeInTheDocument();
      expect(screen.getByText(/2.*de 78 secciones/)).toBeInTheDocument();
    });

    it('should render desktop layout correctly', () => {
      mockUseMobileDetection.mockReturnValue({
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        screenWidth: 1200
      });

      render(<KPICards sectionData={mockSectionData} />);

      // Check that component renders without errors in desktop mode
      expect(screen.getByText('Cobertura Electoral de Navojoa')).toBeInTheDocument();
      expect(screen.getByText(/2.*de 78 secciones/)).toBeInTheDocument();
    });
  });

  describe('SectionStackedBarChart Mobile Layout', () => {
    it('should limit data and adjust layout for mobile', () => {
      mockUseMobileDetection.mockReturnValue({
        isMobile: true,
        isTablet: false,
        isDesktop: false,
        screenWidth: 600
      });

      render(<SectionStackedBarChart sectionData={mockSectionData} />);

      // Check that mobile-specific elements are present
      const title = screen.getByText('Top Secciones por Registros');
      expect(title).toHaveClass('text-base'); // Mobile font size
    });

    it('should use full layout for desktop', () => {
      mockUseMobileDetection.mockReturnValue({
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        screenWidth: 1200
      });

      render(<SectionStackedBarChart sectionData={mockSectionData} />);

      // Check that desktop-specific elements are present
      const title = screen.getByText('Top Secciones por Registros');
      expect(title).toHaveClass('text-lg'); // Desktop font size
    });
  });

  describe('SectionHeatMap Mobile Layout', () => {
    it('should adjust grid and layout for mobile', () => {
      mockUseMobileDetection.mockReturnValue({
        isMobile: true,
        isTablet: false,
        isDesktop: false,
        screenWidth: 600
      });

      render(<SectionHeatMap sectionData={mockSectionData} />);

      // Check that mobile-specific elements are present
      const title = screen.getByText('Mapa de Calor - Secciones Electorales de Navojoa');
      expect(title).toHaveClass('text-base'); // Mobile font size
    });

    it('should use full layout for desktop', () => {
      mockUseMobileDetection.mockReturnValue({
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        screenWidth: 1200
      });

      render(<SectionHeatMap sectionData={mockSectionData} />);

      // Check that desktop-specific elements are present
      const title = screen.getByText('Mapa de Calor - Secciones Electorales de Navojoa');
      expect(title).toHaveClass('text-lg'); // Desktop font size
    });
  });

  describe('Touch Interactions', () => {
    it('should add touch-manipulation class for mobile heat map', () => {
      mockUseMobileDetection.mockReturnValue({
        isMobile: true,
        isTablet: false,
        isDesktop: false,
        screenWidth: 600
      });

      render(<SectionHeatMap sectionData={mockSectionData} />);

      // Check for touch-optimized elements
      const heatMapCells = screen.getAllByTitle(/Sección \d+: \d+ registros/);
      expect(heatMapCells[0]).toHaveClass('touch-manipulation');
    });
  });

  describe('Loading States', () => {
    it('should show mobile-optimized loading state', () => {
      mockUseMobileDetection.mockReturnValue({
        isMobile: true,
        isTablet: false,
        isDesktop: false,
        screenWidth: 600
      });

      render(<KPICards sectionData={[]} loading={true} />);

      // Check that loading skeleton uses mobile layout
      const loadingCards = screen.getAllByRole('generic').filter(el => 
        el.className.includes('animate-pulse')
      );
      expect(loadingCards.length).toBeGreaterThan(0);
    });
  });
});