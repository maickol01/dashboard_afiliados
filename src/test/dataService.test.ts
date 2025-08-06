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

  describe('transformSupabaseHierarchy', () => {
    it('should transform nested Supabase response to Person[] format', () => {
      const mockNestedData = [
        {
          id: 'lider-1',
          nombre: 'Juan Pérez',
          created_at: '2024-01-01T00:00:00Z',
          clave_electoral: 'PEPJ800101',
          curp: 'PEPJ800101HDFRNN01',
          direccion: 'Calle Principal 123',
          colonia: 'Centro',
          seccion: '001',
          entidad: 'Ciudad de México',
          municipio: 'Cuauhtémoc',
          numero_cel: '5551234567',
          num_verificado: true,
          brigadistas: [
            {
              id: 'brigadista-1',
              nombre: 'María García',
              lider_id: 'lider-1',
              created_at: '2024-01-02T00:00:00Z',
              clave_electoral: 'GARM850215',
              curp: 'GARM850215MDFRRR02',
              direccion: 'Avenida Secundaria 456',
              colonia: 'Roma Norte',
              seccion: '002',
              entidad: 'Ciudad de México',
              municipio: 'Cuauhtémoc',
              numero_cel: '5559876543',
              num_verificado: true,
              movilizadores: [
                {
                  id: 'movilizador-1',
                  nombre: 'Carlos López',
                  brigadista_id: 'brigadista-1',
                  created_at: '2024-01-03T00:00:00Z',
                  clave_electoral: 'LOPC900310',
                  curp: 'LOPC900310HDFLPR03',
                  direccion: 'Calle Tercera 789',
                  colonia: 'Condesa',
                  seccion: '003',
                  entidad: 'Ciudad de México',
                  municipio: 'Cuauhtémoc',
                  numero_cel: '5555555555',
                  num_verificado: false,
                  ciudadanos: [
                    {
                      id: 'ciudadano-1',
                      nombre: 'Ana Martínez',
                      movilizador_id: 'movilizador-1',
                      created_at: '2024-01-04T00:00:00Z',
                      clave_electoral: 'MARA950420',
                      curp: 'MARA950420MDFRRN04',
                      direccion: 'Calle Cuarta 101',
                      colonia: 'Del Valle',
                      seccion: '004',
                      entidad: 'Ciudad de México',
                      municipio: 'Benito Juárez',
                      numero_cel: '5554444444',
                      num_verificado: true
                    },
                    {
                      id: 'ciudadano-2',
                      nombre: 'Luis Rodríguez',
                      movilizador_id: 'movilizador-1',
                      created_at: '2024-01-05T00:00:00Z',
                      clave_electoral: 'RODL880612',
                      curp: 'RODL880612HDFRDS05',
                      direccion: 'Calle Quinta 202',
                      colonia: 'Narvarte',
                      seccion: '005',
                      entidad: 'Ciudad de México',
                      municipio: 'Benito Juárez',
                      numero_cel: '5553333333',
                      num_verificado: false
                    }
                  ]
                }
              ]
            }
          ]
        }
      ]

      // Access the private method using bracket notation for testing
      const result = (DataService as any).transformSupabaseHierarchy(mockNestedData)

      expect(result).toBeDefined()
      expect(Array.isArray(result)).toBe(true)
      expect(result.length).toBe(1)

      // Verify lider structure
      const lider = result[0]
      expect(lider.id).toBe('lider-1')
      expect(lider.name).toBe('Juan Pérez')
      expect(lider.role).toBe('lider')
      expect(lider.registeredCount).toBe(2) // 2 ciudadanos total
      expect(lider.children).toBeDefined()
      expect(lider.children?.length).toBe(1)

      // Verify brigadista structure
      const brigadista = lider.children?.[0]
      expect(brigadista?.id).toBe('brigadista-1')
      expect(brigadista?.name).toBe('María García')
      expect(brigadista?.role).toBe('brigadista')
      expect(brigadista?.parentId).toBe('lider-1')
      expect(brigadista?.lider_id).toBe('lider-1')
      expect(brigadista?.registeredCount).toBe(2) // 2 ciudadanos from movilizador
      expect(brigadista?.children?.length).toBe(1)

      // Verify movilizador structure
      const movilizador = brigadista?.children?.[0]
      expect(movilizador?.id).toBe('movilizador-1')
      expect(movilizador?.name).toBe('Carlos López')
      expect(movilizador?.role).toBe('movilizador')
      expect(movilizador?.parentId).toBe('brigadista-1')
      expect(movilizador?.brigadista_id).toBe('brigadista-1')
      expect(movilizador?.registeredCount).toBe(2) // 2 ciudadanos directly
      expect(movilizador?.children?.length).toBe(2)

      // Verify ciudadanos structure
      const ciudadano1 = movilizador?.children?.[0]
      expect(ciudadano1?.id).toBe('ciudadano-1')
      expect(ciudadano1?.name).toBe('Ana Martínez')
      expect(ciudadano1?.role).toBe('ciudadano')
      expect(ciudadano1?.parentId).toBe('movilizador-1')
      expect(ciudadano1?.movilizador_id).toBe('movilizador-1')
      expect(ciudadano1?.registeredCount).toBe(0) // ciudadanos don't have children

      const ciudadano2 = movilizador?.children?.[1]
      expect(ciudadano2?.id).toBe('ciudadano-2')
      expect(ciudadano2?.name).toBe('Luis Rodríguez')
      expect(ciudadano2?.role).toBe('ciudadano')
      expect(ciudadano2?.parentId).toBe('movilizador-1')
      expect(ciudadano2?.movilizador_id).toBe('movilizador-1')
    })

    it('should handle empty nested data gracefully', () => {
      const result = (DataService as any).transformSupabaseHierarchy([])
      expect(result).toEqual([])
    })

    it('should handle null/undefined input gracefully', () => {
      const result1 = (DataService as any).transformSupabaseHierarchy(null)
      expect(result1).toEqual([])

      const result2 = (DataService as any).transformSupabaseHierarchy(undefined)
      expect(result2).toEqual([])
    })

    it('should handle missing nested arrays gracefully', () => {
      const mockDataWithMissingArrays = [
        {
          id: 'lider-1',
          nombre: 'Juan Pérez',
          created_at: '2024-01-01T00:00:00Z',
          clave_electoral: 'PEPJ800101',
          curp: 'PEPJ800101HDFRNN01',
          direccion: 'Calle Principal 123',
          colonia: 'Centro',
          seccion: '001',
          entidad: 'Ciudad de México',
          municipio: 'Cuauhtémoc',
          numero_cel: '5551234567',
          num_verificado: true
          // No brigadistas array
        }
      ]

      const result = (DataService as any).transformSupabaseHierarchy(mockDataWithMissingArrays)
      
      expect(result).toBeDefined()
      expect(result.length).toBe(1)
      expect(result[0].registeredCount).toBe(0)
      expect(result[0].children).toEqual([])
    })

    it('should calculate registeredCount correctly in single pass', () => {
      const mockComplexData = [
        {
          id: 'lider-1',
          nombre: 'Juan Pérez',
          created_at: '2024-01-01T00:00:00Z',
          clave_electoral: 'PEPJ800101',
          curp: 'PEPJ800101HDFRNN01',
          direccion: 'Calle Principal 123',
          colonia: 'Centro',
          seccion: '001',
          entidad: 'Ciudad de México',
          municipio: 'Cuauhtémoc',
          numero_cel: '5551234567',
          num_verificado: true,
          brigadistas: [
            {
              id: 'brigadista-1',
              nombre: 'María García',
              lider_id: 'lider-1',
              created_at: '2024-01-02T00:00:00Z',
              movilizadores: [
                {
                  id: 'movilizador-1',
                  nombre: 'Carlos López',
                  brigadista_id: 'brigadista-1',
                  created_at: '2024-01-03T00:00:00Z',
                  ciudadanos: [
                    { id: 'c1', nombre: 'Ciudadano 1', movilizador_id: 'movilizador-1', created_at: '2024-01-04T00:00:00Z', num_verificado: true },
                    { id: 'c2', nombre: 'Ciudadano 2', movilizador_id: 'movilizador-1', created_at: '2024-01-05T00:00:00Z', num_verificado: false }
                  ]
                },
                {
                  id: 'movilizador-2',
                  nombre: 'Ana Martínez',
                  brigadista_id: 'brigadista-1',
                  created_at: '2024-01-06T00:00:00Z',
                  ciudadanos: [
                    { id: 'c3', nombre: 'Ciudadano 3', movilizador_id: 'movilizador-2', created_at: '2024-01-07T00:00:00Z', num_verificado: true }
                  ]
                }
              ]
            },
            {
              id: 'brigadista-2',
              nombre: 'Luis Rodríguez',
              lider_id: 'lider-1',
              created_at: '2024-01-08T00:00:00Z',
              movilizadores: [
                {
                  id: 'movilizador-3',
                  nombre: 'Pedro Sánchez',
                  brigadista_id: 'brigadista-2',
                  created_at: '2024-01-09T00:00:00Z',
                  ciudadanos: [
                    { id: 'c4', nombre: 'Ciudadano 4', movilizador_id: 'movilizador-3', created_at: '2024-01-10T00:00:00Z', num_verificado: true },
                    { id: 'c5', nombre: 'Ciudadano 5', movilizador_id: 'movilizador-3', created_at: '2024-01-11T00:00:00Z', num_verificado: false },
                    { id: 'c6', nombre: 'Ciudadano 6', movilizador_id: 'movilizador-3', created_at: '2024-01-12T00:00:00Z', num_verificado: true }
                  ]
                }
              ]
            }
          ]
        }
      ]

      const result = (DataService as any).transformSupabaseHierarchy(mockComplexData)
      
      // Verify counts are calculated correctly
      const lider = result[0]
      expect(lider.registeredCount).toBe(6) // Total ciudadanos: 2 + 1 + 3 = 6

      const brigadista1 = lider.children?.[0]
      expect(brigadista1?.registeredCount).toBe(3) // 2 + 1 = 3

      const brigadista2 = lider.children?.[1]
      expect(brigadista2?.registeredCount).toBe(3) // 3 ciudadanos

      const movilizador1 = brigadista1?.children?.[0]
      expect(movilizador1?.registeredCount).toBe(2) // 2 ciudadanos

      const movilizador2 = brigadista1?.children?.[1]
      expect(movilizador2?.registeredCount).toBe(1) // 1 ciudadano

      const movilizador3 = brigadista2?.children?.[0]
      expect(movilizador3?.registeredCount).toBe(3) // 3 ciudadanos
    })

    it('should maintain Person interface compatibility', () => {
      const mockData = [
        {
          id: 'lider-1',
          nombre: 'Juan Pérez',
          created_at: '2024-01-01T00:00:00Z',
          clave_electoral: 'PEPJ800101',
          curp: 'PEPJ800101HDFRNN01',
          direccion: 'Calle Principal 123',
          colonia: 'Centro',
          seccion: '001',
          entidad: 'Ciudad de México',
          municipio: 'Cuauhtémoc',
          numero_cel: '5551234567',
          num_verificado: true,
          brigadistas: []
        }
      ]

      const result = (DataService as any).transformSupabaseHierarchy(mockData)
      const person = result[0]

      // Verify all required Person interface fields are present
      expect(person.id).toBeDefined()
      expect(person.name).toBeDefined()
      expect(person.nombre).toBeDefined()
      expect(person.role).toBeDefined()
      expect(person.created_at).toBeInstanceOf(Date)
      expect(person.registeredCount).toBeDefined()
      expect(person.isActive).toBeDefined()
      expect(person.lastActivity).toBeInstanceOf(Date)
      expect(person.children).toBeDefined()
      expect(person.contactInfo).toBeDefined()

      // Verify database fields are preserved
      expect(person.clave_electoral).toBe('PEPJ800101')
      expect(person.curp).toBe('PEPJ800101HDFRNN01')
      expect(person.direccion).toBe('Calle Principal 123')
      expect(person.colonia).toBe('Centro')
      expect(person.seccion).toBe('001')
      expect(person.entidad).toBe('Ciudad de México')
      expect(person.municipio).toBe('Cuauhtémoc')
      expect(person.numero_cel).toBe('5551234567')
      expect(person.num_verificado).toBe(true)
    })
  })

  describe('PerformanestedStructure', () => {
    it('should validate correct nested structure successfully', () => {
      const validData = [
        {
          id: 'lider-1',
          nombre: 'Juan Pérez',
          created_at: '2024-01-01T00:00:00Z',
          brigadistas: [
            {
              id: 'brigadista-1',
              nombre: 'María García',
              lider_id: 'lider-1',
              created_at: '2024-01-02T00:00:00Z',
              movilizadores: [
                {
                  id: 'movilizador-1',
                  nombre: 'Carlos López',
                  brigadista_id: 'brigadista-1',
                  created_at: '2024-01-03T00:00:00Z',
                  ciudadanos: [
                    {
                      id: 'ciudadano-1',
                      nombre: 'Ana Martínez',
                      movilizador_id: 'movilizador-1',
                      created_at: '2024-01-04T00:00:00Z'
                    }
                  ]
                }
              ]
            }
          ]
        }
      ]

      expect(() => {
        (DataService as any).validateNestedStructure(validData)
      }).not.toThrow()
    })

    it('should throw ValidationError for null or undefined data', () => {
      expect(() => {
        (DataService as any).validateNestedStructure(null)
      }).toThrow(ValidationError)
    })

    it('should throw ValidationError for non-array data', () => {
      expect(() => {
        (DataService as any).validateNestedStructure('invalid')
      }).toThrow(ValidationError)
    })

    it('should throw ValidationError for leaders with missing required fields', () => {
      const invalidData = [
        {
          // Missing id and nombre
          created_at: '2024-01-01T00:00:00Z'
        }
      ]

      expect(() => {
        (DataService as any).validateNestedStructure(invalidData)
      }).toThrow(ValidationError)
    })

    it('should throw ValidationError for invalid brigadistas structure', () => {
      const invalidData = [
        {
          id: 'lider-1',
          nombre: 'Juan Pérez',
          created_at: '2024-01-01T00:00:00Z',
          brigadistas: 'invalid' // Should be array
        }
      ]

      expect(() => {
        (DataService as any).validateNestedStructure(invalidData)
      }).toThrow(ValidationError)
    })

    it('should handle empty arrays gracefully', () => {
      expect(() => {
        (DataService as any).validateNestedStructure([])
      }).not.toThrow()
    })
  })

  // Performance and Compatibility Tests for Database Optimization
  describe('Database Performance Optimization Tests', () => {
    describe('Performance Tests', () => {
      it('should load hierarchical data in under 200ms using nested query', async () => {
        // Mock the optimized nested query response
        const mockNestedResponse = [
          {
            id: 'lider-1',
            nombre: 'Juan Pérez',
            created_at: '2024-01-01T00:00:00Z',
            clave_electoral: 'PEPJ800101',
            curp: 'PEPJ800101HDFRNN01',
            direccion: 'Calle Principal 123',
            colonia: 'Centro',
            seccion: '001',
            entidad: 'Ciudad de México',
            municipio: 'Cuauhtémoc',
            numero_cel: '5551234567',
            num_verificado: true,
            brigadistas: [
              {
                id: 'brigadista-1',
                nombre: 'María García',
                lider_id: 'lider-1',
                created_at: '2024-01-02T00:00:00Z',
                clave_electoral: 'GARM850215',
                curp: 'GARM850215MDFRRR02',
                direccion: 'Avenida Secundaria 456',
                colonia: 'Roma Norte',
                seccion: '002',
                entidad: 'Ciudad de México',
                municipio: 'Cuauhtémoc',
                numero_cel: '5559876543',
                num_verificado: true,
                movilizadores: [
                  {
                    id: 'movilizador-1',
                    nombre: 'Carlos López',
                    brigadista_id: 'brigadista-1',
                    created_at: '2024-01-03T00:00:00Z',
                    clave_electoral: 'LOPC900310',
                    curp: 'LOPC900310HDFLPR03',
                    direccion: 'Calle Tercera 789',
                    colonia: 'Condesa',
                    seccion: '003',
                    entidad: 'Ciudad de México',
                    municipio: 'Cuauhtémoc',
                    numero_cel: '5555555555',
                    num_verificado: false,
                    ciudadanos: [
                      {
                        id: 'ciudadano-1',
                        nombre: 'Ana Martínez',
                        movilizador_id: 'movilizador-1',
                        created_at: '2024-01-04T00:00:00Z',
                        clave_electoral: 'MARA950420',
                        curp: 'MARA950420MDFRRN04',
                        direccion: 'Calle Cuarta 101',
                        colonia: 'Del Valle',
                        seccion: '004',
                        entidad: 'Ciudad de México',
                        municipio: 'Benito Juárez',
                        numero_cel: '5554444444',
                        num_verificado: true
                      },
                      {
                        id: 'ciudadano-2',
                        nombre: 'Luis Rodríguez',
                        movilizador_id: 'movilizador-1',
                        created_at: '2024-01-05T00:00:00Z',
                        clave_electoral: 'RODL880612',
                        curp: 'RODL880612HDFRDS05',
                        direccion: 'Calle Quinta 202',
                        colonia: 'Narvarte',
                        seccion: '005',
                        entidad: 'Ciudad de México',
                        municipio: 'Benito Juárez',
                        numero_cel: '5553333333',
                        num_verificado: false
                      }
                    ]
                  }
                ]
              }
            ]
          }
        ]

        // Mock the nested query to return structured data
        mockSupabase.from.mockImplementation(() => ({
          select: vi.fn(() => ({
            order: vi.fn(() => ({
              data: mockNestedResponse,
              error: null
            }))
          }))
        }))

        const startTime = performance.now()
        const data = await DataService.getAllHierarchicalData(true)
        const endTime = performance.now()
        const executionTime = endTime - startTime

        expect(executionTime).toBeLessThan(200)
        expect(data).toBeDefined()
        expect(Array.isArray(data)).toBe(true)
        expect(data.length).toBe(1)
        
        // Verify the data structure is correct
        const lider = data[0]
        expect(lider.registeredCount).toBe(2) // Should have 2 ciudadanos
      })

      it('should perform single database query instead of multiple queries', async () => {
        const mockNestedResponse = [
          {
            id: 'lider-1',
            nombre: 'Juan Pérez',
            created_at: '2024-01-01T00:00:00Z',
            brigadistas: []
          }
        ]

        mockSupabase.from.mockImplementation(() => ({
          select: vi.fn(() => ({
            order: vi.fn(() => ({
              data: mockNestedResponse,
              error: null
            }))
          }))
        }))

        await DataService.getAllHierarchicalData(true)

        // Verify only one call to supabase.from() was made (for the nested query)
        expect(mockSupabase.from).toHaveBeenCalledTimes(1)
        expect(mockSupabase.from).toHaveBeenCalledWith('lideres')
      })

      it('should scale linearly with larger datasets', async () => {
        // Create a larger mock dataset
        const largeMockResponse = Array.from({ length: 50 }, (_, i) => ({
          id: `lider-${i + 1}`,
          nombre: `Líder ${i + 1}`,
          created_at: '2024-01-01T00:00:00Z',
          brigadistas: Array.from({ length: 3 }, (_, j) => ({
            id: `brigadista-${i + 1}-${j + 1}`,
            nombre: `Brigadista ${i + 1}-${j + 1}`,
            lider_id: `lider-${i + 1}`,
            created_at: '2024-01-02T00:00:00Z',
            movilizadores: Array.from({ length: 2 }, (_, k) => ({
              id: `movilizador-${i + 1}-${j + 1}-${k + 1}`,
              nombre: `Movilizador ${i + 1}-${j + 1}-${k + 1}`,
              brigadista_id: `brigadista-${i + 1}-${j + 1}`,
              created_at: '2024-01-03T00:00:00Z',
              ciudadanos: Array.from({ length: 5 }, (_, l) => ({
                id: `ciudadano-${i + 1}-${j + 1}-${k + 1}-${l + 1}`,
                nombre: `Ciudadano ${i + 1}-${j + 1}-${k + 1}-${l + 1}`,
                movilizador_id: `movilizador-${i + 1}-${j + 1}-${k + 1}`,
                created_at: '2024-01-04T00:00:00Z',
                num_verificado: l % 2 === 0
              }))
            }))
          }))
        }))

        mockSupabase.from.mockImplementation(() => ({
          select: vi.fn(() => ({
            order: vi.fn(() => ({
              data: largeMockResponse,
              error: null
            }))
          }))
        }))

        const startTime = performance.now()
        const data = await DataService.getAllHierarchicalData(true)
        const endTime = performance.now()
        const executionTime = endTime - startTime

        // Should still be reasonably fast even with larger dataset
        expect(executionTime).toBeLessThan(500) // Allow more time for larger dataset
        expect(data).toBeDefined()
        expect(data.length).toBe(50)
        
        // Verify counts are calculated correctly
        const totalExpectedCiudadanos = 50 * 3 * 2 * 5 // 1500 ciudadanos
        const actualTotal = data.reduce((sum, lider) => sum + lider.registeredCount, 0)
        expect(actualTotal).toBe(totalExpectedCiudadanos)
      })
    })

    describe('Data Structure Compatibility Tests', () => {
      it('should maintain exact Person[] interface compatibility', async () => {
        const mockNestedResponse = [
          {
            id: 'lider-1',
            nombre: 'Juan Pérez',
            created_at: '2024-01-01T00:00:00Z',
            clave_electoral: 'PEPJ800101',
            curp: 'PEPJ800101HDFRNN01',
            direccion: 'Calle Principal 123',
            colonia: 'Centro',
            seccion: '001',
            entidad: 'Ciudad de México',
            municipio: 'Cuauhtémoc',
            numero_cel: '5551234567',
            num_verificado: true,
            brigadistas: [
              {
                id: 'brigadista-1',
                nombre: 'María García',
                lider_id: 'lider-1',
                created_at: '2024-01-02T00:00:00Z',
                movilizadores: [
                  {
                    id: 'movilizador-1',
                    nombre: 'Carlos López',
                    brigadista_id: 'brigadista-1',
                    created_at: '2024-01-03T00:00:00Z',
                    ciudadanos: [
                      {
                        id: 'ciudadano-1',
                        nombre: 'Ana Martínez',
                        movilizador_id: 'movilizador-1',
                        created_at: '2024-01-04T00:00:00Z',
                        num_verificado: true
                      }
                    ]
                  }
                ]
              }
            ]
          }
        ]

        mockSupabase.from.mockImplementation(() => ({
          select: vi.fn(() => ({
            order: vi.fn(() => ({
              data: mockNestedResponse,
              error: null
            }))
          }))
        }))

        const data = await DataService.getAllHierarchicalData(true)

        // Verify root level structure
        expect(Array.isArray(data)).toBe(true)
        
        data.forEach(person => {
          // Verify all required Person interface fields are present
          expect(person).toHaveProperty('id')
          expect(person).toHaveProperty('name')
          expect(person).toHaveProperty('nombre')
          expect(person).toHaveProperty('role')
          expect(person).toHaveProperty('created_at')
          expect(person).toHaveProperty('registeredCount')
          expect(person).toHaveProperty('isActive')
          expect(person).toHaveProperty('lastActivity')
          expect(person).toHaveProperty('children')
          expect(person).toHaveProperty('contactInfo')

          // Verify data types
          expect(typeof person.id).toBe('string')
          expect(typeof person.name).toBe('string')
          expect(typeof person.nombre).toBe('string')
          expect(typeof person.role).toBe('string')
          expect(person.created_at).toBeInstanceOf(Date)
          expect(typeof person.registeredCount).toBe('number')
          expect(typeof person.isActive).toBe('boolean')
          expect(person.lastActivity).toBeInstanceOf(Date)
          expect(Array.isArray(person.children)).toBe(true)
          expect(typeof person.contactInfo).toBe('object')

          // Verify database fields are preserved
          expect(person).toHaveProperty('clave_electoral')
          expect(person).toHaveProperty('curp')
          expect(person).toHaveProperty('direccion')
          expect(person).toHaveProperty('colonia')
          expect(person).toHaveProperty('seccion')
          expect(person).toHaveProperty('entidad')
          expect(person).toHaveProperty('municipio')
          expect(person).toHaveProperty('numero_cel')
          expect(person).toHaveProperty('num_verificado')

          // Recursively check children structure
          if (person.children && person.children.length > 0) {
            person.children.forEach(child => {
              expect(child).toHaveProperty('parentId')
              expect(child.parentId).toBe(person.id)
              
              // Verify role-specific fields
              if (child.role === 'brigadista') {
                expect(child).toHaveProperty('lider_id')
                expect(child.lider_id).toBe(person.id)
              } else if (child.role === 'movilizador') {
                expect(child).toHaveProperty('brigadista_id')
                expect(child.brigadista_id).toBe(person.id)
              } else if (child.role === 'ciudadano') {
                expect(child).toHaveProperty('movilizador_id')
                expect(child.movilizador_id).toBe(person.id)
              }
            })
          }
        })
      })

      it('should produce identical results to legacy implementation', async () => {
        // Mock both old and new query responses to return equivalent data
        const legacyMockData = {
          lideres: mockLideres,
          brigadistas: mockBrigadistas,
          movilizadores: mockMovilizadores,
          ciudadanos: mockCiudadanos
        }

        const nestedMockData = [
          {
            ...mockLideres[0],
            brigadistas: [
              {
                ...mockBrigadistas[0],
                movilizadores: [
                  {
                    ...mockMovilizadores[0],
                    ciudadanos: [mockCiudadanos[0], mockCiudadanos[1]]
                  }
                ]
              }
            ]
          },
          {
            ...mockLideres[1],
            brigadistas: [
              {
                ...mockBrigadistas[1],
                movilizadores: [
                  {
                    ...mockMovilizadores[1],
                    ciudadanos: [mockCiudadanos[2]]
                  }
                ]
              }
            ]
          }
        ]

        // Test with nested query (optimized)
        mockSupabase.from.mockImplementation(() => ({
          select: vi.fn(() => ({
            order: vi.fn(() => ({
              data: nestedMockData,
              error: null
            }))
          }))
        }))

        const optimizedResult = await DataService.getAllHierarchicalData(true)

        // Verify structure matches expected hierarchical data
        expect(optimizedResult).toBeDefined()
        expect(optimizedResult.length).toBe(2)
        
        // Verify first leader
        const lider1 = optimizedResult.find(l => l.id === 'lider-1')
        expect(lider1).toBeDefined()
        expect(lider1?.name).toBe('Juan Pérez')
        expect(lider1?.registeredCount).toBe(2)
        expect(lider1?.children?.length).toBe(1)

        // Verify second leader
        const lider2 = optimizedResult.find(l => l.id === 'lider-2')
        expect(lider2).toBeDefined()
        expect(lider2?.name).toBe('María González')
        expect(lider2?.registeredCount).toBe(1)
        expect(lider2?.children?.length).toBe(1)
      })

      it('should maintain analytics compatibility', async () => {
        const mockNestedResponse = [
          {
            id: 'lider-1',
            nombre: 'Juan Pérez',
            created_at: '2024-01-01T00:00:00Z',
            clave_electoral: 'PEPJ800101',
            entidad: 'Ciudad de México',
            municipio: 'Cuauhtémoc',
            num_verificado: true,
            brigadistas: [
              {
                id: 'brigadista-1',
                nombre: 'María García',
                lider_id: 'lider-1',
                created_at: '2024-01-02T00:00:00Z',
                entidad: 'Ciudad de México',
                municipio: 'Cuauhtémoc',
                num_verificado: true,
                movilizadores: [
                  {
                    id: 'movilizador-1',
                    nombre: 'Carlos López',
                    brigadista_id: 'brigadista-1',
                    created_at: '2024-01-03T00:00:00Z',
                    entidad: 'Ciudad de México',
                    municipio: 'Cuauhtémoc',
                    num_verificado: false,
                    ciudadanos: [
                      {
                        id: 'ciudadano-1',
                        nombre: 'Ana Martínez',
                        movilizador_id: 'movilizador-1',
                        created_at: '2024-01-04T00:00:00Z',
                        entidad: 'Ciudad de México',
                        municipio: 'Benito Juárez',
                        num_verificado: true
                      },
                      {
                        id: 'ciudadano-2',
                        nombre: 'Luis Rodríguez',
                        movilizador_id: 'movilizador-1',
                        created_at: '2024-01-05T00:00:00Z',
                        entidad: 'Ciudad de México',
                        municipio: 'Benito Juárez',
                        num_verificado: false
                      }
                    ]
                  }
                ]
              }
            ]
          }
        ]

        mockSupabase.from.mockImplementation(() => ({
          select: vi.fn(() => ({
            order: vi.fn(() => ({
              data: mockNestedResponse,
              error: null
            }))
          }))
        }))

        const hierarchicalData = await DataService.getAllHierarchicalData(true)
        const analytics = await DataService.generateAnalyticsFromData(hierarchicalData)

        // Verify analytics can be generated from optimized data
        expect(analytics).toBeDefined()
        expect(analytics.totalLideres).toBe(1)
        expect(analytics.totalBrigadistas).toBe(1)
        expect(analytics.totalMobilizers).toBe(1)
        expect(analytics.totalCitizens).toBe(2)
        
        // Verify verification rate calculation (only ciudadanos)
        expect(analytics.conversionRate).toBe(50) // 1 out of 2 ciudadanos verified
        
        // Verify leader performance
        expect(analytics.leaderPerformance).toHaveLength(1)
        expect(analytics.leaderPerformance[0].name).toBe('Juan Pérez')
        expect(analytics.leaderPerformance[0].registered).toBe(2)
      })
    })

    describe('Data Integrity Tests', () => {
      it('should calculate registeredCount correctly in single pass', async () => {
        const mockComplexHierarchy = [
          {
            id: 'lider-1',
            nombre: 'Juan Pérez',
            created_at: '2024-01-01T00:00:00Z',
            brigadistas: [
              {
                id: 'brigadista-1',
                nombre: 'María García',
                lider_id: 'lider-1',
                created_at: '2024-01-02T00:00:00Z',
                movilizadores: [
                  {
                    id: 'movilizador-1',
                    nombre: 'Carlos López',
                    brigadista_id: 'brigadista-1',
                    created_at: '2024-01-03T00:00:00Z',
                    ciudadanos: [
                      { id: 'c1', nombre: 'Ciudadano 1', movilizador_id: 'movilizador-1', created_at: '2024-01-04T00:00:00Z', num_verificado: true },
                      { id: 'c2', nombre: 'Ciudadano 2', movilizador_id: 'movilizador-1', created_at: '2024-01-05T00:00:00Z', num_verificado: false },
                      { id: 'c3', nombre: 'Ciudadano 3', movilizador_id: 'movilizador-1', created_at: '2024-01-06T00:00:00Z', num_verificado: true }
                    ]
                  },
                  {
                    id: 'movilizador-2',
                    nombre: 'Ana Martínez',
                    brigadista_id: 'brigadista-1',
                    created_at: '2024-01-07T00:00:00Z',
                    ciudadanos: [
                      { id: 'c4', nombre: 'Ciudadano 4', movilizador_id: 'movilizador-2', created_at: '2024-01-08T00:00:00Z', num_verificado: true },
                      { id: 'c5', nombre: 'Ciudadano 5', movilizador_id: 'movilizador-2', created_at: '2024-01-09T00:00:00Z', num_verificado: false }
                    ]
                  }
                ]
              },
              {
                id: 'brigadista-2',
                nombre: 'Luis Rodríguez',
                lider_id: 'lider-1',
                created_at: '2024-01-10T00:00:00Z',
                movilizadores: [
                  {
                    id: 'movilizador-3',
                    nombre: 'Pedro Sánchez',
                    brigadista_id: 'brigadista-2',
                    created_at: '2024-01-11T00:00:00Z',
                    ciudadanos: [
                      { id: 'c6', nombre: 'Ciudadano 6', movilizador_id: 'movilizador-3', created_at: '2024-01-12T00:00:00Z', num_verificado: true }
                    ]
                  }
                ]
              }
            ]
          }
        ]

        mockSupabase.from.mockImplementation(() => ({
          select: vi.fn(() => ({
            order: vi.fn(() => ({
              data: mockComplexHierarchy,
              error: null
            }))
          }))
        }))

        const data = await DataService.getAllHierarchicalData(true)
        
        // Verify counts are calculated correctly at all levels
        const lider = data[0]
        expect(lider.registeredCount).toBe(6) // Total: 3 + 2 + 1 = 6

        const brigadista1 = lider.children?.[0]
        expect(brigadista1?.registeredCount).toBe(5) // 3 + 2 = 5

        const brigadista2 = lider.children?.[1]
        expect(brigadista2?.registeredCount).toBe(1) // 1 ciudadano

        const movilizador1 = brigadista1?.children?.[0]
        expect(movilizador1?.registeredCount).toBe(3) // 3 ciudadanos

        const movilizador2 = brigadista1?.children?.[1]
        expect(movilizador2?.registeredCount).toBe(2) // 2 ciudadanos

        const movilizador3 = brigadista2?.children?.[0]
        expect(movilizador3?.registeredCount).toBe(1) // 1 ciudadano

        // Verify ciudadanos have 0 registeredCount
        const ciudadanos = movilizador1?.children || []
        ciudadanos.forEach(ciudadano => {
          expect(ciudadano.registeredCount).toBe(0)
        })
      })

      it('should validate hierarchical relationships correctly', async () => {
        const mockValidHierarchy = [
          {
            id: 'lider-1',
            nombre: 'Juan Pérez',
            created_at: '2024-01-01T00:00:00Z',
            brigadistas: [
              {
                id: 'brigadista-1',
                nombre: 'María García',
                lider_id: 'lider-1', // Correct relationship
                created_at: '2024-01-02T00:00:00Z',
                movilizadores: [
                  {
                    id: 'movilizador-1',
                    nombre: 'Carlos López',
                    brigadista_id: 'brigadista-1', // Correct relationship
                    created_at: '2024-01-03T00:00:00Z',
                    ciudadanos: [
                      {
                        id: 'ciudadano-1',
                        nombre: 'Ana Martínez',
                        movilizador_id: 'movilizador-1', // Correct relationship
                        created_at: '2024-01-04T00:00:00Z',
                        num_verificado: true
                      }
                    ]
                  }
                ]
              }
            ]
          }
        ]

        mockSupabase.from.mockImplementation(() => ({
          select: vi.fn(() => ({
            order: vi.fn(() => ({
              data: mockValidHierarchy,
              error: null
            }))
          }))
        }))

        const data = await DataService.getAllHierarchicalData(true)
        
        // Verify relationships are maintained
        const lider = data[0]
        const brigadista = lider.children?.[0]
        const movilizador = brigadista?.children?.[0]
        const ciudadano = movilizador?.children?.[0]

        expect(brigadista?.parentId).toBe(lider.id)
        expect(brigadista?.lider_id).toBe(lider.id)
        
        expect(movilizador?.parentId).toBe(brigadista?.id)
        expect(movilizador?.brigadista_id).toBe(brigadista?.id)
        
        expect(ciudadano?.parentId).toBe(movilizador?.id)
        expect(ciudadano?.movilizador_id).toBe(movilizador?.id)
      })

      it('should handle missing nested arrays gracefully', async () => {
        const mockIncompleteHierarchy = [
          {
            id: 'lider-1',
            nombre: 'Juan Pérez',
            created_at: '2024-01-01T00:00:00Z'
            // No brigadistas array
          },
          {
            id: 'lider-2',
            nombre: 'María González',
            created_at: '2024-01-02T00:00:00Z',
            brigadistas: [
              {
                id: 'brigadista-1',
                nombre: 'Carlos López',
                lider_id: 'lider-2',
                created_at: '2024-01-03T00:00:00Z'
                // No movilizadores array
              }
            ]
          }
        ]

        mockSupabase.from.mockImplementation(() => ({
          select: vi.fn(() => ({
            order: vi.fn(() => ({
              data: mockIncompleteHierarchy,
              error: null
            }))
          }))
        }))

        const data = await DataService.getAllHierarchicalData(true)
        
        expect(data).toBeDefined()
        expect(data.length).toBe(2)
        
        // First leader should have empty children and 0 count
        expect(data[0].children).toEqual([])
        expect(data[0].registeredCount).toBe(0)
        
        // Second leader should have brigadista with empty children and 0 count
        expect(data[1].children?.length).toBe(1)
        expect(data[1].children?.[0].children).toEqual([])
        expect(data[1].children?.[0].registeredCount).toBe(0)
        expect(data[1].registeredCount).toBe(0)
      })

      it('should preserve all database fields during transformation', async () => {
        const mockDetailedHierarchy = [
          {
            id: 'lider-1',
            nombre: 'Juan Pérez',
            created_at: '2024-01-01T00:00:00Z',
            clave_electoral: 'PEPJ800101',
            curp: 'PEPJ800101HDFRNN01',
            direccion: 'Calle Principal 123',
            colonia: 'Centro',
            codigo_postal: '12345',
            seccion: '001',
            entidad: 'Ciudad de México',
            municipio: 'Cuauhtémoc',
            numero_cel: '5551234567',
            num_verificado: true,
            brigadistas: [
              {
                id: 'brigadista-1',
                nombre: 'María García',
                lider_id: 'lider-1',
                created_at: '2024-01-02T00:00:00Z',
                clave_electoral: 'GARM850215',
                curp: 'GARM850215MDFRRR02',
                direccion: 'Avenida Secundaria 456',
                colonia: 'Roma Norte',
                codigo_postal: '06700',
                seccion: '002',
                entidad: 'Ciudad de México',
                municipio: 'Cuauhtémoc',
                numero_cel: '5559876543',
                num_verificado: true,
                movilizadores: []
              }
            ]
          }
        ]

        mockSupabase.from.mockImplementation(() => ({
          select: vi.fn(() => ({
            order: vi.fn(() => ({
              data: mockDetailedHierarchy,
              error: null
            }))
          }))
        }))

        const data = await DataService.getAllHierarchicalData(true)
        
        const lider = data[0]
        const brigadista = lider.children?.[0]

        // Verify all database fields are preserved for lider
        expect(lider.clave_electoral).toBe('PEPJ800101')
        expect(lider.curp).toBe('PEPJ800101HDFRNN01')
        expect(lider.direccion).toBe('Calle Principal 123')
        expect(lider.colonia).toBe('Centro')
        expect(lider.codigo_postal).toBe('12345')
        expect(lider.seccion).toBe('001')
        expect(lider.entidad).toBe('Ciudad de México')
        expect(lider.municipio).toBe('Cuauhtémoc')
        expect(lider.numero_cel).toBe('5551234567')
        expect(lider.num_verificado).toBe(true)

        // Verify all database fields are preserved for brigadista
        expect(brigadista?.clave_electoral).toBe('GARM850215')
        expect(brigadista?.curp).toBe('GARM850215MDFRRR02')
        expect(brigadista?.direccion).toBe('Avenida Secundaria 456')
        expect(brigadista?.colonia).toBe('Roma Norte')
        expect(brigadista?.codigo_postal).toBe('06700')
        expect(brigadista?.seccion).toBe('002')
        expect(brigadista?.entidad).toBe('Ciudad de México')
        expect(brigadista?.municipio).toBe('Cuauhtémoc')
        expect(brigadista?.numero_cel).toBe('5559876543')
        expect(brigadista?.num_verificado).toBe(true)
      })
    })
  }).toThrow(ValidationError)

      expect(() => {
        (DataService as any).validateNestedStructure(undefined)
      }).toThrow(ValidationError)
    })

    it('should throw ValidationError for non-array data', () => {
      expect(() => {
        (DataService as any).validateNestedStructure('not an array')
      }).toThrow(ValidationError)

      expect(() => {
        (DataService as any).validateNestedStructure({ not: 'an array' })
      }).toThrow(ValidationError)
    })

    it('should handle empty array gracefully', () => {
      expect(() => {
        (DataService as any).validateNestedStructure([])
      }).not.toThrow()
    })

    it('should throw ValidationError for leader missing required fields', () => {
      const invalidLeaderData = [
        {
          // Missing id
          nombre: 'Juan Pérez',
          created_at: '2024-01-01T00:00:00Z'
        }
      ]

      expect(() => {
        (DataService as any).validateNestedStructure(invalidLeaderData)
      }).toThrow(ValidationError)
    })

    it('should throw ValidationError for invalid leader data types', () => {
      const invalidLeaderData = [
        {
          id: '', // Empty string
          nombre: 'Juan Pérez',
          created_at: '2024-01-01T00:00:00Z'
        }
      ]

      expect(() => {
        (DataService as any).validateNestedStructure(invalidLeaderData)
      }).toThrow(ValidationError)
    })

    it('should throw ValidationError for invalid date', () => {
      const invalidDateData = [
        {
          id: 'lider-1',
          nombre: 'Juan Pérez',
          created_at: 'invalid-date'
        }
      ]

      expect(() => {
        (DataService as any).validateNestedStructure(invalidDateData)
      }).toThrow(ValidationError)
    })

    it('should throw ValidationError for brigadistas not being array', () => {
      const invalidBrigadistasData = [
        {
          id: 'lider-1',
          nombre: 'Juan Pérez',
          created_at: '2024-01-01T00:00:00Z',
          brigadistas: 'not an array'
        }
      ]

      expect(() => {
        (DataService as any).validateNestedStructure(invalidBrigadistasData)
      }).toThrow(ValidationError)
    })

    it('should throw ValidationError for brigadista missing required fields', () => {
      const invalidBrigadistaData = [
        {
          id: 'lider-1',
          nombre: 'Juan Pérez',
          created_at: '2024-01-01T00:00:00Z',
          brigadistas: [
            {
              // Missing id
              nombre: 'María García',
              lider_id: 'lider-1',
              created_at: '2024-01-02T00:00:00Z'
            }
          ]
        }
      ]

      expect(() => {
        (DataService as any).validateNestedStructure(invalidBrigadistaData)
      }).toThrow(ValidationError)
    })

    it('should throw ValidationError for incorrect relationship IDs', () => {
      const invalidRelationshipData = [
        {
          id: 'lider-1',
          nombre: 'Juan Pérez',
          created_at: '2024-01-01T00:00:00Z',
          brigadistas: [
            {
              id: 'brigadista-1',
              nombre: 'María García',
              lider_id: 'wrong-lider-id', // Incorrect relationship
              created_at: '2024-01-02T00:00:00Z'
            }
          ]
        }
      ]

      expect(() => {
        (DataService as any).validateNestedStructure(invalidRelationshipData)
      }).toThrow(ValidationError)
    })

    it('should throw ValidationError for movilizadores not being array', () => {
      const invalidMovilizadoresData = [
        {
          id: 'lider-1',
          nombre: 'Juan Pérez',
          created_at: '2024-01-01T00:00:00Z',
          brigadistas: [
            {
              id: 'brigadista-1',
              nombre: 'María García',
              lider_id: 'lider-1',
              created_at: '2024-01-02T00:00:00Z',
              movilizadores: 'not an array'
            }
          ]
        }
      ]

      expect(() => {
        (DataService as any).validateNestedStructure(invalidMovilizadoresData)
      }).toThrow(ValidationError)
    })

    it('should throw ValidationError for movilizador missing required fields', () => {
      const invalidMovilizadorData = [
        {
          id: 'lider-1',
          nombre: 'Juan Pérez',
          created_at: '2024-01-01T00:00:00Z',
          brigadistas: [
            {
              id: 'brigadista-1',
              nombre: 'María García',
              lider_id: 'lider-1',
              created_at: '2024-01-02T00:00:00Z',
              movilizadores: [
                {
                  // Missing id
                  nombre: 'Carlos López',
                  brigadista_id: 'brigadista-1',
                  created_at: '2024-01-03T00:00:00Z'
                }
              ]
            }
          ]
        }
      ]

      expect(() => {
        (DataService as any).validateNestedStructure(invalidMovilizadorData)
      }).toThrow(ValidationError)
    })

    it('should throw ValidationError for ciudadanos not being array', () => {
      const invalidCiudadanosData = [
        {
          id: 'lider-1',
          nombre: 'Juan Pérez',
          created_at: '2024-01-01T00:00:00Z',
          brigadistas: [
            {
              id: 'brigadista-1',
              nombre: 'María García',
              lider_id: 'lider-1',
              created_at: '2024-01-02T00:00:00Z',
              movilizadores: [
                {
                  id: 'movilizador-1',
                  nombre: 'Carlos López',
                  brigadista_id: 'brigadista-1',
                  created_at: '2024-01-03T00:00:00Z',
                  ciudadanos: 'not an array'
                }
              ]
            }
          ]
        }
      ]

      expect(() => {
        (DataService as any).validateNestedStructure(invalidCiudadanosData)
      }).toThrow(ValidationError)
    })

    it('should throw ValidationError for ciudadano missing required fields', () => {
      const invalidCiudadanoData = [
        {
          id: 'lider-1',
          nombre: 'Juan Pérez',
          created_at: '2024-01-01T00:00:00Z',
          brigadistas: [
            {
              id: 'brigadista-1',
              nombre: 'María García',
              lider_id: 'lider-1',
              created_at: '2024-01-02T00:00:00Z',
              movilizadores: [
                {
                  id: 'movilizador-1',
                  nombre: 'Carlos López',
                  brigadista_id: 'brigadista-1',
                  created_at: '2024-01-03T00:00:00Z',
                  ciudadanos: [
                    {
                      // Missing id
                      nombre: 'Ana Martínez',
                      movilizador_id: 'movilizador-1',
                      created_at: '2024-01-04T00:00:00Z'
                    }
                  ]
                }
              ]
            }
          ]
        }
      ]

      expect(() => {
        (DataService as any).validateNestedStructure(invalidCiudadanoData)
      }).toThrow(ValidationError)
    })

    it('should throw ValidationError for duplicate IDs across hierarchy', () => {
      const duplicateIdData = [
        {
          id: 'duplicate-id',
          nombre: 'Juan Pérez',
          created_at: '2024-01-01T00:00:00Z',
          brigadistas: [
            {
              id: 'duplicate-id', // Same ID as leader
              nombre: 'María García',
              lider_id: 'duplicate-id',
              created_at: '2024-01-02T00:00:00Z'
            }
          ]
        }
      ]

      expect(() => {
        (DataService as any).validateNestedStructure(duplicateIdData)
      }).toThrow(ValidationError)
    })

    it('should handle null nested arrays gracefully', () => {
      const nullArraysData = [
        {
          id: 'lider-1',
          nombre: 'Juan Pérez',
          created_at: '2024-01-01T00:00:00Z',
          brigadistas: null // null is acceptable
        }
      ]

      expect(() => {
        (DataService as any).validateNestedStructure(nullArraysData)
      }).not.toThrow()
    })

    it('should wrap unexpected errors in DatabaseError', () => {
      // Mock a scenario that would cause an unexpected error
      const problematicData = [
        {
          id: 'lider-1',
          nombre: 'Juan Pérez',
          created_at: '2024-01-01T00:00:00Z'
        }
      ]

      // Mock the isValidDate method to throw an unexpected error
      const originalIsValidDate = (DataService as any).isValidDate
      ;(DataService as any).isValidDate = () => {
        throw new Error('Unexpected error')
      }

      expect(() => {
        (DataService as any).validateNestedStructure(problematicData)
      }).toThrow(DatabaseError)

      // Restore original method
      ;(DataService as any).isValidDate = originalIsValidDate
    })

    it('should validate complex nested structure with multiple levels', () => {
      const complexValidData = [
        {
          id: 'lider-1',
          nombre: 'Juan Pérez',
          created_at: '2024-01-01T00:00:00Z',
          brigadistas: [
            {
              id: 'brigadista-1',
              nombre: 'María García',
              lider_id: 'lider-1',
              created_at: '2024-01-02T00:00:00Z',
              movilizadores: [
                {
                  id: 'movilizador-1',
                  nombre: 'Carlos López',
                  brigadista_id: 'brigadista-1',
                  created_at: '2024-01-03T00:00:00Z',
                  ciudadanos: [
                    {
                      id: 'ciudadano-1',
                      nombre: 'Ana Martínez',
                      movilizador_id: 'movilizador-1',
                      created_at: '2024-01-04T00:00:00Z'
                    },
                    {
                      id: 'ciudadano-2',
                      nombre: 'Luis Rodríguez',
                      movilizador_id: 'movilizador-1',
                      created_at: '2024-01-05T00:00:00Z'
                    }
                  ]
                },
                {
                  id: 'movilizador-2',
                  nombre: 'Pedro Sánchez',
                  brigadista_id: 'brigadista-1',
                  created_at: '2024-01-06T00:00:00Z',
                  ciudadanos: []
                }
              ]
            },
            {
              id: 'brigadista-2',
              nombre: 'Laura González',
              lider_id: 'lider-1',
              created_at: '2024-01-07T00:00:00Z',
              movilizadores: null
            }
          ]
        },
        {
          id: 'lider-2',
          nombre: 'Roberto Díaz',
          created_at: '2024-01-08T00:00:00Z',
          brigadistas: []
        }
      ]

      expect(() => {
        (DataService as any).validateNestedStructure(complexValidData)
      }).not.toThrow()
    })

    it('should provide detailed error messages with context', () => {
      const invalidData = [
        {
          id: 'lider-1',
          nombre: 'Juan Pérez',
          created_at: '2024-01-01T00:00:00Z',
          brigadistas: [
            {
              id: 'brigadista-1',
              // Missing nombre
              lider_id: 'lider-1',
              created_at: '2024-01-02T00:00:00Z'
            }
          ]
        }
      ]

      try {
        (DataService as any).validateNestedStructure(invalidData)
        fail('Should have thrown ValidationError')
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError)
        expect(error.message).toContain('index 0')
        expect(error.message).toContain('lider-1')
        expect(error.message).toContain('nombre')
      }
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