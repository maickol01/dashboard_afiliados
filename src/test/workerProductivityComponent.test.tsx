import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import WorkerProductivityAnalytics from '../components/analytics/productivity/WorkerProductivityAnalytics';
import { Person } from '../types';

// Mock the DataService
vi.mock('../services/dataService', () => ({
  DataService: {
    generateWorkerProductivityAnalytics: vi.fn()
  }
}));

describe('WorkerProductivityAnalytics Component', () => {
  it('should render loading state correctly', () => {
    render(<WorkerProductivityAnalytics hierarchicalData={[]} loading={true} />);
    
    // The component shows a skeleton loading state with animated pulse
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('should render empty state when no data is provided', () => {
    render(<WorkerProductivityAnalytics hierarchicalData={[]} loading={false} />);
    
    expect(screen.getByText('No hay datos disponibles para el análisis de productividad')).toBeInTheDocument();
  });

  it('should handle null hierarchicalData gracefully', () => {
    render(<WorkerProductivityAnalytics hierarchicalData={null as any} loading={false} />);
    
    expect(screen.getByText('No hay datos disponibles para el análisis de productividad')).toBeInTheDocument();
  });

  it('should handle undefined hierarchicalData gracefully', () => {
    render(<WorkerProductivityAnalytics hierarchicalData={undefined as any} loading={false} />);
    
    expect(screen.getByText('No hay datos disponibles para el análisis de productividad')).toBeInTheDocument();
  });

  it('should render error state correctly', async () => {
    const mockData: Person[] = [
      {
        id: 'test-leader',
        name: 'Test Leader',
        nombre: 'Test Leader',
        role: 'lider',
        created_at: new Date(),
        registeredCount: 10,
        num_verificado: true,
        children: []
      }
    ];

    // Mock the DataService to throw an error
    const { DataService } = await import('../services/dataService');
    vi.mocked(DataService.generateWorkerProductivityAnalytics).mockRejectedValue(new Error('Test error'));

    render(<WorkerProductivityAnalytics hierarchicalData={mockData} loading={false} />);

    await waitFor(() => {
      expect(screen.getByText('Error al generar análisis de productividad')).toBeInTheDocument();
    });
  });

  it('should render successfully with valid data', async () => {
    const mockData: Person[] = [
      {
        id: 'test-leader',
        name: 'Test Leader',
        nombre: 'Test Leader',
        role: 'lider',
        created_at: new Date(),
        registeredCount: 10,
        num_verificado: true,
        children: []
      }
    ];

    const mockAnalytics = {
      leaderMetrics: [{
        leaderId: 'test-leader',
        name: 'Test Leader',
        totalNetwork: 10,
        brigadierCount: 0,
        mobilizerCount: 0,
        citizenCount: 10,
        registrationVelocity: 1,
        networkEfficiency: 100,
        timeToTarget: 40,
        performanceRank: 1,
        trendDirection: 'up' as const,
        lastActivityDate: new Date(),
        recommendations: []
      }],
      brigadierMetrics: [],
      mobilizerMetrics: [],
      comparativeAnalysis: [],
      overallInsights: {
        mostEffectiveLevel: 'leader' as const,
        recommendedActions: [],
        performanceTrends: []
      }
    };

    // Mock the DataService to return valid data
    const { DataService } = await import('../services/dataService');
    vi.mocked(DataService.generateWorkerProductivityAnalytics).mockResolvedValue(mockAnalytics);

    render(<WorkerProductivityAnalytics hierarchicalData={mockData} loading={false} />);

    await waitFor(() => {
      expect(screen.getByText('Análisis de Productividad de Trabajadores')).toBeInTheDocument();
      expect(screen.getByText('Líderes')).toBeInTheDocument();
      expect(screen.getByText('Brigadistas')).toBeInTheDocument();
      expect(screen.getByText('Movilizadores')).toBeInTheDocument();
    });
  });
});