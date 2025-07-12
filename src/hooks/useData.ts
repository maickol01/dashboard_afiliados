import { useState, useEffect } from 'react';
import { Person, Analytics, Period } from '../types';
import { mockData, mockAnalytics } from '../data/mockData';

export const useData = () => {
  const [data, setData] = useState<Person[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simular carga de datos
    setTimeout(() => {
      setData(mockData);
      setAnalytics(mockAnalytics);
      setLoading(false);
    }, 1000);
  }, []);

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
        const personDate = new Date(person.registrationDate);
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
    getRegistrationsByPeriod,
    searchData,
    filterByRole,
    filterByDate,
  };
};