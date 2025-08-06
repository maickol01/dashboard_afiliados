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

describe('AnalyticsPage Section Rendering Tests - Task 5.1', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should verify eliminated sections do not appear in navigation', () => {
    render(<AnalyticsPage />);
    
    // Test that eliminated sections are NOT present in navigation
    expect(screen.queryByText('Salud de Red')).not.toBeInTheDocument();
    expect(screen.queryByText('Eficiencia')).not.toBeInTheDocument();
    expect(screen.queryByText('Predicciones')).not.toBeInTheDocument();
  });

  it('should confirm only valid sections are rendered', () => {
    render(<AnalyticsPage />);
    
    // Test that all valid sections are present
    expect(screen.getByText('Resumen General')).toBeInTheDocument();
    expect(screen.getByText('Productividad de Trabajadores')).toBeInTheDocument();
    expect(screen.getByText('Análisis Geográfico')).toBeInTheDocument();
    expect(screen.getByText('Análisis Temporal')).toBeInTheDocument();
    expect(screen.getByText('Calidad')).toBeInTheDocument();
    expect(screen.getByText('Metas y Objetivos')).toBeInTheDocument();
    expect(screen.getByText('Alertas')).toBeInTheDocument();
    expect(screen.getByText('Comparativas')).toBeInTheDocument();
  });

  it('should exclude eliminated sections from navigation tests', () => {
    render(<AnalyticsPage />);
    
    // Verify that navigation only includes valid sections
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

    const eliminatedSections = [
      'Salud de Red',
      'Eficiencia',
      'Predicciones'
    ];

    // Count navigation buttons that match valid sections
    const navigationButtons = screen.getAllByRole('button').filter(button => 
      validSections.some(section => button.textContent?.includes(section))
    );
    
    // Should have exactly 8 valid section buttons
    expect(navigationButtons).toHaveLength(8);

    // Verify no eliminated sections appear in any button
    const allButtons = screen.getAllByRole('button');
    allButtons.forEach(button => {
      const buttonText = button.textContent || '';
      eliminatedSections.forEach(eliminatedSection => {
        expect(buttonText).not.toContain(eliminatedSection);
      });
    });
  });

  it('should default to overview section', () => {
    render(<AnalyticsPage />);
    
    // The overview section should be active by default (has primary background)
    const overviewButton = screen.getByText('Resumen General').closest('button');
    expect(overviewButton).toHaveClass('bg-primary');
  });

  it('should maintain proper section count after elimination', () => {
    render(<AnalyticsPage />);
    
    // Count all section navigation buttons
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

    // Verify each valid section exists
    validSectionNames.forEach(sectionName => {
      expect(screen.getByText(sectionName)).toBeInTheDocument();
    });

    // Verify total count is exactly 8 (after eliminating 3 sections)
    const sectionButtons = screen.getAllByRole('button').filter(button => 
      validSectionNames.some(section => button.textContent?.includes(section))
    );
    
    expect(sectionButtons).toHaveLength(8);
  });
});