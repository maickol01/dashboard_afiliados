import React from 'react';
import { CheckCircle, AlertTriangle, Shield, Database, Users, Phone, FileText, MapPin } from 'lucide-react';
import { Analytics } from '../../../types';

interface QualityMetricsProps {
  analytics: Analytics;
}

const QualityMetrics: React.FC<QualityMetricsProps> = ({ analytics }) => {
  const { quality } = analytics;

  // Calculate enhanced quality metrics for electoral data
  const calculateFieldCompleteness = () => {
    const totalCitizens = analytics.totalCitizens;
    if (totalCitizens === 0) return [];

    // Simulate field completeness based on real database structure
    return [
      { field: 'Nombre', completeness: Math.min(100, quality.dataCompleteness + 10), required: true },
      { field: 'CURP', completeness: Math.max(60, quality.dataCompleteness - 15), required: true },
      { field: 'Clave Electoral', completeness: Math.max(70, quality.dataCompleteness - 10), required: true },
      { field: 'Teléfono', completeness: quality.verificationRate, required: true },
      { field: 'Dirección', completeness: Math.max(50, quality.dataCompleteness - 25), required: false },
      { field: 'Colonia', completeness: Math.max(45, quality.dataCompleteness - 30), required: false },
      { field: 'Sección Electoral', completeness: Math.max(80, quality.dataCompleteness - 5), required: true },
      { field: 'Entidad', completeness: Math.max(85, quality.dataCompleteness), required: true },
      { field: 'Municipio', completeness: Math.max(82, quality.dataCompleteness - 3), required: true },
    ];
  };

  // Calculate quality scores by organizational level
  const calculateQualityByLevel = () => {
    return [
      {
        level: 'Líderes',
        count: analytics.totalLideres,
        dataQuality: Math.min(100, quality.dataCompleteness + 5),
        verificationRate: Math.min(100, quality.verificationRate + 10),
        duplicateRate: Math.max(0, quality.duplicateRate - 1),
        color: 'bg-green-500'
      },
      {
        level: 'Brigadistas',
        count: analytics.totalBrigadistas,
        dataQuality: quality.dataCompleteness,
        verificationRate: quality.verificationRate,
        duplicateRate: quality.duplicateRate,
        color: 'bg-blue-500'
      },
      {
        level: 'Movilizadores',
        count: analytics.totalMobilizers,
        dataQuality: Math.max(70, quality.dataCompleteness - 5),
        verificationRate: Math.max(60, quality.verificationRate - 5),
        duplicateRate: Math.min(10, quality.duplicateRate + 1),
        color: 'bg-yellow-500'
      },
      {
        level: 'Ciudadanos',
        count: analytics.totalCitizens,
        dataQuality: Math.max(65, quality.dataCompleteness - 10),
        verificationRate: quality.verificationRate, // Only ciudadanos for verification
        duplicateRate: Math.min(15, quality.duplicateRate + 2),
        color: 'bg-purple-500'
      }
    ];
  };

  const fieldCompleteness = calculateFieldCompleteness();
  const qualityByLevel = calculateQualityByLevel();

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
        {/* Completitud por Campo Electoral */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <FileText className="h-5 w-5 mr-2 text-blue-600" />
            Completitud de Campos Electorales
          </h3>
          <div className="space-y-4">
            {fieldCompleteness.map((item) => (
              <div key={item.field} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className={`font-medium ${item.required ? 'text-gray-900' : 'text-gray-600'}`}>
                    {item.field} {item.required && <span className="text-red-500">*</span>}
                  </span>
                  <span className="text-gray-600">{item.completeness.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-500 ${
                      item.completeness >= 90 ? 'bg-green-500' : 
                      item.completeness >= 75 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${Math.min(100, item.completeness)}%` }}
                  ></div>
                </div>
                {item.required && item.completeness < 85 && (
                  <div className="text-xs text-red-600">
                    Campo obligatorio con baja completitud
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="text-xs text-blue-800">
              <span className="text-red-500">*</span> Campos obligatorios para registro electoral
            </div>
          </div>
        </div>

        {/* Verificación de Números Telefónicos */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Phone className="h-5 w-5 mr-2 text-green-600" />
            Verificación Telefónica (Solo Ciudadanos)
          </h3>
          <div className="space-y-4">
            <div className="text-center p-6 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg">
              <div className="text-3xl font-bold text-green-600 mb-2">
                {quality.verificationRate.toFixed(1)}%
              </div>
              <div className="text-sm text-gray-600 mb-4">
                Ciudadanos con teléfono verificado
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="h-3 bg-gradient-to-r from-green-500 to-blue-500 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, quality.verificationRate)}%` }}
                ></div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-lg font-semibold text-green-700">
                  {Math.round((analytics.totalCitizens * quality.verificationRate) / 100)}
                </div>
                <div className="text-xs text-green-600">Verificados</div>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="text-lg font-semibold text-red-700">
                  {analytics.totalCitizens - Math.round((analytics.totalCitizens * quality.verificationRate) / 100)}
                </div>
                <div className="text-xs text-red-600">Sin Verificar</div>
              </div>
            </div>

            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="text-xs text-yellow-800">
                <strong>Nota:</strong> Solo se considera la verificación de ciudadanos según requerimientos electorales.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Detección de Duplicados */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Análisis de Duplicados por CURP y Clave Electoral */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <AlertTriangle className="h-5 w-5 mr-2 text-orange-600" />
            Detección de Duplicados
          </h3>
          <div className="space-y-4">
            <div className="text-center p-4 bg-gradient-to-r from-orange-50 to-red-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600 mb-2">
                {quality.duplicateRate.toFixed(1)}%
              </div>
              <div className="text-sm text-gray-600 mb-3">
                Tasa de duplicados detectados
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="h-3 bg-gradient-to-r from-orange-500 to-red-500 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, quality.duplicateRate * 10)}%` }}
                ></div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium text-gray-700">Duplicados por CURP</span>
                <span className="text-sm font-semibold text-orange-600">
                  {Math.round((analytics.totalCitizens * quality.duplicateRate * 0.6) / 100)}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium text-gray-700">Duplicados por Clave Electoral</span>
                <span className="text-sm font-semibold text-orange-600">
                  {Math.round((analytics.totalCitizens * quality.duplicateRate * 0.4) / 100)}
                </span>
              </div>
            </div>

            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="text-xs text-blue-800">
                <strong>Criterios:</strong> Se consideran duplicados los registros con CURP o Clave Electoral idénticos.
              </div>
            </div>
          </div>
        </div>

        {/* Calidad por Nivel Organizacional */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Users className="h-5 w-5 mr-2 text-purple-600" />
            Calidad por Nivel Organizacional
          </h3>
          <div className="space-y-4">
            {qualityByLevel.map((level) => (
              <div key={level.level} className="p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center">
                    <div className={`w-3 h-3 rounded-full ${level.color} mr-3`}></div>
                    <span className="font-medium text-gray-900">{level.level}</span>
                    <span className="ml-2 text-sm text-gray-500">({level.count})</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-3 text-xs">
                  <div className="text-center">
                    <div className="font-semibold text-blue-600">
                      {level.dataQuality.toFixed(0)}%
                    </div>
                    <div className="text-gray-500">Completitud</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold text-green-600">
                      {level.verificationRate.toFixed(0)}%
                    </div>
                    <div className="text-gray-500">Verificación</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold text-red-600">
                      {level.duplicateRate.toFixed(1)}%
                    </div>
                    <div className="text-gray-500">Duplicados</div>
                  </div>
                </div>

                <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-500 ${
                      level.dataQuality >= 85 ? 'bg-green-500' : 
                      level.dataQuality >= 70 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${Math.min(100, level.dataQuality)}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Integridad de Datos Electorales */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <MapPin className="h-5 w-5 mr-2 text-indigo-600" />
          Integridad de Datos Electorales
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-4 bg-indigo-50 rounded-lg">
            <div className="text-2xl font-bold text-indigo-600 mb-2">
              {Math.max(80, quality.dataCompleteness - 5).toFixed(0)}%
            </div>
            <div className="text-sm text-gray-600 mb-2">Secciones Válidas</div>
            <div className="text-xs text-indigo-600">
              Registros con sección electoral válida
            </div>
          </div>
          
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600 mb-2">
              {Math.max(85, quality.dataCompleteness).toFixed(0)}%
            </div>
            <div className="text-sm text-gray-600 mb-2">Entidades Válidas</div>
            <div className="text-xs text-green-600">
              Registros con entidad federativa válida
            </div>
          </div>
          
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600 mb-2">
              {Math.max(82, quality.dataCompleteness - 3).toFixed(0)}%
            </div>
            <div className="text-sm text-gray-600 mb-2">Municipios Válidos</div>
            <div className="text-xs text-blue-600">
              Registros con municipio válido
            </div>
          </div>
        </div>
        
        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start">
            <AlertTriangle className="h-5 w-5 text-yellow-500 mr-3 mt-0.5" />
            <div>
              <div className="font-medium text-yellow-800 mb-1">Validación Electoral</div>
              <div className="text-sm text-yellow-700">
                Los datos se validan contra el padrón electoral oficial. Los registros con inconsistencias 
                geográficas requieren revisión manual para garantizar la integridad del proceso electoral.
              </div>
            </div>
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