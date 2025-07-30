import React, { useState, useMemo } from 'react';
import { 
  MapPin, 
  Users, 
  TrendingUp, 
  AlertTriangle, 
  Target,
  BarChart3,
  Map,
  Filter,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  ScatterChart,
  Scatter
} from 'recharts';
import { 
  TerritorialAnalytics as TerritorialAnalyticsType,
  TerritorialCoverageMetric,
  WorkerDensityMetric,
  TerritorialGapMetric,
  CitizenWorkerRatioMetric
} from '../../../types/territorial';

interface TerritorialAnalyticsProps {
  data: TerritorialAnalyticsType;
}

type ViewMode = 'coverage' | 'density' | 'gaps' | 'ratios';
type RegionFilter = 'all' | 'entidad' | 'municipio' | 'seccion';

const TerritorialAnalytics: React.FC<TerritorialAnalyticsProps> = ({ data }) => {
  const [viewMode, setViewMode] = useState<ViewMode>('coverage');
  const [regionFilter, setRegionFilter] = useState<RegionFilter>('all');
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['summary']));

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  // Filter data based on region filter
  const filteredCoverageData = useMemo(() => {
    if (regionFilter === 'all') return data.coverageMetrics;
    return data.coverageMetrics.filter(metric => metric.regionType === regionFilter);
  }, [data.coverageMetrics, regionFilter]);

  const filteredDensityData = useMemo(() => {
    if (regionFilter === 'all') return data.workerDensity;
    return data.workerDensity.filter(metric => metric.regionType === regionFilter);
  }, [data.workerDensity, regionFilter]);

  // Chart data preparation
  const coverageChartData = filteredCoverageData.slice(0, 10).map(metric => ({
    region: metric.region.length > 15 ? metric.region.substring(0, 15) + '...' : metric.region,
    coverage: metric.coveragePercentage,
    target: metric.targetCoverage,
    citizens: metric.totalCitizens,
    workers: metric.totalWorkers,
    status: metric.status
  }));

  const densityChartData = filteredDensityData.slice(0, 10).map(metric => ({
    region: metric.region.length > 15 ? metric.region.substring(0, 15) + '...' : metric.region,
    workerDensity: metric.workerDensity,
    citizenDensity: metric.citizenDensity,
    isOptimal: metric.isOptimal
  }));

  const gapSeverityData = [
    { name: 'Crítico', value: data.gapAnalysis.filter(g => g.severity === 'critical').length, color: '#ef4444' },
    { name: 'Alto', value: data.gapAnalysis.filter(g => g.severity === 'high').length, color: '#f97316' },
    { name: 'Medio', value: data.gapAnalysis.filter(g => g.severity === 'medium').length, color: '#eab308' },
    { name: 'Bajo', value: data.gapAnalysis.filter(g => g.severity === 'low').length, color: '#22c55e' }
  ];

  const ratioScatterData = data.citizenWorkerRatio.map(metric => ({
    region: metric.region,
    workers: metric.totalWorkers,
    citizens: metric.totalCitizens,
    ratio: metric.ratio,
    efficiency: metric.efficiency
  }));

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'text-green-600 bg-green-50';
      case 'good': return 'text-blue-600 bg-blue-50';
      case 'needs_improvement': return 'text-yellow-600 bg-yellow-50';
      case 'critical': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getEfficiencyColor = (efficiency: string) => {
    switch (efficiency) {
      case 'high': return 'text-green-600 bg-green-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Map className="h-6 w-6 text-blue-600" />
            Análisis Territorial
          </h2>
          <p className="text-gray-600 mt-1">
            Cobertura, densidad y oportunidades de expansión por región
          </p>
        </div>
        
        <div className="flex gap-2">
          <select
            value={regionFilter}
            onChange={(e) => setRegionFilter(e.target.value as RegionFilter)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">Todas las regiones</option>
            <option value="entidad">Estados</option>
            <option value="municipio">Municipios</option>
            <option value="seccion">Secciones</option>
          </select>
          
          <select
            value={viewMode}
            onChange={(e) => setViewMode(e.target.value as ViewMode)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="coverage">Cobertura</option>
            <option value="density">Densidad</option>
            <option value="gaps">Brechas</option>
            <option value="ratios">Ratios</option>
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Regiones Analizadas</p>
              <p className="text-2xl font-bold text-gray-900">{data.summary.totalRegionsAnalyzed}</p>
            </div>
            <MapPin className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Cobertura Excelente</p>
              <p className="text-2xl font-bold text-green-600">{data.summary.regionsWithExcellentCoverage}</p>
            </div>
            <Target className="h-8 w-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Brechas Críticas</p>
              <p className="text-2xl font-bold text-red-600">{data.summary.criticalGaps}</p>
            </div>
            <AlertTriangle className="h-8 w-8 text-red-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Salud Territorial</p>
              <p className="text-2xl font-bold text-blue-600">{data.summary.overallHealthScore.toFixed(0)}%</p>
            </div>
            <TrendingUp className="h-8 w-8 text-blue-600" />
          </div>
        </div>
      </div>

      {/* Main Content Based on View Mode */}
      {viewMode === 'coverage' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Coverage Chart */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Cobertura por Región</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={coverageChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="region" 
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  fontSize={12}
                />
                <YAxis />
                <Tooltip 
                  formatter={(value, name) => [
                    `${Number(value).toFixed(1)}%`, 
                    name === 'coverage' ? 'Cobertura' : 'Objetivo'
                  ]}
                />
                <Bar dataKey="coverage" fill="#3b82f6" name="coverage" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Coverage Status Distribution */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Distribución de Estados</h3>
            <div className="space-y-3">
              {[
                { status: 'excellent', label: 'Excelente', count: data.coverageMetrics.filter(m => m.status === 'excellent').length },
                { status: 'good', label: 'Bueno', count: data.coverageMetrics.filter(m => m.status === 'good').length },
                { status: 'needs_improvement', label: 'Necesita Mejora', count: data.coverageMetrics.filter(m => m.status === 'needs_improvement').length },
                { status: 'critical', label: 'Crítico', count: data.coverageMetrics.filter(m => m.status === 'critical').length }
              ].map(({ status, label, count }) => (
                <div key={status} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${getStatusColor(status).split(' ')[1]}`}></div>
                    <span className="text-sm text-gray-700">{label}</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {viewMode === 'density' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Density Chart */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Densidad de Trabajadores</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={densityChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="region" 
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  fontSize={12}
                />
                <YAxis />
                <Tooltip 
                  formatter={(value, name) => [
                    `${Number(value).toFixed(2)}`, 
                    name === 'workerDensity' ? 'Trabajadores/1000' : 'Ciudadanos/1000'
                  ]}
                />
                <Bar dataKey="workerDensity" fill="#10b981" name="workerDensity" />
                <Bar dataKey="citizenDensity" fill="#3b82f6" name="citizenDensity" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Density Scatter Plot */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Relación Trabajadores vs Ciudadanos</h3>
            <ResponsiveContainer width="100%" height={300}>
              <ScatterChart data={ratioScatterData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="workers" name="Trabajadores" />
                <YAxis dataKey="citizens" name="Ciudadanos" />
                <Tooltip 
                  cursor={{ strokeDasharray: '3 3' }}
                  formatter={(value, name) => [value, name === 'workers' ? 'Trabajadores' : 'Ciudadanos']}
                  labelFormatter={(label) => `Región: ${label}`}
                />
                <Scatter dataKey="citizens" fill="#3b82f6" />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {viewMode === 'gaps' && (
        <div className="space-y-6">
          {/* Gap Severity Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Distribución de Brechas</h3>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={gapSeverityData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {gapSeverityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Oportunidades de Expansión</h3>
              <div className="space-y-3">
                {data.summary.expansionOpportunities.slice(0, 5).map((opportunity, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{opportunity.region}</p>
                      <p className="text-sm text-gray-600">
                        {opportunity.potentialCitizens} ciudadanos potenciales
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        opportunity.priority === 'high' ? 'bg-red-100 text-red-800' :
                        opportunity.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {opportunity.priority === 'high' ? 'Alta' : 
                         opportunity.priority === 'medium' ? 'Media' : 'Baja'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Detailed Gap Analysis */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div 
              className="flex items-center justify-between p-6 cursor-pointer"
              onClick={() => toggleSection('gaps')}
            >
              <h3 className="text-lg font-semibold text-gray-900">Análisis Detallado de Brechas</h3>
              {expandedSections.has('gaps') ? 
                <ChevronUp className="h-5 w-5 text-gray-500" /> : 
                <ChevronDown className="h-5 w-5 text-gray-500" />
              }
            </div>
            
            {expandedSections.has('gaps') && (
              <div className="px-6 pb-6">
                <div className="space-y-4">
                  {data.gapAnalysis.slice(0, 10).map((gap, index) => (
                    <div key={index} className={`p-4 rounded-lg border ${getSeverityColor(gap.severity)}`}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-medium text-gray-900">{gap.region}</h4>
                            <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600">
                              {gap.regionType}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700 mb-2">{gap.description}</p>
                          <p className="text-sm font-medium text-gray-900">{gap.recommendedAction}</p>
                          {gap.estimatedImpact > 0 && (
                            <p className="text-xs text-gray-600 mt-1">
                              Impacto estimado: {gap.estimatedImpact} ciudadanos adicionales
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(gap.severity)}`}>
                            {gap.severity === 'critical' ? 'Crítico' :
                             gap.severity === 'high' ? 'Alto' :
                             gap.severity === 'medium' ? 'Medio' : 'Bajo'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {viewMode === 'ratios' && (
        <div className="space-y-6">
          {/* Ratio Analysis */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Ratio Ciudadanos por Trabajador</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Región
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Trabajadores
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ciudadanos
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ratio
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Eficiencia
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      vs Promedio
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data.citizenWorkerRatio.slice(0, 15).map((ratio, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {ratio.region}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {ratio.totalWorkers}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {ratio.totalCitizens}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {ratio.ratio.toFixed(1)}:1
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getEfficiencyColor(ratio.efficiency)}`}>
                          {ratio.efficiency === 'high' ? 'Alta' : 
                           ratio.efficiency === 'medium' ? 'Media' : 'Baja'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {ratio.benchmarkComparison.toFixed(0)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Top Performing Regions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div 
          className="flex items-center justify-between p-6 cursor-pointer"
          onClick={() => toggleSection('top-performers')}
        >
          <h3 className="text-lg font-semibold text-gray-900">Regiones con Mejor Desempeño</h3>
          {expandedSections.has('top-performers') ? 
            <ChevronUp className="h-5 w-5 text-gray-500" /> : 
            <ChevronDown className="h-5 w-5 text-gray-500" />
          }
        </div>
        
        {expandedSections.has('top-performers') && (
          <div className="px-6 pb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.summary.topPerformingRegions.map((region, index) => (
                <div key={index} className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900">{region.region}</h4>
                    <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-800">
                      #{index + 1}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-gray-600">
                      Cobertura: <span className="font-medium">{region.coveragePercentage.toFixed(1)}%</span>
                    </p>
                    <p className="text-sm text-gray-600">
                      Ratio C/T: <span className="font-medium">{region.citizenWorkerRatio.toFixed(1)}:1</span>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TerritorialAnalytics;