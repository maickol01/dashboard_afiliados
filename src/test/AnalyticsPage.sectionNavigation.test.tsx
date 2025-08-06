import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import AnalyticsPage from '../components/analytics/AnalyticsPage';
import { mockAnalytics, mockHierarchicalData } from './mockData';

// Mock the useData hook with comprehensive analytics data
vi.mock('../hooks/useData', () => ({
  useData: () => ({
    data: mockHierarchicalData,
    analytics: mockAnalytics,
    loading: false,
    analyticsLoading: false,
    error: null,
    performanceMetrics: { 
      totalRecords: 100,
      queryTime: 150,
      cacheHitRate: 85,
      lastOptimization: new Date()
    },
    lastFetchTime: new Date(),
    refetchData: vi.fn(),
    forceRefresh: vi.fn(),
    getRegistrationsByPeriod: vi.fn(() => [
      { date: '2024-01-01', registrations: 10, period: 'day' },
      { date: '2024-01-02', registrations: 15, period: 'day' }
    ]),
    getLeaderPerformanceByPeriod: vi.fn(() => [
      { leader: 'Juan Pérez', performance: 85, period: 'day' },
      { leader: 'María González', performance: 92, period: 'day' }
    ]),
    realTimeStatus: { 
      isConnected: true, 
      isRefreshing: false,
      lastUpdate: new Date(),
      connectionQuality: 'good'
    },
    recentUpdates: [],
    triggerRealTimeRefresh: vi.fn(),
    checkRealTimeConnection: vi.fn(),
    detectManualUpdates: vi.fn(),
    clearRealTimeError: vi.fn(),
    clearRecentUpdates: vi.fn()
  })
}));

// Mock all section components to avoid complex rendering dependencies
vi.mock('../components/analytics/sections/GeographicAnalysis', () => ({
  default: ({ analytics }: { analytics: any }) => (
    <div data-testid="geographic-analysis">
      <h2>Geographic Analysis Section</h2>
      <p>Region data: {analytics?.geographic?.regionDistribution?.length || 0} regions</p>
    </div>
  )
}));

vi.mock('../components/analytics/sections/TemporalAnalysis', () => ({
  default: ({ analytics }: { analytics: any }) => (
    <div data-testid="temporal-analysis">
      <h2>Temporal Analysis Section</h2>
      <p>Temporal patterns available</p>
    </div>
  )
}));

vi.mock('../components/analytics/sections/QualityMetrics', () => ({
  default: ({ analytics }: { analytics: any }) => (
    <div data-testid="quality-metrics">
      <h2>Quality Metrics Section</h2>
      <p>Data completeness: {analytics?.quality?.dataCompleteness || 0}%</p>
    </div>
  )
}));

vi.mock('../components/analytics/sections/GoalsAndObjectives', () => ({
  default: ({ analytics }: { analytics: any }) => (
    <div data-testid="goals-objectives">
      <h2>Goals and Objectives Section</h2>
      <p>Progress: {analytics?.goals?.overallProgress?.percentage || 0}%</p>
    </div>
  )
}));

vi.mock('../components/analytics/sections/AlertsPanel', () => ({
  default: ({ analytics }: { analytics: any }) => (
    <div data-testid="alerts-panel">
      <h2>Alerts Panel Section</h2>
      <p>Critical alerts: {analytics?.alerts?.critical?.length || 0}</p>
      <p>Warnings: {analytics?.alerts?.warnings?.length || 0}</p>
    </div>
  )
}));

vi.mock('../components/analytics/sections/ComparisonTools', () => ({
  default: ({ analytics, hierarchicalData }: { analytics: any; hierarchicalData: any }) => (
    <div data-testid="comparison-tools">
      <h2>Comparison Tools Section</h2>
      <p>Data points: {hierarchicalData?.length || 0}</p>
    </div>
  )
}));

