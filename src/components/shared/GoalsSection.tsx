import React from 'react';
import { Target, Calendar, Award, TrendingUp, AlertCircle } from 'lucide-react';
import { Analytics } from '../../types';

interface GoalsSectionProps {
  analytics: Analytics;
  loading?: boolean;
}

const GoalsSection: React.FC<GoalsSectionProps> = ({ analytics, loading = false }) => {
  if (loading) {
    return (
      <div className="space-y-6">
        {/* Loading skeletons */}
        <div className="bg-white p-6 rounded-lg shadow-md animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-8 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const { goals } = analytics;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ahead': return 'text-green-600 bg-green-50 border-green-200';
      case 'on-track': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'behind': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ahead': return <Award className="h-4 w-4" />;
      case 'on-track': return <TrendingUp className="h-4 w-4" />;
      case 'behind': return <AlertCircle className="h-4 w-4" />;
      default: return <Target className="h-4 w-4" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'ahead': return 'Adelantado';
      case 'on-track': return 'En Progreso';
      case 'behind': return 'Retrasado';
      default: return 'Sin Estado';
    }
  };

  return (
    <div className="space-y-6">
      {/* Meta General del Año */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
          <Target className="h-5 w-5 text-primary mr-2" />
          Meta General del Año
        </h3>
        
        <div className="text-center mb-6">
          <div className="text-4xl font-bold text-primary mb-2">
            {goals.overallProgress.percentage.toFixed(1)}%
          </div>
          <div className="text-gray-600">
            {goals.overallProgress.current.toLocaleString()} de {goals.overallProgress.target.toLocaleString()} ciudadanos
          </div>
        </div>

        <div className="w-full bg-gray-200 rounded-full h-4 mb-4">
          <div 
            className="bg-gradient-to-r from-primary to-secondary h-4 rounded-full transition-all duration-1000 relative"
            style={{ width: `${Math.min(goals.overallProgress.percentage, 100)}%` }}
          >
            <div className="absolute right-0 top-0 h-4 w-4 bg-white rounded-full border-2 border-primary transform translate-x-1/2"></div>
          </div>
        </div>

        <div className="flex justify-between text-sm text-gray-500">
          <span>0</span>
          <span>{(goals.overallProgress.target / 2).toLocaleString()}</span>
          <span>{goals.overallProgress.target.toLocaleString()}</span>
        </div>

        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <div className="text-sm text-gray-600">
            <strong>Faltan:</strong> {(goals.overallProgress.target - goals.overallProgress.current).toLocaleString()} ciudadanos
          </div>
          <div className="text-sm text-gray-600 mt-1">
            <strong>Ritmo actual:</strong> {Math.round((goals.overallProgress.current / (new Date().getMonth() + 1)) * 12)} ciudadanos/año proyectados
          </div>
        </div>
      </div>

      {/* Hitos del Año */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Calendar className="h-5 w-5 text-secondary mr-2" />
          Hitos del Año
        </h3>
        
        <div className="space-y-4">
          {goals.milestones.map((milestone, index) => (
            <div key={index} className={`p-4 rounded-lg border ${
              milestone.completed 
                ? 'bg-green-50 border-green-200' 
                : new Date(milestone.date) < new Date() 
                  ? 'bg-red-50 border-red-200'
                  : 'bg-blue-50 border-blue-200'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-3 ${
                    milestone.completed 
                      ? 'bg-green-500 text-white' 
                      : new Date(milestone.date) < new Date()
                        ? 'bg-red-500 text-white'
                        : 'bg-blue-500 text-white'
                  }`}>
                    {milestone.completed ? '✓' : index + 1}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{milestone.description}</div>
                    <div className="text-sm text-gray-500">
                      Fecha límite: {new Date(milestone.date).toLocaleDateString('es-ES')}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold">{milestone.target.toLocaleString()}</div>
                  <div className={`text-sm ${
                    milestone.completed 
                      ? 'text-green-600' 
                      : new Date(milestone.date) < new Date()
                        ? 'text-red-600'
                        : 'text-blue-600'
                  }`}>
                    {milestone.completed 
                      ? 'Completado' 
                      : new Date(milestone.date) < new Date()
                        ? 'Vencido'
                        : 'Pendiente'
                    }
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Metas Individuales por Líder - Formato de Tabla */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Metas Individuales por Líder</h3>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Líder
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Progreso
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Meta
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Porcentaje
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {goals.individualGoals.map((goal) => {
                const percentage = (goal.current / goal.target) * 100;
                return (
                  <tr key={goal.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{goal.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{goal.current}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{goal.target}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="text-sm font-medium text-gray-900 mr-2">
                          {percentage.toFixed(1)}%
                        </div>
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full transition-all duration-500 ${
                              goal.status === 'ahead' ? 'bg-green-500' :
                              goal.status === 'on-track' ? 'bg-blue-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${Math.min(percentage, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(goal.status)}`}>
                        {getStatusIcon(goal.status)}
                        <span className="ml-1">{getStatusText(goal.status)}</span>
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default GoalsSection;