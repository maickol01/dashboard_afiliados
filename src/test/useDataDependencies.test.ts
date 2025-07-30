import { renderHook, act } from '@testing-library/react';
import { useData } from '../hooks/useData';
import { DataService } from '../services/dataService';
import { vi } from 'vitest';

// Mock the DataService
vi.mock('../services/dataService');
vi.mock('../hooks/useRealTimeUpdates', () => ({
  useRealTimeUpdates: () => ({
    status: {
      isConnected: false,
      isRefreshing: false,
      lastUpdateTime: null,
      reconnectAttempts: 0,
      queuedUpdates: 0,
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

const mockDataService = DataService as any;

describe('useData Hook Dependencies', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock DataService methods
    mockDataService.getAllHierarchicalData = vi.fn().mockResolvedValue([]);
    mockDataService.generateAnalyticsFromData = vi.fn().mockResolvedValue({
      dailyRegistrations: [],
      weeklyRegistrations: [],
      monthlyRegistrations: []
    });
    mockDataService.getCacheStatus = vi.fn().mockReturnValue({
      dataCache: false,
      analyticsCache: false
    });
    mockDataService.healthCheck = vi.fn().mockResolvedValue({ status: 'healthy' });
    mockDataService.clearCache = vi.fn();
    mockDataService.generatePeriodAwareLeaderPerformance = vi.fn().mockReturnValue([]);
  });

  test('should have stable function references', async () => {
    const { result, rerender } = renderHook(() => useData());

    // Wait for initial load
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    const firstRender = {
      refetchData: result.current.refetchData,
      forceRefresh: result.current.forceRefresh,
      getRegistrationsByPeriod: result.current.getRegistrationsByPeriod,
      getLeaderPerformanceByPeriod: result.current.getLeaderPerformanceByPeriod,
      searchData: result.current.searchData,
      filterByRole: result.current.filterByRole,
      filterByDate: result.current.filterByDate
    };

    // Force a re-render
    rerender();

    const secondRender = {
      refetchData: result.current.refetchData,
      forceRefresh: result.current.forceRefresh,
      getRegistrationsByPeriod: result.current.getRegistrationsByPeriod,
      getLeaderPerformanceByPeriod: result.current.getLeaderPerformanceByPeriod,
      searchData: result.current.searchData,
      filterByRole: result.current.filterByRole,
      filterByDate: result.current.filterByDate
    };

    // All functions should maintain the same reference between renders
    expect(firstRender.refetchData).toBe(secondRender.refetchData);
    expect(firstRender.forceRefresh).toBe(secondRender.forceRefresh);
    expect(firstRender.getRegistrationsByPeriod).toBe(secondRender.getRegistrationsByPeriod);
    expect(firstRender.getLeaderPerformanceByPeriod).toBe(secondRender.getLeaderPerformanceByPeriod);
    expect(firstRender.searchData).toBe(secondRender.searchData);
    expect(firstRender.filterByRole).toBe(secondRender.filterByRole);
    expect(firstRender.filterByDate).toBe(secondRender.filterByDate);
  });

  test('should have stable memoized values', async () => {
    const { result, rerender } = renderHook(() => useData());

    // Wait for initial load
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    const firstRender = {
      totalRecordsCount: result.current.totalRecordsCount,
      dataSummary: result.current.dataSummary
    };

    // Force a re-render without data change
    rerender();

    const secondRender = {
      totalRecordsCount: result.current.totalRecordsCount,
      dataSummary: result.current.dataSummary
    };

    // Memoized values should maintain the same reference when data hasn't changed
    expect(firstRender.totalRecordsCount).toBe(secondRender.totalRecordsCount);
    expect(firstRender.dataSummary).toBe(secondRender.dataSummary);
  });

  test('should not cause infinite re-renders', async () => {
    let renderCount = 0;
    
    const { result } = renderHook(() => {
      renderCount++;
      return useData();
    });

    // Wait for initial load and any subsequent renders
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 500));
    });

    // Should not have excessive renders (allowing for initial render + data load)
    expect(renderCount).toBeLessThan(5);
    expect(result.current.error).toBeNull();
  });
});