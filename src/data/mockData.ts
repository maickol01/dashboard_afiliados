import { Person, Analytics } from '../types';

// Regiones disponibles
const regions = ['Norte', 'Sur', 'Este', 'Oeste', 'Centro'];

// Generar datos simulados más completos
export const generateMockData = (): Person[] => {
  const data: Person[] = [];
  let personId = 1;

  // Generar 10 líderes
  for (let i = 0; i < 10; i++) {
    const leader: Person = {
      id: `L${personId.toString().padStart(3, '0')}`,
      name: `Líder ${i + 1}`,
      nombre: `Líder ${i + 1}`,
      role: 'lider',
      created_at: new Date(2024, 0, Math.floor(Math.random() * 365)),
      children: [],
      registeredCount: 0,
      isActive: Math.random() > 0.1, // 90% activos
      lastActivity: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
      entidad: regions[Math.floor(Math.random() * regions.length)],
      clave_electoral: `CL${Math.floor(Math.random() * 100000).toString().padStart(5, '0')}`,
      curp: `CURP${Math.floor(Math.random() * 1000000).toString().padStart(6, '0')}`,
      direccion: `Calle ${i + 1} #${Math.floor(Math.random() * 100)}`,
      colonia: `Colonia ${i + 1}`,
      codigo_postal: `${Math.floor(Math.random() * 90000) + 10000}`,
      seccion: `${Math.floor(Math.random() * 9000) + 1000}`,
      municipio: `Municipio ${i + 1}`,
      numero_cel: `+52-555-${Math.floor(Math.random() * 9000) + 1000}`,
      num_verificado: Math.random() > 0.2,
      contactInfo: {
        phone: `+52-555-${Math.floor(Math.random() * 9000) + 1000}`,
        email: `leader${i + 1}@example.com`,
        verified: Math.random() > 0.2, // 80% verificados
      },
      performance: {
        weeklyAverage: Math.floor(Math.random() * 20) + 5,
        monthlyGoal: Math.floor(Math.random() * 50) + 30,
        achievementRate: Math.random() * 100,
      },
    };
    
    // Cada líder tiene 10 brigadistas
    for (let j = 0; j < 10; j++) {
      personId++;
      const brigadier: Person = {
        id: `B${personId.toString().padStart(3, '0')}`,
        name: `Brigadista ${j + 1}`,
        nombre: `Brigadista ${j + 1}`,
        role: 'brigadista',
        created_at: new Date(2024, 0, Math.floor(Math.random() * 365)),
        parentId: leader.id,
        lider_id: leader.id,
        children: [],
        registeredCount: 0,
        isActive: Math.random() > 0.15, // 85% activos
        lastActivity: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
        entidad: leader.entidad,
        clave_electoral: `CB${Math.floor(Math.random() * 100000).toString().padStart(5, '0')}`,
        curp: `CURP${Math.floor(Math.random() * 1000000).toString().padStart(6, '0')}`,
        direccion: `Calle ${j + 1} #${Math.floor(Math.random() * 100)}`,
        colonia: leader.colonia,
        codigo_postal: leader.codigo_postal,
        seccion: leader.seccion,
        municipio: leader.municipio,
        numero_cel: `+52-555-${Math.floor(Math.random() * 9000) + 1000}`,
        num_verificado: Math.random() > 0.25,
        contactInfo: {
          phone: `+52-555-${Math.floor(Math.random() * 9000) + 1000}`,
          email: `brigadier${j + 1}@example.com`,
          verified: Math.random() > 0.25, // 75% verificados
        },
        performance: {
          weeklyAverage: Math.floor(Math.random() * 10) + 2,
          monthlyGoal: Math.floor(Math.random() * 25) + 10,
          achievementRate: Math.random() * 100,
        },
      };
      
      // Cada brigadista tiene 1 movilizador
      personId++;
      const mobilizer: Person = {
        id: `M${personId.toString().padStart(3, '0')}`,
        name: `Movilizador ${j + 1}`,
        nombre: `Movilizador ${j + 1}`,
        role: 'movilizador',
        created_at: new Date(2024, 0, Math.floor(Math.random() * 365)),
        parentId: brigadier.id,
        brigadista_id: brigadier.id,
        children: [],
        registeredCount: 0,
        isActive: Math.random() > 0.2, // 80% activos
        lastActivity: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
        entidad: leader.entidad,
        clave_electoral: `CM${Math.floor(Math.random() * 100000).toString().padStart(5, '0')}`,
        curp: `CURP${Math.floor(Math.random() * 1000000).toString().padStart(6, '0')}`,
        direccion: `Calle ${j + 1} #${Math.floor(Math.random() * 100)}`,
        colonia: leader.colonia,
        codigo_postal: leader.codigo_postal,
        seccion: leader.seccion,
        municipio: leader.municipio,
        numero_cel: `+52-555-${Math.floor(Math.random() * 9000) + 1000}`,
        num_verificado: Math.random() > 0.3,
        contactInfo: {
          phone: `+52-555-${Math.floor(Math.random() * 9000) + 1000}`,
          email: `mobilizer${j + 1}@example.com`,
          verified: Math.random() > 0.3, // 70% verificados
        },
        performance: {
          weeklyAverage: Math.floor(Math.random() * 5) + 1,
          monthlyGoal: Math.floor(Math.random() * 15) + 5,
          achievementRate: Math.random() * 100,
        },
      };
      
      // Cada movilizador tiene 3 ciudadanos
      for (let k = 0; k < 3; k++) {
        personId++;
        const citizen: Person = {
          id: `C${personId.toString().padStart(3, '0')}`,
          name: `Ciudadano ${k + 1}`,
          nombre: `Ciudadano ${k + 1}`,
          role: 'ciudadano',
          created_at: new Date(2024, 0, Math.floor(Math.random() * 365)),
          parentId: mobilizer.id,
          movilizador_id: mobilizer.id,
          registeredCount: 0,
          isActive: Math.random() > 0.05, // 95% activos
          lastActivity: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
          entidad: leader.entidad,
          clave_electoral: `CC${Math.floor(Math.random() * 100000).toString().padStart(5, '0')}`,
          curp: `CURP${Math.floor(Math.random() * 1000000).toString().padStart(6, '0')}`,
          direccion: `Calle ${k + 1} #${Math.floor(Math.random() * 100)}`,
          colonia: leader.colonia,
          codigo_postal: leader.codigo_postal,
          seccion: leader.seccion,
          municipio: leader.municipio,
          numero_cel: `+52-555-${Math.floor(Math.random() * 9000) + 1000}`,
          num_verificado: Math.random() > 0.4,
          contactInfo: {
            phone: `+52-555-${Math.floor(Math.random() * 9000) + 1000}`,
            email: `citizen${k + 1}@example.com`,
            verified: Math.random() > 0.4, // 60% verificados
          },
        };
        
        mobilizer.children!.push(citizen);
        mobilizer.registeredCount++;
      }
      
      brigadier.children!.push(mobilizer);
      brigadier.registeredCount += mobilizer.registeredCount;
      
      leader.children!.push(brigadier);
    }
    
    // Calcular total registrados por líder
    leader.registeredCount = leader.children!.reduce((sum, brigadier) => 
      sum + brigadier.registeredCount, 0
    );
    
    data.push(leader);
    personId++;
  }

  return data;
};

