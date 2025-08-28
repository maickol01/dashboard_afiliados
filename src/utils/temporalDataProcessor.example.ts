/**
 * Example usage of Temporal Data Processor with existing DataService
 * 
 * This example demonstrates how to integrate the temporal data processor
 * with the existing analytics data from DataService.generateAnalyticsFromData()
 */

import { temporalDataProcessor } from './temporalDataProcessor';
import { DataService } from '../services/dataService';
import type { Analytics, Person } from '../types';

/**
 * Example function showing integration with DataService
 * This would typically be called from a component or service
 */
export async function processTemporalAnalytics(hierarchicalData: Person[]): Promise<{
  originalAnalytics: Analytics;
  optimizedTemporalData: any;
  keyInsights: string[];
}> {
  try {
    // 1. Generate analytics using existing DataService method
    // Requirement 6.1: Utilizar las queries de dataService.ts
    const analytics = await DataService.generateAnalyticsFromData(hierarchicalData);
    
    // 2. Process temporal data using our new utility
    // Requirement 6.3: Transformar los datos de las queries existentes
    const optimizedTemporalData = temporalDataProcessor.generateOptimizedTemporalData(analytics);
    
    // 3. Extract key insights for quick decision making
    // Requirement 5.1: Generar recomendaciones específicas y accionables
    const keyInsights = [
      `Mejor hora: ${optimizedTemporalData.keyMetrics.bestPerformingHour.hour}:00 con ${optimizedTemporalData.keyMetrics.bestPerformingHour.registrations} registros`,
      `Mejor día: ${optimizedTemporalData.keyMetrics.bestPerformingDay.day} con tendencia ${optimizedTemporalData.keyMetrics.bestPerformingDay.trend}`,
      `Tendencia mensual: ${optimizedTemporalData.keyMetrics.monthlyTrend.direction} (${optimizedTemporalData.keyMetrics.monthlyTrend.percentage}%)`,
      `Proyección 30 días: ${optimizedTemporalData.keyMetrics.projectedGrowth.next30Days} registros con ${optimizedTemporalData.keyMetrics.projectedGrowth.confidence}% confianza`
    ];
    
    return {
      originalAnalytics: analytics,
      optimizedTemporalData,
      keyInsights
    };
    
  } catch (error) {
    console.error('Error processing temporal analytics:', error);
    throw error;
  }
}

/**
 * Example function to get smart recommendations
 * This demonstrates the smart recommendations generator
 */
export function getSmartRecommendations(analytics: Analytics): {
  scheduleOptimization: string;
  resourceAllocation: string;
  campaignTiming: string;
  actionableInsights: Array<{
    title: string;
    priority: string;
    action: string;
  }>;
} {
  // Extract patterns and generate insights
  const patterns = temporalDataProcessor.extractKeyPatterns(analytics);
  const insights = temporalDataProcessor.generateSmartInsights(patterns);
  
  // Get optimized data for recommendations
  const optimizedData = temporalDataProcessor.generateOptimizedTemporalData(analytics);
  
  // Filter actionable insights
  const actionableInsights = insights
    .filter(insight => insight.actionable)
    .map(insight => ({
      title: insight.title,
      priority: insight.priority,
      action: insight.recommendation || 'No specific action available'
    }));
  
  return {
    ...optimizedData.recommendations,
    actionableInsights
  };
}

/**
 * Example function to identify peak performance periods
 * This shows how to use the utility for schedule optimization
 */
export function identifyPeakPerformancePeriods(analytics: Analytics): {
  peakHour: { hour: number; registrations: number; efficiency: number };
  peakDay: { day: string; registrations: number; trend: string };
  recommendedTimeSlots: Array<{ start: number; end: number; reason: string }>;
  anomalies: Array<{ type: string; description: string; action: string }>;
} {
  // Calculate optimal schedule
  const schedule = temporalDataProcessor.calculateOptimalSchedule(analytics);
  
  // Identify anomalies
  const anomalies = temporalDataProcessor.identifyAnomalies(analytics);
  
  return {
    peakHour: schedule.bestHour,
    peakDay: schedule.bestDay,
    recommendedTimeSlots: schedule.recommendedTimeSlots,
    anomalies: anomalies.map(anomaly => ({
      type: anomaly.type,
      description: anomaly.description,
      action: anomaly.suggestedAction
    }))
  };
}

/**
 * Example usage in a React component context
 * This shows how the utility would be used in the actual application
 */
export const exampleUsageInComponent = `
// In a React component (e.g., OptimizedTemporalAnalysis.tsx)
import { temporalDataProcessor } from '../utils/temporalDataProcessor';
import { useEffect, useState } from 'react';

const OptimizedTemporalAnalysis = ({ analytics }) => {
  const [temporalData, setTemporalData] = useState(null);
  
  useEffect(() => {
    if (analytics) {
      // Process temporal data using our utility
      const optimizedData = temporalDataProcessor.generateOptimizedTemporalData(analytics);
      setTemporalData(optimizedData);
    }
  }, [analytics]);
  
  if (!temporalData) return <div>Loading...</div>;
  
  return (
    <div>
      <h3>Temporal Analysis - Optimized</h3>
      
      {/* Key Metrics Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card">
          <h4>Best Hour</h4>
          <p>{temporalData.keyMetrics.bestPerformingHour.hour}:00</p>
          <small>{temporalData.keyMetrics.bestPerformingHour.registrations} registrations</small>
        </div>
        
        <div className="card">
          <h4>Best Day</h4>
          <p>{temporalData.keyMetrics.bestPerformingDay.day}</p>
          <small>Trend: {temporalData.keyMetrics.bestPerformingDay.trend}</small>
        </div>
        
        <div className="card">
          <h4>Monthly Trend</h4>
          <p>{temporalData.keyMetrics.monthlyTrend.direction}</p>
          <small>{temporalData.keyMetrics.monthlyTrend.percentage}%</small>
        </div>
      </div>
      
      {/* Smart Recommendations */}
      <div className="recommendations">
        <h4>Smart Recommendations</h4>
        <p><strong>Schedule:</strong> {temporalData.recommendations.scheduleOptimization}</p>
        <p><strong>Resources:</strong> {temporalData.recommendations.resourceAllocation}</p>
        <p><strong>Campaigns:</strong> {temporalData.recommendations.campaignTiming}</p>
      </div>
      
      {/* Actionable Insights */}
      <div className="insights">
        <h4>Actionable Insights</h4>
        {temporalData.insights
          .filter(insight => insight.actionable)
          .map((insight, index) => (
            <div key={index} className="insight-card">
              <h5>{insight.title}</h5>
              <p>{insight.recommendation}</p>
              <span className="priority">{insight.priority}</span>
            </div>
          ))
        }
      </div>
    </div>
  );
};
`;

// Note: Functions are already exported above, no need to re-export