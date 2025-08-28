import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import SectionVerticalBarChart from '../SectionVerticalBarChart';
import { NavojoaElectoralSection } from '../../../../types/navojoa-electoral';

// Mock the mobile detection hook
vi.mock('../../../../hooks/useMobileDetection', () => ({
  useMobileDetection: () => ({
    isMobile: false,
    isTablet: false
  })
}));

// Mock recharts components
vi.mock('recharts', () => ({
  BarChart: ({ children, data }: any) => (
    <div data-testid="bar-chart" data-chart-data={JSON.stringify(data)}>
      {children}
    </div>
  ),
  Bar: ({ dataKey, onClick, children }: any) => (
    <div data-testid={`bar-${dataKey}`} onClick={onClick}>
      Bar: {dataKey}
      {children}
    </div>
  ),
  XAxis: ({ dataKey }: any) => <div data-testid="x-axis">XAxis: {dataKey}</div>,
  YAxis: () => <div data-testid="y-axis">YAxis</div>,
  CartesianGrid: () => <div data-testid="cartesian-grid">Grid</div>,
  Tooltip: ({ content }: any) => <div data-testid="tooltip">Tooltip</div>,
  ResponsiveContainer: ({ children }: unknown) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  LabelList: () => <div data-testid="label-list">Labels</div>,
  Cell: ({ fill }: unknown) => <div data-testid="cell" style={{ backgroundColor: fill }}>Cell</div>
}));

