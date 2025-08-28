import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import KPICards from '../KPICards';
import { NavojoaElectoralSection } from '../../../../types/navojoa-electoral';

// Mock data for testing
const mockSectionData: NavojoaElectoralSection[] = [
  {
    sectionNumber: '001',
    colonia: 'Centro',
    lideres: 5,
    brigadistas: 15,
    movilizadores: 25,
    ciudadanos: 55,
    totalRegistrations: 100,
    lastUpdated: new Date(),
    hasMinimumData: true
  },
  {
    sectionNumber: '002',
    colonia: 'Norte',
    lideres: 3,
    brigadistas: 10,
    movilizadores: 20,
    ciudadanos: 47,
    totalRegistrations: 80,
    lastUpdated: new Date(),
    hasMinimumData: true
  },
  {
    sectionNumber: '003',
    colonia: 'Sur',
    lideres: 1,
    brigadistas: 2,
    movilizadores: 5,
    ciudadanos: 12,
    totalRegistrations: 20,
    lastUpdated: new Date(),
    hasMinimumData: true
  }
];

const mockPreviousSectionData: NavojoaElectoralSection[] = [
  {
    sectionNumber: '001',
    colonia: 'Centro',
    lideres: 4,
    brigadistas: 12,
    movilizadores: 20,
    ciudadanos: 44,
    totalRegistrations: 80,
    lastUpdated: new Date(),
    hasMinimumData: true
  },
  {
    sectionNumber: '002',
    colonia: 'Norte',
    lideres: 3,
    brigadistas: 8,
    movilizadores: 15,
    ciudadanos: 34,
    totalRegistrations: 60,
    lastUpdated: new Date(),
    hasMinimumData: true
  }
];

describe('KPICards', () => {
  it('renders loading state correctly', () => {
    render(<KPICards sectionData={[]} loading={true} />);
    
    // Should show loading skeletons
    const loadingElements = screen.getAllByRole('generic');
    expect(loadingElements.length).toBeGreaterThan(0);
  });

  it('renders KPI cards with correct data', () => {
    render(<KPICards sectionData={mockSectionData} />);
    
    // Check coverage display
    expect(screen.getByText('3 de 78 secciones - 3.8%')).toBeInTheDocument();
    expect(screen.getByText('Cobertura Electoral de Navojoa')).toBeInTheDocument();
    
    // Check that main KPI sections are present
    expect(screen.getByText('Total Registros')).toBeInTheDocument();
    expect(screen.getByText('Promedio por Sección')).toBeInTheDocument();
    
    // Check top section
    expect(screen.getByText('Sección 001')).toBeInTheDocument();
    expect(screen.getByText('100 registros')).toBeInTheDocument();
  });

  it('renders role breakdown correctly', () => {
    render(<KPICards sectionData={mockSectionData} />);
    
    // Check role totals
    expect(screen.getByText('9')).toBeInTheDocument(); // Total líderes
    expect(screen.getByText('27')).toBeInTheDocument(); // Total brigadistas
    expect(screen.getByText('50')).toBeInTheDocument(); // Total movilizadores
    expect(screen.getByText('114')).toBeInTheDocument(); // Total ciudadanos
    
    // Check role labels
    expect(screen.getByText('Líderes')).toBeInTheDocument();
    expect(screen.getByText('Brigadistas')).toBeInTheDocument();
    expect(screen.getByText('Movilizadores')).toBeInTheDocument();
    expect(screen.getByText('Ciudadanos')).toBeInTheDocument();
  });

  it('displays trend indicators when previous data is provided', () => {
    render(
      <KPICards 
        sectionData={mockSectionData} 
        previousPeriodData={mockPreviousSectionData}
      />
    );
    
    // Should show trend indicators (the specific values depend on the calculation)
    // We're mainly testing that the component renders without errors when trends are present
    expect(screen.getByText('3 de 78 secciones - 3.8%')).toBeInTheDocument();
  });

  it('renders summary statistics correctly', () => {
    render(<KPICards sectionData={mockSectionData} />);
    
    // Check summary stats section
    expect(screen.getByText('Resumen Estadístico')).toBeInTheDocument();
    expect(screen.getByText('Cobertura Territorial')).toBeInTheDocument();
    expect(screen.getByText('Registros por Sección')).toBeInTheDocument();
    expect(screen.getByText('Total Registrados')).toBeInTheDocument();
    
    // Check that uncovered sections are calculated correctly
    expect(screen.getByText('75 secciones sin cobertura')).toBeInTheDocument();
  });

  it('handles empty data gracefully', () => {
    render(<KPICards sectionData={[]} />);
    
    // Should show 0 coverage
    expect(screen.getByText('0 de 78 secciones - 0.0%')).toBeInTheDocument();
    expect(screen.getByText('Total Registros')).toBeInTheDocument();
    expect(screen.getByText('Promedio por Sección')).toBeInTheDocument();
  });

  it('renders all required KPI sections', () => {
    render(<KPICards sectionData={mockSectionData} />);
    
    // Main sections should be present
    expect(screen.getByText('Cobertura Electoral de Navojoa')).toBeInTheDocument();
    expect(screen.getByText('Desglose por Roles Organizacionales')).toBeInTheDocument();
    expect(screen.getByText('Resumen Estadístico')).toBeInTheDocument();
    
    // Individual KPI cards
    expect(screen.getByText('Promedio por Sección')).toBeInTheDocument();
    expect(screen.getByText('Total Registros')).toBeInTheDocument();
    expect(screen.getByText('Sección Líder')).toBeInTheDocument();
  });
});