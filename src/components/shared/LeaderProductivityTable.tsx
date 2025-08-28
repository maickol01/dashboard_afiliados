import React, { useMemo } from 'react';
import { Person } from '../../types';

export interface LeaderProductivityData {
  id: string;
  name: string;
  brigadistas: number;
  movilizadores: number;
  ciudadanos: number;
  ranking: number;
}

interface LeaderProductivityTableProps {
  hierarchicalData: Person[];
  loading?: boolean;
}

const LeaderProductivityTable: React.FC<LeaderProductivityTableProps> = ({ 
  hierarchicalData, 
  loading = false 
}) => {
  // Transform hierarchical data to table format
  const leaderData = useMemo(() => {
    if (!hierarchicalData || hierarchicalData.length === 0) return [];

    const leaders = hierarchicalData.map((leader) => {
      // Count brigadistas (direct children with role 'brigadista')
      const brigadistas = leader.children?.filter(child => child.role === 'brigadista').length || 0;
      
      // Count movilizadores (children of brigadistas)
      const movilizadores = leader.children?.reduce((count, brigadista) => {
        if (brigadista.role === 'brigadista' && brigadista.children) {
          return count + brigadista.children.filter(child => child.role === 'movilizador').length;
        }
        return count;
      }, 0) || 0;

      // Count ciudadanos (registeredCount from leader)
      const ciudadanos = leader.registeredCount || 0;

      return {
        id: leader.id,
        name: leader.name,
        brigadistas,
        movilizadores,
        ciudadanos,
        ranking: 0 // Will be calculated after sorting
      };
    });

    // Sort by ciudadanos (descending) and assign ranking
    const sortedLeaders = leaders
      .sort((a, b) => b.ciudadanos - a.ciudadanos)
      .map((leader, index) => ({
        ...leader,
        ranking: index + 1
      }));

    return sortedLeaders;
  }, [hierarchicalData]);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          </div>
        </div>
        <div className="p-6">
          <div className="animate-pulse space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (leaderData.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Detalle de Productividad por Líder</h3>
        </div>
        <div className="p-6">
          <p className="text-gray-500 text-center py-8">No hay datos de líderes disponibles</p>
        </div>
      </div>
    );
  }

  const getRankingColor = (ranking: number, total: number) => {
    const percentile = (total - ranking + 1) / total;
    if (percentile >= 0.8) return 'text-green-600 bg-green-50 border-green-200';
    if (percentile >= 0.6) return 'text-blue-600 bg-blue-50 border-blue-200';
    if (percentile >= 0.4) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  return (
    <div className="bg-white rounded-lg shadow-md">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Detalle de Productividad por Líder</h3>
        <p className="text-sm text-gray-600 mt-1">
          Análisis del rendimiento y estructura organizacional de cada líder
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Nombre
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Brigadistas
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Movilizadores
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ciudadanos
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ranking
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {leaderData.map((leader) => (
              <tr key={leader.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{leader.name}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{leader.brigadistas}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{leader.movilizadores}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{leader.ciudadanos}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getRankingColor(leader.ranking, leaderData.length)}`}>
                    #{leader.ranking}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LeaderProductivityTable;