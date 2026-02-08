import React, { useMemo } from 'react';
import { Users, UserPlus, TrendingUp, Target, AlertCircle } from 'lucide-react';
import { useDashboardSummary } from '../../hooks/queries/useDashboardSummary';
import { Person } from '../../types';
import LineChart from '../charts/LineChart';
import { KPICardsSection, ProductivityTable } from '../shared';
import type { KPICard } from '../shared';
import { useGlobalFilter } from '../../context/GlobalFilterContext';
import { checkDateFilter, isSameMonth, isSameWeek, getFilterDateRange } from '../../utils/dateUtils';

const ConsolidatedAnalyticsPage: React.FC = () => {
    const { selectedOption, customRange, setCurrentPage, setLeader } = useGlobalFilter();
    const { start, end } = useMemo(() => getFilterDateRange(selectedOption, customRange), [selectedOption, customRange]);
    
    // Obtener métricas ligeras del Dashboard via RPC
    const { 
        data: analytics, 
        isLoading: loadingSummary, 
        error: errorSummary,
        refetch: refetchSummary
    } = useDashboardSummary(start, end);

    // LOG DE DEPURACIÓN
    React.useEffect(() => {
        if (analytics) {
            console.log('🔍 [DEBUG] Datos de Analytics recibidos:', {
                hasLeaderPerformance: !!analytics.leaderPerformance,
                leaderPerformanceCount: analytics.leaderPerformance?.length,
                dailyRegistrationsCount: analytics.dailyRegistrations?.length,
                firstLeader: analytics.leaderPerformance?.[0]
            });
        }
    }, [analytics]);

    const loading = loadingSummary;
    const error = errorSummary;

    const handleRefresh = () => {
        refetchSummary();
    };

    // Preparar la lista de líderes para la tabla a partir del resumen RPC
    const lideresData = useMemo(() => {
        if (!analytics) return [];
        
        const rawLeaders = analytics.leaderPerformance || (analytics as any).leader_performance;
        
        if (!rawLeaders || !Array.isArray(rawLeaders)) {
            return [];
        }

        return rawLeaders.map(lp => ({
            ...lp,
            id: lp.id && lp.id.toString().startsWith('lider-') ? lp.id : `lider-${lp.id}`,
            name: lp.nombre || lp.name,
            nombre: lp.nombre || lp.name,
            registeredCount: Number(lp.citizenCount || lp.registeredCount || 0),
            // Estas propiedades son las que usa ProductivityTable para mostrar las columnas
            metrics: {
                brigadistas: Number(lp.brigadierCount || 0),
                movilizadores: Number(lp.mobilizerCount || 0),
                ciudadanos: Number(lp.citizenCount || 0),
                total: Number(lp.citizenCount || 0),
                dia: Number(lp.todayCount || 0),
                semana: Number(lp.weekCount || 0),
                mes: Number(lp.monthCount || 0)
            }
        }));
    }, [analytics]);

    // Handle drill-down to brigadistas
    const handleLeaderClick = (leader: Person) => {
        setLeader(leader.id);
        setCurrentPage('brigadistas');
    };

    // Preparar datos filtrados para los gráficos (basado en el resumen ligero)
    const filteredRegistrations = useMemo(() => {
        if (!analytics) return { daily: [], weekly: [], monthly: [] };
        
        const daily = analytics.dailyRegistrations || (analytics as any).daily_registrations || [];

        // Filtro básico por fecha sobre los datos de tendencia del RPC
        if (selectedOption === 'total') {
            return {
                daily: daily,
                weekly: analytics.weeklyRegistrations || [],
                monthly: analytics.monthlyRegistrations || []
            };
        }
        
        try {
            if (selectedOption === 'month') {
                 return {
                     daily: daily.filter(r => isSameMonth(new Date(r.date || (r as any).date), new Date())),
                     weekly: [], 
                     monthly: []
                 };
            }
            
            if (selectedOption === 'week') {
                return {
                    daily: daily.filter(r => isSameWeek(new Date(r.date || (r as any).date), new Date())),
                    weekly: [],
                    monthly: []
                };
            }
            
            return {
                 daily: daily.filter(r => checkDateFilter(r.date || (r as any).date, selectedOption, customRange)),
                 weekly: [],
                 monthly: []
            };
        } catch (e) {
            console.error('Error al filtrar fechas en el gráfico:', e);
            return { daily: daily, weekly: [], monthly: [] };
        }
    }, [analytics, selectedOption, customRange]);

    // Handle loading state
    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-gray-600">Cargando analíticas optimizadas...</p>
                    <p className="text-xs text-gray-400 mt-2">Usando caché de IndexedDB</p>
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
                        <AlertCircle className="h-12 w-12 mx-auto" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Error al cargar datos</h3>
                    <p className="text-gray-600 mb-4">{error instanceof Error ? error.message : 'Error desconocido'}</p>
                    <button
                        onClick={handleRefresh}
                        className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-light"
                    >
                        Reintentar
                    </button>
                </div>
            </div>
        );
    }

    if (!analytics) return null;

    // Preparar tarjetas KPI (usando datos del RPC)
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

    const { goals } = analytics;

    return (
        <div className="space-y-6" data-testid="consolidated-analytics-page">
            {/* Main KPI Cards Section */}
            <KPICardsSection
                title="Métricas Principales (Resumen RPC)"
                cards={mainKPICards}
                loading={loading}
                gridCols={4}
            />

            {/* Meta General del Año */}
            {goals && goals.overallProgress && (
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
                </div>
            )}

            {/* Charts Section */}
            <div className="space-y-6">
                <div className="w-full bg-white p-4 rounded-lg shadow-md border border-gray-100" style={{ height: '500px', display: 'block' }}>
                    <LineChart
                        registrations={{
                            daily: filteredRegistrations.daily,
                            weekly: filteredRegistrations.weekly,
                            monthly: filteredRegistrations.monthly,
                        }}
                    />
                </div>
            </div>

            {/* Productivity Table - Ahora solo carga la lista de líderes */}
            <ProductivityTable
                role="lider"
                data={lideresData || []}
                loading={loading}
                onNameClick={handleLeaderClick}
            />
        </div>
    );
};

export default ConsolidatedAnalyticsPage;