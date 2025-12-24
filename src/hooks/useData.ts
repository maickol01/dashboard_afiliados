import { useState, useEffect, useCallback, useMemo } from 'react';
import { Person, Analytics, Period, LeaderPerformanceData, PerformancePeriod } from '../types';
import { DataService } from '../services/dataService';
import { DatabaseError, NetworkError, ValidationError, ServiceError } from '../types/errors';
import { useRealTimeUpdates } from './useRealTimeUpdates';
import { DateRange } from '../components/shared/DateFilter';

export const useData = (dateRange: DateRange | null) => {
  const [data, setData] = useState<Person[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [lastFetchTime, setLastFetchTime] = useState<Date | null>(null);
  const [performanceMetrics, setPerformanceMetrics] = useState<{
    dataFetchTime: number;
    analyticsGenerationTime: number;
    totalRecords: number;
    cacheHit: boolean;
  } | null>(null);



  const handleError = useCallback((err: unknown): string => {
    console.error('Error al cargar datos:', err);

    if (err instanceof NetworkError) {
      return 'Error de conexión. Verifica tu conexión a internet e intenta nuevamente.';
    }

    if (err instanceof DatabaseError) {
      return 'Error en la base de datos. El problema puede ser temporal, intenta recargar la página.';
    }

    if (err instanceof ValidationError) {
      return 'Error de validación de datos. Contacta al administrador si el problema persiste.';
    }

    if (err instanceof ServiceError) {
      return 'Error del servicio. Intenta nuevamente en unos momentos.';
    }

    if (err instanceof Error) {
      return `Error: ${err.message}`;
    }

    return 'Error desconocido al cargar datos. Intenta recargar la página.';
  }, []);

  const fetchData = useCallback(async (isRetry: boolean = false, forceRefresh: boolean = false, isRealTimeUpdate: boolean = false) => {
    const startTime = Date.now();

    try {
      // For real-time updates, don't show full loading state
      if (!isRealTimeUpdate) {
        setLoading(true);
      }
      if (!isRetry) {
        setError(null);
        setRetryCount(0);
      }

      // Check cache status for performance metrics
      const cacheStatus = DataService.getCacheStatus();
      console.log('Cache status:', cacheStatus);

      // Check service health before fetching data
      const healthCheck = await DataService.healthCheck();
      if (healthCheck.status === 'unhealthy') {
        throw new ServiceError('Service is currently unavailable');
      }

      // Obtener datos jerárquicos de Supabase con optimizaciones
      const dataFetchStart = Date.now();
      const hierarchicalData = dateRange
        ? await DataService.getHierarchicalDataByDateRange(dateRange.startDate, dateRange.endDate)
        : await DataService.getAllHierarchicalData(forceRefresh);
      const dataFetchTime = Date.now() - dataFetchStart;

      // Set data immediately for better UX
      setData(hierarchicalData);

      // Generate analytics with loading state
      setAnalyticsLoading(true);
      const analyticsStart = Date.now();
      const analyticsData = await DataService.generateAnalyticsFromData(hierarchicalData, forceRefresh);
      const analyticsGenerationTime = Date.now() - analyticsStart;

      setAnalytics(analyticsData);
      setAnalyticsLoading(false);
      setLastFetchTime(new Date());
      setError(null);
      setRetryCount(0);

      // Set performance metrics - calculate total records
      const totalRecords = hierarchicalData.reduce((count, leader) => {
        let total = 1; // Count the leader
        if (leader.children) {
          leader.children.forEach(brigadista => {
            total += 1; // Count the brigadista
            if (brigadista.children) {
              brigadista.children.forEach(movilizador => {
                total += 1; // Count the movilizador
                if (movilizador.children) {
                  total += movilizador.children.length; // Count ciudadanos
                }
              });
            }
          });
        }
        return count + total;
      }, 0);

      setPerformanceMetrics({
        dataFetchTime,
        analyticsGenerationTime,
        totalRecords,
        cacheHit: cacheStatus.dataCache || cacheStatus.analyticsCache
      });

      const totalTime = Date.now() - startTime;
      const updateType = isRealTimeUpdate ? 'Real-time update' : 'Manual fetch';
      console.log(`${updateType} completed in ${totalTime}ms (Data: ${dataFetchTime}ms, Analytics: ${analyticsGenerationTime}ms, Records: ${totalRecords}, Cache Hit: ${cacheStatus.dataCache || cacheStatus.analyticsCache})`);

    } catch (err) {
      const errorMessage = handleError(err);
      setError(errorMessage);
      setAnalyticsLoading(false);

      // Auto-retry for retryable errors
      if ((err instanceof NetworkError || err instanceof DatabaseError) && retryCount < 3) {
        const newRetryCount = retryCount + 1;
        setRetryCount(newRetryCount);

        console.warn(`Auto-retrying data fetch (attempt ${newRetryCount}/3) in 2 seconds...`);

        setTimeout(() => {
          fetchData(true, forceRefresh, isRealTimeUpdate);
        }, 2000 * newRetryCount); // Exponential backoff
      }
    } finally {
      if (!isRealTimeUpdate) {
        setLoading(false);
      }
    }
  }, [handleError, retryCount, dateRange]);

  // Stable callback functions for real-time updates
  const handleRealTimeDataUpdate = useCallback(() => {
    console.log('Real-time update detected, refreshing data...');
    fetchData(false, false, true); // isRetry=false, forceRefresh=false, isRealTimeUpdate=true
  }, [fetchData]);

  const handleRealTimeError = useCallback((error: Error) => {
    console.warn('Real-time update error:', error.message);
    // Don't set main error state for real-time errors, just log them
  }, []);

  // Real-time updates integration
  const realTimeUpdates = useRealTimeUpdates({
    onDataUpdate: handleRealTimeDataUpdate,
    onError: handleRealTimeError,
    enableAutoRefresh: true,
    refreshDelay: 1000 // 1 second delay to debounce updates
  });

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refetchData = useCallback(() => {
    fetchData();
  }, [fetchData]);

  // Memoized registration data results to prevent unnecessary re-renders
  const memoizedRegistrationsByDay = useMemo(() => {
    return analytics?.dailyRegistrations || [];
  }, [analytics?.dailyRegistrations]);

  const memoizedRegistrationsByWeek = useMemo(() => {
    return analytics?.weeklyRegistrations || [];
  }, [analytics?.weeklyRegistrations]);

  const memoizedRegistrationsByMonth = useMemo(() => {
    return analytics?.monthlyRegistrations || [];
  }, [analytics?.monthlyRegistrations]);

  // Optimized getRegistrationsByPeriod with memoized results
  const getRegistrationsByPeriodMemoized = useCallback((period: Period) => {
    switch (period) {
      case 'day':
        return memoizedRegistrationsByDay;
      case 'week':
        return memoizedRegistrationsByWeek;
      case 'month':
        return memoizedRegistrationsByMonth;
      default:
        return memoizedRegistrationsByDay;
    }
  }, [memoizedRegistrationsByDay, memoizedRegistrationsByWeek, memoizedRegistrationsByMonth]);

  // Memoized leader performance data by period to prevent recalculation
  const memoizedLeaderPerformanceByAll = useMemo(() => {
    if (!data || data.length === 0) return [];
    return DataService.generatePeriodAwareLeaderPerformance(data, 'all');
  }, [data]);

  const memoizedLeaderPerformanceByDay = useMemo(() => {
    if (!data || data.length === 0) return [];
    return DataService.generatePeriodAwareLeaderPerformance(data, 'day');
  }, [data]);

  const memoizedLeaderPerformanceByWeek = useMemo(() => {
    if (!data || data.length === 0) return [];
    return DataService.generatePeriodAwareLeaderPerformance(data, 'week');
  }, [data]);

  const memoizedLeaderPerformanceByMonth = useMemo(() => {
    if (!data || data.length === 0) return [];
    return DataService.generatePeriodAwareLeaderPerformance(data, 'month');
  }, [data]);

  // Stabilized getLeaderPerformanceByPeriod function with useCallback and memoized results
  const getLeaderPerformanceByPeriodStable = useCallback((period: PerformancePeriod) => {
    switch (period) {
      case 'all':
        return memoizedLeaderPerformanceByAll;
      case 'day':
        return memoizedLeaderPerformanceByDay;
      case 'week':
        return memoizedLeaderPerformanceByWeek;
      case 'month':
        return memoizedLeaderPerformanceByMonth;
      default:
        return memoizedLeaderPerformanceByAll;
    }
  }, [memoizedLeaderPerformanceByAll, memoizedLeaderPerformanceByDay, memoizedLeaderPerformanceByWeek, memoizedLeaderPerformanceByMonth]);

  const searchData = useCallback((query: string): Person[] => {
    if (!query.trim()) return data;

    const searchInHierarchy = (people: Person[]): Person[] => {
      const results: Person[] = [];

      people.forEach(person => {
        const matchesSearch =
          person.name.toLowerCase().includes(query.toLowerCase()) ||
          person.nombre.toLowerCase().includes(query.toLowerCase()) ||
          person.id.toLowerCase().includes(query.toLowerCase()) ||
          (person.direccion && person.direccion.toLowerCase().includes(query.toLowerCase())) ||
          (person.colonia && person.colonia.toLowerCase().includes(query.toLowerCase())) ||
          (person.seccion && person.seccion.toLowerCase().includes(query.toLowerCase())) ||
          (person.numero_cel && person.numero_cel.toLowerCase().includes(query.toLowerCase()));

        if (matchesSearch) {
          results.push(person);
        }

        if (person.children) {
          results.push(...searchInHierarchy(person.children));
        }
      });

      return results;
    };

    return searchInHierarchy(data);
  }, [data]);

  const filterByRole = useCallback((role: string): Person[] => {
    if (role === 'all') return data;

    const filterInHierarchy = (people: Person[]): Person[] => {
      const results: Person[] = [];

      people.forEach(person => {
        if (person.role === role) {
          results.push(person);
        }

        if (person.children) {
          results.push(...filterInHierarchy(person.children));
        }
      });

      return results;
    };

    return filterInHierarchy(data);
  }, [data]);

  const filterByDate = useCallback((startDate: Date, endDate: Date): Person[] => {
    const filterInHierarchy = (people: Person[]): Person[] => {
      const results: Person[] = [];

      people.forEach(person => {
        const personDate = new Date(person.created_at);
        if (personDate >= startDate && personDate <= endDate) {
          results.push(person);
        }

        if (person.children) {
          results.push(...filterInHierarchy(person.children));
        }
      });

      return results;
    };

    return filterInHierarchy(data);
  }, [data]);

  // Data validation functions for chart components
  const validateRegistrationData = useCallback((data: { date: string; count: number }[]): { date: string; count: number }[] => {
    if (!Array.isArray(data)) {
      console.warn('Invalid registration data: expected array, got:', typeof data);
      return [];
    }

    return data.filter(item => {
      if (!item || typeof item !== 'object') {
        console.warn('Invalid registration item: expected object, got:', typeof item);
        return false;
      }

      if (typeof item.date !== 'string' || !item.date.trim()) {
        console.warn('Invalid registration date: expected non-empty string, got:', typeof item.date);
        return false;
      }

      if (typeof item.count !== 'number' || isNaN(item.count) || item.count < 0) {
        console.warn('Invalid registration count: expected non-negative number, got:', item.count);
        return false;
      }

      return true;
    });
  }, []);

  const validateLeaderPerformanceData = useCallback((data: unknown[]): LeaderPerformanceData[] => {
    if (!Array.isArray(data)) {
      console.warn('Invalid leader performance data: expected array, got:', typeof data);
      return [];
    }

    return data.filter(item => {
      if (!item || typeof item !== 'object') {
        console.warn('Invalid leader performance item: expected object, got:', typeof item);
        return false;
      }

      const typedItem = item as any;

      if (typeof typedItem.name !== 'string' || !typedItem.name.trim()) {
        console.warn('Invalid leader name: expected non-empty string, got:', typeof typedItem.name);
        return false;
      }

      if (typeof typedItem.citizenCount !== 'number' || isNaN(typedItem.citizenCount) || typedItem.citizenCount < 0) {
        console.warn('Invalid citizen count: expected non-negative number, got:', typedItem.citizenCount);
        return false;
      }

      return true;
    }) as LeaderPerformanceData[];
  }, []);

  // Validated and memoized chart data transformations
  const getValidatedRegistrationsByPeriod = useCallback((period: Period) => {
    const rawData = getRegistrationsByPeriodMemoized(period);
    return validateRegistrationData(rawData);
  }, [getRegistrationsByPeriodMemoized, validateRegistrationData]);

  const getValidatedLeaderPerformanceByPeriod = useCallback((period: PerformancePeriod) => {
    const rawData = getLeaderPerformanceByPeriodStable(period);
    return validateLeaderPerformanceData(rawData);
  }, [getLeaderPerformanceByPeriodStable, validateLeaderPerformanceData]);

  // Add method to force refresh with cache clearing
  const forceRefresh = useCallback(() => {
    DataService.clearCache();
    fetchData(false, true);
  }, [fetchData]);



  // Memoized expensive computations
  const totalRecordsCount = useMemo(() => {
    return data.reduce((count, leader) => {
      let total = 1; // Count the leader
      if (leader.children) {
        leader.children.forEach(brigadista => {
          total += 1; // Count the brigadista
          if (brigadista.children) {
            brigadista.children.forEach(movilizador => {
              total += 1; // Count the movilizador
              if (movilizador.children) {
                total += movilizador.children.length; // Count ciudadanos
              }
            });
          }
        });
      }
      return count + total;
    }, 0);
  }, [data]);

  // Memoized data summary for performance
  const dataSummary = useMemo(() => {
    const leaders = data.length;
    let brigadistas = 0;
    let movilizadores = 0;
    let ciudadanos = 0;

    data.forEach(leader => {
      if (leader.children) {
        brigadistas += leader.children.length;
        leader.children.forEach(brigadista => {
          if (brigadista.children) {
            movilizadores += brigadista.children.length;
            brigadista.children.forEach(movilizador => {
              if (movilizador.children) {
                ciudadanos += movilizador.children.length;
              }
            });
          }
        });
      }
    });

    return { leaders, brigadistas, movilizadores, ciudadanos, total: totalRecordsCount };
  }, [data, totalRecordsCount]);

  return {
    data,
    analytics,
    loading,
    analyticsLoading,
    error,
    retryCount,
    lastFetchTime,
    performanceMetrics,
    refetchData,
    forceRefresh,
    // Stabilized and validated chart data functions
    getRegistrationsByPeriod: getValidatedRegistrationsByPeriod,
    getLeaderPerformanceByPeriod: getValidatedLeaderPerformanceByPeriod,
    // Legacy functions for backward compatibility
    getRegistrationsByPeriodRaw: getRegistrationsByPeriodMemoized,
    getLeaderPerformanceByPeriodRaw: getLeaderPerformanceByPeriodStable,
    searchData,
    filterByRole,
    filterByDate,
    // Memoized computations
    totalRecordsCount,
    dataSummary,
    // Data validation utilities
    validateRegistrationData,
    validateLeaderPerformanceData,
    // Real-time update status and controls
    realTimeStatus: realTimeUpdates.status,
    recentUpdates: realTimeUpdates.recentUpdates,
    triggerRealTimeRefresh: realTimeUpdates.triggerRefresh,
    checkRealTimeConnection: realTimeUpdates.checkConnection,
    detectManualUpdates: realTimeUpdates.detectUpdates,
    clearRealTimeError: realTimeUpdates.clearError,
    clearRecentUpdates: realTimeUpdates.clearRecentUpdates,
  };
};