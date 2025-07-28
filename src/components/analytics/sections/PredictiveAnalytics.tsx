import React from 'react';
import { Brain, TrendingUp, Users, AlertTriangle, Lightbulb, MapPin, Calendar, Target } from 'lucide-react';
import { Analytics } from '../../../types';

interface PredictiveAnalyticsProps {
  analytics: Analytics;
}

const PredictiveAnalytics: React.FC<PredictiveAnalyticsProps> = ({ analytics }) => {
  const { predictions, temporal, geographic, efficiency, goals } = analytics;

  // Calculate electoral forecasting metrics based on real registration patterns
  const calculateRegistrationVelocity = () => {
    const recentProjections = temporal.projections?.slice(0, 7) || [];
    const avgDailyProjection = recentProjections.reduce((sum, p) => sum + p.projected, 0) / Math.max(recentProjections.length, 1);
    const currentVelocity = efficiency.registrationSpeed.average;
    
    // Calculate trend based on recent daily registrations
    const recentDays = analytics.dailyRegistrations.slice(-7);
    const firstHalf = recentDays.slice(0, 3).reduce((sum, day) => sum + day.count, 0) / 3;
    const secondHalf = recentDays.slice(-3).reduce((sum, day) => sum + day.count, 0) / 3;
    
    const trendDirection = secondHalf > firstHalf * 1.1 ? 'increasing' : 
                         secondHalf < firstHalf * 0.9 ? 'decreasing' : 'stable';
    
    return {
      current: Math.round(avgDailyProjection || currentVelocity),
      trend: trendDirection,
      confidence: recentProjections.length > 0 ? recentProjections[0].confidence : 
                 recentDays.length >= 7 ? 85 : 70,
      weeklyAverage: recentDays.reduce((sum, day) => sum + day.count, 0) / Math.max(recentDays.length, 1)
    };
  };

  // Electoral territory expansion suggestions based on coverage analysis
  const calculateTerritorialExpansion = () => {
    const lowCoverageAreas = geographic.territorialCoverage
      ?.filter(area => area.coverage < area.target)
      .sort((a, b) => (b.target - b.coverage) - (a.target - a.coverage)) // Sort by largest gap first
      .slice(0, 5) || [];

    return lowCoverageAreas.map(area => {
      const gap = area.target - area.coverage;
      const expansionPotential = Math.min(gap * 2, 100 - area.coverage); // Realistic expansion potential
      
      return {
        region: area.region,
        currentCoverage: area.coverage,
        target: area.target,
        gap,
        expansionPotential,
        priority: gap > 20 ? 'Alta' : gap > 10 ? 'Media' : 'Baja',
        estimatedTimeframe: gap > 20 ? '2-3 meses' : gap > 10 ? '1-2 meses' : '2-4 semanas',
        resourcesNeeded: Math.ceil(gap / 5) // Estimate resources needed based on coverage gap
      };
    });
  };

  const calculateChurnRiskAnalysis = () => {
    const highRiskPersons = predictions.churnRisk.filter(person => person.risk >= 70);
    const mediumRiskPersons = predictions.churnRisk.filter(person => person.risk >= 40 && person.risk < 70);
    
    return {
      highRisk: highRiskPersons.length,
      mediumRisk: mediumRiskPersons.length,
      totalAtRisk: predictions.churnRisk.length,
      riskFactors: predictions.churnRisk.reduce((factors: string[], person) => {
        person.factors.forEach(factor => {
          if (!factors.includes(factor)) factors.push(factor);
        });
        return factors;
      }, [])
    };
  };

  const calculateResourceOptimization = () => {
    const underperformers = efficiency.needsSupport.length;
    const topPerformers = efficiency.topPerformers.length;
    const avgConversionRate = efficiency.conversionByLeader.reduce((sum, leader) => sum + leader.rate, 0) / Math.max(efficiency.conversionByLeader.length, 1);
    
    return {
      redistributionNeeded: underperformers > 0,
      mentorshipOpportunities: topPerformers,
      avgPerformance: Math.round(avgConversionRate),
      improvementPotential: Math.max(0, 75 - avgConversionRate)
    };
  };

  const registrationVelocity = calculateRegistrationVelocity();
  const territorialExpansion = calculateTerritorialExpansion();
  const churnAnalysis = calculateChurnRiskAnalysis();
  const resourceOptimization = calculateResourceOptimization();

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

      {/* Velocidad de Registro y Proyecciones */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h4 className="font-medium text-gray-900 mb-4 flex items-center">
            <Calendar className="h-5 w-5 text-blue-500 mr-2" />
            Velocidad de Registro
          </h4>
          <div className="space-y-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-3xl font-bold text-blue-600">{registrationVelocity.current}</div>
              <div className="text-sm text-blue-700">Registros proyectados por día</div>
              <div className={`text-xs mt-1 ${
                registrationVelocity.trend === 'increasing' ? 'text-green-600' : 
                registrationVelocity.trend === 'decreasing' ? 'text-red-600' : 'text-gray-600'
              }`}>
                Tendencia: {registrationVelocity.trend === 'increasing' ? 'Creciente' : 
                           registrationVelocity.trend === 'decreasing' ? 'Decreciente' : 'Estable'}
              </div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{registrationVelocity.confidence}%</div>
              <div className="text-sm text-green-700">Confianza en proyección</div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h4 className="font-medium text-gray-900 mb-4 flex items-center">
            <Target className="h-5 w-5 text-purple-500 mr-2" />
            Análisis de Rendimiento
          </h4>
          <div className="space-y-4">
            <div className="p-3 bg-purple-50 rounded-lg">
              <div className="text-sm text-purple-700">Rendimiento Promedio</div>
              <div className="text-2xl font-bold text-purple-600">{resourceOptimization.avgPerformance}%</div>
            </div>
            <div className="p-3 bg-orange-50 rounded-lg">
              <div className="text-sm text-orange-700">Potencial de Mejora</div>
              <div className="text-2xl font-bold text-orange-600">+{resourceOptimization.improvementPotential}%</div>
            </div>
            {resourceOptimization.redistributionNeeded && (
              <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                <div className="text-sm text-red-700 font-medium">Redistribución Requerida</div>
                <div className="text-xs text-red-600 mt-1">Se detectaron recursos subutilizados</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Expansión Territorial Electoral */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <MapPin className="h-5 w-5 text-green-500 mr-2" />
          Sugerencias de Expansión Territorial
        </h3>
        
        {territorialExpansion.length === 0 ? (
          <div className="text-center py-8">
            <MapPin className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <p className="text-gray-600">Todas las regiones tienen cobertura adecuada</p>
            <p className="text-sm text-gray-500 mt-2">No se requiere expansión territorial inmediata</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="mb-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                Se identificaron {territorialExpansion.length} regiones con oportunidades de expansión basadas en cobertura actual vs objetivos.
              </p>
            </div>
            
            {territorialExpansion.map((area, index) => (
              <div key={index} className="p-4 border rounded-lg bg-gray-50">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-medium text-gray-900">{area.region}</h4>
                    <div className="text-sm text-gray-600">
                      Cobertura actual: {area.currentCoverage.toFixed(1)}% | Objetivo: {area.target}%
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`px-2 py-1 rounded text-xs font-medium ${
                      area.priority === 'Alta' ? 'bg-red-100 text-red-800' :
                      area.priority === 'Media' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      Prioridad {area.priority}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      Brecha: {area.gap.toFixed(1)}%
                    </div>
                  </div>
                </div>
                
                <div className="w-full bg-gray-200 rounded-full h-3 mb-3">
                  <div 
                    className="bg-gradient-to-r from-green-400 to-green-600 h-3 rounded-full"
                    style={{ width: `${Math.min(100, area.currentCoverage)}%` }}
                  ></div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700 mb-3">
                  <div>
                    <div className="font-medium">Potencial de Expansión:</div>
                    <div className="text-green-600 font-medium">+{area.expansionPotential.toFixed(1)}%</div>
                  </div>
                  <div>
                    <div className="font-medium">Tiempo Estimado:</div>
                    <div className="text-blue-600">{area.estimatedTimeframe}</div>
                  </div>
                </div>
                
                <div className="text-sm text-gray-700">
                  <div className="font-medium mb-1">Recomendaciones Estratégicas:</div>
                  <ul className="space-y-1">
                    <li>• Asignar {area.resourcesNeeded} movilizadores adicionales</li>
                    <li>• Establecer {Math.ceil(area.gap / 15)} puntos de registro estratégicos</li>
                    <li>• Implementar campaña local específica para {area.region}</li>
                    <li>• Presupuesto estimado: ${(area.resourcesNeeded * 2500).toLocaleString()} MXN</li>
                  </ul>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pronóstico de Velocidad de Registro para Planificación de Campaña */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <TrendingUp className="h-5 w-5 text-blue-500 mr-2" />
          Pronóstico de Velocidad de Registro
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="p-4 bg-blue-50 rounded-lg text-center">
            <div className="text-2xl font-bold text-blue-600">{registrationVelocity.current}</div>
            <div className="text-sm text-blue-700">Registros/día actual</div>
          </div>
          <div className="p-4 bg-green-50 rounded-lg text-center">
            <div className="text-2xl font-bold text-green-600">{Math.round(registrationVelocity.weeklyAverage)}</div>
            <div className="text-sm text-green-700">Promedio semanal</div>
          </div>
          <div className="p-4 bg-purple-50 rounded-lg text-center">
            <div className="text-2xl font-bold text-purple-600">{Math.round(registrationVelocity.current * 30)}</div>
            <div className="text-sm text-purple-700">Proyección mensual</div>
          </div>
          <div className="p-4 bg-orange-50 rounded-lg text-center">
            <div className={`text-2xl font-bold ${
              registrationVelocity.trend === 'increasing' ? 'text-green-600' : 
              registrationVelocity.trend === 'decreasing' ? 'text-red-600' : 'text-gray-600'
            }`}>
              {registrationVelocity.trend === 'increasing' ? '↗' : 
               registrationVelocity.trend === 'decreasing' ? '↘' : '→'}
            </div>
            <div className="text-sm text-orange-700">Tendencia</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Escenarios de Campaña */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-3">Escenarios de Campaña</h4>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-2 bg-green-100 rounded">
                <span className="text-sm text-green-800">Escenario Optimista (+25%)</span>
                <span className="font-medium text-green-900">{Math.round(registrationVelocity.current * 1.25 * 30)} ciudadanos/mes</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-blue-100 rounded">
                <span className="text-sm text-blue-800">Escenario Base (actual)</span>
                <span className="font-medium text-blue-900">{Math.round(registrationVelocity.current * 30)} ciudadanos/mes</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-red-100 rounded">
                <span className="text-sm text-red-800">Escenario Conservador (-15%)</span>
                <span className="font-medium text-red-900">{Math.round(registrationVelocity.current * 0.85 * 30)} ciudadanos/mes</span>
              </div>
            </div>
          </div>

          {/* Factores de Impacto */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-3">Factores de Impacto en Velocidad</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Eficiencia de líderes:</span>
                <span className={`font-medium ${resourceOptimization.avgPerformance > 60 ? 'text-green-600' : 'text-red-600'}`}>
                  {resourceOptimization.avgPerformance > 60 ? 'Positivo' : 'Negativo'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Cobertura territorial:</span>
                <span className={`font-medium ${territorialExpansion.length < 3 ? 'text-green-600' : 'text-orange-600'}`}>
                  {territorialExpansion.length < 3 ? 'Adecuada' : 'Mejorable'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Riesgo de abandono:</span>
                <span className={`font-medium ${churnAnalysis.totalAtRisk < 5 ? 'text-green-600' : 'text-red-600'}`}>
                  {churnAnalysis.totalAtRisk < 5 ? 'Bajo' : 'Alto'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Confianza en datos:</span>
                <span className={`font-medium ${getConfidenceColor(registrationVelocity.confidence).replace('text-', '')}`}>
                  {registrationVelocity.confidence}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Pronóstico de Campaña Electoral */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Calendar className="h-5 w-5 text-indigo-500 mr-2" />
          Pronóstico Electoral y Planificación
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Proyección de Registros */}
          <div className="p-4 bg-indigo-50 rounded-lg">
            <h4 className="font-medium text-indigo-900 mb-3">Proyección 30 Días</h4>
            <div className="space-y-2">
              {temporal.projections?.slice(0, 5).map((projection, index) => (
                <div key={index} className="flex justify-between text-sm">
                  <span className="text-indigo-700">
                    {new Date(projection.date).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' })}
                  </span>
                  <span className="font-medium text-indigo-900">
                    {projection.projected} ({projection.confidence}%)
                  </span>
                </div>
              )) || (
                <div className="text-indigo-700 text-sm">Calculando proyecciones...</div>
              )}
            </div>
          </div>

          {/* Metas vs Realidad */}
          <div className="p-4 bg-green-50 rounded-lg">
            <h4 className="font-medium text-green-900 mb-3">Progreso de Metas</h4>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-green-700">Meta General</span>
                  <span className="font-medium text-green-900">
                    {goals.overallProgress.percentage.toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-green-200 rounded-full h-2">
                  <div 
                    className="bg-green-600 h-2 rounded-full"
                    style={{ width: `${Math.min(100, goals.overallProgress.percentage)}%` }}
                  ></div>
                </div>
              </div>
              <div className="text-xs text-green-700">
                {goals.overallProgress.current} / {goals.overallProgress.target} ciudadanos
              </div>
            </div>
          </div>

          {/* Factores de Riesgo */}
          <div className="p-4 bg-red-50 rounded-lg">
            <h4 className="font-medium text-red-900 mb-3">Alertas de Riesgo</h4>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-red-700">Alto Riesgo</span>
                <span className="font-medium text-red-900">{churnAnalysis.highRisk}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-red-700">Riesgo Medio</span>
                <span className="font-medium text-red-900">{churnAnalysis.mediumRisk}</span>
              </div>
              <div className="text-xs text-red-700 mt-2">
                Total en riesgo: {churnAnalysis.totalAtRisk}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recomendaciones Estratégicas Basadas en Datos */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recomendaciones Estratégicas Basadas en Datos Reales</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Acción Inmediata */}
          <div className="p-4 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg">
            <h4 className="font-medium mb-2 flex items-center">
              <AlertTriangle className="h-4 w-4 mr-2" />
              Acción Inmediata
            </h4>
            <p className="text-sm opacity-90">
              {churnAnalysis.totalAtRisk > 0 
                ? `Contactar ${churnAnalysis.highRisk} personas en riesgo alto en las próximas 24 horas`
                : 'Mantener monitoreo de rendimiento actual'
              }
            </p>
            {churnAnalysis.riskFactors.length > 0 && (
              <div className="mt-2 text-xs opacity-80">
                Factores principales: {churnAnalysis.riskFactors.slice(0, 2).join(', ')}
              </div>
            )}
          </div>
          
          {/* Optimización de Recursos */}
          <div className="p-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg">
            <h4 className="font-medium mb-2 flex items-center">
              <TrendingUp className="h-4 w-4 mr-2" />
              Optimización de Recursos
            </h4>
            <p className="text-sm opacity-90">
              {resourceOptimization.redistributionNeeded 
                ? `Redistribuir recursos para mejorar rendimiento promedio del ${resourceOptimization.avgPerformance}%`
                : `Mantener distribución actual con ${resourceOptimization.avgPerformance}% de rendimiento`
              }
            </p>
            <div className="mt-2 text-xs opacity-80">
              Potencial de mejora: +{resourceOptimization.improvementPotential}%
            </div>
          </div>
          
          {/* Expansión Territorial */}
          <div className="p-4 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg">
            <h4 className="font-medium mb-2 flex items-center">
              <MapPin className="h-4 w-4 mr-2" />
              Expansión Territorial
            </h4>
            <p className="text-sm opacity-90">
              {territorialExpansion.length > 0 
                ? `Priorizar expansión en ${territorialExpansion.length} regiones con baja cobertura`
                : 'Cobertura territorial adecuada en todas las regiones'
              }
            </p>
            {territorialExpansion.length > 0 && (
              <div className="mt-2 text-xs opacity-80">
                Región prioritaria: {territorialExpansion[0]?.region}
              </div>
            )}
          </div>
          
          {/* Planificación a Largo Plazo */}
          <div className="p-4 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg">
            <h4 className="font-medium mb-2 flex items-center">
              <Brain className="h-4 w-4 mr-2" />
              Planificación Estratégica
            </h4>
            <p className="text-sm opacity-90">
              Implementar sistema de monitoreo predictivo basado en {predictions.patterns.length} patrones identificados
            </p>
            <div className="mt-2 text-xs opacity-80">
              Confianza promedio: {predictions.patterns.length > 0 
                ? Math.round(predictions.patterns.reduce((sum, p) => sum + p.confidence, 0) / predictions.patterns.length)
                : 0}%
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PredictiveAnalytics;