import React from 'react';
import { Target, Calendar, TrendingUp, Award, AlertCircle } from 'lucide-react';
import { Analytics } from '../../../types';

interface GoalsAndObjectivesProps {
  analytics: Analytics;
}

const GoalsAndObjectives: React.FC<GoalsAndObjectivesProps> = ({ analytics }) => {
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
      {/* Progreso General */}
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
            className="bg-linear-to-r from-primary to-secondary h-4 rounded-full transition-all duration-1000 relative"
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
            <strong>Ritmo actual:</strong> {Math.round((goals.overallProgress.current / new Date().getMonth() + 1) * 12)} ciudadanos/año proyectados
          </div>
        </div>
      </div>

      {/* Hitos y Milestones */}
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

      {/* Metas Individuales por Líder */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Metas Individuales por Líder</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {goals.individualGoals.map((goal) => {
            const percentage = (goal.current / goal.target) * 100;
            return (
              <div key={goal.id} className={`p-4 rounded-lg border ${getStatusColor(goal.status)}`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="font-medium text-gray-900">{goal.name}</div>
                  <div className="flex items-center">
                    {getStatusIcon(goal.status)}
                    <span className="ml-1 text-xs font-medium">{getStatusText(goal.status)}</span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progreso:</span>
                    <span>{goal.current} / {goal.target}</span>
                  </div>
                  
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-500 ${
                        goal.status === 'ahead' ? 'bg-green-500' :
                        goal.status === 'on-track' ? 'bg-blue-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${Math.min(percentage, 100)}%` }}
                    ></div>
                  </div>
                  
                  <div className="text-center">
                    <span className="text-lg font-bold">{percentage.toFixed(1)}%</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Análisis de Rendimiento */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h4 className="font-medium text-gray-900 mb-4 flex items-center">
            <Award className="h-4 w-4 text-green-500 mr-2" />
            Líderes Adelantados
          </h4>
          <div className="text-3xl font-bold text-green-600 mb-2">
            {goals.individualGoals.filter(g => g.status === 'ahead').length}
          </div>
          <div className="text-sm text-gray-600">
            {((goals.individualGoals.filter(g => g.status === 'ahead').length / goals.individualGoals.length) * 100).toFixed(1)}% del total
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h4 className="font-medium text-gray-900 mb-4 flex items-center">
            <TrendingUp className="h-4 w-4 text-blue-500 mr-2" />
            En Progreso
          </h4>
          <div className="text-3xl font-bold text-blue-600 mb-2">
            {goals.individualGoals.filter(g => g.status === 'on-track').length}
          </div>
          <div className="text-sm text-gray-600">
            {((goals.individualGoals.filter(g => g.status === 'on-track').length / goals.individualGoals.length) * 100).toFixed(1)}% del total
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h4 className="font-medium text-gray-900 mb-4 flex items-center">
            <AlertCircle className="h-4 w-4 text-red-500 mr-2" />
            Necesitan Apoyo
          </h4>
          <div className="text-3xl font-bold text-red-600 mb-2">
            {goals.individualGoals.filter(g => g.status === 'behind').length}
          </div>
          <div className="text-sm text-gray-600">
            {((goals.individualGoals.filter(g => g.status === 'behind').length / goals.individualGoals.length) * 100).toFixed(1)}% del total
          </div>
        </div>
      </div>

      {/* Recomendaciones Estratégicas */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recomendaciones Estratégicas</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {goals.individualGoals.filter(g => g.status === 'behind').length > 0 && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <h4 className="font-medium text-red-900 mb-2">Acción Inmediata Requerida</h4>
              <p className="text-sm text-red-800">
                {goals.individualGoals.filter(g => g.status === 'behind').length} líderes están retrasados. 
                Implementar plan de apoyo y redistribución de recursos.
              </p>
            </div>
          )}
          
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Optimización de Recursos</h4>
            <p className="text-sm text-blue-800">
              Redistribuir brigadistas de líderes adelantados hacia aquellos que necesitan apoyo.
            </p>
          </div>
          
          {goals.overallProgress.percentage > 100 && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <h4 className="font-medium text-green-900 mb-2">Meta Superada</h4>
              <p className="text-sm text-green-800">
                ¡Felicitaciones! Se ha superado la meta anual. Considerar establecer objetivos más ambiciosos.
              </p>
            </div>
          )}
          
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h4 className="font-medium text-yellow-900 mb-2">Planificación Q4</h4>
            <p className="text-sm text-yellow-800">
              Preparar estrategia intensiva para el último trimestre y asegurar cumplimiento de metas anuales.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GoalsAndObjectives;