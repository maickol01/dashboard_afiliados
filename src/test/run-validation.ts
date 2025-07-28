/**
 * Test runner for database integration validation
 */

import { validator } from './database-integration-validator';

async function runValidation() {
  console.log('🚀 Starting Database Integration Validation...\n');
  
  try {
    const summary = await validator.runAllValidations();
    
    console.log('\n📊 VALIDATION SUMMARY');
    console.log('='.repeat(50));
    console.log(`Total Tests: ${summary.totalTests}`);
    console.log(`Passed: ${summary.passedTests}`);
    console.log(`Failed: ${summary.failedTests}`);
    console.log(`Success Rate: ${summary.successRate.toFixed(1)}%`);
    console.log(`Total Duration: ${summary.totalDuration}ms`);
    
    if (summary.failedTests > 0) {
      console.log('\n❌ FAILED TESTS:');
      summary.results
        .filter(r => !r.passed)
        .forEach(result => {
          console.log(`- ${result.testName}: ${result.details}`);
        });
    }
    
    // Export detailed report
    const report = validator.exportResults(summary);
    console.log('\n📄 Detailed report generated');
    
    // Return summary for further processing
    return summary;
    
  } catch (error) {
    console.error('💥 Validation failed with error:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  runValidation()
    .then(summary => {
      process.exit(summary.failedTests > 0 ? 1 : 0);
    })
    .catch(() => {
      process.exit(1);
    });
}

export { runValidation };