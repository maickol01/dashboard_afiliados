import React, { useState, useMemo } from 'react';
import { AlertTriangle, CheckCircle, Bell, X, Award, Clock, TrendingDown, Users, Database } from 'lucide-react';
import { Analytics, Person } from '../../../types';

interface AlertsPanelProps {
  analytics: Analytics;
  hierarchicalData?: Person[];
}

export type AlertCategory = 'all' | 'critical' | 'warnings' | 'achievements';

interface EnhancedAlert {
  id: string;
  message: string;
  type: 'performance' | 'inactivity' | 'goal' | 'quality';
  category: 'critical' | 'warning' | 'achievement';
  date: Date;
  priority: number;
  actionable: boolean;
  details?: string;
  affectedCount?: number;
}

// Helper function to get all people from hierarchical data
const getAllPeopleFlat = (hierarchicalData: Person[]): Person[] => {
  const result: Person[] = [];
  const stack: Person[] = [...hierarchicalData];
  
  while (stack.length > 0) {
    const person = stack.pop()!;
    result.push(person);
    
    if (person.children && person.children.length > 0) {
      stack.push(...person.children);
    }
  }
  
  return result;
};

// Helper function to get all people in a specific person's hierarchy
const getAllPeopleInHierarchy = (person: Person): Person[] => {
  const result: Person[] = [person];
  
  if (person.children && person.children.length > 0) {
    person.children.forEach(child => {
      result.push(...getAllPeopleInHierarchy(child));
    });
  }
  
  return result;
};

// Helper function to find duplicates
const findDuplicates = (people: Person[], field: keyof Person): string[] => {
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  
  people.forEach(person => {
    const value = person[field];
    if (value && String(value).trim() !== '') {
      const strValue = String(value);
      if (seen.has(strValue)) {
        duplicates.add(strValue);
      } else {
        seen.add(strValue);
      }
    }
  });
  
  return Array.from(duplicates);
};

