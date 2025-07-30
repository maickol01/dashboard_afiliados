import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell, ResponsiveContainer } from 'recharts';
import { LeaderPerformanceData, Period } from '../../types';
import { TrendingUp, TrendingDown, Minus, Target, Users, UserCheck, Award } from 'lucide-react';

interface EnhancedLeaderPerformanceChartProps {
  data: LeaderPerformanceData[];
  title: string;
  period: Period;
}

// Memoized chart component to prevent unnecessary re-renders
const EnhancedLeaderPerformanceChart: React.FC<EnhancedLeaderPerformanceChartProps> = React.memo(({ 
  data, 
  title, 
  period 
}) => {
  // Memoized data validation to prevent recalculation on every render
  const validData = React.useMemo(() => {
    if (!Array.isArray(data)) {
      console.warn('EnhancedLeaderPerformanceChart: Invalid data type, expected array, got:', typeof data);
      return [];
    }
    
    return data.filter(item => {
      if (!item || typeof item !== 'object') {
        console.warn('EnhancedLeaderPerformanceChart: Invalid data item, expected object, got:', typeof item);
        return false;
      }
      
      if (typeof item.name !== 'string' || !item.name.trim()) {
        console.warn('EnhancedLeaderPerformanceChart: Invalid name, expected non-empty string, got:', typeof item.name);
        return false;
      }
      
      if (typeof item.citizenCount !== 'number' || isNaN(item.citizenCount) || item.citizenCount < 0) {
        console.warn('EnhancedLeaderPerformanceChart: Invalid citizenCount, expected non-negative number, got:', item.citizenCount);
        return false;
      }
      
      // Validate other required numeric fields
      const numericFields = ['brigadierCount', 'mobilizerCount', 'targetProgress', 'efficiency'];
      for (const field of numericFields) {
        if (typeof item[field as keyof typeof item] !== 'number' || isNaN(item[field as keyof typeof item] as number)) {
          console.warn(`EnhancedLeaderPerformanceChart: Invalid ${field}, expected number, got:`, typeof item[field as keyof typeof item]);
          return false;
        }
      }
      
      return true;
    });
  }, [data]);

  // Memoized sorted data to prevent re-sorting on every render
  const sortedData = React.useMemo(() => {
    return [...validData].sort((a, b) => b.citizenCount - a.citizenCount);
  }, [validData]);
  
  // Memoized chart data transformation to prevent object recreation
  const chartData = React.useMemo(() => {
    return sortedData.map((leader, index) => ({
    name: leader.name.length > 12 ? `${leader.name.substring(0, 12)}...` : leader.name,
    fullName: leader.name,
    ciudadanos: leader.citizenCount,
    brigadistas: leader.brigadierCount,
    movilizadores: leader.mobilizerCount,
    progreso: leader.targetProgress,
    eficiencia: leader.efficiency,
    tendencia: leader.trend,
    lastUpdate: leader.lastUpdate,
    rank: index + 1,
    totalNetwork: leader.brigadierCount + leader.mobilizerCount + leader.citizenCount,
    isTopPerformer: index < 3, // Top 3 performers
    goalStatus: leader.targetProgress >= 100 ? 'exceeded' : 
                leader.targetProgress >= 80 ? 'on-track' : 
                leader.targetProgress >= 50 ? 'behind' : 'critical'
  }));
  }, [sortedData]);

  // Early return for empty data after memoization
  if (validData.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
        <div className="h-[450px] flex items-center justify-center text-gray-500">
          No hay datos de rendimiento disponibles
        </div>
      </div>
    );
  }

  // Memoized color function with goal completion indicators
  const getBarColor = React.useCallback((_index: number, data: { progreso: number; goalStatus: string; isTopPerformer: boolean }) => {
    // Special highlighting for top performers
    if (data.isTopPerformer && data.progreso >= 100) return '#059669'; // Darker green for top performers who exceeded goals
    
    // Goal-based coloring
    if (data.progreso >= 100) return '#10B981'; // Green for goal exceeded
    if (data.progreso >= 80) return '#3B82F6'; // Blue for on-track
    if (data.progreso >= 50) return '#F59E0B'; // Yellow for behind
    return '#EF4444'; // Red for critical
  }, []);

  // Memoized period display text
  const getPeriodText = React.useCallback((period: Period): string => {
    switch (period) {
      case 'day': return 'Diario';
      case 'week': return 'Semanal';
      case 'month': return 'Mensual';
      default: return 'Diario';
    }
  }, []);

  // Memoized period text for current period
  const currentPeriodText = React.useMemo(() => getPeriodText(period), [getPeriodText, period]);

  // Enhanced custom tooltip component with detailed network breakdown
  interface TooltipPayload {
    payload: {
      fullName: string;
      ciudadanos: number;
      brigadistas: number;
      movilizadores: number;
      progreso: number;
      eficiencia: number;
      tendencia: 'up' | 'down' | 'stable';
      lastUpdate: Date;
      rank: number;
      totalNetwork: number;
      goalStatus: 'exceeded' | 'on-track' | 'behind' | 'critical';
    };
  }

  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: TooltipPayload[]; label?: string }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const periodLabel = period === 'day' ? 'hoy' : period === 'week' ? 'esta semana' : 'este mes';
      
      return (
        <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg max-w-xs">
          {/* Header with leader name and rank */}
          <div className="flex items-center justify-between mb-3">
            <p className="font-semibold text-gray-900">{data.fullName}</p>
            <div className="flex items-center">
              {data.rank <= 3 && <Award className="h-4 w-4 text-yellow-500 mr-1" />}
              <span className="text-xs bg-gray-100 px-2 py-1 rounded">#{data.rank}</span>
            </div>
          </div>
          
          {/* Network breakdown */}
          <div className="space-y-2 text-sm mb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Users className="h-4 w-4 text-blue-500 mr-2" />
                <span className="font-medium">Ciudadanos ({periodLabel}):</span>
              </div>
              <span className="font-semibold text-blue-600">{data.ciudadanos}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <UserCheck className="h-4 w-4 text-green-500 mr-2" />
                <span className="font-medium">Brigadistas:</span>
              </div>
              <span className="font-semibold text-green-600">{data.brigadistas}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Users className="h-4 w-4 text-purple-500 mr-2" />
                <span className="font-medium">Movilizadores:</span>
              </div>
              <span className="font-semibold text-purple-600">{data.movilizadores}</span>
            </div>
            <div className="border-t pt-2 mt-2">
              <div className="flex items-center justify-between">
                <span className="font-medium text-gray-700">Red Total:</span>
                <span className="font-semibold text-gray-900">{data.totalNetwork} personas</span>
              </div>
            </div>
          </div>

          {/* Performance metrics */}
          <div className="space-y-2 text-sm mb-3 border-t pt-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Target className="h-4 w-4 text-orange-500 mr-2" />
                <span className="font-medium">Progreso Meta:</span>
              </div>
              <span className={`font-semibold ${
                data.goalStatus === 'exceeded' ? 'text-green-600' :
                data.goalStatus === 'on-track' ? 'text-blue-600' :
                data.goalStatus === 'behind' ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {data.progreso.toFixed(1)}%
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-medium text-gray-700">Eficiencia:</span>
              <span className="font-semibold text-gray-900">{data.eficiencia.toFixed(2)}</span>
            </div>
          </div>

          {/* Trend and status */}
          <div className="flex items-center justify-between text-sm border-t pt-2">
            <div className="flex items-center">
              <span className="font-medium mr-2">Tendencia:</span>
              {data.tendencia === 'up' && <TrendingUp className="h-4 w-4 text-green-500" />}
              {data.tendencia === 'down' && <TrendingDown className="h-4 w-4 text-red-500" />}
              {data.tendencia === 'stable' && <Minus className="h-4 w-4 text-gray-500" />}
            </div>
            <div className={`px-2 py-1 rounded text-xs font-medium ${
              data.goalStatus === 'exceeded' ? 'bg-green-100 text-green-800' :
              data.goalStatus === 'on-track' ? 'bg-blue-100 text-blue-800' :
              data.goalStatus === 'behind' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
            }`}>
              {data.goalStatus === 'exceeded' ? 'Meta Superada' :
               data.goalStatus === 'on-track' ? 'En Camino' :
               data.goalStatus === 'behind' ? 'Rezagado' : 'Crítico'}
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      {/* Enhanced header with period indicator and performance summary */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <p className="text-sm text-gray-600 mt-1">
            Registros {currentPeriodText.toLowerCase()} • {data.length} líderes activos
          </p>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-500">Período: {currentPeriodText}</div>
          <div className="text-xs text-gray-400 mt-1">
            Actualizado: {new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      </div>
      
      {/* Enhanced legend with goal completion indicators */}
      <div className="flex flex-wrap gap-4 mb-4 text-xs">
        <div className="flex items-center">
          <div className="w-3 h-3 bg-green-500 rounded mr-1"></div>
          <span>Meta superada (≥100%)</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-blue-500 rounded mr-1"></div>
          <span>En camino (80-99%)</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-yellow-500 rounded mr-1"></div>
          <span>Rezagado (50-79%)</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-red-500 rounded mr-1"></div>
          <span>Crítico (&lt;50%)</span>
        </div>
        <div className="flex items-center ml-4">
          <Award className="h-3 w-3 text-yellow-500 mr-1" />
          <span>Top 3 performers</span>
        </div>
      </div>

      {/* Enhanced chart with better readability */}
      <div className="w-full h-[450px] sm:h-[500px] lg:h-[550px] overflow-x-auto">
        <ResponsiveContainer width="100%" height="100%" minWidth={Math.max(600, chartData.length * 60)}>
          <BarChart 
            data={chartData} 
            margin={{ top: 20, right: 30, left: 20, bottom: 90 }}
            barCategoryGap="15%"
          >
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey="name" 
            tick={{ fontSize: 10, fill: '#6B7280' }}
            angle={-45}
            textAnchor="end"
            height={90}
            interval={0}
            axisLine={{ stroke: '#E5E7EB' }}
            tickLine={{ stroke: '#E5E7EB' }}
          />
          <YAxis 
            tick={{ fontSize: 11, fill: '#6B7280' }}
            axisLine={{ stroke: '#E5E7EB' }}
            tickLine={{ stroke: '#E5E7EB' }}
            label={{ 
              value: `Ciudadanos (${currentPeriodText})`, 
              angle: -90, 
              position: 'insideLeft',
              style: { textAnchor: 'middle', fontSize: '12px', fill: '#6B7280' }
            }}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }} />
          <Legend 
            wrapperStyle={{ paddingTop: '20px' }}
            iconType="rect"
          />
          <Bar 
            dataKey="ciudadanos" 
            name={`Ciudadanos Registrados (${currentPeriodText})`}
            radius={[6, 6, 0, 0]}
            stroke="#ffffff"
            strokeWidth={1}
            isAnimationActive={false}
          >
            {chartData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={getBarColor(index, entry)}
                stroke={entry.isTopPerformer ? '#F59E0B' : '#ffffff'}
                strokeWidth={entry.isTopPerformer ? 2 : 1}
              />
            ))}
          </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Resumen compacto - solo métricas esenciales */}
      <div className="mt-4">
        {/* Métricas clave en una sola fila */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <div className="text-center p-2 bg-blue-50 rounded border border-blue-100">
            <div className="font-bold text-lg text-blue-600">
              {data.reduce((sum, leader) => sum + leader.citizenCount, 0)}
            </div>
            <div className="text-blue-700 text-xs">Total Ciudadanos</div>
          </div>
          <div className="text-center p-2 bg-green-50 rounded border border-green-100">
            <div className="font-bold text-lg text-green-600">
              {data.filter(l => l.targetProgress >= 100).length}
            </div>
            <div className="text-green-700 text-xs">Meta Superada</div>
          </div>
          <div className="text-center p-2 bg-yellow-50 rounded border border-yellow-100">
            <div className="font-bold text-lg text-yellow-600">
              {data.filter(l => l.targetProgress < 50).length}
            </div>
            <div className="text-yellow-700 text-xs">Necesitan Apoyo</div>
          </div>
          <div className="text-center p-2 bg-orange-50 rounded border border-orange-100">
            <div className="font-bold text-lg text-orange-600">
              {data.length > 0 ? (data.reduce((sum, leader) => sum + leader.targetProgress, 0) / data.length).toFixed(0) : 0}%
            </div>
            <div className="text-orange-700 text-xs">Progreso Promedio</div>
          </div>
        </div>

        {/* Top 3 performers compacto */}
        {sortedData.length > 0 && (
          <div className="mt-3 bg-gradient-to-r from-yellow-50 to-orange-50 p-3 rounded-lg border border-yellow-200">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <Award className="h-4 w-4 text-yellow-600 mr-1" />
                <span className="font-medium text-sm text-gray-900">Top 3 Performers</span>
              </div>
            </div>
            <div className="flex justify-between text-xs space-x-2">
              {sortedData.slice(0, 3).map((leader, index) => (
                <div key={leader.name} className="flex-1 bg-white p-2 rounded border text-center">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold mx-auto mb-1 ${
                    index === 0 ? 'bg-yellow-500 text-white' :
                    index === 1 ? 'bg-gray-400 text-white' :
                    'bg-orange-600 text-white'
                  }`}>
                    {index + 1}
                  </div>
                  <div className="font-medium text-xs truncate">{leader.name.length > 10 ? leader.name.substring(0, 10) + '...' : leader.name}</div>
                  <div className="font-semibold text-blue-600">{leader.citizenCount}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function for better memoization
  if (prevProps.title !== nextProps.title || prevProps.period !== nextProps.period) {
    return false;
  }
  
  if (prevProps.data.length !== nextProps.data.length) {
    return false;
  }
  
  // Deep comparison of data array - check key properties that affect rendering
  for (let i = 0; i < prevProps.data.length; i++) {
    const prev = prevProps.data[i];
    const next = nextProps.data[i];
    
    if (prev.name !== next.name || 
        prev.citizenCount !== next.citizenCount ||
        prev.brigadierCount !== next.brigadierCount ||
        prev.mobilizerCount !== next.mobilizerCount ||
        prev.targetProgress !== next.targetProgress ||
        prev.efficiency !== next.efficiency ||
        prev.trend !== next.trend) {
      return false;
    }
  }
  
  return true;
});

export default EnhancedLeaderPerformanceChart;