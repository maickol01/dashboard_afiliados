import React from 'react';
import { TrendingUp, TrendingDown, Award, AlertCircle, Clock, Users, Target } from 'lucide-react';
import { Analytics } from '../../../types';

interface EfficiencyMetricsProps {
  analytics: Analytics;
}

const EfficiencyMetrics: React.FC<EfficiencyMetricsProps> = ({ analytics }) => {
  const { efficiency } = analytics;

  // Calculate real conversion rates from database
  const overallConversionRate = analytics.totalCitizens > 0 
    ? (analytics.totalCitizens / (analytics.totalLideres + analytics.totalBrigadistas + analytics.totalMobilizers)) * 100 
    : 0;

  // Calculate productivity metrics based on actual registrations
  const avgRegistrationsPerLeader = analytics.totalLideres > 0 
    ? analytics.totalCitizens / analytics.totalLideres 
    : 0;

  const avgRegistrationsPerBrigadier = analytics.totalBrigadistas > 0 
    ? analytics.totalCitizens / analytics.totalBrigadistas 
    : 0;

  return (
    <div className="space-y-6">
      {/* Real-time Performance Overview */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Métricas de Rendimiento en Tiempo Real</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <Users className="h-8 w-8 text-blue-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-blue-600">{overallConversionRate.toFixed(1)}%</div>
            <div className="text-sm text-gray-600">Tasa de Conversión</div>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <Target className="h-8 w-8 text-green-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-green-600">{avgRegistrationsPerLeader.toFixed(1)}</div>
            <div className="text-sm text-gray-600">Ciudadanos/Líder</div>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <TrendingUp className="h-8 w-8 text-purple-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-purple-600">{avgRegistrationsPerBrigadier.toFixed(1)}</div>
            <div className="text-sm text-gray-600">Ciudadanos/Brigadista</div>
          </div>
          <div className="text-center p-4 bg-orange-50 rounded-lg">
            <Clock className="h-8 w-8 text-orange-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-orange-600">{analytics.conversionRate.toFixed(1)}%</div>
            <div className="text-sm text-gray-600">Verificación</div>
          </div>
        </div>
      </div>

      {/* Métricas de velocidad basadas en timestamps reales */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Velocidad de Registro (Basada en created_at)</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <Clock className="h-8 w-8 text-green-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-green-600">{efficiency.registrationSpeed.average.toFixed(1)}h</div>
            <div className="text-sm text-gray-600">Promedio</div>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <TrendingUp className="h-8 w-8 text-blue-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-blue-600">{efficiency.registrationSpeed.fastest.toFixed(1)}h</div>
            <div className="text-sm text-gray-600">Más Rápido</div>
          </div>
          <div className="text-center p-4 bg-red-50 rounded-lg">
            <TrendingDown className="h-8 w-8 text-red-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-red-600">{efficiency.registrationSpeed.slowest.toFixed(1)}h</div>
            <div className="text-sm text-gray-600">Más Lento</div>
          </div>
        </div>
      </div>

      {/* Top Performers basado en registros reales */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Award className="h-5 w-5 text-yellow-500 mr-2" />
          Top Performers (Registros Reales)
        </h3>
        <div className="space-y-3">
          {efficiency.topPerformers.map((performer, index) => (
            <div key={performer.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold mr-3 ${
                  index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : index === 2 ? 'bg-orange-500' : 'bg-gray-300'
                }`}>
                  {index + 1}
                </div>
                <div>
                  <div className="font-medium text-gray-900">{performer.name}</div>
                  <div className="text-sm text-gray-500 capitalize">{performer.role}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-semibold text-primary">{Math.floor(performer.score)}</div>
                <div className="text-sm text-gray-500">Ciudadanos</div>
              </div>
            </div>
          ))}
        </div>
        {efficiency.topPerformers.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Award className="h-12 w-12 mx-auto mb-2 text-gray-300" />
            <p>No hay datos de rendimiento disponibles</p>
          </div>
        )}
      </div>

      {/* Conversión por Líder basada en registros reales */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Rendimiento por Líder (Registros Reales)</h3>
        <div className="space-y-4">
          {efficiency.conversionByLeader.slice(0, 5).map((leader) => {
            const actualRegistrations = Math.floor(leader.rate); // Using rate as actual count from database
            const progressPercentage = Math.min((actualRegistrations / leader.target) * 100, 100);
            
            return (
              <div key={leader.leaderId} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-gray-900">{leader.name}</span>
                  <span className="text-gray-600">{actualRegistrations} / {leader.target} ciudadanos</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-500 ${
                      progressPercentage >= 80 ? 'bg-green-500' : progressPercentage >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${progressPercentage}%` }}
                  ></div>
                </div>
                <div className="text-xs text-gray-500">
                  {progressPercentage.toFixed(1)}% de la meta alcanzada
                </div>
              </div>
            );
          })}
        </div>
        {efficiency.conversionByLeader.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Target className="h-12 w-12 mx-auto mb-2 text-gray-300" />
            <p>No hay datos de líderes disponibles</p>
          </div>
        )}
      </div>

      {/* Productividad por Brigadista basada en registros reales */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Productividad por Brigadista (Registros Reales)</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {efficiency.productivityByBrigadier.slice(0, 6).map((brigadier) => {
            const performanceLevel = brigadier.avgCitizens >= 30 ? 'high' : brigadier.avgCitizens >= 15 ? 'medium' : 'low';
            const bgColor = performanceLevel === 'high' ? 'border-green-200 bg-green-50' : 
                           performanceLevel === 'medium' ? 'border-yellow-200 bg-yellow-50' : 
                           'border-red-200 bg-red-50';
            const textColor = performanceLevel === 'high' ? 'text-green-600' : 
                             performanceLevel === 'medium' ? 'text-yellow-600' : 
                             'text-red-600';
            
            return (
              <div key={brigadier.brigadierId} className={`p-4 border rounded-lg ${bgColor}`}>
                <div className="text-sm font-medium text-gray-900 mb-1">{brigadier.name}</div>
                <div className={`text-2xl font-bold ${textColor}`}>{brigadier.avgCitizens}</div>
                <div className="text-sm text-gray-500">Ciudadanos registrados</div>
                <div className={`text-xs mt-1 font-medium ${textColor}`}>
                  {performanceLevel === 'high' ? 'Alto rendimiento' : 
                   performanceLevel === 'medium' ? 'Rendimiento medio' : 
                   'Necesita apoyo'}
                </div>
              </div>
            );
          })}
        </div>
        {efficiency.productivityByBrigadier.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Users className="h-12 w-12 mx-auto mb-2 text-gray-300" />
            <p>No hay datos de brigadistas disponibles</p>
          </div>
        )}
      </div>

      {/* Análisis de Rendimiento por Tiempo (basado en created_at) */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Análisis Temporal de Registros</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Registros Hoy</span>
              <Clock className="h-4 w-4 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-blue-600">
              {analytics.dailyRegistrations.length > 0 ? 
                analytics.dailyRegistrations[analytics.dailyRegistrations.length - 1]?.count || 0 : 0}
            </div>
            <div className="text-xs text-gray-500">Basado en created_at</div>
          </div>
          <div className="p-4 bg-green-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Esta Semana</span>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </div>
            <div className="text-2xl font-bold text-green-600">
              {analytics.weeklyRegistrations.length > 0 ? 
                analytics.weeklyRegistrations[analytics.weeklyRegistrations.length - 1]?.count || 0 : 0}
            </div>
            <div className="text-xs text-gray-500">Últimos 7 días</div>
          </div>
          <div className="p-4 bg-purple-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Este Mes</span>
              <Target className="h-4 w-4 text-purple-600" />
            </div>
            <div className="text-2xl font-bold text-purple-600">
              {analytics.monthlyRegistrations.length > 0 ? 
                analytics.monthlyRegistrations[analytics.monthlyRegistrations.length - 1]?.count || 0 : 0}
            </div>
            <div className="text-xs text-gray-500">Últimos 30 días</div>
          </div>
        </div>
      </div>

      {/* Necesitan Apoyo */}
      {efficiency.needsSupport.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
            Necesitan Apoyo
          </h3>
          <div className="space-y-3">
            {efficiency.needsSupport.map((person) => (
              <div key={person.id} className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg">
                <div>
                  <div className="font-medium text-gray-900">{person.name}</div>
                  <div className="text-sm text-gray-500 capitalize">{person.role}</div>
                </div>
                <div className="text-sm text-red-600 font-medium">{person.issue}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default EfficiencyMetrics;