vi.mock('../components/analytics/productivity/WorkerProductivityAnalytics', () => ({
  default: ({ hierarchicalData, loading }: { hierarchicalData: any; loading: boolean }) => (
    <div data-testid="worker-productivity">
      <h2>Worker Productivity Analytics</h2>
      {loading ? (
        <p>Loading productivity data...</p>
      ) : (
        <p>Analyzing {hierarchicalData?.length || 0} workers</p>
      )}
    </div>
  )
}));

// Mock other components to avoid rendering complexity
vi.mock('../components/charts/LineChart', () => ({
  default: ({ data, title }: { data: any; title: string }) => (
    <div data-testid="line-chart">
      <h3>{title}</h3>
      <p>Chart data points: {data?.length || 0}</p>
    </div>
  )
}));

vi.mock('../components/charts/EnhancedLeaderPerformanceChart', () => ({
  default: ({ data, title, period }: { data: any; title: string; period: string }) => (
    <div data-testid="leader-performance-chart">
      <h3>{title}</h3>
      <p>Period: {period}</p>
      <p>Leaders: {data?.length || 0}</p>
    </div>
  )
}));

vi.mock('../components/common/PerformanceMonitor', () => ({
  default: () => <div data-testid="performance-monitor">Performance Monitor</div>
}));

vi.mock('../components/analytics/CacheMonitor', () => ({
  CacheMonitor: () => <div data-testid="cache-monitor">Cache Monitor</div>
}));

vi.mock('../components/analytics/RealTimeIndicator', () => ({
  default: () => <div data-testid="realtime-indicator">Real Time Indicator</div>
}));

vi.mock('../components/analytics/UpdateDetector', () => ({
  default: () => <div data-testid="update-detector">Update Detector</div>
}));

vi.mock('../components/common/UpdateNotification', () => ({
  default: () => <div data-testid="update-notification">Update Notification</div>
}));

