import { Person, Analytics } from '../types'
import { Lider, Brigadista, Movilizador, Ciudadano } from '../lib/supabase'

// Mock database records
export const mockLideres: Lider[] = [
  {
    id: 'lider-1',
    nombre: 'Juan Pérez',
    clave_electoral: 'PERJ850101',
    curp: 'PERJ850101HDFRNN01',
    direccion: 'Calle Principal 123',
    colonia: 'Centro',
    codigo_postal: '12345',
    seccion: '001',
    entidad: 'Ciudad de México',
    municipio: 'Cuauhtémoc',
    numero_cel: '5551234567',
    num_verificado: true,
    verification_token: 'token1',
    created_at: '2024-01-01T10:00:00.000Z'
  },
  {
    id: 'lider-2',
    nombre: 'María González',
    clave_electoral: 'GONM900215',
    curp: 'GONM900215MDFRNR02',
    direccion: 'Avenida Reforma 456',
    colonia: 'Roma Norte',
    codigo_postal: '06700',
    seccion: '002',
    entidad: 'Ciudad de México',
    municipio: 'Cuauhtémoc',
    numero_cel: '5559876543',
    num_verificado: true,
    verification_token: 'token2',
    created_at: '2024-01-02T11:00:00.000Z'
  }
]

export const mockBrigadistas: Brigadista[] = [
  {
    id: 'brigadista-1',
    nombre: 'Carlos López',
    clave_electoral: 'LOPC880310',
    curp: 'LOPC880310HDFLPR03',
    direccion: 'Calle Secundaria 789',
    colonia: 'Doctores',
    codigo_postal: '06720',
    seccion: '003',
    entidad: 'Ciudad de México',
    municipio: 'Cuauhtémoc',
    numero_cel: '5552468135',
    num_verificado: false,
    verification_token: 'token3',
    lider_id: 'lider-1',
    created_at: '2024-01-03T12:00:00.000Z'
  },
  {
    id: 'brigadista-2',
    nombre: 'Ana Martínez',
    clave_electoral: 'MARA920520',
    curp: 'MARA920520MDFRTNN04',
    direccion: 'Boulevard Norte 321',
    colonia: 'Condesa',
    codigo_postal: '06140',
    seccion: '004',
    entidad: 'Ciudad de México',
    municipio: 'Cuauhtémoc',
    numero_cel: '5553691470',
    num_verificado: true,
    verification_token: 'token4',
    lider_id: 'lider-2',
    created_at: '2024-01-04T13:00:00.000Z'
  }
]

export const mockMovilizadores: Movilizador[] = [
  {
    id: 'movilizador-1',
    nombre: 'Pedro Rodríguez',
    clave_electoral: 'RODP750825',
    curp: 'RODP750825HDFRDR05',
    direccion: 'Calle Tercera 654',
    colonia: 'Juárez',
    codigo_postal: '06600',
    seccion: '005',
    entidad: 'Ciudad de México',
    municipio: 'Cuauhtémoc',
    numero_cel: '5554827396',
    num_verificado: true,
    verification_token: 'token5',
    brigadista_id: 'brigadista-1',
    created_at: '2024-01-05T14:00:00.000Z'
  },
  {
    id: 'movilizador-2',
    nombre: 'Laura Sánchez',
    clave_electoral: 'SANL931105',
    curp: 'SANL931105MDFNLR06',
    direccion: 'Avenida Sur 987',
    colonia: 'Del Valle',
    codigo_postal: '03100',
    seccion: '006',
    entidad: 'Ciudad de México',
    municipio: 'Benito Juárez',
    numero_cel: '5555174829',
    num_verificado: false,
    verification_token: 'token6',
    brigadista_id: 'brigadista-2',
    created_at: '2024-01-06T15:00:00.000Z'
  }
]

