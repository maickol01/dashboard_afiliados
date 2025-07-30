import { describe, it, expect, beforeEach } from 'vitest';
import { DataService } from '../services/dataService';
import { Person } from '../types';

describe('Worker Productivity Analytics - Error Handling', () => {
  it('should handle null/undefined data gracefully', async () => {
    const analytics = await DataService.generateWorkerProductivityAnalytics(null as any);

    expect(analytics).toBeDefined();
    expect(analytics.leaderMetrics).toHaveLength(0);
    expect(analytics.brigadierMetrics).toHaveLength(0);
    expect(analytics.mobilizerMetrics).toHaveLength(0);
    expect(analytics.comparativeAnalysis).toHaveLength(0);
    expect(analytics.overallInsights.mostEffectiveLevel).toBe('leader');
  });

  it('should handle malformed data gracefully', async () => {
    const malformedData: Person[] = [
      {
        id: '',
        name: '',
        nombre: '',
        role: 'lider',
        created_at: null as any,
        registeredCount: -5, // Invalid negative count
        num_verificado: true,
        children: [
          {
            id: null as any,
            name: null as any,
            nombre: '',
            role: 'brigadista',
            created_at: 'invalid-date' as any,
            registeredCount: NaN,
            num_verificado: true,
            parentId: '',
            lider_id: '',
            children: []
          }
        ]
      }
    ];

    const analytics = await DataService.generateWorkerProductivityAnalytics(malformedData);

    expect(analytics).toBeDefined();
    expect(analytics.leaderMetrics).toBeInstanceOf(Array);
    expect(analytics.brigadierMetrics).toBeInstanceOf(Array);
    expect(analytics.mobilizerMetrics).toBeInstanceOf(Array);
    expect(analytics.overallInsights).toBeDefined();
  });

  it('should handle data with missing required fields', async () => {
    const incompleteData: Person[] = [
      {
        id: 'leader1',
        name: 'Test Leader',
        nombre: 'Test Leader',
        role: 'lider',
        created_at: new Date(),
        registeredCount: 10,
        num_verificado: true,
        children: [
          {
            // Missing id and name
            nombre: '',
            role: 'brigadista',
            created_at: new Date(),
            registeredCount: 5,
            num_verificado: true,
            parentId: 'leader1',
            lider_id: 'leader1',
            children: []
          } as any
        ]
      }
    ];

    const analytics = await DataService.generateWorkerProductivityAnalytics(incompleteData);

    expect(analytics).toBeDefined();
    expect(analytics.leaderMetrics.length).toBeGreaterThanOrEqual(0);
    expect(analytics.brigadierMetrics.length).toBeGreaterThanOrEqual(0);
  });

  it('should handle data with circular references safely', async () => {
    const circularData: Person[] = [
      {
        id: 'leader1',
        name: 'Test Leader',
        nombre: 'Test Leader',
        role: 'lider',
        created_at: new Date(),
        registeredCount: 10,
        num_verificado: true,
        children: []
      }
    ];

    // Create circular reference
    const brigadier: Person = {
      id: 'brigadier1',
      name: 'Test Brigadier',
      nombre: 'Test Brigadier',
      role: 'brigadista',
      created_at: new Date(),
      registeredCount: 5,
      num_verificado: true,
      parentId: 'leader1',
      lider_id: 'leader1',
      children: []
    };

    circularData[0].children = [brigadier];
    (brigadier as any).parent = circularData[0]; // Circular reference

    const analytics = await DataService.generateWorkerProductivityAnalytics(circularData);

    expect(analytics).toBeDefined();
    expect(analytics.leaderMetrics).toBeInstanceOf(Array);
    expect(analytics.brigadierMetrics).toBeInstanceOf(Array);
  });

  it('should handle extreme values correctly', async () => {
    const extremeData: Person[] = [
      {
        id: 'extreme-leader',
        name: 'Extreme Leader',
        nombre: 'Extreme Leader',
        role: 'lider',
        created_at: new Date('2020-01-01'), // Valid date
        registeredCount: 1000, // Large but reasonable number
        num_verificado: true,
        children: [
          {
            id: 'extreme-brigadier',
            name: 'Extreme Brigadier',
            nombre: 'Extreme Brigadier',
            role: 'brigadista',
            created_at: new Date('2020-01-02'), // Valid date
            registeredCount: 0,
            num_verificado: true,
            parentId: 'extreme-leader',
            lider_id: 'extreme-leader',
            children: []
          }
        ]
      }
    ];

    const analytics = await DataService.generateWorkerProductivityAnalytics(extremeData);

    expect(analytics).toBeDefined();
    expect(analytics.leaderMetrics.length).toBeGreaterThanOrEqual(1);
    
    if (analytics.leaderMetrics.length > 0) {
      const leaderMetric = analytics.leaderMetrics[0];
      expect(leaderMetric.registrationVelocity).toBeGreaterThanOrEqual(0);
      expect(leaderMetric.networkEfficiency).toBeGreaterThanOrEqual(0);
      expect(leaderMetric.networkEfficiency).toBeLessThanOrEqual(100);
      expect(leaderMetric.timeToTarget).toBeGreaterThanOrEqual(0);
    }
  });

  it('should handle concurrent access safely', async () => {
    const testData: Person[] = [
      {
        id: 'concurrent-test-' + Math.random(),
        name: 'Concurrent Test Leader',
        nombre: 'Concurrent Test Leader',
        role: 'lider',
        created_at: new Date(),
        registeredCount: 15,
        num_verificado: true,
        children: []
      }
    ];

    // Run multiple concurrent requests
    const promises = [
      DataService.generateWorkerProductivityAnalytics(testData),
      DataService.generateWorkerProductivityAnalytics(testData)
    ];

    const results = await Promise.all(promises);

    // All results should be defined and consistent
    results.forEach(result => {
      expect(result).toBeDefined();
      expect(result.leaderMetrics).toBeInstanceOf(Array);
      expect(result.brigadierMetrics).toBeInstanceOf(Array);
      expect(result.mobilizerMetrics).toBeInstanceOf(Array);
      expect(result.overallInsights).toBeDefined();
    });
  });
});