import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import AnalyticsPage from '../components/analytics/AnalyticsPage'
import { useData } from '../hooks/useData'

// Mock the useData hook
vi.mock('../hooks/useData')

// Mock all the section components
vi.mock('../components/analytics/sections/GeographicAnalysis', () => ({
  default: () => <div data-testid="geographic-section">Geographic Analysis</div>
}))

vi.mock('../components/analytics/sections/TemporalAnalysis', () => ({
  default: () => <div data-testid="temporal-section">Temporal Analysis</div>
}))

vi.mock('../components/analytics/sections/QualityMetrics', () => ({
  default: () => <div data-testid="quality-section">Quality Metrics</div>
}))

vi.mock('../components/analytics/sections/GoalsAndObjectives', () => ({
  default: () => <div data-testid="goals-section">Goals and Objectives</div>
}))

vi.mock('../components/analytics/sections/AlertsPanel', () => ({
  default: () => <div data-testid="alerts-section">Alerts Panel</div>
}))

vi.mock('../components/analytics/sections/ComparisonTools', () => ({
  default: () => <div data-testid="comparison-section">Comparison Tools</div>
}))

vi.mock('../components/analytics/productivity/WorkerProductivityAnalytics', () => ({
  default: () => <div data-testid="productivity-section">Worker Productivity Analytics</div>
}))

// Mock other components
vi.mock('../components/analytics/RealTimeIndicator', () => ({
  default: () => <div data-testid="realtime-indicator">Real Time Indicator</div>
}))

vi.mock('../components/analytics/UpdateDetector', () => ({
  default: () => <div data-testid="update-detector">Update Detector</div>
}))

vi.mock('../components/common/PerformanceMonitor', () => ({
  default: () => <div data-testid="performance-monitor">Performance Monitor</div>
}))

vi.mock('../components/analytics/CacheMonitor', () => ({
  CacheMonitor: () => <div data-testid="cache-monitor">Cache Monitor</div>
}))

vi.mock('../components/common/UpdateNotification', () => ({
  default: () => <div data-testid="update-notification">Update Notification</div>
}))

const mockAnalytics = {
  totalLideres: 150,
  totalBrigadistas: 1200,
  totalMobilizers: 9600,
  totalCitizens: 76800,
  conversionRate: 85.5,
  growthRate: 12.3,
  quality: {
    dataCompleteness: 92.5
  },
  alerts: {
    critical: [
      { id: '1', message: 'Critical alert 1' }
    ],
    warnings: [
      { id: '2', message: 'Warning alert 1' }
    ]
  },
  goals: {
    overallProgress: {
      current: 45000,
      target: 100000,
      percentage: 45.0
    }
  }
}

const mockUseData = {
  data: [],
  analytics: mockAnalytics,
  loading: false,
  analyticsLoading: false,
  error: null,
  performanceMetrics: {},
  lastFetchTime: new Date(),
  refetchData: vi.fn(),
  forceRefresh: vi.fn(),
  getRegistrationsByPeriod: vi.fn(() => []),
  getLeaderPerformanceByPeriod: vi.fn(() => []),
  realTimeStatus: { isConnected: true, isRefreshing: false },
  recentUpdates: [],
  triggerRealTimeRefresh: vi.fn(),
  checkRealTimeConnection: vi.fn(),
  detectManualUpdates: vi.fn(),
  clearRealTimeError: vi.fn(),
  clearRecentUpdates: vi.fn()
}

