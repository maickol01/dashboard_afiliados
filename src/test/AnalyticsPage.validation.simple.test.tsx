import { render, screen } from '@testing-library/react';
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
      quality: { dataCompleteness: 95 },
      alerts: { critical: [], warnings: [] },
      goals: { overallProgress: { current: 50, target: 100, percentage: 50 } }
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

describe('AnalyticsPage Component Tests - Task 5.1', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should verify eliminated sections do not appear in navigation', () => {
    render(<AnalyticsPage />);
    
    // Test that eliminated sections are NOT present in navigation
    const eliminatedSections = ['Salud de Red', 'Eficiencia', 'Predicciones'];
    
    eliminatedSections.forEach(sectionName => {
      expect(screen.queryByText(sectionName)).not.toBeInTheDocument();
    });
  });

  it('should confirm only valid sections are rendered', () => {
    render(<AnalyticsPage />);
    
    // Test that all valid sections are present
    const validSections = [
      'Resumen General',
      'Productividad de Trabajadores',
      'Análisis Geográfico', 
      'Análisis Temporal',
      'Calidad',
      'Metas y Objetivos',
      'Alertas',
      'Comparativas'
    ];

    validSections.forEach(sectionName => {
      expect(screen.getByText(sectionName)).toBeInTheDocument();
    });

    // Verify we have exactly 8 valid section navigation buttons
    const navigationButtons = screen.getAllByRole('button').filter(button => 
      validSections.some(section => button.textContent?.includes(section))
    );
    
    expect(navigationButtons).toHaveLength(8);
  });

  it('should exclude eliminated sections from navigation tests', () => {
    render(<AnalyticsPage />);
    
    // Get all navigation buttons and verify none contain eliminated section names
    const allButtons = screen.getAllByRole('button');
    const eliminatedSectionNames = ['Salud de Red', 'Eficiencia', 'Predicciones'];
    
    allButtons.forEach(button => {
      const buttonText = button.textContent || '';
      eliminatedSectionNames.forEach(eliminatedName => {
        expect(buttonText).not.toContain(eliminatedName);
      });
    });
  });

  it('should default to overview section when component loads', () => {
    render(<AnalyticsPage />);
    
    // The overview section should be active by default
    const overviewButton = screen.getByText('Resumen General');
    expect(overviewButton.closest('button')).toHaveClass('bg-primary');
  });

  it('should have proper section validation logic in place', () => {
    render(<AnalyticsPage />);
    
    // Verify that the component has implemented validation by checking:
    // 1. Eliminated sections are not present
    expect(screen.queryByText('Salud de Red')).not.toBeInTheDocument();
    expect(screen.queryByText('Eficiencia')).not.toBeInTheDocument(); 
    expect(screen.queryByText('Predicciones')).not.toBeInTheDocument();
    
    // 2. Valid sections are present
    expect(screen.getByText('Resumen General')).toBeInTheDocument();
    expect(screen.getByText('Productividad de Trabajadores')).toBeInTheDocument();
    expect(screen.getByText('Análisis Geográfico')).toBeInTheDocument();
    expect(screen.getByText('Análisis Temporal')).toBeInTheDocument();
    expect(screen.getByText('Calidad')).toBeInTheDocument();
    expect(screen.getByText('Metas y Objetivos')).toBeInTheDocument();
    expect(screen.getByText('Alertas')).toBeInTheDocument();
    expect(screen.getByText('Comparativas')).toBeInTheDocument();
  });
});