import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import AnalyticsPage from '../components/analytics/AnalyticsPage';

// Mock the useData hook
vi.mock('../hooks/useData', () => ({
  useData: () => ({
    data: [],
    analytics: {
      totalLideres: 10,
      totalBrigadistas: 20,
      totalMobilizers: 15,
      totalCitizens: 100,
      conversionRate: 85,
      growthRate: 12,
      quality: { 
        dataCompleteness: 95,
        accuracyScore: 88.5,
        consistencyScore: 92.3,
        completenessScore: 95.1,
        validationErrors: 12
      },
      alerts: { critical: [], warnings: [] },
      goals: { overallProgress: { current: 50, target: 100, percentage: 50 } },
      geographic: {
        regionDistribution: [],
        municipioDistribution: [],
        seccionDistribution: [],
        heatmapData: []
      },
      temporal: {
        registrationsByPeriod: [],
        performanceTrends: []
      }
    },
    loading: false,
    analyticsLoading: false,
    error: null,
    performanceMetrics: { totalRecords: 100 },
    lastFetchTime: new Date(),
    refetchData: vi.fn(),
    forceRefresh: vi.fn(),
    getRegistrationsByPeriod: vi.fn(() => []),
    getLeaderPerformanceByPeriod: vi.fn(() => []),
    realTimeStatus: { isConnected: false, isRefreshing: false },
    recentUpdates: [],
    triggerRealTimeRefresh: vi.fn(),
    checkRealTimeConnection: vi.fn(),
    detectManualUpdates: vi.fn(),
    clearRealTimeError: vi.fn(),
    clearRecentUpdates: vi.fn()
  })
}));

describe('AnalyticsPage Navigation Tests - Task 5.1', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should verify eliminated sections do not appear in navigation', () => {
    render(<AnalyticsPage />);
    
    // Test that eliminated sections are completely absent from navigation
    const eliminatedSectionNames = [
      'Salud de Red',
      'Eficiencia', 
      'Predicciones'
    ];

    eliminatedSectionNames.forEach(sectionName => {
      expect(screen.queryByText(sectionName)).not.toBeInTheDocument();
    });
  });

  it('should confirm only valid sections are rendered in navigation', () => {
    render(<AnalyticsPage />);
    
    // Test that all valid sections are present
    const validSectionNames = [
      'Resumen General',
      'Productividad de Trabajadores', 
      'Análisis Geográfico',
      'Análisis Temporal',
      'Calidad',
      'Metas y Objetivos',
      'Alertas',
      'Comparativas'
    ];

    validSectionNames.forEach(sectionName => {
      expect(screen.getByText(sectionName)).toBeInTheDocument();
    });

    // Verify we have exactly 8 navigation buttons for valid sections
    const navigationButtons = screen.getAllByRole('button').filter(button => 
      validSectionNames.some(section => button.textContent?.includes(section))
    );
    
    expect(navigationButtons).toHaveLength(8);
  });

  it('should allow navigation between valid sections only', () => {
    render(<AnalyticsPage />);
    
    // Test navigation between valid sections (excluding eliminated ones)
    // Start with overview (default)
    const overviewButton = screen.getByText('Resumen General');
    expect(overviewButton.closest('button')).toHaveClass('bg-primary');

    // Navigate to alerts section (simpler component)
    const alertsButton = screen.getByText('Alertas');
    fireEvent.click(alertsButton);
    expect(alertsButton.closest('button')).toHaveClass('bg-primary');

    // Go back to overview
    fireEvent.click(overviewButton);
    expect(overviewButton.closest('button')).toHaveClass('bg-primary');
  });

  it('should exclude eliminated sections from navigation tests', () => {
    render(<AnalyticsPage />);
    
    // Get all buttons and verify none contain eliminated section text
    const allButtons = screen.getAllByRole('button');
    const eliminatedSectionNames = ['Salud de Red', 'Eficiencia', 'Predicciones'];
    
    // Test that no button contains eliminated section names
    allButtons.forEach(button => {
      const buttonText = button.textContent || '';
      eliminatedSectionNames.forEach(eliminatedName => {
        expect(buttonText).not.toContain(eliminatedName);
      });
    });
  });

  it('should start with overview section as default', () => {
    render(<AnalyticsPage />);
    
    const overviewButton = screen.getByText('Resumen General');
    expect(overviewButton.closest('button')).toHaveClass('bg-primary');
    
    // Other valid sections should not be active initially
    const productivityButton = screen.getByText('Productividad de Trabajadores');
    expect(productivityButton.closest('button')).not.toHaveClass('bg-primary');
    
    const qualityButton = screen.getByText('Calidad');
    expect(qualityButton.closest('button')).not.toHaveClass('bg-primary');
  });

  it('should maintain navigation functionality after eliminating sections', () => {
    render(<AnalyticsPage />);
    
    // Test that navigation still works properly with only valid sections
    // We'll test a subset of sections that don't require complex data structures
    const simpleSections = [
      'Resumen General',
      'Alertas'
    ];

    // Test clicking each simple section
    simpleSections.forEach(sectionName => {
      const sectionButton = screen.getByText(sectionName);
      fireEvent.click(sectionButton);
      expect(sectionButton.closest('button')).toHaveClass('bg-primary');
    });

    // Verify all valid sections are still available for navigation
    const allValidSections = [
      'Resumen General',
      'Productividad de Trabajadores',
      'Análisis Geográfico',
      'Análisis Temporal',
      'Calidad',
      'Metas y Objetivos',
      'Alertas',
      'Comparativas'
    ];

    allValidSections.forEach(sectionName => {
      expect(screen.getByText(sectionName)).toBeInTheDocument();
    });
  });
});