const AlertsPanel: React.FC<AlertsPanelProps> = ({ analytics, hierarchicalData = [] }) => {
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());
  const [selectedCategory, setSelectedCategory] = useState<AlertCategory>('all');

  // Generate enhanced real-time alerts from database activity
  const enhancedAlerts = useMemo(() => {
    const alerts: EnhancedAlert[] = [];
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Get all people from hierarchical data
    const allPeople = getAllPeopleFlat(hierarchicalData);
    const leaders = hierarchicalData;
    const brigadistas = allPeople.filter(p => p.role === 'brigadista');
    const movilizadores = allPeople.filter(p => p.role === 'movilizador');
    const ciudadanos = allPeople.filter(p => p.role === 'ciudadano');

    // 1. Enhanced Inactivity Detection Alerts based on real database timestamps
    const inactiveLeaders = leaders.filter(leader => {
      const lastActivity = leader.lastActivity || leader.created_at;
      return lastActivity < sevenDaysAgo;
    });

    inactiveLeaders.forEach((leader) => {
      const lastActivity = leader.lastActivity || leader.created_at;
      const daysSinceActivity = Math.floor((now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24));
      
      // Check if leader has any recent registrations in their hierarchy
      const hasRecentActivity = getAllPeopleInHierarchy(leader).some(person => 
        person.created_at >= sevenDaysAgo
      );

      if (!hasRecentActivity) {
        alerts.push({
          id: `inactive-leader-${leader.id}`,
          message: `${leader.name} sin actividad por ${daysSinceActivity} días`,
          type: 'inactivity',
          category: daysSinceActivity > 14 ? 'critical' : 'warning',
          date: now,
          priority: daysSinceActivity > 14 ? 10 : 7,
          actionable: true,
          details: `Último registro: ${lastActivity.toLocaleDateString('es-ES')}. Sin nuevos ciudadanos registrados.`,
          affectedCount: 1
        });
      }
    });

    // Inactivity alerts for brigadistas and movilizadores
    const inactiveBrigadistas = brigadistas.filter(brigadista => {
      const lastActivity = brigadista.lastActivity || brigadista.created_at;
      const hasRecentRegistrations = getAllPeopleInHierarchy(brigadista).some(person => 
        person.created_at >= sevenDaysAgo
      );
      return lastActivity < fourteenDaysAgo && !hasRecentRegistrations;
    });

    inactiveBrigadistas.slice(0, 5).forEach((brigadista) => {
      const daysSinceActivity = Math.floor((now.getTime() - (brigadista.lastActivity || brigadista.created_at).getTime()) / (1000 * 60 * 60 * 24));
      alerts.push({
        id: `inactive-brigadista-${brigadista.id}`,
        message: `Brigadista ${brigadista.name} inactivo por ${daysSinceActivity} días`,
        type: 'inactivity',
        category: 'warning',
        date: now,
        priority: 6,
        actionable: true,
        details: `Sin registros nuevos desde ${(brigadista.lastActivity || brigadista.created_at).toLocaleDateString('es-ES')}`,
        affectedCount: 1
      });
    });

    // 2. Performance Alerts for Underperforming Leaders/Brigadiers
    const underperformingLeaders = leaders.filter(leader => 
      leader.registeredCount < 10 && leader.created_at < thirtyDaysAgo
    );

    underperformingLeaders.forEach(leader => {
      alerts.push({
        id: `underperform-leader-${leader.id}`,
        message: `${leader.name} con rendimiento bajo (${leader.registeredCount} ciudadanos)`,
        type: 'performance',
        category: leader.registeredCount === 0 ? 'critical' : 'warning',
        date: now,
        priority: leader.registeredCount === 0 ? 9 : 6,
        actionable: true,
        details: `Meta esperada: 50 ciudadanos. Actual: ${leader.registeredCount}`,
        affectedCount: 1
      });
    });

    const underperformingBrigadistas = brigadistas.filter(brigadista => 
      brigadista.registeredCount < 5 && brigadista.created_at < thirtyDaysAgo
    );

    underperformingBrigadistas.slice(0, 3).forEach(brigadista => {
      alerts.push({
        id: `underperform-brigadista-${brigadista.id}`,
        message: `Brigadista ${brigadista.name} necesita apoyo (${brigadista.registeredCount} ciudadanos)`,
        type: 'performance',
        category: 'warning',
        date: now,
        priority: 5,
        actionable: true,
        details: `Rendimiento por debajo del promedio esperado`,
        affectedCount: 1
      });
    });

    // 3. Data Quality Alerts
    const incompleteRecords = allPeople.filter(person => {
      const requiredFields = ['nombre', 'clave_electoral', 'curp', 'seccion', 'entidad'];
      return requiredFields.some(field => !person[field as keyof Person] || String(person[field as keyof Person]).trim() === '');
    });

    if (incompleteRecords.length > 0) {
      const percentage = (incompleteRecords.length / allPeople.length) * 100;
      alerts.push({
        id: 'incomplete-data',
        message: `${incompleteRecords.length} registros con datos incompletos (${percentage.toFixed(1)}%)`,
        type: 'quality',
        category: percentage > 20 ? 'critical' : 'warning',
        date: now,
        priority: percentage > 20 ? 8 : 4,
        actionable: true,
        details: 'Campos faltantes: CURP, Clave Electoral, Sección, Entidad',
        affectedCount: incompleteRecords.length
      });
    }

    // 4. Verification Rate Alerts (only for ciudadanos)
    const unverifiedCiudadanos = ciudadanos.filter(c => !c.num_verificado);
    const verificationRate = ciudadanos.length > 0 ? ((ciudadanos.length - unverifiedCiudadanos.length) / ciudadanos.length) * 100 : 0;

    if (verificationRate < 70 && ciudadanos.length > 10) {
      alerts.push({
        id: 'low-verification',
        message: `Tasa de verificación baja: ${verificationRate.toFixed(1)}%`,
        type: 'quality',
        category: verificationRate < 50 ? 'critical' : 'warning',
        date: now,
        priority: verificationRate < 50 ? 8 : 5,
        actionable: true,
        details: `${unverifiedCiudadanos.length} ciudadanos sin verificar de ${ciudadanos.length} total`,
        affectedCount: unverifiedCiudadanos.length
      });
    }

    // 5. Goal Achievement Warnings
    const totalCitizens = ciudadanos.length;
    const overallTarget = 5000;
    const progressPercentage = (totalCitizens / overallTarget) * 100;

    if (progressPercentage < 20) {
      alerts.push({
        id: 'goal-behind',
        message: `Meta anual en riesgo: ${progressPercentage.toFixed(1)}% completado`,
        type: 'goal',
        category: progressPercentage < 10 ? 'critical' : 'warning',
        date: now,
        priority: progressPercentage < 10 ? 9 : 6,
        actionable: true,
        details: `${totalCitizens} de ${overallTarget} ciudadanos registrados`,
        affectedCount: overallTarget - totalCitizens
      });
    }

    // 6. Duplicate Detection Alerts
    const duplicateCurps = findDuplicates(allPeople, 'curp');
    const duplicateClaves = findDuplicates(allPeople, 'clave_electoral');

    if (duplicateCurps.length > 0) {
      alerts.push({
        id: 'duplicate-curps',
        message: `${duplicateCurps.length} CURPs duplicados detectados`,
        type: 'quality',
        category: duplicateCurps.length > 5 ? 'critical' : 'warning',
        date: now,
        priority: duplicateCurps.length > 5 ? 7 : 4,
        actionable: true,
        details: 'Revisar y corregir registros duplicados',
        affectedCount: duplicateCurps.length
      });
    }

    if (duplicateClaves.length > 0) {
      alerts.push({
        id: 'duplicate-claves',
        message: `${duplicateClaves.length} Claves Electorales duplicadas`,
        type: 'quality',
        category: 'warning',
        date: now,
        priority: 4,
        actionable: true,
        details: 'Verificar autenticidad de registros',
        affectedCount: duplicateClaves.length
      });
    }

    // 7. Achievement Alerts
    const highPerformers = leaders.filter(leader => leader.registeredCount >= 50);
    highPerformers.forEach(leader => {
      alerts.push({
        id: `achievement-${leader.id}`,
        message: `¡${leader.name} superó su meta con ${leader.registeredCount} ciudadanos!`,
        type: 'performance',
        category: 'achievement',
        date: now,
        priority: 3,
        actionable: false,
        details: 'Reconocer el excelente desempeño',
        affectedCount: leader.registeredCount
      });
    });

    // 8. Recent Activity Surge Alert
    const recentRegistrations = allPeople.filter(p => p.created_at >= sevenDaysAgo);
    if (recentRegistrations.length > 100) {
      alerts.push({
        id: 'activity-surge',
        message: `¡Incremento significativo! ${recentRegistrations.length} registros en 7 días`,
        type: 'performance',
        category: 'achievement',
        date: now,
        priority: 2,
        actionable: false,
        details: 'Mantener el momentum actual',
        affectedCount: recentRegistrations.length
      });
    }

    // 9. Goal Progress Alerts based on current progress
    leaders.forEach(leader => {
      const progressPercentage = (leader.registeredCount / 50) * 100;
      const daysSinceCreation = Math.floor((now.getTime() - leader.created_at.getTime()) / (1000 * 60 * 60 * 24));
      
      // Alert for leaders who are behind schedule
      if (daysSinceCreation > 30 && progressPercentage < 50) {
        alerts.push({
          id: `goal-behind-${leader.id}`,
          message: `${leader.name} está retrasado en su meta (${progressPercentage.toFixed(1)}%)`,
          type: 'goal',
          category: progressPercentage < 25 ? 'critical' : 'warning',
          date: now,
          priority: progressPercentage < 25 ? 8 : 5,
          actionable: true,
          details: `${leader.registeredCount} de 50 ciudadanos registrados en ${daysSinceCreation} días`,
          affectedCount: 50 - leader.registeredCount
        });
      }
      
      // Alert for leaders close to achieving their goal
      if (progressPercentage >= 80 && progressPercentage < 100) {
        alerts.push({
          id: `goal-close-${leader.id}`,
          message: `${leader.name} cerca de su meta (${progressPercentage.toFixed(1)}%)`,
          type: 'goal',
          category: 'achievement',
          date: now,
          priority: 3,
          actionable: false,
          details: `Solo faltan ${50 - leader.registeredCount} ciudadanos para completar la meta`,
          affectedCount: 50 - leader.registeredCount
        });
      }
    });

    // 10. Data Quality Alerts for missing contact information
    const missingContactInfo = allPeople.filter(person => 
      !person.numero_cel || person.numero_cel.trim() === ''
    );

    if (missingContactInfo.length > 0) {
      const percentage = (missingContactInfo.length / allPeople.length) * 100;
      if (percentage > 15) {
        alerts.push({
          id: 'missing-contact',
          message: `${missingContactInfo.length} registros sin número de teléfono (${percentage.toFixed(1)}%)`,
          type: 'quality',
          category: percentage > 30 ? 'critical' : 'warning',
          date: now,
          priority: percentage > 30 ? 7 : 4,
          actionable: true,
          details: 'Información de contacto incompleta afecta la comunicación',
          affectedCount: missingContactInfo.length
        });
      }
    }

    // 11. Geographic Coverage Alerts
    const entidadCounts = allPeople.reduce((acc, person) => {
      if (person.entidad) {
        acc[person.entidad] = (acc[person.entidad] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    const lowCoverageEntidades = Object.entries(entidadCounts)
      .filter(([, count]) => count < 10)
      .slice(0, 3);

    lowCoverageEntidades.forEach(([entidad, count]) => {
      alerts.push({
        id: `low-coverage-${entidad}`,
        message: `Baja cobertura en ${entidad} (${count} registros)`,
        type: 'goal',
        category: 'warning',
        date: now,
        priority: 4,
        actionable: true,
        details: 'Considerar estrategias de expansión territorial',
        affectedCount: count
      });
    });

    // 12. Temporal Pattern Alerts - Unusual registration patterns
    const todayRegistrations = allPeople.filter(p => {
      const today = new Date();
      return p.created_at.toDateString() === today.toDateString();
    }).length;

    const yesterdayRegistrations = allPeople.filter(p => {
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      return p.created_at.toDateString() === yesterday.toDateString();
    }).length;

    // Alert for significant drop in daily registrations
    if (yesterdayRegistrations > 10 && todayRegistrations < yesterdayRegistrations * 0.5) {
      alerts.push({
        id: 'registration-drop',
        message: `Caída significativa en registros diarios (${todayRegistrations} vs ${yesterdayRegistrations} ayer)`,
        type: 'performance',
        category: 'warning',
        date: now,
        priority: 6,
        actionable: true,
        details: 'Investigar posibles causas de la disminución',
        affectedCount: yesterdayRegistrations - todayRegistrations
      });
    }

    // 13. Hierarchy Balance Alerts
    const averageCiudadanosPorMovilizador = movilizadores.length > 0 ? 
      ciudadanos.length / movilizadores.length : 0;

    const unbalancedMovilizadores = movilizadores.filter(movilizador => 
      movilizador.registeredCount > averageCiudadanosPorMovilizador * 2 ||
      (movilizador.registeredCount === 0 && movilizador.created_at < sevenDaysAgo)
    );

    if (unbalancedMovilizadores.length > 0) {
      const overloaded = unbalancedMovilizadores.filter(m => m.registeredCount > averageCiudadanosPorMovilizador * 2);
      const inactive = unbalancedMovilizadores.filter(m => m.registeredCount === 0);

      if (overloaded.length > 0) {
        alerts.push({
          id: 'overloaded-movilizadores',
          message: `${overloaded.length} movilizadores sobrecargados`,
          type: 'performance',
          category: 'warning',
          date: now,
          priority: 5,
          actionable: true,
          details: `Promedio: ${averageCiudadanosPorMovilizador.toFixed(1)} ciudadanos por movilizador`,
          affectedCount: overloaded.length
        });
      }

      if (inactive.length > 0) {
        alerts.push({
          id: 'inactive-movilizadores',
          message: `${inactive.length} movilizadores sin ciudadanos registrados`,
          type: 'performance',
          category: 'warning',
          date: now,
          priority: 6,
          actionable: true,
          details: 'Requieren capacitación o reasignación',
          affectedCount: inactive.length
        });
      }
    }

    // Sort by priority (higher priority first) and date
    return alerts.sort((a, b) => {
      if (a.priority !== b.priority) return b.priority - a.priority;
      return b.date.getTime() - a.date.getTime();
    });
  }, [hierarchicalData]);

  const dismissAlert = (alertId: string) => {
    setDismissedAlerts(prev => new Set([...prev, alertId]));
  };

  const getAlertIcon = (type: string, category: string) => {
    if (category === 'achievement') return <Award className="h-5 w-5 text-green-500" />;
    
    switch (type) {
      case 'inactivity': return <Clock className="h-5 w-5 text-orange-500" />;
      case 'performance': return <TrendingDown className="h-5 w-5 text-red-500" />;
      case 'quality': return <Database className="h-5 w-5 text-yellow-500" />;
      case 'goal': return <Users className="h-5 w-5 text-blue-500" />;
      default: return <Bell className="h-5 w-5 text-gray-500" />;
    }
  };

  const getAlertStyle = (category: string) => {
    switch (category) {
      case 'critical': return 'bg-red-50 border-red-200 text-red-800';
      case 'warning': return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'achievement': return 'bg-green-50 border-green-200 text-green-800';
      default: return 'bg-blue-50 border-blue-200 text-blue-800';
    }
  };

  const filteredAlerts = enhancedAlerts.filter(alert => {
    if (dismissedAlerts.has(alert.id)) return false;
    if (selectedCategory === 'all') return true;
    return alert.category === selectedCategory;
  });

  const alertCounts = {
    critical: enhancedAlerts.filter(a => a.category === 'critical' && !dismissedAlerts.has(a.id)).length,
    warnings: enhancedAlerts.filter(a => a.category === 'warning' && !dismissedAlerts.has(a.id)).length,
    achievements: enhancedAlerts.filter(a => a.category === 'achievement' && !dismissedAlerts.has(a.id)).length,
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
        {filteredAlerts.length === 0 ? (
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
          filteredAlerts.map((alert) => (
            <div key={alert.id} className={`p-4 rounded-lg border ${getAlertStyle(alert.category)}`}>
              <div className="flex items-start justify-between">
                <div className="flex items-start">
                  {getAlertIcon(alert.type, alert.category)}
                  <div className="ml-3 flex-1">
                    <div className="font-medium">{alert.message}</div>
                    <div className="text-sm opacity-75 mt-1">
                      {alert.date.toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                    {alert.details && (
                      <div className="text-sm opacity-75 mt-1">
                        {alert.details}
                      </div>
                    )}
                    <div className="flex items-center gap-4 mt-2">
                      <div className="text-xs opacity-75 capitalize">
                        Tipo: {alert.type}
                      </div>
                      {alert.affectedCount && (
                        <div className="text-xs opacity-75">
                          Afectados: {alert.affectedCount}
                        </div>
                      )}
                      <div className="text-xs opacity-75">
                        Prioridad: {alert.priority}
                      </div>
                      {alert.actionable && (
                        <div className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          Requiere acción
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => dismissAlert(alert.id)}
                  className="ml-4 p-1 rounded-full hover:bg-black hover:bg-opacity-10 transition-colors"
                  title="Descartar alerta"
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