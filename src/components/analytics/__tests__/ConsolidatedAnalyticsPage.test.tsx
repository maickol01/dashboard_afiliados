import React from 'react';
import { render, screen } from '@testing-library/react';
import ConsolidatedAnalyticsPage from '../ConsolidatedAnalyticsPage';

// Mock the useData hook
jest.mock('../../../hooks/useData', () => ({
  useData: () => ({
    data: [],
    analytics: {
      totalLideres: 10,
      totalBrigadistas: 25,
      totalMobilizers: 50,
      totalCitizens: 100,
      dailyRegistrations: [],
      weeklyRegistrations: [],
      monthlyRegistrations: [],
      leaderPerformance: [],
      conversionRate: 75,
      growthRate: 10,
      efficiency: {
        conversionByLeader: [],
        productivityByBrigadier: [],
        topPerformers: [],
        needsSupport: [],
        registrationSpeed: { average: 5, fastest: 10, slowest: 1 },
      },
      geographic: {
        regionDistribution: [],
        heatmapData: [],
        territorialCoverage: [],
      },
      temporal: {
        hourlyPatterns: [],
        weeklyPatterns: [],
        seasonality: [],
        projections: [],
      },
      quality: {
        dataCompleteness: 85,
        duplicateRate: 2,
        verificationRate: 80,
        postRegistrationActivity: 70,
      },
      goals: {
        overallProgress: {
          current: 1000,
          target: 5000,
          percentage: 20,
        },
        individualGoals: [],
        milestones: [],
      },
      alerts: {
        critical: [],
        warnings: [],
        achievements: [],
      },
      predictions: {
        churnRisk: [],
        resourceOptimization: [],
        patterns: [],
      },
    },
    loading: false,
    error: null,
    refetchData: jest.fn(),
    getRegistrationsByPeriod: jest.fn(() => []),
    getLeaderPerformanceByPeriod: jest.fn(() => []),
    realTimeStatus: {
      isConnected: true,
      isRefreshing: false,
      lastUpdate: new Date(),
      error: null,
    },
    recentUpdates: [],
    triggerRealTimeRefresh: jest.fn(),
    checkRealTimeConnection: jest.fn(),
    detectManualUpdates: jest.fn(),
    clearRealTimeError: jest.fn(),
    clearRecentUpdates: jest.fn(),
  }),
}));

// Mock the chart components
jest.mock('../../charts/LineChart', () => {
  return function MockLineChart({ title }: { title: string }) {
    return <div data-testid="line-chart">{title}</div>;
  };
});

jest.mock('../../charts/EnhancedLeaderPerformanceChart', () => {
  return function MockEnhancedLeaderPerformanceChart({ title }: { title: string }) {
    return <div data-testid="leader-performance-chart">{title}</div>;
  };
});

describe('ConsolidatedAnalyticsPage', () => {
  it('renders consolidated analytics page correctly', () => {
    render(<ConsolidatedAnalyticsPage />);
    
    expect(screen.getByTestId('consolidated-analytics-page')).toBeInTheDocument();
    expect(screen.getByText('Métricas Principales')).toBeInTheDocument();
    expect(screen.getByText('Total Líderes')).toBeInTheDocument();
    expect(screen.getByText('Total Brigadistas')).toBeInTheDocument();
    expect(screen.getByText('Total Movilizadores')).toBeInTheDocument();
    expect(screen.getByText('Total Ciudadanos')).toBeInTheDocument();
  });

  it('renders period selector', () => {
    render(<ConsolidatedAnalyticsPage />);
    
    expect(screen.getByText('Registros por Período')).toBeInTheDocument();
    expect(screen.getByText('Día')).toBeInTheDocument();
    expect(screen.getByText('Semana')).toBeInTheDocument();
    expect(screen.getByText('Mes')).toBeInTheDocument();
  });

  it('renders charts section', () => {
    render(<ConsolidatedAnalyticsPage />);
    
    expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    expect(screen.getByTestId('leader-performance-chart')).toBeInTheDocument();
  });

  it('renders productivity table and goals section', () => {
    render(<ConsolidatedAnalyticsPage />);
    
    expect(screen.getByText('Detalle de Productividad por Líder')).toBeInTheDocument();
    expect(screen.getByText('Meta General del Año')).toBeInTheDocument();
  });
});