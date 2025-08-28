/**
 * Temporal Data Processor Utility
 * 
 * Implements utility functions to extract key insights from existing analytics.temporal data
 * Creates methods to identify peak hours, best days, and monthly trends from DataService
 * Adds smart recommendations generator based on temporal patterns
 * 
 * Requirements: 6.1, 6.3, 5.1
 */

import { Analytics, Person } from '../types';

// Core interfaces for temporal processing
export interface TemporalPattern {
  pattern: 'peak_hour' | 'peak_day' | 'seasonal_trend' | 'growth_pattern';
  confidence: number;
  impact: 'high' | 'medium' | 'low';
  data: any;
}

export interface TemporalInsight {
  type: 'trend' | 'peak' | 'projection' | 'anomaly';
  title: string;
  value: string | number;
  change?: number;
  recommendation?: string;
  priority: 'high' | 'medium' | 'low';
  actionable: boolean;
}

export interface InsightAction {
  type: 'optimize_schedule' | 'increase_resources' | 'investigate_anomaly';
  target: string;
  expectedImpact: string;
}

export interface OptimalSchedule {
  bestHour: { hour: number; registrations: number; efficiency: number };
  bestDay: { day: string; registrations: number; trend: string };
  recommendedTimeSlots: Array<{ start: number; end: number; reason: string }>;
}

export interface OptimizedTemporalData {
  // Datos principales extraídos de analytics.temporal
  keyMetrics: {
    bestPerformingHour: { hour: number; registrations: number; efficiency: number };
    bestPerformingDay: { day: string; registrations: number; trend: string };
    monthlyTrend: { direction: 'up' | 'down' | 'stable'; percentage: number };
    projectedGrowth: { next30Days: number; confidence: number };
  };
  
  // Insights procesados
  insights: TemporalInsight[];
  
  // Recomendaciones específicas
  recommendations: {
    scheduleOptimization: string;
    resourceAllocation: string;
    campaignTiming: string;
  };
  
  // Datos para visualización
  chartData: {
    primary: Array<{ name: string; value: number; trend?: string }>;
    secondary?: Array<{ name: string; value: number }>;
    annotations?: Array<{ point: string; message: string }>;
  };
}

export interface Anomaly {
  type: 'sudden_drop' | 'unexpected_peak' | 'pattern_break';
  severity: 'low' | 'medium' | 'high';
  description: string;
  affectedPeriod: string;
  suggestedAction: string;
}

/**
 * Main Temporal Data Processor Class
 * Extracts key insights from existing analytics.temporal data
 */
export class TemporalDataProcessor {
  
  /**
   * Extract key patterns from analytics temporal data
   * Requirement 6.1: Utilizar las queries de dataService.ts
   */
  static extractKeyPatterns(analytics: Analytics): TemporalPattern[] {
    const patterns: TemporalPattern[] = [];
    
    if (!analytics.temporal) {
      console.warn('No temporal data available in analytics');
      return patterns;
    }
    
    const { temporal } = analytics;
    
    // Extract peak hour pattern
    if (temporal.hourlyPatterns && temporal.hourlyPatterns.length > 0) {
      const peakHour = temporal.hourlyPatterns.reduce((max, current) => 
        current.registrations > max.registrations ? current : max
      );
      
      const avgRegistrations = temporal.hourlyPatterns.reduce((sum, h) => sum + h.registrations, 0) / temporal.hourlyPatterns.length;
      const efficiency = peakHour.registrations / avgRegistrations;
      
      patterns.push({
        pattern: 'peak_hour',
        confidence: Math.min(efficiency * 0.3, 1.0), // Normalize confidence
        impact: efficiency > 2 ? 'high' : efficiency > 1.5 ? 'medium' : 'low',
        data: { hour: peakHour.hour, registrations: peakHour.registrations, efficiency }
      });
    }
    
    // Extract peak day pattern
    if (temporal.weeklyPatterns && temporal.weeklyPatterns.length > 0) {
      const peakDay = temporal.weeklyPatterns.reduce((max, current) => 
        current.registrations > max.registrations ? current : max
      );
      
      const avgDailyRegistrations = temporal.weeklyPatterns.reduce((sum, d) => sum + d.registrations, 0) / temporal.weeklyPatterns.length;
      const dayEfficiency = peakDay.registrations / avgDailyRegistrations;
      
      patterns.push({
        pattern: 'peak_day',
        confidence: Math.min(dayEfficiency * 0.25, 1.0),
        impact: dayEfficiency > 1.8 ? 'high' : dayEfficiency > 1.3 ? 'medium' : 'low',
        data: { day: peakDay.day, registrations: peakDay.registrations, efficiency: dayEfficiency }
      });
    }
    
    // Extract seasonal trend pattern
    if (temporal.seasonality && temporal.seasonality.length > 0) {
      const upTrends = temporal.seasonality.filter(s => s.trend === 'up').length;
      const downTrends = temporal.seasonality.filter(s => s.trend === 'down').length;
      const totalMonths = temporal.seasonality.length;
      
      const trendDirection = upTrends > downTrends ? 'up' : downTrends > upTrends ? 'down' : 'stable';
      const trendStrength = Math.abs(upTrends - downTrends) / totalMonths;
      
      patterns.push({
        pattern: 'seasonal_trend',
        confidence: trendStrength,
        impact: trendStrength > 0.6 ? 'high' : trendStrength > 0.3 ? 'medium' : 'low',
        data: { direction: trendDirection, strength: trendStrength, upMonths: upTrends, downMonths: downTrends }
      });
    }
    
    // Extract growth pattern from projections
    if (temporal.projections && temporal.projections.length > 0) {
      const totalProjected = temporal.projections.reduce((sum, p) => sum + p.projected, 0);
      const avgConfidence = temporal.projections.reduce((sum, p) => sum + p.confidence, 0) / temporal.projections.length;
      
      patterns.push({
        pattern: 'growth_pattern',
        confidence: avgConfidence / 100, // Convert percentage to decimal
        impact: totalProjected > 100 ? 'high' : totalProjected > 50 ? 'medium' : 'low',
        data: { projected: totalProjected, confidence: avgConfidence, timeframe: '30_days' }
      });
    }
    
    return patterns;
  }
  
