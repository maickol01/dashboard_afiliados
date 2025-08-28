import React from 'react';
import { render, screen } from '@testing-library/react';
import GoalsSection from '../GoalsSection';
import { Analytics } from '../../../types';

describe('GoalsSection', () => {
  const mockAnalytics: Analytics = {
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
      individualGoals: [
        {
          id: '1',
          name: 'Líder 1',
          current: 25,
          target: 50,
          status: 'on-track',
        },
        {
          id: '2',
          name: 'Líder 2',
          current: 60,
          target: 50,
          status: 'ahead',
        },
      ],
      milestones: [
        {
          date: '2024-12-31',
          description: 'Meta Anual',
          completed: false,
          target: 5000,
        },
      ],
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
  };

  it('renders goals section correctly', () => {
    render(<GoalsSection analytics={mockAnalytics} />);
    
    expect(screen.getByText('Meta General del Año')).toBeInTheDocument();
    expect(screen.getByText('Hitos del Año')).toBeInTheDocument();
    expect(screen.getByText('Metas Individuales por Líder')).toBeInTheDocument();
    expect(screen.getByText('20.0%')).toBeInTheDocument(); // percentage
    expect(screen.getByText('1,000 de 5,000 ciudadanos')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    render(<GoalsSection analytics={mockAnalytics} loading={true} />);
    
    expect(document.querySelectorAll('.animate-pulse')).toHaveLength(1);
  });

  it('renders individual goals table', () => {
    render(<GoalsSection analytics={mockAnalytics} />);
    
    expect(screen.getByText('Líder 1')).toBeInTheDocument();
    expect(screen.getByText('Líder 2')).toBeInTheDocument();
    expect(screen.getByText('25')).toBeInTheDocument(); // current progress
    expect(screen.getByText('60')).toBeInTheDocument(); // current progress
    expect(screen.getByText('En Progreso')).toBeInTheDocument();
    expect(screen.getByText('Adelantado')).toBeInTheDocument();
  });

  it('renders milestones correctly', () => {
    render(<GoalsSection analytics={mockAnalytics} />);
    
    expect(screen.getByText('Meta Anual')).toBeInTheDocument();
    expect(screen.getByText('5,000')).toBeInTheDocument(); // target
    expect(screen.getByText('Pendiente')).toBeInTheDocument(); // status
  });
});