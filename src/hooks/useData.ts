import { useState, useEffect } from 'react';
import { Person, Analytics, Period } from '../types';
import { DataService } from '../services/dataService';

export const useData = () => {
  const [data, setData] = useState<Person[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Obtener datos jerárquicos de Supabase
      const hierarchicalData = await DataService.getAllHierarchicalData();
      
      // Generar analytics basados en los datos reales
      const analyticsData = await DataService.generateAnalyticsFromData(hierarchicalData);
      
      setData(hierarchicalData);
      setAnalytics(analyticsData);
    } catch (err) {
      console.error('Error al cargar datos:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

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
        if (person.name.toLowerCase().includes(query.toLowerCase()) ||
            person.id.toLowerCase().includes(query.toLowerCase())) {
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

  return {
    data,
    analytics,
    loading,
    error,
    refetchData,
    getRegistrationsByPeriod,
    searchData,
    filterByRole,
    filterByDate,
  };
};