  /**
   * Generate smart insights from temporal patterns
   * Requirement 5.1: Generar recomendaciones específicas y accionables
   */
  static generateSmartInsights(patterns: TemporalPattern[]): TemporalInsight[] {
    const insights: TemporalInsight[] = [];
    
    patterns.forEach(pattern => {
      switch (pattern.pattern) {
        case 'peak_hour':
          insights.push({
            type: 'peak',
            title: 'Hora Pico Identificada',
            value: `${pattern.data.hour}:00`,
            change: Math.round((pattern.data.efficiency - 1) * 100),
            recommendation: `Concentrar campañas entre las ${pattern.data.hour}:00 y ${pattern.data.hour + 1}:00 para maximizar registros`,
            priority: pattern.impact === 'high' ? 'high' : 'medium',
            actionable: true
          });
          break;
          
        case 'peak_day':
          insights.push({
            type: 'peak',
            title: 'Día Más Efectivo',
            value: pattern.data.day,
            change: Math.round((pattern.data.efficiency - 1) * 100),
            recommendation: `Programar eventos importantes los ${pattern.data.day} para aprovechar la mayor actividad`,
            priority: pattern.impact === 'high' ? 'high' : 'medium',
            actionable: true
          });
          break;
          
        case 'seasonal_trend':
          const trendText = pattern.data.direction === 'up' ? 'Crecimiento' : 
                           pattern.data.direction === 'down' ? 'Declive' : 'Estabilidad';
          insights.push({
            type: 'trend',
            title: `Tendencia Estacional: ${trendText}`,
            value: `${Math.round(pattern.data.strength * 100)}%`,
            recommendation: TemporalDataProcessor.getSeasonalRecommendation(pattern.data.direction, pattern.data.strength),
            priority: pattern.impact === 'high' ? 'high' : 'low',
            actionable: pattern.data.direction !== 'stable'
          });
          break;
          
        case 'growth_pattern':
          insights.push({
            type: 'projection',
            title: 'Proyección de Crecimiento',
            value: pattern.data.projected,
            change: pattern.data.confidence,
            recommendation: `Se esperan ${pattern.data.projected} nuevos registros con ${pattern.data.confidence}% de confianza`,
            priority: pattern.data.projected > 100 ? 'high' : 'medium',
            actionable: pattern.data.confidence > 70
          });
          break;
      }
    });
    
    return insights;
  }
  
