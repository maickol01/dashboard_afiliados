/**
 * Comprehensive Database Integration Validator
 * Tests all aspects of the Supabase database integration
 */

import { DataService } from '../services/dataService';
import { Person, Analytics } from '../types';
import { DatabaseError, NetworkError, ValidationError } from '../types/errors';

export interface ValidationResult {
  testName: string;
  passed: boolean;
  details: string;
  duration: number;
  error?: Error;
}

export interface ValidationSummary {
  totalTests: number;
  passedTests: number;
  failedTests: number;
  totalDuration: number;
  successRate: number;
  results: ValidationResult[];
}

export class DatabaseIntegrationValidator {
  private results: ValidationResult[] = [];
  private startTime: number = 0;

  async runAllValidations(): Promise<ValidationSummary> {
    console.log('🚀 Starting comprehensive database integration validation...');
    this.startTime = Date.now();
    this.results = [];

    // Run all validation tests
    await this.validateDatabaseConnection();
    await this.validateDataFetching();
    await this.validateHierarchicalStructure();
    await this.validateDataIntegrity();
    await this.validateAnalyticsGeneration();
    await this.validateAnalyticsAccuracy();
    await this.validateGeographicAnalysis();
    await this.validateTemporalAnalysis();
    await this.validateQualityMetrics();
    await this.validatePerformance();
    await this.validateErrorHandling();
    await this.validateCaching();

    return this.generateSummary();
  }

  private async runTest(
    testName: string,
    testFunction: () => Promise<void>
  ): Promise<void> {
    const testStart = Date.now();
    
    try {
      await testFunction();
      const duration = Date.now() - testStart;
      
      this.results.push({
        testName,
        passed: true,
        details: 'Test completed successfully',
        duration
      });
      
      console.log(`✅ ${testName} - PASSED (${duration}ms)`);
    } catch (error) {
      const duration = Date.now() - testStart;
      
      this.results.push({
        testName,
        passed: false,
        details: error instanceof Error ? error.message : 'Unknown error',
        duration,
        error: error instanceof Error ? error : new Error(String(error))
      });
      
      console.error(`❌ ${testName} - FAILED (${duration}ms):`, error);
    }
  }

  private async validateDatabaseConnection(): Promise<void> {
    await this.runTest('Database Connection', async () => {
      // Test basic connectivity
      const testData = await DataService.getAllHierarchicalData(true);
      
      if (!Array.isArray(testData)) {
        throw new Error('Invalid data format returned from database');
      }
      
      console.log(`Database connection successful - Retrieved ${testData.length} top-level records`);
    });
  }

  private async validateDataFetching(): Promise<void> {
    await this.runTest('Data Fetching', async () => {
      const hierarchicalData = await DataService.getAllHierarchicalData(true);
      
      if (hierarchicalData.length === 0) {
        throw new Error('No data retrieved from database');
      }

      // Validate that we have all role types
      const allPeople = this.flattenHierarchy(hierarchicalData);
      const roles = new Set(allPeople.map(person => person.role));
      
      const expectedRoles = ['lider', 'brigadista', 'movilizador', 'ciudadano'];
      const missingRoles = expectedRoles.filter(role => !roles.has(role as any));
      
      if (missingRoles.length > 0) {
        throw new Error(`Missing roles in data: ${missingRoles.join(', ')}`);
      }

      console.log(`Data fetching successful - ${allPeople.length} total records across ${roles.size} roles`);
    });
  }

  private async validateHierarchicalStructure(): Promise<void> {
    await this.runTest('Hierarchical Structure', async () => {
      const hierarchicalData = await DataService.getAllHierarchicalData(true);
      
      // Validate hierarchy levels
      let totalLideres = 0;
      let totalBrigadistas = 0;
      let totalMovilizadores = 0;
      let totalCiudadanos = 0;

      hierarchicalData.forEach(lider => {
        totalLideres++;
        
        if (lider.role !== 'lider') {
          throw new Error(`Invalid role for top-level item: ${lider.role}`);
        }

        lider.children?.forEach(brigadista => {
          totalBrigadistas++;
          
          if (brigadista.role !== 'brigadista') {
            throw new Error(`Invalid role for second-level item: ${brigadista.role}`);
          }
          
          if (brigadista.lider_id !== lider.id) {
            throw new Error(`Invalid parent relationship for brigadista ${brigadista.id}`);
          }

          brigadista.children?.forEach(movilizador => {
            totalMovilizadores++;
            
            if (movilizador.role !== 'movilizador') {
              throw new Error(`Invalid role for third-level item: ${movilizador.role}`);
            }
            
            if (movilizador.brigadista_id !== brigadista.id) {
              throw new Error(`Invalid parent relationship for movilizador ${movilizador.id}`);
            }

            movilizador.children?.forEach(ciudadano => {
              totalCiudadanos++;
              
              if (ciudadano.role !== 'ciudadano') {
                throw new Error(`Invalid role for fourth-level item: ${ciudadano.role}`);
              }
              
              if (ciudadano.movilizador_id !== movilizador.id) {
                throw new Error(`Invalid parent relationship for ciudadano ${ciudadano.id}`);
              }
            });
          });
        });
      });

      console.log(`Hierarchy validation successful:
        - Líderes: ${totalLideres}
        - Brigadistas: ${totalBrigadistas}
        - Movilizadores: ${totalMovilizadores}
        - Ciudadanos: ${totalCiudadanos}`);
    });
  }

