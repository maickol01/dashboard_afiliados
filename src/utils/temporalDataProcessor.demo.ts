/**
 * Demonstration of Temporal Data Processor
 * Shows how the utility extracts insights from analytics.temporal data
 */

import { temporalDataProcessor } from './temporalDataProcessor';
import type { Analytics } from '../types';

// Mock analytics data that matches the existing DataService structure
const mockAnalytics: Analytics = {
  totalLideres: 10,
  totalBrigadistas: 50,
  totalMobilizers: 200,
  totalCitizens: 1000,
  dailyRegistrations: [],
  weeklyRegistrations: [],
  monthlyRegistrations: [],
  leaderPerformance: [],
  conversionRate: 75,
  growthRate: 15,
  
  temporal: {
    hourlyPatterns: [
      { hour: 8, registrations: 15 },
      { hour: 9, registrations: 25 },
      { hour: 10, registrations: 45 }, // Peak hour
      { hour: 11, registrations: 35 },
      { hour: 12, registrations: 20 },
      { hour: 13, registrations: 10 },
      { hour: 14, registrations: 30 },
      { hour: 15, registrations: 40 },
      { hour: 16, registrations: 25 },
      { hour: 17, registrations: 15 }
    ],
    weeklyPatterns: [
      { day: 'Lunes', registrations: 120 },
      { day: 'Martes', registrations: 150 }, // Peak day
      { day: 'Miércoles', registrations: 100 },
      { day: 'Jueves', registrations: 110 },
      { day: 'Viernes', registrations: 90 },
      { day: 'Sábado', registrations: 60 },
      { day: 'Domingo', registrations: 40 }
    ],
    seasonality: [
      { month: 'Enero', registrations: 200, trend: 'up' as const },
      { month: 'Febrero', registrations: 250, trend: 'up' as const },
      { month: 'Marzo', registrations: 180, trend: 'down' as const },
      { month: 'Abril', registrations: 220, trend: 'stable' as const }
    ],
    projections: [
      { date: '2024-02-01', projected: 50, confidence: 85 },
      { date: '2024-02-02', projected: 45, confidence: 80 },
      { date: '2024-02-03', projected: 55, confidence: 90 }
    ]
  },
  
  efficiency: {
    conversionByLeader: [],
    productivityByBrigadier: [],
    topPerformers: [],
    needsSupport: [],
    registrationSpeed: { average: 2.5, fastest: 1.0, slowest: 5.0 }
  },
  
  geographic: {
    regionDistribution: [],
    heatmapData: [],
    territorialCoverage: []
  },
  
  quality: {
    dataCompleteness: 85,
    duplicateRate: 2,
    verificationRate: 78,
    postRegistrationActivity: 65
  },
  
  goals: {
    overallProgress: { current: 1000, target: 5000, percentage: 20 },
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
};

/**
 * Demonstration function that shows all the capabilities
 */
export function demonstrateTemporalProcessor() {
  console.log('🚀 Temporal Data Processor Demonstration');
  console.log('==========================================\n');
  
  // 1. Extract key patterns
  console.log('1. Extracting Key Patterns:');
  const patterns = temporalDataProcessor.extractKeyPatterns(mockAnalytics);
  patterns.forEach(pattern => {
    console.log(`   - ${pattern.pattern}: ${pattern.impact} impact (${Math.round(pattern.confidence * 100)}% confidence)`);
    console.log(`     Data: ${JSON.stringify(pattern.data)}`);
  });
  console.log('');
  
  // 2. Generate smart insights
  console.log('2. Smart Insights Generated:');
  const insights = temporalDataProcessor.generateSmartInsights(patterns);
  insights.forEach(insight => {
    console.log(`   - ${insight.title}: ${insight.value}`);
    console.log(`     Priority: ${insight.priority} | Actionable: ${insight.actionable}`);
    if (insight.recommendation) {
      console.log(`     Recommendation: ${insight.recommendation}`);
    }
  });
  console.log('');
  
  // 3. Calculate optimal schedule
  console.log('3. Optimal Schedule:');
  const schedule = temporalDataProcessor.calculateOptimalSchedule(mockAnalytics);
  console.log(`   - Best Hour: ${schedule.bestHour.hour}:00 (${schedule.bestHour.registrations} registrations, ${schedule.bestHour.efficiency.toFixed(2)}x efficiency)`);
  console.log(`   - Best Day: ${schedule.bestDay.day} (${schedule.bestDay.registrations} registrations, trend: ${schedule.bestDay.trend})`);
  console.log(`   - Recommended Time Slots:`);
  schedule.recommendedTimeSlots.forEach(slot => {
    console.log(`     * ${slot.start}:00-${slot.end}:00: ${slot.reason}`);
  });
  console.log('');
  
  // 4. Identify anomalies
  console.log('4. Anomalies Detected:');
  const anomalies = temporalDataProcessor.identifyAnomalies(mockAnalytics);
  if (anomalies.length === 0) {
    console.log('   - No anomalies detected in the current data');
  } else {
    anomalies.forEach(anomaly => {
      console.log(`   - ${anomaly.type}: ${anomaly.description}`);
      console.log(`     Severity: ${anomaly.severity} | Action: ${anomaly.suggestedAction}`);
    });
  }
  console.log('');
  
  // 5. Generate complete optimized data
  console.log('5. Complete Optimized Temporal Data:');
  const optimizedData = temporalDataProcessor.generateOptimizedTemporalData(mockAnalytics);
  
  console.log('   Key Metrics:');
  console.log(`   - Best Hour: ${optimizedData.keyMetrics.bestPerformingHour.hour}:00 (${optimizedData.keyMetrics.bestPerformingHour.registrations} registrations)`);
  console.log(`   - Best Day: ${optimizedData.keyMetrics.bestPerformingDay.day} (trend: ${optimizedData.keyMetrics.bestPerformingDay.trend})`);
  console.log(`   - Monthly Trend: ${optimizedData.keyMetrics.monthlyTrend.direction} (${optimizedData.keyMetrics.monthlyTrend.percentage}%)`);
  console.log(`   - Projected Growth: ${optimizedData.keyMetrics.projectedGrowth.next30Days} registrations (${optimizedData.keyMetrics.projectedGrowth.confidence}% confidence)`);
  
  console.log('\n   Smart Recommendations:');
  console.log(`   - Schedule: ${optimizedData.recommendations.scheduleOptimization}`);
  console.log(`   - Resources: ${optimizedData.recommendations.resourceAllocation}`);
  console.log(`   - Campaigns: ${optimizedData.recommendations.campaignTiming}`);
  
  console.log('\n   Chart Data:');
  console.log(`   - Primary data points: ${optimizedData.chartData.primary.length}`);
  console.log(`   - Secondary data points: ${optimizedData.chartData.secondary?.length || 0}`);
  console.log(`   - Annotations: ${optimizedData.chartData.annotations?.length || 0}`);
  
  console.log('\n✅ Demonstration completed successfully!');
  console.log('The temporal data processor is ready for integration with the optimized temporal analysis component.');
  
  return optimizedData;
}

// Run demonstration if this file is executed directly
if (typeof window === 'undefined' && typeof process !== 'undefined') {
  demonstrateTemporalProcessor();
}