  /**
   * Calculate optimal schedule from temporal data
   * Requirement 6.3: Transformar los datos de las queries existentes
   */
  static calculateOptimalSchedule(analytics: Analytics): OptimalSchedule {
    const { temporal } = analytics;
    
    // Default values in case of missing data
    let bestHour = { hour: 10, registrations: 0, efficiency: 1.0 };
    let bestDay = { day: 'Lunes', registrations: 0, trend: 'stable' };
    let recommendedTimeSlots: Array<{ start: number; end: number; reason: string }> = [];
    
    // Calculate best hour
    if (temporal?.hourlyPatterns && temporal.hourlyPatterns.length > 0) {
      const peakHour = temporal.hourlyPatterns.reduce((max, current) => 
        current.registrations > max.registrations ? current : max
      );
      
      const avgRegistrations = temporal.hourlyPatterns.reduce((sum, h) => sum + h.registrations, 0) / temporal.hourlyPatterns.length;
      
      bestHour = {
        hour: peakHour.hour,
        registrations: peakHour.registrations,
        efficiency: peakHour.registrations / avgRegistrations
      };
      
      // Generate recommended time slots based on top performing hours
      const topHours = temporal.hourlyPatterns
        .sort((a, b) => b.registrations - a.registrations)
        .slice(0, 3);
        
      recommendedTimeSlots = topHours.map(hour => ({
        start: hour.hour,
        end: hour.hour + 1,
        reason: `${hour.registrations} registros promedio en esta hora`
      }));
    }
    
    // Calculate best day
    if (temporal?.weeklyPatterns && temporal.weeklyPatterns.length > 0) {
      const peakDay = temporal.weeklyPatterns.reduce((max, current) => 
        current.registrations > max.registrations ? current : max
      );
      
      // Determine trend based on seasonal data if available
      let dayTrend = 'stable';
      if (temporal.seasonality && temporal.seasonality.length > 0) {
        const upTrends = temporal.seasonality.filter(s => s.trend === 'up').length;
        const downTrends = temporal.seasonality.filter(s => s.trend === 'down').length;
        dayTrend = upTrends > downTrends ? 'up' : downTrends > upTrends ? 'down' : 'stable';
      }
      
      bestDay = {
        day: peakDay.day,
        registrations: peakDay.registrations,
        trend: dayTrend
      };
    }
    
    return {
      bestHour,
      bestDay,
      recommendedTimeSlots
    };
  }
  
  /**
   * Identify anomalies in temporal data
   * Requirement 5.1: Detectar patrones significativos
   */
  static identifyAnomalies(analytics: Analytics): Anomaly[] {
    const anomalies: Anomaly[] = [];
    const { temporal } = analytics;
    
    if (!temporal) return anomalies;
    
    // Check for sudden drops in hourly patterns
    if (temporal.hourlyPatterns && temporal.hourlyPatterns.length > 0) {
      const avgRegistrations = temporal.hourlyPatterns.reduce((sum, h) => sum + h.registrations, 0) / temporal.hourlyPatterns.length;
      
      temporal.hourlyPatterns.forEach(hour => {
        if (hour.registrations < avgRegistrations * 0.3) { // Less than 30% of average
          anomalies.push({
            type: 'sudden_drop',
            severity: 'medium',
            description: `Actividad muy baja a las ${hour.hour}:00 horas`,
            affectedPeriod: `${hour.hour}:00`,
            suggestedAction: 'Investigar causas de baja actividad en este horario'
          });
        }
      });
    }
    
    // Check for unexpected peaks
    if (temporal.weeklyPatterns && temporal.weeklyPatterns.length > 0) {
      const avgDailyRegistrations = temporal.weeklyPatterns.reduce((sum, d) => sum + d.registrations, 0) / temporal.weeklyPatterns.length;
      
      temporal.weeklyPatterns.forEach(day => {
        if (day.registrations > avgDailyRegistrations * 2.5) { // More than 250% of average
          anomalies.push({
            type: 'unexpected_peak',
            severity: 'low',
            description: `Actividad excepcionalmente alta los ${day.day}`,
            affectedPeriod: day.day,
            suggestedAction: 'Analizar factores que causaron este pico para replicarlos'
          });
        }
      });
    }
    
    return anomalies;
  }
  
  /**
   * Generate optimized temporal data structure
   * Main method that combines all processing functions
   */
  static generateOptimizedTemporalData(analytics: Analytics): OptimizedTemporalData {
    const patterns = this.extractKeyPatterns(analytics);
    const insights = this.generateSmartInsights(patterns);
    const optimalSchedule = this.calculateOptimalSchedule(analytics);
    
    // Extract key metrics
    const keyMetrics = {
      bestPerformingHour: optimalSchedule.bestHour,
      bestPerformingDay: optimalSchedule.bestDay,
      monthlyTrend: TemporalDataProcessor.calculateMonthlyTrend(analytics),
      projectedGrowth: TemporalDataProcessor.calculateProjectedGrowth(analytics)
    };
    
    // Generate recommendations
    const recommendations = TemporalDataProcessor.generateRecommendations(patterns, insights);
    
    // Prepare chart data
    const chartData = TemporalDataProcessor.prepareChartData(analytics);
    
    return {
      keyMetrics,
      insights,
      recommendations,
      chartData
    };
  }
  
  // Private helper methods
  
  static getSeasonalRecommendation(direction: string, strength: number): string {
    if (direction === 'up') {
      return strength > 0.6 ? 
        'Aprovechar la tendencia creciente aumentando recursos y campañas' :
        'Mantener estrategias actuales para sostener el crecimiento';
    } else if (direction === 'down') {
      return strength > 0.6 ?
        'Implementar estrategias de reactivación urgentes' :
        'Revisar y ajustar estrategias para revertir la tendencia';
    } else {
      return 'Mantener estrategias consistentes, considerar innovaciones para impulsar crecimiento';
    }
  }
  