export const mockCiudadanos: Ciudadano[] = [
  {
    id: 'ciudadano-1',
    nombre: 'Roberto García',
    clave_electoral: 'GARR800412',
    curp: 'GARR800412HDFRRT07',
    direccion: 'Calle Cuarta 147',
    colonia: 'Narvarte',
    codigo_postal: '03020',
    seccion: '007',
    entidad: 'Ciudad de México',
    municipio: 'Benito Juárez',
    numero_cel: '5556283741',
    num_verificado: true,
    verification_token: 'token7',
    movilizador_id: 'movilizador-1',
    created_at: '2024-01-07T16:00:00.000Z'
  },
  {
    id: 'ciudadano-2',
    nombre: 'Elena Hernández',
    clave_electoral: 'HERE860918',
    curp: 'HERE860918MDFRLNN08',
    direccion: 'Calle Quinta 258',
    colonia: 'Portales',
    codigo_postal: '03300',
    seccion: '008',
    entidad: 'Ciudad de México',
    municipio: 'Benito Juárez',
    numero_cel: '5557395162',
    num_verificado: false,
    verification_token: 'token8',
    movilizador_id: 'movilizador-1',
    created_at: '2024-01-08T17:00:00.000Z'
  },
  {
    id: 'ciudadano-3',
    nombre: 'Miguel Torres',
    clave_electoral: 'TORM770630',
    curp: 'TORM770630HDFRRL09',
    direccion: 'Avenida Este 369',
    colonia: 'Xoco',
    codigo_postal: '03330',
    seccion: '009',
    entidad: 'Ciudad de México',
    municipio: 'Benito Juárez',
    numero_cel: '5558406273',
    num_verificado: true,
    verification_token: 'token9',
    movilizador_id: 'movilizador-2',
    created_at: '2024-01-09T18:00:00.000Z'
  }
]

