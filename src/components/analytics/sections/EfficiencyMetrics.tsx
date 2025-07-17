import React from 'react';
import { TrendingUp, TrendingDown, Award, AlertCircle, Clock } from 'lucide-react';
import { Analytics } from '../../../types';

interface EfficiencyMetricsProps {
  analytics: Analytics;
}

const EfficiencyMetrics: React.FC<EfficiencyMetricsProps> = ({ analytics }) => {
  const { efficiency } = analytics;

  return (
    <div className="space-y-6">
      {/* Métricas de velocidad */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Velocidad de Registro</h3>
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

      {/* Top Performers */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Award className="h-5 w-5 text-yellow-500 mr-2" />
          Top Performers
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
                <div className="text-lg font-semibold text-primary">{performer.score}</div>
                <div className="text-sm text-gray-500">Ciudadanos</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Conversión por Líder */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Conversión por Líder</h3>
        <div className="space-y-4">
          {efficiency.conversionByLeader.slice(0, 5).map((leader) => (
            <div key={leader.leaderId} className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-medium text-gray-900">{leader.name}</span>
                <span className="text-gray-600">{leader.rate.toFixed(1)}% / {leader.target}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-500 ${
                    leader.rate >= 80 ? 'bg-green-500' : leader.rate >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${Math.min(leader.rate, 100)}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Productividad por Brigadista */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Productividad por Brigadista</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {efficiency.productivityByBrigadier.slice(0, 6).map((brigadier) => (
            <div key={brigadier.brigadierId} className="p-4 border border-gray-200 rounded-lg">
              <div className="text-sm font-medium text-gray-900 mb-1">{brigadier.name}</div>
              <div className="text-2xl font-bold text-primary">{brigadier.avgCitizens}</div>
              <div className="text-sm text-gray-500">Ciudadanos registrados</div>
            </div>
          ))}
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