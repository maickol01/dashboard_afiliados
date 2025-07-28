// Retry utility for database operations

import { classifyError } from '../types/errors'

export interface RetryOptions {
  maxRetries?: number
  baseDelay?: number
  maxDelay?: number
  backoffMultiplier?: number
  retryCondition?: (error: unknown) => boolean
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  baseDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds
  backoffMultiplier: 2,
  retryCondition: (error: unknown) => {
    const { isRetryable } = classifyError(error)
    return isRetryable
  }
}

export async function withRetry<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const config = { ...DEFAULT_OPTIONS, ...options }
  let lastError: unknown
  
  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error
      
      // Don't retry on the last attempt
      if (attempt === config.maxRetries) {
        break
      }
      
      // Check if error is retryable
      if (!config.retryCondition(error)) {
        break
      }
      
      // Calculate delay with exponential backoff
      const delay = Math.min(
        config.baseDelay * Math.pow(config.backoffMultiplier, attempt),
        config.maxDelay
      )
      
      console.warn(`Operation failed (attempt ${attempt + 1}/${config.maxRetries + 1}), retrying in ${delay}ms:`, error)
      
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
  
  throw lastError
}

// Specialized retry for database operations
export async function withDatabaseRetry<T>(
  operation: () => Promise<T>,
  operationName: string = 'Database operation'
): Promise<T> {
  return withRetry(operation, {
    maxRetries: 3,
    baseDelay: 1000,
    retryCondition: (error) => {
      const { isRetryable } = classifyError(error)
      
      // Log retry attempts for monitoring
      if (isRetryable) {
        console.warn(`${operationName} failed with retryable error:`, error)
      }
      
      return isRetryable
    }
  })
}

// Circuit breaker pattern for preventing cascade failures
export class CircuitBreaker {
  private failures = 0
  private lastFailureTime = 0
  private state: 'closed' | 'open' | 'half-open' = 'closed'
  
  constructor(
    private failureThreshold: number = 5,
    private recoveryTimeout: number = 60000 // 1 minute
  ) {}
  
  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (Date.now() - this.lastFailureTime > this.recoveryTimeout) {
        this.state = 'half-open'
      } else {
        throw new Error('Circuit breaker is open - service temporarily unavailable')
      }
    }
    
    try {
      const result = await operation()
      this.onSuccess()
      return result
    } catch (error) {
      this.onFailure()
      throw error
    }
  }
  
  private onSuccess() {
    this.failures = 0
    this.state = 'closed'
  }
  
  private onFailure() {
    this.failures++
    this.lastFailureTime = Date.now()
    
    if (this.failures >= this.failureThreshold) {
      this.state = 'open'
    }
  }
  
  getState() {
    return {
      state: this.state,
      failures: this.failures,
      lastFailureTime: this.lastFailureTime
    }
  }
}