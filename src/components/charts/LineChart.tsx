import React, { useState, useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Brush } from 'recharts';
import { Period } from '../../types';
import { Calendar, TrendingUp } from 'lucide-react';

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
    switch (period) {
      case 'day': return registrations.daily;
      case 'week': return registrations.weekly;
      case 'month': return registrations.monthly;
      default: return registrations.daily;
    }
  }, [period, registrations]);

  const title = `Ciudadanos Registrados`;
  const subtitle = period === 'day' ? 'Por Día' : period === 'week' ? 'Por Semana' : 'Por Mes';

  // Calculate total for the current view to show as a summary
  const totalInView = useMemo(() => {
    return chartData.reduce((acc, curr) => acc + curr.count, 0);
  }, [chartData]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 border border-gray-100 shadow-xl rounded-xl">
          <p className="text-sm text-gray-500 mb-1">{label}</p>
          <p className="text-lg font-bold text-primary flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary"></span>
            {payload[0].value}
            <span className="text-xs font-normal text-gray-400">registros</span>
          </p>
        </div>
      );
    }
    return null;
  };

  const headerControls = (
    <div className="flex bg-gray-100 p-1 rounded-lg">
      {(['day', 'week', 'month'] as Period[]).map((p) => (
        <button
          key={p}
          onClick={() => setPeriod(p)}
          className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all duration-200 ${period === p
            ? 'bg-white text-primary shadow-sm'
            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
            }`}>
          {p === 'day' ? 'Día' : p === 'week' ? 'Semana' : 'Mes'}
        </button>
      ))}
    </div>
  );

  if (!chartData || chartData.length === 0) {
    return (
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h3 className="text-xl font-bold text-gray-900">{title}</h3>
            <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
          </div>
          <div className="mt-4 sm:mt-0">{headerControls}</div>
        </div>
        <div className="h-[350px] flex flex-col items-center justify-center text-gray-400 bg-gray-50/50 rounded-xl border-2 border-dashed border-gray-200">
          <Calendar className="w-12 h-12 mb-3 opacity-20" />
          <p>No hay datos disponibles para este periodo</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 transition-all duration-300 hover:shadow-md">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-primary/10 rounded-xl">
            <TrendingUp className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">{title}</h3>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-sm text-gray-500">{subtitle}</p>
              <span className="text-gray-300">•</span>
              <p className="text-lg font-bold text-primary">
                {totalInView.toLocaleString()} total
              </p>
            </div>
          </div>
        </div>
        <div className="mt-4 sm:mt-0">{headerControls}</div>
      </div>

      <div className="w-full h-[400px]" style={{ minHeight: '400px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#235B4E" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#235B4E" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#9CA3AF', fontSize: 12 }}
              dy={10}
              minTickGap={30}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#9CA3AF', fontSize: 12 }}
              dx={-10}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="count"
              stroke="#235B4E"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#colorCount)"
              activeDot={{ r: 6, strokeWidth: 0, fill: '#235B4E' }}
            />
            <Brush
              dataKey="date"
              height={30}
              stroke="#235B4E"
              fill="#f9fafb"
              tickFormatter={(value) => ''}
            />
          </AreaChart>
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
    return false;
  }

  const prevTotal = prevReg.daily.reduce((sum, item) => sum + item.count, 0);
  const nextTotal = nextReg.daily.reduce((sum, item) => sum + item.count, 0);

  return prevTotal === nextTotal;
});

export default CustomLineChart;