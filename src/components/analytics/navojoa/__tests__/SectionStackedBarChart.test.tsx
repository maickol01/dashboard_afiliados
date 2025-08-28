import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import SectionStackedBarChart from '../SectionStackedBarChart';
import { NavojoaElectoralSection } from '../../../../types/navojoa-electoral';

// Mock recharts to avoid canvas issues in tests
vi.mock('recharts', () => ({
  BarChart: ({ children, data }: any) => (
    <div data-testid="bar-chart" data-chart-data={JSON.stringify(data)}>
      {children}
    </div>
  ),
  Bar: ({ dataKey, onClick }: any) => (
    <div 
      data-testid={`bar-${dataKey}`}
      onClick={() => onClick && onClick({ sectionNumber: '001' })}
    >
      {dataKey}
    </div>
  ),
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  ResponsiveContainer: ({ children }: any) => <div data-testid="responsive-container">{children}</div>,
  Cell: () => <div data-testid="cell" />
}));

const mockSectionData: NavojoaElectoralSection[] = [
  {
    sectionNumber: '001',
    colonia: 'Centro',
    lideres: 5,
    brigadistas: 8,
    movilizadores: 12,
    ciudadanos: 25,
    totalRegistrations: 50,
    lastUpdated: new Date(),
    hasMinimumData: true
  },
  {
    sectionNumber: '002',
    colonia: 'Norte',
    lideres: 2,
    brigadistas: 3,
    movilizadores: 5,
    ciudadanos: 15,
    totalRegistrations: 25,
    lastUpdated: new Date(),
    hasMinimumData: true
  },
  {
    sectionNumber: '003',
    colonia: 'Sur',
    lideres: 1,
    brigadistas: 0,
    movilizadores: 1,
    ciudadanos: 0,
    totalRegistrations: 2,
    lastUpdated: new Date(),
    hasMinimumData: false // Less than 3 registrations
  },
  {
    sectionNumber: '004',
    colonia: 'Este',
    lideres: 0,
    brigadistas: 0,
    movilizadores: 0,
    ciudadanos: 0,
    totalRegistrations: 0,
    lastUpdated: new Date(),
    hasMinimumData: false
  }
];

