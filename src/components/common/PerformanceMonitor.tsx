import React from 'react';
import { Clock, Database, Zap, CheckCircle, AlertCircle } from 'lucide-react';

interface PerformanceMetrics {
  dataFetchTime: number;
  analyticsGenerationTime: number;
  totalRecords: number;
  cacheHit: boolean;
}

interface PerformanceMonitorProps {
  performanceMetrics: PerformanceMetrics | null;
  analyticsLoading: boolean;
  lastFetchTime: Date | null;
  onForceRefresh?: () => void;
}

const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({
  performanceMetrics,
  analyticsLoading,
  lastFetchTime,
  onForceRefresh
}) => {
  const formatTime = (ms: number): string => {
    if (ms < 1000) {
      return `${ms}ms`;
    }
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const getPerformanceStatus = (totalTime: number): 'excellent' | 'good' | 'fair' | 'poor' => {
    if (totalTime < 500) return 'excellent';
    if (totalTime < 1000) return 'good';
    if (totalTime < 2000) return 'fair';
    return 'poor';
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'excellent': return 'text-green-600 bg-green-50 border-green-200';
      case 'good': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'fair': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'poor': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  if (!performanceMetrics && !analyticsLoading) {
    return null;
  }

  const totalTime = performanceMetrics 
    ? performanceMetrics.dataFetchTime + performanceMetrics.analyticsGenerationTime 
    : 0;
  
  const status = performanceMetrics ? getPerformanceStatus(totalTime) : 'loading';

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <Zap className="h-5 w-5 mr-2 text-blue-500" />
          Rendimiento del Sistema
        </h3>
        {onForceRefresh && (
          <button
            onClick={onForceRefresh}
            className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Actualizar
          </button>
        )}
      </div>

      {analyticsLoading && (
        <div className="flex items-center p-3 bg-blue-50 border border-blue-200 rounded-md mb-4">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mr-3"></div>
          <span className="text-blue-700">Generando análisis optimizados...</span>
        </div>
      )}

      {performanceMetrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Overall Performance */}
          <div className={`p-3 rounded-lg border ${getStatusColor(status)}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Tiempo Total</p>
                <p className="text-lg font-bold">{formatTime(totalTime)}</p>
              </div>
              {status === 'excellent' ? (
                <CheckCircle className="h-6 w-6" />
              ) : (
                <AlertCircle className="h-6 w-6" />
              )}
            </div>
            <p className="text-xs mt-1 capitalize">{status}</p>
          </div>

          {/* Data Fetch Time */}
          <div className="p-3 rounded-lg border border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700">Carga de Datos</p>
                <p className="text-lg font-bold text-gray-900">
                  {formatTime(performanceMetrics.dataFetchTime)}
                </p>
              </div>
              <Database className="h-6 w-6 text-gray-500" />
            </div>
            <p className="text-xs text-gray-600 mt-1">Base de datos</p>
          </div>

          {/* Analytics Generation Time */}
          <div className="p-3 rounded-lg border border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700">Análisis</p>
                <p className="text-lg font-bold text-gray-900">
                  {formatTime(performanceMetrics.analyticsGenerationTime)}
                </p>
              </div>
              <Clock className="h-6 w-6 text-gray-500" />
            </div>
            <p className="text-xs text-gray-600 mt-1">Generación</p>
          </div>

          {/* Cache Status */}
          <div className={`p-3 rounded-lg border ${
            performanceMetrics.cacheHit 
              ? 'border-green-200 bg-green-50' 
              : 'border-orange-200 bg-orange-50'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700">Cache</p>
                <p className={`text-lg font-bold ${
                  performanceMetrics.cacheHit ? 'text-green-700' : 'text-orange-700'
                }`}>
                  {performanceMetrics.cacheHit ? 'Hit' : 'Miss'}
                </p>
              </div>
              <div className={`h-6 w-6 rounded-full ${
                performanceMetrics.cacheHit ? 'bg-green-500' : 'bg-orange-500'
              }`} />
            </div>
            <p className="text-xs text-gray-600 mt-1">
              {performanceMetrics.cacheHit ? 'Datos en caché' : 'Datos frescos'}
            </p>
          </div>
        </div>
      )}

      {/* Additional Metrics */}
      {performanceMetrics && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex flex-wrap gap-4 text-sm text-gray-600">
            <div className="flex items-center">
              <span className="font-medium">Registros procesados:</span>
              <span className="ml-1 font-mono">{performanceMetrics.totalRecords.toLocaleString()}</span>
            </div>
            {lastFetchTime && (
              <div className="flex items-center">
                <span className="font-medium">Última actualización:</span>
                <span className="ml-1">{lastFetchTime.toLocaleTimeString()}</span>
              </div>
            )}
            <div className="flex items-center">
              <span className="font-medium">Velocidad:</span>
              <span className="ml-1 font-mono">
                {Math.round(performanceMetrics.totalRecords / (totalTime / 1000)).toLocaleString()} reg/s
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Performance Tips */}
      {performanceMetrics && status !== 'excellent' && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <p className="text-sm text-blue-700">
            <strong>Sugerencia:</strong> {
              status === 'poor' 
                ? 'El rendimiento puede mejorarse. Considera actualizar los datos durante horas de menor actividad.'
                : status === 'fair'
                ? 'El rendimiento es aceptable. Los datos se están cargando correctamente.'
                : 'El rendimiento es bueno. El sistema está funcionando eficientemente.'
            }
          </p>
        </div>
      )}
    </div>
  );
};

export default PerformanceMonitor;