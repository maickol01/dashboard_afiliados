import React, { useState } from 'react';
import { AlertTriangle, CheckCircle, Bell, X, Award } from 'lucide-react';
import { Analytics } from '../../../types';

interface AlertsPanelProps {
  analytics: Analytics;
}

export type AlertCategory = 'all' | 'critical' | 'warnings' | 'achievements';

const AlertsPanel: React.FC<AlertsPanelProps> = ({ analytics }) => {
  const { alerts } = analytics;
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'critical' | 'warnings' | 'achievements'>('all');

  const dismissAlert = (alertId: string) => {
    setDismissedAlerts(prev => new Set([...prev, alertId]));
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'critical': return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case 'warning': return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'achievement': return <Award className="h-5 w-5 text-green-500" />;
      default: return <Bell className="h-5 w-5 text-blue-500" />;
    }
  };

  const getAlertStyle = (type: string) => {
    switch (type) {
      case 'critical': return 'bg-red-50 border-red-200 text-red-800';
      case 'warning': return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'achievement': return 'bg-green-50 border-green-200 text-green-800';
      default: return 'bg-blue-50 border-blue-200 text-blue-800';
    }
  };

  const filteredAlerts = () => {
    const allAlerts: Array<{ id: string; message: string; date?: string; type?: string; category: string }> = [];
    
    if (selectedCategory === 'all' || selectedCategory === 'critical') {
      allAlerts.push(...alerts.critical.map(alert => ({ ...alert, category: 'critical' })));
    }
    if (selectedCategory === 'all' || selectedCategory === 'warnings') {
      allAlerts.push(...alerts.warnings.map(alert => ({ ...alert, category: 'warning' })));
    }
    if (selectedCategory === 'all' || selectedCategory === 'achievements') {
      allAlerts.push(...alerts.achievements.map(alert => ({ ...alert, category: 'achievement' })));
    }
    
    return allAlerts.filter(alert => !dismissedAlerts.has(alert.id));
  };

  const alertCounts = {
    critical: alerts.critical.filter(a => !dismissedAlerts.has(a.id)).length,
    warnings: alerts.warnings.filter(a => !dismissedAlerts.has(a.id)).length,
    achievements: alerts.achievements.filter(a => !dismissedAlerts.has(a.id)).length,
  };

  return (
    <div className="space-y-6">
      {/* Resumen de Alertas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {alertCounts.critical + alertCounts.warnings + alertCounts.achievements}
              </div>
              <div className="text-sm text-gray-600">Total Alertas</div>
            </div>
            <Bell className="h-8 w-8 text-gray-400" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-red-600">{alertCounts.critical}</div>
              <div className="text-sm text-gray-600">Críticas</div>
            </div>
            <AlertTriangle className="h-8 w-8 text-red-400" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-yellow-600">{alertCounts.warnings}</div>
              <div className="text-sm text-gray-600">Advertencias</div>
            </div>
            <AlertTriangle className="h-8 w-8 text-yellow-400" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-green-600">{alertCounts.achievements}</div>
              <div className="text-sm text-gray-600">Logros</div>
            </div>
            <Award className="h-8 w-8 text-green-400" />
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white p-4 rounded-lg shadow-md">
        <div className="flex flex-wrap gap-2">
          {[
            { key: 'all', label: 'Todas', count: alertCounts.critical + alertCounts.warnings + alertCounts.achievements },
            { key: 'critical', label: 'Críticas', count: alertCounts.critical },
            { key: 'warnings', label: 'Advertencias', count: alertCounts.warnings },
            { key: 'achievements', label: 'Logros', count: alertCounts.achievements },
          ].map((filter) => (
            <button
              key={filter.key}
              onClick={() => setSelectedCategory(filter.key as AlertCategory)}
              className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                selectedCategory === filter.key
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {filter.label}
              {filter.count > 0 && (
                <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
                  selectedCategory === filter.key
                    ? 'bg-white text-primary'
                    : 'bg-gray-200 text-gray-600'
                }`}>
                  {filter.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Lista de Alertas */}
      <div className="space-y-3">
        {filteredAlerts().length === 0 ? (
          <div className="bg-white p-8 rounded-lg shadow-md text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No hay alertas</h3>
            <p className="text-gray-600">
              {selectedCategory === 'all' 
                ? 'No tienes alertas pendientes en este momento.'
                : `No hay ${selectedCategory === 'critical' ? 'alertas críticas' : 
                           selectedCategory === 'warnings' ? 'advertencias' : 'logros'} pendientes.`
              }
            </p>
          </div>
        ) : (
          filteredAlerts().map((alert) => (
            <div key={alert.id} className={`p-4 rounded-lg border ${getAlertStyle(alert.category)}`}>
              <div className="flex items-start justify-between">
                <div className="flex items-start">
                  {getAlertIcon(alert.category)}
                  <div className="ml-3 flex-1">
                    <div className="font-medium">{alert.message}</div>
                    {alert.date && (
                      <div className="text-sm opacity-75 mt-1">
                        {new Date(alert.date).toLocaleDateString('es-ES', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    )}
                    {alert.type && (
                      <div className="text-xs opacity-75 mt-1 capitalize">
                        Tipo: {alert.type}
                      </div>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => dismissAlert(alert.id)}
                  className="ml-4 p-1 rounded-full hover:bg-black hover:bg-opacity-10 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Configuración de Alertas */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Configuración de Alertas</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900">Alertas de Rendimiento</h4>
            <label className="flex items-center">
              <input type="checkbox" defaultChecked className="rounded border-gray-300 text-primary focus:ring-primary" />
              <span className="ml-2 text-sm text-gray-700">Bajo rendimiento de líderes</span>
            </label>
            <label className="flex items-center">
              <input type="checkbox" defaultChecked className="rounded border-gray-300 text-primary focus:ring-primary" />
              <span className="ml-2 text-sm text-gray-700">Metas en riesgo</span>
            </label>
            <label className="flex items-center">
              <input type="checkbox" defaultChecked className="rounded border-gray-300 text-primary focus:ring-primary" />
              <span className="ml-2 text-sm text-gray-700">Inactividad prolongada</span>
            </label>
          </div>
          
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900">Alertas de Calidad</h4>
            <label className="flex items-center">
              <input type="checkbox" defaultChecked className="rounded border-gray-300 text-primary focus:ring-primary" />
              <span className="ml-2 text-sm text-gray-700">Datos incompletos</span>
            </label>
            <label className="flex items-center">
              <input type="checkbox" defaultChecked className="rounded border-gray-300 text-primary focus:ring-primary" />
              <span className="ml-2 text-sm text-gray-700">Registros duplicados</span>
            </label>
            <label className="flex items-center">
              <input type="checkbox" defaultChecked className="rounded border-gray-300 text-primary focus:ring-primary" />
              <span className="ml-2 text-sm text-gray-700">Baja verificación</span>
            </label>
          </div>
        </div>
        
        <div className="mt-6 pt-4 border-t border-gray-200">
          <h4 className="font-medium text-gray-900 mb-3">Frecuencia de Notificaciones</h4>
          <select className="block w-full md:w-auto px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary">
            <option>Tiempo real</option>
            <option>Cada hora</option>
            <option>Diariamente</option>
            <option>Semanalmente</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default AlertsPanel;