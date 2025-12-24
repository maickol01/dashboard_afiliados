// Worker productivity analytics interfaces
export interface LeaderProductivityMetric {
  leaderId: string;
  name: string;
  totalNetwork: number; // Total people under this leader
  brigadierCount: number;
  mobilizerCount: number;
  citizenCount: number;
  registrationVelocity: number; // Citizens per day
  networkEfficiency: number; // Citizens per total network member
  timeToTarget: number; // Days to reach goal at current pace
  performanceRank: number;
  trendDirection: 'up' | 'down' | 'stable';
  lastActivityDate: Date;
  recommendations: string[];
}

export interface BrigadierProductivityMetric {
  brigadierId: string;
  name: string;
  leaderId: string;
  leaderName: string;
  mobilizerCount: number;
  citizenCount: number;
  avgCitizensPerMobilizer: number;
  registrationRate: number;
  efficiencyScore: number;
  performanceLevel: 'high' | 'medium' | 'low';
  needsSupport: boolean;
  lastActivityDate: Date;
  targetProgress: number;
}

export interface MobilizerProductivityMetric {
  mobilizerId: string;
  name: string;
  brigadierId: string;
  brigadierName: string;
  leaderId: string;
  leaderName: string;
  citizenCount: number;
  registrationRate: number;
  activityLevel: 'active' | 'moderate' | 'inactive';
  lastRegistration: Date;
  targetProgress: number;
  weeklyAverage: number;
  monthlyGoal: number;
}

export interface ComparativeMetric {
  level: 'leader' | 'brigadier' | 'mobilizer';
  averagePerformance: number;
  topPerformer: {
    id: string;
    name: string;
    score: number;
  };
  bottomPerformer: {
    id: string;
    name: string;
    score: number;
  };
  performanceDistribution: {
    high: number; // percentage
    medium: number; // percentage
    low: number; // percentage
  };
  costPerRegistration: number;
  efficiencyTrend: 'improving' | 'declining' | 'stable';
}

export interface WorkerProductivityAnalytics {
  leaderMetrics: LeaderProductivityMetric[];
  brigadierMetrics: BrigadierProductivityMetric[];
  mobilizerMetrics: MobilizerProductivityMetric[];
  comparativeAnalysis: ComparativeMetric[];
  overallInsights: {
    mostEffectiveLevel: 'leader' | 'brigadier' | 'mobilizer';
    recommendedActions: string[];
    performanceTrends: {
      level: string;
      trend: 'up' | 'down' | 'stable';
      changePercentage: number;
    }[];
  };
}