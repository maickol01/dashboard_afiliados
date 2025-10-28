import React, { useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Period } from '../../types';

interface RegistrationsData {
  daily: { date: string; count: number }[];
  weekly: { date: string; count: number }[];
  monthly: { date: string; count: number }[];
}

interface LineChartProps {
  registrations: RegistrationsData;
}

const CustomLineChartComponent: React.FC<LineChartProps> = ({ registrations }) => {
  const [period, setPeriod] = useState<Period>('day');

  const chartData = useMemo(() => {
    switch(period) {
        case 'day': return registrations.daily;
        case 'week': return registrations.weekly;
        case 'month': return registrations.monthly;
        default: return registrations.daily;
    }
  }, [period, registrations]);

  const title = `Ciudadanos Registrados por ${period === 'day' ? 'Día' : period === 'week' ? 'Semana' : 'Mes'}`;

  const headerControls = (
    <div className="flex rounded-md shadow-xs">
      {(['day', 'week', 'month'] as Period[]).map((p) => (
        <button
          key={p}
          onClick={() => setPeriod(p)}
          className={`px-4 py-2 text-sm font-medium border ${period === p
            ? 'bg-primary text-white border-primary'
            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            } ${p === 'day' ? 'rounded-l-md' :
              p === 'month' ? 'rounded-r-md' :
                'border-l-0'
            }`}>
          {p === 'day' ? 'Día' : p === 'week' ? 'Semana' : 'Mes'}
        </button>
      ))}
    </div>
  );

  if (!chartData || chartData.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <div className="mt-2 sm:mt-0">{headerControls}</div>
        </div>
        <div className="h-[300px] flex items-center justify-center text-gray-500">
          No hay datos disponibles para mostrar
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <div className="mt-2 sm:mt-0">{headerControls}</div>
      </div>
      <div className="w-full h-[300px] sm:h-[350px] lg:h-[400px]">
        <ResponsiveContainer width="100%" height="100%" debounce={200}>
          <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 12 }}
              angle={-45}
              textAnchor="end"
              height={80}
              interval="preserveStartEnd"
            />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip 
              isAnimationActive={false}
              contentStyle={{ 
                backgroundColor: '#f9fafb', 
                border: '1px solid #e5e7eb',
                borderRadius: '8px'
              }}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="count" 
              stroke="#235B4E" 
              strokeWidth={2}
              name="Registrados"
              dot={{ fill: '#235B4E', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, fill: '#9F2241' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

const CustomLineChart = React.memo(CustomLineChartComponent, (prevProps, nextProps) => {
  const prevReg = prevProps.registrations;
  const nextReg = nextProps.registrations;

  if (
    prevReg.daily.length !== nextReg.daily.length ||
    prevReg.weekly.length !== nextReg.weekly.length ||
    prevReg.monthly.length !== nextReg.monthly.length
  ) {
    return false; // Re-render if lengths differ
  }

  // As a quick but effective check, compare the total count of daily registrations.
  const prevTotal = prevReg.daily.reduce((sum, item) => sum + item.count, 0);
  const nextTotal = nextReg.daily.reduce((sum, item) => sum + item.count, 0);

  return prevTotal === nextTotal; // If totals are the same, prevent re-render
});

export default CustomLineChart;