import { useQuery } from '@tanstack/react-query';
import { DataService } from '../../services/dataService';
import { Analytics } from '../../types';

export const useDashboardSummary = <T = Analytics>(
  startDate?: string, 
  endDate?: string,
  select?: (data: Analytics) => T
) => {
  return useQuery({
    queryKey: ['dashboard-summary', startDate, endDate],
    queryFn: () => DataService.getDashboardSummary(startDate, endDate),
    select: select,
    staleTime: 1000 * 60 * 5, // 5 minutos
    gcTime: 1000 * 60 * 60 * 24, // 24 horas
  });
};
