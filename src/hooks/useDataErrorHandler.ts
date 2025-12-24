import React from 'react'

// Hook for handling data errors in components
export function useDataErrorHandler() {
  const handleError = React.useCallback((error: unknown) => {
    if (error instanceof Error) {
      // Re-throw to be caught by error boundary
      throw error
    } else {
      // Convert unknown errors to Error objects
      throw new Error(typeof error === 'string' ? error : 'Unknown error occurred')
    }
  }, [])

  return handleError
}