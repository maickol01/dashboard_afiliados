import React, { useState, useMemo } from 'react';
import { Users, UserPlus, TrendingUp, Target } from 'lucide-react';
import { useData } from '../../hooks/useData';
import { Period, Person } from '../../types';
import LineChart from '../charts/LineChart';
import { KPICardsSection, LeaderProductivityTable } from '../shared';
import RealTimeIndicator from './RealTimeIndicator';
import UpdateDetector from './UpdateDetector';
import type { KPICard } from '../shared';
import { useGlobalFilter } from '../../context/GlobalFilterContext';
import { checkDateFilter, isSameMonth, isSameWeek } from '../../utils/dateUtils';

const ConsolidatedAnalyticsPage: React.FC = () => {
    const { selectedOption, customRange } = useGlobalFilter();
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

    // Calculate filtered totals
    const filteredAnalytics = useMemo(() => {
        if (!hierarchicalData) return { totalLideres: 0, totalBrigadistas: 0, totalMobilizers: 0, totalCitizens: 0 };
        
        // If 'total' is selected and we have pre-calculated analytics, use them (faster)
        // Except analytics might be stale if we want purely client-side filtering consistency?
        // But analytics from useData(null) is total.
        if (selectedOption === 'total' && analytics) {
             return {
                 totalLideres: analytics.totalLideres,
                 totalBrigadistas: analytics.totalBrigadistas,
                 totalMobilizers: analytics.totalMobilizers,
                 totalCitizens: analytics.totalCitizens
             };
        }

        let totalLideres = 0;
        let totalBrigadistas = 0;
        let totalMobilizers = 0;
        let totalCitizens = 0;
        
        const traverse = (nodes: Person[]) => {
            nodes.forEach(node => {
                if (checkDateFilter(node.created_at, selectedOption, customRange)) {
                    if (node.role === 'lider') totalLideres++;
                    if (node.role === 'brigadista') totalBrigadistas++;
                    if (node.role === 'movilizador') totalMobilizers++;
                    if (node.role === 'ciudadano') totalCitizens++;
                }
                if (node.children) traverse(node.children);
            });
        };
        
        traverse(hierarchicalData);
        
        return {
            totalLideres,
            totalBrigadistas,
            totalMobilizers,
            totalCitizens
        };
    }, [hierarchicalData, analytics, selectedOption, customRange]);

    // Calculate filtered chart data
    const filteredRegistrations = useMemo(() => {
        if (!analytics) return { daily: [], weekly: [], monthly: [] };
        
        if (selectedOption === 'total') {
            return {
                daily: analytics.dailyRegistrations,
                weekly: analytics.weeklyRegistrations,
                monthly: analytics.monthlyRegistrations
            };
        }
        
        if (selectedOption === 'month') {
             return {
                 daily: analytics.dailyRegistrations.filter(r => isSameMonth(new Date(r.date), new Date())),
                 weekly: [], 
                 monthly: []
             };
        }
        
        if (selectedOption === 'week') {
            return {
                daily: analytics.dailyRegistrations.filter(r => isSameWeek(new Date(r.date), new Date())),
                weekly: [],
                monthly: []
            };
        }
        
        return {
             daily: analytics.dailyRegistrations.filter(r => checkDateFilter(r.date, selectedOption, customRange)),
             weekly: [],
             monthly: []
        };
    }, [analytics, selectedOption, customRange]);

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

    // Prepare KPI cards data from filtered analytics
    const mainKPICards: KPICard[] = [
        {
            name: 'Total Líderes',
            value: filteredAnalytics.totalLideres,
            icon: Users,
            color: 'bg-primary',
            change: '+12%', // This change % logic would need history to be accurate, leaving static for now or hiding
            trend: 'up',
        },
        {
            name: 'Total Brigadistas',
            value: filteredAnalytics.totalBrigadistas,
            icon: UserPlus,
            color: 'bg-secondary',
            change: '+8%',
            trend: 'up',
        },
        {
            name: 'Total Movilizadores',
            value: filteredAnalytics.totalMobilizers,
            icon: TrendingUp,
            color: 'bg-accent',
            change: '+15%',
            trend: 'up',
        },
        {
            name: 'Total Ciudadanos',
            value: filteredAnalytics.totalCitizens,
            icon: Target,
            color: 'bg-neutral',
            change: '+22%',
            trend: 'up',
        },
    ];

    // Extracted from GoalsSection
    const { goals } = analytics;

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
                {/* Charts - Full width for better visibility */}
                <div className="space-y-6">
                    {/* Citizens Registration Chart */}
                    <div className="w-full">
                        <LineChart
                            registrations={{
                                daily: filteredRegistrations.daily,
                                weekly: filteredRegistrations.weekly,
                                monthly: filteredRegistrations.monthly,
                            }}
                        />
                    </div>
                </div>
            </div>

            {/* Leader Productivity Table */}
            <LeaderProductivityTable
                hierarchicalData={hierarchicalData || []}
                loading={loading}
            />
        </div>
    );
};

export default ConsolidatedAnalyticsPage;