import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { DataService } from '../services/dataService'
import { useData } from '../hooks/useData'
import { exportToExcel, exportToPDF, exportInteractiveExcel } from '../utils/export'
import { mockLideres, mockBrigadistas, mockMovilizadores, mockCiudadanos, mockHierarchicalData, mockAnalytics } from './mockData'
import { DatabaseError, NetworkError, ValidationError } from '../types/errors'

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

// Mock export dependencies
vi.mock('xlsx', () => ({
  utils: {
    table_to_sheet: vi.fn(),
    json_to_sheet: vi.fn(() => ({})),
    book_new: vi.fn(() => ({})),
    book_append_sheet: vi.fn()
  },
  write: vi.fn(() => new ArrayBuffer(8))
}))

vi.mock('file-saver', () => ({
  saveAs: vi.fn()
}))

vi.mock('jspdf', () => {
  const mockDoc = {
    setFontSize: vi.fn(),
    setTextColor: vi.fn(),
    text: vi.fn(),
    save: vi.fn(),
    addPage: vi.fn(),
    lastAutoTable: { finalY: 100 }
  }
  return {
    default: vi.fn(() => mockDoc)
  }
})

vi.mock('jspdf-autotable', () => ({
  default: vi.fn()
}))

describe('Database Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    DataService.clearCache()
    
    // Mock Blob constructor
    global.Blob = vi.fn().mockImplementation((content, options) => ({
      content,
      options,
      size: content[0]?.byteLength || 0,
      type: options?.type || ''
    })) as any
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Complete Data Flow Integration', () => {
    it('should fetch data from database, generate analytics, and display in UI', async () => {
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

      const { result } = renderHook(() => useData())

      // Wait for initial loading to complete
      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      }, { timeout: 5000 })

      // Verify data was fetched and structured correctly
      expect(result.current.data).toBeDefined()
      expect(result.current.data.length).toBe(2) // 2 leaders
      expect(result.current.error).toBeNull()

      // Verify hierarchical structure
      const leader1 = result.current.data.find(l => l.id === 'lider-1')
      expect(leader1).toBeDefined()
      expect(leader1?.children).toBeDefined()
      expect(leader1?.children?.length).toBe(1) // 1 brigadista

      // Verify analytics were generated
      expect(result.current.analytics).toBeDefined()
      expect(result.current.analytics?.totalLideres).toBe(2)
      expect(result.current.analytics?.totalBrigadistas).toBe(2)
      expect(result.current.analytics?.totalMobilizers).toBe(2)
      expect(result.current.analytics?.totalCitizens).toBe(3)

      // Verify performance metrics
      expect(result.current.performanceMetrics).toBeDefined()
      expect(result.current.performanceMetrics?.totalRecords).toBeGreaterThan(0)
      expect(result.current.performanceMetrics?.dataFetchTime).toBeGreaterThanOrEqual(0)
      expect(result.current.performanceMetrics?.analyticsGenerationTime).toBeGreaterThanOrEqual(0)
    })

    it('should handle database connection failures gracefully', async () => {
      // Mock database connection failure
      mockSupabase.from.mockImplementation(() => ({
        select: vi.fn(() => ({
          order: vi.fn(() => ({
            data: null,
            error: { message: 'Connection failed', code: 'CONNECTION_ERROR' }
          })),
          limit: vi.fn(() => ({
            data: null,
            error: { message: 'Connection failed', code: 'CONNECTION_ERROR' }
          }))
        }))
      }))

      const { result } = renderHook(() => useData())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      }, { timeout: 5000 })

      // Verify error handling
      expect(result.current.error).toBeDefined()
      expect(result.current.error).toContain('Error en la base de datos')
      expect(result.current.data).toEqual([])
      expect(result.current.analytics).toBeNull()
    })

    it('should validate data integrity during fetch', async () => {
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

      const { result } = renderHook(() => useData())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      }, { timeout: 5000 })

      // Should handle validation errors
      expect(result.current.error).toBeDefined()
      expect(result.current.data).toEqual([])
    })
  })

  describe('Analytics Accuracy with Real Data Scenarios', () => {
    beforeEach(() => {
      // Setup successful database mock
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
    })

    it('should calculate verification rates correctly using only ciudadanos', async () => {
      const analytics = await DataService.generateAnalyticsFromData(mockHierarchicalData)
      
      // Only ciudadanos should be considered for verification rate
      // From mockCiudadanos: 2 out of 3 are verified (ciudadano-1: true, ciudadano-2: false, ciudadano-3: true)
      const expectedVerificationRate = (2 / 3) * 100 // 66.67%
      
      expect(analytics.quality.verificationRate).toBeCloseTo(expectedVerificationRate, 1)
      expect(analytics.conversionRate).toBeCloseTo(expectedVerificationRate, 1)
    })

    it('should generate accurate temporal analytics from created_at timestamps', async () => {
      const analytics = await DataService.generateAnalyticsFromData(mockHierarchicalData)
      
      // Verify daily registrations are calculated from actual timestamps
      expect(analytics.dailyRegistrations).toBeDefined()
      expect(analytics.dailyRegistrations.length).toBeGreaterThan(0)
      
      // Verify weekly and monthly registrations
      expect(analytics.weeklyRegistrations).toBeDefined()
      expect(analytics.monthlyRegistrations).toBeDefined()
      
      // Check that registrations are distributed across different dates
      const totalDailyRegistrations = analytics.dailyRegistrations.reduce((sum, day) => sum + day.count, 0)
      expect(totalDailyRegistrations).toBe(9) // Total people in mock data
    })

    it('should calculate leader performance based on actual hierarchy', async () => {
      const analytics = await DataService.generateAnalyticsFromData(mockHierarchicalData)
      
      expect(analytics.leaderPerformance).toHaveLength(2)
      
      const leader1Performance = analytics.leaderPerformance.find(p => p.name === 'Juan Pérez')
      const leader2Performance = analytics.leaderPerformance.find(p => p.name === 'María González')
      
      expect(leader1Performance?.registered).toBe(2) // 2 ciudadanos under leader 1
      expect(leader2Performance?.registered).toBe(1) // 1 ciudadano under leader 2
    })

    it('should generate accurate geographic distribution from entidad field', async () => {
      const analytics = await DataService.generateAnalyticsFromData(mockHierarchicalData)
      
      expect(analytics.geographic.regionDistribution).toBeDefined()
      expect(analytics.geographic.regionDistribution.length).toBeGreaterThan(0)
      
      const cdmxRegion = analytics.geographic.regionDistribution.find(r => r.region === 'Ciudad de México')
      expect(cdmxRegion).toBeDefined()
      expect(cdmxRegion?.count).toBe(3) // All 3 ciudadanos are from CDMX
      expect(cdmxRegion?.percentage).toBe(100) // 100% of ciudadanos
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
      expect(result).toEqual([])
      
      const analytics = await DataService.generateAnalyticsFromData([])
      expect(analytics.totalLideres).toBe(0)
      expect(analytics.totalBrigadistas).toBe(0)
      expect(analytics.totalMobilizers).toBe(0)
      expect(analytics.totalCitizens).toBe(0)
    })

    it('should calculate efficiency metrics correctly', async () => {
      const analytics = await DataService.generateAnalyticsFromData(mockHierarchicalData)
      
      // Verify conversion by leader
      expect(analytics.efficiency.conversionByLeader).toHaveLength(2)
      expect(analytics.efficiency.conversionByLeader[0].rate).toBeGreaterThan(0)
      
      // Verify productivity by brigadier
      expect(analytics.efficiency.productivityByBrigadier).toHaveLength(2)
      expect(analytics.efficiency.productivityByBrigadier[0].avgCitizens).toBeGreaterThan(0)
      
      // Verify top performers
      expect(analytics.efficiency.topPerformers).toBeDefined()
      expect(analytics.efficiency.topPerformers.length).toBeGreaterThan(0)
    })
  })

  describe('Export Functionality with Real Data', () => {
    it('should export Excel with all database fields', () => {
      const selectedItems = ['lider-1', 'lider-2']
      
      expect(() => {
        exportToExcel(mockHierarchicalData, selectedItems)
      }).not.toThrow()
      
      // Verify export was called
      const XLSX = require('xlsx')
      expect(XLSX.utils.book_new).toHaveBeenCalled()
      expect(XLSX.utils.json_to_sheet).toHaveBeenCalled()
      expect(XLSX.write).toHaveBeenCalled()
    })

    it('should export PDF with hierarchical structure', () => {
      const selectedItems = ['lider-1']
      
      expect(() => {
        exportToPDF(mockHierarchicalData, selectedItems)
      }).not.toThrow()
      
      // Verify PDF creation was called
      const jsPDF = require('jspdf')
      expect(jsPDF).toHaveBeenCalled()
    })

    it('should export interactive Excel with grouping', () => {
      const selectedItems = ['lider-1']
      
      expect(() => {
        exportInteractiveExcel(mockHierarchicalData, selectedItems)
      }).not.toThrow()
      
      // Verify interactive features were configured
      const XLSX = require('xlsx')
      expect(XLSX.utils.book_new).toHaveBeenCalled()
      expect(XLSX.utils.json_to_sheet).toHaveBeenCalled()
    })

    it('should include all required database fields in exports', () => {
      const selectedItems = ['lider-1']
      
      exportToExcel(mockHierarchicalData, selectedItems)
      
      const XLSX = require('xlsx')
      const jsonToSheetCalls = XLSX.utils.json_to_sheet.mock.calls
      
      // Find the call with actual data
      const dataCall = jsonToSheetCalls.find(call => 
        call[0] && call[0].length > 0 && call[0][0]['Nombre']
      )
      
      expect(dataCall).toBeDefined()
      const firstRow = dataCall[0][0]
      
      // Verify required database fields are present
      const requiredFields = [
        'ID', 'Nombre', 'Rol', 'Clave Electoral', 'CURP', 'Sección',
        'Entidad', 'Municipio', 'Dirección', 'Colonia', 'Código Postal',
        'Número Celular', 'Verificado', 'Fecha Registro'
      ]
      
      requiredFields.forEach(field => {
        expect(firstRow).toHaveProperty(field)
      })
    })

    it('should handle export with filtered data selections', () => {
      const selectedItems = ['lider-1'] // Only select first leader
      
      exportToExcel(mockHierarchicalData, selectedItems)
      
      const XLSX = require('xlsx')
      const jsonToSheetCalls = XLSX.utils.json_to_sheet.mock.calls
      
      // Verify that only selected leader's hierarchy is included
      const hierarchicalCall = jsonToSheetCalls[0]
      const exportedData = hierarchicalCall[0]
      
      // Should only include data related to lider-1
      const leaderIds = exportedData
        .filter((row: any) => row['Rol'] === 'Líder')
        .map((row: any) => row['ID Sin Formato'])
      
      expect(leaderIds).toContain('lider-1')
      expect(leaderIds).not.toContain('lider-2')
    })
  })

  describe('Search and Filter Integration', () => {
    it('should search across all database fields', async () => {
      const { result } = renderHook(() => useData())

      // Setup successful data fetch
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

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // Test search by name
      const nameResults = result.current.searchData('Juan')
      expect(nameResults.length).toBeGreaterThan(0)
      expect(nameResults[0].name).toContain('Juan')

      // Test search by direccion
      const addressResults = result.current.searchData('Principal')
      expect(addressResults.length).toBeGreaterThan(0)
      expect(addressResults[0].direccion).toContain('Principal')

      // Test search by colonia
      const coloniaResults = result.current.searchData('Centro')
      expect(coloniaResults.length).toBeGreaterThan(0)
      expect(coloniaResults[0].colonia).toContain('Centro')

      // Test search by seccion
      const seccionResults = result.current.searchData('001')
      expect(seccionResults.length).toBeGreaterThan(0)
      expect(seccionResults[0].seccion).toContain('001')

      // Test search by numero_cel
      const phoneResults = result.current.searchData('5551234567')
      expect(phoneResults.length).toBeGreaterThan(0)
      expect(phoneResults[0].numero_cel).toContain('5551234567')
    })

    it('should filter by role correctly', async () => {
      const { result } = renderHook(() => useData())

      // Setup successful data fetch
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

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // Test filtering by each role
      const liderResults = result.current.filterByRole('lider')
      expect(liderResults.every(person => person.role === 'lider')).toBe(true)

      const brigadistaResults = result.current.filterByRole('brigadista')
      expect(brigadistaResults.every(person => person.role === 'brigadista')).toBe(true)

      const movilizadorResults = result.current.filterByRole('movilizador')
      expect(movilizadorResults.every(person => person.role === 'movilizador')).toBe(true)

      const ciudadanoResults = result.current.filterByRole('ciudadano')
      expect(ciudadanoResults.every(person => person.role === 'ciudadano')).toBe(true)
    })

    it('should filter by date range using created_at timestamps', async () => {
      const { result } = renderHook(() => useData())

      // Setup successful data fetch
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
  })

  describe('Performance and Caching', () => {
    it('should use caching to improve performance', async () => {
      // Setup successful database mock
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

      // First call - should fetch from database
      const result1 = await DataService.getAllHierarchicalData()
      
      // Second call - should use cache
      const result2 = await DataService.getAllHierarchicalData()
      
      expect(result1).toEqual(result2)
      
      // Verify cache status
      const cacheStatus = DataService.getCacheStatus()
      expect(cacheStatus.dataCache).toBe(true)
    })

    it('should force refresh when requested', async () => {
      // Setup successful database mock
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

    it('should track performance metrics', async () => {
      const { result } = renderHook(() => useData())

      // Setup successful data fetch
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

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.performanceMetrics).toBeDefined()
      expect(result.current.performanceMetrics?.dataFetchTime).toBeGreaterThanOrEqual(0)
      expect(result.current.performanceMetrics?.analyticsGenerationTime).toBeGreaterThanOrEqual(0)
      expect(result.current.performanceMetrics?.totalRecords).toBeGreaterThan(0)
      expect(typeof result.current.performanceMetrics?.cacheHit).toBe('boolean')
    })
  })

  describe('Error Recovery and Resilience', () => {
    it('should implement retry logic for transient failures', async () => {
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

    it('should validate data integrity and handle corruption', async () => {
      // Mock corrupted data
      const corruptedData = [
        { id: null, nombre: null, created_at: null }
      ]
      
      mockSupabase.from.mockImplementation((tableName: string) => ({
        select: vi.fn(() => ({
          order: vi.fn(() => {
            switch (tableName) {
              case 'lideres':
                return { data: corruptedData, error: null }
              default:
                return { data: [], error: null }
            }
          })
        }))
      }))

      await expect(DataService.getAllHierarchicalData()).rejects.toThrow(ValidationError)
    })
  })

  describe('Health Check and Monitoring', () => {
    it('should perform health checks successfully', async () => {
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

    it('should detect unhealthy database state', async () => {
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

    it('should provide cache status information', () => {
      const status = DataService.getCacheStatus()
      
      expect(status).toBeDefined()
      expect(typeof status.dataCache).toBe('boolean')
      expect(typeof status.analyticsCache).toBe('boolean')
    })

    it('should clear cache when requested', async () => {
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
})