import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useData } from '../hooks/useData'
import { DataService } from '../services/dataService'
import { mockHierarchicalData, mockAnalytics } from './mockData'
import { DatabaseError, NetworkError } from '../types/errors'

// Mock DataService
vi.mock('../services/dataService', () => ({
  DataService: {
    getAllHierarchicalData: vi.fn(),
    generateAnalyticsFromData: vi.fn(),
    healthCheck: vi.fn(),
    getCacheStatus: vi.fn(),
    clearCache: vi.fn()
  }
}))

const mockDataService = DataService as any

describe('useData Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Default successful mocks
    mockDataService.getAllHierarchicalData.mockResolvedValue(mockHierarchicalData)
    mockDataService.generateAnalyticsFromData.mockResolvedValue(mockAnalytics)
    mockDataService.healthCheck.mockResolvedValue({ status: 'healthy', timestamp: new Date() })
    mockDataService.getCacheStatus.mockReturnValue({ dataCache: false, analyticsCache: false })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('initial data loading', () => {
    it('should load data and analytics on mount', async () => {
      const { result } = renderHook(() => useData())

      expect(result.current.loading).toBe(true)
      expect(result.current.data).toEqual([])
      expect(result.current.analytics).toBeNull()

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.data).toEqual(mockHierarchicalData)
      expect(result.current.analytics).toEqual(mockAnalytics)
      expect(result.current.error).toBeNull()
    })

    it('should handle loading states correctly', async () => {
      const { result } = renderHook(() => useData())

      expect(result.current.loading).toBe(true)
      expect(result.current.analyticsLoading).toBe(false)

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.analyticsLoading).toBe(false)
    })

    it('should set performance metrics after successful load', async () => {
      const { result } = renderHook(() => useData())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.performanceMetrics).toBeDefined()
      expect(result.current.performanceMetrics?.totalRecords).toBeGreaterThan(0)
      expect(result.current.performanceMetrics?.dataFetchTime).toBeGreaterThanOrEqual(0)
      expect(result.current.performanceMetrics?.analyticsGenerationTime).toBeGreaterThanOrEqual(0)
    })

    it('should set last fetch time after successful load', async () => {
      const { result } = renderHook(() => useData())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.lastFetchTime).toBeDefined()
      expect(result.current.lastFetchTime).toBeInstanceOf(Date)
    })
  })

  describe('error handling', () => {
    it('should handle database errors', async () => {
      const dbError = new DatabaseError('Database connection failed', 'CONNECTION_ERROR')
      mockDataService.getAllHierarchicalData.mockRejectedValue(dbError)

      const { result } = renderHook(() => useData())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.error).toContain('Error en la base de datos')
      expect(result.current.data).toEqual([])
      expect(result.current.analytics).toBeNull()
    })

    it('should handle network errors', async () => {
      const networkError = new NetworkError('Network connection failed', new Error('Network error'))
      mockDataService.getAllHierarchicalData.mockRejectedValue(networkError)

      const { result } = renderHook(() => useData())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.error).toContain('Error de conexión')
      expect(result.current.data).toEqual([])
    })

    it('should handle service health check failures', async () => {
      mockDataService.healthCheck.mockResolvedValue({ status: 'unhealthy', error: 'Service unavailable' })
      mockDataService.getAllHierarchicalData.mockRejectedValue(new Error('Service unavailable'))

      const { result } = renderHook(() => useData())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.error).toBeDefined()
    })

    it('should implement retry logic for retryable errors', async () => {
      let callCount = 0
      mockDataService.getAllHierarchicalData.mockImplementation(() => {
        callCount++
        if (callCount < 3) {
          return Promise.reject(new NetworkError('Temporary network error', new Error('Network error')))
        }
        return Promise.resolve(mockHierarchicalData)
      })

      const { result } = renderHook(() => useData())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      }, { timeout: 10000 })

      expect(result.current.data).toEqual(mockHierarchicalData)
      expect(result.current.error).toBeNull()
      expect(callCount).toBe(3)
    })

    it('should stop retrying after max attempts', async () => {
      const networkError = new NetworkError('Persistent network error', new Error('Network error'))
      mockDataService.getAllHierarchicalData.mockRejectedValue(networkError)

      const { result } = renderHook(() => useData())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      }, { timeout: 15000 })

      expect(result.current.error).toContain('Error de conexión')
      expect(result.current.retryCount).toBe(3)
    })
  })

  describe('data operations', () => {
    it('should search data correctly', async () => {
      const { result } = renderHook(() => useData())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // Search by name
      const searchResults = result.current.searchData('Juan')
      expect(searchResults.length).toBeGreaterThan(0)
      expect(searchResults[0].name).toContain('Juan')

      // Search by direccion
      const addressResults = result.current.searchData('Principal')
      expect(addressResults.length).toBeGreaterThan(0)
      expect(addressResults[0].direccion).toContain('Principal')

      // Search by colonia
      const coloniaResults = result.current.searchData('Centro')
      expect(coloniaResults.length).toBeGreaterThan(0)
      expect(coloniaResults[0].colonia).toContain('Centro')

      // Search by seccion
      const seccionResults = result.current.searchData('001')
      expect(seccionResults.length).toBeGreaterThan(0)
      expect(seccionResults[0].seccion).toContain('001')

      // Search by numero_cel
      const phoneResults = result.current.searchData('5551234567')
      expect(phoneResults.length).toBeGreaterThan(0)
      expect(phoneResults[0].numero_cel).toContain('5551234567')
    })

    it('should return empty array for empty search query', async () => {
      const { result } = renderHook(() => useData())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      const searchResults = result.current.searchData('')
      expect(searchResults).toEqual(mockHierarchicalData)
    })

    it('should filter by role correctly', async () => {
      const { result } = renderHook(() => useData())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      const liderResults = result.current.filterByRole('lider')
      expect(liderResults.every(person => person.role === 'lider')).toBe(true)

      const brigadistaResults = result.current.filterByRole('brigadista')
      expect(brigadistaResults.every(person => person.role === 'brigadista')).toBe(true)

      const movilizadorResults = result.current.filterByRole('movilizador')
      expect(movilizadorResults.every(person => person.role === 'movilizador')).toBe(true)

      const ciudadanoResults = result.current.filterByRole('ciudadano')
      expect(ciudadanoResults.every(person => person.role === 'ciudadano')).toBe(true)

      const allResults = result.current.filterByRole('all')
      expect(allResults).toEqual(mockHierarchicalData)
    })

    it('should filter by date range correctly', async () => {
      const { result } = renderHook(() => useData())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      const startDate = new Date('2024-01-01')
      const endDate = new Date('2024-01-05')
      
      const dateResults = result.current.filterByDate(startDate, endDate)
      expect(dateResults.every(person => {
        const personDate = new Date(person.created_at)
        return personDate >= startDate && personDate <= endDate
      })).toBe(true)
    })

    it('should get registrations by period correctly', async () => {
      const { result } = renderHook(() => useData())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      const dailyRegistrations = result.current.getRegistrationsByPeriod('day')
      expect(dailyRegistrations).toEqual(mockAnalytics.dailyRegistrations)

      const weeklyRegistrations = result.current.getRegistrationsByPeriod('week')
      expect(weeklyRegistrations).toEqual(mockAnalytics.weeklyRegistrations)

      const monthlyRegistrations = result.current.getRegistrationsByPeriod('month')
      expect(monthlyRegistrations).toEqual(mockAnalytics.monthlyRegistrations)
    })

    it('should return empty array when analytics is null', async () => {
      mockDataService.generateAnalyticsFromData.mockResolvedValue(null)
      
      const { result } = renderHook(() => useData())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      const registrations = result.current.getRegistrationsByPeriod('day')
      expect(registrations).toEqual([])
    })
  })

  describe('data refresh', () => {
    it('should refetch data when refetchData is called', async () => {
      const { result } = renderHook(() => useData())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(mockDataService.getAllHierarchicalData).toHaveBeenCalledTimes(1)

      result.current.refetchData()

      await waitFor(() => {
        expect(mockDataService.getAllHierarchicalData).toHaveBeenCalledTimes(2)
      })
    })

    it('should force refresh and clear cache when forceRefresh is called', async () => {
      const { result } = renderHook(() => useData())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      result.current.forceRefresh()

      expect(mockDataService.clearCache).toHaveBeenCalled()
      
      await waitFor(() => {
        expect(mockDataService.getAllHierarchicalData).toHaveBeenCalledWith(false, true)
      })
    })
  })

  describe('analytics loading', () => {
    it('should show analytics loading state separately', async () => {
      let resolveAnalytics: (value: any) => void
      const analyticsPromise = new Promise(resolve => {
        resolveAnalytics = resolve
      })
      
      mockDataService.generateAnalyticsFromData.mockReturnValue(analyticsPromise)

      const { result } = renderHook(() => useData())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.data).toEqual(mockHierarchicalData)
      expect(result.current.analyticsLoading).toBe(true)
      expect(result.current.analytics).toBeNull()

      resolveAnalytics!(mockAnalytics)

      await waitFor(() => {
        expect(result.current.analyticsLoading).toBe(false)
      })

      expect(result.current.analytics).toEqual(mockAnalytics)
    })

    it('should handle analytics generation errors', async () => {
      mockDataService.generateAnalyticsFromData.mockRejectedValue(new Error('Analytics generation failed'))

      const { result } = renderHook(() => useData())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.data).toEqual(mockHierarchicalData)
      expect(result.current.analyticsLoading).toBe(false)
      expect(result.current.error).toContain('Analytics generation failed')
    })
  })

  describe('cache integration', () => {
    it('should report cache hit in performance metrics', async () => {
      mockDataService.getCacheStatus.mockReturnValue({ dataCache: true, analyticsCache: true })

      const { result } = renderHook(() => useData())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.performanceMetrics?.cacheHit).toBe(true)
    })

    it('should report cache miss in performance metrics', async () => {
      mockDataService.getCacheStatus.mockReturnValue({ dataCache: false, analyticsCache: false })

      const { result } = renderHook(() => useData())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.performanceMetrics?.cacheHit).toBe(false)
    })
  })
})