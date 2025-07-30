import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useRealTimeUpdates } from '../hooks/useRealTimeUpdates';
import { realTimeUpdateService } from '../services/realTimeUpdateService';

// Mock the real-time update service
vi.mock('../services/realTimeUpdateService', () => ({
  realTimeUpdateService: {
    addListener: vi.fn(),
    removeListener: vi.fn(),
    getConnectionStatus: vi.fn(() => ({
      isConnected: true,
      lastUpdateTime: new Date(),
      reconnectAttempts: 0,
      queuedUpdates: 0
    })),
    checkConnection: vi.fn(() => Promise.resolve(true)),
    detectUpdates: vi.fn(() => Promise.resolve([]))
  }
}));

describe('useRealTimeUpdates', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  it('should initialize with default status', () => {
    const { result } = renderHook(() => useRealTimeUpdates());

    expect(result.current.status.isConnected).toBe(true);
    expect(result.current.status.isRefreshing).toBe(false);
    expect(result.current.status.error).toBe(null);
    expect(result.current.recentUpdates).toEqual([]);
  });

  it('should add listener on mount and remove on unmount', () => {
    const { unmount } = renderHook(() => useRealTimeUpdates());

    expect(realTimeUpdateService.addListener).toHaveBeenCalledTimes(1);

    unmount();

    expect(realTimeUpdateService.removeListener).toHaveBeenCalledTimes(1);
  });

  it('should call onDataUpdate when update is received and auto-refresh is enabled', async () => {
    const mockOnDataUpdate = vi.fn();
    
    const { result } = renderHook(() => 
      useRealTimeUpdates({
        onDataUpdate: mockOnDataUpdate,
        enableAutoRefresh: true,
        refreshDelay: 100
      })
    );

    // Simulate receiving an update
    const mockUpdate = {
      table: 'ciudadanos',
      eventType: 'INSERT' as const,
      new: { id: '1', nombre: 'Test' },
      timestamp: new Date()
    };

    // Get the listener that was added
    const addListenerCall = vi.mocked(realTimeUpdateService.addListener).mock.calls[0];
    const listener = addListenerCall[0];

    act(() => {
      listener.onUpdate(mockUpdate);
    });

    expect(result.current.status.isRefreshing).toBe(true);
    expect(result.current.recentUpdates).toHaveLength(1);
    expect(result.current.recentUpdates[0]).toEqual(mockUpdate);

    // Wait for debounced refresh
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 150));
    });

    expect(mockOnDataUpdate).toHaveBeenCalledTimes(1);
  });

  it('should not call onDataUpdate when auto-refresh is disabled', async () => {
    const mockOnDataUpdate = vi.fn();
    
    renderHook(() => 
      useRealTimeUpdates({
        onDataUpdate: mockOnDataUpdate,
        enableAutoRefresh: false
      })
    );

    // Simulate receiving an update
    const mockUpdate = {
      table: 'ciudadanos',
      eventType: 'INSERT' as const,
      new: { id: '1', nombre: 'Test' },
      timestamp: new Date()
    };

    // Get the listener that was added
    const addListenerCall = vi.mocked(realTimeUpdateService.addListener).mock.calls[0];
    const listener = addListenerCall[0];

    act(() => {
      listener.onUpdate(mockUpdate);
    });

    // Wait a bit to ensure no refresh is triggered
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    expect(mockOnDataUpdate).not.toHaveBeenCalled();
  });

  it('should handle errors properly', () => {
    const mockOnError = vi.fn();
    
    const { result } = renderHook(() => 
      useRealTimeUpdates({
        onError: mockOnError
      })
    );

    // Simulate an error
    const mockError = new Error('Connection failed');

    // Get the listener that was added
    const addListenerCall = vi.mocked(realTimeUpdateService.addListener).mock.calls[0];
    const listener = addListenerCall[0];

    act(() => {
      if (listener.onError) {
        listener.onError(mockError);
      }
    });

    expect(result.current.status.error).toBe('Connection failed');
    expect(mockOnError).toHaveBeenCalledWith(mockError);
  });

  it('should trigger manual refresh', () => {
    const mockOnDataUpdate = vi.fn();
    
    const { result } = renderHook(() => 
      useRealTimeUpdates({
        onDataUpdate: mockOnDataUpdate
      })
    );

    act(() => {
      result.current.triggerRefresh();
    });

    expect(result.current.status.isRefreshing).toBe(true);
    expect(mockOnDataUpdate).toHaveBeenCalledTimes(1);
  });

  it('should check connection status', async () => {
    vi.mocked(realTimeUpdateService.checkConnection).mockResolvedValue(true);
    
    const { result } = renderHook(() => useRealTimeUpdates());

    let connectionResult: boolean | undefined;
    
    await act(async () => {
      connectionResult = await result.current.checkConnection();
    });

    expect(connectionResult).toBe(true);
    expect(realTimeUpdateService.checkConnection).toHaveBeenCalledTimes(1);
  });

  it('should detect manual updates', async () => {
    const mockUpdates = [
      {
        table: 'ciudadanos',
        eventType: 'INSERT' as const,
        new: { id: '1', nombre: 'Test' },
        timestamp: new Date()
      }
    ];
    
    vi.mocked(realTimeUpdateService.detectUpdates).mockResolvedValue(mockUpdates);
    
    const { result } = renderHook(() => useRealTimeUpdates());

    let detectedUpdates: any[] | undefined;
    
    await act(async () => {
      detectedUpdates = await result.current.detectUpdates();
    });

    expect(detectedUpdates).toEqual(mockUpdates);
    expect(realTimeUpdateService.detectUpdates).toHaveBeenCalledTimes(1);
  });

  it('should clear error', () => {
    const { result } = renderHook(() => useRealTimeUpdates());

    // Set an error first
    act(() => {
      const addListenerCall = vi.mocked(realTimeUpdateService.addListener).mock.calls[0];
      const listener = addListenerCall[0];
      if (listener.onError) {
        listener.onError(new Error('Test error'));
      }
    });

    expect(result.current.status.error).toBe('Test error');

    // Clear the error
    act(() => {
      result.current.clearError();
    });

    expect(result.current.status.error).toBe(null);
  });

  it('should clear recent updates', () => {
    const { result } = renderHook(() => useRealTimeUpdates());

    // Add an update first
    const mockUpdate = {
      table: 'ciudadanos',
      eventType: 'INSERT' as const,
      new: { id: '1', nombre: 'Test' },
      timestamp: new Date()
    };

    act(() => {
      const addListenerCall = vi.mocked(realTimeUpdateService.addListener).mock.calls[0];
      const listener = addListenerCall[0];
      listener.onUpdate(mockUpdate);
    });

    expect(result.current.recentUpdates).toHaveLength(1);

    // Clear recent updates
    act(() => {
      result.current.clearRecentUpdates();
    });

    expect(result.current.recentUpdates).toHaveLength(0);
  });
});