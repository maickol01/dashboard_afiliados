import React, { useState } from 'react';
import { Users, Activity, Clock, Target, Search, Filter, Calendar, TrendingUp } from 'lucide-react';
import { MobilizerProductivityMetric } from '../../../types/productivity';

interface MobilizerProductivityMetricsProps {
  metrics: MobilizerProductivityMetric[];
  loading?: boolean;
}

const MobilizerProductivityMetrics: React.FC<MobilizerProductivityMetricsProps> = ({ 
  metrics, 
  loading = false 
}) => {
  const [filterActivity, setFilterActivity] = useState<'all' | 'active' | 'moderate' | 'inactive'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'citizens' | 'rate' | 'progress' | 'name'>('citizens');

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
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Productividad de Movilizadores</h3>
        <p className="text-gray-500 text-center py-8">No hay datos de movilizadores disponibles</p>
      </div>
    );
  }

  // Filter and sort metrics
  const filteredMetrics = metrics
    .filter(mobilizer => {
      const matchesFilter = filterActivity === 'all' || mobilizer.activityLevel === filterActivity;
      const matchesSearch = mobilizer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           mobilizer.brigadierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           mobilizer.leaderName.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesFilter && matchesSearch;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'citizens':
          return b.citizenCount - a.citizenCount;
        case 'rate':
          return b.registrationRate - a.registrationRate;
        case 'progress':
          return b.targetProgress - a.targetProgress;
        case 'name':
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });

  const getActivityBadge = (level: 'active' | 'moderate' | 'inactive') => {
    const styles = {
      active: 'bg-green-100 text-green-800 border-green-200',
      moderate: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      inactive: 'bg-red-100 text-red-800 border-red-200'
    };
    
    const labels = {
      active: 'Activo',
      moderate: 'Moderado',
      inactive: 'Inactivo'
    };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[level]}`}>
        {labels[level]}
      </span>
    );
  };

  const formatLastRegistration = (date: Date) => {
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Ayer';
    if (diffDays <= 7) return `Hace ${diffDays} días`;
    if (diffDays <= 30) return `Hace ${Math.ceil(diffDays / 7)} semanas`;
    return `Hace ${Math.ceil(diffDays / 30)} meses`;
  };

  // Calculate summary statistics
  const totalCitizens = metrics.reduce((sum, m) => sum + m.citizenCount, 0);
  const avgRegistrationRate = metrics.reduce((sum, m) => sum + m.registrationRate, 0) / metrics.length;
  const avgTargetProgress = metrics.reduce((sum, m) => sum + m.targetProgress, 0) / metrics.length;

  const activityDistribution = {
    active: metrics.filter(m => m.activityLevel === 'active').length,
    moderate: metrics.filter(m => m.activityLevel === 'moderate').length,
    inactive: metrics.filter(m => m.activityLevel === 'inactive').length
  };

  const topPerformers = metrics
    .filter(m => m.targetProgress >= 100)
    .sort((a, b) => b.citizenCount - a.citizenCount)
    .slice(0, 5);

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
              <p className="text-sm font-medium text-gray-600">Tasa Promedio</p>
              <p className="text-2xl font-bold text-secondary">{avgRegistrationRate.toFixed(2)}</p>
              <p className="text-xs text-gray-500">por día</p>
            </div>
            <TrendingUp className="h-8 w-8 text-secondary" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-md border-l-4 border-accent">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Progreso Promedio</p>
              <p className="text-2xl font-bold text-accent">{avgTargetProgress.toFixed(0)}%</p>
            </div>
            <Target className="h-8 w-8 text-accent" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-md border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Movilizadores Activos</p>
              <p className="text-2xl font-bold text-green-500">{activityDistribution.active}</p>
            </div>
            <Activity className="h-8 w-8 text-green-500" />
          </div>
        </div>
      </div>

      {/* Activity Distribution */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Distribución de Actividad</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Activos (≥0.5 registros/día)</span>
            <span className="text-sm text-gray-600">{activityDistribution.active} movilizadores</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-green-500 h-3 rounded-full"
              style={{ width: `${(activityDistribution.active / metrics.length) * 100}%` }}
            ></div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Moderados (0.1-0.5 registros/día)</span>
            <span className="text-sm text-gray-600">{activityDistribution.moderate} movilizadores</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-yellow-500 h-3 rounded-full"
              style={{ width: `${(activityDistribution.moderate / metrics.length) * 100}%` }}
            ></div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Inactivos (&lt;0.1 registros/día)</span>
            <span className="text-sm text-gray-600">{activityDistribution.inactive} movilizadores</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-red-500 h-3 rounded-full"
              style={{ width: `${(activityDistribution.inactive / metrics.length) * 100}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Top Performers */}
      {topPerformers.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Target className="h-5 w-5 text-green-500 mr-2" />
            Movilizadores que Superaron su Meta
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {topPerformers.map((mobilizer) => (
              <div key={mobilizer.mobilizerId} className="border border-green-200 bg-green-50 p-4 rounded-lg">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-green-800">{mobilizer.name}</h4>
                    <p className="text-xs text-green-700 mt-1">
                      Brigadista: {mobilizer.brigadierName}
                    </p>
                    <div className="mt-2 text-xs text-green-700">
                      <p>• {mobilizer.citizenCount} ciudadanos ({mobilizer.targetProgress.toFixed(0)}% de meta)</p>
                      <p>• Tasa: {mobilizer.registrationRate.toFixed(2)} registros/día</p>
                    </div>
                  </div>
                  <span className="text-xs bg-green-200 text-green-800 px-2 py-1 rounded">
                    Meta superada
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters and Search */}
      <div className="bg-white p-4 rounded-lg shadow-md">
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar movilizador, brigadista o líder..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <select
                value={filterActivity}
                onChange={(e) => setFilterActivity(e.target.value as any)}
                className="border border-gray-300 rounded-md px-3 py-2 focus:ring-primary focus:border-primary"
              >
                <option value="all">Todos los niveles</option>
                <option value="active">Activos</option>
                <option value="moderate">Moderados</option>
                <option value="inactive">Inactivos</option>
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
              <option value="rate">Tasa de registro</option>
              <option value="progress">Progreso a meta</option>
              <option value="name">Nombre</option>
            </select>
          </div>
        </div>
      </div>

      {/* Detailed Mobilizer Metrics */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Detalle de Productividad por Movilizador
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Mostrando {filteredMetrics.length} de {metrics.length} movilizadores
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Movilizador
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Jerarquía
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ciudadanos
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tasa de Registro
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Progreso a Meta
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Promedio Semanal
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Último Registro
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actividad
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredMetrics.map((mobilizer) => (
                <tr key={mobilizer.mobilizerId} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{mobilizer.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-xs text-gray-600">
                      <div>Líder: {mobilizer.leaderName}</div>
                      <div>Brigadista: {mobilizer.brigadierName}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{mobilizer.citizenCount}</div>
                    <div className="text-xs text-gray-500">registrados</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{mobilizer.registrationRate.toFixed(2)}</div>
                    <div className="text-xs text-gray-500">por día</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="text-sm font-medium text-gray-900 mr-2">
                        {mobilizer.targetProgress.toFixed(0)}%
                      </div>
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            mobilizer.targetProgress >= 100 ? 'bg-green-500' :
                            mobilizer.targetProgress >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${Math.min(100, mobilizer.targetProgress)}%` }}
                        ></div>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500">Meta: {mobilizer.monthlyGoal}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{mobilizer.weeklyAverage.toFixed(1)}</div>
                    <div className="text-xs text-gray-500">por semana</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 text-gray-400 mr-1" />
                      <span className="text-sm text-gray-900">
                        {formatLastRegistration(mobilizer.lastRegistration)}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getActivityBadge(mobilizer.activityLevel)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inactive Mobilizers Alert */}
      {activityDistribution.inactive > 0 && (
        <div className="bg-white rounded-lg shadow-md">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Clock className="h-5 w-5 text-red-500 mr-2" />
              Movilizadores Inactivos - Requieren Atención
            </h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {metrics
                .filter(mobilizer => mobilizer.activityLevel === 'inactive')
                .slice(0, 6)
                .map((mobilizer) => (
                  <div key={mobilizer.mobilizerId} className="border border-red-200 bg-red-50 p-4 rounded-lg">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-red-800">{mobilizer.name}</h4>
                        <p className="text-xs text-red-700 mt-1">
                          Brigadista: {mobilizer.brigadierName}
                        </p>
                        <div className="mt-2 text-xs text-red-700">
                          <p>• {mobilizer.citizenCount} ciudadanos registrados</p>
                          <p>• Último registro: {formatLastRegistration(mobilizer.lastRegistration)}</p>
                          <p>• Tasa: {mobilizer.registrationRate.toFixed(2)} registros/día</p>
                        </div>
                      </div>
                      <span className="text-xs bg-red-200 text-red-800 px-2 py-1 rounded">
                        Inactivo
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

export default MobilizerProductivityMetrics;