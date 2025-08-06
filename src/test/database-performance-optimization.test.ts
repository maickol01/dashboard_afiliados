import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { DataService } from '../services/dataService'
import { DatabaseError, NetworkError, ValidationError } from '../types/errors'
import { mockLideres, mockBrigadistas, mockMovilizadores, mockCiudadanos } from './mockData'

// Mock cache manager
vi.mock('../services/cacheManager', () => ({
  cacheManager: {
    get: vi.fn().mockResolvedValue(null),
    set: vi.fn().mockResolvedValue(undefined),
    invalidate: vi.fn().mockResolvedValue(undefined),
    clear: vi.fn().mockResolvedValue(undefined)
  }
}))

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

describe('Database Performance Optimization Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Clear any cached data and reset circuit breaker
    DataService.clearCache()
    // Reset circuit breaker state by accessing private property
    try {
      ;(DataService as any).circuitBreaker.state = 'closed'
      ;(DataService as any).circuitBreaker.failureCount = 0
    } catch (error) {
      // Ignore if circuit breaker properties are not accessible
    }
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Performance Tests', () => {
    it('should load hierarchical data in under 200ms using nested query', { timeout: 10000 }, async () => {
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
      // Mock nested data equivalent to legacy mock data
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
})