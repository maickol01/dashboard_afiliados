// Custom error types for database operations

export class DatabaseError extends Error {
  constructor(
    message: string,
    public code?: string,
    public details?: Record<string, unknown>,
    public hint?: string
  ) {
    super(message)
    this.name = 'DatabaseError'
  }
}

export class NetworkError extends Error {
  constructor(message: string, public originalError?: Error) {
    super(message)
    this.name = 'NetworkError'
  }
}

export class ValidationError extends Error {
  constructor(message: string, public field?: string) {
    super(message)
    this.name = 'ValidationError'
  }
}

export class ServiceError extends Error {
  constructor(
    message: string,
    public originalError?: Error,
    public context?: Record<string, unknown>
  ) {
    super(message)
    this.name = 'ServiceError'
  }
}

export class RetryableError extends Error {
  constructor(
    message: string,
    public retryCount: number = 0,
    public maxRetries: number = 3
  ) {
    super(message)
    this.name = 'RetryableError'
  }
}

// Error type guards
export const isNetworkError = (error: unknown): error is NetworkError => {
  return error instanceof NetworkError
}

export const isDatabaseError = (error: unknown): error is DatabaseError => {
  return error instanceof DatabaseError
}

export const isRetryableError = (error: unknown): error is RetryableError => {
  return error instanceof RetryableError
}

export const isValidationError = (error: unknown): error is ValidationError => {
  return error instanceof ValidationError
}

// Error classification helper
export const classifyError = (error: unknown): {
  type: 'network' | 'database' | 'validation' | 'service' | 'unknown'
  isRetryable: boolean
  message: string
} => {
  if (isNetworkError(error)) {
    return { type: 'network', isRetryable: true, message: error.message }
  }
  
  if (isDatabaseError(error)) {
    // Some database errors are retryable (timeouts, connection issues)
    const retryableCodes = ['PGRST301', 'PGRST302', '08000', '08003', '08006']
    const isRetryable = retryableCodes.includes(error.code || '')
    return { type: 'database', isRetryable, message: error.message }
  }
  
  if (isValidationError(error)) {
    return { type: 'validation', isRetryable: false, message: error.message }
  }
  
  if (error instanceof Error) {
    return { type: 'service', isRetryable: false, message: error.message }
  }
  
  return { type: 'unknown', isRetryable: false, message: 'An unknown error occurred' }
}