  static calculateMonthlyTrend(analytics: Analytics): { direction: 'up' | 'down' | 'stable'; percentage: number } {
    const { temporal } = analytics;
    
    if (!temporal?.seasonality || temporal.seasonality.length === 0) {
      return { direction: 'stable', percentage: 0 };
    }
    
    const upTrends = temporal.seasonality.filter(s => s.trend === 'up').length;
    const downTrends = temporal.seasonality.filter(s => s.trend === 'down').length;
    const total = temporal.seasonality.length;
    
    if (upTrends > downTrends) {
      return { direction: 'up', percentage: Math.round((upTrends / total) * 100) };
    } else if (downTrends > upTrends) {
      return { direction: 'down', percentage: Math.round((downTrends / total) * 100) };
    } else {
      return { direction: 'stable', percentage: 0 };
    }
  }
  
  static calculateProjectedGrowth(analytics: Analytics): { next30Days: number; confidence: number } {
    const { temporal } = analytics;
    
    if (!temporal?.projections || temporal.projections.length === 0) {
      return { next30Days: 0, confidence: 0 };
    }
    
    const totalProjected = temporal.projections.reduce((sum, p) => sum + p.projected, 0);
    const avgConfidence = temporal.projections.reduce((sum, p) => sum + p.confidence, 0) / temporal.projections.length;
    
    return {
      next30Days: Math.round(totalProjected),
      confidence: Math.round(avgConfidence)
    };
  }
  
  static generateRecommendations(patterns: TemporalPattern[], insights: TemporalInsight[]): {
    scheduleOptimization: string;
    resourceAllocation: string;
    campaignTiming: string;
  } {
    const peakHourPattern = patterns.find(p => p.pattern === 'peak_hour');
    const peakDayPattern = patterns.find(p => p.pattern === 'peak_day');
    const seasonalPattern = patterns.find(p => p.pattern === 'seasonal_trend');
    
    const scheduleOptimization = peakHourPattern ? 
      `Concentrar actividades entre las ${peakHourPattern.data.hour}:00 y ${peakHourPattern.data.hour + 2}:00 para maximizar eficiencia` :
      'Analizar patrones horarios para identificar ventanas de oportunidad';
    
    const resourceAllocation = peakDayPattern ?
      `Asignar más recursos los ${peakDayPattern.data.day} cuando la actividad es ${Math.round((peakDayPattern.data.efficiency - 1) * 100)}% mayor` :
      'Distribuir recursos uniformemente hasta identificar patrones claros';
    
    const campaignTiming = seasonalPattern ?
      `${seasonalPattern.data.direction === 'up' ? 'Intensificar campañas' : 'Implementar estrategias de reactivación'} basado en tendencia ${seasonalPattern.data.direction}` :
      'Mantener campañas consistentes mientras se recopilan más datos';
    
    return {
      scheduleOptimization,
      resourceAllocation,
      campaignTiming
    };
  }
  
  static prepareChartData(analytics: Analytics): {
    primary: Array<{ name: string; value: number; trend?: string }>;
    secondary?: Array<{ name: string; value: number }>;
    annotations?: Array<{ point: string; message: string }>;
  } {
    const { temporal } = analytics;
    
    // Primary data from hourly patterns
    const primary = temporal?.hourlyPatterns?.map(hour => ({
      name: `${hour.hour}:00`,
      value: hour.registrations
    })) || [];
    
    // Secondary data from weekly patterns
    const secondary = temporal?.weeklyPatterns?.map(day => ({
      name: day.day,
      value: day.registrations
    })) || [];
    
    // Annotations for key insights
    const annotations: Array<{ point: string; message: string }> = [];
    
    if (temporal?.hourlyPatterns && temporal.hourlyPatterns.length > 0) {
      const peakHour = temporal.hourlyPatterns.reduce((max, current) => 
        current.registrations > max.registrations ? current : max
      );
      annotations.push({
        point: `${peakHour.hour}:00`,
        message: `Hora pico: ${peakHour.registrations} registros`
      });
    }
    
    return {
      primary,
      secondary,
      annotations
    };
  }
}

// Export utility functions for direct use
export const temporalDataProcessor = {
  extractKeyPatterns: TemporalDataProcessor.extractKeyPatterns,
  generateSmartInsights: TemporalDataProcessor.generateSmartInsights,
  calculateOptimalSchedule: TemporalDataProcessor.calculateOptimalSchedule,
  identifyAnomalies: TemporalDataProcessor.identifyAnomalies,
  generateOptimizedTemporalData: TemporalDataProcessor.generateOptimizedTemporalData
};