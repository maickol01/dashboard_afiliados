import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useData } from '../hooks/useData';
import { DataService } from '../services/dataService';

// Mock DataService
vi.mock('../services/dataService');
vi.mock('../hooks/useRealTimeUpdates', () => ({
  useRealTimeUpdates: () => ({
    status: {
      isConnected: true,
      isRefreshing: false,
      lastUpdate: new Date(),
      error: null
    },
    recentUpdates: [],
    triggerRefresh: vi.fn(),
    checkConnection: vi.fn(),
    detectUpdates: vi.fn(),
    clearError: vi.fn(),
    clearRecentUpdates: vi.fn()
  })
}));

const mockDataService = vi.mocked(DataService);

describe('Chart Data Stabilization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock the DataService methods
    mockDataService.getAllHierarchicalData.mockResolvedValue([]);
    mockDataService.generateAnalyticsFromData.mockResolvedValue({
      totalLideres: 0,
      totalBrigadistas: 0,
      totalMobilizers: 0,
      totalCitizens: 0,
      dailyRegistrations: [
        { date: '2024-01-01', count: 5 },
        { date: '2024-01-02', count: 3 }
      ],
      weeklyRegistrations: [
        { date: 'Semana 1', count: 15 },
        { date: 'Semana 2', count: 12 }
      ],
      monthlyRegistrations: [
        { date: 'enero', count: 50 },
        { date: 'febrero', count: 45 }
      ],
      leaderPerformance: [],
      enhancedLeaderPerformance: [],
      conversionRate: 0,
      growthRate: 0,
      efficiency: {
        conversionByLeader: [],
        productivityByBrigadier: [],
        topPerformers: [],
        needsSupport: [],
        registrationSpeed: { average: 0, fastest: 0, slowest: 0 }
      },
      geographic: {
        regionDistribution: [],
        municipioDistribution: [],
        seccionDistribution: [],
        heatmapData: [],
        territorialCoverage: []
      },
      temporal: {
        hourlyPatterns: [],
        weeklyPatterns: [],
        seasonality: [],
        projections: [],
        peakActivity: []
      },
      quality: {
        dataCompleteness: 0,
        duplicateRate: 0,
        verificationRate: 0,
        postRegistrationActivity: []
      },
      goals: {
        overallProgress: { current: 0, target: 5000, percentage: 0 },
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
      }
    });
    
    mockDataService.generatePeriodAwareLeaderPerformance.mockReturnValue([
      {
        name: 'Test Leader',
        citizenCount: 10,
        brigadierCount: 2,
        mobilizerCount: 5,
        targetProgress: 75,
        trend: 'stable' as const,
        efficiency: 2.5,
        lastUpdate: new Date()
      }
    ]);
  });

  it('should memoize registration data by period', async () => {
    const { result, rerender } = renderHook(() => useData());
    
    // Wait for initial data load
    await vi.waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Get registration data for day period
    const firstCall = result.current.getRegistrationsByPeriod('day');
    
    // Re-render without changing data
    rerender();
    
    // Get registration data again
    const secondCall = result.current.getRegistrationsByPeriod('day');
    
    // Should return the same content (validated data)
    expect(firstCall).toStrictEqual(secondCall);
    
    // Test that raw memoized data returns same reference
    const firstRawCall = result.current.getRegistrationsByPeriodRaw('day');
    rerender();
    const secondRawCall = result.current.getRegistrationsByPeriodRaw('day');
    expect(firstRawCall).toBe(secondRawCall);
  });

  it('should validate registration data before returning', async () => {
    const { result } = renderHook(() => useData());
    
    await vi.waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const registrationData = result.current.getRegistrationsByPeriod('day');
    
    // Should return valid data structure
    expect(Array.isArray(registrationData)).toBe(true);
    registrationData.forEach(item => {
      expect(typeof item.date).toBe('string');
      expect(typeof item.count).toBe('number');
      expect(item.count).toBeGreaterThanOrEqual(0);
    });
  });

  it('should memoize leader performance data by period', async () => {
    const { result, rerender } = renderHook(() => useData());
    
    await vi.waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Get leader performance data for day period
    const firstCall = result.current.getLeaderPerformanceByPeriod('day');
    
    // Re-render without changing data
    rerender();
    
    // Get leader performance data again
    const secondCall = result.current.getLeaderPerformanceByPeriod('day');
    
    // Should return the same content (validated data)
    expect(firstCall).toStrictEqual(secondCall);
    
    // Test that raw memoized data returns same reference
    const firstRawCall = result.current.getLeaderPerformanceByPeriodRaw('day');
    rerender();
    const secondRawCall = result.current.getLeaderPerformanceByPeriodRaw('day');
    expect(firstRawCall).toBe(secondRawCall);
  });

  it('should validate leader performance data before returning', async () => {
    const { result } = renderHook(() => useData());
    
    await vi.waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const leaderData = result.current.getLeaderPerformanceByPeriod('day');
    
    // Should return valid data structure
    expect(Array.isArray(leaderData)).toBe(true);
    leaderData.forEach(item => {
      expect(typeof item.name).toBe('string');
      expect(typeof item.citizenCount).toBe('number');
      expect(item.citizenCount).toBeGreaterThanOrEqual(0);
    });
  });

  it('should handle invalid data gracefully', () => {
    const { result } = renderHook(() => useData());
    
    // Test validation functions directly
    const invalidRegistrationData = [
      { date: '', count: 5 }, // Invalid empty date
      { date: 'valid-date', count: -1 }, // Invalid negative count
      { date: 'valid-date', count: 'invalid' }, // Invalid count type
      null, // Invalid item
      { date: 'valid-date', count: 10 } // Valid item
    ];
    
    const validatedData = result.current.validateRegistrationData(invalidRegistrationData as any);
    
    // Should only return the valid item
    expect(validatedData).toHaveLength(1);
    expect(validatedData[0]).toEqual({ date: 'valid-date', count: 10 });
  });

  it('should return different references for different periods', async () => {
    const { result } = renderHook(() => useData());
    
    await vi.waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const dayData = result.current.getRegistrationsByPeriod('day');
    const weekData = result.current.getRegistrationsByPeriod('week');
    const monthData = result.current.getRegistrationsByPeriod('month');
    
    // Should return different references for different periods
    expect(dayData).not.toBe(weekData);
    expect(weekData).not.toBe(monthData);
    expect(dayData).not.toBe(monthData);
  });
});