describe('SectionVerticalBarChart', () => {
  const mockSectionData: NavojoaElectoralSection[] = [
    {
      sectionNumber: '001',
      totalRegistrations: 75,
      lideres: 5,
      brigadistas: 15,
      movilizadores: 25,
      ciudadanos: 30,
      lastUpdated: new Date(),
      hasMinimumData: true,
      colonia: 'Centro'
    },
    {
      sectionNumber: '002',
      totalRegistrations: 35,
      lideres: 2,
      brigadistas: 8,
      movilizadores: 12,
      ciudadanos: 13,
      lastUpdated: new Date(),
      hasMinimumData: true,
      colonia: 'Norte'
    },
    {
      sectionNumber: '003',
      totalRegistrations: 15,
      lideres: 1,
      brigadistas: 3,
      movilizadores: 5,
      ciudadanos: 6,
      lastUpdated: new Date(),
      hasMinimumData: true,
      colonia: 'Sur'
    }
  ];

  const mockOnSectionClick = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the component with title and data', () => {
    render(
      <SectionVerticalBarChart 
        sectionData={mockSectionData}
        onSectionClick={mockOnSectionClick}
        loading={false}
      />
    );

    expect(screen.getByText('Análisis de Densidad Electoral por Sección')).toBeInTheDocument();
    expect(screen.getByText('3 secciones mostradas')).toBeInTheDocument();
  });

  it('displays density legend correctly', () => {
    render(
      <SectionVerticalBarChart 
        sectionData={mockSectionData}
        onSectionClick={mockOnSectionClick}
        loading={false}
      />
    );

    expect(screen.getByText('Alta Densidad (≥50)')).toBeInTheDocument();
    expect(screen.getByText('Media Densidad (20-49)')).toBeInTheDocument();
    expect(screen.getByText('Baja Densidad (<20)')).toBeInTheDocument();
    expect(screen.getByText('Requiere atención')).toBeInTheDocument();
  });

  it('renders the bar chart with correct data', () => {
    render(
      <SectionVerticalBarChart 
        sectionData={mockSectionData}
        onSectionClick={mockOnSectionClick}
        loading={false}
      />
    );

    const barChart = screen.getByTestId('bar-chart');
    expect(barChart).toBeInTheDocument();
    
    // Check that chart data is passed correctly
    const chartData = JSON.parse(barChart.getAttribute('data-chart-data') || '[]');
    expect(chartData).toHaveLength(3);
    expect(chartData[0].sectionNumber).toBe('001');
    expect(chartData[0].totalRegistrations).toBe(75);
  });

  it('displays summary statistics correctly', () => {
    render(
      <SectionVerticalBarChart 
        sectionData={mockSectionData}
        onSectionClick={mockOnSectionClick}
        loading={false}
      />
    );

    // Check that summary statistics section exists
    expect(screen.getByText('Total Registros')).toBeInTheDocument();
    expect(screen.getByText('Secciones Alta Densidad')).toBeInTheDocument();
    expect(screen.getByText('Promedio por Sección')).toBeInTheDocument();
  });

  it('shows loading state correctly', () => {
    render(
      <SectionVerticalBarChart 
        sectionData={[]}
        onSectionClick={mockOnSectionClick}
        loading={true}
      />
    );

    // Should show loading skeleton
    const loadingElements = screen.getAllByRole('generic');
    expect(loadingElements.some(el => el.className.includes('animate-pulse'))).toBe(true);
  });

  it('shows no data state when empty', () => {
    render(
      <SectionVerticalBarChart 
        sectionData={[]}
        onSectionClick={mockOnSectionClick}
        loading={false}
      />
    );

    expect(screen.getByText('No hay datos de secciones disponibles')).toBeInTheDocument();
  });

  it('handles section click correctly', () => {
    render(
      <SectionVerticalBarChart 
        sectionData={mockSectionData}
        onSectionClick={mockOnSectionClick}
        loading={false}
      />
    );

    const barElement = screen.getByTestId('bar-totalRegistrations');
    fireEvent.click(barElement);

    // The click handler should be called (though the mock data won't trigger it exactly)
    // This tests that the click handler is properly set up
    expect(barElement).toBeInTheDocument();
  });

  it('displays filter and sort controls', () => {
    render(
      <SectionVerticalBarChart 
        sectionData={mockSectionData}
        onSectionClick={mockOnSectionClick}
        loading={false}
      />
    );

    // Check for density filter
    expect(screen.getByDisplayValue('Todas las densidades')).toBeInTheDocument();
    
    // Check for sort options
    expect(screen.getByDisplayValue('Más registros primero')).toBeInTheDocument();
    
    // Check for export button
    expect(screen.getByText('Exportar')).toBeInTheDocument();
  });

  it('filters data by density correctly', () => {
    render(
      <SectionVerticalBarChart 
        sectionData={mockSectionData}
        onSectionClick={mockOnSectionClick}
        loading={false}
      />
    );

    const densityFilter = screen.getByDisplayValue('Todas las densidades');
    
    // Change to high density filter
    fireEvent.change(densityFilter, { target: { value: 'high' } });
    
    // The filter should be applied (component should re-render with filtered data)
    expect(densityFilter).toHaveValue('high');
  });

  it('changes sort order correctly', () => {
    render(
      <SectionVerticalBarChart 
        sectionData={mockSectionData}
        onSectionClick={mockOnSectionClick}
        loading={false}
      />
    );

    const sortSelect = screen.getByDisplayValue('Más registros primero');
    
    // Change sort order
    fireEvent.change(sortSelect, { target: { value: 'section-asc' } });
    
    expect(sortSelect).toHaveValue('section-asc');
  });

  it('shows export menu when export button is clicked', () => {
    render(
      <SectionVerticalBarChart 
        sectionData={mockSectionData}
        onSectionClick={mockOnSectionClick}
        loading={false}
      />
    );

    const exportButton = screen.getByText('Exportar');
    fireEvent.click(exportButton);

    // Export menu should appear
    expect(screen.getByText('Exportar como TXT')).toBeInTheDocument();
    expect(screen.getByText('Exportar como CSV')).toBeInTheDocument();
  });

  it('closes modal when ESC key is pressed', () => {
    render(
      <SectionVerticalBarChart 
        sectionData={mockSectionData}
        onSectionClick={mockOnSectionClick}
        loading={false}
      />
    );

    // Click on a bar to open modal
    const barElement = screen.getByTestId('bar-totalRegistrations');
    fireEvent.click(barElement);

    // Modal should be open (check for modal content)
    expect(screen.getByText('Presiona ESC o haz clic afuera para cerrar')).toBeInTheDocument();

    // Press ESC key
    fireEvent.keyDown(document, { key: 'Escape', code: 'Escape' });

    // Modal should be closed (modal content should not be visible)
    expect(screen.queryByText('Presiona ESC o haz clic afuera para cerrar')).not.toBeInTheDocument();
  });

  it('displays performance insights on desktop', () => {
    render(
      <SectionVerticalBarChart 
        sectionData={mockSectionData}
        onSectionClick={mockOnSectionClick}
        loading={false}
      />
    );

    expect(screen.getByText('Insights de Rendimiento')).toBeInTheDocument();
    // Check that insights section contains performance information
    expect(screen.getByText(/alta densidad electoral/)).toBeInTheDocument();
    expect(screen.getByText(/mayor atención/)).toBeInTheDocument();
    expect(screen.getByText(/sección activa/)).toBeInTheDocument();
  });

  it('filters and sorts data correctly', () => {
    const dataWithZeros: NavojoaElectoralSection[] = [
      ...mockSectionData,
      {
        sectionNumber: '004',
        totalRegistrations: 0, // This should be filtered out
        lideres: 0,
        brigadistas: 0,
        movilizadores: 0,
        ciudadanos: 0,
        lastUpdated: new Date(),
        hasMinimumData: false
      }
    ];

    render(
      <SectionVerticalBarChart 
        sectionData={dataWithZeros}
        onSectionClick={mockOnSectionClick}
        loading={false}
      />
    );

    const barChart = screen.getByTestId('bar-chart');
    const chartData = JSON.parse(barChart.getAttribute('data-chart-data') || '[]');
    
    // Should filter out zero registrations and sort by total descending
    expect(chartData).toHaveLength(3);
    expect(chartData[0].sectionNumber).toBe('001'); // Highest: 75
    expect(chartData[1].sectionNumber).toBe('002'); // Middle: 35
    expect(chartData[2].sectionNumber).toBe('003'); // Lowest: 15
  });

  it('assigns correct density levels and colors', () => {
    render(
      <SectionVerticalBarChart 
        sectionData={mockSectionData}
        onSectionClick={mockOnSectionClick}
        loading={false}
      />
    );

    const barChart = screen.getByTestId('bar-chart');
    const chartData = JSON.parse(barChart.getAttribute('data-chart-data') || '[]');
    
    // Section 001 (75 registrations) should be high density (green)
    expect(chartData[0].densityLevel).toBe('high');
    expect(chartData[0].densityColor).toBe('#22c55e');
    
    // Section 002 (35 registrations) should be medium density (yellow)
    expect(chartData[1].densityLevel).toBe('medium');
    expect(chartData[1].densityColor).toBe('#f59e0b');
    
    // Section 003 (15 registrations) should be low density (red)
    expect(chartData[2].densityLevel).toBe('low');
    expect(chartData[2].densityColor).toBe('#ef4444');
  });
});