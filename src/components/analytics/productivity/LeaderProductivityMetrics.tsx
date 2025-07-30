import React from 'react';
import { Users, TrendingUp, TrendingDown, Minus, Clock, Target, AlertTriangle } from 'lucide-react';
import { LeaderProductivityMetric } from '../../../types/productivity';

interface LeaderProductivityMetricsProps {
  metrics: LeaderProductivityMetric[];
  loading?: boolean;
}

const LeaderProductivityMetrics: React.FC<LeaderProductivityMetricsProps> = ({ 
  metrics, 
  loading = false 
}) => {
  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (metrics.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Productividad de Líderes</h3>
        <p className="text-gray-500 text-center py-8">No hay datos de líderes disponibles</p>
      </div>
    );
  }

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <Minus className="h-4 w-4 text-gray-500" />;
    }
  };

  const getPerformanceColor = (rank: number, total: number) => {
    const percentile = (total - rank + 1) / total;
    if (percentile >= 0.8) return 'text-green-600 bg-green-50 border-green-200';
    if (percentile >= 0.6) return 'text-blue-600 bg-blue-50 border-blue-200';
    if (percentile >= 0.4) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const formatTimeToTarget = (days: number) => {
    if (days === 999) return 'N/A';
    if (days <= 0) return 'Meta alcanzada';
    if (days === 1) return '1 día';
    if (days <= 30) return `${days} días`;
    if (days <= 365) return `${Math.round(days / 30)} meses`;
    return `${Math.round(days / 365)} años`;
  };

  // Calculate summary statistics
  const totalCitizens = metrics.reduce((sum, m) => sum + m.citizenCount, 0);
  const avgNetworkSize = metrics.reduce((sum, m) => sum + m.totalNetwork, 0) / metrics.length;
  const avgEfficiency = metrics.reduce((sum, m) => sum + m.networkEfficiency, 0) / metrics.length;
  const leadersNeedingSupport = metrics.filter(m => m.recommendations.length > 0).length;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-md border-l-4 border-primary">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Ciudadanos</p>
              <p className="text-2xl font-bold text-primary">{totalCitizens.toLocaleString()}</p>
            </div>
            <Users className="h-8 w-8 text-primary" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-md border-l-4 border-secondary">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Red Promedio</p>
              <p className="text-2xl font-bold text-secondary">{avgNetworkSize.toFixed(0)}</p>
            </div>
            <Target className="h-8 w-8 text-secondary" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-md border-l-4 border-accent">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Eficiencia Promedio</p>
              <p className="text-2xl font-bold text-accent">{avgEfficiency.toFixed(1)}%</p>
            </div>
            <TrendingUp className="h-8 w-8 text-accent" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-md border-l-4 border-red-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Necesitan Apoyo</p>
              <p className="text-2xl font-bold text-red-500">{leadersNeedingSupport}</p>
            </div>
            <AlertTriangle className="h-8 w-8 text-red-500" />
          </div>
        </div>
      </div>

      {/* Detailed Leader Metrics */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Detalle de Productividad por Líder</h3>
          <p className="text-sm text-gray-600 mt-1">
            Análisis detallado del rendimiento y eficiencia de cada líder
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Líder
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Red Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ciudadanos
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Velocidad
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Eficiencia
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tiempo a Meta
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tendencia
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ranking
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {metrics.map((leader) => (
                <tr key={leader.leaderId} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col">
                      <div className="text-sm font-medium text-gray-900">{leader.name}</div>
                      <div className="text-xs text-gray-500">
                        {leader.brigadierCount} brigadistas, {leader.mobilizerCount} movilizadores
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{leader.totalNetwork}</div>
                    <div className="text-xs text-gray-500">personas</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{leader.citizenCount}</div>
                    <div className="text-xs text-gray-500">registrados</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{leader.registrationVelocity.toFixed(2)}</div>
                    <div className="text-xs text-gray-500">por día</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{leader.networkEfficiency.toFixed(1)}%</div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                      <div
                        className="bg-primary h-2 rounded-full"
                        style={{ width: `${Math.min(100, leader.networkEfficiency)}%` }}
                      ></div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 text-gray-400 mr-1" />
                      <span className="text-sm text-gray-900">
                        {formatTimeToTarget(leader.timeToTarget)}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {getTrendIcon(leader.trendDirection)}
                      <span className="ml-1 text-sm text-gray-600 capitalize">
                        {leader.trendDirection === 'up' ? 'Subiendo' : 
                         leader.trendDirection === 'down' ? 'Bajando' : 'Estable'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getPerformanceColor(leader.performanceRank, metrics.length)}`}>
                      #{leader.performanceRank}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recommendations Panel */}
      {leadersNeedingSupport > 0 && (
        <div className="bg-white rounded-lg shadow-md">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <AlertTriangle className="h-5 w-5 text-yellow-500 mr-2" />
              Recomendaciones de Mejora
            </h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {metrics
                .filter(leader => leader.recommendations.length > 0)
                .slice(0, 5) // Show top 5 leaders needing support
                .map((leader) => (
                  <div key={leader.leaderId} className="border-l-4 border-yellow-400 bg-yellow-50 p-4">
                    <div className="flex">
                      <div className="ml-3">
                        <h4 className="text-sm font-medium text-yellow-800">{leader.name}</h4>
                        <div className="mt-2 text-sm text-yellow-700">
                          <ul className="list-disc list-inside space-y-1">
                            {leader.recommendations.map((rec, index) => (
                              <li key={index}>{rec}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeaderProductivityMetrics;