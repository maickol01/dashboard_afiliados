import React, { useState } from 'react';
import { 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  Clock, 
  AlertCircle, 
  CheckCircle, 
  Activity,
  X,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { RealTimeStatus } from '../../hooks/useRealTimeUpdates';
import { UpdateEvent } from '../../services/realTimeUpdateService';

interface RealTimeIndicatorProps {
  status: RealTimeStatus;
  recentUpdates: UpdateEvent[];
  onRefresh?: () => void;
  onCheckConnection?: () => Promise<boolean>;
  onClearError?: () => void;
  onClearUpdates?: () => void;
}

const RealTimeIndicator: React.FC<RealTimeIndicatorProps> = ({
  status,
  recentUpdates,
  onRefresh,
  onCheckConnection,
  onClearError,
  onClearUpdates
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isCheckingConnection, setIsCheckingConnection] = useState(false);

  const handleCheckConnection = async () => {
    if (!onCheckConnection) return;
    
    setIsCheckingConnection(true);
    try {
      await onCheckConnection();
    } finally {
      setIsCheckingConnection(false);
    }
  };

  const getStatusColor = () => {
    if (status.error) return 'text-red-500';
    if (!status.isConnected) return 'text-yellow-500';
    if (status.isRefreshing) return 'text-blue-500';
    return 'text-green-500';
  };

  const getStatusIcon = () => {
    if (status.error) return AlertCircle;
    if (!status.isConnected) return WifiOff;
    if (status.isRefreshing) return RefreshCw;
    return Wifi;
  };

  const getStatusText = () => {
    if (status.error) return 'Error en tiempo real';
    if (!status.isConnected) return 'Desconectado';
    if (status.isRefreshing) return 'Actualizando...';
    return 'Conectado';
  };

  const formatTime = (date: Date | null) => {
    if (!date) return 'Nunca';
    return date.toLocaleTimeString('es-ES', { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    });
  };

  const formatEventType = (eventType: string) => {
    switch (eventType) {
      case 'INSERT': return 'Nuevo registro';
      case 'UPDATE': return 'Actualización';
      case 'DELETE': return 'Eliminación';
      default: return eventType;
    }
  };

  const formatTableName = (tableName: string) => {
    switch (tableName) {
      case 'lideres': return 'Líderes';
      case 'brigadistas': return 'Brigadistas';
      case 'movilizadores': return 'Movilizadores';
      case 'ciudadanos': return 'Ciudadanos';
      default: return tableName;
    }
  };

  const StatusIcon = getStatusIcon();

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
      {/* Main Status Bar */}
      <div className="flex items-center justify-between p-3">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <StatusIcon 
              className={`h-5 w-5 ${getStatusColor()} ${status.isRefreshing ? 'animate-spin' : ''}`} 
            />
            <span className="text-sm font-medium text-gray-900">
              {getStatusText()}
            </span>
          </div>
          
          {status.lastUpdateTime && (
            <div className="flex items-center space-x-1 text-xs text-gray-500">
              <Clock className="h-3 w-3" />
              <span>Última actualización: {formatTime(status.lastUpdateTime)}</span>
            </div>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {/* Queue indicator */}
          {status.queuedUpdates > 0 && (
            <div className="flex items-center space-x-1 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
              <Activity className="h-3 w-3" />
              <span>{status.queuedUpdates} pendientes</span>
            </div>
          )}

          {/* Recent updates indicator */}
          {recentUpdates.length > 0 && (
            <div className="flex items-center space-x-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
              <CheckCircle className="h-3 w-3" />
              <span>{recentUpdates.length} recientes</span>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center space-x-1">
            {onRefresh && (
              <button
                onClick={onRefresh}
                disabled={status.isRefreshing}
                className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                title="Actualizar manualmente"
              >
                <RefreshCw className={`h-4 w-4 ${status.isRefreshing ? 'animate-spin' : ''}`} />
              </button>
            )}

            {!status.isConnected && onCheckConnection && (
              <button
                onClick={handleCheckConnection}
                disabled={isCheckingConnection}
                className="p-1 text-yellow-500 hover:text-yellow-600 disabled:opacity-50"
                title="Verificar conexión"
              >
                <Wifi className={`h-4 w-4 ${isCheckingConnection ? 'animate-pulse' : ''}`} />
              </button>
            )}

            {status.error && onClearError && (
              <button
                onClick={onClearError}
                className="p-1 text-red-500 hover:text-red-600"
                title="Limpiar error"
              >
                <X className="h-4 w-4" />
              </button>
            )}

            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 text-gray-400 hover:text-gray-600"
              title={isExpanded ? 'Contraer' : 'Expandir'}
            >
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {status.error && (
        <div className="px-3 pb-2">
          <div className="flex items-center space-x-2 text-sm text-red-600 bg-red-50 p-2 rounded">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{status.error}</span>
          </div>
        </div>
      )}

      {/* Expanded Details */}
      {isExpanded && (
        <div className="border-t border-gray-200 p-3 space-y-3">
          {/* Connection Details */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Estado de conexión:</span>
              <div className="flex items-center space-x-1 mt-1">
                <div className={`w-2 h-2 rounded-full ${status.isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className="font-medium">
                  {status.isConnected ? 'Conectado' : 'Desconectado'}
                </span>
              </div>
            </div>
            
            <div>
              <span className="text-gray-500">Intentos de reconexión:</span>
              <div className="font-medium mt-1">
                {status.reconnectAttempts}/5
              </div>
            </div>
          </div>

          {/* Recent Updates */}
          {recentUpdates.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">
                  Actualizaciones recientes
                </span>
                {onClearUpdates && (
                  <button
                    onClick={onClearUpdates}
                    className="text-xs text-gray-500 hover:text-gray-700"
                  >
                    Limpiar
                  </button>
                )}
              </div>
              
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {recentUpdates.slice(0, 5).map((update, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between text-xs p-2 bg-gray-50 rounded"
                  >
                    <div className="flex items-center space-x-2">
                      <div className={`w-1.5 h-1.5 rounded-full ${
                        update.eventType === 'INSERT' ? 'bg-green-500' :
                        update.eventType === 'UPDATE' ? 'bg-blue-500' :
                        'bg-red-500'
                      }`} />
                      <span className="font-medium">
                        {formatTableName(update.table)}
                      </span>
                      <span className="text-gray-500">
                        {formatEventType(update.eventType)}
                      </span>
                    </div>
                    <span className="text-gray-400">
                      {formatTime(update.timestamp)}
                    </span>
                  </div>
                ))}
              </div>
              
              {recentUpdates.length > 5 && (
                <div className="text-xs text-gray-500 text-center mt-1">
                  +{recentUpdates.length - 5} más...
                </div>
              )}
            </div>
          )}

          {/* No Recent Updates */}
          {recentUpdates.length === 0 && (
            <div className="text-sm text-gray-500 text-center py-2">
              No hay actualizaciones recientes
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RealTimeIndicator;