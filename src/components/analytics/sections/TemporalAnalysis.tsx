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

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'down': return <TrendingDown className="h-4 w-4 text-red-500" />;
      case 'stable': return <Minus className="h-4 w-4 text-gray-500" />;
    }
  };

  const renderChart = () => {
    switch (selectedView) {
      case 'hourly':
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
            {temporal.hourlyPatterns
              .sort((a, b) => b.registrations - a.registrations)
              .slice(0, 5)
              .map((hour, index) => (
                <div key={hour.hour} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold mr-3 ${
                      index === 0 ? 'bg-green-500' : index === 1 ? 'bg-blue-500' : 'bg-gray-400'
                    }`}>
                      {index + 1}
                    </div>
                    <span className="font-medium">{hour.hour}:00</span>
                  </div>
                  <span className="text-primary font-semibold">{hour.registrations} registros</span>
                </div>
              ))}
          </div>
        </div>

        {/* Tendencias Estacionales */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h4 className="text-md font-medium text-gray-900 mb-4">Tendencias por Mes</h4>
          <div className="space-y-3">
            {temporal.seasonality.slice(0, 6).map((month) => (
              <div key={month.month} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  {getTrendIcon(month.trend)}
                  <span className="font-medium ml-2">{month.month}</span>
                </div>
                <div className="text-right">
                  <div className="font-semibold">{month.registrations}</div>
                  <div className="text-xs text-gray-500 capitalize">{month.trend}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recomendaciones Temporales */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h4 className="text-md font-medium text-gray-900 mb-4">Recomendaciones Basadas en Patrones</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h5 className="font-medium text-blue-900 mb-2">Optimización de Horarios</h5>
            <p className="text-sm text-blue-800">
              Los mejores horarios son entre las {temporal.hourlyPatterns.sort((a, b) => b.registrations - a.registrations)[0].hour}:00 
              y las {temporal.hourlyPatterns.sort((a, b) => b.registrations - a.registrations)[1].hour}:00. 
              Concentra las campañas en estos horarios para maximizar conversiones.
            </p>
          </div>
          
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <h5 className="font-medium text-green-900 mb-2">Días Más Efectivos</h5>
            <p className="text-sm text-green-800">
              {temporal.weeklyPatterns.sort((a, b) => b.registrations - a.registrations)[0].day} y {' '}
              {temporal.weeklyPatterns.sort((a, b) => b.registrations - a.registrations)[1].day} son los días 
              con mayor actividad. Programa eventos importantes en estos días.
            </p>
          </div>
          
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h5 className="font-medium text-yellow-900 mb-2">Proyección a 30 Días</h5>
            <p className="text-sm text-yellow-800">
              Se proyectan {temporal.projections.reduce((sum, p) => sum + p.projected, 0)} nuevos registros 
              en los próximos 30 días con una confianza promedio del {' '}
              {(temporal.projections.reduce((sum, p) => sum + p.confidence, 0) / temporal.projections.length).toFixed(0)}%.
            </p>
          </div>
          
          <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
            <h5 className="font-medium text-purple-900 mb-2">Estacionalidad</h5>
            <p className="text-sm text-purple-800">
              Los meses con tendencia ascendente son ideales para campañas intensivas. 
              Planifica recursos adicionales durante estos períodos de alta demanda.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TemporalAnalysis;