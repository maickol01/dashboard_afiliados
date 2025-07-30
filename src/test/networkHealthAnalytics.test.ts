import { describe, it, expect } from 'vitest';
import { DataService } from '../services/dataService';
import { Person } from '../types';

describe('Network Health Analytics', () => {
  // Mock hierarchical data for testing
  const mockHierarchicalData: Person[] = [
    {
      id: '1',
      name: 'Leader 1',
      nombre: 'Leader 1',
      role: 'lider',
      created_at: new Date('2024-01-01'),
      registeredCount: 50,
      num_verificado: true,
      children: [
        {
          id: '2',
          name: 'Brigadier 1',
          nombre: 'Brigadier 1',
          role: 'brigadista',
          created_at: new Date('2024-01-02'),
          registeredCount: 25,
          num_verificado: true,
          lider_id: '1',
          parentId: '1',
          children: [
            {
              id: '3',
              name: 'Mobilizer 1',
              nombre: 'Mobilizer 1',
              role: 'movilizador',
              created_at: new Date('2024-01-03'),
              registeredCount: 10,
              num_verificado: true,
              brigadista_id: '2',
              parentId: '2',
              children: Array.from({ length: 10 }, (_, i) => ({
                id: `citizen-${i + 1}`,
                name: `Citizen ${i + 1}`,
                nombre: `Citizen ${i + 1}`,
                role: 'ciudadano' as const,
                created_at: new Date('2024-01-04'),
                registeredCount: 0,
                num_verificado: true,
                movilizador_id: '3',
                parentId: '3'
              }))
            }
          ]
        },
        {
          id: '4',
          name: 'Brigadier 2',
          nombre: 'Brigadier 2',
          role: 'brigadista',
          created_at: new Date('2024-01-05'),
          registeredCount: 25,
          num_verificado: true,
          lider_id: '1',
          parentId: '1',
          children: [
            {
              id: '5',
              name: 'Mobilizer 2',
              nombre: 'Mobilizer 2',
              role: 'movilizador',
              created_at: new Date('2024-01-06'),
              registeredCount: 15,
              num_verificado: true,
              brigadista_id: '4',
              parentId: '4',
              children: Array.from({ length: 15 }, (_, i) => ({
                id: `citizen-${i + 11}`,
                name: `Citizen ${i + 11}`,
                nombre: `Citizen ${i + 11}`,
                role: 'ciudadano' as const,
                created_at: new Date('2024-01-07'),
                registeredCount: 0,
                num_verificado: true,
                movilizador_id: '5',
                parentId: '5'
              }))
            }
          ]
        }
      ]
    }
  ];

  it('should generate network health analytics', () => {
    const networkHealth = DataService.generateNetworkHealthAnalytics(mockHierarchicalData);
    
    expect(networkHealth).toBeDefined();
    expect(networkHealth.hierarchicalBalance).toBeDefined();
    expect(networkHealth.growthPatterns).toBeDefined();
    expect(networkHealth.structuralHealth).toBeDefined();
    expect(networkHealth.expansionRate).toBeDefined();
    expect(networkHealth.summary).toBeDefined();
  });

  it('should calculate hierarchical balance correctly', () => {
    const networkHealth = DataService.generateNetworkHealthAnalytics(mockHierarchicalData);
    const balance = networkHealth.hierarchicalBalance[0];
    
    expect(balance.leaderId).toBe('1');
    expect(balance.leaderName).toBe('Leader 1');
    expect(balance.brigadierCount).toBe(2);
    expect(balance.mobilizerCount).toBe(2);
    expect(balance.citizenCount).toBe(25);
    expect(balance.balanceScore).toBeGreaterThan(0);
    expect(['balanced', 'overloaded', 'underutilized']).toContain(balance.balanceStatus);
  });

  it('should generate growth patterns', () => {
    const networkHealth = DataService.generateNetworkHealthAnalytics(mockHierarchicalData);
    const growthPatterns = networkHealth.growthPatterns;
    
    expect(growthPatterns).toHaveLength(12); // 12 months
    expect(growthPatterns[0]).toHaveProperty('period');
    expect(growthPatterns[0]).toHaveProperty('totalNetworkSize');
    expect(growthPatterns[0]).toHaveProperty('growthRate');
    expect(['accelerating', 'steady', 'declining']).toContain(growthPatterns[0].growthTrend);
  });

  it('should calculate structural health metrics', () => {
    const networkHealth = DataService.generateNetworkHealthAnalytics(mockHierarchicalData);
    const structuralHealth = networkHealth.structuralHealth;
    
    expect(Array.isArray(structuralHealth)).toBe(true);
    
    // Each metric should have the required properties
    structuralHealth.forEach(metric => {
      expect(metric).toHaveProperty('metricType');
      expect(metric).toHaveProperty('count');
      expect(metric).toHaveProperty('percentage');
      expect(metric).toHaveProperty('affectedWorkers');
      expect(metric).toHaveProperty('recommendations');
      expect(['orphaned_workers', 'broken_chains', 'inactive_nodes', 'overloaded_nodes']).toContain(metric.metricType);
    });
  });

  it('should calculate network expansion rate', () => {
    const networkHealth = DataService.generateNetworkHealthAnalytics(mockHierarchicalData);
    const expansionRate = networkHealth.expansionRate;
    
    expect(expansionRate).toHaveLength(12); // 12 weeks
    expect(expansionRate[0]).toHaveProperty('period');
    expect(expansionRate[0]).toHaveProperty('expansionRate');
    expect(expansionRate[0]).toHaveProperty('newConnections');
    expect(expansionRate[0]).toHaveProperty('networkDensity');
    expect(['high', 'medium', 'low']).toContain(expansionRate[0].expansionQuality);
  });

  it('should generate network health summary', () => {
    const networkHealth = DataService.generateNetworkHealthAnalytics(mockHierarchicalData);
    const summary = networkHealth.summary;
    
    expect(summary.overallHealthScore).toBeGreaterThanOrEqual(0);
    expect(summary.overallHealthScore).toBeLessThanOrEqual(100);
    expect(['excellent', 'good', 'fair', 'poor']).toContain(summary.healthStatus);
    expect(typeof summary.criticalIssues).toBe('number');
    expect(typeof summary.warnings).toBe('number');
    expect(Array.isArray(summary.strengths)).toBe(true);
    expect(Array.isArray(summary.weaknesses)).toBe(true);
    expect(Array.isArray(summary.actionItems)).toBe(true);
    
    // Action items should have required properties
    summary.actionItems.forEach(item => {
      expect(['high', 'medium', 'low']).toContain(item.priority);
      expect(typeof item.action).toBe('string');
      expect(typeof item.impact).toBe('string');
    });
  });

  it('should handle empty data gracefully', () => {
    const networkHealth = DataService.generateNetworkHealthAnalytics([]);
    
    expect(networkHealth.hierarchicalBalance).toHaveLength(0);
    expect(networkHealth.growthPatterns).toHaveLength(12);
    expect(networkHealth.structuralHealth).toHaveLength(0);
    expect(networkHealth.expansionRate).toHaveLength(12);
    expect(networkHealth.summary.overallHealthScore).toBe(0);
    expect(networkHealth.summary.healthStatus).toBe('poor');
  });
});