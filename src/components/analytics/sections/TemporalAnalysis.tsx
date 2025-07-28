import React, { useState } from 'react';
import { Clock, Calendar, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Analytics } from '../../../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';

interface TemporalAnalysisProps {
  analytics: Analytics;
}

export type TemporalView = 'hourly' | 'weekly' | 'seasonal' | 'projections';

const TemporalAnalysis: React.FC<TemporalAnalysisProps> = ({ analytics }) => {
  const { temporal } = analytics;
  const [selectedView, setSelectedView] = useState<'hourly' | 'weekly' | 'seasonal' | 'projections'>('hourly');

  // Verificación de datos para evitar errores
  if (!temporal || !analytics) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="text-center text-gray-500">
          <Clock className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p>No hay datos temporales disponibles</p>
        </div>
      </div>
    );
  }

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'down': return <TrendingDown className="h-4 w-4 text-red-500" />;
      case 'stable': return <Minus className="h-4 w-4 text-gray-500" />;
    }
  };

  const renderChart = () => {
    try {
      switch (selectedView) {
        case 'hourly':
          if (!temporal.hourlyPatterns || temporal.hourlyPatterns.length === 0) {
            return <div className="text-center text-gray-500 py-8">No hay datos de patrones por hora disponibles</div>;
          }
          return (
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={temporal.hourlyPatterns}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="registrations" fill="#235B4E" name="Registros" />
              </BarChart>
            </ResponsiveContainer>
          );
        case 'weekly':
          if (!temporal.weeklyPatterns || temporal.weeklyPatterns.length === 0) {
            return <div className="text-center text-gray-500 py-8">No hay datos de patrones semanales disponibles</div>;
          }
          return (
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={temporal.weeklyPatterns}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="registrations" fill="#9F2241" name="Registros" />
              </BarChart>
            </ResponsiveContainer>
          );
        case 'seasonal':
          if (!temporal.seasonality || temporal.seasonality.length === 0) {
            return <div className="text-center text-gray-500 py-8">No hay datos de estacionalidad disponibles</div>;
          }
          return (
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={temporal.seasonality}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="registrations" 
                  stroke="#BC955C" 
                  strokeWidth={3}
                  name="Registros"
                  dot={{ fill: '#BC955C', strokeWidth: 2, r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          );
        case 'projections':
          if (!temporal.projections || temporal.projections.length === 0) {
            return <div className="text-center text-gray-500 py-8">No hay datos de proyecciones disponibles</div>;
          }
          return (
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={temporal.projections}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="projected" 
                  stroke="#6F7271" 
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  name="Proyección"
                  dot={{ fill: '#6F7271', strokeWidth: 2, r: 4 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="confidence" 
                  stroke="#2D7563" 
                  strokeWidth={1}
                  name="Confianza %"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          );
        default:
          return <div className="text-center text-gray-500 py-8">Vista no disponible</div>;
      }
    } catch (error) {
      console.error('Error rendering chart:', error);
      return (
        <div className="text-center text-red-500 py-8">
          <p>Error al cargar el gráfico</p>
          <p className="text-sm text-gray-500 mt-2">Por favor, intenta recargar la página</p>
        </div>
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* Selector de Vista */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Clock className="h-5 w-5 text-primary mr-2" />
          Análisis Temporal
        </h3>
        <div className="flex flex-wrap gap-2">
          {[
            { key: 'hourly', label: 'Patrones por Hora', icon: Clock },
            { key: 'weekly', label: 'Patrones Semanales', icon: Calendar },
            { key: 'seasonal', label: 'Estacionalidad', icon: TrendingUp },
            { key: 'projections', label: 'Proyecciones', icon: TrendingUp },
          ].map((view) => (
            <button
              key={view.key}
              onClick={() => setSelectedView(view.key as TemporalView)}
              className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                selectedView === view.key
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <view.icon className="h-4 w-4 mr-2" />
              {view.label}
            </button>
          ))}
        </div>
      </div>

      {/* Gráfico Principal */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h4 className="text-md font-medium text-gray-900 mb-4">
          {selectedView === 'hourly' && 'Registros por Hora del Día'}
          {selectedView === 'weekly' && 'Registros por Día de la Semana'}
          {selectedView === 'seasonal' && 'Tendencias Estacionales'}
          {selectedView === 'projections' && 'Proyecciones Futuras'}
        </h4>
        {renderChart()}
      </div>

      {/* Insights Temporales */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Mejores Horarios */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h4 className="text-md font-medium text-gray-900 mb-4">Horarios Óptimos</h4>
          <div className="space-y-3">
            {temporal.hourlyPatterns && temporal.hourlyPatterns.length > 0 ? (
              [...temporal.hourlyPatterns]
                .sort((a, b) => (b.registrations || 0) - (a.registrations || 0))
                .slice(0, 5)
                .map((hour, index) => (
                  <div key={hour.hour || index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold mr-3 ${
                        index === 0 ? 'bg-green-500' : index === 1 ? 'bg-blue-500' : 'bg-gray-400'
                      }`}>
                        {index + 1}
                      </div>
                      <span className="font-medium">{hour.hour || 0}:00</span>
                    </div>
                    <span className="text-primary font-semibold">{hour.registrations || 0} registros</span>
                  </div>
                ))
            ) : (
              <div className="text-center text-gray-500 py-4">
                No hay datos de horarios disponibles
              </div>
            )}
          </div>
        </div>

        {/* Tendencias Estacionales */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h4 className="text-md font-medium text-gray-900 mb-4">Tendencias por Mes</h4>
          <div className="space-y-3">
            {temporal.seasonality && temporal.seasonality.length > 0 ? (
              temporal.seasonality.slice(0, 6).map((month, index) => (
                <div key={month.month || index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    {getTrendIcon(month.trend || 'stable')}
                    <span className="font-medium ml-2">{month.month || 'N/A'}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">{month.registrations || 0}</div>
                    <div className="text-xs text-gray-500 capitalize">{month.trend || 'stable'}</div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-gray-500 py-4">
                No hay datos de tendencias disponibles
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Análisis de Picos de Actividad */}
      {temporal.peakActivity && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h4 className="text-md font-medium text-gray-900 mb-4">Análisis de Picos de Actividad</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="p-4 bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-lg">
              <h5 className="font-medium text-blue-900 mb-2">Hora Pico</h5>
              <div className="text-2xl font-bold text-blue-800">
                {temporal.peakActivity.peakHour.hour}:00
              </div>
              <p className="text-sm text-blue-700">
                {temporal.peakActivity.peakHour.registrations} registros
              </p>
            </div>
            
            <div className="p-4 bg-gradient-to-r from-green-50 to-green-100 border border-green-200 rounded-lg">
              <h5 className="font-medium text-green-900 mb-2">Día Pico</h5>
              <div className="text-2xl font-bold text-green-800">
                {temporal.peakActivity.peakDay.day}
              </div>
              <p className="text-sm text-green-700">
                {temporal.peakActivity.peakDay.registrations} registros
              </p>
            </div>
            
            <div className="p-4 bg-gradient-to-r from-purple-50 to-purple-100 border border-purple-200 rounded-lg">
              <h5 className="font-medium text-purple-900 mb-2">Mes Pico</h5>
              <div className="text-xl font-bold text-purple-800">
                {temporal.peakActivity.peakMonth.month}
              </div>
              <p className="text-sm text-purple-700">
                {temporal.peakActivity.peakMonth.registrations} registros
              </p>
            </div>
          </div>

          {/* Tendencias de Actividad */}
          <div className="mb-6">
            <h5 className="font-medium text-gray-900 mb-3">Tendencias de Actividad</h5>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {temporal.peakActivity.activityTrends.map((trend, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    {getTrendIcon(trend.trend === 'increasing' ? 'up' : trend.trend === 'decreasing' ? 'down' : 'stable')}
                    <span className="font-medium ml-2">{trend.period}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold capitalize">{trend.trend}</div>
                    <div className="text-xs text-gray-500">{trend.change.toFixed(1)}%</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Recomendaciones Temporales Mejoradas */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h4 className="text-md font-medium text-gray-900 mb-4">Recomendaciones Basadas en Patrones Reales</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h5 className="font-medium text-blue-900 mb-2">Optimización de Horarios</h5>
            <p className="text-sm text-blue-800">
              {temporal.peakActivity ? (
                <>
                  El horario más efectivo es a las {temporal.peakActivity.peakHour.hour}:00 
                  con {temporal.peakActivity.peakHour.registrations} registros. 
                  Concentra las campañas en este horario para maximizar conversiones.
                </>
              ) : temporal.hourlyPatterns && temporal.hourlyPatterns.length >= 2 ? (
                (() => {
                  const sortedHours = [...temporal.hourlyPatterns].sort((a, b) => (b.registrations || 0) - (a.registrations || 0));
                  return (
                    <>
                      Los mejores horarios son entre las {sortedHours[0]?.hour || 0}:00 
                      y las {sortedHours[1]?.hour || 0}:00. 
                      Concentra las campañas en estos horarios para maximizar conversiones.
                    </>
                  );
                })()
              ) : (
                'No hay suficientes datos de horarios para generar recomendaciones específicas.'
              )}
            </p>
          </div>
          
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <h5 className="font-medium text-green-900 mb-2">Días Más Efectivos</h5>
            <p className="text-sm text-green-800">
              {temporal.peakActivity ? (
                <>
                  {temporal.peakActivity.peakDay.day} es el día más efectivo 
                  con {temporal.peakActivity.peakDay.registrations} registros. 
                  Programa eventos importantes en este día.
                </>
              ) : temporal.weeklyPatterns && temporal.weeklyPatterns.length >= 2 ? (
                (() => {
                  const sortedDays = [...temporal.weeklyPatterns].sort((a, b) => (b.registrations || 0) - (a.registrations || 0));
                  return (
                    <>
                      {sortedDays[0]?.day || 'N/A'} y {sortedDays[1]?.day || 'N/A'} son los días 
                      con mayor actividad. Programa eventos importantes en estos días.
                    </>
                  );
                })()
              ) : (
                'No hay suficientes datos semanales para generar recomendaciones específicas.'
              )}
            </p>
          </div>
          
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h5 className="font-medium text-yellow-900 mb-2">Proyección Mejorada a 30 Días</h5>
            <p className="text-sm text-yellow-800">
              {temporal.projections && temporal.projections.length > 0 ? (
                <>
                  Se proyectan {temporal.projections.reduce((sum, p) => sum + (p.projected || 0), 0)} nuevos registros 
                  en los próximos 30 días con una confianza promedio del {' '}
                  {temporal.projections.length > 0 ? 
                    (temporal.projections.reduce((sum, p) => sum + (p.confidence || 0), 0) / temporal.projections.length).toFixed(0) : 
                    0}%. Basado en patrones históricos reales.
                </>
              ) : (
                'No hay datos de proyecciones disponibles para generar estimaciones.'
              )}
            </p>
          </div>
          
          <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
            <h5 className="font-medium text-purple-900 mb-2">Análisis Estacional</h5>
            <p className="text-sm text-purple-800">
              {temporal.seasonality && temporal.seasonality.length > 0 ? (
                (() => {
                  const upTrends = temporal.seasonality.filter(s => s.trend === 'up').length;
                  const downTrends = temporal.seasonality.filter(s => s.trend === 'down').length;
                  return upTrends > 0 ? (
                    `Se detectaron ${upTrends} meses con tendencia ascendente. Estos son ideales para campañas intensivas y asignación de recursos adicionales.`
                  ) : downTrends > 0 ? (
                    `Se detectaron ${downTrends} meses con tendencia descendente. Considera estrategias de reactivación durante estos períodos.`
                  ) : (
                    'Los patrones estacionales muestran estabilidad. Mantén estrategias consistentes a lo largo del año.'
                  );
                })()
              ) : (
                'No hay datos de estacionalidad disponibles para generar recomendaciones.'
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TemporalAnalysis;