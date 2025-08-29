import React, { useState } from 'react';
import { Users, UserPlus, TrendingUp, Target } from 'lucide-react';
import { useData } from '../../hooks/useData';
import { Period } from '../../types';
import LineChart from '../charts/LineChart';
import EnhancedLeaderPerformanceChart from '../charts/EnhancedLeaderPerformanceChart';
import { KPICardsSection, LeaderProductivityTable, GoalsSection } from '../shared';
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
    getLeaderPerformanceByPeriod,
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
  const leaderPerformanceData = getLeaderPerformanceByPeriod(selectedPeriod);

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
              data={leaderPerformanceData}
              title="Rendimiento de Líderes"
              period={selectedPeriod}
            />
          </div>
        </div>
      </div>

      {/* Leader Productivity Table */}
      <LeaderProductivityTable
        hierarchicalData={hierarchicalData || []}
        loading={loading}
      />

      {/* Goals Section */}
      <GoalsSection
        analytics={analytics}
        loading={loading}
      />
    </div>
  );
};

export default ConsolidatedAnalyticsPage;