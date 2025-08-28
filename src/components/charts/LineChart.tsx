import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface LineChartProps {
  data: { date: string; count: number }[];
  title: string;
}

// Memoized chart component to prevent unnecessary re-renders
const CustomLineChart: React.FC<LineChartProps> = React.memo(({ data, title }) => {
  // Memoized data validation to prevent recalculation on every render
  const validData = React.useMemo(() => {
    if (!Array.isArray(data)) {
      console.warn('LineChart: Invalid data type, expected array, got:', typeof data);
      return [];
    }
    
    return data.filter(item => {
      if (!item || typeof item !== 'object') {
        console.warn('LineChart: Invalid data item, expected object, got:', typeof item);
        return false;
      }
      
      if (typeof item.date !== 'string' || !item.date.trim()) {
        console.warn('LineChart: Invalid date, expected non-empty string, got:', typeof item.date);
        return false;
      }
      
      if (typeof item.count !== 'number' || isNaN(item.count) || item.count < 0) {
        console.warn('LineChart: Invalid count, expected non-negative number, got:', item.count);
        return false;
      }
      
      return true;
    });
  }, [data]);

  if (validData.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
        <div className="h-[300px] flex items-center justify-center text-gray-500">
          No hay datos disponibles para mostrar
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      <div className="w-full h-[300px] sm:h-[350px] lg:h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={validData} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
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
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function for better memoization
  if (prevProps.title !== nextProps.title) return false;
  if (prevProps.data.length !== nextProps.data.length) return false;
  
  // Deep comparison of data array
  for (let i = 0; i < prevProps.data.length; i++) {
    if (prevProps.data[i].date !== nextProps.data[i].date || 
        prevProps.data[i].count !== nextProps.data[i].count) {
      return false;
    }
  }
  
  return true;
});

export default CustomLineChart;