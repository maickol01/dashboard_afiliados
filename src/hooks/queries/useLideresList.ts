import { useQuery } from '@tanstack/react-query';
import { DataService } from '../../services/dataService';
import { supabase } from '../../lib/supabase';
import { Person } from '../../types';

export const useLideresList = () => {
  return useQuery({
    queryKey: ['lideres-list'],
    queryFn: async () => {
        // Obtenemos solo los líderes de primer nivel.
        const { data, error } = await supabase
            .from('lideres')
            .select('*');
        
        if (error) throw error;
        
        return (data || []).map((l: any) => DataService.convertToPersonFormat(l, 'lider'));
    },
    staleTime: 1000 * 60 * 10,
  });
};
