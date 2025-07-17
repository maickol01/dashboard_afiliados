import { supabase, type Lider, type Brigadista, type Movilizador, type Ciudadano } from '../lib/supabase'
import { Person, Analytics } from '../types'

export class DataService {
  static async getAllHierarchicalData(): Promise<Person[]> {
    try {
      // Obtener todos los datos en paralelo
      const [lideresResult, brigadistasResult, movilizadoresResult, ciudadanosResult] = await Promise.all([
        supabase.from('lideres').select('*').order('created_at', { ascending: false }),
        supabase.from('brigadistas').select('*').order('created_at', { ascending: false }),
        supabase.from('movilizadores').select('*').order('created_at', { ascending: false }),
        supabase.from('ciudadanos').select('*').order('created_at', { ascending: false })
      ])

      // Verificar errores
      if (lideresResult.error) throw lideresResult.error
      if (brigadistasResult.error) throw brigadistasResult.error
      if (movilizadoresResult.error) throw movilizadoresResult.error
      if (ciudadanosResult.error) throw ciudadanosResult.error

      const lideres = lideresResult.data || []
      const brigadistas = brigadistasResult.data || []
      const movilizadores = movilizadoresResult.data || []
      const ciudadanos = ciudadanosResult.data || []

      // Construir la jerarquía
      return this.buildHierarchy(lideres, brigadistas, movilizadores, ciudadanos)
    } catch (error) {
      console.error('Error fetching hierarchical data:', error)
      throw error
    }
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
      verification_token: dbRecord.verification_token || undefined,

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

  static async generateAnalyticsFromData(hierarchicalData: Person[]): Promise<Analytics> {
    try {
      // Obtener todas las personas de forma plana
      const allPeople = this.getAllPeopleFlat(hierarchicalData)
      
      // Conteos por rol
      const totalLideres = hierarchicalData.length
      const totalBrigadistas = allPeople.filter(p => p.role === 'brigadista').length
      const totalMobilizers = allPeople.filter(p => p.role === 'movilizador').length
      const totalCitizens = allPeople.filter(p => p.role === 'ciudadano').length

      // Análisis temporal basado en created_at
      const now = new Date()
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      
      // Registros por día (últimos 30 días)
      const dailyRegistrations = this.generateDailyRegistrations(allPeople, thirtyDaysAgo, now)
      
      // Registros por semana (últimas 12 semanas)
      const weeklyRegistrations = this.generateWeeklyRegistrations(allPeople)
      
      // Registros por mes (últimos 12 meses)
      const monthlyRegistrations = this.generateMonthlyRegistrations(allPeople)

      // Rendimiento de líderes
      const leaderPerformance = hierarchicalData.map(leader => ({
        name: leader.name,
        registered: leader.registeredCount
      }))

      // Análisis geográfico
      const regionCounts = this.calculateRegionDistribution(allPeople)
      
      // Métricas de calidad
      const verifiedCount = allPeople.filter(p => p.num_verificado).length
      const dataCompleteness = this.calculateDataCompleteness(allPeople)

      return {
        totalLideres,
        totalBrigadistas,
        totalMobilizers,
        totalCitizens,
        dailyRegistrations,
        weeklyRegistrations,
        monthlyRegistrations,
        leaderPerformance,
        conversionRate: totalCitizens > 0 ? (verifiedCount / totalCitizens) * 100 : 0,
        growthRate: this.calculateGrowthRate(allPeople),
        
        efficiency: {
          conversionByLeader: hierarchicalData.map(leader => ({
            leaderId: leader.id,
            name: leader.name,
            rate: leader.registeredCount > 0 ? (leader.registeredCount / (leader.children?.length || 1)) * 100 : 0,
            target: 50
          })),
          productivityByBrigadier: allPeople
            .filter(p => p.role === 'brigadista')
            .map(brigadista => ({
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
          registrationSpeed: {
            average: 2.5,
            fastest: 0.5,
            slowest: 7.2
          }
        },

        geographic: {
          regionDistribution: Object.entries(regionCounts).map(([region, count]) => ({
            region,
            count,
            percentage: totalCitizens > 0 ? (count / totalCitizens) * 100 : 0
          })),
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
          hourlyPatterns: Array.from({ length: 24 }, (_, hour) => ({
            hour,
            registrations: Math.floor(Math.random() * 10) + 1
          })),
          weeklyPatterns: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(day => ({
            day,
            registrations: Math.floor(Math.random() * 50) + 10
          })),
          seasonality: monthlyRegistrations.map(month => ({
            month: month.date,
            registrations: month.count,
            trend: 'stable' as const
          })),
          projections: Array.from({ length: 30 }, (_, i) => ({
            date: new Date(now.getTime() + i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            projected: Math.floor(Math.random() * 25) + 10,
            confidence: Math.random() * 40 + 60
          }))
        },

        quality: {
          dataCompleteness,
          duplicateRate: 0,
          verificationRate: totalCitizens > 0 ? (verifiedCount / totalCitizens) * 100 : 0,
          postRegistrationActivity: 85
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
          churnRisk: [],
          resourceOptimization: [
            { area: 'Capacitación', recommendation: 'Programa de mentoring para nuevos líderes', impact: 40 }
          ],
          patterns: [
            { pattern: 'Líderes activos tienen mejor rendimiento', confidence: 85, description: 'Mantener comunicación regular' }
          ]
        }
      }
    } catch (error) {
      console.error('Error generating analytics:', error)
      throw error
    }
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
}