// Mock hierarchical data structure
export const mockHierarchicalData: Person[] = [
  {
    id: 'lider-1',
    name: 'Juan Pérez',
    nombre: 'Juan Pérez',
    role: 'lider',
    created_at: new Date('2024-01-01T10:00:00.000Z'),
    registeredCount: 2,
    isActive: true,
    lastActivity: new Date('2024-01-01T10:00:00.000Z'),
    region: 'Ciudad de México',
    registrationDate: new Date('2024-01-01T10:00:00.000Z'),
    clave_electoral: 'PERJ850101',
    curp: 'PERJ850101HDFRNN01',
    direccion: 'Calle Principal 123',
    colonia: 'Centro',
    codigo_postal: '12345',
    seccion: '001',
    entidad: 'Ciudad de México',
    municipio: 'Cuauhtémoc',
    numero_cel: '5551234567',
    num_verificado: true,
    contactInfo: {
      phone: '5551234567',
      verified: true
    },
    children: [
      {
        id: 'brigadista-1',
        name: 'Carlos López',
        nombre: 'Carlos López',
        role: 'brigadista',
        created_at: new Date('2024-01-03T12:00:00.000Z'),
        registeredCount: 2,
        isActive: true,
        lastActivity: new Date('2024-01-03T12:00:00.000Z'),
        region: 'Ciudad de México',
        registrationDate: new Date('2024-01-03T12:00:00.000Z'),
        parentId: 'lider-1',
        lider_id: 'lider-1',
        clave_electoral: 'LOPC880310',
        curp: 'LOPC880310HDFLPR03',
        direccion: 'Calle Secundaria 789',
        colonia: 'Doctores',
        codigo_postal: '06720',
        seccion: '003',
        entidad: 'Ciudad de México',
        municipio: 'Cuauhtémoc',
        numero_cel: '5552468135',
        num_verificado: false,
        contactInfo: {
          phone: '5552468135',
          verified: false
        },
        children: [
          {
            id: 'movilizador-1',
            name: 'Pedro Rodríguez',
            nombre: 'Pedro Rodríguez',
            role: 'movilizador',
            created_at: new Date('2024-01-05T14:00:00.000Z'),
            registeredCount: 2,
            isActive: true,
            lastActivity: new Date('2024-01-05T14:00:00.000Z'),
            region: 'Ciudad de México',
            registrationDate: new Date('2024-01-05T14:00:00.000Z'),
            parentId: 'brigadista-1',
            brigadista_id: 'brigadista-1',
            clave_electoral: 'RODP750825',
            curp: 'RODP750825HDFRDR05',
            direccion: 'Calle Tercera 654',
            colonia: 'Juárez',
            codigo_postal: '06600',
            seccion: '005',
            entidad: 'Ciudad de México',
            municipio: 'Cuauhtémoc',
            numero_cel: '5554827396',
            num_verificado: true,
            contactInfo: {
              phone: '5554827396',
              verified: true
            },
            children: [
              {
                id: 'ciudadano-1',
                name: 'Roberto García',
                nombre: 'Roberto García',
                role: 'ciudadano',
                created_at: new Date('2024-01-07T16:00:00.000Z'),
                registeredCount: 0,
                isActive: true,
                lastActivity: new Date('2024-01-07T16:00:00.000Z'),
                region: 'Ciudad de México',
                registrationDate: new Date('2024-01-07T16:00:00.000Z'),
                parentId: 'movilizador-1',
                movilizador_id: 'movilizador-1',
                clave_electoral: 'GARR800412',
                curp: 'GARR800412HDFRRT07',
                direccion: 'Calle Cuarta 147',
                colonia: 'Narvarte',
                codigo_postal: '03020',
                seccion: '007',
                entidad: 'Ciudad de México',
                municipio: 'Benito Juárez',
                numero_cel: '5556283741',
                num_verificado: true,
                contactInfo: {
                  phone: '5556283741',
                  verified: true
                }
              },
              {
                id: 'ciudadano-2',
                name: 'Elena Hernández',
                nombre: 'Elena Hernández',
                role: 'ciudadano',
                created_at: new Date('2024-01-08T17:00:00.000Z'),
                registeredCount: 0,
                isActive: true,
                lastActivity: new Date('2024-01-08T17:00:00.000Z'),
                region: 'Ciudad de México',
                registrationDate: new Date('2024-01-08T17:00:00.000Z'),
                parentId: 'movilizador-1',
                movilizador_id: 'movilizador-1',
                clave_electoral: 'HERE860918',
                curp: 'HERE860918MDFRLNN08',
                direccion: 'Calle Quinta 258',
                colonia: 'Portales',
                codigo_postal: '03300',
                seccion: '008',
                entidad: 'Ciudad de México',
                municipio: 'Benito Juárez',
                numero_cel: '5557395162',
                num_verificado: false,
                contactInfo: {
                  phone: '5557395162',
                  verified: false
                }
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: 'lider-2',
    name: 'María González',
    nombre: 'María González',
    role: 'lider',
    created_at: new Date('2024-01-02T11:00:00.000Z'),
    registeredCount: 1,
    isActive: true,
    lastActivity: new Date('2024-01-02T11:00:00.000Z'),
    region: 'Ciudad de México',
    registrationDate: new Date('2024-01-02T11:00:00.000Z'),
    clave_electoral: 'GONM900215',
    curp: 'GONM900215MDFRNR02',
    direccion: 'Avenida Reforma 456',
    colonia: 'Roma Norte',
    codigo_postal: '06700',
    seccion: '002',
    entidad: 'Ciudad de México',
    municipio: 'Cuauhtémoc',
    numero_cel: '5559876543',
    num_verificado: true,
    contactInfo: {
      phone: '5559876543',
      verified: true
    },
    children: [
      {
        id: 'brigadista-2',
        name: 'Ana Martínez',
        nombre: 'Ana Martínez',
        role: 'brigadista',
        created_at: new Date('2024-01-04T13:00:00.000Z'),
        registeredCount: 1,
        isActive: true,
        lastActivity: new Date('2024-01-04T13:00:00.000Z'),
        region: 'Ciudad de México',
        registrationDate: new Date('2024-01-04T13:00:00.000Z'),
        parentId: 'lider-2',
        lider_id: 'lider-2',
        clave_electoral: 'MARA920520',
        curp: 'MARA920520MDFRTNN04',
        direccion: 'Boulevard Norte 321',
        colonia: 'Condesa',
        codigo_postal: '06140',
        seccion: '004',
        entidad: 'Ciudad de México',
        municipio: 'Cuauhtémoc',
        numero_cel: '5553691470',
        num_verificado: true,
        contactInfo: {
          phone: '5553691470',
          verified: true
        },
        children: [
          {
            id: 'movilizador-2',
            name: 'Laura Sánchez',
            nombre: 'Laura Sánchez',
            role: 'movilizador',
            created_at: new Date('2024-01-06T15:00:00.000Z'),
            registeredCount: 1,
            isActive: true,
            lastActivity: new Date('2024-01-06T15:00:00.000Z'),
            region: 'Ciudad de México',
            registrationDate: new Date('2024-01-06T15:00:00.000Z'),
            parentId: 'brigadista-2',
            brigadista_id: 'brigadista-2',
            clave_electoral: 'SANL931105',
            curp: 'SANL931105MDFNLR06',
            direccion: 'Avenida Sur 987',
            colonia: 'Del Valle',
            codigo_postal: '03100',
            seccion: '006',
            entidad: 'Ciudad de México',
            municipio: 'Benito Juárez',
            numero_cel: '5555174829',
            num_verificado: false,
            contactInfo: {
              phone: '5555174829',
              verified: false
            },
            children: [
              {
                id: 'ciudadano-3',
                name: 'Miguel Torres',
                nombre: 'Miguel Torres',
                role: 'ciudadano',
                created_at: new Date('2024-01-09T18:00:00.000Z'),
                registeredCount: 0,
                isActive: true,
                lastActivity: new Date('2024-01-09T18:00:00.000Z'),
                region: 'Ciudad de México',
                registrationDate: new Date('2024-01-09T18:00:00.000Z'),
                parentId: 'movilizador-2',
                movilizador_id: 'movilizador-2',
                clave_electoral: 'TORM770630',
                curp: 'TORM770630HDFRRL09',
                direccion: 'Avenida Este 369',
                colonia: 'Xoco',
                codigo_postal: '03330',
                seccion: '009',
                entidad: 'Ciudad de México',
                municipio: 'Benito Juárez',
                numero_cel: '5558406273',
                num_verificado: true,
                contactInfo: {
                  phone: '5558406273',
                  verified: true
                }
              }
            ]
          }
        ]
      }
    ]
  }
]

// Mock analytics data
export const mockAnalytics: Analytics = {
  totalLideres: 2,
  totalBrigadistas: 2,
  totalMobilizers: 2,
  totalCitizens: 3,
  dailyRegistrations: [
    { date: '2024-01-01', count: 1 },
    { date: '2024-01-02', count: 1 },
    { date: '2024-01-03', count: 1 },
    { date: '2024-01-04', count: 1 },
    { date: '2024-01-05', count: 1 },
    { date: '2024-01-06', count: 1 },
    { date: '2024-01-07', count: 1 },
    { date: '2024-01-08', count: 1 },
    { date: '2024-01-09', count: 1 }
  ],
  weeklyRegistrations: [
    { date: 'Semana 1', count: 7 },
    { date: 'Semana 2', count: 2 }
  ],
  monthlyRegistrations: [
    { date: 'enero', count: 9 }
  ],
  leaderPerformance: [
    { name: 'Juan Pérez', registered: 2 },
    { name: 'María González', registered: 1 }
  ],
  conversionRate: 66.67, // 2 out of 3 citizens verified
  growthRate: 0,
  efficiency: {
    conversionByLeader: [
      { leaderId: 'lider-1', name: 'Juan Pérez', rate: 200, target: 50 },
      { leaderId: 'lider-2', name: 'María González', rate: 100, target: 50 }
    ],
    productivityByBrigadier: [
      { brigadierId: 'brigadista-1', name: 'Carlos López', avgCitizens: 2 },
      { brigadierId: 'brigadista-2', name: 'Ana Martínez', avgCitizens: 1 }
    ],
    topPerformers: [
      { id: 'lider-1', name: 'Juan Pérez', role: 'lider', score: 2 },
      { id: 'lider-2', name: 'María González', role: 'lider', score: 1 }
    ],
    needsSupport: [],
    registrationSpeed: { average: 1, fastest: 1, slowest: 1 }
  },
  geographic: {
    regionDistribution: [
      { region: 'Ciudad de México', count: 3, percentage: 100 }
    ],
    heatmapData: [
      { region: 'Ciudad de México', intensity: 3 }
    ],
    territorialCoverage: [
      { region: 'Ciudad de México', coverage: 100, target: 20 }
    ]
  },
  temporal: {
    hourlyPatterns: [],
    weeklyPatterns: [],
    seasonality: [
      { month: 'enero', registrations: 9, trend: 'stable' }
    ],
    projections: []
  },
  quality: {
    dataCompleteness: 100,
    duplicateRate: 0,
    verificationRate: 66.67,
    postRegistrationActivity: 100
  },
  goals: {
    overallProgress: { current: 3, target: 5000, percentage: 0.06 },
    individualGoals: [
      { id: 'lider-1', name: 'Juan Pérez', current: 2, target: 50, status: 'behind' },
      { id: 'lider-2', name: 'María González', current: 1, target: 50, status: 'behind' }
    ],
    milestones: [
      { date: '2024-03-31', description: 'Meta Q1: 1,250 ciudadanos', completed: false, target: 1250 },
      { date: '2024-06-30', description: 'Meta Q2: 2,500 ciudadanos', completed: false, target: 2500 },
      { date: '2024-09-30', description: 'Meta Q3: 3,750 ciudadanos', completed: false, target: 3750 },
      { date: '2024-12-31', description: 'Meta Anual: 5,000 ciudadanos', completed: false, target: 5000 }
    ]
  },
  alerts: {
    critical: [],
    warnings: [],
    achievements: []
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