describe('SectionStackedBarChart', () => {
  it('renders the component with title and section count', () => {
    render(<SectionStackedBarChart sectionData={mockSectionData} />);
    
    expect(screen.getByText('Distribución por Secciones Electorales')).toBeInTheDocument();
    expect(screen.getByText('3 secciones con registros')).toBeInTheDocument();
  });

  it('filters out sections with zero registrations', () => {
    render(<SectionStackedBarChart sectionData={mockSectionData} />);
    
    const chartElement = screen.getByTestId('bar-chart');
    const chartData = JSON.parse(chartElement.getAttribute('data-chart-data') || '[]');
    
    // Should only include sections with registrations > 0
    expect(chartData).toHaveLength(3);
    expect(chartData.find((item: any) => item.sectionNumber === '004')).toBeUndefined();
  });

  it('orders sections from highest to lowest registration count', () => {
    render(<SectionStackedBarChart sectionData={mockSectionData} />);
    
    const chartElement = screen.getByTestId('bar-chart');
    const chartData = JSON.parse(chartElement.getAttribute('data-chart-data') || '[]');
    
    // Should be ordered: 001 (50), 002 (25), 003 (2)
    expect(chartData[0].sectionNumber).toBe('001');
    expect(chartData[0].totalRegistrations).toBe(50);
    expect(chartData[1].sectionNumber).toBe('002');
    expect(chartData[1].totalRegistrations).toBe(25);
    expect(chartData[2].sectionNumber).toBe('003');
    expect(chartData[2].totalRegistrations).toBe(2);
  });

  it('displays legend with all role types', () => {
    render(<SectionStackedBarChart sectionData={mockSectionData} />);
    
    expect(screen.getByText('Líderes')).toBeInTheDocument();
    expect(screen.getByText('Brigadistas')).toBeInTheDocument();
    expect(screen.getByText('Movilizadores')).toBeInTheDocument();
    expect(screen.getByText('Ciudadanos')).toBeInTheDocument();
    expect(screen.getByText('Menos de 3 registros')).toBeInTheDocument();
  });

  it('renders all role bars in the chart', () => {
    render(<SectionStackedBarChart sectionData={mockSectionData} />);
    
    expect(screen.getByTestId('bar-lideres')).toBeInTheDocument();
    expect(screen.getByTestId('bar-brigadistas')).toBeInTheDocument();
    expect(screen.getByTestId('bar-movilizadores')).toBeInTheDocument();
    expect(screen.getByTestId('bar-ciudadanos')).toBeInTheDocument();
  });

  it('displays summary statistics correctly', () => {
    render(<SectionStackedBarChart sectionData={mockSectionData} />);
    
    expect(screen.getByText('3')).toBeInTheDocument(); // Active sections
    expect(screen.getByText('Secciones Activas')).toBeInTheDocument();
    expect(screen.getByText('77')).toBeInTheDocument(); // Total registrations (50+25+2)
    expect(screen.getByText('Total Registros')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument(); // Sections with <3 registrations
    expect(screen.getByText('Secciones con <3 registros')).toBeInTheDocument();
  });

  it('calls onSectionClick when a bar is clicked', async () => {
    const mockOnSectionClick = vi.fn();
    render(
      <SectionStackedBarChart 
        sectionData={mockSectionData} 
        onSectionClick={mockOnSectionClick}
      />
    );
    
    const lideresBar = screen.getByTestId('bar-lideres');
    fireEvent.click(lideresBar);
    
    await waitFor(() => {
      expect(mockOnSectionClick).toHaveBeenCalledWith('001');
    });
  });

  it('shows loading state when loading prop is true', () => {
    render(<SectionStackedBarChart sectionData={[]} loading={true} />);
    
    // Should show loading skeleton instead of chart
    expect(screen.queryByTestId('bar-chart')).not.toBeInTheDocument();
    // Should show animate-pulse class for loading state
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('shows no data state when no sections have registrations', () => {
    const emptySectionData: NavojoaElectoralSection[] = [
      {
        sectionNumber: '001',
        colonia: 'Centro',
        lideres: 0,
        brigadistas: 0,
        movilizadores: 0,
        ciudadanos: 0,
        totalRegistrations: 0,
        lastUpdated: new Date(),
        hasMinimumData: false
      }
    ];

    render(<SectionStackedBarChart sectionData={emptySectionData} />);
    
    expect(screen.getByText('No hay datos de secciones disponibles')).toBeInTheDocument();
  });

  it('includes all required data fields in chart data', () => {
    render(<SectionStackedBarChart sectionData={mockSectionData} />);
    
    const chartElement = screen.getByTestId('bar-chart');
    const chartData = JSON.parse(chartElement.getAttribute('data-chart-data') || '[]');
    
    const firstSection = chartData[0];
    expect(firstSection).toHaveProperty('sectionNumber');
    expect(firstSection).toHaveProperty('lideres');
    expect(firstSection).toHaveProperty('brigadistas');
    expect(firstSection).toHaveProperty('movilizadores');
    expect(firstSection).toHaveProperty('ciudadanos');
    expect(firstSection).toHaveProperty('totalRegistrations');
    expect(firstSection).toHaveProperty('hasMinimumData');
    expect(firstSection).toHaveProperty('colonia');
  });

  it('correctly identifies sections with minimum data', () => {
    render(<SectionStackedBarChart sectionData={mockSectionData} />);
    
    const chartElement = screen.getByTestId('bar-chart');
    const chartData = JSON.parse(chartElement.getAttribute('data-chart-data') || '[]');
    
    // Section 001 and 002 should have minimum data (>=3 registrations)
    const section001 = chartData.find((item: any) => item.sectionNumber === '001');
    const section002 = chartData.find((item: any) => item.sectionNumber === '002');
    const section003 = chartData.find((item: unknown) => item.sectionNumber === '003');
    
    expect(section001.hasMinimumData).toBe(true);
    expect(section002.hasMinimumData).toBe(true);
    expect(section003.hasMinimumData).toBe(false);
  });
});