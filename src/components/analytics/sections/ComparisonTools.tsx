import React, { useState } from 'react';
import { Calendar, BarChart3, TrendingUp, Users } from 'lucide-react';
import { Analytics } from '../../../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';

interface ComparisonToolsProps {
  analytics: Analytics;
}
export type ComparisonType = 'periods' | 'regions' | 'leaders' | 'cohorts';

const ComparisonTools: React.FC<ComparisonToolsProps> = ({ analytics }) => {
  const [selectedComparison, setSelectedComparison] = useState<'periods' | 'regions' | 'leaders' | 'cohorts'>('periods');
  const [period1, setPeriod1] = useState<string>('current-month');
  const [period2, setPeriod2] = useState<string>('previous-month');

  // Datos simulados para comparaciones
  const periodComparisons = {
    'current-month': { registrations: 450, leaders: 10, conversion: 85.5 },
    'previous-month': { registrations: 380, leaders: 9, conversion: 78.2 },
    'current-quarter': { registrations: 1250, leaders: 10, conversion: 82.1 },
    'previous-quarter': { registrations: 1100, leaders: 8, conversion: 75.8 },
    'current-year': { registrations: 4200, leaders: 10, conversion: 80.3 },
    'previous-year': { registrations: 3800, leaders: 7, conversion: 72.5 },
  };

  const regionComparisons = analytics.geographic.regionDistribution.map(region => ({
    ...region,
    previousCount: Math.floor(region.count * (0.8 + Math.random() * 0.4)),
    growth: ((region.count - Math.floor(region.count * (0.8 + Math.random() * 0.4))) / Math.floor(region.count * (0.8 + Math.random() * 0.4))) * 100,
  }));

  const leaderComparisons = analytics.leaderPerformance.map(leader => ({
    ...leader,
    previousRegistered: Math.floor(leader.registered * (0.7 + Math.random() * 0.6)),
    growth: ((leader.registered - Math.floor(leader.registered * (0.7 + Math.random() * 0.6))) / Math.floor(leader.registered * (0.7 + Math.random() * 0.6))) * 100,
  }));

  const cohortData = [
    { cohort: 'Enero 2024', retention30: 85, retention60: 78, retention90: 72 },
    { cohort: 'Febrero 2024', retention30: 88, retention60: 81, retention90: 75 },
    { cohort: 'Marzo 2024', retention30: 92, retention60: 85, retention90: 78 },
    { cohort: 'Abril 2024', retention30: 89, retention60: 82, retention90: 76 },
    { cohort: 'Mayo 2024', retention30: 91, retention60: 84, retention90: 79 },
  ];

  const getPeriodLabel = (period: string) => {
    switch (period) {
      case 'current-month': return 'Mes Actual';
      case 'previous-month': return 'Mes Anterior';
      case 'current-quarter': return 'Trimestre Actual';
      case 'previous-quarter': return 'Trimestre Anterior';
      case 'current-year': return 'Año Actual';
      case 'previous-year': return 'Año Anterior';
      default: return period;
    }
  };

  const renderComparison = () => {
    switch (selectedComparison) {
      case 'periods': {
        const data1 = periodComparisons[period1 as keyof typeof periodComparisons];
        const data2 = periodComparisons[period2 as keyof typeof periodComparisons];
        
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Período 1</label>
                <select 
                  value={period1} 
                  onChange={(e) => setPeriod1(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
                >
                  <option value="current-month">Mes Actual</option>
                  <option value="previous-month">Mes Anterior</option>
                  <option value="current-quarter">Trimestre Actual</option>
                  <option value="previous-quarter">Trimestre Anterior</option>
                  <option value="current-year">Año Actual</option>
                  <option value="previous-year">Año Anterior</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Período 2</label>
                <select 
                  value={period2} 
                  onChange={(e) => setPeriod2(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
                >
                  <option value="current-month">Mes Actual</option>
                  <option value="previous-month">Mes Anterior</option>
                  <option value="current-quarter">Trimestre Actual</option>
                  <option value="previous-quarter">Trimestre Anterior</option>
                  <option value="current-year">Año Actual</option>
                  <option value="previous-year">Año Anterior</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h4 className="font-medium text-gray-900 mb-4">Registros</h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">{getPeriodLabel(period1)}</span>
                    <span className="font-semibold">{data1.registrations}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">{getPeriodLabel(period2)}</span>
                    <span className="font-semibold">{data2.registrations}</span>
                  </div>
                  <div className="pt-2 border-t">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Diferencia</span>
                      <span className={`font-bold ${
                        data1.registrations > data2.registrations ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {data1.registrations > data2.registrations ? '+' : ''}
                        {((data1.registrations - data2.registrations) / data2.registrations * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-md">
                <h4 className="font-medium text-gray-900 mb-4">Líderes Activos</h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">{getPeriodLabel(period1)}</span>
                    <span className="font-semibold">{data1.leaders}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">{getPeriodLabel(period2)}</span>
                    <span className="font-semibold">{data2.leaders}</span>
                  </div>
                  <div className="pt-2 border-t">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Diferencia</span>
                      <span className={`font-bold ${
                        data1.leaders > data2.leaders ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {data1.leaders > data2.leaders ? '+' : ''}
                        {data1.leaders - data2.leaders}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-md">
                <h4 className="font-medium text-gray-900 mb-4">Tasa de Conversión</h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">{getPeriodLabel(period1)}</span>
                    <span className="font-semibold">{data1.conversion}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">{getPeriodLabel(period2)}</span>
                    <span className="font-semibold">{data2.conversion}%</span>
                  </div>
                  <div className="pt-2 border-t">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Diferencia</span>
                      <span className={`font-bold ${
                        data1.conversion > data2.conversion ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {data1.conversion > data2.conversion ? '+' : ''}
                        {(data1.conversion - data2.conversion).toFixed(1)}pp
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      }

      case 'regions':
        return (
          <div className="space-y-6">
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={regionComparisons}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="region" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#235B4E" name="Actual" />
                <Bar dataKey="previousCount" fill="#BC955C" name="Anterior" />
              </BarChart>
            </ResponsiveContainer>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {regionComparisons.map((region) => (
                <div key={region.region} className="bg-white p-4 rounded-lg shadow-md">
                  <h4 className="font-medium text-gray-900 mb-2">{region.region}</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Actual:</span>
                      <span className="font-semibold">{region.count}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Anterior:</span>
                      <span className="font-semibold">{region.previousCount}</span>
                    </div>
                    <div className="flex justify-between text-sm pt-2 border-t">
                      <span>Crecimiento:</span>
                      <span className={`font-bold ${region.growth > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {region.growth > 0 ? '+' : ''}{region.growth.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'leaders':
        return (
          <div className="space-y-6">
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={leaderComparisons}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="registered" fill="#235B4E" name="Actual" />
                <Bar dataKey="previousRegistered" fill="#9F2241" name="Anterior" />
              </BarChart>
            </ResponsiveContainer>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {leaderComparisons.slice(0, 6).map((leader) => (
                <div key={leader.name} className="bg-white p-4 rounded-lg shadow-md">
                  <h4 className="font-medium text-gray-900 mb-2">{leader.name}</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Actual:</span>
                      <span className="font-semibold">{leader.registered}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Anterior:</span>
                      <span className="font-semibold">{leader.previousRegistered}</span>
                    </div>
                    <div className="flex justify-between text-sm pt-2 border-t">
                      <span>Crecimiento:</span>
                      <span className={`font-bold ${leader.growth > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {leader.growth > 0 ? '+' : ''}{leader.growth.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'cohorts':
        return (
          <div className="space-y-6">
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={cohortData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="cohort" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="retention30" stroke="#235B4E" name="30 días" strokeWidth={2} />
                <Line type="monotone" dataKey="retention60" stroke="#9F2241" name="60 días" strokeWidth={2} />
                <Line type="monotone" dataKey="retention90" stroke="#BC955C" name="90 días" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <h4 className="font-medium text-gray-900 mb-4">Análisis de Retención por Cohorte</h4>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Cohorte</th>
                      <th className="text-center py-2">30 días</th>
                      <th className="text-center py-2">60 días</th>
                      <th className="text-center py-2">90 días</th>
                      <th className="text-center py-2">Tendencia</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cohortData.map((cohort, index) => (
                      <tr key={cohort.cohort} className="border-b">
                        <td className="py-2 font-medium">{cohort.cohort}</td>
                        <td className="text-center py-2">{cohort.retention30}%</td>
                        <td className="text-center py-2">{cohort.retention60}%</td>
                        <td className="text-center py-2">{cohort.retention90}%</td>
                        <td className="text-center py-2">
                          {index > 0 && cohortData[index].retention90 > cohortData[index - 1].retention90 ? (
                            <TrendingUp className="h-4 w-4 text-green-500 mx-auto" />
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Selector de Tipo de Comparación */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <BarChart3 className="h-5 w-5 text-primary mr-2" />
          Herramientas de Comparación
        </h3>
        <div className="flex flex-wrap gap-2">
          {[
            { key: 'periods', label: 'Períodos', icon: Calendar },
            { key: 'regions', label: 'Regiones', icon: BarChart3 },
            { key: 'leaders', label: 'Líderes', icon: Users },
            { key: 'cohorts', label: 'Cohortes', icon: TrendingUp },
          ].map((comparison) => (
            <button
              key={comparison.key}
              onClick={() => setSelectedComparison(comparison.key as ComparisonType)}
              className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                selectedComparison === comparison.key
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <comparison.icon className="h-4 w-4 mr-2" />
              {comparison.label}
            </button>
          ))}
        </div>
      </div>

      {/* Contenido de la Comparación */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h4 className="text-md font-medium text-gray-900 mb-6">
          {selectedComparison === 'periods' && 'Comparación entre Períodos'}
          {selectedComparison === 'regions' && 'Comparación entre Regiones'}
          {selectedComparison === 'leaders' && 'Comparación entre Líderes'}
          {selectedComparison === 'cohorts' && 'Análisis de Cohortes'}
        </h4>
        {renderComparison()}
      </div>

      {/* Insights de la Comparación */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h4 className="text-md font-medium text-gray-900 mb-4">Insights de la Comparación</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {selectedComparison === 'periods' && (
            <>
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h5 className="font-medium text-blue-900 mb-2">Tendencia General</h5>
                <p className="text-sm text-blue-800">
                  El crecimiento mes a mes muestra una tendencia positiva sostenida del 18% promedio.
                </p>
              </div>
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <h5 className="font-medium text-green-900 mb-2">Mejor Período</h5>
                <p className="text-sm text-green-800">
                  El trimestre actual supera al anterior en un 13.6% en registros totales.
                </p>
              </div>
            </>
          )}
          
          {selectedComparison === 'regions' && (
            <>
              <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                <h5 className="font-medium text-purple-900 mb-2">Región Líder</h5>
                <p className="text-sm text-purple-800">
                  {regionComparisons.sort((a, b) => b.growth - a.growth)[0].region} lidera con {regionComparisons.sort((a, b) => b.growth - a.growth)[0].growth.toFixed(1)}% de crecimiento.
                </p>
              </div>
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <h5 className="font-medium text-yellow-900 mb-2">Oportunidad</h5>
                <p className="text-sm text-yellow-800">
                  Regiones con menor crecimiento necesitan estrategias específicas de desarrollo.
                </p>
              </div>
            </>
          )}
          
          {selectedComparison === 'leaders' && (
            <>
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <h5 className="font-medium text-green-900 mb-2">Líder Destacado</h5>
                <p className="text-sm text-green-800">
                  {leaderComparisons.sort((a, b) => b.growth - a.growth)[0].name} muestra el mayor crecimiento con {leaderComparisons.sort((a, b) => b.growth - a.growth)[0].growth.toFixed(1)}%.
                </p>
              </div>
              <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                <h5 className="font-medium text-orange-900 mb-2">Mentoring</h5>
                <p className="text-sm text-orange-800">
                  Líderes con alto crecimiento pueden mentorear a aquellos con menor rendimiento.
                </p>
              </div>
            </>
          )}
          
          {selectedComparison === 'cohorts' && (
            <>
              <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
                <h5 className="font-medium text-indigo-900 mb-2">Retención Mejorada</h5>
                <p className="text-sm text-indigo-800">
                  Las cohortes más recientes muestran mejor retención a 90 días (+7% promedio).
                </p>
              </div>
              <div className="p-4 bg-pink-50 border border-pink-200 rounded-lg">
                <h5 className="font-medium text-pink-900 mb-2">Patrón Identificado</h5>
                <p className="text-sm text-pink-800">
                  La retención mejora consistentemente, indicando optimización de procesos.
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ComparisonTools;