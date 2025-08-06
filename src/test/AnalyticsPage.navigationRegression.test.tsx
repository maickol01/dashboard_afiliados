import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import AnalyticsPage from '../components/analytics/AnalyticsPage';

// Mock the useData hook with comprehensive analytics data
vi.mock('../hooks/useData', () => ({
  useData: () => ({
    data: [
      {
        id: 1,
        name: 'Test Leader',
        role: 'leader',
        registrations: 10,
        region: 'Test Region',
        municipio: 'Test Municipality'
      }
    ],
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
      alerts: { 
        critical: [
          { id: 1, message: 'Test critical alert', type: 'critical', timestamp: new Date() }
        ], 
        warnings: [
          { id: 2, message: 'Test warning alert', type: 'warning', timestamp: new Date() }
        ] 
      },
      goals: { 
        overallProgress: { current: 50, target: 100, percentage: 50 },
        byRegion: [],
        byRole: []
      },
      geographic: {
        regionDistribution: [
          { region: 'Test Region', count: 50, percentage: 50 }
        ],
        municipioDistribution: [
          { municipio: 'Test Municipality', count: 30, percentage: 30 }
        ],
        seccionDistribution: [],
        heatmapData: []
      },
      temporal: {
        registrationsByPeriod: [
          { period: '2024-01', registrations: 25 }
        ],
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
    getRegistrationsByPeriod: vi.fn(() => [
      { date: '2024-01-01', registrations: 10 }
    ]),
    getLeaderPerformanceByPeriod: vi.fn(() => [
      { leader: 'Test Leader', performance: 85 }
    ]),
    realTimeStatus: { isConnected: false, isRefreshing: false },
    recentUpdates: [],
    triggerRealTimeRefresh: vi.fn(),
    checkRealTimeConnection: vi.fn(),
    detectManualUpdates: vi.fn(),
    clearRealTimeError: vi.fn(),
    clearRecentUpdates: vi.fn()
  })
}));

// Mock section components to avoid complex rendering issues
vi.mock('../components/analytics/sections/GeographicAnalysis', () => ({
  default: () => <div data-testid="geographic-analysis">Geographic Analysis Content</div>
}));

vi.mock('../components/analytics/sections/TemporalAnalysis', () => ({
  default: () => <div data-testid="temporal-analysis">Temporal Analysis Content</div>
}));

vi.mock('../components/analytics/sections/QualityMetrics', () => ({
  default: () => <div data-testid="quality-metrics">Quality Metrics Content</div>
}));

vi.mock('../components/analytics/sections/GoalsAndObjectives', () => ({
  default: () => <div data-testid="goals-objectives">Goals and Objectives Content</div>
}));

vi.mock('../components/analytics/sections/AlertsPanel', () => ({
  default: () => <div data-testid="alerts-panel">Alerts Panel Content</div>
}));

vi.mock('../components/analytics/sections/ComparisonTools', () => ({
  default: () => <div data-testid="comparison-tools">Comparison Tools Content</div>
}));

vi.mock('../components/analytics/productivity/WorkerProductivityAnalytics', () => ({
  default: () => <div data-testid="worker-productivity">Worker Productivity Content</div>
}));

describe('AnalyticsPage Navigation Regression Tests - Task 6.1', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Section Navigation Functionality', () => {
    it('should allow navigation to all remaining sections successfully', async () => {
      render(<AnalyticsPage />);
      
      // Define all remaining valid sections after elimination
      const remainingSections = [
        { id: 'overview', name: 'Resumen General', testId: null }, // Overview has complex content
        { id: 'productivity', name: 'Productividad de Trabajadores', testId: 'worker-productivity' },
        { id: 'geographic', name: 'Análisis Geográfico', testId: 'geographic-analysis' },
        { id: 'temporal', name: 'Análisis Temporal', testId: 'temporal-analysis' },
        { id: 'quality', name: 'Calidad', testId: 'quality-metrics' },
        { id: 'goals', name: 'Metas y Objetivos', testId: 'goals-objectives' },
        { id: 'alerts', name: 'Alertas', testId: 'alerts-panel' },
        { id: 'comparison', name: 'Comparativas', testId: 'comparison-tools' }
      ];

      // Test navigation to each section
      for (const section of remainingSections) {
        const sectionButton = screen.getByText(section.name);
        
        // Click the section button
        fireEvent.click(sectionButton);
        
        // Verify the button becomes active
        expect(sectionButton.closest('button')).toHaveClass('bg-primary');
        
        // For sections with test IDs, verify content renders
        if (section.testId) {
          await waitFor(() => {
            expect(screen.getByTestId(section.testId)).toBeInTheDocument();
          });
        }
        
        // For overview section, verify key content elements
        if (section.id === 'overview') {
          expect(screen.getByText('Total Líderes')).toBeInTheDocument();
          expect(screen.getByText('Total Brigadistas')).toBeInTheDocument();
          expect(screen.getByText('Total Movilizadores')).toBeInTheDocument();
          expect(screen.getByText('Total Ciudadanos')).toBeInTheDocument();
        }
      }
    });

    it('should verify each remaining section renders without errors', async () => {
      render(<AnalyticsPage />);
      
      const sectionsToTest = [
        { name: 'Productividad de Trabajadores', testId: 'worker-productivity' },
        { name: 'Análisis Geográfico', testId: 'geographic-analysis' },
        { name: 'Análisis Temporal', testId: 'temporal-analysis' },
        { name: 'Calidad', testId: 'quality-metrics' },
        { name: 'Metas y Objetivos', testId: 'goals-objectives' },
        { name: 'Alertas', testId: 'alerts-panel' },
        { name: 'Comparativas', testId: 'comparison-tools' }
      ];

      // Test each section renders without throwing errors
      for (const section of sectionsToTest) {
        const sectionButton = screen.getByText(section.name);
        
        // Navigate to section
        fireEvent.click(sectionButton);
        
        // Verify section content renders
        await waitFor(() => {
          expect(screen.getByTestId(section.testId)).toBeInTheDocument();
        });
        
        // Verify no error messages are displayed
        expect(screen.queryByText(/error/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/failed/i)).not.toBeInTheDocument();
      }
    });

    it('should confirm section switching works correctly between all valid sections', async () => {
      render(<AnalyticsPage />);
      
      // Start with overview (default)
      const overviewButton = screen.getByText('Resumen General');
      expect(overviewButton.closest('button')).toHaveClass('bg-primary');
      
      // Navigate to alerts section
      const alertsButton = screen.getByText('Alertas');
      fireEvent.click(alertsButton);
      expect(alertsButton.closest('button')).toHaveClass('bg-primary');
      expect(overviewButton.closest('button')).not.toHaveClass('bg-primary');
      
      await waitFor(() => {
        expect(screen.getByTestId('alerts-panel')).toBeInTheDocument();
      });
      
      // Navigate to quality section
      const qualityButton = screen.getByText('Calidad');
      fireEvent.click(qualityButton);
      expect(qualityButton.closest('button')).toHaveClass('bg-primary');
      expect(alertsButton.closest('button')).not.toHaveClass('bg-primary');
      
      await waitFor(() => {
        expect(screen.getByTestId('quality-metrics')).toBeInTheDocument();
      });
      
      // Navigate back to overview
      fireEvent.click(overviewButton);
      expect(overviewButton.closest('button')).toHaveClass('bg-primary');
      expect(qualityButton.closest('button')).not.toHaveClass('bg-primary');
      
      // Verify overview content is displayed
      expect(screen.getByText('Total Líderes')).toBeInTheDocument();
    });

    it('should maintain proper active state during navigation', () => {
      render(<AnalyticsPage />);
      
      const sections = [
        'Resumen General',
        'Alertas',
        'Calidad',
        'Metas y Objetivos'
      ];
      
      // Test that only one section is active at a time
      sections.forEach(sectionName => {
        const sectionButton = screen.getByText(sectionName);
        fireEvent.click(sectionButton);
        
        // Verify clicked section is active
        expect(sectionButton.closest('button')).toHaveClass('bg-primary');
        
        // Verify other sections are not active
        sections.forEach(otherSectionName => {
          if (otherSectionName !== sectionName) {
            const otherButton = screen.getByText(otherSectionName);
            expect(otherButton.closest('button')).not.toHaveClass('bg-primary');
          }
        });
      });
    });
  });

  describe('Section Validation and Error Handling', () => {
    it('should not display eliminated sections in navigation', () => {
      render(<AnalyticsPage />);
      
      // Verify eliminated sections are completely absent
      const eliminatedSections = ['Salud de Red', 'Eficiencia', 'Predicciones'];
      
      eliminatedSections.forEach(sectionName => {
        expect(screen.queryByText(sectionName)).not.toBeInTheDocument();
      });
    });

    it('should have exactly 8 remaining sections after elimination', () => {
      render(<AnalyticsPage />);
      
      const expectedSections = [
        'Resumen General',
        'Productividad de Trabajadores',
        'Análisis Geográfico',
        'Análisis Temporal',
        'Calidad',
        'Metas y Objetivos',
        'Alertas',
        'Comparativas'
      ];
      
      // Verify all expected sections are present
      expectedSections.forEach(sectionName => {
        expect(screen.getByText(sectionName)).toBeInTheDocument();
      });
      
      // Count navigation buttons for sections
      const navigationButtons = screen.getAllByRole('button').filter(button => 
        expectedSections.some(section => button.textContent?.includes(section))
      );
      
      expect(navigationButtons).toHaveLength(8);
    });

    it('should default to overview section on initial load', () => {
      render(<AnalyticsPage />);
      
      const overviewButton = screen.getByText('Resumen General');
      expect(overviewButton.closest('button')).toHaveClass('bg-primary');
      
      // Verify overview content is displayed
      expect(screen.getByText('Total Líderes')).toBeInTheDocument();
      expect(screen.getByText('Tasa de Conversión')).toBeInTheDocument();
    });
  });

  describe('Navigation Performance and Stability', () => {
    it('should handle rapid section switching without errors', async () => {
      render(<AnalyticsPage />);
      
      const sectionsToTest = [
        'Alertas',
        'Calidad', 
        'Resumen General',
        'Metas y Objetivos',
        'Alertas'
      ];
      
      // Rapidly switch between sections
      for (const sectionName of sectionsToTest) {
        const sectionButton = screen.getByText(sectionName);
        fireEvent.click(sectionButton);
        
        // Verify section becomes active
        expect(sectionButton.closest('button')).toHaveClass('bg-primary');
      }
      
      // Verify final state is correct
      const finalButton = screen.getByText('Alertas');
      expect(finalButton.closest('button')).toHaveClass('bg-primary');
    });

    it('should maintain navigation state consistency', () => {
      render(<AnalyticsPage />);
      
      // Test multiple navigation cycles
      const navigationCycle = [
        'Resumen General',
        'Calidad',
        'Alertas',
        'Resumen General'
      ];
      
      navigationCycle.forEach(sectionName => {
        const sectionButton = screen.getByText(sectionName);
        fireEvent.click(sectionButton);
        
        // Verify correct active state
        expect(sectionButton.closest('button')).toHaveClass('bg-primary');
        
        // Verify navigation buttons are still present
        expect(screen.getAllByRole('button').filter(button => 
          ['Resumen General', 'Calidad', 'Alertas'].some(section => 
            button.textContent?.includes(section)
          )
        )).toHaveLength(3);
      });
    });
  });

  describe('Content Rendering Verification', () => {
    it('should render section-specific content correctly', async () => {
      render(<AnalyticsPage />);
      
      // Test Geographic Analysis section
      const geographicButton = screen.getByText('Análisis Geográfico');
      fireEvent.click(geographicButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('geographic-analysis')).toBeInTheDocument();
        expect(screen.getByText('Geographic Analysis Content')).toBeInTheDocument();
      });
      
      // Test Quality Metrics section
      const qualityButton = screen.getByText('Calidad');
      fireEvent.click(qualityButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('quality-metrics')).toBeInTheDocument();
        expect(screen.getByText('Quality Metrics Content')).toBeInTheDocument();
      });
    });

    it('should clear previous section content when switching', async () => {
      render(<AnalyticsPage />);
      
      // Navigate to geographic section
      const geographicButton = screen.getByText('Análisis Geográfico');
      fireEvent.click(geographicButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('geographic-analysis')).toBeInTheDocument();
      });
      
      // Navigate to temporal section
      const temporalButton = screen.getByText('Análisis Temporal');
      fireEvent.click(temporalButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('temporal-analysis')).toBeInTheDocument();
        // Previous section content should not be present
        expect(screen.queryByTestId('geographic-analysis')).not.toBeInTheDocument();
      });
    });
  });
});