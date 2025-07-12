export interface Person {
  id: string;
  name: string;
  role: 'lider' | 'brigadista' | 'movilizador' | 'ciudadano';
  created_at: Date;
  parentId?: string;
  children?: Person[];
  isActive?: boolean;
  lastActivity?: Date;
  
  // Campos de la base de datos
  nombre: string;
  clave_electoral?: string;
  curp?: string;
  direccion?: string;
  colonia?: string;
  codigo_postal?: string;
  seccion?: string;
  entidad?: string;
  municipio?: string;
  numero_cel?: string;
  num_verificado: boolean;
  verification_token?: string;
  
  // Campos específicos por rol
  lider_id?: string; // Para brigadistas
  brigadista_id?: string; // Para movilizadores
  movilizador_id?: string; // Para ciudadanos
  
  // Campos calculados
  registeredCount: number;
  contactInfo?: {
    phone?: string;
    email?: string;
    verified?: boolean;
  };
  performance?: {
    weeklyAverage: number;
    monthlyGoal: number;
    achievementRate: number;
  };
}

export interface Analytics {
  totalLideres: number;
  totalBrigadistas: number;
  totalMobilizers: number;
  totalCitizens: number;
  dailyRegistrations: { date: string; count: number }[];
  weeklyRegistrations: { date: string; count: number }[];
  monthlyRegistrations: { date: string; count: number }[];
  leaderPerformance: { name: string; registered: number }[];
  conversionRate: number;
  growthRate: number;
  
  // Nuevas métricas avanzadas
  efficiency: {
    conversionByLeader: { leaderId: string; name: string; rate: number; target: number }[];
    productivityByBrigadier: { brigadierId: string; name: string; avgCitizens: number }[];
    topPerformers: { id: string; name: string; role: string; score: number }[];
    needsSupport: { id: string; name: string; role: string; issue: string }[];
    registrationSpeed: { average: number; fastest: number; slowest: number };
  };
  
  geographic: {
    regionDistribution: { region: string; count: number; percentage: number }[];
    heatmapData: { region: string; intensity: number; coordinates?: [number, number] }[];
    territorialCoverage: { region: string; coverage: number; target: number }[];
  };
  
  temporal: {
    hourlyPatterns: { hour: number; registrations: number }[];
    weeklyPatterns: { day: string; registrations: number }[];
    seasonality: { month: string; registrations: number; trend: 'up' | 'down' | 'stable' }[];
    projections: { date: string; projected: number; confidence: number }[];
  };
  
  quality: {
    dataCompleteness: number;
    duplicateRate: number;
    verificationRate: number;
    postRegistrationActivity: number;
  };
  
  goals: {
    overallProgress: { current: number; target: number; percentage: number };
    individualGoals: { id: string; name: string; current: number; target: number; status: 'on-track' | 'behind' | 'ahead' }[];
    milestones: { date: string; description: string; completed: boolean; target: number }[];
  };
  
  alerts: {
    critical: { id: string; message: string; type: 'performance' | 'inactivity' | 'goal' | 'quality' }[];
    warnings: { id: string; message: string; type: 'performance' | 'inactivity' | 'goal' | 'quality' }[];
    achievements: { id: string; message: string; date: Date }[];
  };
  
  predictions: {
    churnRisk: { id: string; name: string; risk: number; factors: string[] }[];
    resourceOptimization: { area: string; recommendation: string; impact: number }[];
    patterns: { pattern: string; confidence: number; description: string }[];
  };
}

export type Period = 'day' | 'week' | 'month';

export interface ExportOptions {
  selectedLeaders: string[];
  exportType: 'complete' | 'by-level' | 'by-leader';
  specificLevel?: 'leader' | 'brigadier' | 'mobilizer' | 'citizen';
}

export interface FilterOptions {
  dateRange?: { start: Date; end: Date };
  regions?: string[];
  roles?: string[];
  performanceRange?: { min: number; max: number };
  activeOnly?: boolean;
}

export interface ComparisonPeriod {
  label: string;
  start: Date;
  end: Date;
}