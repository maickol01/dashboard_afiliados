import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { DataService } from '../services/dataService'
import { DatabaseError, NetworkError, ValidationError, ServiceError } from '../types/errors'
import { mockLideres, mockBrigadistas, mockMovilizadores, mockCiudadanos, mockHierarchicalData } from './mockData'

// Mock Supabase using vi.hoisted
const mockSupabase = vi.hoisted(() => ({
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      order: vi.fn(() => ({
        data: null,
        error: null
      })),
      limit: vi.fn(() => ({
        data: null,
        error: null
      }))
    }))
  }))
}))

vi.mock('../lib/supabase', () => ({
  supabase: mockSupabase,
  type: {} as any
}))

describe('DataService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Clear any cached data
    DataService.clearCache()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('getAllHierarchicalData', () => {
    it('should fetch and build hierarchical data successfully', async () => {
      // Mock successful database responses
      mockSupabase.from.mockImplementation((tableName: string) => ({
        select: vi.fn(() => ({
          order: vi.fn(() => {
            switch (tableName) {
              case 'lideres':
                return { data: mockLideres, error: null }
              case 'brigadistas':
                return { data: mockBrigadistas, error: null }
              case 'movilizadores':
                return { data: mockMovilizadores, error: null }
              case 'ciudadanos':
                return { data: mockCiudadanos, error: null }
              default:
                return { data: [], error: null }
            }
          })
        }))
      }))

      const result = await DataService.getAllHierarchicalData()

      expect(result).toBeDefined()
      expect(Array.isArray(result)).toBe(true)
      expect(result.length).toBe(2) // 2 leaders
      
      // Verify hierarchical structure
      const leader1 = result.find(l => l.id === 'lider-1')
      expect(leader1).toBeDefined()
      expect(leader1?.children).toBeDefined()
      expect(leader1?.children?.length).toBe(1) // 1 brigadista
      
      const brigadista1 = leader1?.children?.[0]
      expect(brigadista1?.id).toBe('brigadista-1')
      expect(brigadista1?.children?.length).toBe(1) // 1 movilizador
      
      const movilizador1 = brigadista1?.children?.[0]
      expect(movilizador1?.id).toBe('movilizador-1')
      expect(movilizador1?.children?.length).toBe(2) // 2 ciudadanos
    })

    it('should handle database connection errors', async () => {
      mockSupabase.from.mockImplementation(() => ({
        select: vi.fn(() => ({
          order: vi.fn(() => ({
            data: null,
            error: { message: 'Connection failed', code: 'CONNECTION_ERROR' }
          }))
        }))
      }))

      await expect(DataService.getAllHierarchicalData()).rejects.toThrow(DatabaseError)
    })

    it('should handle network connectivity issues', async () => {
      mockSupabase.from.mockImplementation(() => ({
        select: vi.fn(() => ({
          limit: vi.fn(() => ({
            data: null,
            error: { message: 'Network error', code: 'NETWORK_ERROR' }
          }))
        }))
      }))

      await expect(DataService.getAllHierarchicalData()).rejects.toThrow(NetworkError)
    })

    it('should validate hierarchical data integrity', async () => {
      // Mock data with missing required fields
      const invalidLideres = [{ id: '', nombre: '', created_at: '2024-01-01' }]
      
      mockSupabase.from.mockImplementation((tableName: string) => ({
        select: vi.fn(() => ({
          order: vi.fn(() => {
            switch (tableName) {
              case 'lideres':
                return { data: invalidLideres, error: null }
              default:
                return { data: [], error: null }
            }
          })
        }))
      }))

      await expect(DataService.getAllHierarchicalData()).rejects.toThrow(ValidationError)
    })

    it('should use cached data when available', async () => {
      // First call - should fetch from database
      mockSupabase.from.mockImplementation((tableName: string) => ({
        select: vi.fn(() => ({
          order: vi.fn(() => {
            switch (tableName) {
              case 'lideres':
                return { data: mockLideres, error: null }
              case 'brigadistas':
                return { data: mockBrigadistas, error: null }
              case 'movilizadores':
                return { data: mockMovilizadores, error: null }
              case 'ciudadanos':
                return { data: mockCiudadanos, error: null }
              default:
                return { data: [], error: null }
            }
          })
        }))
      }))

      const result1 = await DataService.getAllHierarchicalData()
      
      // Second call - should use cache
      const result2 = await DataService.getAllHierarchicalData()
      
      expect(result1).toEqual(result2)
      // Verify database was only called once per table (4 tables total)
      expect(mockSupabase.from).toHaveBeenCalledTimes(8) // 4 calls for first fetch, 4 for validation
    })

    it('should force refresh when requested', async () => {
      mockSupabase.from.mockImplementation((tableName: string) => ({
        select: vi.fn(() => ({
          order: vi.fn(() => {
            switch (tableName) {
              case 'lideres':
                return { data: mockLideres, error: null }
              case 'brigadistas':
                return { data: mockBrigadistas, error: null }
              case 'movilizadores':
                return { data: mockMovilizadores, error: null }
              case 'ciudadanos':
                return { data: mockCiudadanos, error: null }
              default:
                return { data: [], error: null }
            }
          })
        }))
      }))

      await DataService.getAllHierarchicalData()
      vi.clearAllMocks()
      
      // Force refresh should bypass cache
      await DataService.getAllHierarchicalData(true)
      
      expect(mockSupabase.from).toHaveBeenCalled()
    })

    it('should handle empty database tables gracefully', async () => {
      mockSupabase.from.mockImplementation(() => ({
        select: vi.fn(() => ({
          order: vi.fn(() => ({
            data: [],
            error: null
          }))
        }))
      }))

      const result = await DataService.getAllHierarchicalData()
      
      expect(result).toBeDefined()
      expect(Array.isArray(result)).toBe(true)
      expect(result.length).toBe(0)
    })

    it('should calculate registration counts correctly', async () => {
      mockSupabase.from.mockImplementation((tableName: string) => ({
        select: vi.fn(() => ({
          order: vi.fn(() => {
            switch (tableName) {
              case 'lideres':
                return { data: mockLideres, error: null }
              case 'brigadistas':
                return { data: mockBrigadistas, error: null }
              case 'movilizadores':
                return { data: mockMovilizadores, error: null }
              case 'ciudadanos':
                return { data: mockCiudadanos, error: null }
              default:
                return { data: [], error: null }
            }
          })
        }))
      }))

      const result = await DataService.getAllHierarchicalData()
      
      const leader1 = result.find(l => l.id === 'lider-1')
      expect(leader1?.registeredCount).toBe(2) // Should have 2 ciudadanos total
      
      const leader2 = result.find(l => l.id === 'lider-2')
      expect(leader2?.registeredCount).toBe(1) // Should have 1 ciudadano total
    })

    it('should convert database records to Person format correctly', async () => {
      mockSupabase.from.mockImplementation((tableName: string) => ({
        select: vi.fn(() => ({
          order: vi.fn(() => {
            switch (tableName) {
              case 'lideres':
                return { data: [mockLideres[0]], error: null }
              default:
                return { data: [], error: null }
            }
          })
        }))
      }))

      const result = await DataService.getAllHierarchicalData()
      const leader = result[0]
      
      expect(leader.id).toBe('lider-1')
      expect(leader.name).toBe('Juan Pérez')
      expect(leader.nombre).toBe('Juan Pérez')
      expect(leader.role).toBe('lider')
      expect(leader.direccion).toBe('Calle Principal 123')
      expect(leader.colonia).toBe('Centro')
      expect(leader.seccion).toBe('001')
      expect(leader.numero_cel).toBe('5551234567')
      expect(leader.num_verificado).toBe(true)
      expect(leader.entidad).toBe('Ciudad de México')
      expect(leader.municipio).toBe('Cuauhtémoc')
    })
  })

  describe('generateAnalyticsFromData', () => {
    it('should generate analytics from hierarchical data', async () => {
      const analytics = await DataService.generateAnalyticsFromData(mockHierarchicalData)
      
      expect(analytics).toBeDefined()
      expect(analytics.totalLideres).toBe(2)
      expect(analytics.totalBrigadistas).toBe(2)
      expect(analytics.totalMobilizers).toBe(2)
      expect(analytics.totalCitizens).toBe(3)
      
      expect(analytics.leaderPerformance).toHaveLength(2)
      expect(analytics.leaderPerformance[0].name).toBe('Juan Pérez')
      expect(analytics.leaderPerformance[0].registered).toBe(2)
    })

    it('should calculate verification rate correctly (ciudadanos only)', async () => {
      const analytics = await DataService.generateAnalyticsFromData(mockHierarchicalData)
      
      // Only ciudadanos should be considered for verification rate
      // 2 out of 3 ciudadanos are verified (66.67%)
      expect(analytics.conversionRate).toBeCloseTo(66.67, 1)
      expect(analytics.quality.verificationRate).toBeCloseTo(66.67, 1)
    })

    it('should generate temporal analytics correctly', async () => {
      const analytics = await DataService.generateAnalyticsFromData(mockHierarchicalData)
      
      expect(analytics.dailyRegistrations).toBeDefined()
      expect(Array.isArray(analytics.dailyRegistrations)).toBe(true)
      
      expect(analytics.weeklyRegistrations).toBeDefined()
      expect(Array.isArray(analytics.weeklyRegistrations)).toBe(true)
      
      expect(analytics.monthlyRegistrations).toBeDefined()
      expect(Array.isArray(analytics.monthlyRegistrations)).toBe(true)
    })

    it('should calculate geographic distribution correctly', async () => {
      const analytics = await DataService.generateAnalyticsFromData(mockHierarchicalData)
      
      expect(analytics.geographic.regionDistribution).toBeDefined()
      expect(analytics.geographic.regionDistribution.length).toBeGreaterThan(0)
      
      const cdmxRegion = analytics.geographic.regionDistribution.find(r => r.region === 'Ciudad de México')
      expect(cdmxRegion).toBeDefined()
      expect(cdmxRegion?.count).toBe(3) // All 3 ciudadanos are from CDMX
    })

    it('should handle empty data gracefully', async () => {
      const analytics = await DataService.generateAnalyticsFromData([])
      
      expect(analytics.totalLideres).toBe(0)
      expect(analytics.totalBrigadistas).toBe(0)
      expect(analytics.totalMobilizers).toBe(0)
      expect(analytics.totalCitizens).toBe(0)
      expect(analytics.leaderPerformance).toHaveLength(0)
    })

    it('should validate analytics data before processing', async () => {
      const invalidData = [
        {
          id: '',
          name: '',
          role: 'lider' as const,
          created_at: new Date(),
          registeredCount: 0
        }
      ] as any

      await expect(DataService.generateAnalyticsFromData(invalidData)).rejects.toThrow(ValidationError)
    })

    it('should use cached analytics when available', async () => {
      const analytics1 = await DataService.generateAnalyticsFromData(mockHierarchicalData)
      const analytics2 = await DataService.generateAnalyticsFromData(mockHierarchicalData)
      
      expect(analytics1).toEqual(analytics2)
    })

    it('should calculate efficiency metrics correctly', async () => {
      const analytics = await DataService.generateAnalyticsFromData(mockHierarchicalData)
      
      expect(analytics.efficiency.conversionByLeader).toHaveLength(2)
      expect(analytics.efficiency.productivityByBrigadier).toHaveLength(2)
      expect(analytics.efficiency.topPerformers).toBeDefined()
      expect(analytics.efficiency.needsSupport).toBeDefined()
    })

    it('should generate quality metrics correctly', async () => {
      const analytics = await DataService.generateAnalyticsFromData(mockHierarchicalData)
      
      expect(analytics.quality.dataCompleteness).toBeGreaterThan(0)
      expect(analytics.quality.duplicateRate).toBeGreaterThanOrEqual(0)
      expect(analytics.quality.verificationRate).toBeGreaterThanOrEqual(0)
      expect(analytics.quality.postRegistrationActivity).toBeGreaterThanOrEqual(0)
    })
  })

  describe('healthCheck', () => {
    it('should return healthy status when database is accessible', async () => {
      mockSupabase.from.mockImplementation(() => ({
        select: vi.fn(() => ({
          limit: vi.fn(() => ({
            data: [{ id: 'test' }],
            error: null
          }))
        }))
      }))

      const health = await DataService.healthCheck()
      
      expect(health.status).toBe('healthy')
      expect(health.timestamp).toBeDefined()
    })

    it('should return unhealthy status when database is not accessible', async () => {
      mockSupabase.from.mockImplementation(() => ({
        select: vi.fn(() => ({
          limit: vi.fn(() => ({
            data: null,
            error: { message: 'Connection failed' }
          }))
        }))
      }))

      const health = await DataService.healthCheck()
      
      expect(health.status).toBe('unhealthy')
      expect(health.error).toBeDefined()
    })
  })

  describe('getCacheStatus', () => {
    it('should return cache status correctly', () => {
      const status = DataService.getCacheStatus()
      
      expect(status).toBeDefined()
      expect(typeof status.dataCache).toBe('boolean')
      expect(typeof status.analyticsCache).toBe('boolean')
    })
  })

  describe('clearCache', () => {
    it('should clear all cached data', async () => {
      // First populate cache
      mockSupabase.from.mockImplementation((tableName: string) => ({
        select: vi.fn(() => ({
          order: vi.fn(() => {
            switch (tableName) {
              case 'lideres':
                return { data: mockLideres, error: null }
              case 'brigadistas':
                return { data: mockBrigadistas, error: null }
              case 'movilizadores':
                return { data: mockMovilizadores, error: null }
              case 'ciudadanos':
                return { data: mockCiudadanos, error: null }
              default:
                return { data: [], error: null }
            }
          })
        }))
      }))

      await DataService.getAllHierarchicalData()
      await DataService.generateAnalyticsFromData(mockHierarchicalData)
      
      let status = DataService.getCacheStatus()
      expect(status.dataCache || status.analyticsCache).toBe(true)
      
      DataService.clearCache()
      
      status = DataService.getCacheStatus()
      expect(status.dataCache).toBe(false)
      expect(status.analyticsCache).toBe(false)
    })
  })

  describe('error handling', () => {
    it('should handle circuit breaker activation', async () => {
      // Mock multiple failures to trigger circuit breaker
      mockSupabase.from.mockImplementation(() => ({
        select: vi.fn(() => ({
          order: vi.fn(() => ({
            data: null,
            error: { message: 'Database error', code: 'DB_ERROR' }
          })),
          limit: vi.fn(() => ({
            data: null,
            error: { message: 'Database error', code: 'DB_ERROR' }
          }))
        }))
      }))

      // Multiple failed attempts should eventually trigger circuit breaker
      for (let i = 0; i < 6; i++) {
        try {
          await DataService.getAllHierarchicalData()
        } catch (error) {
          // Expected to fail
        }
      }

      // Circuit breaker should now be open
      await expect(DataService.getAllHierarchicalData()).rejects.toThrow()
    })

    it('should retry failed operations', async () => {
      let callCount = 0
      mockSupabase.from.mockImplementation(() => ({
        select: vi.fn(() => ({
          order: vi.fn(() => {
            callCount++
            if (callCount < 3) {
              return { data: null, error: { message: 'Temporary error', code: 'TEMP_ERROR' } }
            }
            return { data: mockLideres, error: null }
          }),
          limit: vi.fn(() => ({
            data: [{ id: 'test' }],
            error: null
          }))
        }))
      }))

      // Should eventually succeed after retries
      const result = await DataService.getAllHierarchicalData()
      expect(result).toBeDefined()
      expect(callCount).toBeGreaterThan(1)
    })
  })
})