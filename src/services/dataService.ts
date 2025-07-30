import { supabase, type Lider, type Brigadista, type Movilizador, type Ciudadano } from '../lib/supabase'
import { Person, Analytics, LeaderPerformanceData, Period } from '../types'
import { DatabaseError, NetworkError, ServiceError, ValidationError } from '../types/errors'
import { withDatabaseRetry, CircuitBreaker } from '../utils/retry'
import { cacheManager } from './cacheManager'
import { 
  WorkerProductivityAnalytics, 
  LeaderProductivityMetric, 
  BrigadierProductivityMetric, 
  MobilizerProductivityMetric,
  ComparativeMetric 
} from '../types/productivity'
import {
  NetworkBalanceMetric,
  NetworkGrowthMetric,
  StructuralHealthMetric,
  NetworkExpansionMetric,
  NetworkHealthSummary
} from '../types/networkHealth'
import {
  TerritorialAnalytics,
  TerritorialCoverageMetric,
  WorkerDensityMetric,
  TerritorialGapMetric,
  CitizenWorkerRatioMetric,
  TerritorialSummary
} from '../types/territorial'

export class DataService {
  private static circuitBreaker = new CircuitBreaker(5, 60000) // 5 failures, 1 minute recovery
  private static readonly CACHE_VERSION = '2.0.0'
  private static lastUpdateCheck: Date = new Date()
  
  // Initialize cache warming strategies
  static {
    this.setupCacheWarmingStrategies()
  }

