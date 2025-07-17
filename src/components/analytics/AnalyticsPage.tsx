import React, { useState } from 'react';
import { Users, UserPlus, TrendingUp, Target, AlertTriangle, CheckCircle, Clock, MapPin, BarChart3 } from 'lucide-react';
import { useData } from '../../hooks/useData';
import { Period } from '../../types';
import LineChart from '../charts/LineChart';
import BarChart from '../charts/BarChart';
import EfficiencyMetrics from './sections/EfficiencyMetrics';
import GeographicAnalysis from './sections/GeographicAnalysis';
import TemporalAnalysis from './sections/TemporalAnalysis';
import QualityMetrics from './sections/QualityMetrics';
import GoalsAndObjectives from './sections/GoalsAndObjectives';
import AlertsPanel from './sections/AlertsPanel';
import PredictiveAnalytics from './sections/PredictiveAnalytics';
import ComparisonTools from './sections/ComparisonTools';

const AnalyticsPage: React.FC = () => {
  const { analytics, loading, error, refetchData, getRegistrationsByPeriod, lastUpdated, getAnalyticsSummary } = useData();
  const [selectedPeriod, setSelectedPeriod] = useState<Period>('day');
  const [activeSection, setActiveSection] = useState<string>('overview');

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando analytics en tiempo real...</p>
          <p className="text-sm text-gray-500 mt-2">Conectando con base de datos...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <svg className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error al cargar analytics</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <p className="text-sm text-gray-500 mb-4">
            Verifica la conexión con Supabase y que las tablas existan
          </p>
          <button
            onClick={refetchData}
            className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-light"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  if (!analytics) return null;

  const registrationData = getRegistrationsByPeriod(selectedPeriod);
  const summary = getAnalyticsSummary();

  const stats = [
    {
      name: 'Total Líderes',
      value: analytics.totalLideres,
      icon: Users,
      color: 'bg-primary',
      change: analytics.growthRate > 0 ? `+${analytics.growthRate.toFixed(1)}%` : `${analytics.growthRate.toFixed(1)}%`,
      trend: 'up',
    },
    {
      name: 'Total Brigadistas',
      value: analytics.totalBrigadistas,
      icon: UserPlus,
      color: 'bg-secondary',
      change: analytics.growthRate > 0 ? `+${(analytics.growthRate * 0.8).toFixed(1)}%` : `${(analytics.growthRate * 0.8).toFixed(1)}%`,
      trend: 'up',
    },
    {
      name: 'Total Movilizadores',
      value: analytics.totalMobilizers,
      icon: TrendingUp,
      color: 'bg-accent',
      change: analytics.growthRate > 0 ? `+${(analytics.growthRate * 1.2).toFixed(1)}%` : `${(analytics.growthRate * 1.2).toFixed(1)}%`,
      trend: 'up',
    },
    {
      name: 'Total Ciudadanos',
      value: analytics.totalCitizens,
      icon: Target,
      color: 'bg-neutral',
      change: analytics.growthRate > 0 ? `+${(analytics.growthRate * 1.5).toFixed(1)}%` : `${(analytics.growthRate * 1.5).toFixed(1)}%`,
      trend: 'up',
    },
  ];

  const kpis = [
    {
      name: 'Tasa de Conversión',
      value: `${analytics.conversionRate}%`,
      description: 'Porcentaje de ciudadanos registrados vs contactados',
      icon: Target,
      color: 'text-primary',
    },
    {
      name: 'Tasa de Crecimiento',
      value: `${analytics.growthRate}%`,
      description: 'Crecimiento mensual promedio',
      icon: TrendingUp,
      color: 'text-secondary',
    },
    {
      name: 'Calidad de Datos',
      value: `${analytics.quality.dataCompleteness}%`,
      description: 'Completitud de información registrada',
      icon: CheckCircle,
      color: 'text-accent',
    },
    {
      name: 'Tiempo Promedio',
      value: `${analytics.efficiency.registrationSpeed.average}h`,
      description: 'Tiempo promedio de registro',
      icon: Clock,
      color: 'text-neutral',
    },
  ];

  const sections = [
    { id: 'overview', name: 'Resumen General', icon: Target },
    { id: 'efficiency', name: 'Eficiencia', icon: TrendingUp },
    { id: 'geographic', name: 'Análisis Geográfico', icon: MapPin },
    { id: 'temporal', name: 'Análisis Temporal', icon: Clock },
    { id: 'quality', name: 'Calidad', icon: CheckCircle },
    { id: 'goals', name: 'Metas y Objetivos', icon: Target },
    { id: 'alerts', name: 'Alertas', icon: AlertTriangle },
    { id: 'predictions', name: 'Predicciones', icon: Users },
    { id: 'comparison', name: 'Comparativas', icon: BarChart3 },
  ];

  const renderSection = () => {
    switch (activeSection) {
      case 'efficiency':
        return <EfficiencyMetrics analytics={analytics} />;
      case 'geographic':
        return <GeographicAnalysis analytics={analytics} />;
      case 'temporal':
        return <TemporalAnalysis analytics={analytics} />;
      case 'quality':
        return <QualityMetrics analytics={analytics} />;
      case 'goals':
        return <GoalsAndObjectives analytics={analytics} />;
      case 'alerts':
        return <AlertsPanel analytics={analytics} />;
      case 'predictions':
        return <PredictiveAnalytics analytics={analytics} />;
      case 'comparison':
        return <ComparisonTools analytics={analytics} />;
      default:
        return (
          <div className="space-y-6">
            {/* Métricas principales - siempre visibles en Resumen General */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {stats.map((stat) => (
                <div key={stat.name} className="bg-white overflow-hidden shadow-md rounded-lg">
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="shrink-0">
                        <div className={`${stat.color} p-3 rounded-md`}>
                          <stat.icon className="h-6 w-6 text-white" />
                        </div>
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">{stat.name}</dt>
                          <dd className="flex items-center">
                            <span className="text-lg font-semibold text-gray-900">{stat.value}</span>
                            <span className={`ml-2 text-sm font-medium ${
                              stat.trend === 'up' ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {stat.change}
                            </span>
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* KPIs mejorados */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {kpis.map((kpi) => (
                <div key={kpi.name} className="bg-white overflow-hidden shadow-md rounded-lg">
                  <div className="p-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-2xl font-bold text-primary">{kpi.value}</div>
                        <div className="text-sm font-medium text-gray-900 mt-1">{kpi.name}</div>
                        <div className="text-xs text-gray-500 mt-1">{kpi.description}</div>
                      </div>
                      <kpi.icon className={`h-8 w-8 ${kpi.color}`} />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Alertas rápidas */}
            {(analytics.alerts.critical.length > 0 || analytics.alerts.warnings.length > 0) && (
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Alertas Importantes</h3>
                <div className="space-y-3">
                  {analytics.alerts.critical.slice(0, 2).map((alert) => (
                    <div key={alert.id} className="flex items-center p-3 bg-red-50 border border-red-200 rounded-md">
                      <AlertTriangle className="h-5 w-5 text-red-500 mr-3" />
                      <span className="text-red-800">{alert.message}</span>
                    </div>
                  ))}
                  {analytics.alerts.warnings.slice(0, 2).map((alert) => (
                    <div key={alert.id} className="flex items-center p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                      <AlertTriangle className="h-5 w-5 text-yellow-500 mr-3" />
                      <span className="text-yellow-800">{alert.message}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Selector de período */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Registros por Período</h3>
                <div className="flex rounded-md shadow-xs">
                  {(['day', 'week', 'month'] as Period[]).map((period) => (
                    <button
                      key={period}
                      onClick={() => setSelectedPeriod(period)}
                      className={`px-4 py-2 text-sm font-medium border ${
                        selectedPeriod === period
                          ? 'bg-primary text-white border-primary'
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                      } ${
                        period === 'day' ? 'rounded-l-md' : 
                        period === 'month' ? 'rounded-r-md' : 
                        'border-l-0'
                      }`}
                    >
                      {period === 'day' ? 'Día' : period === 'week' ? 'Semana' : 'Mes'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Gráficos principales */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <LineChart
                data={registrationData}
                title={`Ciudadanos Registrados por ${selectedPeriod === 'day' ? 'Día' : selectedPeriod === 'week' ? 'Semana' : 'Mes'}`}
              />
              <BarChart
                data={analytics.leaderPerformance}
                title="Rendimiento de Líderes"
              />
            </div>

            {/* Progreso hacia meta general */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Progreso hacia Meta Anual</h3>
              <div className="space-y-4">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Progreso actual</span>
                  <span>{analytics.goals.overallProgress.current} / {analytics.goals.overallProgress.target}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-primary h-3 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(analytics.goals.overallProgress.percentage, 100)}%` }}
                  ></div>
                </div>
                <div className="text-center">
                  <span className="text-2xl font-bold text-primary">
                    {analytics.goals.overallProgress.percentage.toFixed(1)}%
                  </span>
                  <span className="text-gray-600 ml-2">completado</span>
                </div>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Información de actualización */}
      {lastUpdated && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
              <span className="text-sm text-blue-800">
                Datos actualizados: {lastUpdated.toLocaleString('es-ES')}
              </span>
            </div>
            <button
              onClick={refetchData}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              Actualizar ahora
            </button>
          </div>
        </div>
      )}

      {/* Navegación de secciones */}
      <div className="bg-white p-4 rounded-lg shadow-md">
        <div className="flex flex-wrap gap-2">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                activeSection === section.id
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <section.icon className="h-4 w-4 mr-2 shrink-0" />
              <span className="truncate">{section.name}</span>
            </button>
          ))}
        </div>
      </div>


      {/* Contenido de la sección activa */}
      {renderSection()}
    </div>
  );
};

export default AnalyticsPage;