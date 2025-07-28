import { supabase, type Lider, type Brigadista, type Movilizador, type Ciudadano } from '../lib/supabase'
import { Person, Analytics } from '../types'
import { DatabaseError, NetworkError, ServiceError, ValidationError } from '../types/errors'
import { withDatabaseRetry, CircuitBreaker } from '../utils/retry'

export class DataService {
  private static circuitBreaker = new CircuitBreaker(5, 60000) // 5 failures, 1 minute recovery
  private static dataCache: { data: Person[]; timestamp: number } | null = null
  private static analyticsCache: { analytics: Analytics; timestamp: number } | null = null
  private static readonly CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

  static async getAllHierarchicalData(forceRefresh: boolean = false): Promise<Person[]> {
    // Check cache first
    if (!forceRefresh && this.dataCache && (Date.now() - this.dataCache.timestamp) < this.CACHE_DURATION) {
      console.log('Returning cached hierarchical data')
      return this.dataCache.data
    }

    return this.circuitBreaker.execute(async () => {
      return withDatabaseRetry(async () => {
        try {
          // Validate network connectivity first
          await this.validateConnection()

          // Optimized parallel data fetching with selective fields
          const [lideresResult, brigadistasResult, movilizadoresResult, ciudadanosResult] = await Promise.all([
            this.fetchOptimizedTableData('lideres'),
            this.fetchOptimizedTableData('brigadistas'),
            this.fetchOptimizedTableData('movilizadores'),
            this.fetchOptimizedTableData('ciudadanos')
          ])

          const lideres = lideresResult as Lider[]
          const brigadistas = brigadistasResult as Brigadista[]
          const movilizadores = movilizadoresResult as Movilizador[]
          const ciudadanos = ciudadanosResult as Ciudadano[]

          // Validate data integrity
          this.validateHierarchicalData(lideres, brigadistas, movilizadores, ciudadanos)

          // Construir la jerarquía de forma optimizada
          const hierarchicalData = this.buildOptimizedHierarchy(lideres, brigadistas, movilizadores, ciudadanos)
          
          // Cache the result
          this.dataCache = {
            data: hierarchicalData,
            timestamp: Date.now()
          }

          return hierarchicalData
        } catch (error) {
          const enhancedError = this.enhanceError(error, 'getAllHierarchicalData')
          console.error('Error fetching hierarchical data:', enhancedError)
          throw enhancedError
        }
      }, 'Fetch hierarchical data')
    })
  }

  private static async validateConnection(): Promise<void> {
    try {
      const { error } = await supabase.from('lideres').select('id').limit(1)
      if (error) {
        throw new NetworkError('Database connection failed', new Error(error.message))
      }
    } catch (error) {
      if (error instanceof NetworkError) throw error
      throw new NetworkError('Network connectivity issue', error as Error)
    }
  }

  private static async fetchTableData(tableName: string): Promise<unknown[]> {
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        throw new DatabaseError(
          `Failed to fetch data from ${tableName}`,
          error.code,
          error.details,
          error.hint
        )
      }

      if (!data) {
        console.warn(`No data returned from ${tableName} table`)
        return []
      }