  static async getAllHierarchicalData(forceRefresh: boolean = false): Promise<Person[]> {
    const cacheKey = 'hierarchical-data-main'
    
    // Check intelligent cache first
    if (!forceRefresh) {
      const cachedData = await cacheManager.get<Person[]>(cacheKey)
      if (cachedData) {
        console.log('Returning cached hierarchical data from intelligent cache')
        return cachedData
      }
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
          
          // Cache the result with intelligent caching
          await cacheManager.set(cacheKey, hierarchicalData, {
            tags: ['data', 'hierarchy', 'main'],
            version: this.CACHE_VERSION,
            ttl: 10 * 60 * 1000 // 10 minutes for main data
          })

          // Invalidate related analytics cache when data changes
          await this.invalidateAnalyticsCache()

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

  private static buildOptimizedHierarchy(
    lideres: Lider[],
    brigadistas: Brigadista[],
    movilizadores: Movilizador[],
    ciudadanos: Ciudadano[]
  ): Person[] {
    // Create optimized lookup maps with Set for faster lookups
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
    const cacheKey = `analytics-main-${this.generateDataHash(hierarchicalData)}`
    
    // Check intelligent cache first
    if (!forceRefresh) {
      const cachedAnalytics = await cacheManager.get<Analytics>(cacheKey)
      if (cachedAnalytics) {
        console.log('Returning cached analytics data from intelligent cache')
        return cachedAnalytics
      }
    }

    return withDatabaseRetry(async () => {
      try {
        console.log('Starting analytics generation...')

        // Validate input data
        if (!Array.isArray(hierarchicalData)) {
          throw new ValidationError('Invalid hierarchical data: expected array')
        }

        if (hierarchicalData.length === 0) {
          console.warn('No hierarchical data provided for analytics generation')
          return this.getEmptyAnalytics()
        }

        // Optimized flat data extraction with single pass
        const allPeople = this.getAllPeopleFlat(hierarchicalData)
        
        if (allPeople.length === 0) {
          console.warn('No people found in hierarchical data')
          return this.getEmptyAnalytics()
        }

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
          this.generateDailyRegistrations(allPeople, thirtyDaysAgo, now),
          this.generateWeeklyRegistrations(allPeople),
          this.generateMonthlyRegistrations(allPeople)
        ])

        // Optimized leader performance calculation
        const leaderPerformance = hierarchicalData.map(leader => ({
          name: leader.name,
          registered: leader.registeredCount
        }))

        // Generate enhanced leader performance data for all periods
        const enhancedLeaderPerformance = this.generatePeriodAwareLeaderPerformance(hierarchicalData, 'day')

        // Enhanced geographic analysis with electoral data
        const regionCounts = this.calculateRegionDistribution(allPeople)
        const municipioCounts = this.calculateMunicipioDistribution(allPeople)
        const seccionCounts = this.calculateSeccionDistribution(allPeople)
        
        // Métricas de calidad optimizadas - solo considerar ciudadanos para verificación
        const verifiedCiudadanos = peopleByRole.ciudadano.filter(p => p.num_verificado).length
        const dataCompleteness = this.calculateDataCompleteness(allPeople)

        const analytics: Analytics = {
          totalLideres,
          totalBrigadistas,
          totalMobilizers,
          totalCitizens,
          dailyRegistrations,
          weeklyRegistrations,
          monthlyRegistrations,
          leaderPerformance,
          enhancedLeaderPerformance,
          conversionRate: totalCitizens > 0 ? (verifiedCiudadanos / totalCitizens) * 100 : 0,
          growthRate: this.calculateGrowthRate(allPeople),
          
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
          },

          // Network health analytics
          networkHealth: this.generateNetworkHealthAnalytics(hierarchicalData),
          
          // Territorial coverage analytics
          territorial: this.generateTerritorialAnalytics(hierarchicalData, allPeople)
        }

        // Cache the result with intelligent caching
        await cacheManager.set(cacheKey, analytics, {
          tags: ['analytics', 'computed', 'main'],
          version: this.CACHE_VERSION,
          ttl: 5 * 60 * 1000 // 5 minutes for analytics
        })

        console.log('Analytics generation completed')
        return analytics
      } catch (error) {
        console.error('Error generating analytics:', error)
        const enhancedError = this.enhanceError(error, 'generateAnalyticsFromData')
        throw enhancedError
      }
    }, 'Generate analytics from data')
  }

  // Helper methods
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

  private static groupPeopleByRole(people: Person[]): Record<string, Person[]> {
    const grouped: Record<string, Person[]> = {
      lider: [],
      brigadista: [],
      movilizador: [],
      ciudadano: []
    }
    
    people.forEach(person => {
      if (grouped[person.role]) {
        grouped[person.role].push(person)
      }
    })
    
    return grouped
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

  private static calculateMunicipioDistribution(people: Person[]): Record<string, number> {
    const municipioCounts: Record<string, number> = {}
    
    people.forEach(person => {
      if (person.municipio) {
        municipioCounts[person.municipio] = (municipioCounts[person.municipio] || 0) + 1
      }
    })
    
    return municipioCounts
  }

  private static calculateSeccionDistribution(people: Person[]): Record<string, number> {
    const seccionCounts: Record<string, number> = {}
    
    people.forEach(person => {
      if (person.seccion) {
        seccionCounts[person.seccion] = (seccionCounts[person.seccion] || 0) + 1
      }
    })
    
    return seccionCounts
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

  // Simplified helper methods for basic functionality
  static generatePeriodAwareLeaderPerformance(hierarchicalData: Person[], period: Period): LeaderPerformanceData[] {
    return hierarchicalData.map(leader => ({
      name: leader.name,
      citizenCount: leader.registeredCount,
      brigadierCount: leader.children?.length || 0,
      mobilizerCount: leader.children?.reduce((sum, brigadista) => sum + (brigadista.children?.length || 0), 0) || 0,
      targetProgress: leader.registeredCount >= 50 ? 100 : (leader.registeredCount / 50) * 100,
      trend: 'stable' as const,
      efficiency: leader.registeredCount > 0 ? (leader.registeredCount / Math.max(1, leader.children?.length || 1)) : 0,
      lastUpdate: new Date()
    }))
  }

  private static calculateRegistrationSpeed(people: Person[]): { average: number; fastest: number; slowest: number } {
    return {
      average: people.length > 0 ? people.length / 30 : 0,
      fastest: people.length > 0 ? Math.max(1, people.length / 7) : 0,
      slowest: people.length > 0 ? Math.max(1, people.length / 90) : 0
    }
  }

  private static calculateHourlyPatterns(people: Person[]): { hour: number; registrations: number }[] {
    const hourlyData: { hour: number; registrations: number }[] = []
    
    for (let hour = 0; hour < 24; hour++) {
      const count = people.filter(p => p.created_at.getHours() === hour).length
      hourlyData.push({ hour, registrations: count })
    }
    
    return hourlyData
  }

  private static calculateWeeklyPatterns(people: Person[]): { day: string; registrations: number }[] {
    const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
    
    return days.map((day, index) => ({
      day,
      registrations: people.filter(p => p.created_at.getDay() === index).length
    }))
  }

  private static calculateEnhancedSeasonality(people: Person[], monthlyData: { date: string; count: number }[]): { month: string; registrations: number; trend: 'up' | 'down' | 'stable' }[] {
    return monthlyData.map((month, index) => ({
      month: month.date,
      registrations: month.count,
      trend: index > 0 ? 
        (month.count > monthlyData[index - 1].count ? 'up' : 
         month.count < monthlyData[index - 1].count ? 'down' : 'stable') : 'stable' as const
    }))
  }

  private static generateEnhancedProjections(people: Person[], now: Date): { date: string; projected: number; confidence: number }[] {
    const projections: { date: string; projected: number; confidence: number }[] = []
    const currentRate = people.length / 30
    
    for (let i = 1; i <= 12; i++) {
      const futureDate = new Date(now.getTime() + i * 30 * 24 * 60 * 60 * 1000)
      projections.push({
        date: futureDate.toISOString().split('T')[0],
        projected: Math.round(currentRate * 30 * i),
        confidence: Math.max(50, 90 - i * 5)
      })
    }
    
    return projections
  }

  private static calculatePeakActivityAnalysis(people: Person[]): {
    peakHour: { hour: number; registrations: number };
    peakDay: { day: string; registrations: number };
    peakMonth: { month: string; registrations: number };
    activityTrends: { period: string; trend: 'increasing' | 'decreasing' | 'stable'; change: number }[];
  } {
    const hourlyPatterns = this.calculateHourlyPatterns(people)
    const weeklyPatterns = this.calculateWeeklyPatterns(people)
    
    const peakHour = hourlyPatterns.reduce((max, current) => 
      current.registrations > max.registrations ? current : max
    )
    
    const peakDay = weeklyPatterns.reduce((max, current) => 
      current.registrations > max.registrations ? current : max
    )
    
    return {
      peakHour,
      peakDay,
      peakMonth: { month: 'Enero', registrations: 0 },
      activityTrends: [
        { period: 'Últimos 7 días', trend: 'stable', change: 0 },
        { period: 'Últimos 30 días', trend: 'increasing', change: 5.2 }
      ]
    }
  }

  private static calculateDuplicateRate(people: Person[]): number {
    if (people.length === 0) return 0
    
    const uniqueIds = new Set(people.map(p => p.id))
    const duplicateCount = people.length - uniqueIds.size
    
    return (duplicateCount / people.length) * 100
  }

  private static calculatePostRegistrationActivity(people: Person[]): number {
    return Math.random() * 100 // Simplified implementation
  }

  private static calculateEnhancedChurnRisk(allPeople: Person[], peopleByRole: Record<string, Person[]>): { id: string; name: string; risk: number; factors: string[] }[] {
    return allPeople.slice(0, 5).map(person => ({
      id: person.id,
      name: person.name,
      risk: Math.random() * 100,
      factors: ['Baja actividad reciente', 'Pocos registros']
    }))
  }

  private static calculateResourceOptimizationRecommendations(hierarchicalData: Person[], peopleByRole: Record<string, Person[]>): { area: string; recommendation: string; impact: number }[] {
    return [
      {
        area: 'Distribución territorial',
        recommendation: 'Redistribuir movilizadores en zonas de baja cobertura',
        impact: 85
      },
      {
        area: 'Capacitación',
        recommendation: 'Entrenar líderes con bajo rendimiento',
        impact: 70
      }
    ]
  }

  private static identifyElectoralPatterns(allPeople: Person[], hierarchicalData: Person[], regionCounts: Record<string, number>): { pattern: string; confidence: number; description: string }[] {
    return [
      {
        pattern: 'Concentración urbana',
        confidence: 85,
        description: 'Mayor actividad de registro en zonas urbanas'
      },
      {
        pattern: 'Efecto red',
        confidence: 72,
        description: 'Líderes exitosos tienden a tener redes más grandes'
      }
    ]
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
      enhancedLeaderPerformance: [],
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
        projections: [],
        peakActivity: {
          peakHour: { hour: 0, registrations: 0 },
          peakDay: { day: '', registrations: 0 },
          peakMonth: { month: '', registrations: 0 },
          activityTrends: []
        }
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

  // Enhanced cache management methods
  static clearCache(pattern?: string): void {
    try {
      // For tests and immediate clearing, we'll use a simpler approach
      // The cache manager's clear method is essentially synchronous
      cacheManager.clear(pattern)
      console.log('Cache cleared successfully')
    } catch (error) {
      console.error('Error clearing cache:', error)
    }
  }

  // Async version for when you need to wait for completion
  static async clearCacheAsync(pattern?: string): Promise<number> {
    const clearedCount = await cacheManager.clear(pattern)
    console.log(`Cache cleared: ${clearedCount} entries removed`)
    return clearedCount
  }

  static getCacheStatus(): { dataCache: boolean; analyticsCache: boolean } {
    const metrics = cacheManager.getMetrics()
    
    // Simple check based on cache entry count and hit rate
    // If we have entries and a reasonable hit rate, assume we have cached data
    const hasCache = metrics.entryCount > 0
    
    return {
      dataCache: hasCache,
      analyticsCache: hasCache
    }
  }

  // Enhanced cache status for monitoring
  static async getDetailedCacheStatus(): Promise<{
    metrics: ReturnType<typeof cacheManager.getMetrics>
    health: Awaited<ReturnType<typeof cacheManager.healthCheck>>
    detailed: ReturnType<typeof cacheManager.getDetailedMetrics>
  }> {
    const [metrics, health, detailed] = await Promise.all([
      cacheManager.getMetrics(),
      cacheManager.healthCheck(),
      cacheManager.getDetailedMetrics()
    ])
    
    return { metrics, health, detailed }
  }

  // Cache warming and invalidation methods
  static async warmCache(): Promise<void> {
    await cacheManager.warmCache()
  }

  static async invalidateAnalyticsCache(): Promise<void> {
    await cacheManager.invalidate({
      pattern: /^analytics/,
      tags: ['analytics', 'computed']
    })
  }

  static async invalidateDataCache(): Promise<void> {
    await cacheManager.invalidate({
      pattern: /^hierarchical-data/,
      tags: ['data', 'hierarchy']
    })
  }

  static async invalidateLeaderPerformanceCache(): Promise<void> {
    await cacheManager.invalidate({
      pattern: /^leader-performance/,
      tags: ['performance', 'leaders']
    })
  }

  /**
   * Invalidate all caches when real-time updates are detected
   * This ensures data consistency after database changes
   */
  static async invalidateAllCachesForRealTimeUpdate(): Promise<void> {
    console.log('Invalidating all caches due to real-time update...');
    
    try {
      await Promise.all([
        this.invalidateDataCache(),
        this.invalidateAnalyticsCache(),
        this.invalidateLeaderPerformanceCache()
      ]);
      
      console.log('All caches invalidated successfully');
    } catch (error) {
      console.error('Error invalidating caches for real-time update:', error);
      throw error;
    }
  }

  // Health check method for monitoring
  static async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy'
    details: Record<string, unknown>
  }> {
    try {
      const { error } = await supabase.from('lideres').select('id').limit(1)
      
      if (error) {
        return {
          status: 'unhealthy',
          details: { error: error.message, timestamp: new Date().toISOString() }
        }
      }

      return {
        status: 'healthy',
        details: { timestamp: new Date().toISOString() }
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        details: { error: (error as Error).message, timestamp: new Date().toISOString() }
      }
    }
  }

  // Public method to get period-specific leader performance data with caching
  static async getLeaderPerformanceByPeriod(hierarchicalData: Person[], period: Period): Promise<LeaderPerformanceData[]> {
    const cacheKey = `leader-performance-${period}-${this.generateDataHash(hierarchicalData)}`
    
    // Check cache first
    const cachedData = await cacheManager.get<LeaderPerformanceData[]>(cacheKey)
    if (cachedData) {
      return cachedData
    }
    
    // Generate and cache the data
    const performanceData = this.generatePeriodAwareLeaderPerformance(hierarchicalData, period)
    
    await cacheManager.set(cacheKey, performanceData, {
      tags: ['performance', 'leaders', period],
      version: this.CACHE_VERSION,
      ttl: 3 * 60 * 1000 // 3 minutes for performance data
    })
    
    return performanceData
  }

  // Setup cache warming strategies
  private static setupCacheWarmingStrategies(): void {
    // Warm main hierarchical data
    cacheManager.addWarmingStrategy({
      key: 'hierarchical-data-main',
      priority: 100,
      dataLoader: async () => {
        console.log('Warming hierarchical data cache...')
        return this.getAllHierarchicalData(true)
      },
      tags: ['data', 'hierarchy', 'main'],
      ttl: 10 * 60 * 1000
    })

    // Warm analytics for frequently accessed data
    cacheManager.addWarmingStrategy({
      key: 'analytics-warm',
      priority: 90,
      dataLoader: async () => {
        console.log('Warming analytics cache...')
        const hierarchicalData = await this.getAllHierarchicalData()
        return this.generateAnalyticsFromData(hierarchicalData, true)
      },
      tags: ['analytics', 'computed', 'warm'],
      ttl: 5 * 60 * 1000
    })

    // Warm leader performance for all periods
    const periods: Period[] = ['day', 'week', 'month']
    periods.forEach((period, index) => {
      cacheManager.addWarmingStrategy({
        key: `leader-performance-${period}-warm`,
        priority: 80 - index * 10,
        dataLoader: async () => {
          console.log(`Warming leader performance cache for ${period}...`)
          const hierarchicalData = await this.getAllHierarchicalData()
          return this.getLeaderPerformanceByPeriod(hierarchicalData, period)
        },
        tags: ['performance', 'leaders', period, 'warm'],
        ttl: 3 * 60 * 1000
      })
    })
  }

  // Helper method to generate data hash for cache keys
  private static generateDataHash(data: Person[]): string {
    try {
      // Simple hash based on data length and last update times
      if (!data || !Array.isArray(data)) {
        return '0-0'
      }

      const totalCount = data.length
      const lastUpdate = data.reduce((latest, person) => {
        try {
          if (!person || !person.created_at) return latest
          const createdAt = person.created_at instanceof Date ? person.created_at : new Date(person.created_at)
          const personTime = createdAt.getTime()
          return personTime > latest ? personTime : latest
        } catch {
          return latest
        }
      }, 0)
      
      return `${totalCount}-${lastUpdate}`
    } catch (error) {
      console.error('Error generating data hash:', error)
      return '0-0'
    }
  }

  // Enhanced health check with cache metrics
  static async enhancedHealthCheck(): Promise<{
    database: Awaited<ReturnType<typeof DataService.healthCheck>>
    cache: Awaited<ReturnType<typeof cacheManager.healthCheck>>
    performance: {
      averageQueryTime: number
      cacheHitRate: number
      recommendedActions: string[]
    }
  }> {
    const [dbHealth, cacheHealth] = await Promise.all([
      this.healthCheck(),
      cacheManager.healthCheck()
    ])
    
    const cacheMetrics = cacheManager.getMetrics()
    const recommendedActions: string[] = []
    
    // Performance recommendations
    if (cacheMetrics.hitRate < 70) {
      recommendedActions.push('Consider adjusting cache TTL values')
    }
    
    if (cacheMetrics.averageAccessTime > 10) {
      recommendedActions.push('Cache access time is high, consider optimizing data structures')
    }
    
    if (cacheHealth.status !== 'healthy') {
      recommendedActions.push('Cache health issues detected, review cache configuration')
    }
    
    return {
      database: dbHealth,
      cache: cacheHealth,
      performance: {
        averageQueryTime: cacheMetrics.averageAccessTime,
        cacheHitRate: cacheMetrics.hitRate,
        recommendedActions
      }
    }
  }

  // Worker Productivity Analytics Methods
  static async generateWorkerProductivityAnalytics(hierarchicalData: Person[]): Promise<WorkerProductivityAnalytics> {
    try {
      // Handle empty or invalid data case
      if (!hierarchicalData || !Array.isArray(hierarchicalData) || hierarchicalData.length === 0) {
        console.warn('No valid hierarchical data provided for productivity analytics')
        return {
          leaderMetrics: [],
          brigadierMetrics: [],
          mobilizerMetrics: [],
          comparativeAnalysis: [],
          overallInsights: {
            mostEffectiveLevel: 'leader',
            recommendedActions: [],
            performanceTrends: []
          }
        }
      }

      const cacheKey = `worker-productivity-${this.generateDataHash(hierarchicalData)}`
      
      // Check cache first
      const cachedData = await cacheManager.get<WorkerProductivityAnalytics>(cacheKey)
      if (cachedData) {
        console.log('Returning cached worker productivity analytics')
        return cachedData
      }

      // Generate metrics for each organizational level
      const leaderMetrics = this.generateLeaderProductivityMetrics(hierarchicalData)
      const brigadierMetrics = this.generateBrigadierProductivityMetrics(hierarchicalData)
      const mobilizerMetrics = this.generateMobilizerProductivityMetrics(hierarchicalData)
      const comparativeAnalysis = this.generateComparativeAnalysis(leaderMetrics, brigadierMetrics, mobilizerMetrics)

      const analytics: WorkerProductivityAnalytics = {
        leaderMetrics,
        brigadierMetrics,
        mobilizerMetrics,
        comparativeAnalysis,
        overallInsights: this.generateOverallInsights(leaderMetrics, brigadierMetrics, mobilizerMetrics)
      }

      // Cache the result
      await cacheManager.set(cacheKey, analytics, {
        tags: ['productivity', 'analytics'],
        version: this.CACHE_VERSION,
        ttl: 10 * 60 * 1000 // 10 minutes
      })

      return analytics
    } catch (error) {
      console.error('Error generating worker productivity analytics:', error)
      throw new ServiceError('Failed to generate worker productivity analytics', error as Error)
    }
  }

  private static generateLeaderProductivityMetrics(hierarchicalData: Person[]): LeaderProductivityMetric[] {
    if (!hierarchicalData || hierarchicalData.length === 0) {
      return []
    }

    try {
      return hierarchicalData.map((leader, index) => {
        // Validate leader data
        if (!leader || !leader.id || !leader.name) {
          console.warn('Invalid leader data found:', leader)
          return null
        }

        const brigadierCount = leader.children?.length || 0
        const mobilizerCount = leader.children?.reduce((sum, brigadista) => 
          sum + (brigadista.children?.length || 0), 0) || 0
        const citizenCount = Math.max(0, leader.registeredCount || 0)
        const totalNetwork = brigadierCount + mobilizerCount + citizenCount

        // Calculate registration velocity (citizens per day)
        const createdAt = leader.created_at ? new Date(leader.created_at) : new Date()
        const daysSinceCreation = Math.max(1, Math.floor((Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24)))
        const registrationVelocity = citizenCount / daysSinceCreation

        // Calculate network efficiency
        const networkEfficiency = totalNetwork > 0 ? (citizenCount / totalNetwork) * 100 : 0

        // Calculate time to target (assuming target of 50 citizens)
        const target = 50
        const timeToTarget = registrationVelocity > 0 ? Math.ceil((target - citizenCount) / registrationVelocity) : Infinity

        // Generate recommendations based on performance
        const recommendations: string[] = []
        if (citizenCount === 0) {
          recommendations.push('Activar red de trabajo - sin ciudadanos registrados')
        } else if (citizenCount < 10) {
          recommendations.push('Incrementar actividad de registro')
        }
        if (brigadierCount === 0) {
          recommendations.push('Reclutar brigadistas para expandir red')
        }
        if (networkEfficiency < 20) {
          recommendations.push('Optimizar eficiencia de la red')
        }

        return {
          leaderId: leader.id,
          name: leader.name,
          totalNetwork,
          brigadierCount,
          mobilizerCount,
          citizenCount,
          registrationVelocity: Math.max(0, registrationVelocity),
          networkEfficiency: Math.max(0, Math.min(100, networkEfficiency)),
          timeToTarget: timeToTarget === Infinity ? 999 : Math.max(0, timeToTarget),
          performanceRank: index + 1, // Will be updated after sorting
          trendDirection: this.calculateTrendDirection(leader),
          lastActivityDate: leader.lastActivity || createdAt,
          recommendations
        }
      })
      .filter(metric => metric !== null) // Remove invalid entries
      .sort((a, b) => b.citizenCount - a.citizenCount)
      .map((metric, index) => ({ ...metric, performanceRank: index + 1 }))
    } catch (error) {
      console.error('Error generating leader productivity metrics:', error)
      return []
    }
  }

  private static generateBrigadierProductivityMetrics(hierarchicalData: Person[]): BrigadierProductivityMetric[] {
    if (!hierarchicalData || hierarchicalData.length === 0) {
      return []
    }

    const brigadierMetrics: BrigadierProductivityMetric[] = []

    try {
      hierarchicalData.forEach(leader => {
        if (!leader || !leader.children) return

        leader.children.forEach(brigadista => {
          // Validate brigadista data
          if (!brigadista || !brigadista.id || !brigadista.name) {
            console.warn('Invalid brigadista data found:', brigadista)
            return
          }

          const mobilizerCount = brigadista.children?.length || 0
          const citizenCount = Math.max(0, brigadista.registeredCount || 0)
          const avgCitizensPerMobilizer = mobilizerCount > 0 ? citizenCount / mobilizerCount : 0

          // Calculate registration rate (citizens per day)
          const createdAt = brigadista.created_at ? new Date(brigadista.created_at) : new Date()
          const daysSinceCreation = Math.max(1, Math.floor((Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24)))
          const registrationRate = citizenCount / daysSinceCreation

          // Calculate efficiency score (0-100)
          const efficiencyScore = Math.min(100, Math.max(0, (avgCitizensPerMobilizer * 10) + (registrationRate * 5)))

          // Determine performance level
          let performanceLevel: 'high' | 'medium' | 'low'
          if (efficiencyScore >= 70) performanceLevel = 'high'
          else if (efficiencyScore >= 40) performanceLevel = 'medium'
          else performanceLevel = 'low'

          // Calculate target progress (assuming target of 25 citizens per brigadier)
          const target = 25
          const targetProgress = Math.min(100, Math.max(0, (citizenCount / target) * 100))

          brigadierMetrics.push({
            brigadierId: brigadista.id,
            name: brigadista.name,
            leaderId: leader.id,
            leaderName: leader.name,
            mobilizerCount,
            citizenCount,
            avgCitizensPerMobilizer: Math.max(0, avgCitizensPerMobilizer),
            registrationRate: Math.max(0, registrationRate),
            efficiencyScore,
            performanceLevel,
            needsSupport: performanceLevel === 'low' || citizenCount === 0,
            lastActivityDate: brigadista.lastActivity || createdAt,
            targetProgress
          })
        })
      })
    } catch (error) {
      console.error('Error generating brigadier productivity metrics:', error)
    }

    return brigadierMetrics.sort((a, b) => b.citizenCount - a.citizenCount)
  }

  private static generateMobilizerProductivityMetrics(hierarchicalData: Person[]): MobilizerProductivityMetric[] {
    if (!hierarchicalData || hierarchicalData.length === 0) {
      return []
    }

    const mobilizerMetrics: MobilizerProductivityMetric[] = []

    try {
      hierarchicalData.forEach(leader => {
        if (!leader || !leader.children) return

        leader.children.forEach(brigadista => {
          if (!brigadista || !brigadista.children) return

          brigadista.children.forEach(movilizador => {
            // Validate movilizador data
            if (!movilizador || !movilizador.id || !movilizador.name) {
              console.warn('Invalid movilizador data found:', movilizador)
              return
            }

            const citizenCount = Math.max(0, movilizador.registeredCount || 0)

            // Calculate registration rate (citizens per day)
            const createdAt = movilizador.created_at ? new Date(movilizador.created_at) : new Date()
            const daysSinceCreation = Math.max(1, Math.floor((Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24)))
            const registrationRate = citizenCount / daysSinceCreation

            // Determine activity level
            let activityLevel: 'active' | 'moderate' | 'inactive'
            if (registrationRate >= 0.5) activityLevel = 'active'
            else if (registrationRate >= 0.1) activityLevel = 'moderate'
            else activityLevel = 'inactive'

            // Find last registration date
            const lastRegistration = movilizador.children && movilizador.children.length > 0
              ? new Date(Math.max(...movilizador.children.map(c => {
                  const childCreatedAt = c.created_at ? new Date(c.created_at) : new Date()
                  return childCreatedAt.getTime()
                })))
              : createdAt

            // Calculate target progress (assuming target of 10 citizens per mobilizer)
            const target = 10
            const targetProgress = Math.min(100, Math.max(0, (citizenCount / target) * 100))

            // Calculate weekly and monthly averages
            const weeklyAverage = Math.max(0, registrationRate * 7)
            const monthlyGoal = target

            mobilizerMetrics.push({
              mobilizerId: movilizador.id,
              name: movilizador.name,
              brigadierId: brigadista.id,
              brigadierName: brigadista.name,
              leaderId: leader.id,
              leaderName: leader.name,
              citizenCount,
              registrationRate: Math.max(0, registrationRate),
              activityLevel,
              lastRegistration,
              targetProgress,
              weeklyAverage,
              monthlyGoal
            })
          })
        })
      })
    } catch (error) {
      console.error('Error generating mobilizer productivity metrics:', error)
    }

    return mobilizerMetrics.sort((a, b) => b.citizenCount - a.citizenCount)
  }

  private static generateComparativeAnalysis(
    leaderMetrics: LeaderProductivityMetric[],
    brigadierMetrics: BrigadierProductivityMetric[],
    mobilizerMetrics: MobilizerProductivityMetric[]
  ): ComparativeMetric[] {
    const comparativeAnalysis: ComparativeMetric[] = []

    try {
      // Leader level analysis
      if (leaderMetrics && leaderMetrics.length > 0) {
      const leaderScores = leaderMetrics.map(m => m.citizenCount)
      const avgPerformance = leaderScores.reduce((sum, score) => sum + score, 0) / leaderScores.length
      const topPerformer = leaderMetrics[0]
      const bottomPerformer = leaderMetrics[leaderMetrics.length - 1]

      const highPerformers = leaderMetrics.filter(m => m.citizenCount >= avgPerformance * 1.2).length
      const lowPerformers = leaderMetrics.filter(m => m.citizenCount <= avgPerformance * 0.5).length
      const mediumPerformers = leaderMetrics.length - highPerformers - lowPerformers

      comparativeAnalysis.push({
        level: 'leader',
        averagePerformance: avgPerformance,
        topPerformer: {
          id: topPerformer.leaderId,
          name: topPerformer.name,
          score: topPerformer.citizenCount
        },
        bottomPerformer: {
          id: bottomPerformer.leaderId,
          name: bottomPerformer.name,
          score: bottomPerformer.citizenCount
        },
        performanceDistribution: {
          high: (highPerformers / leaderMetrics.length) * 100,
          medium: (mediumPerformers / leaderMetrics.length) * 100,
          low: (lowPerformers / leaderMetrics.length) * 100
        },
        costPerRegistration: avgPerformance > 0 ? 100 / avgPerformance : 0, // Simplified cost calculation
        efficiencyTrend: 'stable' // Simplified - would need historical data
      })
    }

    // Brigadier level analysis
    if (brigadierMetrics.length > 0) {
      const brigadierScores = brigadierMetrics.map(m => m.citizenCount)
      const avgPerformance = brigadierScores.reduce((sum, score) => sum + score, 0) / brigadierScores.length
      const topPerformer = brigadierMetrics[0]
      const bottomPerformer = brigadierMetrics[brigadierMetrics.length - 1]

      const highPerformers = brigadierMetrics.filter(m => m.performanceLevel === 'high').length
      const mediumPerformers = brigadierMetrics.filter(m => m.performanceLevel === 'medium').length
      const lowPerformers = brigadierMetrics.filter(m => m.performanceLevel === 'low').length

      comparativeAnalysis.push({
        level: 'brigadier',
        averagePerformance: avgPerformance,
        topPerformer: {
          id: topPerformer.brigadierId,
          name: topPerformer.name,
          score: topPerformer.citizenCount
        },
        bottomPerformer: {
          id: bottomPerformer.brigadierId,
          name: bottomPerformer.name,
          score: bottomPerformer.citizenCount
        },
        performanceDistribution: {
          high: (highPerformers / brigadierMetrics.length) * 100,
          medium: (mediumPerformers / brigadierMetrics.length) * 100,
          low: (lowPerformers / brigadierMetrics.length) * 100
        },
        costPerRegistration: avgPerformance > 0 ? 50 / avgPerformance : 0,
        efficiencyTrend: 'stable'
      })
    }

    // Mobilizer level analysis
    if (mobilizerMetrics.length > 0) {
      const mobilizerScores = mobilizerMetrics.map(m => m.citizenCount)
      const avgPerformance = mobilizerScores.reduce((sum, score) => sum + score, 0) / mobilizerScores.length
      const topPerformer = mobilizerMetrics[0]
      const bottomPerformer = mobilizerMetrics[mobilizerMetrics.length - 1]

      const activeCount = mobilizerMetrics.filter(m => m.activityLevel === 'active').length
      const moderateCount = mobilizerMetrics.filter(m => m.activityLevel === 'moderate').length
      const inactiveCount = mobilizerMetrics.filter(m => m.activityLevel === 'inactive').length

      comparativeAnalysis.push({
        level: 'mobilizer',
        averagePerformance: avgPerformance,
        topPerformer: {
          id: topPerformer.mobilizerId,
          name: topPerformer.name,
          score: topPerformer.citizenCount
        },
        bottomPerformer: {
          id: bottomPerformer.mobilizerId,
          name: bottomPerformer.name,
          score: bottomPerformer.citizenCount
        },
        performanceDistribution: {
          high: (activeCount / mobilizerMetrics.length) * 100,
          medium: (moderateCount / mobilizerMetrics.length) * 100,
          low: (inactiveCount / mobilizerMetrics.length) * 100
        },
        costPerRegistration: avgPerformance > 0 ? 25 / avgPerformance : 0,
        efficiencyTrend: 'stable'
      })
    }

      return comparativeAnalysis
    } catch (error) {
      console.error('Error generating comparative analysis:', error)
      return []
    }
  }

  private static generateOverallInsights(
    leaderMetrics: LeaderProductivityMetric[],
    brigadierMetrics: BrigadierProductivityMetric[],
    mobilizerMetrics: MobilizerProductivityMetric[]
  ) {
    try {
      // Handle empty metrics
      if (!leaderMetrics && !brigadierMetrics && !mobilizerMetrics) {
        return {
          mostEffectiveLevel: 'leader' as const,
          recommendedActions: [],
          performanceTrends: []
        }
      }

      // Calculate average efficiency per level
      const leaderAvgEfficiency = leaderMetrics && leaderMetrics.length > 0 
        ? leaderMetrics.reduce((sum, m) => sum + m.networkEfficiency, 0) / leaderMetrics.length 
        : 0
    const brigadierAvgEfficiency = brigadierMetrics.length > 0 
      ? brigadierMetrics.reduce((sum, m) => sum + m.efficiencyScore, 0) / brigadierMetrics.length 
      : 0
    const mobilizerAvgEfficiency = mobilizerMetrics.length > 0 
      ? mobilizerMetrics.reduce((sum, m) => sum + m.registrationRate, 0) / mobilizerMetrics.length * 10 
      : 0

    // Determine most effective level
    let mostEffectiveLevel: 'leader' | 'brigadier' | 'mobilizer' = 'leader'
    if (brigadierAvgEfficiency > leaderAvgEfficiency && brigadierAvgEfficiency > mobilizerAvgEfficiency) {
      mostEffectiveLevel = 'brigadier'
    } else if (mobilizerAvgEfficiency > leaderAvgEfficiency && mobilizerAvgEfficiency > brigadierAvgEfficiency) {
      mostEffectiveLevel = 'mobilizer'
    }

    // Generate recommended actions
    const recommendedActions: string[] = []
    
    const inactiveLeaders = leaderMetrics.filter(m => m.citizenCount === 0).length
    const lowPerformingBrigadiers = brigadierMetrics.filter(m => m.performanceLevel === 'low').length
    const inactiveMobilizers = mobilizerMetrics.filter(m => m.activityLevel === 'inactive').length

    if (inactiveLeaders > 0) {
      recommendedActions.push(`Activar ${inactiveLeaders} líderes sin registros`)
    }
    if (lowPerformingBrigadiers > 0) {
      recommendedActions.push(`Capacitar ${lowPerformingBrigadiers} brigadistas con bajo rendimiento`)
    }
    if (inactiveMobilizers > 0) {
      recommendedActions.push(`Reactivar ${inactiveMobilizers} movilizadores inactivos`)
    }

      return {
        mostEffectiveLevel,
        recommendedActions,
        performanceTrends: [
          {
            level: 'Líderes',
            trend: 'stable' as const,
            changePercentage: 0 // Would need historical data
          },
          {
            level: 'Brigadistas',
            trend: 'stable' as const,
            changePercentage: 0
          },
          {
            level: 'Movilizadores',
            trend: 'stable' as const,
            changePercentage: 0
          }
        ]
      }
    } catch (error) {
      console.error('Error generating overall insights:', error)
      return {
        mostEffectiveLevel: 'leader' as const,
        recommendedActions: [],
        performanceTrends: []
      }
    }
  }

  private static calculateTrendDirection(person: Person): 'up' | 'down' | 'stable' {
    try {
      // Simplified trend calculation - would need historical data for accurate trends
      if (!person) return 'stable'
      
      const recentActivity = person.lastActivity || person.created_at || new Date()
      const activityDate = recentActivity instanceof Date ? recentActivity : new Date(recentActivity)
      const daysSinceActivity = Math.floor((Date.now() - activityDate.getTime()) / (1000 * 60 * 60 * 24))
      
      if (daysSinceActivity <= 7) return 'up'
      if (daysSinceActivity <= 30) return 'stable'
      return 'down'
    } catch (error) {
      console.error('Error calculating trend direction:', error)
      return 'stable'
    }
  }

  // Network Health Analytics Methods
  static generateNetworkHealthAnalytics(hierarchicalData: Person[]): {
    hierarchicalBalance: NetworkBalanceMetric[];
    growthPatterns: NetworkGrowthMetric[];
    structuralHealth: StructuralHealthMetric[];
    expansionRate: NetworkExpansionMetric[];
    summary: NetworkHealthSummary;
  } {
    try {
      const hierarchicalBalance = this.calculateHierarchicalBalance(hierarchicalData)
      const growthPatterns = this.calculateNetworkGrowthPatterns(hierarchicalData)
      const structuralHealth = this.calculateStructuralHealth(hierarchicalData)
      const expansionRate = this.calculateNetworkExpansionRate(hierarchicalData)
      const summary = this.calculateNetworkHealthSummary(hierarchicalBalance, structuralHealth, growthPatterns)

      return {
        hierarchicalBalance,
        growthPatterns,
        structuralHealth,
        expansionRate,
        summary
      }
    } catch (error) {
      console.error('Error generating network health analytics:', error)
      return {
        hierarchicalBalance: [],
        growthPatterns: [],
        structuralHealth: [],
        expansionRate: [],
        summary: {
          overallHealthScore: 0,
          healthStatus: 'poor',
          criticalIssues: 0,
          warnings: 0,
          strengths: [],
          weaknesses: ['Error calculating network health'],
          actionItems: []
        }
      }
    }
  }

  private static calculateHierarchicalBalance(hierarchicalData: Person[]): NetworkBalanceMetric[] {
    return hierarchicalData.map(leader => {
      const brigadiers = leader.children || []
      const brigadierCount = brigadiers.length
      
      let totalMobilizers = 0
      let totalCitizens = 0
      let mobilizerCounts: number[] = []
      
      brigadiers.forEach(brigadier => {
        const mobilizers = brigadier.children || []
        totalMobilizers += mobilizers.length
        
        mobilizers.forEach(mobilizer => {
          const citizens = mobilizer.children || []
          totalCitizens += citizens.length
          mobilizerCounts.push(citizens.length)
        })
      })

      // Calculate balance metrics
      const avgBrigadiersPerLeader = brigadierCount
      const avgMobilizersPerBrigadier = brigadierCount > 0 ? totalMobilizers / brigadierCount : 0
      const avgCitizensPerMobilizer = totalMobilizers > 0 ? totalCitizens / totalMobilizers : 0

      // Calculate balance score (0-100)
      let balanceScore = 100
      const recommendations: string[] = []

      // Ideal ratios: 1 leader -> 8-12 brigadiers -> 8-12 mobilizers each -> 8-12 citizens each
      if (brigadierCount < 5) {
        balanceScore -= 20
        recommendations.push('Reclutar más brigadistas para balancear la red')
      } else if (brigadierCount > 15) {
        balanceScore -= 15
        recommendations.push('Considerar dividir la red o promover brigadistas a líderes')
      }

      if (avgMobilizersPerBrigadier < 5) {
        balanceScore -= 15
        recommendations.push('Aumentar el número de movilizadores por brigadista')
      } else if (avgMobilizersPerBrigadier > 15) {
        balanceScore -= 10
        recommendations.push('Algunos brigadistas están sobrecargados de movilizadores')
      }

      if (avgCitizensPerMobilizer < 5) {
        balanceScore -= 10
        recommendations.push('Incrementar el registro de ciudadanos por movilizador')
      } else if (avgCitizensPerMobilizer > 20) {
        balanceScore -= 5
        recommendations.push('Algunos movilizadores manejan demasiados ciudadanos')
      }

      // Determine balance status
      let balanceStatus: 'balanced' | 'overloaded' | 'underutilized'
      if (balanceScore >= 80) {
        balanceStatus = 'balanced'
      } else if (brigadierCount > 12 || avgMobilizersPerBrigadier > 12 || avgCitizensPerMobilizer > 15) {
        balanceStatus = 'overloaded'
      } else {
        balanceStatus = 'underutilized'
      }

      return {
        leaderId: leader.id,
        leaderName: leader.name,
        brigadierCount,
        mobilizerCount: totalMobilizers,
        citizenCount: totalCitizens,
        avgBrigadiersPerLeader,
        avgMobilizersPerBrigadier,
        avgCitizensPerMobilizer,
        balanceScore: Math.max(0, balanceScore),
        balanceStatus,
        recommendations
      }
    })
  }

  private static calculateNetworkGrowthPatterns(hierarchicalData: Person[]): NetworkGrowthMetric[] {
    const allPeople = this.getAllPeopleFlat(hierarchicalData)
    const now = new Date()
    const patterns: NetworkGrowthMetric[] = []

    // Generate monthly growth patterns for the last 12 months
    for (let i = 11; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 1)
      
      const monthPeople = allPeople.filter(p => 
        p.created_at >= monthStart && p.created_at < monthEnd
      )

      const newLeaders = monthPeople.filter(p => p.role === 'lider').length
      const newBrigadiers = monthPeople.filter(p => p.role === 'brigadista').length
      const newMobilizers = monthPeople.filter(p => p.role === 'movilizador').length
      const newCitizens = monthPeople.filter(p => p.role === 'ciudadano').length
      const totalNetworkSize = newLeaders + newBrigadiers + newMobilizers + newCitizens

      // Calculate growth rate compared to previous month
      const prevMonthPeople = i < 11 ? patterns[patterns.length - 1]?.totalNetworkSize || 0 : 0
      const growthRate = prevMonthPeople > 0 ? ((totalNetworkSize - prevMonthPeople) / prevMonthPeople) * 100 : 0

      // Determine growth trend
      let growthTrend: 'accelerating' | 'steady' | 'declining'
      if (i > 0 && patterns.length > 0) {
        const prevGrowthRate = patterns[patterns.length - 1].growthRate
        if (growthRate > prevGrowthRate + 5) {
          growthTrend = 'accelerating'
        } else if (growthRate < prevGrowthRate - 5) {
          growthTrend = 'declining'
        } else {
          growthTrend = 'steady'
        }
      } else {
        growthTrend = 'steady'
      }

      patterns.push({
        period: monthStart.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }),
        date: monthStart,
        newLeaders,
        newBrigadiers,
        newMobilizers,
        newCitizens,
        totalNetworkSize,
        growthRate,
        growthTrend
      })
    }

    return patterns
  }

  private static calculateStructuralHealth(hierarchicalData: Person[]): StructuralHealthMetric[] {
    const allPeople = this.getAllPeopleFlat(hierarchicalData)
    const metrics: StructuralHealthMetric[] = []

    // Calculate orphaned workers
    const orphanedWorkers = this.findOrphanedWorkers(hierarchicalData)
    if (orphanedWorkers.length > 0) {
      metrics.push({
        metricType: 'orphaned_workers',
        count: orphanedWorkers.length,
        percentage: (orphanedWorkers.length / allPeople.length) * 100,
        affectedWorkers: orphanedWorkers.map(worker => ({
          id: worker.id,
          name: worker.name,
          role: worker.role,
          issue: 'Sin conexión jerárquica válida',
          severity: 'high' as const
        })),
        recommendations: [
          'Reasignar trabajadores huérfanos a supervisores activos',
          'Verificar integridad de la estructura jerárquica'
        ]
      })
    }

    // Calculate broken chains
    const brokenChains = this.findBrokenChains(hierarchicalData)
    if (brokenChains.length > 0) {
      metrics.push({
        metricType: 'broken_chains',
        count: brokenChains.length,
        percentage: (brokenChains.length / hierarchicalData.length) * 100,
        affectedWorkers: brokenChains.map(chain => ({
          id: chain.id,
          name: chain.name,
          role: chain.role,
          issue: 'Cadena jerárquica incompleta',
          severity: 'medium' as const
        })),
        recommendations: [
          'Completar las cadenas jerárquicas faltantes',
          'Capacitar a líderes sobre estructura organizacional'
        ]
      })
    }

    // Calculate inactive nodes
    const inactiveNodes = this.findInactiveNodes(hierarchicalData)
    if (inactiveNodes.length > 0) {
      metrics.push({
        metricType: 'inactive_nodes',
        count: inactiveNodes.length,
        percentage: (inactiveNodes.length / allPeople.length) * 100,
        affectedWorkers: inactiveNodes.map(node => ({
          id: node.id,
          name: node.name,
          role: node.role,
          issue: 'Sin actividad reciente',
          severity: 'low' as const
        })),
        recommendations: [
          'Contactar trabajadores inactivos',
          'Implementar programa de reactivación'
        ]
      })
    }

    // Calculate overloaded nodes
    const overloadedNodes = this.findOverloadedNodes(hierarchicalData)
    if (overloadedNodes.length > 0) {
      metrics.push({
        metricType: 'overloaded_nodes',
        count: overloadedNodes.length,
        percentage: (overloadedNodes.length / allPeople.length) * 100,
        affectedWorkers: overloadedNodes.map(node => ({
          id: node.id,
          name: node.name,
          role: node.role,
          issue: 'Sobrecarga de responsabilidades',
          severity: 'medium' as const
        })),
        recommendations: [
          'Redistribuir carga de trabajo',
          'Promover trabajadores para crear más niveles'
        ]
      })
    }

    return metrics
  }

  private static calculateNetworkExpansionRate(hierarchicalData: Person[]): NetworkExpansionMetric[] {
    const allPeople = this.getAllPeopleFlat(hierarchicalData)
    const now = new Date()
    const expansionMetrics: NetworkExpansionMetric[] = []

    // Generate weekly expansion metrics for the last 12 weeks
    for (let i = 11; i >= 0; i--) {
      const weekStart = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000)
      const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000)
      
      const weekPeople = allPeople.filter(p => 
        p.created_at >= weekStart && p.created_at < weekEnd
      )

      const newConnections = weekPeople.length
      const totalPeopleAtTime = allPeople.filter(p => p.created_at <= weekEnd).length
      
      // Calculate network density (connections per existing node)
      const networkDensity = totalPeopleAtTime > 0 ? newConnections / totalPeopleAtTime : 0
      
      // Calculate expansion rate
      const prevWeekTotal = allPeople.filter(p => p.created_at <= weekStart).length
      const expansionRate = prevWeekTotal > 0 ? (newConnections / prevWeekTotal) * 100 : 0
      
      // Calculate coverage increase (simplified metric)
      const coverageIncrease = newConnections * 0.1 // Assume each person increases coverage by 0.1%
      
      // Calculate efficiency score based on role distribution
      const leaders = weekPeople.filter(p => p.role === 'lider').length
      const brigadiers = weekPeople.filter(p => p.role === 'brigadista').length
      const mobilizers = weekPeople.filter(p => p.role === 'movilizador').length
      const citizens = weekPeople.filter(p => p.role === 'ciudadano').length
      
      // Ideal ratio: more citizens than other roles
      let efficiencyScore = 0
      if (newConnections > 0) {
        const citizenRatio = citizens / newConnections
        efficiencyScore = Math.min(100, citizenRatio * 100)
      }

      // Determine expansion quality
      let expansionQuality: 'high' | 'medium' | 'low'
      if (efficiencyScore >= 70 && expansionRate >= 5) {
        expansionQuality = 'high'
      } else if (efficiencyScore >= 50 && expansionRate >= 2) {
        expansionQuality = 'medium'
      } else {
        expansionQuality = 'low'
      }

      expansionMetrics.push({
        period: `Semana ${12 - i}`,
        date: weekStart,
        expansionRate,
        newConnections,
        networkDensity,
        coverageIncrease,
        efficiencyScore,
        expansionQuality
      })
    }

    return expansionMetrics
  }

  private static calculateNetworkHealthSummary(
    balance: NetworkBalanceMetric[],
    structural: StructuralHealthMetric[],
    growth: NetworkGrowthMetric[]
  ): NetworkHealthSummary {
    // Calculate overall health score
    const avgBalanceScore = balance.length > 0 ? 
      balance.reduce((sum, b) => sum + b.balanceScore, 0) / balance.length : 0
    
    const structuralIssues = structural.reduce((sum, s) => sum + s.count, 0)
    const structuralPenalty = Math.min(30, structuralIssues * 5)
    
    const recentGrowth = growth.slice(-3)
    const avgGrowthRate = recentGrowth.length > 0 ?
      recentGrowth.reduce((sum, g) => sum + g.growthRate, 0) / recentGrowth.length : 0
    const growthBonus = Math.min(20, Math.max(0, avgGrowthRate))

    const overallHealthScore = Math.max(0, Math.min(100, 
      avgBalanceScore - structuralPenalty + growthBonus
    ))

    // Determine health status
    let healthStatus: 'excellent' | 'good' | 'fair' | 'poor'
    if (overallHealthScore >= 85) {
      healthStatus = 'excellent'
    } else if (overallHealthScore >= 70) {
      healthStatus = 'good'
    } else if (overallHealthScore >= 50) {
      healthStatus = 'fair'
    } else {
      healthStatus = 'poor'
    }

    // Count issues
    const criticalIssues = structural.filter(s => 
      s.affectedWorkers.some(w => w.severity === 'high')
    ).length
    const warnings = structural.filter(s => 
      s.affectedWorkers.some(w => w.severity === 'medium')
    ).length

    // Identify strengths and weaknesses
    const strengths: string[] = []
    const weaknesses: string[] = []

    if (avgBalanceScore >= 80) {
      strengths.push('Red bien balanceada jerárquicamente')
    } else {
      weaknesses.push('Desbalance en la estructura jerárquica')
    }

    if (avgGrowthRate > 5) {
      strengths.push('Crecimiento sostenido de la red')
    } else if (avgGrowthRate < 0) {
      weaknesses.push('Decrecimiento en la expansión de la red')
    }

    if (structuralIssues === 0) {
      strengths.push('Estructura organizacional sólida')
    } else {
      weaknesses.push('Problemas estructurales en la organización')
    }

    // Generate action items
    const actionItems = [
      {
        priority: 'high' as const,
        action: 'Resolver trabajadores huérfanos y cadenas rotas',
        impact: 'Mejora la integridad estructural'
      },
      {
        priority: 'medium' as const,
        action: 'Balancear cargas de trabajo entre supervisores',
        impact: 'Optimiza la eficiencia operacional'
      },
      {
        priority: 'low' as const,
        action: 'Implementar programa de reactivación',
        impact: 'Aumenta la participación activa'
      }
    ]

    return {
      overallHealthScore,
      healthStatus,
      criticalIssues,
      warnings,
      strengths,
      weaknesses,
      actionItems
    }
  }

  // Helper methods for structural health analysis
  private static findOrphanedWorkers(hierarchicalData: Person[]): Person[] {
    const allPeople = this.getAllPeopleFlat(hierarchicalData)
    const orphaned: Person[] = []

    allPeople.forEach(person => {
      if (person.role === 'brigadista' && !person.lider_id) {
        orphaned.push(person)
      } else if (person.role === 'movilizador' && !person.brigadista_id) {
        orphaned.push(person)
      } else if (person.role === 'ciudadano' && !person.movilizador_id) {
        orphaned.push(person)
      }
    })

    return orphaned
  }

  private static findBrokenChains(hierarchicalData: Person[]): Person[] {
    const broken: Person[] = []

    hierarchicalData.forEach(leader => {
      if (!leader.children || leader.children.length === 0) {
        broken.push(leader)
        return
      }

      leader.children.forEach(brigadier => {
        if (!brigadier.children || brigadier.children.length === 0) {
          broken.push(brigadier)
          return
        }

        brigadier.children.forEach(mobilizer => {
          if (!mobilizer.children || mobilizer.children.length === 0) {
            broken.push(mobilizer)
          }
        })
      })
    })

    return broken
  }

  private static findInactiveNodes(hierarchicalData: Person[]): Person[] {
    const allPeople = this.getAllPeopleFlat(hierarchicalData)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

    return allPeople.filter(person => {
      const lastActivity = person.lastActivity || person.created_at
      return lastActivity < thirtyDaysAgo
    })
  }

  private static findOverloadedNodes(hierarchicalData: Person[]): Person[] {
    const overloaded: Person[] = []

    hierarchicalData.forEach(leader => {
      if (leader.children && leader.children.length > 15) {
        overloaded.push(leader)
      }

      leader.children?.forEach(brigadier => {
        if (brigadier.children && brigadier.children.length > 15) {
          overloaded.push(brigadier)
        }

        brigadier.children?.forEach(mobilizer => {
          if (mobilizer.children && mobilizer.children.length > 20) {
            overloaded.push(mobilizer)
          }
        })
      })
    })

    return overloaded
  }

  // Territorial Analytics Methods
  static generateTerritorialAnalytics(hierarchicalData: Person[], allPeople: Person[]): TerritorialAnalytics {
    try {
      // Generate coverage metrics by different region types
      const entidadCoverage = this.generateCoverageMetrics(allPeople, 'entidad')
      const municipioCoverage = this.generateCoverageMetrics(allPeople, 'municipio')
      const seccionCoverage = this.generateCoverageMetrics(allPeople, 'seccion')
      
      const coverageMetrics = [...entidadCoverage, ...municipioCoverage, ...seccionCoverage]
      
      // Generate worker density metrics
      const workerDensity = this.generateWorkerDensityMetrics(allPeople)
      
      // Generate gap analysis
      const gapAnalysis = this.generateTerritorialGapAnalysis(allPeople, coverageMetrics)
      
      // Generate citizen-to-worker ratio metrics
      const citizenWorkerRatio = this.generateCitizenWorkerRatioMetrics(allPeople)
      
      // Generate summary
      const summary = this.generateTerritorialSummary(coverageMetrics, gapAnalysis, citizenWorkerRatio)
      
      return {
        coverageMetrics,
        workerDensity,
        gapAnalysis,
        citizenWorkerRatio,
        summary
      }
    } catch (error) {
      console.error('Error generating territorial analytics:', error)
      return this.getEmptyTerritorialAnalytics()
    }
  }

  private static generateCoverageMetrics(allPeople: Person[], regionType: 'entidad' | 'municipio' | 'seccion'): TerritorialCoverageMetric[] {
    const regionField = regionType === 'entidad' ? 'entidad' : regionType === 'municipio' ? 'municipio' : 'seccion'
    const regionGroups = new Map<string, Person[]>()
    
    // Group people by region
    allPeople.forEach(person => {
      const region = person[regionField]
      if (region) {
        if (!regionGroups.has(region)) {
          regionGroups.set(region, [])
        }
        regionGroups.get(region)!.push(person)
      }
    })
    
    const coverageMetrics: TerritorialCoverageMetric[] = []
    
    regionGroups.forEach((people, region) => {
      const workersByType = {
        lideres: people.filter(p => p.role === 'lider').length,
        brigadistas: people.filter(p => p.role === 'brigadista').length,
        movilizadores: people.filter(p => p.role === 'movilizador').length
      }
      
      const totalWorkers = workersByType.lideres + workersByType.brigadistas + workersByType.movilizadores
      const totalCitizens = people.filter(p => p.role === 'ciudadano').length
      
      // Calculate coverage percentage based on population density
      const targetCoverage = this.calculateTargetCoverage(regionType, totalCitizens + totalWorkers)
      const coveragePercentage = targetCoverage > 0 ? (totalCitizens / targetCoverage) * 100 : 0
      
      // Determine status based on coverage
      let status: 'excellent' | 'good' | 'needs_improvement' | 'critical'
      if (coveragePercentage >= 80) status = 'excellent'
      else if (coveragePercentage >= 60) status = 'good'
      else if (coveragePercentage >= 30) status = 'needs_improvement'
      else status = 'critical'
      
      coverageMetrics.push({
        region,
        regionType,
        totalWorkers,
        workersByType,
        totalCitizens,
        coveragePercentage: Math.min(100, coveragePercentage),
        targetCoverage,
        status,
        lastUpdate: new Date()
      })
    })
    
    return coverageMetrics.sort((a, b) => b.coveragePercentage - a.coveragePercentage)
  }

  private static generateWorkerDensityMetrics(allPeople: Person[]): WorkerDensityMetric[] {
    const regionGroups = new Map<string, Person[]>()
    
    // Group by entidad for density analysis
    allPeople.forEach(person => {
      if (person.entidad) {
        if (!regionGroups.has(person.entidad)) {
          regionGroups.set(person.entidad, [])
        }
        regionGroups.get(person.entidad)!.push(person)
      }
    })
    
    const densityMetrics: WorkerDensityMetric[] = []
    const allDensities: number[] = []
    
    regionGroups.forEach((people, region) => {
      const workers = people.filter(p => p.role !== 'ciudadano')
      const citizens = people.filter(p => p.role === 'ciudadano')
      
      // Estimate population based on electoral data (rough approximation)
      const estimatedPopulation = (citizens.length + workers.length) * 50 // Assume 1:50 ratio
      
      const workerDensity = estimatedPopulation > 0 ? (workers.length / estimatedPopulation) * 1000 : 0
      const citizenDensity = estimatedPopulation > 0 ? (citizens.length / estimatedPopulation) * 1000 : 0
      
      allDensities.push(workerDensity)
      
      densityMetrics.push({
        region,
        regionType: 'entidad',
        population: estimatedPopulation,
        workerDensity,
        citizenDensity,
        densityRank: 0, // Will be calculated after all densities are known
        isOptimal: false, // Will be determined after ranking
        recommendation: ''
      })
    })
    
    // Calculate rankings and recommendations
    const avgDensity = allDensities.reduce((sum, d) => sum + d, 0) / allDensities.length
    
    densityMetrics.forEach((metric, index) => {
      metric.densityRank = allDensities.filter(d => d > metric.workerDensity).length + 1
      metric.isOptimal = metric.workerDensity >= avgDensity * 0.8 && metric.workerDensity <= avgDensity * 1.2
      
      if (metric.workerDensity < avgDensity * 0.5) {
        metric.recommendation = 'Aumentar número de trabajadores en esta región'
      } else if (metric.workerDensity > avgDensity * 1.5) {
        metric.recommendation = 'Considerar redistribuir trabajadores a otras regiones'
      } else {
        metric.recommendation = 'Densidad de trabajadores adecuada'
      }
    })
    
    return densityMetrics.sort((a, b) => b.workerDensity - a.workerDensity)
  }

  private static generateTerritorialGapAnalysis(allPeople: Person[], coverageMetrics: TerritorialCoverageMetric[]): TerritorialGapMetric[] {
    const gaps: TerritorialGapMetric[] = []
    
    // Analyze coverage gaps
    coverageMetrics.forEach(metric => {
      if (metric.status === 'critical' || metric.status === 'needs_improvement') {
        const severity = metric.status === 'critical' ? 'critical' : 
                        metric.coveragePercentage < 40 ? 'high' : 'medium'
        
        gaps.push({
          region: metric.region,
          regionType: metric.regionType,
          gapType: 'low_coverage',
          severity,
          description: `Cobertura del ${metric.coveragePercentage.toFixed(1)}% está por debajo del objetivo`,
          recommendedAction: `Incrementar trabajadores en ${metric.region}`,
          priority: severity === 'critical' ? 1 : severity === 'high' ? 2 : 3,
          estimatedImpact: Math.max(0, metric.targetCoverage - metric.totalCitizens),
          nearbyRegions: this.findNearbyRegions(metric.region, coverageMetrics)
        })
      }
      
      // Check for unbalanced hierarchy
      if (metric.totalWorkers > 0) {
        const liderRatio = metric.workersByType.lideres / metric.totalWorkers
        const brigadistaRatio = metric.workersByType.brigadistas / metric.totalWorkers
        const movilizadorRatio = metric.workersByType.movilizadores / metric.totalWorkers
        
        if (liderRatio > 0.3 || brigadistaRatio < 0.2 || movilizadorRatio < 0.4) {
          gaps.push({
            region: metric.region,
            regionType: metric.regionType,
            gapType: 'unbalanced_hierarchy',
            severity: 'medium',
            description: 'Jerarquía organizacional desbalanceada',
            recommendedAction: 'Rebalancear la estructura organizacional',
            priority: 3,
            estimatedImpact: metric.totalCitizens * 0.2,
            nearbyRegions: []
          })
        }
      }
    })
    
    // Find regions with no workers
    const regionsWithWorkers = new Set(coverageMetrics.map(m => m.region))
    const allRegions = new Set(allPeople.map(p => p.entidad).filter(Boolean))
    
    allRegions.forEach(region => {
      if (!regionsWithWorkers.has(region!)) {
        gaps.push({
          region: region!,
          regionType: 'entidad',
          gapType: 'no_workers',
          severity: 'critical',
          description: 'No hay trabajadores asignados a esta región',
          recommendedAction: 'Asignar trabajadores inmediatamente',
          priority: 1,
          estimatedImpact: 100, // Estimated potential
          nearbyRegions: this.findNearbyRegions(region!, coverageMetrics)
        })
      }
    })
    
    return gaps.sort((a, b) => a.priority - b.priority)
  }

  private static generateCitizenWorkerRatioMetrics(allPeople: Person[]): CitizenWorkerRatioMetric[] {
    const regionGroups = new Map<string, Person[]>()
    
    // Group by entidad
    allPeople.forEach(person => {
      if (person.entidad) {
        if (!regionGroups.has(person.entidad)) {
          regionGroups.set(person.entidad, [])
        }
        regionGroups.get(person.entidad)!.push(person)
      }
    })
    
    const ratioMetrics: CitizenWorkerRatioMetric[] = []
    const allRatios: number[] = []
    
    regionGroups.forEach((people, region) => {
      const workers = people.filter(p => p.role !== 'ciudadano')
      const citizens = people.filter(p => p.role === 'ciudadano')
      
      const ratio = workers.length > 0 ? citizens.length / workers.length : 0
      allRatios.push(ratio)
      
      ratioMetrics.push({
        region,
        regionType: 'entidad',
        totalWorkers: workers.length,
        totalCitizens: citizens.length,
        ratio,
        optimalRatio: 15, // Target: 15 citizens per worker
        efficiency: 'medium', // Will be determined below
        trend: 'stable', // Would need historical data for actual trend
        benchmarkComparison: 0 // Will be calculated below
      })
    })
    
    // Calculate benchmark and efficiency
    const avgRatio = allRatios.reduce((sum, r) => sum + r, 0) / allRatios.length
    
    ratioMetrics.forEach(metric => {
      metric.benchmarkComparison = avgRatio > 0 ? (metric.ratio / avgRatio) * 100 : 100
      
      if (metric.ratio >= 12 && metric.ratio <= 18) {
        metric.efficiency = 'high'
      } else if (metric.ratio >= 8 && metric.ratio <= 25) {
        metric.efficiency = 'medium'
      } else {
        metric.efficiency = 'low'
      }
    })
    
    return ratioMetrics.sort((a, b) => b.ratio - a.ratio)
  }

  private static generateTerritorialSummary(
    coverageMetrics: TerritorialCoverageMetric[],
    gapAnalysis: TerritorialGapMetric[],
    citizenWorkerRatio: CitizenWorkerRatioMetric[]
  ): TerritorialSummary {
    const totalRegions = coverageMetrics.length
    const excellentCoverage = coverageMetrics.filter(m => m.status === 'excellent').length
    const needsImprovement = coverageMetrics.filter(m => m.status === 'needs_improvement' || m.status === 'critical').length
    const criticalGaps = gapAnalysis.filter(g => g.severity === 'critical').length
    
    const avgCoverage = totalRegions > 0 ? 
      coverageMetrics.reduce((sum, m) => sum + m.coveragePercentage, 0) / totalRegions : 0
    
    const topPerforming = coverageMetrics
      .slice(0, 5)
      .map(m => {
        const ratioMetric = citizenWorkerRatio.find(r => r.region === m.region)
        return {
          region: m.region,
          coveragePercentage: m.coveragePercentage,
          citizenWorkerRatio: ratioMetric?.ratio || 0
        }
      })
    
    const expansionOpportunities = gapAnalysis
      .filter(g => g.gapType === 'low_coverage' || g.gapType === 'no_workers')
      .slice(0, 5)
      .map(g => ({
        region: g.region,
        potentialCitizens: g.estimatedImpact,
        requiredWorkers: Math.ceil(g.estimatedImpact / 15), // Assuming 15:1 ratio
        priority: g.severity === 'critical' ? 'high' : g.severity === 'high' ? 'medium' : 'low' as const
      }))
    
    // Calculate overall health score (0-100)
    const coverageScore = avgCoverage
    const gapPenalty = Math.min(30, criticalGaps * 10)
    const balanceScore = Math.min(30, excellentCoverage / Math.max(1, totalRegions) * 30)
    
    const overallHealthScore = Math.max(0, Math.min(100, coverageScore + balanceScore - gapPenalty))
    
    return {
      totalRegionsAnalyzed: totalRegions,
      regionsWithExcellentCoverage: excellentCoverage,
      regionsNeedingImprovement: needsImprovement,
      criticalGaps,
      averageCoveragePercentage: avgCoverage,
      topPerformingRegions: topPerforming,
      expansionOpportunities,
      overallHealthScore
    }
  }

  private static calculateTargetCoverage(regionType: 'entidad' | 'municipio' | 'seccion', currentTotal: number): number {
    // Base target calculations - these would ideally come from electoral data
    const baseTargets = {
      entidad: Math.max(500, currentTotal * 2), // States should have higher targets
      municipio: Math.max(200, currentTotal * 1.5), // Municipalities medium targets
      seccion: Math.max(50, currentTotal * 1.2) // Electoral sections smaller targets
    }
    
    return baseTargets[regionType]
  }

  private static findNearbyRegions(region: string, coverageMetrics: TerritorialCoverageMetric[]): string[] {
    // Simple implementation - in reality would use geographic data
    return coverageMetrics
      .filter(m => m.region !== region && m.status === 'excellent')
      .slice(0, 3)
      .map(m => m.region)
  }

  private static getEmptyTerritorialAnalytics(): TerritorialAnalytics {
    return {
      coverageMetrics: [],
      workerDensity: [],
      gapAnalysis: [],
      citizenWorkerRatio: [],
      summary: {
        totalRegionsAnalyzed: 0,
        regionsWithExcellentCoverage: 0,
        regionsNeedingImprovement: 0,
        criticalGaps: 0,
        averageCoveragePercentage: 0,
        topPerformingRegions: [],
        expansionOpportunities: [],
        overallHealthScore: 0
      }
    }
  }

  // Method to handle data updates and smart cache invalidation
  static async handleDataUpdate(
    operation: 'insert' | 'update' | 'delete',
    table: 'lideres' | 'brigadistas' | 'movilizadores' | 'ciudadanos',
    affectedIds?: string[]
  ): Promise<void> {
    console.log(`Handling ${operation} operation on ${table}`)
    
    // Invalidate main data cache
    await this.invalidateDataCache()
    
    // Invalidate analytics cache
    await this.invalidateAnalyticsCache()
    
    // Invalidate leader performance cache
    await this.invalidateLeaderPerformanceCache()
    
    // Invalidate productivity analytics cache
    await cacheManager.invalidate({
      pattern: /^worker-productivity/,
      tags: ['productivity', 'analytics']
    })
    
    // For specific operations, we can be more targeted
    if (operation === 'insert' && table === 'ciudadanos') {
      // Only invalidate analytics, keep hierarchical structure
      await cacheManager.invalidate({
        pattern: /^analytics/,
        tags: ['analytics', 'computed']
      })
    }
    
    // Trigger cache warming for critical data
    setTimeout(async () => {
      try {
        await this.warmCache()
      } catch (error) {
        console.error('Failed to warm cache after data update:', error)
      }
    }, 1000) // Delay to avoid immediate re-fetch
  }
}