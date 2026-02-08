import { useQuery } from '@tanstack/react-query';
import { DataService } from '../../services/dataService';
import { Person } from '../../types';

export const useSubordinates = (
  parentId: string | null, 
  parentRole: 'lider' | 'brigadista' | 'movilizador',
  startDate?: string,
  endDate?: string
) => {
  return useQuery({
    queryKey: ['subordinates', parentRole, parentId || 'global', startDate, endDate],
    queryFn: () => DataService.getSubordinates(parentId, parentRole, startDate, endDate),
    staleTime: 1000 * 60 * 10, // 10 minutos
  });
};
