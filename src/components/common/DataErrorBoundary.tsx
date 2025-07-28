import React from 'react'
import { ErrorBoundary } from './ErrorBoundary'
import { DatabaseError, NetworkError, ValidationError } from '../../types/errors'
import { AlertCircle, Wifi, Database, AlertTriangle } from 'lucide-react'

interface DataErrorBoundaryProps {
  children: React.ReactNode
  onRetry?: () => void
  fallbackComponent?: React.ComponentType<{ error: Error; onRetry?: () => void }>
}

const DataErrorFallback: React.FC<{ error: Error; onRetry?: () => void }> = ({ error, onRetry }) => {
  const getErrorIcon = () => {
    if (error instanceof NetworkError) return <Wifi className="w-8 h-8 text-red-500" />
    if (error instanceof DatabaseError) return <Database className="w-8 h-8 text-red-500" />
    if (error instanceof ValidationError) return <AlertTriangle className="w-8 h-8 text-yellow-500" />
    return <AlertCircle className="w-8 h-8 text-red-500" />
  }

  const getErrorMessage = () => {
    if (error instanceof NetworkError) {
      return {
        title: 'Error de Conexión',
        description: 'No se pudo conectar con el servidor. Verifica tu conexión a internet.',
        suggestion: 'Intenta nuevamente en unos momentos.'
      }
    }
    
    if (error instanceof DatabaseError) {
      return {
        title: 'Error de Base de Datos',
        description: 'Hubo un problema al acceder a los datos.',
        suggestion: 'El problema puede ser temporal. Intenta recargar la página.'
      }
    }
    
    if (error instanceof ValidationError) {
      return {
        title: 'Error de Validación',
        description: 'Los datos recibidos no tienen el formato esperado.',
        suggestion: 'Contacta al administrador si el problema persiste.'
      }
    }
    
    return {
      title: 'Error Inesperado',
      description: 'Ha ocurrido un error inesperado al cargar los datos.',
      suggestion: 'Intenta recargar la página o contacta al soporte técnico.'
    }
  }

  const errorInfo = getErrorMessage()

  return (
    <div className="flex flex-col items-center justify-center p-8 bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="flex flex-col items-center text-center max-w-md">
        {getErrorIcon()}
        
        <h3 className="mt-4 text-lg font-semibold text-gray-900">
          {errorInfo.title}
        </h3>
        
        <p className="mt-2 text-sm text-gray-600">
          {errorInfo.description}
        </p>
        
        <p className="mt-1 text-xs text-gray-500">
          {errorInfo.suggestion}
        </p>
        
        {onRetry && (
          <button
            onClick={onRetry}
            className="mt-4 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-colors"
          >
            Intentar nuevamente
          </button>
        )}
        
        {process.env.NODE_ENV === 'development' && (
          <details className="mt-4 w-full">
            <summary className="cursor-pointer text-xs text-gray-500 hover:text-gray-700">
              Detalles técnicos
            </summary>
            <div className="mt-2 p-2 bg-gray-100 rounded text-xs font-mono text-left overflow-auto max-h-32">
              <div className="font-semibold">Error:</div>
              <div>{error.message}</div>
              {error.stack && (
                <>
                  <div className="font-semibold mt-2">Stack:</div>
                  <pre className="whitespace-pre-wrap text-xs">{error.stack}</pre>
                </>
              )}
            </div>
          </details>
        )}
      </div>
    </div>
  )
}

export const DataErrorBoundary: React.FC<DataErrorBoundaryProps> = ({ 
  children, 
  onRetry,
  fallbackComponent: FallbackComponent = DataErrorFallback
}) => {
  return (
    <ErrorBoundary
      fallback={<FallbackComponent error={new Error('Unknown error')} onRetry={onRetry} />}
      onError={(error, errorInfo) => {
        console.error('DataErrorBoundary caught error:', error, errorInfo)
        
        // Log specific error types for monitoring
        if (error instanceof NetworkError) {
          console.error('Network error in data operation:', error.originalError)
        } else if (error instanceof DatabaseError) {
          console.error('Database error:', { code: error.code, details: error.details, hint: error.hint })
        } else if (error instanceof ValidationError) {
          console.error('Validation error:', { field: error.field, message: error.message })
        }
      }}
      resetOnPropsChange={true}
    >
      {children}
    </ErrorBoundary>
  )
}