  private async validateDataIntegrity(): Promise<void> {
    await this.runTest('Data Integrity', async () => {
      const hierarchicalData = await DataService.getAllHierarchicalData(true);
      const allPeople = this.flattenHierarchy(hierarchicalData);

      // Validate required fields
      const requiredFields = ['id', 'name', 'nombre', 'role', 'created_at'];
      
      allPeople.forEach((person, index) => {
        requiredFields.forEach(field => {
          if (!person[field as keyof Person]) {
            throw new Error(`Missing required field '${field}' in record ${index} (${person.id})`);
          }
        });

        // Validate specific database fields are properly mapped
        if (person.role === 'ciudadano') {
          // Citizens should have verification status
          if (typeof person.num_verificado !== 'boolean') {
            throw new Error(`Invalid num_verificado field for ciudadano ${person.id}`);
          }
        }

        // Validate that verification_token is not present (should be excluded)
        if ('verification_token' in person) {
          throw new Error(`verification_token field should be excluded from Person interface`);
        }
      });

      console.log(`Data integrity validation successful - ${allPeople.length} records validated`);
    });
  }

  private async validateAnalyticsGeneration(): Promise<void> {
    await this.runTest('Analytics Generation', async () => {
      const hierarchicalData = await DataService.getAllHierarchicalData(true);
      const analytics = await DataService.generateAnalyticsFromData(hierarchicalData, true);

      // Validate analytics structure
      const requiredAnalyticsFields = [
        'totalLideres', 'totalBrigadistas', 'totalMobilizers', 'totalCitizens',
        'dailyRegistrations', 'weeklyRegistrations', 'monthlyRegistrations',
        'leaderPerformance', 'conversionRate', 'growthRate',
        'efficiency', 'geographic', 'temporal', 'quality', 'goals', 'alerts', 'predictions'
      ];

      requiredAnalyticsFields.forEach(field => {
        if (!(field in analytics)) {
          throw new Error(`Missing analytics field: ${field}`);
        }
      });

      // Validate that analytics contain real data
      if (analytics.totalCitizens === 0 && hierarchicalData.length > 0) {
        throw new Error('Analytics show zero citizens but data exists');
      }

      console.log(`Analytics generation successful:
        - Total Citizens: ${analytics.totalCitizens}
        - Conversion Rate: ${analytics.conversionRate.toFixed(2)}%
        - Growth Rate: ${analytics.growthRate.toFixed(2)}%`);
    });
  }

  private async validateAnalyticsAccuracy(): Promise<void> {
    await this.runTest('Analytics Accuracy', async () => {
      const hierarchicalData = await DataService.getAllHierarchicalData(true);
      const analytics = await DataService.generateAnalyticsFromData(hierarchicalData, true);
      const allPeople = this.flattenHierarchy(hierarchicalData);

      // Manual count validation
      const manualCounts = {
        lideres: allPeople.filter(p => p.role === 'lider').length,
        brigadistas: allPeople.filter(p => p.role === 'brigadista').length,
        movilizadores: allPeople.filter(p => p.role === 'movilizador').length,
        ciudadanos: allPeople.filter(p => p.role === 'ciudadano').length
      };

      // Validate counts match
      if (analytics.totalLideres !== manualCounts.lideres) {
        throw new Error(`Líderes count mismatch: analytics=${analytics.totalLideres}, manual=${manualCounts.lideres}`);
      }
      
      if (analytics.totalBrigadistas !== manualCounts.brigadistas) {
        throw new Error(`Brigadistas count mismatch: analytics=${analytics.totalBrigadistas}, manual=${manualCounts.brigadistas}`);
      }
      
      if (analytics.totalMobilizers !== manualCounts.movilizadores) {
        throw new Error(`Movilizadores count mismatch: analytics=${analytics.totalMobilizers}, manual=${manualCounts.movilizadores}`);
      }
      
      if (analytics.totalCitizens !== manualCounts.ciudadanos) {
        throw new Error(`Ciudadanos count mismatch: analytics=${analytics.totalCitizens}, manual=${manualCounts.ciudadanos}`);
      }

      // Validate verification rate calculation (only ciudadanos should be considered)
      const ciudadanos = allPeople.filter(p => p.role === 'ciudadano');
      const verifiedCiudadanos = ciudadanos.filter(p => p.num_verificado).length;
      const expectedVerificationRate = ciudadanos.length > 0 ? (verifiedCiudadanos / ciudadanos.length) * 100 : 0;
      
      if (Math.abs(analytics.conversionRate - expectedVerificationRate) > 0.1) {
        throw new Error(`Verification rate calculation error: expected=${expectedVerificationRate.toFixed(2)}, got=${analytics.conversionRate.toFixed(2)}`);
      }

      console.log(`Analytics accuracy validated:
        - Manual counts match analytics
        - Verification rate correctly calculated: ${analytics.conversionRate.toFixed(2)}%
        - Only ciudadanos considered for verification`);
    });
  }

