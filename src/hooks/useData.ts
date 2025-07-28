import { useState, useEffect } from 'react';
import { Person, Analytics, Period } from '../types';
import { DataService } from '../services/dataService';
import { DatabaseError, NetworkError, ValidationError, ServiceError } from '../types/errors';

export const useData = () => {
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

  const handleError = (err: unknown): string => {
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
  };

  const fetchData = async (isRetry: boolean = false, forceRefresh: boolean = false) => {
    const startTime = Date.now();
    
    try {
      setLoading(true);
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
      const hierarchicalData = await DataService.getAllHierarchicalData(forceRefresh);
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
      
      // Set performance metrics
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
      console.log(`Data fetch completed in ${totalTime}ms (Data: ${dataFetchTime}ms, Analytics: ${analyticsGenerationTime}ms, Records: ${totalRecords}, Cache Hit: ${cacheStatus.dataCache || cacheStatus.analyticsCache})`);
      
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
          fetchData(true, forceRefresh);
        }, 2000 * newRetryCount); // Exponential backoff
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const refetchData = () => {
    fetchData();
  };

  const getRegistrationsByPeriod = (period: Period) => {
    if (!analytics) return [];
    
    switch (period) {
      case 'day':
        return analytics.dailyRegistrations;
      case 'week':
        return analytics.weeklyRegistrations;
      case 'month':
        return analytics.monthlyRegistrations;
      default:
        return analytics.dailyRegistrations;
    }
  };

  const searchData = (query: string): Person[] => {
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
  };

  const filterByRole = (role: string): Person[] => {
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
  };

  const filterByDate = (startDate: Date, endDate: Date): Person[] => {
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
  };

  // Add method to force refresh with cache clearing
  const forceRefresh = () => {
    DataService.clearCache();
    fetchData(false, true);
  };

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
    getRegistrationsByPeriod,
    searchData,
    filterByRole,
    filterByDate,
  };
};