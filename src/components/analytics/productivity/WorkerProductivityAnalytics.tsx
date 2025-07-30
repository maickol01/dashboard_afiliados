import React, { useState, useEffect } from 'react';
import { Users, BarChart3, TrendingUp, Target } from 'lucide-react';
import { DataService } from '../../../services/dataService';
import { Person } from '../../../types';
import { WorkerProductivityAnalytics as WorkerProductivityData } from '../../../types/productivity';
import LeaderProductivityMetrics from './LeaderProductivityMetrics';
import BrigadierProductivityMetrics from './BrigadierProductivityMetrics';
import MobilizerProductivityMetrics from './MobilizerProductivityMetrics';
import ComparativeAnalysis from './ComparativeAnalysis';

interface WorkerProductivityAnalyticsProps {
  hierarchicalData: Person[];
  loading?: boolean;
}

const WorkerProductivityAnalytics: React.FC<WorkerProductivityAnalyticsProps> = ({ 
  hierarchicalData, 
  loading = false 
}) => {
  const [productivityData, setProductivityData] = useState<WorkerProductivityData | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'leaders' | 'brigadiers' | 'mobilizers' | 'comparative'>('leaders');

  // Add error boundary protection
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    try {
      if (hierarchicalData && Array.isArray(hierarchicalData) && hierarchicalData.length > 0) {
        generateProductivityAnalytics();
      } else {
        // Clear data if no hierarchical data is provided
        setProductivityData(null);
        setError(null);
      }
    } catch (err) {
      console.error('Error in useEffect:', err);
      setHasError(true);
      setError('Error al inicializar análisis de productividad');
    }
  }, [hierarchicalData]);

  const generateProductivityAnalytics = async () => {
    if (!hierarchicalData || !Array.isArray(hierarchicalData)) {
      setError('Datos jerárquicos no válidos');
      return;
    }

    setAnalyticsLoading(true);
    setError(null);
    
    try {
      const analytics = await DataService.generateWorkerProductivityAnalytics(hierarchicalData);
      setProductivityData(analytics);
    } catch (err) {
      console.error('Error generating productivity analytics:', err);
      setError('Error al generar análisis de productividad');
      setProductivityData(null);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  // Handle critical errors
  if (hasError) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <svg className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error Crítico</h3>
          <p className="text-gray-600 mb-4">No se pudo cargar el análisis de productividad</p>
          <button
            onClick={() => {
              setHasError(false);
              setError(null);
              if (hierarchicalData && hierarchicalData.length > 0) {
                generateProductivityAnalytics();
              }
            }}
            className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-light"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  if (loading || analyticsLoading) {
    return (
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-24 bg-gray-200 rounded"></div>
              ))}
            </div>
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <svg className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error en Análisis de Productividad</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={generateProductivityAnalytics}
            className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-light"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  if (!productivityData && !analyticsLoading && !error) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Análisis de Productividad de Trabajadores</h3>
        <p className="text-gray-500 text-center py-8">No hay datos disponibles para el análisis de productividad</p>
      </div>
    );
  }

  const tabs = [
    { 
      id: 'leaders' as const, 
      name: 'Líderes', 
      icon: Users, 
      count: productivityData?.leaderMetrics?.length || 0
    },
    { 
      id: 'brigadiers' as const, 
      name: 'Brigadistas', 
      icon: BarChart3, 
      count: productivityData?.brigadierMetrics?.length || 0
    },
    { 
      id: 'mobilizers' as const, 
      name: 'Movilizadores', 
      icon: TrendingUp, 
      count: productivityData?.mobilizerMetrics?.length || 0
    },
    { 
      id: 'comparative' as const, 
      name: 'Análisis Comparativo', 
      icon: Target, 
      count: productivityData?.comparativeAnalysis?.length || 0
    },
  ];

  const renderTabContent = () => {
    if (!productivityData) {
      return (
        <div className="text-center py-8">
          <p className="text-gray-500">No hay datos disponibles para mostrar</p>
        </div>
      );
    }

    switch (activeTab) {
      case 'leaders':
        return (
          <LeaderProductivityMetrics 
            metrics={productivityData.leaderMetrics || []}
            loading={analyticsLoading}
          />
        );
      case 'brigadiers':
        return (
          <BrigadierProductivityMetrics 
            metrics={productivityData.brigadierMetrics || []}
            loading={analyticsLoading}
          />
        );
      case 'mobilizers':
        return (
          <MobilizerProductivityMetrics 
            metrics={productivityData.mobilizerMetrics || []}
            loading={analyticsLoading}
          />
        );
      case 'comparative':
        return (
          <ComparativeAnalysis 
            comparativeAnalysis={productivityData.comparativeAnalysis || []}
            overallInsights={productivityData.overallInsights || {
              mostEffectiveLevel: 'leader',
              recommendedActions: [],
              performanceTrends: []
            }}
            loading={analyticsLoading}
          />
        );
      default:
        return null;
    }
  };

  // Calculate summary statistics safely
  const totalCitizens = productivityData?.leaderMetrics?.reduce((sum, m) => sum + (m.citizenCount || 0), 0) || 0;
  const totalLeaders = productivityData?.leaderMetrics?.length || 0;
  const totalBrigadiers = productivityData?.brigadierMetrics?.length || 0;
  const totalMobilizers = productivityData?.mobilizerMetrics?.length || 0;

  const avgLeaderEfficiency = productivityData?.leaderMetrics && productivityData.leaderMetrics.length > 0 
    ? productivityData.leaderMetrics.reduce((sum, m) => sum + (m.networkEfficiency || 0), 0) / productivityData.leaderMetrics.length 
    : 0;

  const highPerformingBrigadiers = productivityData?.brigadierMetrics?.filter(m => m.performanceLevel === 'high').length || 0;
  const activeMobilizers = productivityData?.mobilizerMetrics?.filter(m => m.activityLevel === 'active').length || 0;

  try {
    return (
      <div className="space-y-6">
      {/* Header with Summary Stats */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Análisis de Productividad de Trabajadores</h2>
            <p className="text-gray-600 mt-1">
              Análisis detallado del rendimiento por nivel organizacional
            </p>
          </div>
          <button
            onClick={generateProductivityAnalytics}
            className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-light flex items-center"
          >
            <TrendingUp className="h-4 w-4 mr-2" />
            Actualizar
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-r from-primary to-primary-light p-4 rounded-lg text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Total Ciudadanos</p>
                <p className="text-2xl font-bold">{totalCitizens.toLocaleString()}</p>
              </div>
              <Users className="h-8 w-8 opacity-80" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-secondary to-secondary-light p-4 rounded-lg text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Eficiencia Promedio</p>
                <p className="text-2xl font-bold">{avgLeaderEfficiency.toFixed(1)}%</p>
              </div>
              <BarChart3 className="h-8 w-8 opacity-80" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-accent to-accent-light p-4 rounded-lg text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Brigadistas Alto Rendimiento</p>
                <p className="text-2xl font-bold">{highPerformingBrigadiers}</p>
              </div>
              <Target className="h-8 w-8 opacity-80" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-green-500 to-green-600 p-4 rounded-lg text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Movilizadores Activos</p>
                <p className="text-2xl font-bold">{activeMobilizers}</p>
              </div>
              <TrendingUp className="h-8 w-8 opacity-80" />
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`${
                  activeTab === tab.id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
              >
                <tab.icon className="h-4 w-4 mr-2" />
                {tab.name}
                <span className="ml-2 bg-gray-100 text-gray-600 py-0.5 px-2 rounded-full text-xs">
                  {tab.count}
                </span>
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {renderTabContent()}
        </div>
      </div>

      {/* Key Insights */}
      {productivityData && productivityData.overallInsights && productivityData.overallInsights.recommendedActions.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-yellow-400">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Insights Clave</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Nivel Más Efectivo</h4>
              <p className="text-lg font-semibold text-primary">
                {productivityData.overallInsights.mostEffectiveLevel === 'leader' ? 'Líderes' :
                 productivityData.overallInsights.mostEffectiveLevel === 'brigadier' ? 'Brigadistas' : 'Movilizadores'}
              </p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Acciones Prioritarias</h4>
              <p className="text-sm text-gray-600">
                {productivityData.overallInsights.recommendedActions.length} acciones recomendadas para mejorar el rendimiento
              </p>
            </div>
          </div>
        </div>
      )}
      </div>
    );
  } catch (renderError) {
    console.error('Critical render error in WorkerProductivityAnalytics:', renderError);
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <svg className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error de Renderizado</h3>
          <p className="text-gray-600 mb-4">No se pudo renderizar el componente de productividad</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-light"
          >
            Recargar Página
          </button>
        </div>
      </div>
    );
  }
};

export default WorkerProductivityAnalytics;