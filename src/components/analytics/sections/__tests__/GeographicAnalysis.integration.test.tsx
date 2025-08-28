import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import GeographicAnalysis from '../GeographicAnalysis';
import { Analytics, Person } from '../../../../types';
import { navojoaElectoralService } from '../../../../services/navojoaElectoralService';

// Mock the navojoaElectoralService
vi.mock('../../../../services/navojoaElectoralService', () => ({
  navojoaElectoralService: {
    generateNavojoaElectoralAnalytics: vi.fn()
  }
}));

// Mock the mobile detection hook
vi.mock('../../../../hooks/useMobileDetection', () => ({
  useMobileDetection: () => ({
    isMobile: false,
    isTablet: false
  })
}));

// Mock the individual Navojoa components
vi.mock('../../navojoa/KPICards', () => ({
  default: ({ sectionData, loading }: any) => (
    <div data-testid="kpi-cards">
      KPI Cards - {loading ? 'Loading' : `${sectionData.length} sections`}
    </div>
  )
}));

vi.mock('../../navojoa/SectionStackedBarChart', () => ({
  default: ({ sectionData, loading }: any) => (
    <div data-testid="stacked-bar-chart">
      Stacked Bar Chart - {loading ? 'Loading' : `${sectionData.length} sections`}
    </div>
  )
}));

vi.mock('../../navojoa/SectionHeatMap', () => ({
  default: ({ sectionData, loading }: any) => (
    <div data-testid="heat-map">
      Heat Map - {loading ? 'Loading' : `${sectionData.length} sections`}
    </div>
  )
}));

describe('GeographicAnalysis Integration', () => {
  const mockAnalytics: Analytics = {
    totalLideres: 10,
    totalBrigadistas: 50,
    totalMobilizers: 100,
    totalCitizens: 500,
    dailyRegistrations: [],
    weeklyRegistrations: [],
    monthlyRegistrations: [],
    leaderPerformance: [],
    conversionRate: 0.8,
    growthRate: 0.15,
    efficiency: {
      conversionByLeader: [],
      productivityByBrigadier: [],
      topPerformers: [],
      needsSupport: [],
      registrationSpeed: { average: 5, fastest: 2, slowest: 10 }
    },
    geographic: {
      regionDistribution: [],
      heatmapData: [],
      territorialCoverage: []
    },
    temporal: {
      hourlyPatterns: [],
      weeklyPatterns: [],
      seasonality: [],
      projections: []
    },
    quality: {
      dataCompleteness: 0.9,
      duplicateRate: 0.05,
      verificationRate: 0.85,
      postRegistrationActivity: 0.7
    },
    goals: {
      overallProgress: { current: 500, target: 1000, percentage: 50 },
      individualGoals: [],
      milestones: []
    },
    alerts: {
      critical: [],
      warnings: [],
      achievements: []
    },
    predictions: {
      churnRisk: [],
      resourceOptimization: [],
      patterns: []
    }
  };

  const mockHierarchicalData: Person[] = [
    {
      id: '1',
      name: 'Test Leader',
      nombre: 'Test Leader',
      role: 'lider',
      created_at: new Date(),
      registeredCount: 10,
      seccion: '0001',
      colonia: 'Centro',
      num_verificado: true,
      children: []
    }
  ];

  const mockNavojoaAnalytics = {
    sectionData: [
      {
        sectionNumber: '0001',
        colonia: 'Centro',
        totalRegistrations: 10,
        lideres: 1,
        brigadistas: 2,
        movilizadores: 3,
        ciudadanos: 4,
        lastUpdated: new Date(),
        hasMinimumData: true
      }
    ],
    kpis: {
      totalSectionsWithCoverage: 1,
      coveragePercentage: 1.35,
      averageRegistrationsPerSection: 10,
      totalRegistrations: 10,
      topSection: { sectionNumber: '0001', registrationCount: 10 },
      roleBreakdown: { lideres: 1, brigadistas: 2, movilizadores: 3, ciudadanos: 4 },
      TOTAL_SECTIONS_NAVOJOA: 78
    },
    heatMapData: [
      { sectionNumber: '0001', registrationCount: 10, intensity: 100 }
    ],
    lastUpdated: new Date()
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (navojoaElectoralService.generateNavojoaElectoralAnalytics as any).mockResolvedValue(mockNavojoaAnalytics);
  });

  it('should render all three main components after loading', async () => {
    render(
      <GeographicAnalysis 
        analytics={mockAnalytics} 
        hierarchicalData={mockHierarchicalData} 
      />
    );

    // Should show loading initially
    expect(screen.getByText(/KPI Cards - Loading/)).toBeInTheDocument();
    expect(screen.getByText(/Stacked Bar Chart - Loading/)).toBeInTheDocument();
    expect(screen.getByText(/Heat Map - Loading/)).toBeInTheDocument();

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText(/KPI Cards - 1 sections/)).toBeInTheDocument();
      expect(screen.getByText(/Stacked Bar Chart - 1 sections/)).toBeInTheDocument();
      expect(screen.getByText(/Heat Map - 1 sections/)).toBeInTheDocument();
    });
  });

  it('should call navojoaElectoralService with correct parameters', async () => {
    render(
      <GeographicAnalysis 
        analytics={mockAnalytics} 
        hierarchicalData={mockHierarchicalData} 
      />
    );

    await waitFor(() => {
      expect(navojoaElectoralService.generateNavojoaElectoralAnalytics).toHaveBeenCalledWith(
        mockHierarchicalData,
        mockAnalytics
      );
    });
  });

  it('should show error state when service fails', async () => {
    const errorMessage = 'Service error';
    (navojoaElectoralService.generateNavojoaElectoralAnalytics as unknown).mockRejectedValue(
      new Error(errorMessage)
    );

    render(
      <GeographicAnalysis 
        analytics={mockAnalytics} 
        hierarchicalData={mockHierarchicalData} 
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/Error al cargar datos/)).toBeInTheDocument();
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  it('should show header with title and refresh button', async () => {
    render(
      <GeographicAnalysis 
        analytics={mockAnalytics} 
        hierarchicalData={mockHierarchicalData} 
      />
    );

    expect(screen.getByText(/Análisis Geográfico - Navojoa/)).toBeInTheDocument();
    expect(screen.getByText(/Análisis hiperlocal de las 78 secciones electorales/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Actualizar/ })).toBeInTheDocument();
  });

  it('should show data quality indicator after loading', async () => {
    render(
      <GeographicAnalysis 
        analytics={mockAnalytics} 
        hierarchicalData={mockHierarchicalData} 
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/Información del Análisis/)).toBeInTheDocument();
      // Check that the data quality section contains the expected information
      const dataQualitySection = screen.getByText(/Información del Análisis/).closest('div');
      expect(dataQualitySection).toHaveTextContent('1');
      expect(dataQualitySection).toHaveTextContent('secciones con datos');
      expect(dataQualitySection).toHaveTextContent('registros totales');
      expect(dataQualitySection).toHaveTextContent('Cobertura territorial');
      expect(dataQualitySection).toHaveTextContent('1.4%');
    });
  });
});