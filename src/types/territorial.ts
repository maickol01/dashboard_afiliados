// Territorial Analytics Types
export interface TerritorialAnalytics {
  coverageMetrics: TerritorialCoverageMetric[];
  workerDensity: WorkerDensityMetric[];
  gapAnalysis: TerritorialGapMetric[];
  citizenWorkerRatio: CitizenWorkerRatioMetric[];
  summary: TerritorialSummary;
}

export interface TerritorialCoverageMetric {
  region: string;
  regionType: 'entidad' | 'municipio' | 'seccion';
  totalWorkers: number;
  workersByType: {
    lideres: number;
    brigadistas: number;
    movilizadores: number;
  };
  totalCitizens: number;
  coveragePercentage: number;
  targetCoverage: number;
  status: 'excellent' | 'good' | 'needs_improvement' | 'critical';
  lastUpdate: Date;
}

export interface WorkerDensityMetric {
  region: string;
  regionType: 'entidad' | 'municipio' | 'seccion';
  area?: number; // Optional area in km²
  population?: number; // Optional estimated population
  workerDensity: number; // Workers per 1000 people or per km²
  citizenDensity: number; // Citizens per 1000 people or per km²
  densityRank: number;
  isOptimal: boolean;
  recommendation: string;
}

export interface TerritorialGapMetric {
  region: string;
  regionType: 'entidad' | 'municipio' | 'seccion';
  gapType: 'no_workers' | 'low_coverage' | 'unbalanced_hierarchy' | 'inactive_workers';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  recommendedAction: string;
  priority: number;
  estimatedImpact: number; // Potential additional citizens if gap is addressed
  nearbyRegions: string[]; // Regions that could help cover this gap
}

export interface CitizenWorkerRatioMetric {
  region: string;
  regionType: 'entidad' | 'municipio' | 'seccion';
  totalWorkers: number;
  totalCitizens: number;
  ratio: number; // Citizens per worker
  optimalRatio: number;
  efficiency: 'high' | 'medium' | 'low';
  trend: 'improving' | 'stable' | 'declining';
  benchmarkComparison: number; // Percentage compared to average
}

export interface TerritorialSummary {
  totalRegionsAnalyzed: number;
  regionsWithExcellentCoverage: number;
  regionsNeedingImprovement: number;
  criticalGaps: number;
  averageCoveragePercentage: number;
  topPerformingRegions: {
    region: string;
    coveragePercentage: number;
    citizenWorkerRatio: number;
  }[];
  expansionOpportunities: {
    region: string;
    potentialCitizens: number;
    requiredWorkers: number;
    priority: 'high' | 'medium' | 'low';
  }[];
  overallHealthScore: number; // 0-100 score of territorial health
}

// Utility types for territorial analysis
export interface TerritorialFilter {
  regionTypes?: ('entidad' | 'municipio' | 'seccion')[];
  coverageThreshold?: number;
  includeInactive?: boolean;
  sortBy?: 'coverage' | 'density' | 'gaps' | 'ratio';
  sortOrder?: 'asc' | 'desc';
}

export interface TerritorialVisualizationData {
  heatmapData: {
    region: string;
    value: number;
    color: string;
    tooltip: string;
  }[];
  chartData: {
    region: string;
    coverage: number;
    workers: number;
    citizens: number;
    ratio: number;
  }[];
  gapVisualization: {
    region: string;
    severity: number;
    type: string;
    coordinates?: [number, number];
  }[];
}