import { useQuery } from '@tanstack/react-query';
import { DataService } from '../../services/dataService';

export const usePersonSearch = (query: string) => {
  return useQuery({
    queryKey: ['person-search', query],
    queryFn: () => DataService.searchPeopleServerSide(query),
    enabled: query.length >= 3,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
};
