import { useState, useEffect, useCallback, useRef } from 'react';
import { realTimeUpdateService, UpdateEvent, UpdateListener } from '../services/realTimeUpdateService';
import { DataService } from '../services/dataService';

export interface RealTimeStatus {
  isConnected: boolean;
  isRefreshing: boolean;
  lastUpdateTime: Date | null;
  reconnectAttempts: number;
  queuedUpdates: number;
  error: string | null;
}

export interface UseRealTimeUpdatesOptions {
  onDataUpdate?: () => void;
  onError?: (error: Error) => void;
  enableAutoRefresh?: boolean;
  refreshDelay?: number; // Delay before triggering refresh (in ms)
}

export const useRealTimeUpdates = (options: UseRealTimeUpdatesOptions = {}) => {
  const {
    onDataUpdate,
    onError,
    enableAutoRefresh = true,
    refreshDelay = 1000
  } = options;

  const [status, setStatus] = useState<RealTimeStatus>({
    isConnected: false,
    isRefreshing: false,
    lastUpdateTime: null,
    reconnectAttempts: 0,
    queuedUpdates: 0,
    error: null
  });

  const [recentUpdates, setRecentUpdates] = useState<UpdateEvent[]>([]);
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const listenerRef = useRef<UpdateListener | null>(null);

  // Update status from service - memoized to prevent unnecessary re-renders
  const updateStatus = useCallback(() => {
    const serviceStatus = realTimeUpdateService.getConnectionStatus();
    setStatus(prev => ({
      ...prev,
      isConnected: serviceStatus.isConnected,
      lastUpdateTime: serviceStatus.lastUpdateTime,
      reconnectAttempts: serviceStatus.reconnectAttempts,
      queuedUpdates: serviceStatus.queuedUpdates
    }));
  }, []);

  // Handle real-time updates - memoized with stable dependencies
  const handleUpdate = useCallback((event: UpdateEvent) => {
    console.log('Real-time update received:', event);
    
    // Update recent updates list (keep last 10)
    setRecentUpdates(prev => [event, ...prev.slice(0, 9)]);
    
    // Update status
    setStatus(prev => ({
      ...prev,
      lastUpdateTime: event.timestamp,
      error: null
    }));

    // Clear any existing refresh timeout
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
    }

    // Set refreshing state immediately
    setStatus(prev => ({ ...prev, isRefreshing: true }));

    if (enableAutoRefresh && onDataUpdate) {
      // Debounce refresh to avoid excessive updates
      refreshTimeoutRef.current = setTimeout(async () => {
        console.log('Triggering data refresh due to real-time update');
        
        try {
          // Invalidate caches first to ensure fresh data
          await DataService.invalidateAllCachesForRealTimeUpdate();
          
          // Then trigger data refresh
          onDataUpdate();
        } catch (error) {
          console.error('Error during real-time update refresh:', error);
        } finally {
          setStatus(prev => ({ ...prev, isRefreshing: false }));
        }
      }, refreshDelay);
    } else {
      // If auto-refresh is disabled, just clear the refreshing state
      setTimeout(() => {
        setStatus(prev => ({ ...prev, isRefreshing: false }));
      }, 500);
    }
  }, [enableAutoRefresh, onDataUpdate, refreshDelay]);

  // Handle errors - memoized with stable dependencies
  const handleError = useCallback((error: Error) => {
    console.error('Real-time update error:', error);
    
    setStatus(prev => ({
      ...prev,
      error: error.message,
      isRefreshing: false
    }));

    if (onError) {
      onError(error);
    }
  }, [onError]);

  // Setup real-time listener
  useEffect(() => {
    const listener: UpdateListener = {
      onUpdate: handleUpdate,
      onError: handleError
    };

    listenerRef.current = listener;
    realTimeUpdateService.addListener(listener);

    // Initial status update
    updateStatus();

    // Update status periodically
    const statusInterval = setInterval(updateStatus, 5000);

    return () => {
      if (listenerRef.current) {
        realTimeUpdateService.removeListener(listenerRef.current);
      }
      clearInterval(statusInterval);
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, [handleUpdate, handleError, updateStatus]);

  // Manual refresh trigger
  const triggerRefresh = useCallback(() => {
    if (onDataUpdate) {
      setStatus(prev => ({ ...prev, isRefreshing: true }));
      onDataUpdate();
      setTimeout(() => {
        setStatus(prev => ({ ...prev, isRefreshing: false }));
      }, 1000);
    }
  }, [onDataUpdate]);

  // Check connection manually
  const checkConnection = useCallback(async () => {
    const isConnected = await realTimeUpdateService.checkConnection();
    setStatus(prev => ({
      ...prev,
      isConnected,
      error: isConnected ? null : 'Connection check failed'
    }));
    return isConnected;
  }, []);

  // Detect updates manually (fallback)
  const detectUpdates = useCallback(async () => {
    try {
      const updates = await realTimeUpdateService.detectUpdates();
      if (updates.length > 0) {
        console.log(`Detected ${updates.length} manual updates`);
        updates.forEach(handleUpdate);
      }
      return updates;
    } catch (error) {
      console.error('Error detecting manual updates:', error);
      handleError(error as Error);
      return [];
    }
  }, [handleUpdate, handleError]);

  // Clear error
  const clearError = useCallback(() => {
    setStatus(prev => ({ ...prev, error: null }));
  }, []);

  // Clear recent updates
  const clearRecentUpdates = useCallback(() => {
    setRecentUpdates([]);
  }, []);

  return {
    status,
    recentUpdates,
    triggerRefresh,
    checkConnection,
    detectUpdates,
    clearError,
    clearRecentUpdates
  };
};