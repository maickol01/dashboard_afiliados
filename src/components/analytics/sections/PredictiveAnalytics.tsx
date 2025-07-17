import React from 'react';
import { Brain, TrendingUp, Users, AlertTriangle, Lightbulb } from 'lucide-react';
import { Analytics } from '../../../types';

interface PredictiveAnalyticsProps {
  analytics: Analytics;
}

const PredictiveAnalytics: React.FC<PredictiveAnalyticsProps> = ({ analytics }) => {
  const { predictions } = analytics;

  const getRiskColor = (risk: number) => {
    if (risk >= 70) return 'text-red-600 bg-red-50 border-red-200';
    if (risk >= 40) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-green-600 bg-green-50 border-green-200';
  };

  const getRiskLevel = (risk: number) => {
    if (risk >= 70) return 'Alto';
    if (risk >= 40) return 'Medio';
    return 'Bajo';
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-green-600';
    if (confidence >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      {/* Análisis de Riesgo de Abandono */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
          Análisis de Riesgo de Abandono
        </h3>
        
        {predictions.churnRisk.length === 0 ? (
          <div className="text-center py-8">
            <Users className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <p className="text-gray-600">No se detectaron personas en riesgo de abandono</p>
          </div>
        ) : (
          <div className="space-y-4">
            {predictions.churnRisk.map((person) => (
              <div key={person.id} className={`p-4 rounded-lg border ${getRiskColor(person.risk)}`}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-medium">{person.name}</h4>
                    <div className="text-sm opacity-75">ID: {person.id}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-lg">{person.risk.toFixed(0)}%</div>
                    <div className="text-sm">Riesgo {getRiskLevel(person.risk)}</div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="text-sm font-medium">Factores de riesgo:</div>
                  <div className="flex flex-wrap gap-2">
                    {person.factors.map((factor, index) => (
                      <span key={index} className="px-2 py-1 bg-white bg-opacity-50 rounded-sm text-xs">
                        {factor}
                      </span>
                    ))}
                  </div>
                </div>
                
                <div className="mt-3 pt-3 border-t border-current border-opacity-20">
                  <div className="text-sm font-medium">Acciones recomendadas:</div>
                  <ul className="text-sm mt-1 space-y-1">
                    <li>• Contacto directo en las próximas 24 horas</li>
                    <li>• Revisar carga de trabajo y redistribuir si es necesario</li>
                    <li>• Ofrecer capacitación adicional o mentoring</li>
                  </ul>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Optimización de Recursos */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <TrendingUp className="h-5 w-5 text-blue-500 mr-2" />
          Optimización de Recursos
        </h3>
        
        <div className="space-y-4">
          {predictions.resourceOptimization.map((recommendation, index) => (
            <div key={index} className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start justify-between mb-2">
                <h4 className="font-medium text-blue-900">{recommendation.area}</h4>
                <div className="text-right">
                  <div className="text-lg font-bold text-blue-600">+{recommendation.impact}%</div>
                  <div className="text-sm text-blue-600">Impacto estimado</div>
                </div>
              </div>
              <p className="text-blue-800 text-sm">{recommendation.recommendation}</p>
              
              <div className="mt-3 pt-3 border-t border-blue-200">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <div className="font-medium text-blue-900">Tiempo de implementación:</div>
                    <div className="text-blue-700">2-4 semanas</div>
                  </div>
                  <div>
                    <div className="font-medium text-blue-900">Recursos necesarios:</div>
                    <div className="text-blue-700">Medio</div>
                  </div>
                  <div>
                    <div className="font-medium text-blue-900">Prioridad:</div>
                    <div className="text-blue-700">
                      {recommendation.impact >= 30 ? 'Alta' : recommendation.impact >= 20 ? 'Media' : 'Baja'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Patrones Identificados */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Brain className="h-5 w-5 text-purple-500 mr-2" />
          Patrones Identificados por IA
        </h3>
        
        <div className="space-y-4">
          {predictions.patterns.map((pattern, index) => (
            <div key={index} className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
              <div className="flex items-start justify-between mb-2">
                <h4 className="font-medium text-purple-900">{pattern.pattern}</h4>
                <div className="text-right">
                  <div className={`text-lg font-bold ${getConfidenceColor(pattern.confidence)}`}>
                    {pattern.confidence}%
                  </div>
                  <div className="text-sm text-purple-600">Confianza</div>
                </div>
              </div>
              <p className="text-purple-800 text-sm">{pattern.description}</p>
              
              <div className="mt-3 flex items-center">
                <Lightbulb className="h-4 w-4 text-purple-500 mr-2" />
                <span className="text-sm font-medium text-purple-900">
                  Aplicar este insight puede mejorar la eficiencia general
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Predicciones de Crecimiento */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h4 className="font-medium text-gray-900 mb-4">Proyección de Crecimiento</h4>
          <div className="space-y-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-3xl font-bold text-green-600">+18%</div>
              <div className="text-sm text-green-700">Crecimiento proyectado próximos 30 días</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-3xl font-bold text-blue-600">+45%</div>
              <div className="text-sm text-blue-700">Crecimiento proyectado próximos 90 días</div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h4 className="font-medium text-gray-900 mb-4">Factores de Éxito</h4>
          <div className="space-y-3">
            {[
              { factor: 'Liderazgo efectivo', impact: 85 },
              { factor: 'Capacitación continua', impact: 78 },
              { factor: 'Comunicación clara', impact: 72 },
              { factor: 'Reconocimiento', impact: 68 },
            ].map((item, index) => (
              <div key={index} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>{item.factor}</span>
                  <span>{item.impact}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-linear-to-r from-primary to-secondary h-2 rounded-full"
                    style={{ width: `${item.impact}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recomendaciones Estratégicas */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recomendaciones Estratégicas Basadas en IA</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-linear-to-r from-primary to-secondary text-white rounded-lg">
            <h4 className="font-medium mb-2">Acción Inmediata</h4>
            <p className="text-sm opacity-90">
              Implementar programa de retención para personas en riesgo alto. 
              Contacto directo en las próximas 48 horas.
            </p>
          </div>
          
          <div className="p-4 bg-linear-to-r from-accent to-neutral text-white rounded-lg">
            <h4 className="font-medium mb-2">Mediano Plazo</h4>
            <p className="text-sm opacity-90">
              Desarrollar programa de capacitación basado en patrones de éxito identificados. 
              Implementar en 2-4 semanas.
            </p>
          </div>
          
          <div className="p-4 bg-linear-to-r from-secondary to-accent text-white rounded-lg">
            <h4 className="font-medium mb-2">Largo Plazo</h4>
            <p className="text-sm opacity-90">
              Establecer sistema de monitoreo predictivo automatizado para 
              identificar riesgos tempranamente.
            </p>
          </div>
          
          <div className="p-4 bg-linear-to-r from-neutral to-primary text-white rounded-lg">
            <h4 className="font-medium mb-2">Optimización Continua</h4>
            <p className="text-sm opacity-90">
              Revisar y ajustar modelos predictivos mensualmente basado en 
              nuevos datos y resultados obtenidos.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PredictiveAnalytics;