import React, { useState } from 'react';
import { Users, UserPlus, TrendingUp, Target, Calendar, Award, AlertCircle } from 'lucide-react';
import { useData } from '../../hooks/useData';
import { Period } from '../../types';
import LineChart from '../charts/LineChart';
import EnhancedLeaderPerformanceChart from '../charts/EnhancedLeaderPerformanceChart';
import { KPICardsSection, LeaderProductivityTable } from '../shared';
import RealTimeIndicator from './RealTimeIndicator';
import UpdateDetector from './UpdateDetector';
import type { KPICard } from '../shared';

const ConsolidatedAnalyticsPage: React.FC = () => {
  const {
    data: hierarchicalData,
    analytics,
    loading,
    error,
    refetchData,
    getRegistrationsByPeriod,
    // Real-time update properties
    realTimeStatus,
    recentUpdates,
    triggerRealTimeRefresh,
    checkRealTimeConnection,
    detectManualUpdates,
    clearRealTimeError,
    clearRecentUpdates
  } = useData(null);

  const [selectedPeriod, setSelectedPeriod] = useState<Period>('day');

  // Handle loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando datos de Supabase...</p>
        </div>
      </div>
    );
  }

  // Handle error state
  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <svg className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error al cargar datos</h3>
          <p className="text-gray-600 mb-4">{error}</p>
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

  // Get data for charts
  const registrationData = getRegistrationsByPeriod(selectedPeriod);

  // Prepare KPI cards data from analytics
  const mainKPICards: KPICard[] = [
    {
      name: 'Total Líderes',
      value: analytics.totalLideres,
      icon: Users,
      color: 'bg-primary',
      change: '+12%',
      trend: 'up',
    },
    {
      name: 'Total Brigadistas',
      value: analytics.totalBrigadistas,
      icon: UserPlus,
      color: 'bg-secondary',
      change: '+8%',
      trend: 'up',
    },
    {
      name: 'Total Movilizadores',
      value: analytics.totalMobilizers,
      icon: TrendingUp,
      color: 'bg-accent',
      change: '+15%',
      trend: 'up',
    },
    {
      name: 'Total Ciudadanos',
      value: analytics.totalCitizens,
      icon: Target,
      color: 'bg-neutral',
      change: '+22%',
      trend: 'up',
    },
  ];

    // Extracted from GoalsSection
    const { goals } = analytics;

    const getStatusColor = (status: string) => {
      switch (status) {
        case 'ahead': return 'text-green-600 bg-green-50 border-green-200';
        case 'on-track': return 'text-blue-600 bg-blue-50 border-blue-200';
        case 'behind': return 'text-red-600 bg-red-50 border-red-200';
        default: return 'text-gray-600 bg-gray-50 border-gray-200';
      }
    };
  
    const getStatusIcon = (status: string) => {
      switch (status) {
        case 'ahead': return <Award className="h-4 w-4" />;
        case 'on-track': return <TrendingUp className="h-4 w-4" />;
        case 'behind': return <AlertCircle className="h-4 w-4" />;
        default: return <Target className="h-4 w-4" />;
      }
    };
  
    const getStatusText = (status: string) => {
      switch (status) {
        case 'ahead': return 'Adelantado';
        case 'on-track': return 'En Progreso';
        case 'behind': return 'Retrasado';
        default: return 'Sin Estado';
      }
    };

  return (
    <div className="space-y-6" data-testid="consolidated-analytics-page">
      {/* Update Detector - invisible component for fallback update detection */}
      <UpdateDetector
        realTimeStatus={realTimeStatus}
        onDetectUpdates={detectManualUpdates}
        onTriggerRefresh={triggerRealTimeRefresh}
        fallbackInterval={30000} // Check every 30 seconds when real-time is down
        enabled={true}
      />

      {/* Real-Time Updates Indicator */}
      <RealTimeIndicator
        status={realTimeStatus}
        recentUpdates={recentUpdates}
        onRefresh={triggerRealTimeRefresh}
        onCheckConnection={checkRealTimeConnection}
        onClearError={clearRealTimeError}
        onClearUpdates={clearRecentUpdates}
      />

      {/* Main KPI Cards Section */}
      <KPICardsSection
        title="Métricas Principales"
        cards={mainKPICards}
        loading={loading}
        gridCols={4}
      />

      {/* Meta General del Año */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
          <Target className="h-5 w-5 text-primary mr-2" />
          Meta General del Año
        </h3>
        
        <div className="text-center mb-6">
          <div className="text-4xl font-bold text-primary mb-2">
            {goals.overallProgress.percentage.toFixed(1)}%
          </div>
          <div className="text-gray-600">
            {goals.overallProgress.current.toLocaleString()} de {goals.overallProgress.target.toLocaleString()} ciudadanos
          </div>
        </div>

        <div className="w-full bg-gray-200 rounded-full h-4 mb-4">
          <div 
            className="bg-gradient-to-r from-primary to-secondary h-4 rounded-full transition-all duration-1000 relative"
            style={{ width: `${Math.min(goals.overallProgress.percentage, 100)}%` }}
          >
            <div className="absolute right-0 top-0 h-4 w-4 bg-white rounded-full border-2 border-primary transform translate-x-1/2"></div>
          </div>
        </div>

        <div className="flex justify-between text-sm text-gray-500">
          <span>0</span>
          <span>{(goals.overallProgress.target / 2).toLocaleString()}</span>
          <span>{goals.overallProgress.target.toLocaleString()}</span>
        </div>

        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <div className="text-sm text-gray-600">
            <strong>Faltan:</strong> {(goals.overallProgress.target - goals.overallProgress.current).toLocaleString()} ciudadanos
          </div>
          <div className="text-sm text-gray-600 mt-1">
            <strong>Ritmo actual:</strong> {Math.round((goals.overallProgress.current / (new Date().getMonth() + 1)) * 12)} ciudadanos/año proyectados
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="space-y-6">
        {/* Period Selector */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Registros por Período</h3>
            <div className="flex rounded-md shadow-xs">
              {(['day', 'week', 'month'] as Period[]).map((period) => (
                <button
                  key={period}
                  onClick={() => setSelectedPeriod(period)}
                  className={`px-4 py-2 text-sm font-medium border ${selectedPeriod === period
                    ? 'bg-primary text-white border-primary'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    } ${period === 'day' ? 'rounded-l-md' :
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

        {/* Charts - Full width for better visibility */}
        <div className="space-y-6">
          {/* Citizens Registration Chart */}
          <div className="w-full">
            <LineChart
              data={registrationData}
              title={`Ciudadanos Registrados por ${selectedPeriod === 'day' ? 'Día' : selectedPeriod === 'week' ? 'Semana' : 'Mes'}`}
            />
          </div>

          {/* Leader Performance Chart */}
          <div className="w-full">
            <EnhancedLeaderPerformanceChart
              hierarchicalData={hierarchicalData || []}
              title="Rendimiento"
            />
          </div>
        </div>
      </div>

      {/* Leader Productivity Table */}
      <LeaderProductivityTable
        hierarchicalData={hierarchicalData || []}
        loading={loading}
      />

      {/* Metas Individuales por Líder - Formato de Tabla */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Metas Individuales por Líder</h3>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Líder
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Progreso
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Meta
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Porcentaje
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {goals.individualGoals.map((goal) => {
                const percentage = (goal.current / goal.target) * 100;
                return (
                  <tr key={goal.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{goal.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{goal.current}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{goal.target}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="text-sm font-medium text-gray-900 mr-2">
                          {percentage.toFixed(1)}%
                        </div>
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full transition-all duration-500 ${
                              goal.status === 'ahead' ? 'bg-green-500' :
                              goal.status === 'on-track' ? 'bg-blue-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${Math.min(percentage, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(goal.status)}`}>
                        {getStatusIcon(goal.status)}
                        <span className="ml-1">{getStatusText(goal.status)}</span>
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Hitos del Año */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Calendar className="h-5 w-5 text-secondary mr-2" />
          Hitos del Año
        </h3>
        
        <div className="space-y-4">
          {goals.milestones.map((milestone, index) => (
            <div key={index} className={`p-4 rounded-lg border ${
              milestone.completed 
                ? 'bg-green-50 border-green-200' 
                : new Date(milestone.date) < new Date() 
                  ? 'bg-red-50 border-red-200'
                  : 'bg-blue-50 border-blue-200'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-3 ${
                    milestone.completed 
                      ? 'bg-green-500 text-white' 
                      : new Date(milestone.date) < new Date()
                        ? 'bg-red-500 text-white'
                        : 'bg-blue-500 text-white'
                  }`}>
                    {milestone.completed ? '✓' : index + 1}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{milestone.description}</div>
                    <div className="text-sm text-gray-500">
                      Fecha límite: {new Date(milestone.date).toLocaleDateString('es-ES')}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold">{milestone.target.toLocaleString()}</div>
                  <div className={`text-sm ${
                    milestone.completed 
                      ? 'text-green-600' 
                      : new Date(milestone.date) < new Date()
                        ? 'text-red-600'
                        : 'text-blue-600'
                  }`}>
                    {milestone.completed 
                      ? 'Completado' 
                      : new Date(milestone.date) < new Date()
                        ? 'Vencido'
                        : 'Pendiente'
                    }
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ConsolidatedAnalyticsPage;