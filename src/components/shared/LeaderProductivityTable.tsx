import React, { useMemo } from 'react';
import { Person } from '../../types';
import { useGlobalFilter, DateFilterOption } from '../../context/GlobalFilterContext';

export interface LeaderProductivityData {
  id: string;
  name: string;
  brigadistas: number;
  movilizadores: number;
  ciudadanos: number;
  total: number;
  day: number;
  week: number;
  month: number;
}

interface LeaderProductivityTableProps {
  hierarchicalData: Person[];
  loading?: boolean;
}

const isSameDay = (d1: Date, d2: Date) => 
  d1.getDate() === d2.getDate() && 
  d1.getMonth() === d2.getMonth() && 
  d1.getFullYear() === d2.getFullYear();

const isSameWeek = (date: Date, now: Date) => {
  const d = new Date(date);
  const n = new Date(now);
  d.setHours(0, 0, 0, 0);
  n.setHours(0, 0, 0, 0);
  // Set to nearest Thursday: current date + 4 - current day number
  // Make Sunday's day number 7
  d.setDate(d.getDate() + 4 - (d.getDay() || 7));
  n.setDate(n.getDate() + 4 - (n.getDay() || 7));
  // Get first day of year
  const yearStartD = new Date(d.getFullYear(), 0, 1);
  const yearStartN = new Date(n.getFullYear(), 0, 1);
  // Calculate full weeks to nearest Thursday
  const weekNoD = Math.ceil((((d.getTime() - yearStartD.getTime()) / 86400000) + 1) / 7);
  const weekNoN = Math.ceil((((n.getTime() - yearStartN.getTime()) / 86400000) + 1) / 7);
  return weekNoD === weekNoN && d.getFullYear() === n.getFullYear();
};

const isSameMonth = (d1: Date, d2: Date) => 
  d1.getMonth() === d2.getMonth() && 
  d1.getFullYear() === d2.getFullYear();

const LeaderProductivityTable: React.FC<LeaderProductivityTableProps> = ({ 
  hierarchicalData, 
  loading = false 
}) => {
  const { selectedOption, customDate } = useGlobalFilter();

  // Transform hierarchical data to table format
  const leaderData = useMemo(() => {
    if (!hierarchicalData || hierarchicalData.length === 0) return [];

    const now = new Date();

    const checkFilter = (dateStr: Date | string) => {
      const date = new Date(dateStr);
      if (selectedOption === 'total') return true;
      if (selectedOption === 'day') return isSameDay(date, now);
      if (selectedOption === 'week') return isSameWeek(date, now);
      if (selectedOption === 'month') return isSameMonth(date, now);
      if (selectedOption === 'custom' && customDate) return isSameDay(date, customDate);
      return true;
    };

    const leaders = hierarchicalData.map((leader) => {
      let brigadistasReactive = 0;
      let movilizadoresReactive = 0;
      let ciudadanosReactive = 0;
      
      let dayCount = 0;
      let weekCount = 0;
      let monthCount = 0;

      // Iterate through downline
      const processNode = (node: Person) => {
        const date = new Date(node.created_at);
        
        // Fixed columns calculation
        if (isSameDay(date, now)) dayCount++;
        if (isSameWeek(date, now)) weekCount++;
        if (isSameMonth(date, now)) monthCount++;

        // Reactive columns calculation
        if (checkFilter(date)) {
            if (node.role === 'brigadista') brigadistasReactive++;
            if (node.role === 'movilizador') movilizadoresReactive++;
            if (node.role === 'ciudadano') ciudadanosReactive++;
        }

        if (node.children) {
            node.children.forEach(processNode);
        }
      };

      // Process leader's children (downline)
      if (leader.children) {
        leader.children.forEach(processNode);
      }

      const totalReactive = brigadistasReactive + movilizadoresReactive + ciudadanosReactive;

      return {
        id: leader.id,
        name: leader.name,
        brigadistas: brigadistasReactive,
        movilizadores: movilizadoresReactive,
        ciudadanos: ciudadanosReactive,
        total: totalReactive,
        day: dayCount,
        week: weekCount,
        month: monthCount
      };
    });

    // Sort by Total (descending)
    return leaders.sort((a, b) => b.total - a.total);
  }, [hierarchicalData, selectedOption, customDate]);

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

  return (
    <div className="bg-white rounded-lg shadow-md" data-testid="leader-productivity-table">
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
                Día
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Semana
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Mes
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-100">
                Brigadistas
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-100">
                Movilizadores
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-100">
                Ciudadanos
              </th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider bg-gray-100">
                Total
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
                  <div className="text-sm text-gray-900">{leader.day}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{leader.week}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{leader.month}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap bg-gray-50">
                  <div className="text-sm text-gray-900">{leader.brigadistas}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap bg-gray-50">
                  <div className="text-sm text-gray-900">{leader.movilizadores}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap bg-gray-50">
                  <div className="text-sm font-medium text-gray-900">{leader.ciudadanos}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap bg-gray-50">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
                    {leader.total}
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