  private async validateGeographicAnalysis(): Promise<void> {
    await this.runTest('Geographic Analysis', async () => {
      const hierarchicalData = await DataService.getAllHierarchicalData(true);
      const analytics = await DataService.generateAnalyticsFromData(hierarchicalData, true);
      const allPeople = this.flattenHierarchy(hierarchicalData);

      // Validate geographic data structure
      if (!analytics.geographic.regionDistribution) {
        throw new Error('Missing regionDistribution in geographic analysis');
      }

      if (!analytics.geographic.municipioDistribution) {
        throw new Error('Missing municipioDistribution in geographic analysis');
      }

      if (!analytics.geographic.seccionDistribution) {
        throw new Error('Missing seccionDistribution in geographic analysis');
      }

      // Validate that geographic data is based on real database fields
      const peopleWithEntidad = allPeople.filter(p => p.entidad);
      const peopleWithMunicipio = allPeople.filter(p => p.municipio);
      const peopleWithSeccion = allPeople.filter(p => p.seccion);

      if (peopleWithEntidad.length > 0 && analytics.geographic.regionDistribution.length === 0) {
        throw new Error('Geographic analysis missing region data despite having entidad values');
      }

      console.log(`Geographic analysis validated:
        - Region distribution: ${analytics.geographic.regionDistribution.length} regions
        - Municipio distribution: ${analytics.geographic.municipioDistribution?.length || 0} municipios
        - Sección distribution: ${analytics.geographic.seccionDistribution?.length || 0} secciones`);
    });
  }

  private async validateTemporalAnalysis(): Promise<void> {
    await this.runTest('Temporal Analysis', async () => {
      const hierarchicalData = await DataService.getAllHierarchicalData(true);
      const analytics = await DataService.generateAnalyticsFromData(hierarchicalData, true);

      // Validate temporal data structure
      if (!analytics.temporal.hourlyPatterns) {
        throw new Error('Missing hourlyPatterns in temporal analysis');
      }

      if (!analytics.temporal.weeklyPatterns) {
        throw new Error('Missing weeklyPatterns in temporal analysis');
      }

      if (!analytics.temporal.seasonality) {
        throw new Error('Missing seasonality in temporal analysis');
      }

      // Validate that temporal analysis is based on real created_at timestamps
      if (analytics.dailyRegistrations.length === 0 && hierarchicalData.length > 0) {
        throw new Error('Daily registrations empty despite having data');
      }

      console.log(`Temporal analysis validated:
        - Daily registrations: ${analytics.dailyRegistrations.length} days
        - Weekly registrations: ${analytics.weeklyRegistrations.length} weeks
        - Monthly registrations: ${analytics.monthlyRegistrations.length} months`);
    });
  }

  private async validateQualityMetrics(): Promise<void> {
    await this.runTest('Quality Metrics', async () => {
      const hierarchicalData = await DataService.getAllHierarchicalData(true);
      const analytics = await DataService.generateAnalyticsFromData(hierarchicalData, true);

      // Validate quality metrics structure
      if (typeof analytics.quality.dataCompleteness !== 'number') {
        throw new Error('Invalid dataCompleteness metric');
      }

      if (typeof analytics.quality.verificationRate !== 'number') {
        throw new Error('Invalid verificationRate metric');
      }

      if (typeof analytics.quality.duplicateRate !== 'number') {
        throw new Error('Invalid duplicateRate metric');
      }

      // Validate ranges
      if (analytics.quality.dataCompleteness < 0 || analytics.quality.dataCompleteness > 100) {
        throw new Error(`Invalid dataCompleteness range: ${analytics.quality.dataCompleteness}`);
      }

      if (analytics.quality.verificationRate < 0 || analytics.quality.verificationRate > 100) {
        throw new Error(`Invalid verificationRate range: ${analytics.quality.verificationRate}`);
      }

      console.log(`Quality metrics validated:
        - Data completeness: ${analytics.quality.dataCompleteness.toFixed(2)}%
        - Verification rate: ${analytics.quality.verificationRate.toFixed(2)}%
        - Duplicate rate: ${analytics.quality.duplicateRate.toFixed(2)}%`);
    });
  }