      return data
    } catch (error) {
      if (error instanceof DatabaseError) throw error
      throw new ServiceError(`Unexpected error fetching ${tableName}`, error as Error, { tableName })
    }
  }

  private static async fetchOptimizedTableData(tableName: string): Promise<unknown[]> {
    try {
      // Select only essential fields for better performance
      const essentialFields = [
        'id', 'nombre', 'created_at', 'clave_electoral', 'curp', 
        'direccion', 'colonia', 'seccion', 'entidad', 'municipio', 
        'numero_cel', 'num_verificado', 'codigo_postal'
      ]

      // Add relationship fields based on table
      const relationshipFields: Record<string, string[]> = {
        brigadistas: ['lider_id'],
        movilizadores: ['brigadista_id'],
        ciudadanos: ['movilizador_id']
      }

      const fieldsToSelect = [
        ...essentialFields,
        ...(relationshipFields[tableName] || [])
      ].join(', ')

      const { data, error } = await supabase
        .from(tableName)
        .select(fieldsToSelect)
        .order('created_at', { ascending: false })

      if (error) {
        throw new DatabaseError(
          `Failed to fetch optimized data from ${tableName}`,
          error.code,
          error.details,
          error.hint
        )
      }

      if (!data) {
        console.warn(`No data returned from ${tableName} table`)
        return []
      }

      return data
    } catch (error) {
      if (error instanceof DatabaseError) throw error
      throw new ServiceError(`Unexpected error fetching optimized ${tableName}`, error as Error, { tableName })
    }
  }

  private static validateHierarchicalData(
    lideres: Lider[],
    brigadistas: Brigadista[],
    movilizadores: Movilizador[],
    ciudadanos: Ciudadano[]
  ): void {
    // Validate required fields
    const validateRecords = (records: unknown[], tableName: string, requiredFields: string[]) => {
      records.forEach((record, index) => {
        requiredFields.forEach(field => {
          if (!(record as Record<string, unknown>)[field]) {
            throw new ValidationError(
              `Missing required field '${field}' in ${tableName} record at index ${index}`,
              field
            )
          }
        })
      })
    }

    try {
      validateRecords(lideres, 'lideres', ['id', 'nombre'])
      validateRecords(brigadistas, 'brigadistas', ['id', 'nombre', 'lider_id'])
      validateRecords(movilizadores, 'movilizadores', ['id', 'nombre', 'brigadista_id'])
      validateRecords(ciudadanos, 'ciudadanos', ['id', 'nombre', 'movilizador_id'])

      // Validate hierarchical relationships
      const liderIds = new Set(lideres.map(l => l.id))
      const brigadistaIds = new Set(brigadistas.map(b => b.id))
      const movilizadorIds = new Set(movilizadores.map(m => m.id))

      // Check for orphaned records
      const orphanedBrigadistas = brigadistas.filter(b => !liderIds.has(b.lider_id))
      const orphanedMovilizadores = movilizadores.filter(m => !brigadistaIds.has(m.brigadista_id))
      const orphanedCiudadanos = ciudadanos.filter(c => !movilizadorIds.has(c.movilizador_id))

      if (orphanedBrigadistas.length > 0) {
        console.warn(`Found ${orphanedBrigadistas.length} orphaned brigadistas`)
      }
      if (orphanedMovilizadores.length > 0) {
        console.warn(`Found ${orphanedMovilizadores.length} orphaned movilizadores`)
      }
      if (orphanedCiudadanos.length > 0) {
        console.warn(`Found ${orphanedCiudadanos.length} orphaned ciudadanos`)
      }
    } catch (error) {
      throw new ValidationError(`Data validation failed: ${(error as Error).message}`)
    }
  }

  private static enhanceError(error: unknown, context: string): Error {
    if (error instanceof DatabaseError || error instanceof NetworkError || error instanceof ValidationError) {
      return error
    }

    if (error instanceof Error) {
      return new ServiceError(`${context} failed: ${error.message}`, error, { context })
    }

    return new ServiceError(`${context} failed with unknown error`, undefined, { context, error })
  }

  private static buildHierarchy(
    lideres: Lider[],
    brigadistas: Brigadista[],
    movilizadores: Movilizador[],
    ciudadanos: Ciudadano[]
  ): Person[] {
    // Convertir líderes
    const lideresPersons: Person[] = lideres.map(lider => ({
      ...this.convertToPersonFormat(lider, 'lider'),
      children: []
    }))

    // Agregar brigadistas a sus líderes
    lideresPersons.forEach(lider => {
      const brigadistasDelLider = brigadistas.filter(b => b.lider_id === lider.id)
      
      lider.children = brigadistasDelLider.map(brigadista => ({
        ...this.convertToPersonFormat(brigadista, 'brigadista'),
        parentId: lider.id,
        lider_id: lider.id,
        children: []
      }))
    })

    // Agregar movilizadores a sus brigadistas
    lideresPersons.forEach(lider => {
      lider.children?.forEach(brigadista => {
        const movilizadoresDelBrigadista = movilizadores.filter(m => m.brigadista_id === brigadista.id)
        
        brigadista.children = movilizadoresDelBrigadista.map(movilizador => ({
          ...this.convertToPersonFormat(movilizador, 'movilizador'),
          parentId: brigadista.id,
          brigadista_id: brigadista.id,
          children: []
        }))
      })
    })

    // Agregar ciudadanos a sus movilizadores
    lideresPersons.forEach(lider => {
      lider.children?.forEach(brigadista => {
        brigadista.children?.forEach(movilizador => {
          const ciudadanosDelMovilizador = ciudadanos.filter(c => c.movilizador_id === movilizador.id)
          
          movilizador.children = ciudadanosDelMovilizador.map(ciudadano => ({
            ...this.convertToPersonFormat(ciudadano, 'ciudadano'),
            parentId: movilizador.id,
            movilizador_id: movilizador.id
          }))
        })
      })
    })

    // Calcular conteos
    this.calculateCounts(lideresPersons)

    return lideresPersons
  }

  private static buildOptimizedHierarchy(
    lideres: Lider[],
    brigadistas: Brigadista[],
    movilizadores: Movilizador[],
    ciudadanos: Ciudadano[]
  ): Person[] {
    // Create lookup maps for O(1) access instead of O(n) filtering
    const brigadistasByLider = new Map<string, Brigadista[]>()
    const movilizadoresByBrigadista = new Map<string, Movilizador[]>()
    const ciudadanosByMovilizador = new Map<string, Ciudadano[]>()

    // Build lookup maps
    brigadistas.forEach(b => {
      if (!brigadistasByLider.has(b.lider_id)) {
        brigadistasByLider.set(b.lider_id, [])
      }
      brigadistasByLider.get(b.lider_id)!.push(b)
    })

    movilizadores.forEach(m => {
      if (!movilizadoresByBrigadista.has(m.brigadista_id)) {
        movilizadoresByBrigadista.set(m.brigadista_id, [])
      }
      movilizadoresByBrigadista.get(m.brigadista_id)!.push(m)
    })

    ciudadanos.forEach(c => {
      if (!ciudadanosByMovilizador.has(c.movilizador_id)) {
        ciudadanosByMovilizador.set(c.movilizador_id, [])
      }
      ciudadanosByMovilizador.get(c.movilizador_id)!.push(c)
    })

    // Build hierarchy using lookup maps
    const lideresPersons: Person[] = lideres.map(lider => {
      const liderPerson: Person = {
        ...this.convertToPersonFormat(lider, 'lider'),
        children: []
      }

      // Get brigadistas for this leader
      const brigadistasDelLider = brigadistasByLider.get(lider.id) || []
      
      liderPerson.children = brigadistasDelLider.map(brigadista => {
        const brigadistaPerson: Person = {
          ...this.convertToPersonFormat(brigadista, 'brigadista'),
          parentId: lider.id,
          lider_id: lider.id,
          children: []
        }

        // Get movilizadores for this brigadista
        const movilizadoresDelBrigadista = movilizadoresByBrigadista.get(brigadista.id) || []
        
        brigadistaPerson.children = movilizadoresDelBrigadista.map(movilizador => {
          const movilizadorPerson: Person = {
            ...this.convertToPersonFormat(movilizador, 'movilizador'),
            parentId: brigadista.id,
            brigadista_id: brigadista.id,
            children: []
          }

          // Get ciudadanos for this movilizador
          const ciudadanosDelMovilizador = ciudadanosByMovilizador.get(movilizador.id) || []
          
          movilizadorPerson.children = ciudadanosDelMovilizador.map(ciudadano => ({
            ...this.convertToPersonFormat(ciudadano, 'ciudadano'),
            parentId: movilizador.id,
            movilizador_id: movilizador.id
          }))

          return movilizadorPerson
        })

        return brigadistaPerson
      })

      return liderPerson
    })

    // Calculate counts efficiently
    this.calculateCountsOptimized(lideresPersons)

    return lideresPersons
  }

  private static convertToPersonFormat(
    dbRecord: Lider | Brigadista | Movilizador | Ciudadano,
    role: 'lider' | 'brigadista' | 'movilizador' | 'ciudadano'
  ): Person {
    return {
      id: dbRecord.id,
      name: dbRecord.nombre,
      nombre: dbRecord.nombre,
      role,
      created_at: new Date(dbRecord.created_at),
      registeredCount: 0,
      isActive: true,
      lastActivity: new Date(dbRecord.created_at),
      
      // Campos adicionales para compatibilidad
      region: dbRecord.entidad,
      registrationDate: new Date(dbRecord.created_at),
      
      // Campos de la base de datos
      clave_electoral: dbRecord.clave_electoral || undefined,
      curp: dbRecord.curp || undefined,
      direccion: dbRecord.direccion || undefined,
      colonia: dbRecord.colonia || undefined,
      codigo_postal: dbRecord.codigo_postal || undefined,
      seccion: dbRecord.seccion || undefined,
      entidad: dbRecord.entidad || undefined,
      municipio: dbRecord.municipio || undefined,
      numero_cel: dbRecord.numero_cel || undefined,
      num_verificado: dbRecord.num_verificado,

      // Campos específicos por rol
      lider_id: 'lider_id' in dbRecord ? dbRecord.lider_id : undefined,
      brigadista_id: 'brigadista_id' in dbRecord ? dbRecord.brigadista_id : undefined,
      movilizador_id: 'movilizador_id' in dbRecord ? dbRecord.movilizador_id : undefined,

      // Información de contacto
      contactInfo: {
        phone: dbRecord.numero_cel || undefined,
        verified: dbRecord.num_verificado
      }
    }
  }

  private static calculateCounts(lideresPersons: Person[]): void {
    lideresPersons.forEach(lider => {
      let totalCiudadanos = 0

      lider.children?.forEach(brigadista => {
        let ciudadanosBrigadista = 0

        brigadista.children?.forEach(movilizador => {
          const ciudadanosMovilizador = movilizador.children?.length || 0
          movilizador.registeredCount = ciudadanosMovilizador
          ciudadanosBrigadista += ciudadanosMovilizador
        })

        brigadista.registeredCount = ciudadanosBrigadista
        totalCiudadanos += ciudadanosBrigadista
      })

      lider.registeredCount = totalCiudadanos
    })
  }

  private static calculateCountsOptimized(lideresPersons: Person[]): void {
    // Single pass calculation for better performance
    lideresPersons.forEach(lider => {
      let totalCiudadanos = 0

      if (lider.children) {
        lider.children.forEach(brigadista => {
          let ciudadanosBrigadista = 0

          if (brigadista.children) {
            brigadista.children.forEach(movilizador => {
              const ciudadanosMovilizador = movilizador.children?.length || 0
              movilizador.registeredCount = ciudadanosMovilizador
              ciudadanosBrigadista += ciudadanosMovilizador
            })
          }

          brigadista.registeredCount = ciudadanosBrigadista
          totalCiudadanos += ciudadanosBrigadista
        })
      }

      lider.registeredCount = totalCiudadanos
    })
  }

  static async generateAnalyticsFromData(hierarchicalData: Person[], forceRefresh: boolean = false): Promise<Analytics> {
    // Check analytics cache first
    if (!forceRefresh && this.analyticsCache && (Date.now() - this.analyticsCache.timestamp) < this.CACHE_DURATION) {
      console.log('Returning cached analytics data')
      return this.analyticsCache.analytics
    }

    return withDatabaseRetry(async () => {
      try {
        const startTime = Date.now()
        console.log('Starting optimized analytics generation...')

        // Validate input data
        if (!Array.isArray(hierarchicalData)) {
          throw new ValidationError('Invalid hierarchical data: expected array')
        }

        if (hierarchicalData.length === 0) {
          console.warn('No hierarchical data provided for analytics generation')
          return this.getEmptyAnalytics()
        }

        // Optimized flat data extraction with single pass
        const allPeople = this.getAllPeopleFlatOptimized(hierarchicalData)
        
        if (allPeople.length === 0) {
          console.warn('No people found in hierarchical data')
          return this.getEmptyAnalytics()
        }

        // Continue with optimized analytics generation

        // Validate data integrity for analytics
        this.validateAnalyticsData(allPeople)
        
        // Pre-filter people by role for better performance
        const peopleByRole = this.groupPeopleByRole(allPeople)
        
        // Conteos por rol usando grupos pre-filtrados
        const totalLideres = hierarchicalData.length
        const totalBrigadistas = peopleByRole.brigadista.length
        const totalMobilizers = peopleByRole.movilizador.length
        const totalCitizens = peopleByRole.ciudadano.length

        // Análisis temporal optimizado
        const now = new Date()
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        
        // Parallel generation of time-based analytics
        const [dailyRegistrations, weeklyRegistrations, monthlyRegistrations] = await Promise.all([
          this.generateOptimizedDailyRegistrations(allPeople, thirtyDaysAgo, now),
          this.generateOptimizedWeeklyRegistrations(allPeople),
          this.generateOptimizedMonthlyRegistrations(allPeople)
        ])

        // Optimized leader performance calculation
        const leaderPerformance = hierarchicalData.map(leader => ({
          name: leader.name,
          registered: leader.registeredCount
        }))

        // Enhanced geographic analysis with electoral data
        const regionCounts = this.calculateOptimizedRegionDistribution(allPeople)
        const municipioCounts = this.calculateMunicipioDistribution(allPeople)
        const seccionCounts = this.calculateSeccionDistribution(allPeople)
        
        // Métricas de calidad optimizadas - solo considerar ciudadanos para verificación
        const verifiedCiudadanos = peopleByRole.ciudadano.filter(p => p.num_verificado).length
        const dataCompleteness = this.calculateOptimizedDataCompleteness(allPeople)

        const analytics: Analytics = {
          totalLideres,
          totalBrigadistas,
          totalMobilizers,
          totalCitizens,
          dailyRegistrations,
          weeklyRegistrations,
          monthlyRegistrations,
          leaderPerformance,
          conversionRate: totalCitizens > 0 ? (verifiedCiudadanos / totalCitizens) * 100 : 0,
          growthRate: this.calculateOptimizedGrowthRate(allPeople),
          
          efficiency: {
            conversionByLeader: hierarchicalData.map(leader => ({
              leaderId: leader.id,
              name: leader.name,
              rate: leader.registeredCount > 0 ? (leader.registeredCount / (leader.children?.length || 1)) * 100 : 0,
              target: 50
            })),
            productivityByBrigadier: peopleByRole.brigadista.map(brigadista => ({
              brigadierId: brigadista.id,
              name: brigadista.name,
              avgCitizens: brigadista.registeredCount
            })),
            topPerformers: hierarchicalData
              .sort((a, b) => b.registeredCount - a.registeredCount)
              .slice(0, 5)
              .map(person => ({
                id: person.id,
                name: person.name,
                role: person.role,
                score: person.registeredCount
              })),
            needsSupport: hierarchicalData
              .filter(leader => leader.registeredCount < 10)
              .map(person => ({
                id: person.id,
                name: person.name,
                role: person.role,
                issue: 'Bajo rendimiento'
              })),
            registrationSpeed: this.calculateRegistrationSpeed(allPeople)
          },

          geographic: {
            regionDistribution: Object.entries(regionCounts).map(([region, count]) => ({
              region,
              count,
              percentage: totalCitizens > 0 ? (count / totalCitizens) * 100 : 0
            })),
            municipioDistribution: Object.entries(municipioCounts)
              .map(([region, count]) => ({
                region,
                count,
                percentage: totalCitizens > 0 ? (count / totalCitizens) * 100 : 0
              }))
              .sort((a, b) => b.count - a.count),
            seccionDistribution: Object.entries(seccionCounts)
              .map(([region, count]) => ({
                region,
                count,
                percentage: totalCitizens > 0 ? (count / totalCitizens) * 100 : 0
              }))
              .sort((a, b) => b.count - a.count),
            heatmapData: Object.entries(regionCounts).map(([region, count]) => ({
              region,
              intensity: count
            })),
            territorialCoverage: Object.entries(regionCounts).map(([region, count]) => ({
              region,
              coverage: totalCitizens > 0 ? (count / totalCitizens) * 100 : 0,
              target: 20
            }))
          },

          temporal: {
            hourlyPatterns: this.calculateHourlyPatterns(allPeople),
            weeklyPatterns: this.calculateWeeklyPatterns(allPeople),
            seasonality: this.calculateEnhancedSeasonality(allPeople, monthlyRegistrations),
            projections: this.generateEnhancedProjections(allPeople, now),
            peakActivity: this.calculatePeakActivityAnalysis(allPeople)
          },

          quality: {
            dataCompleteness,
            duplicateRate: this.calculateDuplicateRate(allPeople),
            verificationRate: totalCitizens > 0 ? (verifiedCiudadanos / totalCitizens) * 100 : 0,
            postRegistrationActivity: this.calculatePostRegistrationActivity(allPeople)
          },

          goals: {
            overallProgress: {
              current: totalCitizens,
              target: 5000,
              percentage: totalCitizens > 0 ? (totalCitizens / 5000) * 100 : 0
            },
            individualGoals: hierarchicalData.map(leader => ({
              id: leader.id,
              name: leader.name,
              current: leader.registeredCount,
              target: 50,
              status: leader.registeredCount >= 50 ? 'ahead' : leader.registeredCount >= 40 ? 'on-track' : 'behind' as const
            })),
            milestones: [
              { date: '2024-03-31', description: 'Meta Q1: 1,250 ciudadanos', completed: totalCitizens >= 1250, target: 1250 },
              { date: '2024-06-30', description: 'Meta Q2: 2,500 ciudadanos', completed: totalCitizens >= 2500, target: 2500 },
              { date: '2024-09-30', description: 'Meta Q3: 3,750 ciudadanos', completed: totalCitizens >= 3750, target: 3750 },
              { date: '2024-12-31', description: 'Meta Anual: 5,000 ciudadanos', completed: totalCitizens >= 5000, target: 5000 }
            ]
          },

          alerts: {
            critical: hierarchicalData
              .filter(leader => leader.registeredCount === 0)
              .slice(0, 2)
              .map(leader => ({
                id: leader.id,
                message: `${leader.name} sin ciudadanos registrados`,
                type: 'performance' as const
              })),
            warnings: hierarchicalData
              .filter(leader => leader.registeredCount < 10 && leader.registeredCount > 0)
              .slice(0, 2)
              .map(leader => ({
                id: leader.id,
                message: `${leader.name} con bajo rendimiento (${leader.registeredCount} ciudadanos)`,
                type: 'performance' as const
              })),
            achievements: hierarchicalData
              .filter(leader => leader.registeredCount >= 50)
              .slice(0, 2)
              .map(leader => ({
                id: leader.id,
                message: `${leader.name} superó su meta con ${leader.registeredCount} ciudadanos`,
                date: new Date()
              }))
          },

          predictions: {
            churnRisk: this.calculateEnhancedChurnRisk(allPeople, peopleByRole),
            resourceOptimization: this.calculateResourceOptimizationRecommendations(hierarchicalData, peopleByRole),
            patterns: this.identifyElectoralPatterns(allPeople, hierarchicalData, regionCounts)
          }
        }

        // Cache the result
        this.analyticsCache = {
          analytics,
          timestamp: Date.now()
        }

        const endTime = Date.now()
        console.log(`Analytics generation completed in ${endTime - startTime}ms`)

        return analytics
      } catch (error) {
        console.error('Error generating analytics:', error)
        const enhancedError = this.enhanceError(error, 'generateAnalyticsFromData')
        throw enhancedError
      }
    }, 'Generate analytics from data')
  }

  private static getAllPeopleFlat(hierarchicalData: Person[]): Person[] {
    const result: Person[] = []
    
    const flatten = (people: Person[]) => {
      people.forEach(person => {
        result.push(person)
        if (person.children && person.children.length > 0) {
          flatten(person.children)
        }
      })
    }
    
    flatten(hierarchicalData)
    return result
  }

  private static generateDailyRegistrations(people: Person[], startDate: Date, endDate: Date) {
    const days: { date: string; count: number }[] = []
    const current = new Date(startDate)
    
    while (current <= endDate) {
      const dateStr = current.toISOString().split('T')[0]
      const count = people.filter(p => 
        p.created_at.toISOString().split('T')[0] === dateStr
      ).length
      
      days.push({ date: dateStr, count })
      current.setDate(current.getDate() + 1)
    }
    
    return days
  }

  private static generateWeeklyRegistrations(people: Person[]) {
    const weeks: { date: string; count: number }[] = []
    const now = new Date()
    
    for (let i = 11; i >= 0; i--) {
      const weekStart = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000)
      const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000)
      
      const count = people.filter(p => 
        p.created_at >= weekStart && p.created_at < weekEnd
      ).length
      
      weeks.push({ 
        date: `Semana ${12 - i}`, 
        count 
      })
    }
    
    return weeks
  }

  private static generateMonthlyRegistrations(people: Person[]) {
    const months: { date: string; count: number }[] = []
    const now = new Date()
    
    for (let i = 11; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const nextMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 1)
      
      const count = people.filter(p => 
        p.created_at >= monthDate && p.created_at < nextMonth
      ).length
      
      months.push({ 
        date: monthDate.toLocaleDateString('es-ES', { month: 'long' }), 
        count 
      })
    }
    
    return months
  }

  private static calculateRegionDistribution(people: Person[]): Record<string, number> {
    const regionCounts: Record<string, number> = {}
    
    people.forEach(person => {
      if (person.entidad) {
        regionCounts[person.entidad] = (regionCounts[person.entidad] || 0) + 1
      }
    })
    
    return regionCounts
  }

  private static calculateDataCompleteness(people: Person[]): number {
    if (people.length === 0) return 0
    
    const fields = ['nombre', 'clave_electoral', 'curp', 'direccion', 'colonia', 'numero_cel']
    let totalFields = 0
    let completedFields = 0
    
    people.forEach(person => {
      fields.forEach(field => {
        totalFields++
        if (person[field as keyof Person]) {
          completedFields++
        }
      })
    })
    
    return totalFields > 0 ? (completedFields / totalFields) * 100 : 0
  }

  private static calculateGrowthRate(people: Person[]): number {
    const now = new Date()
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const twoMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, 1)
    
    const currentMonthCount = people.filter(p => p.created_at >= lastMonth).length
    const previousMonthCount = people.filter(p => 
      p.created_at >= twoMonthsAgo && p.created_at < lastMonth
    ).length
    
    if (previousMonthCount === 0) return 0
    
    return ((currentMonthCount - previousMonthCount) / previousMonthCount) * 100
  }

  // Enhanced helper methods with error handling
  private static getEmptyAnalytics(): Analytics {
    return {
      totalLideres: 0,
      totalBrigadistas: 0,
      totalMobilizers: 0,
      totalCitizens: 0,
      dailyRegistrations: [],
      weeklyRegistrations: [],
      monthlyRegistrations: [],
      leaderPerformance: [],
      conversionRate: 0,
      growthRate: 0,
      efficiency: {
        conversionByLeader: [],
        productivityByBrigadier: [],
        topPerformers: [],
        needsSupport: [],
        registrationSpeed: { average: 0, fastest: 0, slowest: 0 }
      },
      geographic: {
        regionDistribution: [],
        municipioDistribution: [],
        seccionDistribution: [],
        heatmapData: [],
        territorialCoverage: []
      },
      temporal: {
        hourlyPatterns: [],
        weeklyPatterns: [],
        seasonality: [],
        projections: []
      },
      quality: {
        dataCompleteness: 0,
        duplicateRate: 0,
        verificationRate: 0,
        postRegistrationActivity: 0
      },
      goals: {
        overallProgress: { current: 0, target: 5000, percentage: 0 },
        individualGoals: [],
        milestones: []
      },
      alerts: {
        critical: [],
        warnings: [],
        achievements: []
      },
      predictions: {
        churnRisk: [],
        resourceOptimization: [],
        patterns: []
      }
    }
  }

  private static validateAnalyticsData(people: Person[]): void {
    const invalidRecords = people.filter(person => {
      return !person.id || !person.name || !person.role || !person.created_at
    })

    if (invalidRecords.length > 0) {
      console.warn(`Found ${invalidRecords.length} invalid records for analytics`)
      throw new ValidationError(`Invalid records found: missing required fields for analytics`)
    }

    // Validate date fields
    const invalidDates = people.filter(person => {
      return isNaN(person.created_at.getTime())
    })

    if (invalidDates.length > 0) {
      throw new ValidationError(`Invalid date fields found in ${invalidDates.length} records`)
    }
  }

  private static safeGenerateDailyRegistrations(people: Person[], startDate: Date, endDate: Date) {
    try {
      return this.generateDailyRegistrations(people, startDate, endDate)
    } catch (error) {
      console.error('Error generating daily registrations:', error)
      return []
    }
  }

  private static safeGenerateWeeklyRegistrations(people: Person[]) {
    try {
      return this.generateWeeklyRegistrations(people)
    } catch (error) {
      console.error('Error generating weekly registrations:', error)
      return []
    }
  }

  private static safeGenerateMonthlyRegistrations(people: Person[]) {
    try {
      return this.generateMonthlyRegistrations(people)
    } catch (error) {
      console.error('Error generating monthly registrations:', error)
      return []
    }
  }

  // Health check method for monitoring
  static async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy'
    details: Record<string, unknown>
  }> {
    const startTime = Date.now()
    const details: Record<string, unknown> = {}

    try {
      // Test database connectivity
      await this.validateConnection()
      details.database = 'connected'

      // Test circuit breaker state
      const circuitState = this.circuitBreaker.getState()
      details.circuitBreaker = circuitState

      // Test basic data fetch
      const testResult = await supabase.from('lideres').select('id').limit(1)
      details.queryTest = testResult.error ? 'failed' : 'passed'

      const responseTime = Date.now() - startTime
      details.responseTime = `${responseTime}ms`

      const status = circuitState.state === 'open' || testResult.error ? 'degraded' : 'healthy'
      
      return { status, details }
    } catch (error) {
      details.error = error instanceof Error ? error.message : 'Unknown error'
      details.responseTime = `${Date.now() - startTime}ms`
      
      return { status: 'unhealthy', details }
    }
  }

  // Optimized helper methods
  private static getAllPeopleFlatOptimized(hierarchicalData: Person[]): Person[] {
    const result: Person[] = []
    const stack: Person[] = [...hierarchicalData]
    
    while (stack.length > 0) {
      const person = stack.pop()!
      result.push(person)
      
      if (person.children && person.children.length > 0) {
        stack.push(...person.children)
      }
    }
    
    return result
  }

  private static groupPeopleByRole(people: Person[]): Record<string, Person[]> {
    const groups: Record<string, Person[]> = {
      lider: [],
      brigadista: [],
      movilizador: [],
      ciudadano: []
    }

    people.forEach(person => {
      if (groups[person.role]) {
        groups[person.role].push(person)
      }
    })

    return groups
  }

  private static async generateOptimizedDailyRegistrations(people: Person[], startDate: Date, endDate: Date): Promise<{ date: string; count: number }[]> {
    const days: { date: string; count: number }[] = []
    const dateMap = new Map<string, number>()
    
    // Single pass to count registrations by date
    people.forEach(person => {
      const dateStr = person.created_at.toISOString().split('T')[0]
      dateMap.set(dateStr, (dateMap.get(dateStr) || 0) + 1)
    })
    
    // Generate date range
    const current = new Date(startDate)
    while (current <= endDate) {
      const dateStr = current.toISOString().split('T')[0]
      days.push({ 
        date: dateStr, 
        count: dateMap.get(dateStr) || 0 
      })
      current.setDate(current.getDate() + 1)
    }
    
    return days
  }

  private static async generateOptimizedWeeklyRegistrations(people: Person[]): Promise<{ date: string; count: number }[]> {
    const weeks: { date: string; count: number }[] = []
    const now = new Date()
    
    for (let i = 11; i >= 0; i--) {
      const weekStart = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000)
      const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000)
      
      const count = people.filter(p => 
        p.created_at >= weekStart && p.created_at < weekEnd
      ).length
      
      weeks.push({ 
        date: `Semana ${12 - i}`, 
        count 
      })
    }
    
    return weeks
  }

  private static async generateOptimizedMonthlyRegistrations(people: Person[]): Promise<{ date: string; count: number }[]> {
    const months: { date: string; count: number }[] = []
    const now = new Date()
    
    for (let i = 11; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const nextMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 1)
      
      const count = people.filter(p => 
        p.created_at >= monthDate && p.created_at < nextMonth
      ).length
      
      months.push({ 
        date: monthDate.toLocaleDateString('es-ES', { month: 'long' }), 
        count 
      })
    }
    
    return months
  }

  private static calculateOptimizedRegionDistribution(people: Person[]): Record<string, number> {
    const regionCounts: Record<string, number> = {}
    
    people.forEach(person => {
      if (person.entidad) {
        regionCounts[person.entidad] = (regionCounts[person.entidad] || 0) + 1
      }
    })
    
    return regionCounts
  }

  private static calculateMunicipioDistribution(people: Person[]): Record<string, number> {
    const municipioCounts: Record<string, number> = {}
    
    people.forEach(person => {
      if (person.municipio) {
        const key = person.entidad ? `${person.municipio}, ${person.entidad}` : person.municipio
        municipioCounts[key] = (municipioCounts[key] || 0) + 1
      }
    })
    
    return municipioCounts
  }

  private static calculateSeccionDistribution(people: Person[]): Record<string, number> {
    const seccionCounts: Record<string, number> = {}
    
    people.forEach(person => {
      if (person.seccion) {
        const key = person.municipio && person.entidad ? 
          `${person.seccion} (${person.municipio}, ${person.entidad})` : 
          `Sección ${person.seccion}`
        seccionCounts[key] = (seccionCounts[key] || 0) + 1
      }
    })
    
    return seccionCounts
  }

  private static calculateOptimizedDataCompleteness(people: Person[]): number {
    if (people.length === 0) return 0
    
    // Enhanced electoral data completeness calculation
    const requiredFields = ['nombre', 'clave_electoral', 'curp', 'seccion', 'entidad', 'municipio']
    const optionalFields = ['direccion', 'colonia', 'numero_cel', 'codigo_postal']
    
    let totalRequiredFields = 0
    let completedRequiredFields = 0
    let totalOptionalFields = 0
    let completedOptionalFields = 0
    
    people.forEach(person => {
      // Check required fields (weighted more heavily)
      requiredFields.forEach(field => {
        totalRequiredFields++
        if (person[field as keyof Person] && String(person[field as keyof Person]).trim() !== '') {
          completedRequiredFields++
        }
      })
      
      // Check optional fields
      optionalFields.forEach(field => {
        totalOptionalFields++
        if (person[field as keyof Person] && String(person[field as keyof Person]).trim() !== '') {
          completedOptionalFields++
        }
      })
    })
    
    // Weight required fields at 70% and optional fields at 30%
    const requiredCompleteness = totalRequiredFields > 0 ? (completedRequiredFields / totalRequiredFields) * 100 : 0
    const optionalCompleteness = totalOptionalFields > 0 ? (completedOptionalFields / totalOptionalFields) * 100 : 0
    
    return (requiredCompleteness * 0.7) + (optionalCompleteness * 0.3)
  }

  private static calculateOptimizedGrowthRate(people: Person[]): number {
    const now = new Date()
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const twoMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, 1)
    
    let currentMonthCount = 0
    let previousMonthCount = 0
    
    // Single pass calculation
    people.forEach(person => {
      if (person.created_at >= lastMonth) {
        currentMonthCount++
      } else if (person.created_at >= twoMonthsAgo && person.created_at < lastMonth) {
        previousMonthCount++
      }
    })
    
    if (previousMonthCount === 0) return 0
    
    return ((currentMonthCount - previousMonthCount) / previousMonthCount) * 100
  }

  private static calculateRegistrationSpeed(people: Person[]): { average: number; fastest: number; slowest: number } {
    // Calculate based on actual data patterns
    const speeds = people.map(person => {
      const hoursSinceCreation = (Date.now() - person.created_at.getTime()) / (1000 * 60 * 60)
      return Math.max(0.1, hoursSinceCreation) // Minimum 0.1 hours
    })
    
    if (speeds.length === 0) {
      return { average: 0, fastest: 0, slowest: 0 }
    }
    
    const average = speeds.reduce((sum, speed) => sum + speed, 0) / speeds.length
    const fastest = Math.min(...speeds)
    const slowest = Math.max(...speeds)
    
    return { average, fastest, slowest }
  }

  private static calculateHourlyPatterns(people: Person[]): { hour: number; registrations: number }[] {
    const hourCounts = new Array(24).fill(0)
    
    people.forEach(person => {
      const hour = person.created_at.getHours()
      hourCounts[hour]++
    })
    
    return hourCounts.map((count, hour) => ({ hour, registrations: count }))
  }

  private static calculatePeakActivityAnalysis(people: Person[]): {
    peakHour: { hour: number; registrations: number };
    peakDay: { day: string; registrations: number };
    peakMonth: { month: string; registrations: number };
    activityTrends: { period: string; trend: 'increasing' | 'decreasing' | 'stable'; change: number }[];
  } {
    // Calculate hourly patterns
    const hourlyPatterns = this.calculateHourlyPatterns(people)
    const peakHour = hourlyPatterns.reduce((max, current) => 
      current.registrations > max.registrations ? current : max
    )

    // Calculate daily patterns
    const weeklyPatterns = this.calculateWeeklyPatterns(people)
    const peakDay = weeklyPatterns.reduce((max, current) => 
      current.registrations > max.registrations ? current : max
    )

    // Calculate monthly patterns for peak month
    const monthlyData = new Map<string, number>()
    people.forEach(person => {
      const monthKey = person.created_at.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })
      monthlyData.set(monthKey, (monthlyData.get(monthKey) || 0) + 1)
    })

    const peakMonth = Array.from(monthlyData.entries())
      .reduce((max, [month, count]) => 
        count > max.registrations ? { month, registrations: count } : max,
        { month: '', registrations: 0 }
      )

    // Calculate activity trends
    const activityTrends = this.calculateActivityTrends(people)

    return {
      peakHour,
      peakDay,
      peakMonth,
      activityTrends
    }
  }

  private static calculateActivityTrends(people: Person[]): { period: string; trend: 'increasing' | 'decreasing' | 'stable'; change: number }[] {
    const now = new Date()
    const trends: { period: string; trend: 'increasing' | 'decreasing' | 'stable'; change: number }[] = []

    // Weekly trend (last 4 weeks)
    const weeklyTrend = this.calculatePeriodTrend(people, 'week', 4, now)
    trends.push({ period: 'Semanal', ...weeklyTrend })

    // Monthly trend (last 6 months)
    const monthlyTrend = this.calculatePeriodTrend(people, 'month', 6, now)
    trends.push({ period: 'Mensual', ...monthlyTrend })

    return trends
  }

  private static calculatePeriodTrend(
    people: Person[], 
    period: 'week' | 'month', 
    periods: number, 
    endDate: Date
  ): { trend: 'increasing' | 'decreasing' | 'stable'; change: number } {
    const periodCounts: number[] = []
    
    for (let i = periods - 1; i >= 0; i--) {
      let periodStart: Date
      let periodEnd: Date

      if (period === 'week') {
        periodStart = new Date(endDate.getTime() - (i + 1) * 7 * 24 * 60 * 60 * 1000)
        periodEnd = new Date(endDate.getTime() - i * 7 * 24 * 60 * 60 * 1000)
      } else {
        periodStart = new Date(endDate.getFullYear(), endDate.getMonth() - (i + 1), 1)
        periodEnd = new Date(endDate.getFullYear(), endDate.getMonth() - i, 1)
      }

      const count = people.filter(p => 
        p.created_at >= periodStart && p.created_at < periodEnd
      ).length

      periodCounts.push(count)
    }

    // Calculate trend using linear regression
    const n = periodCounts.length
    if (n < 2) return { trend: 'stable', change: 0 }

    const xSum = (n * (n - 1)) / 2
    const ySum = periodCounts.reduce((sum, count) => sum + count, 0)
    const xySum = periodCounts.reduce((sum, count, index) => sum + (index * count), 0)
    const x2Sum = (n * (n - 1) * (2 * n - 1)) / 6

    const slope = (n * xySum - xSum * ySum) / (n * x2Sum - xSum * xSum)
    const changePercent = periodCounts[0] > 0 ? (slope / periodCounts[0]) * 100 : 0

    let trend: 'increasing' | 'decreasing' | 'stable'
    if (Math.abs(changePercent) < 5) {
      trend = 'stable'
    } else if (changePercent > 0) {
      trend = 'increasing'
    } else {
      trend = 'decreasing'
    }

    return { trend, change: Math.abs(changePercent) }
  }

  private static calculateWeeklyPatterns(people: Person[]): { day: string; registrations: number }[] {
    const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
    const dayCounts = new Array(7).fill(0)
    
    people.forEach(person => {
      const dayOfWeek = person.created_at.getDay()
      dayCounts[dayOfWeek]++
    })
    
    return dayCounts.map((count, index) => ({ 
      day: dayNames[index], 
      registrations: count 
    }))
  }

  private static generateProjections(people: Person[], now: Date): { date: string; projected: number; confidence: number }[] {
    // Simple projection based on recent trends
    const recentPeople = people.filter(p => 
      p.created_at >= new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    )
    const dailyAverage = recentPeople.length / 7
    
    return Array.from({ length: 30 }, (_, i) => ({
      date: new Date(now.getTime() + i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      projected: Math.max(0, Math.floor(dailyAverage + (Math.random() - 0.5) * dailyAverage * 0.5)),
      confidence: Math.max(60, 90 - i * 1) // Decreasing confidence over time
    }))
  }

  private static calculateEnhancedSeasonality(
    people: Person[], 
    monthlyRegistrations: { date: string; count: number }[]
  ): { month: string; registrations: number; trend: 'up' | 'down' | 'stable' }[] {
    // Calculate trends for each month based on historical data
    return monthlyRegistrations.map((month, index) => {
      let trend: 'up' | 'down' | 'stable' = 'stable'
      
      if (index > 0) {
        const previousMonth = monthlyRegistrations[index - 1]
        const changePercent = previousMonth.count > 0 
          ? ((month.count - previousMonth.count) / previousMonth.count) * 100 
          : 0
        
        if (changePercent > 10) {
          trend = 'up'
        } else if (changePercent < -10) {
          trend = 'down'
        }
      }
      
      return {
        month: month.date,
        registrations: month.count,
        trend
      }
    })
  }

  private static generateEnhancedProjections(people: Person[], now: Date): { date: string; projected: number; confidence: number }[] {
    if (people.length === 0) {
      return Array.from({ length: 30 }, (_, i) => ({
        date: new Date(now.getTime() + i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        projected: 0,
        confidence: 50
      }))
    }

    // Calculate multiple trend periods for better accuracy
    const last7Days = people.filter(p => 
      p.created_at >= new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    ).length
    
    const last14Days = people.filter(p => 
      p.created_at >= new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)
    ).length
    
    const last30Days = people.filter(p => 
      p.created_at >= new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    ).length

    // Calculate weighted averages
    const weeklyAverage = last7Days / 7
    const biWeeklyAverage = last14Days / 14
    const monthlyAverage = last30Days / 30

    // Weight recent data more heavily
    const weightedAverage = (weeklyAverage * 0.5) + (biWeeklyAverage * 0.3) + (monthlyAverage * 0.2)

    // Calculate growth trend
    const growthRate = last14Days > 0 ? ((last7Days - (last14Days - last7Days)) / (last14Days - last7Days)) : 0

    return Array.from({ length: 30 }, (_, i) => {
      // Apply growth trend with diminishing effect over time
      const trendFactor = Math.max(0, 1 + (growthRate * Math.exp(-i * 0.1)))
      const baseProjection = weightedAverage * trendFactor
      
      // Add some realistic variance
      const variance = baseProjection * 0.2 * (Math.random() - 0.5)
      const projected = Math.max(0, Math.round(baseProjection + variance))
      
      // Confidence decreases over time and with higher variance
      const baseConfidence = Math.max(50, 95 - i * 1.5)
      const varianceConfidence = Math.max(0, 100 - Math.abs(variance / baseProjection) * 100)
      const confidence = Math.round((baseConfidence + varianceConfidence) / 2)

      return {
        date: new Date(now.getTime() + i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        projected,
        confidence: Math.min(95, Math.max(50, confidence))
      }
    })
  }

  private static calculateDuplicateRate(people: Person[]): number {
    if (people.length === 0) return 0
    
    // Enhanced duplicate detection for electoral data
    const seenCurp = new Set<string>()
    const seenClaveElectoral = new Set<string>()
    const seenPhoneNumbers = new Set<string>()
    
    let duplicatesByCurp = 0
    let duplicatesByClaveElectoral = 0
    let duplicatesByPhone = 0
    
    people.forEach(person => {
      // Check CURP duplicates
      if (person.curp && person.curp.trim() !== '') {
        if (seenCurp.has(person.curp)) {
          duplicatesByCurp++
        } else {
          seenCurp.add(person.curp)
        }
      }
      
      // Check Clave Electoral duplicates
      if (person.clave_electoral && person.clave_electoral.trim() !== '') {
        if (seenClaveElectoral.has(person.clave_electoral)) {
          duplicatesByClaveElectoral++
        } else {
          seenClaveElectoral.add(person.clave_electoral)
        }
      }
      
      // Check phone number duplicates (for contact validation)
      if (person.numero_cel && person.numero_cel.trim() !== '') {
        if (seenPhoneNumbers.has(person.numero_cel)) {
          duplicatesByPhone++
        } else {
          seenPhoneNumbers.add(person.numero_cel)
        }
      }
    })
    
    // Calculate overall duplicate rate (weighted by importance)
    const totalDuplicates = (duplicatesByCurp * 0.5) + (duplicatesByClaveElectoral * 0.4) + (duplicatesByPhone * 0.1)
    
    return (totalDuplicates / people.length) * 100
  }

  private static calculatePostRegistrationActivity(people: Person[]): number {
    // Simulate post-registration activity based on verification status
    const verifiedPeople = people.filter(p => p.num_verificado)
    return people.length > 0 ? (verifiedPeople.length / people.length) * 100 : 0
  }

  private static calculateChurnRisk(people: Person[]): { id: string; name: string; risk: number; factors: string[] }[] {
    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    
    return people
      .filter(person => person.role !== 'ciudadano') // Only leaders, brigadistas, movilizadores
      .filter(person => person.created_at < thirtyDaysAgo) // Only established members
      .filter(person => person.registeredCount < 5) // Low performance
      .slice(0, 5) // Top 5 at risk
      .map(person => ({
        id: person.id,
        name: person.name,
        risk: Math.min(95, 60 + (30 - person.registeredCount) * 2), // Risk calculation
        factors: [
          'Bajo rendimiento en registros',
          'Inactividad reciente',
          'Meta no alcanzada'
        ]
      }))
  }

  // Enhanced quality metrics for electoral data validation
  private static calculateElectoralDataIntegrity(people: Person[]): {
    validSections: number;
    validEntidades: number;
    validMunicipios: number;
    fieldCompleteness: { field: string; completeness: number; required: boolean }[];
  } {
    if (people.length === 0) {
      return {
        validSections: 0,
        validEntidades: 0,
        validMunicipios: 0,
        fieldCompleteness: []
      }
    }

    // Validate electoral geographic data
    let validSections = 0
    let validEntidades = 0
    let validMunicipios = 0

    people.forEach(person => {
      // Validate seccion (should be numeric and reasonable range)
      if (person.seccion && /^\d{1,5}$/.test(person.seccion)) {
        validSections++
      }
      
      // Validate entidad (should not be empty)
      if (person.entidad && person.entidad.trim() !== '') {
        validEntidades++
      }
      
      // Validate municipio (should not be empty)
      if (person.municipio && person.municipio.trim() !== '') {
        validMunicipios++
      }
    })

    // Calculate field completeness for electoral fields
    const electoralFields = [
      { field: 'Nombre', key: 'nombre', required: true },
      { field: 'CURP', key: 'curp', required: true },
      { field: 'Clave Electoral', key: 'clave_electoral', required: true },
      { field: 'Teléfono', key: 'numero_cel', required: true },
      { field: 'Dirección', key: 'direccion', required: false },
      { field: 'Colonia', key: 'colonia', required: false },
      { field: 'Sección Electoral', key: 'seccion', required: true },
      { field: 'Entidad', key: 'entidad', required: true },
      { field: 'Municipio', key: 'municipio', required: true },
    ]

    const fieldCompleteness = electoralFields.map(fieldInfo => {
      const completedCount = people.filter(person => {
        const value = person[fieldInfo.key as keyof Person]
        return value && String(value).trim() !== ''
      }).length

      return {
        field: fieldInfo.field,
        completeness: (completedCount / people.length) * 100,
        required: fieldInfo.required
      }
    })

    return {
      validSections: (validSections / people.length) * 100,
      validEntidades: (validEntidades / people.length) * 100,
      validMunicipios: (validMunicipios / people.length) * 100,
      fieldCompleteness
    }
  }

  private static calculateQualityScoresByLevel(
    lideres: Person[],
    brigadistas: Person[],
    movilizadores: Person[],
    ciudadanos: Person[]
  ): { level: string; count: number; dataQuality: number; verificationRate: number; duplicateRate: number }[] {
    const levels = [
      { level: 'Líderes', people: lideres },
      { level: 'Brigadistas', people: brigadistas },
      { level: 'Movilizadores', people: movilizadores },
      { level: 'Ciudadanos', people: ciudadanos }
    ]

    return levels.map(levelData => {
      const dataQuality = this.calculateOptimizedDataCompleteness(levelData.people)
      const verificationRate = levelData.people.length > 0 
        ? (levelData.people.filter(p => p.num_verificado).length / levelData.people.length) * 100 
        : 0
      const duplicateRate = this.calculateDuplicateRate(levelData.people)

      return {
        level: levelData.level,
        count: levelData.people.length,
        dataQuality,
        verificationRate,
        duplicateRate
      }
    })
  }

  // Cache management methods
  static clearCache(): void {
    this.dataCache = null
    this.analyticsCache = null
    console.log('DataService cache cleared')
  }

  static getCacheStatus(): { dataCache: boolean; analyticsCache: boolean; cacheAge: number } {
    const now = Date.now()
    return {
      dataCache: this.dataCache !== null && (now - this.dataCache.timestamp) < this.CACHE_DURATION,
      analyticsCache: this.analyticsCache !== null && (now - this.analyticsCache.timestamp) < this.CACHE_DURATION,
      cacheAge: this.analyticsCache ? now - this.analyticsCache.timestamp : 0
    }
  }
  // Enhanced predictive analytics methods for electoral forecasting
  private static calculateEnhancedChurnRisk(
    allPeople: Person[], 
    peopleByRole: Record<string, Person[]>
  ): { id: string; name: string; risk: number; factors: string[] }[] {
    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    
    // Analyze non-citizen roles for churn risk
    const nonCitizens = [...peopleByRole.lider, ...peopleByRole.brigadista, ...peopleByRole.movilizador]
    
    return nonCitizens
      .filter(person => person.created_at < thirtyDaysAgo) // Only established members
      .map(person => {
        const factors: string[] = []
        let riskScore = 0
        
        // Performance-based risk factors
        if (person.registeredCount === 0) {
          factors.push('Sin registros de ciudadanos')
          riskScore += 40
        } else if (person.registeredCount < 5) {
          factors.push('Bajo rendimiento en registros')
          riskScore += 25
        }
        
        // Activity-based risk factors
        const daysSinceCreation = Math.floor((now.getTime() - person.created_at.getTime()) / (1000 * 60 * 60 * 24))
        if (daysSinceCreation > 60 && person.registeredCount === 0) {
          factors.push('Inactividad prolongada')
          riskScore += 30
        }
        
        // Role-specific risk factors
        if (person.role === 'lider' && person.registeredCount < 20) {
          factors.push('Meta de liderazgo no alcanzada')
          riskScore += 20
        } else if (person.role === 'brigadista' && person.registeredCount < 10) {
          factors.push('Meta de brigadista no alcanzada')
          riskScore += 15
        } else if (person.role === 'movilizador' && person.registeredCount < 3) {
          factors.push('Meta de movilizador no alcanzada')
          riskScore += 10
        }
        
        // Geographic isolation risk
        const sameRegionCount = allPeople.filter(p => p.entidad === person.entidad).length
        if (sameRegionCount < 5) {
          factors.push('Aislamiento geográfico')
          riskScore += 15
        }
        
        // Data completeness risk
        const requiredFields = ['direccion', 'numero_cel', 'seccion']
        const missingFields = requiredFields.filter(field => !person[field as keyof Person])
        if (missingFields.length > 1) {
          factors.push('Información de contacto incompleta')
          riskScore += 10
        }
        
        return {
          id: person.id,
          name: person.name,
          risk: Math.min(95, riskScore),
          factors
        }
      })
      .filter(person => person.risk > 30) // Only include those with significant risk
      .sort((a, b) => b.risk - a.risk)
      .slice(0, 10) // Top 10 at risk
  }

  private static calculateResourceOptimizationRecommendations(
    hierarchicalData: Person[], 
    peopleByRole: Record<string, Person[]>
  ): { area: string; recommendation: string; impact: number }[] {
    const recommendations: { area: string; recommendation: string; impact: number }[] = []
    
    // Analyze leader performance distribution
    const leaderPerformance = hierarchicalData.map(leader => leader.registeredCount)
    const avgLeaderPerformance = leaderPerformance.reduce((sum, count) => sum + count, 0) / Math.max(leaderPerformance.length, 1)
    const topPerformers = hierarchicalData.filter(leader => leader.registeredCount > avgLeaderPerformance * 1.5)
    const underPerformers = hierarchicalData.filter(leader => leader.registeredCount < avgLeaderPerformance * 0.5)
    
    // Resource redistribution recommendations
    if (underPerformers.length > 0 && topPerformers.length > 0) {
      recommendations.push({
        area: 'Redistribución de Recursos',
        recommendation: `Reasignar ${Math.ceil(underPerformers.length * 0.3)} brigadistas de líderes con bajo rendimiento a líderes de alto rendimiento`,
        impact: Math.min(50, underPerformers.length * 5)
      })
    }
    
    // Training recommendations based on performance gaps
    if (leaderPerformance.length > 0) {
      const performanceGap = Math.max(...leaderPerformance) - Math.min(...leaderPerformance)
      if (performanceGap > 20) {
        recommendations.push({
          area: 'Capacitación Especializada',
          recommendation: 'Implementar programa de mentoring entre líderes de alto y bajo rendimiento',
          impact: Math.min(40, Math.floor(performanceGap / 5))
        })
      }
    }
    
    // Geographic optimization
    const regionDistribution = this.calculateOptimizedRegionDistribution(peopleByRole.ciudadano)
    const underservedRegions = Object.entries(regionDistribution)
      .filter(([, count]) => count < 10)
      .length
    
    if (underservedRegions > 0) {
      recommendations.push({
        area: 'Expansión Geográfica',
        recommendation: `Establecer ${underservedRegions} nuevos puntos de registro en regiones con baja cobertura`,
        impact: Math.min(35, underservedRegions * 8)
      })
    }
    
    // Technology and process optimization
    const verificationRate = peopleByRole.ciudadano.length > 0 ? 
      peopleByRole.ciudadano.filter(c => c.num_verificado).length / peopleByRole.ciudadano.length : 0
    if (verificationRate < 0.8) {
      recommendations.push({
        area: 'Optimización de Procesos',
        recommendation: 'Implementar sistema automatizado de verificación telefónica',
        impact: Math.floor((0.8 - verificationRate) * 100)
      })
    }
    
    return recommendations.sort((a, b) => b.impact - a.impact).slice(0, 5)
  }

  private static identifyElectoralPatterns(
    allPeople: Person[], 
    hierarchicalData: Person[], 
    regionCounts: Record<string, number>
  ): { pattern: string; confidence: number; description: string }[] {
    const patterns: { pattern: string; confidence: number; description: string }[] = []
    
    if (allPeople.length === 0) return patterns
    
    // Geographic concentration pattern
    const totalRegions = Object.keys(regionCounts).length
    if (totalRegions > 0) {
      const topRegions = Object.entries(regionCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, Math.ceil(totalRegions * 0.3))
      const topRegionsCoverage = topRegions.reduce((sum, [,count]) => sum + count, 0) / allPeople.length
      
      if (topRegionsCoverage > 0.7) {
        patterns.push({
          pattern: 'Concentración Geográfica Alta',
          confidence: Math.min(95, Math.floor(topRegionsCoverage * 100)),
          description: `El ${Math.floor(topRegionsCoverage * 100)}% de registros se concentra en ${topRegions.length} regiones principales`
        })
      }
    }
    
    // Leadership effectiveness pattern
    if (hierarchicalData.length > 0) {
      const effectiveLeaders = hierarchicalData.filter(leader => leader.registeredCount >= 25).length
      const leaderEffectiveness = effectiveLeaders / hierarchicalData.length
      
      if (leaderEffectiveness > 0.6) {
        patterns.push({
          pattern: 'Liderazgo Efectivo Dominante',
          confidence: Math.floor(leaderEffectiveness * 100),
          description: `${Math.floor(leaderEffectiveness * 100)}% de líderes superan expectativas de rendimiento`
        })
      } else if (leaderEffectiveness < 0.3) {
        patterns.push({
          pattern: 'Necesidad de Fortalecimiento de Liderazgo',
          confidence: Math.floor((1 - leaderEffectiveness) * 100),
          description: `Solo ${Math.floor(leaderEffectiveness * 100)}% de líderes alcanzan rendimiento esperado`
        })
      }
    }
    
    // Verification success pattern
    const citizensWithPhone = allPeople.filter(p => p.role === 'ciudadano' && p.numero_cel).length
    const verifiedCitizens = allPeople.filter(p => p.role === 'ciudadano' && p.num_verificado).length
    const verificationSuccessRate = citizensWithPhone > 0 ? verifiedCitizens / citizensWithPhone : 0
    
    if (verificationSuccessRate > 0.8) {
      patterns.push({
        pattern: 'Alta Efectividad de Verificación',
        confidence: Math.floor(verificationSuccessRate * 100),
        description: `${Math.floor(verificationSuccessRate * 100)}% de ciudadanos con teléfono son verificados exitosamente`
      })
    }
    
    return patterns.sort((a, b) => b.confidence - a.confidence).slice(0, 6)
  }
}