import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, it, expect } from 'vitest';
import SectionHeatMap from '../SectionHeatMap';
import { NavojoaElectoralSection } from '../../../../types/navojoa-electoral';

const mockSectionData: NavojoaElectoralSection[] = [
  {
    sectionNumber: '0001',
    colonia: 'Centro',
    lideres: 2,
    brigadistas: 5,
    movilizadores: 8,
    ciudadanos: 15,
    totalRegistrations: 30,
    lastUpdated: new Date(),
    hasMinimumData: true
  },
  {
    sectionNumber: '0002',
    colonia: 'Norte',
    lideres: 1,
    brigadistas: 2,
    movilizadores: 3,
    ciudadanos: 4,
    totalRegistrations: 10,
    lastUpdated: new Date(),
    hasMinimumData: true
  },
  {
    sectionNumber: '0003',
    colonia: 'Sur',
    lideres: 0,
    brigadistas: 1,
    movilizadores: 1,
    ciudadanos: 0,
    totalRegistrations: 2,
    lastUpdated: new Date(),
    hasMinimumData: false
  }
];

describe('SectionHeatMap', () => {

  it('renders the heat map title correctly', () => {
    render(<SectionHeatMap sectionData={mockSectionData} />);
    
    expect(screen.getByText('Mapa de Calor - Secciones Electorales de Navojoa')).toBeInTheDocument();
    expect(screen.getByText('78 secciones totales')).toBeInTheDocument();
  });

  it('displays color scale legend', () => {
    render(<SectionHeatMap sectionData={mockSectionData} />);
    
    expect(screen.getByText('Intensidad de Registros')).toBeInTheDocument();
    expect(screen.getByText('Sin datos')).toBeInTheDocument();
    expect(screen.getByText('Bajo')).toBeInTheDocument();
    expect(screen.getByText('Medio')).toBeInTheDocument();
    expect(screen.getByText('Alto')).toBeInTheDocument();
    expect(screen.getByText('Máximo')).toBeInTheDocument();
  });

  it('renders all 78 sections in the heat map grid', () => {
    render(<SectionHeatMap sectionData={mockSectionData} />);
    
    // Should render all 78 sections (including those without data)
    const gridContainer = document.querySelector('.grid');
    expect(gridContainer).toBeInTheDocument();
    
    // Should have 78 section cells with the specific class pattern for heat map cells
    const sectionCells = document.querySelectorAll('.grid > div[title*="Sección"]');
    expect(sectionCells).toHaveLength(78);
  });

  it('displays correct statistics', () => {
    render(<SectionHeatMap sectionData={mockSectionData} />);
    
    // Should show sections with data
    expect(screen.getByText('Secciones con Datos')).toBeInTheDocument();
    expect(screen.getByText('Sin Cobertura')).toBeInTheDocument();
    expect(screen.getByText('Total Registros')).toBeInTheDocument();
  });

  it('renders loading state correctly', () => {
    render(<SectionHeatMap sectionData={[]} loading={true} />);
    
    // Should show loading animation
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('supports different color scales', () => {
    render(<SectionHeatMap sectionData={mockSectionData} colorScale="blue" />);
    
    // Component should render without errors with different color scale
    expect(screen.getByText('Mapa de Calor - Secciones Electorales de Navojoa')).toBeInTheDocument();
  });
});