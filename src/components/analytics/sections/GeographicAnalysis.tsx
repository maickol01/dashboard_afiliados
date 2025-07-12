import React from 'react';
import { MapPin, TrendingUp, Target } from 'lucide-react';
import { Analytics } from '../../../types';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

interface GeographicAnalysisProps {
  analytics: Analytics;
}

const GeographicAnalysis: React.FC<GeographicAnalysisProps> = ({ analytics }) => {
  const { geographic } = analytics;

  const COLORS = ['#235B4E', '#9F2241', '#BC955C', '#6F7271', '#2D7563'];

  return (
    <div className="space-y-6">
      {/* Distribución Regional */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <MapPin className="h-5 w-5 text-primary mr-2" />
            Distribución por Región
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={geographic.regionDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ region, percentage }) => `${region} (${percentage.toFixed(1)}%)`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="count"
              >
                {geographic.regionDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Cobertura Territorial</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={geographic.territorialCoverage}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="region" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="coverage" fill="#235B4E" name="Cobertura Actual %" />
              <Bar dataKey="target" fill="#BC955C" name="Meta %" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Métricas por Región */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Métricas Detalladas por Región</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {geographic.regionDistribution.map((region, index) => (
            <div key={region.region} className="p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-gray-900">{region.region}</h4>
                <div 
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                ></div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total Personas:</span>
                  <span className="font-medium">{region.count}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Porcentaje:</span>
                  <span className="font-medium">{region.percentage.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Estado:</span>
                  <span className={`font-medium ${
                    region.percentage >= 20 ? 'text-green-600' : 
                    region.percentage >= 15 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {region.percentage >= 20 ? 'Óptimo' : 
                     region.percentage >= 15 ? 'Bueno' : 'Necesita Atención'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Mapa de Calor */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Intensidad de Actividad</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {geographic.heatmapData.map((item) => {
            const intensity = (item.intensity / Math.max(...geographic.heatmapData.map(d => d.intensity))) * 100;
            return (
              <div key={item.region} className="text-center">
                <div 
                  className="w-full h-20 rounded-lg flex items-center justify-center text-white font-medium mb-2"
                  style={{ 
                    backgroundColor: `rgba(35, 91, 78, ${intensity / 100})`,
                    border: intensity < 30 ? '2px solid #e5e7eb' : 'none'
                  }}
                >
                  {item.region}
                </div>
                <div className="text-sm text-gray-600">{item.intensity} personas</div>
                <div className="text-xs text-gray-500">{intensity.toFixed(0)}% intensidad</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recomendaciones Geográficas */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Target className="h-5 w-5 text-accent mr-2" />
          Recomendaciones Estratégicas
        </h3>
        <div className="space-y-4">
          {geographic.territorialCoverage
            .filter(region => region.coverage < region.target)
            .map((region) => (
              <div key={region.region} className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">{region.region}</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      Cobertura actual: {region.coverage.toFixed(1)}% (Meta: {region.target}%)
                    </p>
                  </div>
                  <TrendingUp className="h-5 w-5 text-yellow-600" />
                </div>
                <div className="mt-3 text-sm text-gray-700">
                  <strong>Recomendación:</strong> Asignar {Math.ceil((region.target - region.coverage) / 5)} 
                  brigadistas adicionales para alcanzar la meta de cobertura.
                </div>
              </div>
            ))}
          
          {geographic.territorialCoverage.every(region => region.coverage >= region.target) && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center">
                <Target className="h-5 w-5 text-green-600 mr-2" />
                <span className="font-medium text-green-800">
                  ¡Excelente! Todas las regiones han alcanzado sus metas de cobertura.
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GeographicAnalysis;