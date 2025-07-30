import React, { useState } from 'react';
import { Users, TrendingUp, AlertTriangle, Filter, Search, Award, Target } from 'lucide-react';
import { BrigadierProductivityMetric } from '../../../types/productivity';

interface BrigadierProductivityMetricsProps {
  metrics: BrigadierProductivityMetric[];
  loading?: boolean;
}

const BrigadierProductivityMetrics: React.FC<BrigadierProductivityMetricsProps> = ({ 
  metrics, 
  loading = false 
}) => {
  const [filterLevel, setFilterLevel] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'citizens' | 'efficiency' | 'name'>('citizens');

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
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Productividad de Brigadistas</h3>
        <p className="text-gray-500 text-center py-8">No hay datos de brigadistas disponibles</p>
      </div>
    );
  }

  // Filter and sort metrics
  const filteredMetrics = metrics
    .filter(brigadier => {
      const matchesFilter = filterLevel === 'all' || brigadier.performanceLevel === filterLevel;
      const matchesSearch = brigadier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           brigadier.leaderName.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesFilter && matchesSearch;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'citizens':
          return b.citizenCount - a.citizenCount;
        case 'efficiency':
          return b.efficiencyScore - a.efficiencyScore;
        case 'name':
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });

  const getPerformanceBadge = (level: 'high' | 'medium' | 'low') => {
    const styles = {
      high: 'bg-green-100 text-green-800 border-green-200',
      medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      low: 'bg-red-100 text-red-800 border-red-200'
    };
    
    const labels = {
      high: 'Alto',
      medium: 'Medio',
      low: 'Bajo'
    };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[level]}`}>
        {labels[level]}
      </span>
    );
  };

  // Calculate summary statistics
  const totalCitizens = metrics.reduce((sum, m) => sum + m.citizenCount, 0);
  const avgEfficiency = metrics.reduce((sum, m) => sum + m.efficiencyScore, 0) / metrics.length;
  const highPerformers = metrics.filter(m => m.performanceLevel === 'high').length;
  const needingSupport = metrics.filter(m => m.needsSupport).length;

  const performanceDistribution = {
    high: metrics.filter(m => m.performanceLevel === 'high').length,
    medium: metrics.filter(m => m.performanceLevel === 'medium').length,
    low: metrics.filter(m => m.performanceLevel === 'low').length
  };

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
              <p className="text-sm font-medium text-gray-600">Eficiencia Promedio</p>
              <p className="text-2xl font-bold text-secondary">{avgEfficiency.toFixed(1)}</p>
            </div>
            <TrendingUp className="h-8 w-8 text-secondary" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-md border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Alto Rendimiento</p>
              <p className="text-2xl font-bold text-green-500">{highPerformers}</p>
            </div>
            <Award className="h-8 w-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-md border-l-4 border-red-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Necesitan Apoyo</p>
              <p className="text-2xl font-bold text-red-500">{needingSupport}</p>
            </div>
            <AlertTriangle className="h-8 w-8 text-red-500" />
          </div>
        </div>
      </div>

      {/* Performance Distribution Chart */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Distribución de Rendimiento</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Alto Rendimiento</span>
            <span className="text-sm text-gray-600">{performanceDistribution.high} brigadistas</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-green-500 h-3 rounded-full"
              style={{ width: `${(performanceDistribution.high / metrics.length) * 100}%` }}
            ></div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Rendimiento Medio</span>
            <span className="text-sm text-gray-600">{performanceDistribution.medium} brigadistas</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-yellow-500 h-3 rounded-full"
              style={{ width: `${(performanceDistribution.medium / metrics.length) * 100}%` }}
            ></div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Bajo Rendimiento</span>
            <span className="text-sm text-gray-600">{performanceDistribution.low} brigadistas</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-red-500 h-3 rounded-full"
              style={{ width: `${(performanceDistribution.low / metrics.length) * 100}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white p-4 rounded-lg shadow-md">
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar brigadista o líder..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <select
                value={filterLevel}
                onChange={(e) => setFilterLevel(e.target.value as any)}
                className="border border-gray-300 rounded-md px-3 py-2 focus:ring-primary focus:border-primary"
              >
                <option value="all">Todos los niveles</option>
                <option value="high">Alto rendimiento</option>
                <option value="medium">Rendimiento medio</option>
                <option value="low">Bajo rendimiento</option>
              </select>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">Ordenar por:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="border border-gray-300 rounded-md px-3 py-2 focus:ring-primary focus:border-primary"
            >
              <option value="citizens">Ciudadanos</option>
              <option value="efficiency">Eficiencia</option>
              <option value="name">Nombre</option>
            </select>
          </div>
        </div>
      </div>

      {/* Detailed Brigadier Metrics */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Detalle de Productividad por Brigadista
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Mostrando {filteredMetrics.length} de {metrics.length} brigadistas
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Brigadista
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Líder
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Red
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ciudadanos
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Promedio por Movilizador
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Eficiencia
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Progreso a Meta
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rendimiento
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredMetrics.map((brigadier) => (
                <tr key={brigadier.brigadierId} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{brigadier.name}</div>
                        <div className="text-xs text-gray-500">
                          Tasa: {brigadier.registrationRate.toFixed(2)}/día
                        </div>
                      </div>
                      {brigadier.needsSupport && (
                        <AlertTriangle className="h-4 w-4 text-yellow-500 ml-2" />
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{brigadier.leaderName}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{brigadier.mobilizerCount}</div>
                    <div className="text-xs text-gray-500">movilizadores</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{brigadier.citizenCount}</div>
                    <div className="text-xs text-gray-500">registrados</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{brigadier.avgCitizensPerMobilizer.toFixed(1)}</div>
                    <div className="text-xs text-gray-500">ciudadanos/movilizador</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="text-sm font-medium text-gray-900 mr-2">
                        {brigadier.efficiencyScore.toFixed(0)}
                      </div>
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            brigadier.efficiencyScore >= 70 ? 'bg-green-500' :
                            brigadier.efficiencyScore >= 40 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${Math.min(100, brigadier.efficiencyScore)}%` }}
                        ></div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Target className="h-4 w-4 text-gray-400 mr-1" />
                      <span className="text-sm text-gray-900">{brigadier.targetProgress.toFixed(0)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1 mt-1">
                      <div
                        className="bg-primary h-1 rounded-full"
                        style={{ width: `${Math.min(100, brigadier.targetProgress)}%` }}
                      ></div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getPerformanceBadge(brigadier.performanceLevel)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Support Recommendations */}
      {needingSupport > 0 && (
        <div className="bg-white rounded-lg shadow-md">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <AlertTriangle className="h-5 w-5 text-yellow-500 mr-2" />
              Brigadistas que Necesitan Apoyo
            </h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {metrics
                .filter(brigadier => brigadier.needsSupport)
                .slice(0, 6)
                .map((brigadier) => (
                  <div key={brigadier.brigadierId} className="border border-yellow-200 bg-yellow-50 p-4 rounded-lg">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-yellow-800">{brigadier.name}</h4>
                        <p className="text-xs text-yellow-700 mt-1">Líder: {brigadier.leaderName}</p>
                        <div className="mt-2 text-xs text-yellow-700">
                          <p>• {brigadier.citizenCount} ciudadanos registrados</p>
                          <p>• Eficiencia: {brigadier.efficiencyScore.toFixed(0)}/100</p>
                          <p>• {brigadier.mobilizerCount} movilizadores en red</p>
                        </div>
                      </div>
                      <span className="text-xs bg-yellow-200 text-yellow-800 px-2 py-1 rounded">
                        Apoyo requerido
                      </span>
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

export default BrigadierProductivityMetrics;