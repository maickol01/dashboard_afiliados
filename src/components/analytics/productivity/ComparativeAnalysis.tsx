import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, Minus, Award, AlertTriangle, DollarSign, Users } from 'lucide-react';
import { ComparativeMetric } from '../../../types/productivity';

interface ComparativeAnalysisProps {
  comparativeAnalysis: ComparativeMetric[];
  overallInsights: {
    mostEffectiveLevel: 'leader' | 'brigadier' | 'mobilizer';
    recommendedActions: string[];
    performanceTrends: {
      level: string;
      trend: 'up' | 'down' | 'stable';
      changePercentage: number;
    }[];
  };
  loading?: boolean;
}

const ComparativeAnalysis: React.FC<ComparativeAnalysisProps> = ({ 
  comparativeAnalysis, 
  overallInsights,
  loading = false 
}) => {
  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (comparativeAnalysis.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Análisis Comparativo</h3>
        <p className="text-gray-500 text-center py-8">No hay datos suficientes para el análisis comparativo</p>
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

  const getLevelLabel = (level: string) => {
    const labels: Record<string, string> = {
      leader: 'Líderes',
      brigadier: 'Brigadistas',
      mobilizer: 'Movilizadores'
    };
    return labels[level] || level;
  };

  const getMostEffectiveLevelLabel = (level: string) => {
    const labels: Record<string, string> = {
      leader: 'Líderes',
      brigadier: 'Brigadistas',
      mobilizer: 'Movilizadores'
    };
    return labels[level] || level;
  };

  // Prepare and validate data for charts
  const performanceData = Array.isArray(comparativeAnalysis) ? comparativeAnalysis
    .filter(metric => metric && typeof metric.averagePerformance === 'number')
    .map(metric => ({
      level: getLevelLabel(metric.level),
      performance: metric.averagePerformance,
      costPerRegistration: metric.costPerRegistration
    })) : [];

  const distributionData = Array.isArray(comparativeAnalysis) ? comparativeAnalysis
    .filter(metric => metric && metric.performanceDistribution)
    .map(metric => ({
      level: getLevelLabel(metric.level),
      high: metric.performanceDistribution.high || 0,
      medium: metric.performanceDistribution.medium || 0,
      low: metric.performanceDistribution.low || 0
    })) : [];

  // Colors for charts
  const COLORS = ['#10B981', '#F59E0B', '#EF4444']; // Green, Yellow, Red
  const PERFORMANCE_COLOR = '#235B4E'; // Primary color

  return (
    <div className="space-y-6">
      {/* Overall Insights Summary */}
      <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-primary">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Award className="h-5 w-5 text-primary mr-2" />
          Insights Generales
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary mb-2">
              {getMostEffectiveLevelLabel(overallInsights.mostEffectiveLevel)}
            </div>
            <div className="text-sm text-gray-600">Nivel más efectivo</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-secondary mb-2">
              {overallInsights.recommendedActions.length}
            </div>
            <div className="text-sm text-gray-600">Acciones recomendadas</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-accent mb-2">
              {overallInsights.performanceTrends.filter(t => t.trend === 'up').length}
            </div>
            <div className="text-sm text-gray-600">Tendencias positivas</div>
          </div>
        </div>
      </div>

      {/* Performance Comparison Chart */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Comparación de Rendimiento Promedio
        </h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={performanceData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="level" />
              <YAxis />
              <Tooltip 
                formatter={(value: number) => [value.toFixed(1), 'Ciudadanos promedio']}
                labelFormatter={(label) => `Nivel: ${label}`}
              />
              <Bar dataKey="performance" fill={PERFORMANCE_COLOR} radius={[4, 4, 0, 0]} isAnimationActive={false} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Performance Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Distribution Chart */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Distribución de Rendimiento por Nivel
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={distributionData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="level" />
                <YAxis />
                <Tooltip formatter={(value: number) => [`${value.toFixed(1)}%`, '']} />
                <Bar dataKey="high" stackId="a" fill={COLORS[0]} name="Alto" isAnimationActive={false} />
                <Bar dataKey="medium" stackId="a" fill={COLORS[1]} name="Medio" isAnimationActive={false} />
                <Bar dataKey="low" stackId="a" fill={COLORS[2]} name="Bajo" isAnimationActive={false} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center mt-4 space-x-4">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded mr-2"></div>
              <span className="text-sm text-gray-600">Alto</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-yellow-500 rounded mr-2"></div>
              <span className="text-sm text-gray-600">Medio</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-red-500 rounded mr-2"></div>
              <span className="text-sm text-gray-600">Bajo</span>
            </div>
          </div>
        </div>

        {/* Cost Analysis */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <DollarSign className="h-5 w-5 text-green-600 mr-2" />
            Costo por Registro
          </h3>
          <div className="space-y-4">
            {comparativeAnalysis.map((metric, index) => (
              <div key={metric.level} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <div className={`w-4 h-4 rounded mr-3`} style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                  <span className="font-medium text-gray-900">{getLevelLabel(metric.level)}</span>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-gray-900">
                    ${metric.costPerRegistration.toFixed(0)}
                  </div>
                  <div className="text-sm text-gray-500">por registro</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Detailed Comparison Table */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Comparación Detallada por Nivel</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nivel Organizacional
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rendimiento Promedio
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Mejor Performer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Peor Performer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Distribución
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Costo/Registro
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tendencia
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {comparativeAnalysis.map((metric) => (
                <tr key={metric.level} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Users className="h-5 w-5 text-gray-400 mr-2" />
                      <span className="text-sm font-medium text-gray-900">
                        {getLevelLabel(metric.level)}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {metric.averagePerformance.toFixed(1)}
                    </div>
                    <div className="text-xs text-gray-500">ciudadanos</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{metric.topPerformer.name}</div>
                    <div className="text-xs text-gray-500">{metric.topPerformer.score} ciudadanos</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{metric.bottomPerformer.name}</div>
                    <div className="text-xs text-gray-500">{metric.bottomPerformer.score} ciudadanos</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex space-x-1">
                      <div className="text-xs">
                        <span className="text-green-600">{metric.performanceDistribution.high.toFixed(0)}%</span>
                        <span className="text-gray-400"> / </span>
                        <span className="text-yellow-600">{metric.performanceDistribution.medium.toFixed(0)}%</span>
                        <span className="text-gray-400"> / </span>
                        <span className="text-red-600">{metric.performanceDistribution.low.toFixed(0)}%</span>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500">Alto / Medio / Bajo</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      ${metric.costPerRegistration.toFixed(0)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {getTrendIcon(metric.efficiencyTrend)}
                      <span className="ml-1 text-sm text-gray-600 capitalize">
                        {metric.efficiencyTrend === 'improving' ? 'Mejorando' :
                         metric.efficiencyTrend === 'declining' ? 'Declinando' : 'Estable'}
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Performance Trends */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Tendencias de Rendimiento</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {overallInsights.performanceTrends.map((trend) => (
            <div key={trend.level} className="p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-900">{trend.level}</span>
                {getTrendIcon(trend.trend)}
              </div>
              <div className="text-2xl font-bold text-gray-900 mb-1">
                {trend.changePercentage > 0 ? '+' : ''}{trend.changePercentage.toFixed(1)}%
              </div>
              <div className="text-xs text-gray-500">Cambio en rendimiento</div>
            </div>
          ))}
        </div>
      </div>

      {/* Recommended Actions */}
      {overallInsights.recommendedActions.length > 0 && (
        <div className="bg-white rounded-lg shadow-md">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <AlertTriangle className="h-5 w-5 text-yellow-500 mr-2" />
              Acciones Recomendadas
            </h3>
          </div>
          <div className="p-6">
            <div className="space-y-3">
              {overallInsights.recommendedActions.map((action, index) => (
                <div key={index} className="flex items-start p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex-shrink-0">
                    <div className="w-6 h-6 bg-yellow-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                      {index + 1}
                    </div>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-yellow-800">{action}</p>
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

export default ComparativeAnalysis;