describe('AnalyticsPage Section Navigation Tests - Task 6.1', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Navigation to All Remaining Sections', () => {
    it('should allow navigation to all remaining sections successfully', async () => {
      render(<AnalyticsPage />);
      
      // Define all remaining valid sections after elimination
      const remainingSections = [
        { id: 'overview', name: 'Resumen General', hasSpecificTestId: false },
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
        
        // Verify button exists and is clickable
        expect(sectionButton).toBeInTheDocument();
        expect(sectionButton.closest('button')).not.toBeDisabled();
        
        // Click the section button
        fireEvent.click(sectionButton);
        
        // Verify the button becomes active (has primary background)
        await waitFor(() => {
          expect(sectionButton.closest('button')).toHaveClass('bg-primary');
        });
        
        // For sections with specific test IDs, verify content renders
        if (section.testId) {
          await waitFor(() => {
            const sectionContent = screen.getByTestId(section.testId);
            expect(sectionContent).toBeInTheDocument();
            expect(sectionContent).toBeVisible();
          });
        }
        
        // For overview section, verify key content elements are present
        if (section.id === 'overview') {
          expect(screen.getByText('Total Líderes')).toBeInTheDocument();
          expect(screen.getByText('Total Brigadistas')).toBeInTheDocument();
          expect(screen.getByText('Total Movilizadores')).toBeInTheDocument();
          expect(screen.getByText('Total Ciudadanos')).toBeInTheDocument();
          expect(screen.getByText('Tasa de Conversión')).toBeInTheDocument();
        }
      }
    });

    it('should verify navigation buttons are properly styled and accessible', () => {
      render(<AnalyticsPage />);
      
      const sectionNames = [
        'Resumen General',
        'Productividad de Trabajadores',
        'Análisis Geográfico',
        'Análisis Temporal',
        'Calidad',
        'Metas y Objetivos',
        'Alertas',
        'Comparativas'
      ];

      sectionNames.forEach(sectionName => {
        const sectionButton = screen.getByText(sectionName);
        const buttonElement = sectionButton.closest('button');
        
        // Verify button accessibility
        expect(buttonElement).toBeInTheDocument();
        expect(buttonElement).not.toBeDisabled();
        // Button should be clickable (implicit type="button" behavior)
        expect(buttonElement?.tagName.toLowerCase()).toBe('button');
        
        // Verify button has proper styling classes
        expect(buttonElement).toHaveClass('flex', 'items-center', 'px-3', 'py-2', 'rounded-md');
        
        // Verify button contains icon and text
        const icon = buttonElement?.querySelector('svg');
        expect(icon).toBeInTheDocument();
        expect(sectionButton).toBeInTheDocument();
      });
    });
  });

  describe('Section Content Rendering Without Errors', () => {
    it('should verify each remaining section renders without errors', async () => {
      render(<AnalyticsPage />);
      
      const sectionsToTest = [
        { name: 'Productividad de Trabajadores', testId: 'worker-productivity', expectedContent: 'Worker Productivity Analytics' },
        { name: 'Análisis Geográfico', testId: 'geographic-analysis', expectedContent: 'Geographic Analysis Section' },
        { name: 'Análisis Temporal', testId: 'temporal-analysis', expectedContent: 'Temporal Analysis Section' },
        { name: 'Calidad', testId: 'quality-metrics', expectedContent: 'Quality Metrics Section' },
        { name: 'Metas y Objetivos', testId: 'goals-objectives', expectedContent: 'Goals and Objectives Section' },
        { name: 'Alertas', testId: 'alerts-panel', expectedContent: 'Alerts Panel Section' },
        { name: 'Comparativas', testId: 'comparison-tools', expectedContent: 'Comparison Tools Section' }
      ];

      // Test each section renders without throwing errors
      for (const section of sectionsToTest) {
        const sectionButton = screen.getByText(section.name);
        
        // Navigate to section
        fireEvent.click(sectionButton);
        
        // Verify section content renders correctly
        await waitFor(() => {
          const sectionElement = screen.getByTestId(section.testId);
          expect(sectionElement).toBeInTheDocument();
          expect(sectionElement).toBeVisible();
        });
        
        // Verify expected content is present
        expect(screen.getByText(section.expectedContent)).toBeInTheDocument();
        
        // Verify no error messages are displayed
        expect(screen.queryByText(/error/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/failed/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/something went wrong/i)).not.toBeInTheDocument();
      }
    });

    it('should handle section rendering with proper data flow', async () => {
      render(<AnalyticsPage />);
      
      // Test Geographic Analysis with data
      const geographicButton = screen.getByText('Análisis Geográfico');
      fireEvent.click(geographicButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('geographic-analysis')).toBeInTheDocument();
        expect(screen.getByText('Region data: 1 regions')).toBeInTheDocument();
      });
      
      // Test Quality Metrics with data
      const qualityButton = screen.getByText('Calidad');
      fireEvent.click(qualityButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('quality-metrics')).toBeInTheDocument();
        expect(screen.getByText('Data completeness: 100%')).toBeInTheDocument();
      });
      
      // Test Goals and Objectives with data
      const goalsButton = screen.getByText('Metas y Objetivos');
      fireEvent.click(goalsButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('goals-objectives')).toBeInTheDocument();
        expect(screen.getByText('Progress: 0.06%')).toBeInTheDocument();
      });
    });
  });

  describe('Section Switching Functionality', () => {
    it('should confirm section switching works correctly between all valid sections', async () => {
      render(<AnalyticsPage />);
      
      // Start with overview (default)
      const overviewButton = screen.getByText('Resumen General');
      expect(overviewButton.closest('button')).toHaveClass('bg-primary');
      
      // Navigate to alerts section
      const alertsButton = screen.getByText('Alertas');
      fireEvent.click(alertsButton);
      
      await waitFor(() => {
        expect(alertsButton.closest('button')).toHaveClass('bg-primary');
        expect(overviewButton.closest('button')).not.toHaveClass('bg-primary');
        expect(screen.getByTestId('alerts-panel')).toBeInTheDocument();
      });
      
      // Navigate to quality section
      const qualityButton = screen.getByText('Calidad');
      fireEvent.click(qualityButton);
      
      await waitFor(() => {
        expect(qualityButton.closest('button')).toHaveClass('bg-primary');
        expect(alertsButton.closest('button')).not.toHaveClass('bg-primary');
        expect(screen.getByTestId('quality-metrics')).toBeInTheDocument();
      });
      
      // Navigate to geographic section
      const geographicButton = screen.getByText('Análisis Geográfico');
      fireEvent.click(geographicButton);
      
      await waitFor(() => {
        expect(geographicButton.closest('button')).toHaveClass('bg-primary');
        expect(qualityButton.closest('button')).not.toHaveClass('bg-primary');
        expect(screen.getByTestId('geographic-analysis')).toBeInTheDocument();
      });
      
      // Navigate back to overview
      fireEvent.click(overviewButton);
      
      await waitFor(() => {
        expect(overviewButton.closest('button')).toHaveClass('bg-primary');
        expect(geographicButton.closest('button')).not.toHaveClass('bg-primary');
        expect(screen.getByText('Total Líderes')).toBeInTheDocument();
      });
    });

    it('should maintain proper active state during rapid navigation', async () => {
      render(<AnalyticsPage />);
      
      const sections = [
        'Resumen General',
        'Alertas',
        'Calidad',
        'Metas y Objetivos',
        'Análisis Geográfico'
      ];
      
      // Test rapid navigation between sections
      for (const sectionName of sections) {
        const sectionButton = screen.getByText(sectionName);
        fireEvent.click(sectionButton);
        
        // Verify clicked section becomes active immediately
        await waitFor(() => {
          expect(sectionButton.closest('button')).toHaveClass('bg-primary');
        });
        
        // Verify other sections are not active
        sections.forEach(otherSectionName => {
          if (otherSectionName !== sectionName) {
            const otherButton = screen.getByText(otherSectionName);
            expect(otherButton.closest('button')).not.toHaveClass('bg-primary');
          }
        });
      }
    });

    it('should clear previous section content when switching', async () => {
      render(<AnalyticsPage />);
      
      // Navigate to geographic section
      const geographicButton = screen.getByText('Análisis Geográfico');
      fireEvent.click(geographicButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('geographic-analysis')).toBeInTheDocument();
        expect(screen.getByText('Geographic Analysis Section')).toBeInTheDocument();
      });
      
      // Navigate to temporal section
      const temporalButton = screen.getByText('Análisis Temporal');
      fireEvent.click(temporalButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('temporal-analysis')).toBeInTheDocument();
        expect(screen.getByText('Temporal Analysis Section')).toBeInTheDocument();
        // Previous section content should not be present
        expect(screen.queryByTestId('geographic-analysis')).not.toBeInTheDocument();
      });
      
      // Navigate to productivity section
      const productivityButton = screen.getByText('Productividad de Trabajadores');
      fireEvent.click(productivityButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('worker-productivity')).toBeInTheDocument();
        expect(screen.getByText('Worker Productivity Analytics')).toBeInTheDocument();
        // Previous section content should not be present
        expect(screen.queryByTestId('temporal-analysis')).not.toBeInTheDocument();
      });
    });
  });

  describe('Navigation State Consistency', () => {
    it('should maintain navigation state consistency across multiple cycles', () => {
      render(<AnalyticsPage />);
      
      // Test multiple navigation cycles
      const navigationCycles = [
        ['Resumen General', 'Calidad', 'Alertas'],
        ['Metas y Objetivos', 'Análisis Geográfico', 'Resumen General'],
        ['Productividad de Trabajadores', 'Comparativas', 'Análisis Temporal']
      ];
      
      navigationCycles.forEach((cycle, cycleIndex) => {
        cycle.forEach(sectionName => {
          const sectionButton = screen.getByText(sectionName);
          fireEvent.click(sectionButton);
          
          // Verify correct active state
          expect(sectionButton.closest('button')).toHaveClass('bg-primary');
          
          // Verify all navigation buttons are still present and functional
          const allSectionNames = [
            'Resumen General',
            'Productividad de Trabajadores',
            'Análisis Geográfico',
            'Análisis Temporal',
            'Calidad',
            'Metas y Objetivos',
            'Alertas',
            'Comparativas'
          ];
          
          allSectionNames.forEach(name => {
            const button = screen.getByText(name);
            expect(button).toBeInTheDocument();
            expect(button.closest('button')).not.toBeDisabled();
          });
        });
      });
    });

    it('should handle edge cases in navigation', async () => {
      render(<AnalyticsPage />);
      
      // Test clicking the same section multiple times
      const overviewButton = screen.getByText('Resumen General');
      
      // Click overview multiple times
      fireEvent.click(overviewButton);
      fireEvent.click(overviewButton);
      fireEvent.click(overviewButton);
      
      // Should remain active and stable
      expect(overviewButton.closest('button')).toHaveClass('bg-primary');
      expect(screen.getByText('Total Líderes')).toBeInTheDocument();
      
      // Test switching to another section and back
      const alertsButton = screen.getByText('Alertas');
      fireEvent.click(alertsButton);
      
      await waitFor(() => {
        expect(alertsButton.closest('button')).toHaveClass('bg-primary');
        expect(screen.getByTestId('alerts-panel')).toBeInTheDocument();
      });
      
      // Switch back to overview
      fireEvent.click(overviewButton);
      
      await waitFor(() => {
        expect(overviewButton.closest('button')).toHaveClass('bg-primary');
        expect(screen.getByText('Total Líderes')).toBeInTheDocument();
      });
    });
  });

  describe('Section Validation and Error Prevention', () => {
    it('should not display eliminated sections in navigation', () => {
      render(<AnalyticsPage />);
      
      // Verify eliminated sections are completely absent
      const eliminatedSections = ['Salud de Red', 'Eficiencia', 'Predicciones'];
      
      eliminatedSections.forEach(sectionName => {
        expect(screen.queryByText(sectionName)).not.toBeInTheDocument();
      });
      
      // Verify no buttons contain eliminated section names
      const allButtons = screen.getAllByRole('button');
      allButtons.forEach(button => {
        const buttonText = button.textContent || '';
        eliminatedSections.forEach(eliminatedName => {
          expect(buttonText).not.toContain(eliminatedName);
        });
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
      expect(screen.getByText('Progreso hacia Meta Anual')).toBeInTheDocument();
    });
  });

  describe('Performance and Stability', () => {
    it('should handle rapid section switching without performance issues', async () => {
      render(<AnalyticsPage />);
      
      const sectionsToTest = [
        'Alertas',
        'Calidad', 
        'Resumen General',
        'Metas y Objetivos',
        'Análisis Geográfico',
        'Análisis Temporal',
        'Productividad de Trabajadores',
        'Comparativas'
      ];
      
      // Rapidly switch between all sections
      for (const sectionName of sectionsToTest) {
        const sectionButton = screen.getByText(sectionName);
        fireEvent.click(sectionButton);
        
        // Verify section becomes active without delay
        expect(sectionButton.closest('button')).toHaveClass('bg-primary');
      }
      
      // Verify final state is correct
      const finalButton = screen.getByText('Comparativas');
      expect(finalButton.closest('button')).toHaveClass('bg-primary');
      
      await waitFor(() => {
        expect(screen.getByTestId('comparison-tools')).toBeInTheDocument();
      });
    });

    it('should maintain component stability during navigation', () => {
      render(<AnalyticsPage />);
      
      // Verify core components remain stable during navigation
      const coreComponents = [
        'performance-monitor',
        'cache-monitor',
        'realtime-indicator',
        'update-detector'
      ];
      
      // Navigate through several sections
      const sectionsToNavigate = ['Calidad', 'Alertas', 'Resumen General'];
      
      sectionsToNavigate.forEach(sectionName => {
        const sectionButton = screen.getByText(sectionName);
        fireEvent.click(sectionButton);
        
        // Verify core components are still present
        coreComponents.forEach(componentTestId => {
          expect(screen.getByTestId(componentTestId)).toBeInTheDocument();
        });
      });
    });
  });
});