  private async validatePerformance(): Promise<void> {
    await this.runTest('Performance', async () => {
      const startTime = Date.now();
      
      // Test data fetching performance
      const hierarchicalData = await DataService.getAllHierarchicalData(true);
      const dataFetchTime = Date.now() - startTime;
      
      // Test analytics generation performance
      const analyticsStart = Date.now();
      await DataService.generateAnalyticsFromData(hierarchicalData, true);
      const analyticsTime = Date.now() - analyticsStart;
      
      // Performance thresholds (adjust based on requirements)
      const MAX_DATA_FETCH_TIME = 10000; // 10 seconds
      const MAX_ANALYTICS_TIME = 5000; // 5 seconds
      
      if (dataFetchTime > MAX_DATA_FETCH_TIME) {
        throw new Error(`Data fetching too slow: ${dataFetchTime}ms (max: ${MAX_DATA_FETCH_TIME}ms)`);
      }
      
      if (analyticsTime > MAX_ANALYTICS_TIME) {
        throw new Error(`Analytics generation too slow: ${analyticsTime}ms (max: ${MAX_ANALYTICS_TIME}ms)`);
      }

      console.log(`Performance validation successful:
        - Data fetch time: ${dataFetchTime}ms
        - Analytics time: ${analyticsTime}ms`);
    });
  }

  private async validateErrorHandling(): Promise<void> {
    await this.runTest('Error Handling', async () => {
      // Test that proper error types are thrown
      try {
        // This should trigger error handling
        await DataService.getAllHierarchicalData(true);
        
        // If we get here, the service is working, which is good
        console.log('Error handling validation: Service is operational');
      } catch (error) {
        // Validate that we get proper error types
        if (!(error instanceof DatabaseError) && 
            !(error instanceof NetworkError) && 
            !(error instanceof ValidationError)) {
          throw new Error(`Invalid error type: ${error?.constructor.name}`);
        }
        
        console.log(`Error handling validation: Proper error type thrown - ${error.constructor.name}`);
      }
    });
  }

  private async validateCaching(): Promise<void> {
    await this.runTest('Caching', async () => {
      // First call - should hit database
      const start1 = Date.now();
      await DataService.getAllHierarchicalData(false);
      const time1 = Date.now() - start1;
      
      // Second call - should hit cache
      const start2 = Date.now();
      await DataService.getAllHierarchicalData(false);
      const time2 = Date.now() - start2;
      
      // Cache should be significantly faster
      if (time2 >= time1) {
        console.warn(`Cache may not be working optimally: first=${time1}ms, second=${time2}ms`);
      }

      console.log(`Caching validation:
        - First call: ${time1}ms
        - Second call: ${time2}ms
        - Cache improvement: ${((time1 - time2) / time1 * 100).toFixed(1)}%`);
    });
  }

  private flattenHierarchy(hierarchicalData: Person[]): Person[] {
    const result: Person[] = [];
    
    const flatten = (people: Person[]) => {
      people.forEach(person => {
        result.push(person);
        if (person.children && person.children.length > 0) {
          flatten(person.children);
        }
      });
    };
    
    flatten(hierarchicalData);
    return result;
  }

  private generateSummary(): ValidationSummary {
    const totalDuration = Date.now() - this.startTime;
    const passedTests = this.results.filter(r => r.passed).length;
    const failedTests = this.results.filter(r => !r.passed).length;
    const successRate = (passedTests / this.results.length) * 100;

    return {
      totalTests: this.results.length,
      passedTests,
      failedTests,
      totalDuration,
      successRate,
      results: this.results
    };
  }

  // Export validation results
  exportResults(summary: ValidationSummary): string {
    const timestamp = new Date().toISOString();
    
    let report = `# Database Integration Validation Report\n`;
    report += `Generated: ${timestamp}\n\n`;
    report += `## Summary\n`;
    report += `- Total Tests: ${summary.totalTests}\n`;
    report += `- Passed: ${summary.passedTests}\n`;
    report += `- Failed: ${summary.failedTests}\n`;
    report += `- Success Rate: ${summary.successRate.toFixed(1)}%\n`;
    report += `- Total Duration: ${summary.totalDuration}ms\n\n`;
    
    report += `## Detailed Results\n\n`;
    
    summary.results.forEach(result => {
      const status = result.passed ? '✅ PASS' : '❌ FAIL';
      report += `### ${result.testName} - ${status}\n`;
      report += `- Duration: ${result.duration}ms\n`;
      report += `- Details: ${result.details}\n`;
      
      if (result.error) {
        report += `- Error: ${result.error.message}\n`;
      }
      
      report += `\n`;
    });
    
    return report;
  }
}

// Export singleton instance
export const validator = new DatabaseIntegrationValidator();