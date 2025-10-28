import React, { useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, ResponsiveContainer } from 'recharts';
import { Person, PerformancePeriod, PerformanceRole } from '../../types';
import { Users, UserCheck, Award, Target } from 'lucide-react';

interface EnhancedLeaderPerformanceChartProps {
  hierarchicalData: Person[];
  title: string;
}

const EnhancedLeaderPerformanceChart: React.FC<EnhancedLeaderPerformanceChartProps> = React.memo(({ 
  hierarchicalData,
  title
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState<PerformancePeriod>('all');
  const [selectedRole, setSelectedRole] = useState<PerformanceRole>('lider');

  const performanceData = useMemo(() => {
    const getDescendants = (person: Person) => {
        let brigadistas: Person[] = [];
        let movilizadores: Person[] = [];
        let ciudadanos: Person[] = [];

        if (person.role === 'lider') {
            brigadistas = person.children || [];
            movilizadores = brigadistas.flatMap(b => b.children || []);
            ciudadanos = movilizadores.flatMap(m => m.children || []);
        } else if (person.role === 'brigadista') {
            movilizadores = person.children || [];
            ciudadanos = movilizadores.flatMap(m => m.children || []);
        } else if (person.role === 'movilizador') {
            ciudadanos = person.children || [];
        }
        return { brigadistas, movilizadores, ciudadanos };
    };

    let startDate: Date | undefined;
    if (selectedPeriod !== 'all') {
        const now = new Date();
        if (selectedPeriod === 'day') {
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
        } else if (selectedPeriod === 'week') {
            const firstDayOfWeek = new Date(now);
            firstDayOfWeek.setDate(now.getDate() - now.getDay());
            startDate = new Date(firstDayOfWeek.getFullYear(), firstDayOfWeek.getMonth(), firstDayOfWeek.getDate(), 0, 0, 0, 0);
        } else { // month
            startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
        }
    }

    const filterFn = (p: Person) => {
        if (!startDate) return true;
        const d = new Date(p.created_at);
        return d >= startDate;
    };

    let peopleToList: Person[] = [];
    if (selectedRole === 'lider') {
        peopleToList = hierarchicalData;
    } else if (selectedRole === 'brigadista') {
        peopleToList = hierarchicalData.flatMap(l => l.children || []);
    } else { // mobilizer
        peopleToList = hierarchicalData.flatMap(l => l.children || []).flatMap(b => b.children || []);
    }

    return peopleToList.map(person => {
        const { brigadistas, movilizadores, ciudadanos } = getDescendants(person);

        const totalCitizens = ciudadanos.length;
        const target = selectedRole === 'lider' ? 50 : selectedRole === 'brigadista' ? 25 : 10;

        return {
            name: person.name,
            citizenCount: ciudadanos.filter(filterFn).length,
            brigadierCount: selectedRole === 'lider' ? brigadistas.filter(filterFn).length : 0,
            mobilizerCount: selectedRole === 'lider' || selectedRole === 'brigadista' ? movilizadores.filter(filterFn).length : 0,
            totalNetwork: totalCitizens + (person.role === 'lider' ? movilizadores.length + brigadistas.length : (person.role === 'brigadista' ? movilizadores.length : 0)),
            targetProgress: totalCitizens > 0 ? (totalCitizens / target) * 100 : 0,
        };
    });
  }, [hierarchicalData, selectedPeriod, selectedRole]);

  const sortedData = React.useMemo(() => {
    return [...performanceData].sort((a, b) => b.citizenCount - a.citizenCount);
  }, [performanceData]);
  
  const chartData = React.useMemo(() => {
    return sortedData.map((person, index) => ({
      name: person.name.length > 12 ? `${person.name.substring(0, 12)}...` : person.name,
      fullName: person.name,
      ciudadanos: person.citizenCount,
      brigadistas: person.brigadierCount,
      movilizadores: person.mobilizerCount,
      totalNetwork: person.totalNetwork,
      progreso: person.targetProgress,
      rank: index + 1,
      isTopPerformer: index < 3,
    }));
  }, [sortedData]);

  if (chartData.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
        <div className="h-[550px] flex items-center justify-center text-gray-500">
          No hay datos de rendimiento disponibles para la selección actual.
        </div>
      </div>
    );
  }

  const getBarColor = (index: number) => {
    if (index < 3) return '#10B981';
    return '#3B82F6';
  };

  const getPeriodText = (period: PerformancePeriod): string => {
    switch (period) {
      case 'day': return 'Diario';
      case 'week': return 'Semanal';
      case 'month': return 'Mensual';
      case 'all': return 'Todos';
      default: return 'Todos';
    }
  };

  const getRoleText = (role: PerformanceRole): string => {
    switch (role) {
      case 'lider': return 'Líderes';
      case 'brigadista': return 'Brigadistas';
      case 'movilizador': return 'Movilizadores';
      default: return 'Líderes';
    }
  };

  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: any[]; label?: string }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const periodLabel = selectedPeriod === 'all' ? 'Total' : 'Nuevos';
      
      return (
        <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg max-w-xs">
          <div className="flex items-center justify-between mb-3">
            <p className="font-semibold text-gray-900">{data.fullName}</p>
            <div className="flex items-center">
              {data.rank <= 3 && <Award className="h-4 w-4 text-yellow-500 mr-1" />}
              <span className="text-xs bg-gray-100 px-2 py-1 rounded">#{data.rank}</span>
            </div>
          </div>
          
          <div className="space-y-2 text-sm mb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Users className="h-4 w-4 text-blue-500 mr-2" />
                <span className="font-medium">{periodLabel} Ciudadanos:</span>
              </div>
              <span className="font-semibold text-blue-600">{data.ciudadanos}</span>
            </div>
            {selectedRole === 'lider' && (
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <UserCheck className="h-4 w-4 text-green-500 mr-2" />
                  <span className="font-medium">{periodLabel} Brigadistas:</span>
                </div>
                <span className="font-semibold text-green-600">{data.brigadistas}</span>
              </div>
            )}
            {(selectedRole === 'lider' || selectedRole === 'brigadista') && (
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Users className="h-4 w-4 text-purple-500 mr-2" />
                  <span className="font-medium">{periodLabel} Movilizadores:</span>
                </div>
                <span className="font-semibold text-purple-600">{data.movilizadores}</span>
              </div>
            )}
            <div className="border-t pt-2 mt-2">
              <div className="flex items-center justify-between">
                <span className="font-medium text-gray-700">Red Total:</span>
                <span className="font-semibold text-gray-900">{data.totalNetwork} personas</span>
              </div>
            </div>
          </div>

          <div className="space-y-2 text-sm mb-3 border-t pt-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Target className="h-4 w-4 text-orange-500 mr-2" />
                <span className="font-medium">Progreso Meta:</span>
              </div>
              <span className="font-semibold text-green-600">{data.progreso.toFixed(1)}%</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{`${title} de ${getRoleText(selectedRole)}`}</h3>
        <div className="flex space-x-4 mt-2 sm:mt-0">
          <div className="flex rounded-md shadow-xs">
            {(['lider', 'brigadista', 'movilizador'] as PerformanceRole[]).map((role) => (
              <button
                key={role}
                onClick={() => setSelectedRole(role)}
                className={`px-4 py-2 text-sm font-medium border ${
                  selectedRole === role
                    ? 'bg-secondary text-white border-secondary'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                } ${role === 'lider' ? 'rounded-l-md' : role === 'movilizador' ? 'rounded-r-md' : 'border-l-0'}`}
              >
                {getRoleText(role)}
              </button>
            ))}
          </div>
          <div className="flex rounded-md shadow-xs">
            {(['all', 'month', 'week', 'day'] as PerformancePeriod[]).map((period) => (
              <button
                key={period}
                onClick={() => setSelectedPeriod(period)}
                className={`px-4 py-2 text-sm font-medium border ${
                  selectedPeriod === period
                    ? 'bg-primary text-white border-primary'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                } ${period === 'all' ? 'rounded-l-md' : period === 'day' ? 'rounded-r-md' : 'border-l-0'}`}
              >
                {getPeriodText(period)}
              </button>
            ))}
          </div>
        </div>
      </div>
      
      <div className="w-full h-[600px] overflow-x-auto">
        <ResponsiveContainer width="100%" height="100%" debounce={200} minWidth={Math.max(600, chartData.length * 60)}>
          <BarChart 
            data={chartData} 
            margin={{ top: 5, right: 20, left: -10, bottom: 90 }}
            barCategoryGap="20%"
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
            <XAxis 
              dataKey="name" 
              tick={{ fontSize: 11, fill: '#6B7280' }}
              angle={-45}
              textAnchor="end"
              height={100}
              interval={0}
              axisLine={{ stroke: '#E5E7EB' }}
              tickLine={{ stroke: '#E5E7EB' }}
            />
            <YAxis 
              tick={{ fontSize: 11, fill: '#6B7280' }}
              axisLine={{ stroke: '#E5E7EB' }}
              tickLine={{ stroke: '#E5E7EB' }}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }} isAnimationActive={false} />
            <Bar 
              dataKey="ciudadanos" 
              radius={[6, 6, 0, 0]}
              isAnimationActive={false}
              animationDuration={0}
            >
              {chartData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={getBarColor(index)}
                  stroke={entry.isTopPerformer ? '#F59E0B' : '#ffffff'}
                  strokeWidth={entry.isTopPerformer ? 2 : 1}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
});

export default EnhancedLeaderPerformanceChart;