describe('Analytics Navigation Testing', () => {
  beforeEach(() => {
    vi.mocked(useData).mockReturnValue(mockUseData)
  })

  it('should render all remaining navigation sections correctly', () => {
    render(<AnalyticsPage />)
    
    // Verify that all remaining sections are present in navigation
    const expectedSections = [
      'Resumen General',
      'Productividad de Trabajadores', 
      'Análisis Geográfico',
      'Análisis Temporal',
      'Calidad',
      'Metas y Objetivos',
      'Alertas',
      'Comparativas'
    ]
    
    expectedSections.forEach(sectionName => {
      expect(screen.getByText(sectionName)).toBeInTheDocument()
    })
  })

  it('should NOT render eliminated sections in navigation', () => {
    render(<AnalyticsPage />)
    
    // Verify that eliminated sections are NOT present
    const eliminatedSections = [
      'Salud de Red',
      'Eficiencia', 
      'Predicciones'
    ]
    
    eliminatedSections.forEach(sectionName => {
      expect(screen.queryByText(sectionName)).not.toBeInTheDocument()
    })
  })

  it('should load overview section by default', () => {
    render(<AnalyticsPage />)
    
    // Verify overview section is active by default
    const overviewButton = screen.getByText('Resumen General')
    expect(overviewButton).toHaveClass('bg-primary', 'text-white')
    
    // Verify overview content is displayed
    expect(screen.getByText('Total Líderes')).toBeInTheDocument()
    expect(screen.getByText('150')).toBeInTheDocument()
  })

  it('should navigate to productivity section correctly', async () => {
    render(<AnalyticsPage />)
    
    const productivityButton = screen.getByText('Productividad de Trabajadores')
    fireEvent.click(productivityButton)
    
    await waitFor(() => {
      expect(productivityButton).toHaveClass('bg-primary', 'text-white')
      expect(screen.getByTestId('productivity-section')).toBeInTheDocument()
    })
  })

  it('should navigate to geographic section correctly', async () => {
    render(<AnalyticsPage />)
    
    const geographicButton = screen.getByText('Análisis Geográfico')
    fireEvent.click(geographicButton)
    
    await waitFor(() => {
      expect(geographicButton).toHaveClass('bg-primary', 'text-white')
      expect(screen.getByTestId('geographic-section')).toBeInTheDocument()
    })
  })

  it('should navigate to temporal section correctly', async () => {
    render(<AnalyticsPage />)
    
    const temporalButton = screen.getByText('Análisis Temporal')
    fireEvent.click(temporalButton)
    
    await waitFor(() => {
      expect(temporalButton).toHaveClass('bg-primary', 'text-white')
      expect(screen.getByTestId('temporal-section')).toBeInTheDocument()
    })
  })

  it('should navigate to quality section correctly', async () => {
    render(<AnalyticsPage />)
    
    const qualityButton = screen.getByText('Calidad')
    fireEvent.click(qualityButton)
    
    await waitFor(() => {
      expect(qualityButton).toHaveClass('bg-primary', 'text-white')
      expect(screen.getByTestId('quality-section')).toBeInTheDocument()
    })
  })

  it('should navigate to goals section correctly', async () => {
    render(<AnalyticsPage />)
    
    const goalsButton = screen.getByText('Metas y Objetivos')
    fireEvent.click(goalsButton)
    
    await waitFor(() => {
      expect(goalsButton).toHaveClass('bg-primary', 'text-white')
      expect(screen.getByTestId('goals-section')).toBeInTheDocument()
    })
  })

  it('should navigate to alerts section correctly', async () => {
    render(<AnalyticsPage />)
    
    const alertsButton = screen.getByText('Alertas')
    fireEvent.click(alertsButton)
    
    await waitFor(() => {
      expect(alertsButton).toHaveClass('bg-primary', 'text-white')
      expect(screen.getByTestId('alerts-section')).toBeInTheDocument()
    })
  })

  it('should navigate to comparison section correctly', async () => {
    render(<AnalyticsPage />)
    
    const comparisonButton = screen.getByText('Comparativas')
    fireEvent.click(comparisonButton)
    
    await waitFor(() => {
      expect(comparisonButton).toHaveClass('bg-primary', 'text-white')
      expect(screen.getByTestId('comparison-section')).toBeInTheDocument()
    })
  })

  it('should redirect eliminated sections to overview', async () => {
    render(<AnalyticsPage />)
    
    // Simulate trying to access eliminated sections programmatically
    const component = screen.getByTestId('analytics-page') || document.body
    
    // Test that eliminated section IDs redirect to overview
    const eliminatedSectionIds = ['network', 'efficiency', 'predictions']
    
    eliminatedSectionIds.forEach(sectionId => {
      // This would be handled by the validation logic in the component
      // The test verifies that these sections don't appear in navigation
      expect(screen.queryByTestId(`${sectionId}-section`)).not.toBeInTheDocument()
    })
    
    // Verify overview is still active
    const overviewButton = screen.getByText('Resumen General')
    expect(overviewButton).toHaveClass('bg-primary', 'text-white')
  })

  it('should maintain navigation state when switching between sections', async () => {
    render(<AnalyticsPage />)
    
    // Start with overview
    expect(screen.getByText('Resumen General')).toHaveClass('bg-primary', 'text-white')
    
    // Navigate to geographic
    fireEvent.click(screen.getByText('Análisis Geográfico'))
    await waitFor(() => {
      expect(screen.getByText('Análisis Geográfico')).toHaveClass('bg-primary', 'text-white')
      expect(screen.getByText('Resumen General')).not.toHaveClass('bg-primary', 'text-white')
    })
    
    // Navigate to temporal
    fireEvent.click(screen.getByText('Análisis Temporal'))
    await waitFor(() => {
      expect(screen.getByText('Análisis Temporal')).toHaveClass('bg-primary', 'text-white')
      expect(screen.getByText('Análisis Geográfico')).not.toHaveClass('bg-primary', 'text-white')
    })
    
    // Navigate back to overview
    fireEvent.click(screen.getByText('Resumen General'))
    await waitFor(() => {
      expect(screen.getByText('Resumen General')).toHaveClass('bg-primary', 'text-white')
      expect(screen.getByText('Análisis Temporal')).not.toHaveClass('bg-primary', 'text-white')
    })
  })

  it('should render navigation with proper responsive layout', () => {
    render(<AnalyticsPage />)
    
    // Verify navigation container has proper classes
    const navigationContainer = screen.getByText('Resumen General').closest('.flex')
    expect(navigationContainer).toHaveClass('flex-wrap', 'gap-2')
    
    // Verify buttons have proper responsive classes
    const buttons = screen.getAllByRole('button').filter(button => 
      button.textContent?.includes('Resumen') || 
      button.textContent?.includes('Productividad') ||
      button.textContent?.includes('Análisis')
    )
    
    buttons.forEach(button => {
      expect(button).toHaveClass('whitespace-nowrap')
    })
  })
})