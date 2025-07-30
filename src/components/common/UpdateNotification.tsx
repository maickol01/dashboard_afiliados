import React, { useState, useEffect } from 'react';
import { CheckCircle, RefreshCw, X, Database } from 'lucide-react';
import { UpdateEvent } from '../../services/realTimeUpdateService';

interface UpdateNotificationProps {
  updates: UpdateEvent[];
  isRefreshing: boolean;
  onDismiss?: () => void;
  autoHideDelay?: number;
}

const UpdateNotification: React.FC<UpdateNotificationProps> = ({
  updates,
  isRefreshing,
  onDismiss,
  autoHideDelay = 5000
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    if (updates.length > 0 && !isDismissed) {
      setIsVisible(true);
      
      if (autoHideDelay > 0) {
        const timer = setTimeout(() => {
          setIsVisible(false);
          setTimeout(() => {
            if (onDismiss) {
              onDismiss();
            }
          }, 300); // Wait for fade out animation
        }, autoHideDelay);
        
        return () => clearTimeout(timer);
      }
    }
  }, [updates.length, isDismissed, autoHideDelay, onDismiss]);

  const handleDismiss = () => {
    setIsDismissed(true);
    setIsVisible(false);
    setTimeout(() => {
      if (onDismiss) {
        onDismiss();
      }
    }, 300);
  };

  if (updates.length === 0 || isDismissed) {
    return null;
  }

  const formatTableName = (tableName: string) => {
    switch (tableName) {
      case 'lideres': return 'Líderes';
      case 'brigadistas': return 'Brigadistas';
      case 'movilizadores': return 'Movilizadores';
      case 'ciudadanos': return 'Ciudadanos';
      default: return tableName;
    }
  };

  const getUpdateSummary = () => {
    const tableUpdates = updates.reduce((acc, update) => {
      const tableName = formatTableName(update.table);
      acc[tableName] = (acc[tableName] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const summaryParts = Object.entries(tableUpdates).map(([table, count]) => 
      `${count} ${table.toLowerCase()}`
    );

    if (summaryParts.length === 1) {
      return summaryParts[0];
    } else if (summaryParts.length === 2) {
      return summaryParts.join(' y ');
    } else {
      return `${summaryParts.slice(0, -1).join(', ')} y ${summaryParts[summaryParts.length - 1]}`;
    }
  };

  return (
    <div
      className={`fixed top-4 right-4 z-50 max-w-sm transition-all duration-300 transform ${
        isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      }`}
    >
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-4">
        <div className="flex items-start space-x-3">
          <div className="shrink-0">
            {isRefreshing ? (
              <RefreshCw className="h-5 w-5 text-blue-500 animate-spin" />
            ) : (
              <Database className="h-5 w-5 text-green-500" />
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-gray-900">
                {isRefreshing ? 'Actualizando datos...' : 'Datos actualizados'}
              </h4>
              <button
                onClick={handleDismiss}
                className="ml-2 text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            
            <p className="text-sm text-gray-600 mt-1">
              {isRefreshing ? (
                'Procesando cambios recientes en la base de datos...'
              ) : (
                `Se detectaron cambios en ${getUpdateSummary()}`
              )}
            </p>
            
            {!isRefreshing && (
              <div className="flex items-center mt-2 text-xs text-green-600">
                <CheckCircle className="h-3 w-3 mr-1" />
                <span>Analytics actualizados automáticamente</span>
              </div>
            )}
          </div>
        </div>
        
        {/* Progress indicator when refreshing */}
        {isRefreshing && (
          <div className="mt-3">
            <div className="w-full bg-gray-200 rounded-full h-1">
              <div className="bg-blue-500 h-1 rounded-full animate-pulse" style={{ width: '60%' }} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UpdateNotification;