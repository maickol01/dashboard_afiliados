export interface NetworkHealthAnalytics {
  hierarchicalBalance: NetworkBalanceMetric[];
  growthPatterns: NetworkGrowthMetric[];
  structuralHealth: StructuralHealthMetric[];
  expansionRate: NetworkExpansionMetric[];
}

export interface NetworkBalanceMetric {
  leaderId: string;
  leaderName: string;
  brigadierCount: number;
  mobilizerCount: number;
  citizenCount: number;
  avgBrigadiersPerLeader: number;
  avgMobilizersPerBrigadier: number;
  avgCitizensPerMobilizer: number;
  balanceScore: number; // 0-100, higher is better balanced
  balanceStatus: 'balanced' | 'overloaded' | 'underutilized';
  recommendations: string[];
}

export interface NetworkGrowthMetric {
  period: string;
  date: Date;
  newLeaders: number;
  newBrigadiers: number;
  newMobilizers: number;
  newCitizens: number;
  totalNetworkSize: number;
  growthRate: number;
  growthTrend: 'accelerating' | 'steady' | 'declining';
}

export interface StructuralHealthMetric {
  metricType: 'orphaned_workers' | 'broken_chains' | 'inactive_nodes' | 'overloaded_nodes';
  count: number;
  percentage: number;
  affectedWorkers: {
    id: string;
    name: string;
    role: string;
    issue: string;
    severity: 'low' | 'medium' | 'high';
  }[];
  recommendations: string[];
}

export interface NetworkExpansionMetric {
  period: string;
  date: Date;
  expansionRate: number;
  newConnections: number;
  networkDensity: number;
  coverageIncrease: number;
  efficiencyScore: number;
  expansionQuality: 'high' | 'medium' | 'low';
}

export interface NetworkHealthSummary {
  overallHealthScore: number; // 0-100
  healthStatus: 'excellent' | 'good' | 'fair' | 'poor';
  criticalIssues: number;
  warnings: number;
  strengths: string[];
  weaknesses: string[];
  actionItems: {
    priority: 'high' | 'medium' | 'low';
    action: string;
    impact: string;
  }[];
}