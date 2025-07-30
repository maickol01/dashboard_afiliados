import { describe, it, expect, beforeEach } from 'vitest';
import { DataService } from '../services/dataService';
import { Person } from '../types';

describe('Worker Productivity Analytics', () => {
  let mockHierarchicalData: Person[];

  beforeEach(() => {
    // Create mock hierarchical data for testing
    mockHierarchicalData = [
      {
        id: 'leader1',
        name: 'Juan Pérez',
        nombre: 'Juan Pérez',
        role: 'lider',
        created_at: new Date('2024-01-01'),
        registeredCount: 25,
        num_verificado: true,
        children: [
          {
            id: 'brigadier1',
            name: 'María García',
            nombre: 'María García',
            role: 'brigadista',
            created_at: new Date('2024-01-02'),
            registeredCount: 15,
            num_verificado: true,
            parentId: 'leader1',
            lider_id: 'leader1',
            children: [
              {
                id: 'mobilizer1',
                name: 'Carlos López',
                nombre: 'Carlos López',
                role: 'movilizador',
                created_at: new Date('2024-01-03'),
                registeredCount: 8,
                num_verificado: true,
                parentId: 'brigadier1',
                brigadista_id: 'brigadier1',
                children: [
                  {
                    id: 'citizen1',
                    name: 'Ana Martínez',
                    nombre: 'Ana Martínez',
                    role: 'ciudadano',
                    created_at: new Date('2024-01-04'),
                    registeredCount: 0,
                    num_verificado: true,
                    parentId: 'mobilizer1',
                    movilizador_id: 'mobilizer1'
                  }
                ]
              }
            ]
          }
        ]
      }
    ];
  });

  it('should generate worker productivity analytics', async () => {
    const analytics = await DataService.generateWorkerProductivityAnalytics(mockHierarchicalData);

    expect(analytics).toBeDefined();
    expect(analytics.leaderMetrics).toHaveLength(1);
    expect(analytics.brigadierMetrics).toHaveLength(1);
    expect(analytics.mobilizerMetrics).toHaveLength(1);
    expect(analytics.comparativeAnalysis).toHaveLength(3); // leader, brigadier, mobilizer
  });

  it('should calculate leader productivity metrics correctly', async () => {
    const analytics = await DataService.generateWorkerProductivityAnalytics(mockHierarchicalData);
    const leaderMetric = analytics.leaderMetrics[0];

    expect(leaderMetric.leaderId).toBe('leader1');
    expect(leaderMetric.name).toBe('Juan Pérez');
    expect(leaderMetric.citizenCount).toBe(25);
    expect(leaderMetric.brigadierCount).toBe(1);
    expect(leaderMetric.mobilizerCount).toBe(1);
    expect(leaderMetric.totalNetwork).toBe(27); // 1 brigadier + 1 mobilizer + 25 citizens
    expect(leaderMetric.performanceRank).toBe(1);
  });

  it('should calculate brigadier productivity metrics correctly', async () => {
    const analytics = await DataService.generateWorkerProductivityAnalytics(mockHierarchicalData);
    const brigadierMetric = analytics.brigadierMetrics[0];

    expect(brigadierMetric.brigadierId).toBe('brigadier1');
    expect(brigadierMetric.name).toBe('María García');
    expect(brigadierMetric.leaderId).toBe('leader1');
    expect(brigadierMetric.leaderName).toBe('Juan Pérez');
    expect(brigadierMetric.citizenCount).toBe(15);
    expect(brigadierMetric.mobilizerCount).toBe(1);
    expect(brigadierMetric.avgCitizensPerMobilizer).toBe(15);
  });

  it('should calculate mobilizer productivity metrics correctly', async () => {
    const analytics = await DataService.generateWorkerProductivityAnalytics(mockHierarchicalData);
    const mobilizerMetric = analytics.mobilizerMetrics[0];

    expect(mobilizerMetric.mobilizerId).toBe('mobilizer1');
    expect(mobilizerMetric.name).toBe('Carlos López');
    expect(mobilizerMetric.brigadierId).toBe('brigadier1');
    expect(mobilizerMetric.brigadierName).toBe('María García');
    expect(mobilizerMetric.leaderId).toBe('leader1');
    expect(mobilizerMetric.leaderName).toBe('Juan Pérez');
    expect(mobilizerMetric.citizenCount).toBe(8);
  });

  it('should generate comparative analysis for all levels', async () => {
    const analytics = await DataService.generateWorkerProductivityAnalytics(mockHierarchicalData);
    const comparative = analytics.comparativeAnalysis;

    expect(comparative).toHaveLength(3);
    
    const leaderAnalysis = comparative.find(c => c.level === 'leader');
    const brigadierAnalysis = comparative.find(c => c.level === 'brigadier');
    const mobilizerAnalysis = comparative.find(c => c.level === 'mobilizer');

    expect(leaderAnalysis).toBeDefined();
    expect(brigadierAnalysis).toBeDefined();
    expect(mobilizerAnalysis).toBeDefined();

    expect(leaderAnalysis?.averagePerformance).toBe(25);
    expect(brigadierAnalysis?.averagePerformance).toBe(15);
    expect(mobilizerAnalysis?.averagePerformance).toBe(8);
  });

  it('should generate overall insights', async () => {
    const analytics = await DataService.generateWorkerProductivityAnalytics(mockHierarchicalData);
    const insights = analytics.overallInsights;

    expect(insights.mostEffectiveLevel).toBeDefined();
    expect(['leader', 'brigadier', 'mobilizer']).toContain(insights.mostEffectiveLevel);
    expect(insights.recommendedActions).toBeInstanceOf(Array);
    expect(insights.performanceTrends).toHaveLength(3);
  });

  it('should handle empty data gracefully', async () => {
    const analytics = await DataService.generateWorkerProductivityAnalytics([]);

    expect(analytics.leaderMetrics).toHaveLength(0);
    expect(analytics.brigadierMetrics).toHaveLength(0);
    expect(analytics.mobilizerMetrics).toHaveLength(0);
    expect(analytics.comparativeAnalysis).toHaveLength(0);
  });
});