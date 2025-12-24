import React, { useState, useMemo, useEffect, useRef } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine, Brush } from 'recharts';
import { Person, Period } from '../../types';
import { ChevronDown, Search } from 'lucide-react';

interface BrigadierPerformanceLineChartProps {
  hierarchicalData: Person[];
}

const COLORS = [
  '#3b82f6', // blue-500
  '#10b981', // emerald-500
  '#f59e0b', // amber-500
  '#ef4444', // red-500
  '#8b5cf6', // violet-500
  '#ec4899', // pink-500
  '#06b6d4', // cyan-500
  '#f97316', // orange-500
];

const BrigadierPerformanceLineChart: React.FC<BrigadierPerformanceLineChartProps> = ({ hierarchicalData }) => {
  const [period, setPeriod] = useState<Period>('day');
  const [isDropdownOpen, setDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const title = `Progreso Acumulado de Brigadistas por ${period === 'day' ? 'Día' : period === 'week' ? 'Semana' : 'Mes'}`;

  const { chartData, brigadistaOptions } = useMemo(() => {
    if (!hierarchicalData || hierarchicalData.length === 0) {
      return { chartData: [], brigadistaOptions: [] };
    }

    const brigadistaCitizenMap = new Map<string, { name: string; citizens: { created_at: Date }[] }>();
    hierarchicalData.forEach(leader => {
      leader.children?.forEach(brigadista => {
        if (brigadista.role === 'brigadista') {
          if (!brigadistaCitizenMap.has(brigadista.id)) {
            brigadistaCitizenMap.set(brigadista.id, { name: brigadista.name, citizens: [] });
          }
          const currentBrigadista = brigadistaCitizenMap.get(brigadista.id)!;
          brigadista.children?.forEach(movilizador => {
            movilizador.children?.forEach(citizen => {
              currentBrigadista.citizens.push({ created_at: new Date(citizen.created_at) });
            });
          });
        }
      });
    });

    const allBrigadistas = Array.from(brigadistaCitizenMap.entries()).map(([id, data]) => ({ id, name: data.name, total: data.citizens.length }));
    allBrigadistas.sort((a, b) => b.total - a.total);
    const brigadistaOptions = allBrigadistas.map(b => ({ id: b.id, name: b.name }));

    const aggregatedData = new Map<string, { [brigadistaId: string]: number }>();

    brigadistaCitizenMap.forEach((data, brigadistaId) => {
      data.citizens.forEach(citizen => {
        const d = new Date(citizen.created_at);
        let dateKey: string;

        if (period === 'day') {
          dateKey = d.toISOString().split('T')[0];
        } else if (period === 'week') {
          const day = d.getDay();
          const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Sunday
          const weekStart = new Date(d.getFullYear(), d.getMonth(), diff);
          dateKey = weekStart.toISOString().split('T')[0];
        } else { // month
          dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        }

        if (!aggregatedData.has(dateKey)) {
          aggregatedData.set(dateKey, {});
        }
        const periodData = aggregatedData.get(dateKey)!;
        periodData[brigadistaId] = (periodData[brigadistaId] || 0) + 1;
      });
    });

    const sortedDates = Array.from(aggregatedData.keys()).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

    const cumulativeCounts = new Map<string, number>();
    brigadistaOptions.forEach(b => cumulativeCounts.set(b.id, 0));

    const chartData = sortedDates.map(date => {
      const row: { [key: string]: any } = { date };
      const periodCounts = aggregatedData.get(date) || {};

      brigadistaOptions.forEach(brigadista => {
        const brigadistaId = brigadista.id;
        const brigadistaName = brigadista.name;

        const currentPeriodCount = periodCounts[brigadistaId] || 0;
        const newCumulative = (cumulativeCounts.get(brigadistaId) || 0) + currentPeriodCount;

        row[brigadistaName] = newCumulative;
        cumulativeCounts.set(brigadistaId, newCumulative);
      });

      return row;
    });

    return { chartData, brigadistaOptions };
  }, [hierarchicalData, period]);

  const [selectedBrigadistas, setSelectedBrigadistas] = useState<string[]>(() =>
    brigadistaOptions.slice(0, 5).map(b => b.name)
  );

  const brigadistaNamesKey = useMemo(() => brigadistaOptions.map(b => b.id).join(','), [brigadistaOptions]);
  useEffect(() => {
    // Set default selection only when the list of brigadistas or the period changes.
    // This prevents resetting user selection on every data refresh.
    setSelectedBrigadistas(brigadistaOptions.slice(0, 5).map(b => b.name));
  }, [brigadistaNamesKey, period]);


  const handleSelectionChange = (brigadistaName: string) => {
    setSelectedBrigadistas(prev =>
      prev.includes(brigadistaName)
        ? prev.filter(b => b !== brigadistaName)
        : [...prev, brigadistaName]
    );
  };

  const handleSelectAll = () => {
    if (selectedBrigadistas.length === brigadistaOptions.length) {
      setSelectedBrigadistas([]);
    } else {
      setSelectedBrigadistas(brigadistaOptions.map(b => b.name));
    }
  };

  const handleTop5 = () => {
    setSelectedBrigadistas(brigadistaOptions.slice(0, 5).map(b => b.name));
  };

  const filteredOptions = brigadistaOptions.filter(b =>
    b.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (chartData.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
        <div className="h-[400px] flex items-center justify-center text-gray-500">
          No hay datos de rendimiento de brigadistas para el período seleccionado.
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <div className="flex items-center space-x-4 mt-2 sm:mt-0">
          {/* Period Selector */}
          <div className="flex rounded-md shadow-xs">
            {(['day', 'week', 'month'] as Period[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-2 text-sm font-medium border ${period === p ? 'bg-primary text-white border-primary' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'} ${p === 'day' ? 'rounded-l-md' : p === 'month' ? 'rounded-r-md' : 'border-l-0'}`}
              >
                {p === 'day' ? 'Día' : p === 'week' ? 'Semana' : 'Mes'}
              </button>
            ))}
          </div>

          {/* Brigadista Selector */}
          <div className="relative" ref={dropdownRef}>
            <button onClick={() => setDropdownOpen(!isDropdownOpen)} className="flex items-center justify-between w-64 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
              Seleccionar Brigadistas ({selectedBrigadistas.length})
              <ChevronDown className="w-5 h-5 ml-2 -mr-1" />
            </button>
            {isDropdownOpen && (
              <div className="absolute z-10 w-72 mt-2 bg-white border border-gray-200 rounded-md shadow-lg max-h-96 overflow-hidden flex flex-col">
                <div className="p-2 border-b border-gray-200 space-y-2">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Buscar brigadista..."
                      className="w-full pl-8 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={handleTop5}
                      className="flex-1 px-2 py-1 text-xs font-medium text-primary bg-primary-50 rounded hover:bg-primary-100"
                    >
                      Top 5
                    </button>
                    <button
                      onClick={() => setSelectedBrigadistas([])}
                      className="flex-1 px-2 py-1 text-xs font-medium text-gray-600 bg-gray-100 rounded hover:bg-gray-200"
                    >
                      Limpiar
                    </button>
                  </div>
                </div>
                <div className="overflow-y-auto flex-1">
                  <ul className="py-1">
                    <li>
                      <label className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer">
                        <input type="checkbox"
                          onChange={handleSelectAll}
                          checked={selectedBrigadistas.length === brigadistaOptions.length && brigadistaOptions.length > 0}
                          className="mr-2 rounded text-primary focus:ring-primary"
                        />
                        <span className="font-medium">Seleccionar Todos</span>
                      </label>
                    </li>
                    {filteredOptions.map(brigadista => (
                      <li key={brigadista.id}>
                        <label className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer">
                          <input type="checkbox"
                            value={brigadista.name}
                            checked={selectedBrigadistas.includes(brigadista.name)}
                            onChange={() => handleSelectionChange(brigadista.name)}
                            className="mr-2 rounded text-primary focus:ring-primary"
                          />
                          {brigadista.name}
                        </label>
                      </li>
                    ))}
                    {filteredOptions.length === 0 && (
                      <li className="px-4 py-2 text-sm text-gray-500 text-center">
                        No se encontraron resultados
                      </li>
                    )}
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="w-full h-[400px]">
        <ResponsiveContainer width="100%" height="100%" debounce={200}>
          <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <defs>
              {brigadistaOptions.map((brigadista, index) => (
                <linearGradient key={`gradient-${brigadista.id}`} id={`gradient-${brigadista.id}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLORS[index % COLORS.length]} stopOpacity={0.8} />
                  <stop offset="95%" stopColor={COLORS[index % COLORS.length]} stopOpacity={0} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#6b7280', fontSize: 12 }}
              dy={10}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#6b7280', fontSize: 12 }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#fff',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                border: 'none'
              }}
              itemStyle={{ color: '#374151' }}
            />
            <Legend wrapperStyle={{ paddingTop: '20px' }} />
            <ReferenceLine y={500} label="Meta" stroke="#ef4444" strokeDasharray="3 3" />
            {brigadistaOptions.map((brigadista, index) => (
              <Area
                key={brigadista.id}
                type="monotone"
                dataKey={brigadista.name}
                stroke={COLORS[index % COLORS.length]}
                fillOpacity={1}
                fill={`url(#gradient-${brigadista.id})`}
                strokeWidth={2}
                hide={!selectedBrigadistas.includes(brigadista.name)}
                connectNulls={true}
                activeDot={{ r: 6, strokeWidth: 0 }}
              />
            ))}
            <Brush
              dataKey="date"
              height={30}
              stroke="#8884d8"
              tickFormatter={(value) => {
                const date = new Date(value);
                return period === 'month'
                  ? date.toLocaleDateString('es-ES', { month: 'short' })
                  : date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' });
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

const MemoizedBrigadierPerformanceLineChart = React.memo(BrigadierPerformanceLineChart, (prevProps, nextProps) => {
  if (prevProps.hierarchicalData.length !== nextProps.hierarchicalData.length) {
    return false;
  }

  const prevDataSignature = prevProps.hierarchicalData.map(p => `${p.id}-${p.children?.length || 0}`).join(',');
  const nextDataSignature = nextProps.hierarchicalData.map(p => `${p.id}-${p.children?.length || 0}`).join(',');

  return prevDataSignature === nextDataSignature;
});

export default MemoizedBrigadierPerformanceLineChart;
