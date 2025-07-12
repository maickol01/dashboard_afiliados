import React from 'react';
import { CheckCircle, AlertTriangle, Shield, Database } from 'lucide-react';
import { Analytics } from '../../../types';

interface QualityMetricsProps {
  analytics: Analytics;
}

const QualityMetrics: React.FC<QualityMetricsProps> = ({ analytics }) => {
  const { quality } = analytics;

  const qualityMetrics = [
    {
      name: 'Completitud de Datos',
      value: quality.dataCompleteness,
      icon: Database,
      color: 'bg-blue-500',
      description: 'Porcentaje de campos completados',
      target: 90,
    },
    {
      name: 'Tasa de Verificación',
      value: quality.verificationRate,
      icon: Shield,
      color: 'bg-green-500',
      description: 'Contactos verificados',
      target: 80,
    },
    {
      name: 'Actividad Post-Registro',
      value: quality.postRegistrationActivity,
      icon: CheckCircle,
      color: 'bg-purple-500',
      description: 'Usuarios activos después del registro',
      target: 75,
    },
    {
      name: 'Tasa de Duplicados',
      value: quality.duplicateRate,
      icon: AlertTriangle,
      color: 'bg-red-500',
      description: 'Registros duplicados detectados',
      target: 5,
      inverse: true, // Menor es mejor
    },
  ];

  const getStatusColor = (value: number, target: number, inverse = false) => {
    const isGood = inverse ? value <= target : value >= target;
    const isWarning = inverse ? value <= target * 1.5 : value >= target * 0.8;
    
    if (isGood) return 'text-green-600';
    if (isWarning) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getStatusText = (value: number, target: number, inverse = false) => {
    const isGood = inverse ? value <= target : value >= target;
    const isWarning = inverse ? value <= target * 1.5 : value >= target * 0.8;
    
    if (isGood) return 'Excelente';
    if (isWarning) return 'Bueno';
    return 'Necesita Atención';
  };

  return (
    <div className="space-y-6">
      {/* Métricas Principales de Calidad */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {qualityMetrics.map((metric) => (
          <div key={metric.name} className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between mb-4">
              <div className={`${metric.color} p-3 rounded-lg`}>
                <metric.icon className="h-6 w-6 text-white" />
              </div>
              <div className={`text-sm font-medium ${getStatusColor(metric.value, metric.target, metric.inverse)}`}>
                {getStatusText(metric.value, metric.target, metric.inverse)}
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-gray-900">{metric.name}</h3>
              <div className="text-2xl font-bold text-gray-900">
                {metric.value.toFixed(1)}%
              </div>
              <p className="text-xs text-gray-500">{metric.description}</p>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-500 ${
                    getStatusColor(metric.value, metric.target, metric.inverse) === 'text-green-600' ? 'bg-green-500' :
                    getStatusColor(metric.value, metric.target, metric.inverse) === 'text-yellow-600' ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ 
                    width: metric.inverse 
                      ? `${Math.max(0, 100 - (metric.value / metric.target) * 100)}%`
                      : `${Math.min(100, (metric.value / metric.target) * 100)}%`
                  }}
                ></div>
              </div>
              <div className="text-xs text-gray-500">
                Meta: {metric.inverse ? '≤' : '≥'} {metric.target}%
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Análisis Detallado de Calidad */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Completitud por Campo */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Completitud por Campo</h3>
          <div className="space-y-4">
            {[
              { field: 'Nombre', completeness: 98.5 },
              { field: 'Teléfono', completeness: 92.3 },
              { field: 'Email', completeness: 87.1 },
              { field: 'Dirección', completeness: 76.8 },
              { field: 'Fecha de Nacimiento', completeness: 65.4 },
            ].map((item) => (
              <div key={item.field} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-gray-900">{item.field}</span>
                  <span className="text-gray-600">{item.completeness}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-500 ${
                      item.completeness >= 90 ? 'bg-green-500' : 
                      item.completeness >= 75 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${item.completeness}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Estado de Verificación */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Estado de Verificación</h3>
          <div className="space-y-4">
            {[
              { type: 'Email Verificado', count: 2847, total: 3000, color: 'bg-green-500' },
              { type: 'Teléfono Verificado', count: 2654, total: 3000, color: 'bg-blue-500' },
              { type: 'Dirección Verificada', count: 2103, total: 3000, color: 'bg-yellow-500' },
              { type: 'Documentos Verificados', count: 1876, total: 3000, color: 'bg-purple-500' },
            ].map((item) => {
              const percentage = (item.count / item.total) * 100;
              return (
                <div key={item.type} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <div className={`w-3 h-3 rounded-full ${item.color} mr-3`}></div>
                    <span className="font-medium text-gray-900">{item.type}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">{item.count}/{item.total}</div>
                    <div className="text-sm text-gray-500">{percentage.toFixed(1)}%</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Alertas de Calidad */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Alertas de Calidad</h3>
        <div className="space-y-3">
          {quality.duplicateRate > 3 && (
            <div className="flex items-center p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-red-500 mr-3" />
              <div>
                <div className="font-medium text-red-800">Alta tasa de duplicados</div>
                <div className="text-sm text-red-600">
                  Se detectó un {quality.duplicateRate}% de registros duplicados. Revisar proceso de validación.
                </div>
              </div>
            </div>
          )}
          
          {quality.verificationRate < 80 && (
            <div className="flex items-center p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-yellow-500 mr-3" />
              <div>
                <div className="font-medium text-yellow-800">Baja tasa de verificación</div>
                <div className="text-sm text-yellow-600">
                  Solo el {quality.verificationRate.toFixed(1)}% de contactos están verificados. Meta: 80%.
                </div>
              </div>
            </div>
          )}
          
          {quality.dataCompleteness < 85 && (
            <div className="flex items-center p-3 bg-orange-50 border border-orange-200 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-orange-500 mr-3" />
              <div>
                <div className="font-medium text-orange-800">Datos incompletos</div>
                <div className="text-sm text-orange-600">
                  Completitud de datos en {quality.dataCompleteness}%. Implementar validaciones adicionales.
                </div>
              </div>
            </div>
          )}
          
          {quality.duplicateRate <= 3 && quality.verificationRate >= 80 && quality.dataCompleteness >= 85 && (
            <div className="flex items-center p-3 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
              <div className="font-medium text-green-800">
                Excelente calidad de datos. Todos los indicadores están dentro de los parámetros óptimos.
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Recomendaciones de Mejora */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recomendaciones de Mejora</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Automatización</h4>
            <p className="text-sm text-blue-800">
              Implementar validaciones automáticas en tiempo real para mejorar la completitud de datos.
            </p>
          </div>
          
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <h4 className="font-medium text-green-900 mb-2">Verificación</h4>
            <p className="text-sm text-green-800">
              Establecer proceso de verificación por SMS y email para nuevos registros.
            </p>
          </div>
          
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h4 className="font-medium text-yellow-900 mb-2">Capacitación</h4>
            <p className="text-sm text-yellow-800">
              Entrenar al equipo en mejores prácticas de captura y validación de datos.
            </p>
          </div>
          
          <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
            <h4 className="font-medium text-purple-900 mb-2">Seguimiento</h4>
            <p className="text-sm text-purple-800">
              Implementar seguimiento post-registro para mantener datos actualizados.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QualityMetrics;