export const generateAnalytics = (data: Person[]): Analytics => {
  const totalLideres = data.length;
  const totalBrigadistas = data.reduce((sum, leader) => sum + leader.children!.length, 0);
  const totalMobilizers = data.reduce((sum, leader) => 
    sum + leader.children!.reduce((bSum, brigadier) => bSum + brigadier.children!.length, 0), 0
  );
  const totalCitizens = data.reduce((sum, leader) => 
    sum + leader.children!.reduce((bSum, brigadier) => 
      bSum + brigadier.children!.reduce((mSum, mobilizer) => mSum + mobilizer.children!.length, 0), 0
    ), 0
  );

  // Generar datos de registros por período
  const dailyRegistrations = Array.from({ length: 30 }, (_, i) => ({
    date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    count: Math.floor(Math.random() * 20) + 5,
  })).reverse();

  const weeklyRegistrations = Array.from({ length: 12 }, (_, i) => ({
    date: `Semana ${i + 1}`,
    count: Math.floor(Math.random() * 80) + 20,
  }));

  const monthlyRegistrations = Array.from({ length: 12 }, (_, i) => ({
    date: new Date(2024, i, 1).toLocaleDateString('es-ES', { month: 'long' }),
    count: Math.floor(Math.random() * 200) + 50,
  }));

  const leaderPerformance = data.map(leader => ({
    name: leader.name,
    registered: leader.registeredCount,
  }));

  // Obtener todas las personas de forma plana
  const getAllPeople = (people: Person[]): Person[] => {
    const result: Person[] = [];
    const flatten = (persons: Person[]) => {
      persons.forEach(person => {
        result.push(person);
        if (person.children && person.children.length > 0) {
          flatten(person.children);
        }
      });
    };
    flatten(people);
    return result;
  };

  const allPeople = getAllPeople(data);

  // Métricas de eficiencia
  const efficiency = {
    conversionByLeader: data.map(leader => ({
      leaderId: leader.id,
      name: leader.name,
      rate: leader.performance?.achievementRate || 0,
      target: leader.performance?.monthlyGoal || 0,
    })),
    productivityByBrigadier: allPeople
      .filter(p => p.role === 'brigadier')
      .map(brigadier => ({
        brigadierId: brigadier.id,
        name: brigadier.name,
        avgCitizens: brigadier.registeredCount,
      })),
    topPerformers: allPeople
      .filter(p => p.performance?.achievementRate)
      .sort((a, b) => (b.performance?.achievementRate || 0) - (a.performance?.achievementRate || 0))
      .slice(0, 5)
      .map(person => ({
        id: person.id,
        name: person.name,
        role: person.role,
        score: person.performance?.achievementRate || 0,
      })),
    needsSupport: allPeople
      .filter(p => p.performance?.achievementRate && p.performance.achievementRate < 50)
      .map(person => ({
        id: person.id,
        name: person.name,
        role: person.role,
        issue: 'Bajo rendimiento',
      })),
    registrationSpeed: {
      average: 2.5,
      fastest: 0.5,
      slowest: 7.2,
    },
  };

  // Métricas geográficas
  const regionCounts = allPeople.reduce((acc, person) => {
    if (person.entidad) {
      acc[person.entidad] = (acc[person.entidad] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  const geographic = {
    regionDistribution: Object.entries(regionCounts).map(([region, count]) => ({
      region,
      count,
      percentage: (count / allPeople.length) * 100,
    })),
    heatmapData: Object.entries(regionCounts).map(([region, count]) => ({
      region,
      intensity: count,
    })),
    territorialCoverage: Object.entries(regionCounts).map(([region, count]) => ({
      region,
      coverage: (count / allPeople.length) * 100,
      target: 20, // 20% por región idealmente
    })),
  };

  // Análisis temporal
  const temporal = {
    hourlyPatterns: Array.from({ length: 24 }, (_, hour) => ({
      hour,
      registrations: Math.floor(Math.random() * 10) + 1,
    })),
    weeklyPatterns: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(day => ({
      day,
      registrations: Math.floor(Math.random() * 50) + 10,
    })),
    seasonality: monthlyRegistrations.map(month => ({
      month: month.date,
      registrations: month.count,
      trend: Math.random() > 0.5 ? 'up' : Math.random() > 0.5 ? 'down' : 'stable' as 'up' | 'down' | 'stable',
    })),
    projections: Array.from({ length: 30 }, (_, i) => ({
      date: new Date(Date.now() + i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      projected: Math.floor(Math.random() * 25) + 10,
      confidence: Math.random() * 40 + 60, // 60-100% confianza
    })),
  };

  // Métricas de calidad
  const verifiedCount = allPeople.filter(p => p.contactInfo?.verified).length;
  const quality = {
    dataCompleteness: 85.5,
    duplicateRate: 2.3,
    verificationRate: (verifiedCount / allPeople.length) * 100,
    postRegistrationActivity: 78.9,
  };

  // Metas y objetivos
  const totalTarget = 5000;
  const goals = {
    overallProgress: {
      current: totalCitizens,
      target: totalTarget,
      percentage: (totalCitizens / totalTarget) * 100,
    },
    individualGoals: data.map(leader => {
      const current = leader.registeredCount;
      const target = leader.performance?.monthlyGoal || 50;
      return {
        id: leader.id,
        name: leader.name,
        current,
        target,
        status: current >= target ? 'ahead' : current >= target * 0.8 ? 'on-track' : 'behind' as 'on-track' | 'behind' | 'ahead',
      };
    }),
    milestones: [
      { date: '2024-03-31', description: 'Meta Q1: 1,250 ciudadanos', completed: true, target: 1250 },
      { date: '2024-06-30', description: 'Meta Q2: 2,500 ciudadanos', completed: false, target: 2500 },
      { date: '2024-09-30', description: 'Meta Q3: 3,750 ciudadanos', completed: false, target: 3750 },
      { date: '2024-12-31', description: 'Meta Anual: 5,000 ciudadanos', completed: false, target: 5000 },
    ],
  };

  // Alertas
  const alerts = {
    critical: [
      { id: '1', message: 'Líder 3 sin actividad en 7 días', type: 'inactivity' as const },
      { id: '2', message: 'Meta mensual en riesgo - 15% por debajo', type: 'goal' as const },
    ],
    warnings: [
      { id: '3', message: 'Brigadista B005 con bajo rendimiento', type: 'performance' as const },
      { id: '4', message: 'Tasa de verificación por debajo del 70%', type: 'quality' as const },
    ],
    achievements: [
      { id: '5', message: 'Líder 1 superó su meta mensual', date: new Date() },
      { id: '6', message: 'Región Norte alcanzó 100% de cobertura', date: new Date() },
    ],
  };

  // Predicciones
  const predictions = {
    churnRisk: allPeople
      .filter(p => p.role !== 'citizen')
      .slice(0, 3)
      .map(person => ({
        id: person.id,
        name: person.name,
        risk: Math.random() * 100,
        factors: ['Baja actividad reciente', 'Meta no alcanzada', 'Sin contacto en 5 días'],
      })),
    resourceOptimization: [
      { area: 'Región Sur', recommendation: 'Asignar 2 brigadistas adicionales', impact: 25 },
      { area: 'Capacitación', recommendation: 'Programa de mentoring para nuevos líderes', impact: 40 },
    ],
    patterns: [
      { pattern: 'Mayor actividad los martes y jueves', confidence: 85, description: 'Optimizar campañas en estos días' },
      { pattern: 'Líderes jóvenes tienen 30% más conversión', confidence: 78, description: 'Enfocar reclutamiento en perfil joven' },
    ],
  };

  return {
    totalLideres,
    totalBrigadistas,
    totalMobilizers,
    totalCitizens,
    dailyRegistrations,
    weeklyRegistrations,
    monthlyRegistrations,
    leaderPerformance,
    conversionRate: 85.5,
    growthRate: 12.3,
    efficiency,
    geographic,
    temporal,
    quality,
    goals,
    alerts,
    predictions,
  };
};

export const mockData = generateMockData();
export const mockAnalytics = generateAnalytics(mockData);