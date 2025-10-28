import React, { useState, useMemo, useEffect, useRef } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Person, Period } from '../../types';
import { ChevronDown } from 'lucide-react';

interface LeaderPerformanceLineChartProps {
  hierarchicalData: Person[];
}

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#E63946', '#F1FAEE', '#A8DADC', '#457B9D', '#1D3557'];

const LeaderPerformanceLineChart: React.FC<LeaderPerformanceLineChartProps> = ({ hierarchicalData }) => {
  const [period, setPeriod] = useState<Period>('day');
  const [isDropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const title = `Progreso Acumulado de Líderes por ${period === 'day' ? 'Día' : period === 'week' ? 'Semana' : 'Mes'}`;

  const { chartData, leaderOptions } = useMemo(() => {
    if (!hierarchicalData || hierarchicalData.length === 0) {
      return { chartData: [], leaderOptions: [] };
    }

    const leaderCitizenMap = new Map<string, { name: string; citizens: { created_at: Date }[] }>();

    hierarchicalData.forEach(leader => {
      const citizensList: { created_at: Date }[] = [];
      const collectCitizens = (person: Person) => {
        if (person.role === 'ciudadano') {
          citizensList.push({ created_at: new Date(person.created_at) });
        } else if (person.children) {
          person.children.forEach(collectCitizens);
        }
      };
      collectCitizens(leader);
      leaderCitizenMap.set(leader.id, { name: leader.name, citizens: citizensList });
    });

    const allLeaders = Array.from(leaderCitizenMap.entries()).map(([id, data]) => ({ id, name: data.name, total: data.citizens.length }));
    allLeaders.sort((a, b) => b.total - a.total);
    const leaderOptions = allLeaders.map(l => ({ id: l.id, name: l.name }));

    const aggregatedData = new Map<string, { [leaderId: string]: number }>();

    leaderCitizenMap.forEach((data, leaderId) => {
      data.citizens.forEach(citizen => {
        const d = new Date(citizen.created_at);
        let dateKey: string;

        if (period === 'day') {
          dateKey = d.toISOString().split('T')[0];
        } else if (period === 'week') {
          const day = d.getDay();
          const diff = d.getDate() - day + (day === 0 ? -6 : 1);
          const weekStart = new Date(d.getFullYear(), d.getMonth(), diff);
          dateKey = weekStart.toISOString().split('T')[0];
        } else { // month
          dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        }

        if (!aggregatedData.has(dateKey)) {
          aggregatedData.set(dateKey, {});
        }
        const periodData = aggregatedData.get(dateKey)!;
        periodData[leaderId] = (periodData[leaderId] || 0) + 1;
      });
    });

    const sortedDates = Array.from(aggregatedData.keys()).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
    
    const cumulativeCounts = new Map<string, number>();
    leaderOptions.forEach(l => cumulativeCounts.set(l.id, 0));

    const chartData = sortedDates.map(date => {
      const row: { [key: string]: any } = { date };
      const periodCounts = aggregatedData.get(date) || {};

      leaderOptions.forEach(leader => {
        const leaderId = leader.id;
        const leaderName = leader.name;

        const currentPeriodCount = periodCounts[leaderId] || 0;
        const newCumulative = (cumulativeCounts.get(leaderId) || 0) + currentPeriodCount;
        
        row[leaderName] = newCumulative;
        cumulativeCounts.set(leaderId, newCumulative);
      });

      return row;
    });

    return { chartData, leaderOptions };
  }, [hierarchicalData, period]);

  const [selectedLeaders, setSelectedLeaders] = useState<string[]>(() => 
    leaderOptions.slice(0, 5).map(l => l.name)
  );

  const leaderNamesKey = useMemo(() => leaderOptions.map(l => l.id).join(','), [leaderOptions]);
  useEffect(() => {
    setSelectedLeaders(leaderOptions.slice(0, 5).map(l => l.name));
  }, [leaderNamesKey, period]);


  const handleSelectionChange = (leaderName: string) => {
    setSelectedLeaders(prev => 
      prev.includes(leaderName) 
        ? prev.filter(l => l !== leaderName)
        : [...prev, leaderName]
    );
  };

  const handleSelectAll = () => {
    if (selectedLeaders.length === leaderOptions.length) {
      setSelectedLeaders([]);
    } else {
      setSelectedLeaders(leaderOptions.map(l => l.name));
    }
  };

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
          No hay datos de rendimiento de líderes para el período seleccionado.
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <div className="flex items-center space-x-4 mt-2 sm:mt-0">
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

          <div className="relative" ref={dropdownRef}>
            <button onClick={() => setDropdownOpen(!isDropdownOpen)} className="flex items-center justify-between w-64 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
              Seleccionar Líderes ({selectedLeaders.length})
              <ChevronDown className="w-5 h-5 ml-2 -mr-1" />
            </button>
            {isDropdownOpen && (
              <div className="absolute z-10 w-64 mt-2 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                <ul className="py-1">
                  <li>
                    <label className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer">
                      <input type="checkbox"
                        onChange={handleSelectAll}
                        checked={selectedLeaders.length === leaderOptions.length && leaderOptions.length > 0}
                        className="mr-2"
                      />
                      Seleccionar Todos
                    </label>
                  </li>
                  {leaderOptions.map(leader => (
                    <li key={leader.id}>
                      <label className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer">
                        <input type="checkbox"
                          value={leader.name}
                          checked={selectedLeaders.includes(leader.name)}
                          onChange={() => handleSelectionChange(leader.name)}
                          className="mr-2"
                        />
                        {leader.name}
                      </label>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="w-full h-[400px]">
        <ResponsiveContainer width="100%" height="100%" debounce={200}>
          <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip isAnimationActive={false} />
            <Legend />
            <ReferenceLine y={500} label="Meta" stroke="red" strokeDasharray="3 3" />
            {leaderOptions.map((leader, index) => (
              <Line 
                key={leader.id}
                type="monotone" 
                dataKey={leader.name} 
                stroke={COLORS[index % COLORS.length]} 
                strokeWidth={2}
                hide={!selectedLeaders.includes(leader.name)}
                connectNulls={true}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

const MemoizedLeaderPerformanceLineChart = React.memo(LeaderPerformanceLineChart, (prevProps, nextProps) => {
  if (prevProps.hierarchicalData.length !== nextProps.hierarchicalData.length) {
    return false;
  }

  const prevDataSignature = prevProps.hierarchicalData.map(p => `${p.id}-${p.children?.length || 0}`).join(',');
  const nextDataSignature = nextProps.hierarchicalData.map(p => `${p.id}-${p.children?.length || 0}`).join(',');

  return prevDataSignature === nextDataSignature; 
});

export default MemoizedLeaderPerformanceLineChart;
