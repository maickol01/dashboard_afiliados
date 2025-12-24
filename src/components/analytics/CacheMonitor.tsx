import React, { useState, useEffect } from 'react'
import { Activity, Database, Clock, TrendingUp, AlertTriangle, CheckCircle, XCircle } from 'lucide-react'
import { cacheManager } from '../../services/cacheManager'

interface CacheMetrics {
  hits: number
  misses: number
  evictions: number
  warmingEvents: number
  totalSize: number
  entryCount: number
  hitRate: number
  averageAccessTime: number
  lastCleanup: number
}

interface DetailedMetrics {
  metrics: CacheMetrics
  topKeys: Array<{ key: string; accessCount: number; size: number }>
  memoryUsage: { used: number; max: number; percentage: number }
  entryDistribution: { byTag: Record<string, number>; byAge: Record<string, number> }
}

interface HealthStatus {
  status: 'healthy' | 'warning' | 'critical'
  issues: string[]
  recommendations: string[]
}

export const CacheMonitor: React.FC = () => {
  const [metrics, setMetrics] = useState<CacheMetrics | null>(null)
  const [detailedMetrics, setDetailedMetrics] = useState<DetailedMetrics | null>(null)
  const [healthStatus, setHealthStatus] = useState<HealthStatus | null>(null)
  const [isExpanded, setIsExpanded] = useState(false)
  const [refreshInterval, setRefreshInterval] = useState(5000) // 5 seconds
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const updateMetrics = async () => {
      try {
        setError(null)
        
        // Test if cache manager is available
        if (!cacheManager) {
          throw new Error('Cache manager not available')
        }
        
        const basicMetrics = cacheManager.getMetrics()
        const detailed = cacheManager.getDetailedMetrics()
        const health = await cacheManager.healthCheck()
        
        setMetrics(basicMetrics)
        setDetailedMetrics(detailed)
        setHealthStatus(health)
      } catch (error) {
        console.error('Failed to fetch cache metrics:', error)
        setError(error instanceof Error ? error.message : 'Unknown error')
        
        // Set fallback values to prevent component crash
        setMetrics({
          hits: 0,
          misses: 0,
          evictions: 0,
          warmingEvents: 0,
          totalSize: 0,
          entryCount: 0,
          hitRate: 0,
          averageAccessTime: 0,
          lastCleanup: Date.now()
        })
        setDetailedMetrics({
          metrics: {
            hits: 0,
            misses: 0,
            evictions: 0,
            warmingEvents: 0,
            totalSize: 0,
            entryCount: 0,
            hitRate: 0,
            averageAccessTime: 0,
            lastCleanup: Date.now()
          },
          topKeys: [],
          memoryUsage: { used: 0, max: 1024 * 1024 * 50, percentage: 0 },
          entryDistribution: { byTag: {}, byAge: {} }
        })
        setHealthStatus({
          status: 'critical',
          issues: ['Error loading cache metrics'],
          recommendations: ['Check cache manager configuration']
        })
      }
    }

    updateMetrics()
    const interval = setInterval(updateMetrics, refreshInterval)

    return () => clearInterval(interval)
  }, [refreshInterval])

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatTime = (ms: number): string => {
    if (ms < 1) return '<1ms'
    if (ms < 1000) return `${ms.toFixed(1)}ms`
    return `${(ms / 1000).toFixed(2)}s`
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />
      case 'critical':
        return <XCircle className="w-4 h-4 text-red-500" />
      default:
        return <Activity className="w-4 h-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'text-green-600 bg-green-50 border-green-200'
      case 'warning':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'critical':
        return 'text-red-600 bg-red-50 border-red-200'
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center space-x-2">
          <AlertTriangle className="w-5 h-5 text-red-500" />
          <div>
            <span className="text-sm text-red-600">Error en Cache Monitor: {error}</span>
            <div className="text-xs text-gray-500 mt-1">El monitor de caché no está disponible temporalmente</div>
          </div>
        </div>
      </div>
    )
  }

  if (!metrics || !detailedMetrics || !healthStatus) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center space-x-2">
          <Database className="w-5 h-5 text-gray-400" />
          <span className="text-sm text-gray-500">Cargando métricas de caché...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Database className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold text-gray-900">Monitor de Caché</h3>
            <div className={`flex items-center space-x-1 px-2 py-1 rounded-full border text-xs font-medium ${getStatusColor(healthStatus.status)}`}>
              {getStatusIcon(healthStatus.status)}
              <span className="capitalize">{healthStatus.status}</span>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <select
              value={refreshInterval}
              onChange={(e) => setRefreshInterval(Number(e.target.value))}
              className="text-xs border border-gray-300 rounded px-2 py-1"
            >
              <option value={1000}>1s</option>
              <option value={5000}>5s</option>
              <option value={10000}>10s</option>
              <option value={30000}>30s</option>
            </select>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-xs text-primary hover:text-primary-dark"
            >
              {isExpanded ? 'Contraer' : 'Expandir'}
            </button>
          </div>
        </div>
      </div>

      {/* Basic Metrics */}
      <div className="p-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{metrics.hitRate.toFixed(1)}%</div>
            <div className="text-xs text-gray-500">Tasa de Aciertos</div>
            <div className="text-xs text-gray-400">{metrics.hits} hits / {metrics.misses} misses</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{metrics.entryCount}</div>
            <div className="text-xs text-gray-500">Entradas</div>
            <div className="text-xs text-gray-400">{formatBytes(metrics.totalSize)}</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{formatTime(metrics.averageAccessTime)}</div>
            <div className="text-xs text-gray-500">Tiempo Promedio</div>
            <div className="text-xs text-gray-400">de acceso</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{metrics.evictions}</div>
            <div className="text-xs text-gray-500">Expulsiones</div>
            <div className="text-xs text-gray-400">{metrics.warmingEvents} warming</div>
          </div>
        </div>

        {/* Memory Usage Bar */}
        <div className="mb-4">
          <div className="flex justify-between text-xs text-gray-600 mb-1">
            <span>Uso de Memoria</span>
            <span>{detailedMetrics.memoryUsage.percentage.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${
                detailedMetrics.memoryUsage.percentage > 80 ? 'bg-red-500' :
                detailedMetrics.memoryUsage.percentage > 60 ? 'bg-yellow-500' : 'bg-green-500'
              }`}
              style={{ width: `${Math.min(detailedMetrics.memoryUsage.percentage, 100)}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>{formatBytes(detailedMetrics.memoryUsage.used)}</span>
            <span>{formatBytes(detailedMetrics.memoryUsage.max)}</span>
          </div>
        </div>

        {/* Health Issues */}
        {healthStatus.issues.length > 0 && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-yellow-600" />
              <span className="text-sm font-medium text-yellow-800">Problemas Detectados</span>
            </div>
            <ul className="text-xs text-yellow-700 space-y-1">
              {healthStatus.issues.map((issue, index) => (
                <li key={index}>• {issue}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="border-t border-gray-200">
          <div className="p-4 space-y-4">
            {/* Top Keys */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center">
                <TrendingUp className="w-4 h-4 mr-2" />
                Claves Más Accedidas
              </h4>
              <div className="space-y-1">
                {detailedMetrics.topKeys.slice(0, 5).map((key, index) => (
                  <div key={index} className="flex justify-between items-center text-xs">
                    <span className="font-mono text-gray-600 truncate max-w-xs">{key.key}</span>
                    <div className="flex space-x-2 text-gray-500">
                      <span>{key.accessCount} accesos</span>
                      <span>{formatBytes(key.size)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Distribution by Tags */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">Distribución por Etiquetas</h4>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(detailedMetrics.entryDistribution.byTag).map(([tag, count]) => (
                  <div key={tag} className="flex justify-between text-xs">
                    <span className="text-gray-600">{tag}</span>
                    <span className="text-gray-500">{count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Distribution by Age */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">Distribución por Antigüedad</h4>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(detailedMetrics.entryDistribution.byAge).map(([age, count]) => (
                  <div key={age} className="flex justify-between text-xs">
                    <span className="text-gray-600">{age}</span>
                    <span className="text-gray-500">{count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recommendations */}
            {healthStatus.recommendations.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">Recomendaciones</h4>
                <ul className="text-xs text-gray-600 space-y-1">
                  {healthStatus.recommendations.map((rec, index) => (
                    <li key={index}>• {rec}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Last Cleanup */}
            <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-100">
              <div className="flex items-center space-x-1">
                <Clock className="w-3 h-3" />
                <span>Última limpieza: {new Date(metrics.lastCleanup).toLocaleTimeString()}</span>
              </div>
              <button
                onClick={() => cacheManager.clear()}
                className="text-red-600 hover:text-red-700 font-medium"
              >
                Limpiar Caché
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}