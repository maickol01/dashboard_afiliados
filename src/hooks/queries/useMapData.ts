import { useQuery } from '@tanstack/react-query';
import { DataService } from '../../services/dataService';
import { MapLocation } from '../../types';

export const useMapData = (startDate?: string, endDate?: string) => {
  return useQuery({
    queryKey: ['map-locations', startDate, endDate],
    queryFn: () => DataService.getMapLocations(startDate, endDate),
    staleTime: 1000 * 60 * 60, // 1 hora
    gcTime: 1000 * 60 * 60 * 24 * 7, // 1 semana
  });
};
