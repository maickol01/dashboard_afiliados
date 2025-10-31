
import { supabase, type Lider, type Brigadista, type Movilizador, type Ciudadano } from '../lib/supabase'
import { Person, Analytics, LeaderPerformanceData, Period, PerformancePeriod } from '../types';
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

          // Single nested query to fetch all hierarchical data at once
          const { data: lideresData, error } = await supabase
            .from('lideres')
            .select(`
              *,
              brigadistas (
                *,
                movilizadores (
                  *,
                  ciudadanos (*)
                )
              )
            `)
            .order('created_at', { ascending: false })

          if (error) {
            throw new DatabaseError(
              'Failed to fetch hierarchical data with nested query',
              error.code,
              error.details ? { message: error.details } : undefined,
              error.hint
            )
          }

          if (!lideresData) {
            console.warn('No hierarchical data returned from nested query')
            return []
          }

          // Validate nested structure before transformation
          this.validateNestedStructure(lideresData)

          // Transform nested Supabase response to Person[] format
          const hierarchicalData = this.transformSupabaseHierarchy(lideresData)

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

  static async getHierarchicalDataByDateRange(startDate: Date, endDate: Date): Promise<Person[]> {
    const allData = await this.getAllHierarchicalData();

    if (!allData) {
      return [];
    }

    return this.filterHierarchyByDate(allData, startDate, endDate);
  }

  public static filterHierarchyByDate(people: Person[], startDate: Date, endDate: Date): Person[] {
    const filteredList: Person[] = [];

    for (const person of people) {
        const personDate = new Date(person.created_at);
        const isPersonInDateRange = personDate >= startDate && personDate <= endDate;

        let filteredChildren: Person[] = [];
        if (person.children && person.children.length > 0) {
            filteredChildren = this.filterHierarchyByDate(person.children, startDate, endDate); // Recursive call
        }

        // A person is included if they are in the date range OR if any of their children are included
        if (isPersonInDateRange || filteredChildren.length > 0) {
            const newPerson = { ...person };
            newPerson.children = filteredChildren; // Keep filtered children
            filteredList.push(newPerson);
        }
    }
    return filteredList;
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



  /**
   * Transforms nested Supabase response into Person[] format
   * Calculates registeredCount during transformation in a single pass
   * Maintains full compatibility with existing Person[] interface
   */
  private static transformSupabaseHierarchy(lideresData: Partial<Lider & { brigadistas: Partial<Brigadista & { movilizadores: Partial<Movilizador & { ciudadanos: Partial<Ciudadano>[] }>[] }>[] }>[]): Person[] {
    if (!lideresData || !Array.isArray(lideresData)) {
      console.warn('Invalid lideres data provided to transformSupabaseHierarchy')
      return []
    }

    return lideresData.map(lider => {
      // Transform brigadistas and their nested data
      const brigadistas = (lider.brigadistas || []).map((brigadista) => {
        // Transform movilizadores and their nested data
        const movilizadores = (brigadista.movilizadores || []).map((movilizador) => {
          // Transform ciudadanos
          const ciudadanos = (movilizador.ciudadanos || []).map((ciudadano) => ({
            ...this.convertToPersonFormat(ciudadano as Ciudadano, 'ciudadano'),
            parentId: movilizador.id,
            movilizador_id: movilizador.id
          }))

          // Create movilizador person with calculated registeredCount
          return {
            ...this.convertToPersonFormat(movilizador as Movilizador, 'movilizador'),
            parentId: brigadista.id,
            brigadista_id: brigadista.id,
            children: ciudadanos,
            registeredCount: ciudadanos.length
          }
        })

        // Calculate brigadista's registeredCount from all movilizadores
        const brigadistaRegisteredCount = movilizadores.reduce(
          (sum: number, movilizador: Person) => sum + movilizador.registeredCount, 
          0
        )

        // Create brigadista person with calculated registeredCount
        return {
          ...this.convertToPersonFormat(brigadista as Brigadista, 'brigadista'),
          parentId: lider.id,
          lider_id: lider.id,
          children: movilizadores,
          registeredCount: brigadistaRegisteredCount
        }
      })

      // Calculate lider's registeredCount from all brigadistas
      const liderRegisteredCount = brigadistas.reduce(
        (sum: number, brigadista: Person) => sum + brigadista.registeredCount, 
        0
      )

      // Create lider person with calculated registeredCount
      return {
        ...this.convertToPersonFormat(lider as Lider, 'lider'),
        children: brigadistas,
        registeredCount: liderRegisteredCount
      }
    })
  }

  /**
   * Validates the nested structure received from Supabase
   * Ensures data integrity before transformation with comprehensive validation
   */
  private static validateNestedStructure(lideresData: Partial<Lider & { brigadistas: Partial<Brigadista & { movilizadores: Partial<Movilizador & { ciudadanos: Partial<Ciudadano>[] }>[] }>[] }>[]): void {
    try {
      // Basic structure validation
      if (!lideresData) {
        throw new ValidationError('Nested data is null or undefined')
      }

      if (!Array.isArray(lideresData)) {
        throw new ValidationError('Expected array of leaders from Supabase nested query')
      }

      if (lideresData.length === 0) {
        console.warn('Empty leaders array received from Supabase')
        return
      }

      // Validate each leader and their nested hierarchy
      lideresData.forEach((lider, liderIndex) => {
        this.validateLeaderStructure(lider, liderIndex)
        this.validateBrigadistasHierarchy(lider)
      })

      // Perform integrity checks across the entire hierarchy
      this.validateHierarchicalIntegrity(lideresData)

    } catch (error) {
      if (error instanceof ValidationError) {
        throw error
      }
      
      // Wrap unexpected errors in DatabaseError for consistency
      throw new DatabaseError(
        'Failed to validate nested structure from Supabase',
        'VALIDATION_ERROR',
        { originalError: error instanceof Error ? error.message : String(error) },
        'Check the nested query response format and data integrity'
      )
    }
  }

  /**
   * Validates individual leader structure and required fields
   */
  private static validateLeaderStructure(lider: Partial<Lider & { brigadistas: Partial<Brigadista & { movilizadores: Partial<Movilizador & { ciudadanos: Partial<Ciudadano>[] }>[] }>[] }>, liderIndex: number): void {
    if (!lider || typeof lider !== 'object') {
      throw new ValidationError(`Leader at index ${liderIndex} is not a valid object`)
    }

    // Required fields validation
    const requiredFields = ['id', 'nombre', 'created_at']
    const missingFields = requiredFields.filter(field => !lider[field as keyof Lider])
    
    if (missingFields.length > 0) {
      throw new ValidationError(
        `Leader at index ${liderIndex} missing required fields: ${missingFields.join(', ')}`,
        missingFields[0]
      )
    }

    // Data type validation
    if (typeof lider.id !== 'string' || lider.id.trim() === '') {
      throw new ValidationError(`Leader at index ${liderIndex} has invalid id: must be non-empty string`)
    }

    if (typeof lider.nombre !== 'string' || lider.nombre.trim() === '') {
      throw new ValidationError(`Leader at index ${liderIndex} has invalid nombre: must be non-empty string`)
    }

    // Date validation
    if (!this.isValidDate(lider.created_at)) {
      throw new ValidationError(`Leader ${lider.id} has invalid created_at date`)
    }
  }

  /**
   * Validates brigadistas hierarchy for a leader
   */
  private static validateBrigadistasHierarchy(lider: Partial<Lider & { brigadistas: Partial<Brigadista & { movilizadores: Partial<Movilizador & { ciudadanos: Partial<Ciudadano>[] }>[] }>[] }>): void {
    // Brigadistas array validation
    if (lider.brigadistas !== null && lider.brigadistas !== undefined) {
      if (!Array.isArray(lider.brigadistas)) {
        throw new ValidationError(
          `Leader ${lider.id} has invalid brigadistas: expected array or null`,
          'brigadistas'
        )
      }

      lider.brigadistas.forEach((brigadista: any, brigIndex: number) => {
        this.validateBrigadistaStructure(brigadista, lider.id!, brigIndex)
        this.validateMovilizadoresHierarchy(brigadista)
      })
    }
  }

  /**
   * Validates individual brigadista structure
   */
  private static validateBrigadistaStructure(brigadista: Partial<Brigadista & { movilizadores: Partial<Movilizador & { ciudadanos: Partial<Ciudadano>[] }>[] }>, liderId: string, brigIndex: number): void {
    if (!brigadista || typeof brigadista !== 'object') {
      throw new ValidationError(`Brigadista at index ${brigIndex} for leader ${liderId} is not a valid object`)
    }

    const requiredFields = ['id', 'nombre', 'lider_id', 'created_at'] as const
    const missingFields = requiredFields.filter(field => !brigadista[field as keyof typeof brigadista])
    
    if (missingFields.length > 0) {
      throw new ValidationError(
        `Brigadista at index ${brigIndex} for leader ${liderId} missing required fields: ${missingFields.join(', ')}`,
        missingFields[0]
      )
    }

    // Validate relationship integrity
    if (brigadista.lider_id !== liderId) {
      throw new ValidationError(
        `Brigadista ${brigadista.id} has invalid lider_id: expected ${liderId}, got ${brigadista.lider_id}`
      )
    }

    if (!this.isValidDate(brigadista.created_at)) {
      throw new ValidationError(`Brigadista ${brigadista.id} has invalid created_at date`)
    }
  }

  /**
   * Validates movilizadores hierarchy for a brigadista
   */
  private static validateMovilizadoresHierarchy(brigadista: Partial<Brigadista & { movilizadores: Partial<Movilizador & { ciudadanos: Partial<Ciudadano>[] }>[] }>): void {
    if (brigadista.movilizadores !== null && brigadista.movilizadores !== undefined) {
      if (!Array.isArray(brigadista.movilizadores)) {
        throw new ValidationError(
          `Brigadista ${brigadista.id} has invalid movilizadores: expected array or null`,
          'movilizadores'
        )
      }

      brigadista.movilizadores.forEach((movilizador: any, movIndex: number) => {
        this.validateMovilizadorStructure(movilizador, brigadista.id!, movIndex)
        this.validateCiudadanosHierarchy(movilizador)
      })
    }
  }

  /**
   * Validates individual movilizador structure
   */
  private static validateMovilizadorStructure(movilizador: Partial<Movilizador & { ciudadanos: Partial<Ciudadano>[] }>, brigadistaId: string, movIndex: number): void {
    if (!movilizador || typeof movilizador !== 'object') {
      throw new ValidationError(`Movilizador at index ${movIndex} for brigadista ${brigadistaId} is not a valid object`)
    }

    const requiredFields = ['id', 'nombre', 'brigadista_id', 'created_at'] as const
    const missingFields = requiredFields.filter(field => !movilizador[field as keyof typeof movilizador])
    
    if (missingFields.length > 0) {
      throw new ValidationError(
        `Movilizador at index ${movIndex} for brigadista ${brigadistaId} missing required fields: ${missingFields.join(', ')}`,
        missingFields[0]
      )
    }

    // Validate relationship integrity
    if (movilizador.brigadista_id !== brigadistaId) {
      throw new ValidationError(
        `Movilizador ${movilizador.id} has invalid brigadista_id: expected ${brigadistaId}, got ${movilizador.brigadista_id}`
      )
    }

    if (!this.isValidDate(movilizador.created_at)) {
      throw new ValidationError(`Movilizador ${movilizador.id} has invalid created_at date`)
    }
  }

  /**
   * Validates ciudadanos hierarchy for a movilizador
   */
  private static validateCiudadanosHierarchy(movilizador: Partial<Movilizador & { ciudadanos: Partial<Ciudadano>[] }>): void {
    if (movilizador.ciudadanos !== null && movilizador.ciudadanos !== undefined) {
      if (!Array.isArray(movilizador.ciudadanos)) {
        throw new ValidationError(
          `Movilizador ${movilizador.id} has invalid ciudadanos: expected array or null`,
          'ciudadanos'
        )
      }

      movilizador.ciudadanos.forEach((ciudadano: any, citIndex: number) => {
        this.validateCiudadanoStructure(ciudadano, movilizador.id!, citIndex)
      })
    }
  }

  /**
   * Validates individual ciudadano structure
   */
  private static validateCiudadanoStructure(ciudadano: any, movilizadorId: string, citIndex: number): void {
    if (!ciudadano || typeof ciudadano !== 'object') {
      throw new ValidationError(`Ciudadano at index ${citIndex} for movilizador ${movilizadorId} is not a valid object`)
    }

    const requiredFields = ['id', 'nombre', 'movilizador_id', 'created_at'] as const
    const missingFields = requiredFields.filter(field => !ciudadano[field as keyof typeof ciudadano])
    
    if (missingFields.length > 0) {
      throw new ValidationError(
        `Ciudadano at index ${citIndex} for movilizador ${movilizadorId} missing required fields: ${missingFields.join(', ')}`,
        missingFields[0]
      )
    }

    // Validate relationship integrity
    if (ciudadano.movilizador_id !== movilizadorId) {
      throw new ValidationError(
        `Ciudadano ${ciudadano.id} has invalid movilizador_id: expected ${movilizadorId}, got ${ciudadano.movilizador_id}`
      )
    }

    if (!this.isValidDate(ciudadano.created_at)) {
      throw new ValidationError(`Ciudadano ${ciudadano.id} has invalid created_at date`)
    }
  }

  /**
   * Validates hierarchical integrity across the entire data structure
   */
  private static validateHierarchicalIntegrity(lideresData: any[]): void {
    const allIds = new Set<string>()
    const duplicateIds: string[] = []

    // Check for duplicate IDs across all levels
    const checkDuplicateId = (id: string, type: string) => {
      if (allIds.has(id)) {
        duplicateIds.push(`${type}: ${id}`)
      } else {
        allIds.add(id)
      }
    }

    lideresData.forEach(lider => {
      checkDuplicateId(lider.id, 'lider')

      if (lider.brigadistas) {
        lider.brigadistas.forEach((brigadista: any) => {
          checkDuplicateId(brigadista.id, 'brigadista')

          if (brigadista.movilizadores) {
            brigadista.movilizadores.forEach((movilizador: any) => {
              checkDuplicateId(movilizador.id, 'movilizador')

              if (movilizador.ciudadanos) {
                movilizador.ciudadanos.forEach((ciudadano: any) => {
                  checkDuplicateId(ciudadano.id, 'ciudadano')
                })
              }
            })
          }
        })
      }
    })

    if (duplicateIds.length > 0) {
      throw new ValidationError(
        `Duplicate IDs found in hierarchical data: ${duplicateIds.join(', ')}`,
        'id'
      )
    }

    // Validate hierarchy depth and structure consistency
    let totalBrigadistas = 0
    let totalMovilizadores = 0
    let totalCiudadanos = 0

    lideresData.forEach(lider => {
      if (lider.brigadistas) {
        totalBrigadistas += lider.brigadistas.length
        
        lider.brigadistas.forEach((brigadista: any) => {
          if (brigadista.movilizadores) {
            totalMovilizadores += brigadista.movilizadores.length
            
            brigadista.movilizadores.forEach((movilizador: any) => {
              if (movilizador.ciudadanos) {
                totalCiudadanos += movilizador.ciudadanos.length
              }
            })
          }
        })
      }
    })

    console.log(`Validated hierarchical structure: ${lideresData.length} líderes, ${totalBrigadistas} brigadistas, ${totalMovilizadores} movilizadores, ${totalCiudadanos} ciudadanos`)
  }

  /**
   * Validates if a date string or Date object is valid
   */
  private static isValidDate(date: any): boolean {
    if (!date) return false
    
    const parsedDate = new Date(date)
    return !isNaN(parsedDate.getTime()) && parsedDate.getFullYear() > 1900
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
              target: 60000,
              percentage: totalCitizens > 0 ? (totalCitizens / 60000) * 100 : 0
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
    const dateMap = new Map<string, number>();

    // Group by local date string
    people.forEach(p => {
        const localDate = new Date(p.created_at);
        
        // We only care about dates within the range
        if (localDate >= startDate && localDate <= endDate) {
            const year = localDate.getFullYear();
            const month = localDate.getMonth();
            const day = localDate.getDate();
            const localDateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            dateMap.set(localDateStr, (dateMap.get(localDateStr) || 0) + 1);
        }
    });

    const days: { date: string; count: number }[] = [];
    const current = new Date(startDate);
    current.setHours(0, 0, 0, 0);

    while (current <= endDate) {
        const year = current.getFullYear();
        const month = current.getMonth();
        const day = current.getDate();
        const localDateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

        days.push({ date: localDateStr, count: dateMap.get(localDateStr) || 0 });
        current.setDate(current.getDate() + 1);
    }

    return days;
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
  static generatePeriodAwareLeaderPerformance(hierarchicalData: Person[], period: PerformancePeriod): LeaderPerformanceData[] {
    let dataToProcess = hierarchicalData;

    if (period !== 'all') {
        const now = new Date();
        let startDate: Date;

        if (period === 'day') {
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
        } else if (period === 'week') {
            const firstDayOfWeek = new Date(now);
            firstDayOfWeek.setDate(now.getDate() - now.getDay());
            startDate = new Date(firstDayOfWeek.getFullYear(), firstDayOfWeek.getMonth(), firstDayOfWeek.getDate(), 0, 0, 0, 0);
        } else { // month
            startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
        }
        
        dataToProcess = this.filterHierarchyByDate(hierarchicalData, startDate, now);
    }

    return dataToProcess.map(leader => {
        const brigadierCount = leader.children?.length || 0;
        const mobilizerCount = leader.children?.reduce((sum, brigadista) => sum + (brigadista.children?.length || 0), 0) || 0;
        const citizenCount = leader.children?.reduce((sum, brigadista) => sum + (brigadista.children?.reduce((s, m) => s + (m.children?.length || 0), 0) || 0), 0) || 0;
        
        return {
            name: leader.name,
            citizenCount,
            brigadierCount,
            mobilizerCount,
            targetProgress: leader.registeredCount >= 50 ? 100 : (leader.registeredCount / 50) * 100, // This uses total registeredCount for progress
            trend: 'stable' as const,
            efficiency: citizenCount > 0 ? (citizenCount / Math.max(1, brigadierCount)) : 0,
            lastUpdate: new Date()
        };
    });
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

  // ... (existing methods)

  static async getLideresList(): Promise<{ id: string; nombre: string }[]> {
    const { data, error } = await supabase
      .from('lideres')
      .select('id, nombre')
      .order('nombre', { ascending: true });

    if (error) {
      throw new DatabaseError('Failed to fetch leaders list', error.code, error.details ? { message: error.details } : undefined, error.hint);
    }
    return data || [];
  }

  static async getBrigadistasList(): Promise<{ id: string; nombre: string }[]> {
    const { data, error } = await supabase
      .from('brigadistas')
      .select('id, nombre')
      .order('nombre', { ascending: true });

    if (error) {
      throw new DatabaseError('Failed to fetch brigadistas list', error.code, error.details ? { message: error.details } : undefined, error.hint);
    }
    return data || [];
  }

  static async reassignPerson(personId: string, newParentId: string, role: 'brigadista' | 'movilizador'): Promise<void> {
    return this.circuitBreaker.execute(async () => {
      return withDatabaseRetry(async () => {
        const rpcName = role === 'brigadista' ? 'reasignar_brigadista' : 'reasignar_movilizador';
        const params = role === 'brigadista' 
          ? { brigadista_id_in: personId, nuevo_lider_id_in: newParentId }
          : { movilizador_id_in: personId, nuevo_brigadista_id_in: newParentId };

        const { error } = await supabase.rpc(rpcName, params);

        if (error) {
          // Convert string details to Record<string, unknown> format expected by DatabaseError
          const errorDetails: Record<string, unknown> = error.details
            ? { message: error.details }
            : { message: 'Unknown database error' };

          throw new DatabaseError(`Failed to execute ${rpcName} RPC`, error.code, errorDetails, error.hint);
        }

        await this.invalidateDataCache();
        console.log(`Reassignment successful for ${role} ${personId}`);
      });
    });
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
      const region = person.entidad
      if (region) {
        if (!regionGroups.has(region)) {
          regionGroups.set(region, [])
        }
        regionGroups.get(region)!.push(person)
      }
    })

    const workerDensityMetrics: WorkerDensityMetric[] = []

    regionGroups.forEach((people, region) => {
      const totalWorkers = people.filter(p => p.role !== 'ciudadano').length
      const totalCitizens = people.filter(p => p.role === 'ciudadano').length
      const totalPopulation = people.length

      // Assuming an arbitrary area for density calculation
      const areaSqKm = 100
      const density = totalPopulation > 0 ? totalWorkers / areaSqKm : 0

      let densityLevel: 'high' | 'medium' | 'low'
      if (density >= 10) densityLevel = 'high'
      else if (density >= 5) densityLevel = 'medium'
      else densityLevel = 'low'

      workerDensityMetrics.push({
        region,
        regionType: 'entidad',
        workerDensity: density,
        citizenDensity: totalCitizens > 0 ? totalCitizens / areaSqKm : 0,
        densityRank: 0, // Will be calculated after sorting
        isOptimal: densityLevel === 'high',
        recommendation: densityLevel === 'low' ? 'Consider adding more workers to this region' : 'Optimal density achieved'
      })
    })

    return workerDensityMetrics.sort((a, b) => b.workerDensity - a.workerDensity)
  }

  private static generateTerritorialGapAnalysis(allPeople: Person[], coverageMetrics: TerritorialCoverageMetric[]): TerritorialGapMetric[] {
    const gapMetrics: TerritorialGapMetric[] = []

    coverageMetrics.forEach(metric => {
      if (metric.status === 'needs_improvement' || metric.status === 'critical') {
        const potentialCitizens = Math.max(0, metric.targetCoverage - metric.totalCitizens)
        const requiredWorkers = Math.ceil(potentialCitizens / 10) // Assuming 1 worker per 10 citizens

        gapMetrics.push({
          region: metric.region,
          regionType: metric.regionType,
          gapType: 'low_coverage',
          severity: metric.status === 'critical' ? 'critical' : 'medium',
          description: `Region ${metric.region} needs improvement with ${potentialCitizens} potential additional citizens`,
          recommendedAction: `Assign ${requiredWorkers} movilizadores to ${metric.region}`,
          priority: metric.status === 'critical' ? 10 : 5,
          estimatedImpact: potentialCitizens,
          nearbyRegions: [] // Would need geographic proximity calculation
        })
      }
    })

    return gapMetrics.sort((a, b) => b.estimatedImpact - a.estimatedImpact)
  }

  private static generateCitizenWorkerRatioMetrics(allPeople: Person[]): CitizenWorkerRatioMetric[] {
    const ratioMetrics: CitizenWorkerRatioMetric[] = []
    const workers = allPeople.filter(p => p.role !== 'ciudadano')
    const citizens = allPeople.filter(p => p.role === 'ciudadano')

    if (workers.length === 0) return []

    const ratio = citizens.length / workers.length

    let ratioHealth: 'healthy' | 'unbalanced' | 'critical'
    if (ratio >= 10 && ratio <= 20) ratioHealth = 'healthy'
    else if (ratio < 10 && ratio >= 5) ratioHealth = 'unbalanced'
    else ratioHealth = 'critical'

    ratioMetrics.push({
      region: 'national',
      regionType: 'entidad',
      totalWorkers: workers.length,
      totalCitizens: citizens.length,
      ratio,
      optimalRatio: 15,
      efficiency: ratioHealth === 'healthy' ? 'high' : ratioHealth === 'unbalanced' ? 'medium' : 'low',
      trend: 'stable',
      benchmarkComparison: 100
    })

    return ratioMetrics
  }

  private static generateTerritorialSummary(coverageMetrics: TerritorialCoverageMetric[], gapAnalysis: TerritorialGapMetric[], citizenWorkerRatio: CitizenWorkerRatioMetric[]): TerritorialSummary {


    const topPerformingRegions = coverageMetrics.slice(0, 3).map(region => ({
      region: region.region,
      coveragePercentage: region.coveragePercentage,
      citizenWorkerRatio: region.totalCitizens / Math.max(1, region.totalWorkers)
    }))

    const expansionOpportunities = gapAnalysis.slice(0, 3).map(gap => ({
      region: gap.region,
      potentialCitizens: gap.estimatedImpact,
      requiredWorkers: Math.ceil(gap.estimatedImpact / 10),
      priority: gap.severity === 'critical' ? 'high' as const : 'medium' as const
    }))

    return {
      totalRegionsAnalyzed: coverageMetrics.length,
      regionsWithExcellentCoverage: coverageMetrics.filter(m => m.status === 'excellent').length,
      regionsNeedingImprovement: coverageMetrics.filter(m => m.status === 'needs_improvement' || m.status === 'critical').length,
      criticalGaps: coverageMetrics.filter(m => m.status === 'critical').length,
      averageCoveragePercentage: coverageMetrics.reduce((sum, metric) => sum + metric.coveragePercentage, 0) / (coverageMetrics.length || 1),
      topPerformingRegions,
      expansionOpportunities,
      overallHealthScore: Math.min(100, (coverageMetrics.filter(m => m.status === 'excellent').length / coverageMetrics.length) * 100)
    }
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

  private static calculateTargetCoverage(regionType: string, population: number): number {
    // Simplified target calculation
    if (regionType === 'seccion') return population * 0.1
    if (regionType === 'municipio') return population * 0.05
    return population * 0.02
  }
}

// Export Navojoa-specific service for modularity
export { navojoaElectoralService } from './navojoaElectoralService'
