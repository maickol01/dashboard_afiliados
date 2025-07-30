import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import NetworkHealthAnalytics from '../components/analytics/sections/NetworkHealthAnalytics';
import { Analytics } from '../types';

describe('NetworkHealthAnalytics Component', () => {
  const mockAnalytics: Analytics = {
    totalLideres: 5,
    totalBrigadistas: 25,
    totalMobilizers: 125,
    totalCitizens: 625,
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
      registrationSpeed: { average: 5, fastest: 10, slowest: 2 }
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
      dataCompleteness: 85,
      duplicateRate: 2,
      verificationRate: 90,
      postRegistrationActivity: 70
    },
    goals: {
      overallProgress: { current: 625, target: 1000, percentage: 62.5 },
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
    },
    networkHealth: {
      hierarchicalBalance: [
        {
          leaderId: '1',
          leaderName: 'Test Leader',
          brigadierCount: 5,
          mobilizerCount: 25,
          citizenCount: 125,
          avgBrigadiersPerLeader: 5,
          avgMobilizersPerBrigadier: 5,
          avgCitizensPerMobilizer: 5,
          balanceScore: 85,
          balanceStatus: 'balanced',
          recommendations: ['Mantener el balance actual']
        }
      ],
      growthPatterns: [
        {
          period: 'Enero 2024',
          date: new Date('2024-01-01'),
          newLeaders: 1,
          newBrigadiers: 5,
          newMobilizers: 25,
          newCitizens: 125,
          totalNetworkSize: 156,
          growthRate: 15,
          growthTrend: 'accelerating'
        }
      ],
      structuralHealth: [
        {
          metricType: 'orphaned_workers',
          count: 2,
          percentage: 1.2,
          affectedWorkers: [
            {
              id: '1',
              name: 'Worker 1',
              role: 'brigadista',
              issue: 'Sin conexión jerárquica válida',
              severity: 'high'
            }
          ],
          recommendations: ['Reasignar trabajadores huérfanos']
        }
      ],
      expansionRate: [
        {
          period: 'Semana 1',
          date: new Date('2024-01-01'),
          expansionRate: 10,
          newConnections: 15,
          networkDensity: 0.1,
          coverageIncrease: 1.5,
          efficiencyScore: 80,
          expansionQuality: 'high'
        }
      ],
      summary: {
        overallHealthScore: 85,
        healthStatus: 'good',
        criticalIssues: 1,
        warnings: 2,
        strengths: ['Red bien balanceada jerárquicamente'],
        weaknesses: ['Algunos trabajadores huérfanos'],
        actionItems: [
          {
            priority: 'high',
            action: 'Resolver trabajadores huérfanos',
            impact: 'Mejora la integridad estructural'
          }
        ]
      }
    }
  };

  it('renders network health analytics component', () => {
    render(<NetworkHealthAnalytics analytics={mockAnalytics} />);
    
    expect(screen.getByText('Resumen de Salud de Red')).toBeInTheDocument();
    expect(screen.getByText('Puntuación General')).toBeInTheDocument();
    expect(screen.getByText('Buena')).toBeInTheDocument(); // Health status
  });

  it('renders balance tab content', () => {
    render(<NetworkHealthAnalytics analytics={mockAnalytics} />);
    
    // Check for balance metrics
    expect(screen.getByText('Balance Jerárquico')).toBeInTheDocument();
    expect(screen.getByText('Test Leader')).toBeInTheDocument();
    expect(screen.getByText('Balanceado')).toBeInTheDocument();
  });

  it('renders health summary correctly', () => {
    render(<NetworkHealthAnalytics analytics={mockAnalytics} />);
    
    expect(screen.getByText('Áreas de Mejora')).toBeInTheDocument();
    expect(screen.getByText('Plan de Acción')).toBeInTheDocument();
    expect(screen.getByText('Red bien balanceada jerárquicamente')).toBeInTheDocument();
    expect(screen.getByText('Resolver trabajadores huérfanos')).toBeInTheDocument();
  });

  it('handles missing network health data', () => {
    const analyticsWithoutNetworkHealth = { ...mockAnalytics };
    delete analyticsWithoutNetworkHealth.networkHealth;
    
    render(<NetworkHealthAnalytics analytics={analyticsWithoutNetworkHealth} />);
    
    expect(screen.getByText('No hay datos de salud de red disponibles')).toBeInTheDocument();
  });

  it('renders tab navigation', () => {
    render(<NetworkHealthAnalytics analytics={mockAnalytics} />);
    
    expect(screen.getByText('Balance Jerárquico')).toBeInTheDocument();
    expect(screen.getByText('Patrones de Crecimiento')).toBeInTheDocument();
    expect(screen.getByText('Salud Estructural')).toBeInTheDocument();
    expect(screen.getByText('Tasa de Expansión')).toBeInTheDocument();
  });
});