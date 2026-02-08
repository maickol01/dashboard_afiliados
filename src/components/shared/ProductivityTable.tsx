import React, { useMemo } from 'react';
import { Person } from '../../types';
import { useGlobalFilter } from '../../context/GlobalFilterContext';
import { isSameDay, isSameWeek, isSameMonth, checkDateFilter } from '../../utils/dateUtils';

interface ProductivityTableProps {
  role: 'lider' | 'brigadista' | 'movilizador';
  data: Person[];
  loading?: boolean;
  onNameClick?: (person: Person) => void;
}

const ProductivityTable: React.FC<ProductivityTableProps> = ({ 
  role,
  data, 
  loading = false,
  onNameClick
}) => {
  const { selectedOption, customRange } = useGlobalFilter();

  const tableTitle = role === 'lider' ? 'Detalle de Productividad por Líder' :
                     role === 'brigadista' ? 'Detalle de Productividad por Brigadista' :
                     'Detalle de Productividad por Movilizador';

  const tableSubtitle = role === 'lider' ? 'Análisis del rendimiento y estructura de líderes' :
                        role === 'brigadista' ? 'Rendimiento de brigadistas y sus equipos' :
                        'Rendimiento de movilizadores y ciudadanos registrados';

  const processedData = useMemo(() => {
    if (!data || data.length === 0) return [];

    const now = new Date();

    return data.map((person) => {
      // 1. Usar métricas pre-calculadas si existen (OPTIMIZACIÓN RPC)
      if (person.metrics) {
        return {
          id: person.id,
          name: person.name,
          originalPerson: person,
          brigadistas: person.metrics.brigadistas,
          movilizadores: person.metrics.movilizadores,
          ciudadanos: person.metrics.ciudadanos,
          total: person.metrics.total,
          day: person.metrics.dia,
          week: person.metrics.semana,
          month: person.metrics.mes
        };
      }

      let brigadistasCount = 0;
      let movilizadoresCount = 0;
      let ciudadanosCount = 0;
      
      let dayCount = 0;
      let weekCount = 0;
      let monthCount = 0;

      // Función recursiva para procesar la descendencia (recursiva para contar todo el downline)
      const processNode = (node: Person) => {
        const date = new Date(node.created_at);
        
        // Columnas fijas (siempre hoy, esta semana, este mes)
        if (isSameDay(date, now)) dayCount++;
        if (isSameWeek(date, now)) weekCount++;
        if (isSameMonth(date, now)) monthCount++;

        // Columnas reactivas (basadas en el filtro global)
        if (checkDateFilter(date, selectedOption, customRange)) {
            if (node.role === 'brigadista') brigadistasCount++;
            if (node.role === 'movilizador') movilizadoresCount++;
            if (node.role === 'ciudadano') ciudadanosCount++;
        }

        if (node.children) {
            node.children.forEach(processNode);
        }
      };

      // Procesar descendencia si existe
      if (person.children) {
        person.children.forEach(processNode);
      }

      const totalReactive = brigadistasCount + movilizadoresCount + ciudadanosCount;

      return {
        id: person.id,
        name: person.name,
        originalPerson: person,
        brigadistas: brigadistasCount,
        movilizadores: movilizadoresCount,
        ciudadanos: ciudadanosCount,
        total: totalReactive,
        day: dayCount,
        week: weekCount,
        month: monthCount
      };
    }).sort((a, b) => b.total - a.total);
  }, [data, selectedOption, customRange]);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md">
        <div className="px-6 py-4 border-b border-gray-200 animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
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

  if (processedData.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">{tableTitle}</h3>
        </div>
        <div className="p-6">
          <p className="text-gray-500 text-center py-8">No hay datos disponibles</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md" data-testid="productivity-table">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">{tableTitle}</h3>
        <p className="text-sm text-gray-600 mt-1">{tableSubtitle}</p>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Nombre
              </th>
              {role === 'lider' && (
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-100">
                  Brigadistas
                </th>
              )}
              {(role === 'lider' || role === 'brigadista') && (
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-100">
                  Movilizadores
                </th>
              )}
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-100">
                Ciudadanos
              </th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider bg-gray-100">
                Total
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
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {processedData.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <button 
                    onClick={() => onNameClick?.(item.originalPerson)}
                    className="text-sm font-medium text-primary hover:text-primary-dark hover:underline text-left"
                  >
                    {item.name}
                  </button>
                </td>
                {role === 'lider' && (
                  <td className="px-6 py-4 whitespace-nowrap bg-gray-50">
                    <div className="text-sm text-gray-900">{item.brigadistas}</div>
                  </td>
                )}
                {(role === 'lider' || role === 'brigadista') && (
                  <td className="px-6 py-4 whitespace-nowrap bg-gray-50">
                    <div className="text-sm text-gray-900">{item.movilizadores}</div>
                  </td>
                )}
                <td className="px-6 py-4 whitespace-nowrap bg-gray-50">
                  <div className="text-sm text-gray-900">{item.ciudadanos}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap bg-gray-50">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
                    {item.total}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{item.day}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{item.week}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{item.month}</div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ProductivityTable;
