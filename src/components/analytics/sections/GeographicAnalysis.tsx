import React from 'react';
import { TrendingUp, Target, Map, Building2, Hash } from 'lucide-react';
import { Analytics } from '../../../types';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Area, AreaChart } from 'recharts';

interface GeographicAnalysisProps {
  analytics: Analytics;
}

const GeographicAnalysis: React.FC<GeographicAnalysisProps> = ({ analytics }) => {
  const { geographic } = analytics;

  const COLORS = ['#235B4E', '#9F2241', '#BC955C', '#6F7271', '#2D7563', '#4A90E2', '#F5A623', '#7ED321', '#D0021B', '#9013FE'];

  // Calculate additional electoral metrics from the analytics data
  const calculateElectoralMetrics = () => {
    // Extract entidad, municipio, and seccion data from geographic.regionDistribution
    // This assumes the analytics already contain the proper electoral data
    const entidadData = geographic.regionDistribution || [];
    const municipioData = geographic.municipioDistribution || [];
    const seccionData = geographic.seccionDistribution || [];
    
    return { entidadData, municipioData, seccionData };
  };

  const { entidadData, municipioData, seccionData } = calculateElectoralMetrics();

  return (
    <div className="space-y-6">
      {/* Resumen Ejecutivo de Secciones Electorales - Destacado */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg shadow-lg border-l-4 border-primary">
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
          <Hash className="h-6 w-6 text-primary mr-3" />
          Análisis Principal: Secciones Electorales
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-white rounded-lg shadow-sm">
            <div className="text-3xl font-bold text-primary">{seccionData.length}</div>
            <div className="text-sm font-medium text-gray-700">Secciones Cubiertas</div>
          </div>
          <div className="text-center p-4 bg-white rounded-lg shadow-sm">
            <div className="text-3xl font-bold text-green-600">
              {seccionData.length > 0 ? seccionData[0]?.count || 0 : 0}
            </div>
            <div className="text-sm font-medium text-gray-700">Mayor Registro</div>
          </div>
          <div className="text-center p-4 bg-white rounded-lg shadow-sm">
            <div className="text-3xl font-bold text-blue-600">
              {seccionData.length > 0 ? 
                Math.round(seccionData.reduce((sum, s) => sum + s.count, 0) / seccionData.length) : 0}
            </div>
            <div className="text-sm font-medium text-gray-700">Promedio por Sección</div>
          </div>
          <div className="text-center p-4 bg-white rounded-lg shadow-sm">
            <div className="text-3xl font-bold text-purple-600">
              {seccionData.length > 0 ? 
                seccionData.reduce((sum, s) => sum + s.count, 0) : 0}
            </div>
            <div className="text-sm font-medium text-gray-700">Total Registros</div>
          </div>
        </div>
      </div>

      {/* Análisis Detallado por Secciones Electorales */}
      {seccionData.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
            <Hash className="h-5 w-5 text-primary mr-2" />
            Análisis Detallado por Secciones Electorales
          </h3>
          
          {/* Top 20 Secciones con Mayor Registro */}
          <div className="mb-8">
            <h4 className="text-md font-medium text-gray-800 mb-4">Top 20 Secciones con Mayor Registro</h4>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={seccionData.slice(0, 20)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="region" 
                  angle={-45}
                  textAnchor="end"
                  height={100}
                  fontSize={10}
                />
                <YAxis />
                <Tooltip 
                  formatter={(value) => [value, 'Registros']}
                  labelFormatter={(label) => `Sección: ${label}`}
                />
                <Bar dataKey="count" fill="#235B4E" name="Registros">
                  {seccionData.slice(0, 20).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Distribución de Rendimiento por Secciones */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div>
              <h4 className="text-md font-medium text-gray-800 mb-4">Distribución de Rendimiento</h4>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={seccionData.slice(0, 15)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="region" 
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    fontSize={9}
                  />
                  <YAxis />
                  <Tooltip />
                  <Area 
                    type="monotone" 
                    dataKey="count" 
                    stroke="#235B4E" 
                    fill="#235B4E" 
                    fillOpacity={0.7}
                    name="Registros"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            
            <div>
              <h4 className="text-md font-medium text-gray-800 mb-4">Categorización de Secciones</h4>
              <div className="space-y-3">
                {(() => {
                  const avgRegistros = seccionData.length > 0 ? 
                    seccionData.reduce((sum, s) => sum + s.count, 0) / seccionData.length : 0;
                  const altasPerformance = seccionData.filter(s => s.count > avgRegistros * 1.5).length;
                  const mediasPerformance = seccionData.filter(s => s.count >= avgRegistros * 0.8 && s.count <= avgRegistros * 1.5).length;
                  const bajasPerformance = seccionData.filter(s => s.count < avgRegistros * 0.8).length;
                  
                  return (
                    <>
                      <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-green-800">Secciones de Alto Rendimiento</span>
                          <span className="text-lg font-bold text-green-900">{altasPerformance}</span>
                        </div>
                        <div className="text-xs text-green-600 mt-1">
                          Más de {Math.round(avgRegistros * 1.5)} registros
                        </div>
                      </div>
                      <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-yellow-800">Secciones de Rendimiento Medio</span>
                          <span className="text-lg font-bold text-yellow-900">{mediasPerformance}</span>
                        </div>
                        <div className="text-xs text-yellow-600 mt-1">
                          Entre {Math.round(avgRegistros * 0.8)} y {Math.round(avgRegistros * 1.5)} registros
                        </div>
                      </div>
                      <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-red-800">Secciones de Bajo Rendimiento</span>
                          <span className="text-lg font-bold text-red-900">{bajasPerformance}</span>
                        </div>
                        <div className="text-xs text-red-600 mt-1">
                          Menos de {Math.round(avgRegistros * 0.8)} registros
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>
          </div>

          {/* Tabla de Secciones Prioritarias */}
          <div>
            <h4 className="text-md font-medium text-gray-800 mb-4">Secciones que Requieren Atención Prioritaria</h4>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Sección Electoral
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Registros Actuales
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      % del Promedio
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Prioridad
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {(() => {
                    const avgRegistros = seccionData.length > 0 ? 
                      seccionData.reduce((sum, s) => sum + s.count, 0) / seccionData.length : 0;
                    return seccionData
                      .filter(s => s.count < avgRegistros * 0.8)
                      .slice(0, 10)
                      .map((seccion, index) => {
                        const porcentajePromedio = avgRegistros > 0 ? (seccion.count / avgRegistros) * 100 : 0;
                        const prioridad = porcentajePromedio < 50 ? 'Alta' : porcentajePromedio < 70 ? 'Media' : 'Baja';
                        const colorPrioridad = porcentajePromedio < 50 ? 'text-red-600' : porcentajePromedio < 70 ? 'text-yellow-600' : 'text-blue-600';
                        
                        return (
                          <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {seccion.region}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {seccion.count}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {porcentajePromedio.toFixed(1)}%
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${colorPrioridad} bg-opacity-10`}>
                                {prioridad}
                              </span>
                            </td>
                          </tr>
                        );
                      });
                  })()}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Mapa de Calor de Secciones Electorales */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Mapa de Calor - Intensidad por Secciones Electorales</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {seccionData.slice(0, 24).map((seccion) => {
            const maxIntensity = Math.max(...seccionData.map(d => d.count));
            const intensity = maxIntensity > 0 ? (seccion.count / maxIntensity) * 100 : 0;
            return (
              <div key={seccion.region} className="text-center">
                <div 
                  className="w-full h-16 rounded-lg flex items-center justify-center text-white font-medium mb-2 text-xs"
                  style={{ 
                    backgroundColor: `rgba(35, 91, 78, ${Math.max(0.3, intensity / 100)})`,
                    border: intensity < 40 ? '2px solid #e5e7eb' : 'none'
                  }}
                >
                  {seccion.region.split(' ')[1] || seccion.region}
                </div>
                <div className="text-xs text-gray-600">{seccion.count}</div>
                <div className="text-xs text-gray-500">{intensity.toFixed(0)}%</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Contexto Geográfico Complementario */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Map className="h-5 w-5 text-secondary mr-2" />
            Contexto por Entidad Federativa
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={entidadData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ region, percentage }) => `${region} (${percentage.toFixed(1)}%)`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="count"
              >
                {entidadData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [value, 'Registros']} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Building2 className="h-5 w-5 text-accent mr-2" />
            Contexto por Municipios (Top 8)
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={municipioData.slice(0, 8)} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis 
                type="category" 
                dataKey="region" 
                width={100}
                fontSize={10}
              />
              <Tooltip />
              <Bar dataKey="count" fill="#9F2241" name="Registros" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Métricas Detalladas por Entidad */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Métricas Detalladas por Entidad Federativa</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {entidadData.map((entidad, index) => (
            <div key={entidad.region} className="p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-gray-900">{entidad.region}</h4>
                <div 
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                ></div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total Registros:</span>
                  <span className="font-medium">{entidad.count}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Porcentaje Nacional:</span>
                  <span className="font-medium">{entidad.percentage.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Rendimiento:</span>
                  <span className={`font-medium ${
                    entidad.percentage >= 15 ? 'text-green-600' : 
                    entidad.percentage >= 8 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {entidad.percentage >= 15 ? 'Excelente' : 
                     entidad.percentage >= 8 ? 'Bueno' : 'Requiere Atención'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Mapa de Calor Electoral */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Mapa de Calor - Intensidad Electoral</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {geographic.heatmapData.map((item) => {
            const maxIntensity = Math.max(...geographic.heatmapData.map(d => d.intensity));
            const intensity = maxIntensity > 0 ? (item.intensity / maxIntensity) * 100 : 0;
            return (
              <div key={item.region} className="text-center">
                <div 
                  className="w-full h-20 rounded-lg flex items-center justify-center text-white font-medium mb-2 text-xs"
                  style={{ 
                    backgroundColor: `rgba(35, 91, 78, ${Math.max(0.2, intensity / 100)})`,
                    border: intensity < 30 ? '2px solid #e5e7eb' : 'none'
                  }}
                >
                  {item.region}
                </div>
                <div className="text-sm text-gray-600">{item.intensity} registros</div>
                <div className="text-xs text-gray-500">{intensity.toFixed(0)}% intensidad</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Análisis de Brechas de Cobertura */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Target className="h-5 w-5 text-accent mr-2" />
          Análisis de Brechas de Cobertura Electoral
        </h3>
        <div className="space-y-4">
          {geographic.territorialCoverage
            .filter(region => region.coverage < region.target)
            .sort((a, b) => (a.target - a.coverage) - (b.target - b.coverage))
            .map((region) => {
              const gap = region.target - region.coverage;
              const priority = gap > 15 ? 'Alta' : gap > 8 ? 'Media' : 'Baja';
              const priorityColor = gap > 15 ? 'red' : gap > 8 ? 'yellow' : 'blue';
              
              return (
                <div key={region.region} className={`p-4 bg-${priorityColor}-50 border border-${priorityColor}-200 rounded-lg`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-medium text-gray-900">{region.region}</h4>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full bg-${priorityColor}-100 text-${priorityColor}-800`}>
                          Prioridad {priority}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        Cobertura actual: {region.coverage.toFixed(1)}% | Meta: {region.target}% | Brecha: {gap.toFixed(1)}%
                      </p>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full" 
                          style={{ width: `${Math.min(100, region.coverage)}%` }}
                        ></div>
                      </div>
                    </div>
                    <TrendingUp className={`h-5 w-5 text-${priorityColor}-600 ml-4`} />
                  </div>
                  <div className="mt-3 text-sm text-gray-700">
                    <strong>Estrategia Recomendada:</strong> 
                    {gap > 15 ? 
                      ` Despliegue inmediato de ${Math.ceil(gap / 3)} brigadistas adicionales y campaña intensiva de registro.` :
                      gap > 8 ?
                      ` Reforzar con ${Math.ceil(gap / 5)} movilizadores y optimizar rutas de registro.` :
                      ` Mantener esfuerzo actual y enfocar en calidad de registros.`
                    }
                  </div>
                </div>
              );
            })}
          
          {geographic.territorialCoverage.every(region => region.coverage >= region.target) && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center">
                <Target className="h-5 w-5 text-green-600 mr-2" />
                <span className="font-medium text-green-800">
                  ¡Excelente! Todas las entidades han alcanzado sus metas de cobertura electoral.
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Resumen Ejecutivo Electoral */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Resumen Ejecutivo - Cobertura Electoral</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{entidadData.length}</div>
            <div className="text-sm text-blue-800">Entidades con Presencia</div>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {municipioData.length > 0 ? municipioData.length : 'N/A'}
            </div>
            <div className="text-sm text-green-800">Municipios Cubiertos</div>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">
              {seccionData.length > 0 ? seccionData.length : 'N/A'}
            </div>
            <div className="text-sm text-purple-800">Secciones Electorales</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GeographicAnalysis;