import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import KPICards from '../KPICards';
import SectionHeatMap from '../SectionHeatMap';
import { navojoaElectoralService } from '../../../../services/navojoaElectoralService';
import { Person } from '../../../../types';

// Mock hierarchical data for integration testing
const mockHierarchicalData: Person[] = [
  {
    id: '1',
    name: 'Juan Pérez',
    nombre: 'Juan Pérez',
    role: 'lider',
    created_at: new Date(),
    registeredCount: 0,
    seccion: '001',
    colonia: 'Centro',
    num_verificado: true,
    children: [
      {
        id: '2',
        name: 'María García',
        nombre: 'María García',
        role: 'brigadista',
        created_at: new Date(),
        registeredCount: 0,
        seccion: '001',
        colonia: 'Centro',
        num_verificado: true,
        lider_id: '1',
        children: [
          {
            id: '3',
            name: 'Carlos López',
            nombre: 'Carlos López',
            role: 'movilizador',
            created_at: new Date(),
            registeredCount: 0,
            seccion: '001',
            colonia: 'Centro',
            num_verificado: true,
            brigadista_id: '2',
            children: [
              {
                id: '4',
                name: 'Ana Martínez',
                nombre: 'Ana Martínez',
                role: 'ciudadano',
                created_at: new Date(),
                registeredCount: 0,
                seccion: '001',
                colonia: 'Centro',
                num_verificado: true,
                movilizador_id: '3'
              },
              {
                id: '5',
                name: 'Pedro Rodríguez',
                nombre: 'Pedro Rodríguez',
                role: 'ciudadano',
                created_at: new Date(),
                registeredCount: 0,
                seccion: '001',
                colonia: 'Centro',
                num_verificado: true,
                movilizador_id: '3'
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: '6',
    name: 'Luis Hernández',
    nombre: 'Luis Hernández',
    role: 'lider',
    created_at: new Date(),
    registeredCount: 0,
    seccion: '002',
    colonia: 'Norte',
    num_verificado: true,
    children: [
      {
        id: '7',
        name: 'Carmen Flores',
        nombre: 'Carmen Flores',
        role: 'brigadista',
        created_at: new Date(),
        registeredCount: 0,
        seccion: '002',
        colonia: 'Norte',
        num_verificado: true,
        lider_id: '6',
        children: [
          {
            id: '8',
            name: 'Roberto Silva',
            nombre: 'Roberto Silva',
            role: 'ciudadano',
            created_at: new Date(),
            registeredCount: 0,
            seccion: '002',
            colonia: 'Norte',
            num_verificado: true,
            brigadista_id: '7'
          }
        ]
      }
    ]
  }
];

describe('KPICards Integration', () => {
  it('integrates correctly with NavojoaElectoralService', async () => {
    // Transform hierarchical data to section data using the service
    const sectionData = navojoaElectoralService.transformHierarchicalDataToSections(mockHierarchicalData);

    // Render the component with the transformed data
    render(<KPICards sectionData={sectionData} />);

    // Verify that the component renders with the correct data
    expect(screen.getByText('Cobertura Electoral de Navojoa')).toBeInTheDocument();
    expect(screen.getByText('Desglose por Roles Organizacionales')).toBeInTheDocument();
    expect(screen.getByText('Resumen Estadístico')).toBeInTheDocument();

    // Check that sections are processed correctly
    expect(screen.getByText(/de 78 secciones/)).toBeInTheDocument();

    // Check role breakdown
    expect(screen.getByText('Líderes')).toBeInTheDocument();
    expect(screen.getByText('Brigadistas')).toBeInTheDocument();
    expect(screen.getByText('Movilizadores')).toBeInTheDocument();
    expect(screen.getByText('Ciudadanos')).toBeInTheDocument();
  });

  it('calculates KPIs correctly from hierarchical data', () => {
    const sectionData = navojoaElectoralService.transformHierarchicalDataToSections(mockHierarchicalData);
    const kpis = navojoaElectoralService.calculateElectoralKPIs(sectionData);

    // Verify KPI calculations
    expect(kpis.totalSectionsWithCoverage).toBe(2); // Two sections: 001 and 002
    expect(kpis.totalRegistrations).toBe(8); // Total people in mock data
    expect(kpis.roleBreakdown.lideres).toBe(2);
    expect(kpis.roleBreakdown.brigadistas).toBe(2);
    expect(kpis.roleBreakdown.movilizadores).toBe(1);
    expect(kpis.roleBreakdown.ciudadanos).toBe(3);
    expect(kpis.coveragePercentage).toBeCloseTo(2.6, 1); // 2/78 * 100
  });

  it('handles empty hierarchical data gracefully', () => {
    const sectionData = navojoaElectoralService.transformHierarchicalDataToSections([]);

    render(<KPICards sectionData={sectionData} />);

    // Should render without errors and show zero values
    expect(screen.getByText('0 de 78 secciones - 0.0%')).toBeInTheDocument();
    expect(screen.getByText('Cobertura Electoral de Navojoa')).toBeInTheDocument();
  });

  it('generates heat map data correctly', () => {
    const sectionData = navojoaElectoralService.transformHierarchicalDataToSections(mockHierarchicalData);
    const heatMapData = navojoaElectoralService.generateHeatMapData(sectionData);

    // Verify heat map data structure
    expect(heatMapData).toHaveLength(2); // Two sections
    expect(heatMapData[0]).toHaveProperty('sectionNumber');
    expect(heatMapData[0]).toHaveProperty('registrationCount');
    expect(heatMapData[0]).toHaveProperty('intensity');

    // Verify intensity calculation (should be 100 for the section with most registrations)
    const maxIntensity = Math.max(...heatMapData.map(d => d.intensity));
    expect(maxIntensity).toBe(100);
  });

  it('integrates SectionHeatMap with service data correctly', () => {
    const sectionData = navojoaElectoralService.transformHierarchicalDataToSections(mockHierarchicalData);

    render(<SectionHeatMap sectionData={sectionData} />);

    // Verify that the heat map renders with the correct title
    expect(screen.getByText('Mapa de Calor - Secciones Electorales de Navojoa')).toBeInTheDocument();
    expect(screen.getByText('78 secciones totales')).toBeInTheDocument();

    // Verify statistics are displayed
    expect(screen.getByText('Secciones con Datos')).toBeInTheDocument();
    expect(screen.getByText('Sin Cobertura')).toBeInTheDocument();
    expect(screen.getByText('Total Registros')).toBeInTheDocument();

    // Verify coverage analysis is shown
    expect(screen.getByText('Análisis de Cobertura Territorial')).toBeInTheDocument();
  });
});