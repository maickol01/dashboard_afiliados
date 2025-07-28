/**
 * Export functionality validation
 * Tests Excel and PDF export with real database data
 */

import { Person } from '../types';
import { exportToExcel, exportToPDF, exportInteractiveExcel } from '../utils/export';

export interface ExportValidationResult {
  testName: string;
  passed: boolean;
  details: string;
  fileGenerated?: boolean;
  fieldsIncluded?: string[];
  excludedFields?: string[];
}

export class ExportValidator {
  async validateExcelExport(data: Person[], selectedIds: string[]): Promise<ExportValidationResult> {
    try {
      console.log('📊 Testing Excel export functionality...');
      
      // Test basic Excel export
      const result = await this.testExcelGeneration(data, selectedIds);
      
      return {
        testName: 'Excel Export',
        passed: true,
        details: 'Excel export functionality validated successfully',
        fileGenerated: result.fileGenerated,
        fieldsIncluded: result.fieldsIncluded,
        excludedFields: result.excludedFields
      };
      
    } catch (error) {
      return {
        testName: 'Excel Export',
        passed: false,
        details: error instanceof Error ? error.message : 'Unknown error',
        fileGenerated: false
      };
    }
  }

  async validatePDFExport(data: Person[], selectedIds: string[]): Promise<ExportValidationResult> {
    try {
      console.log('📄 Testing PDF export functionality...');
      
      // Test PDF export
      const result = await this.testPDFGeneration(data, selectedIds);
      
      return {
        testName: 'PDF Export',
        passed: true,
        details: 'PDF export functionality validated successfully',
        fileGenerated: result.fileGenerated,
        fieldsIncluded: result.fieldsIncluded
      };
      
    } catch (error) {
      return {
        testName: 'PDF Export',
        passed: false,
        details: error instanceof Error ? error.message : 'Unknown error',
        fileGenerated: false
      };
    }
  }

  async validateInteractiveExcelExport(data: Person[], selectedIds: string[]): Promise<ExportValidationResult> {
    try {
      console.log('📈 Testing Interactive Excel export functionality...');
      
      // Test interactive Excel export
      const result = await this.testInteractiveExcelGeneration(data, selectedIds);
      
      return {
        testName: 'Interactive Excel Export',
        passed: true,
        details: 'Interactive Excel export functionality validated successfully',
        fileGenerated: result.fileGenerated,
        fieldsIncluded: result.fieldsIncluded,
        excludedFields: result.excludedFields
      };
      
    } catch (error) {
      return {
        testName: 'Interactive Excel Export',
        passed: false,
        details: error instanceof Error ? error.message : 'Unknown error',
        fileGenerated: false
      };
    }
  }

  private async testExcelGeneration(data: Person[], selectedIds: string[]) {
    // Mock the export function to validate data structure
    const originalExport = exportToExcel;
    let capturedData: any[] = [];
    let fieldsIncluded: string[] = [];
    let excludedFields: string[] = [];
    
    // Temporarily override export function to capture data
    (global as any).exportToExcel = (exportData: Person[], ids: string[]) => {
      capturedData = exportData;
      
      // Validate that all required database fields are included
      const requiredFields = [
        'id', 'nombre', 'role', 'created_at',
        'clave_electoral', 'curp', 'direccion', 'colonia',
        'codigo_postal', 'seccion', 'entidad', 'municipio',
        'numero_cel', 'num_verificado'
      ];
      
      const sampleRecord = exportData[0];
      if (sampleRecord) {
        fieldsIncluded = Object.keys(sampleRecord).filter(key => 
          requiredFields.includes(key) && sampleRecord[key as keyof Person] !== undefined
        );
        
        // Check that verification_token is excluded
        if ('verification_token' in sampleRecord) {
          throw new Error('verification_token field should be excluded from export');
        }
        excludedFields.push('verification_token');
      }
      
      console.log('Excel export data captured for validation');
      return Promise.resolve();
    };
    
    try {
      // Call the export function
      await exportToExcel(data, selectedIds);
      
      // Validate the captured data
      if (capturedData.length === 0) {
        throw new Error('No data was processed for export');
      }
      
      // Validate that selected items are included
      if (selectedIds.length > 0) {
        const exportedIds = capturedData.map(item => item.id);
        const missingIds = selectedIds.filter(id => !exportedIds.includes(id));
        
        if (missingIds.length > 0) {
          throw new Error(`Selected items missing from export: ${missingIds.join(', ')}`);
        }
      }
      
      return {
        fileGenerated: true,
        fieldsIncluded,
        excludedFields
      };
      
    } finally {
      // Restore original function
      (global as any).exportToExcel = originalExport;
    }
  }

  private async testPDFGeneration(data: Person[], selectedIds: string[]) {
    // Mock the PDF export function
    let capturedData: any[] = [];
    let fieldsIncluded: string[] = [];
    
    const originalExport = exportToPDF;
    
    (global as any).exportToPDF = (exportData: Person[], ids: string[]) => {
      capturedData = exportData;
      
      // Validate PDF data structure
      const sampleRecord = exportData[0];
      if (sampleRecord) {
        fieldsIncluded = Object.keys(sampleRecord).filter(key => 
          sampleRecord[key as keyof Person] !== undefined
        );
      }
      
      console.log('PDF export data captured for validation');
      return Promise.resolve();
    };
    
    try {
      await exportToPDF(data, selectedIds);
      
      if (capturedData.length === 0) {
        throw new Error('No data was processed for PDF export');
      }
      
      return {
        fileGenerated: true,
        fieldsIncluded
      };
      
    } finally {
      (global as any).exportToPDF = originalExport;
    }
  }

  private async testInteractiveExcelGeneration(data: Person[], selectedIds: string[]) {
    // Mock the interactive Excel export function
    let capturedData: any[] = [];
    let fieldsIncluded: string[] = [];
    let excludedFields: string[] = [];
    
    const originalExport = exportInteractiveExcel;
    
    (global as any).exportInteractiveExcel = (exportData: Person[], ids: string[]) => {
      capturedData = exportData;
      
      // Validate interactive Excel data structure
      const sampleRecord = exportData[0];
      if (sampleRecord) {
        const allDatabaseFields = [
          'id', 'nombre', 'role', 'created_at',
          'clave_electoral', 'curp', 'direccion', 'colonia',
          'codigo_postal', 'seccion', 'entidad', 'municipio',
          'numero_cel', 'num_verificado', 'lider_id', 'brigadista_id', 'movilizador_id'
        ];
        
        fieldsIncluded = Object.keys(sampleRecord).filter(key => 
          allDatabaseFields.includes(key) && sampleRecord[key as keyof Person] !== undefined
        );
        
        // Ensure verification_token is excluded
        if ('verification_token' in sampleRecord) {
          throw new Error('verification_token should be excluded from interactive Excel export');
        }
        excludedFields.push('verification_token');
      }
      
      console.log('Interactive Excel export data captured for validation');
      return Promise.resolve();
    };
    
    try {
      await exportInteractiveExcel(data, selectedIds);
      
      if (capturedData.length === 0) {
        throw new Error('No data was processed for interactive Excel export');
      }
      
      return {
        fileGenerated: true,
        fieldsIncluded,
        excludedFields
      };
      
    } finally {
      (global as any).exportInteractiveExcel = originalExport;
    }
  }

  async validateExportCompleteness(data: Person[]): Promise<ExportValidationResult> {
    try {
      console.log('🔍 Validating export data completeness...');
      
      // Check that all required database fields are present in the data
      const requiredFields = [
        'id', 'nombre', 'role', 'created_at',
        'direccion', 'colonia', 'seccion', 'numero_cel'
      ];
      
      const sampleRecord = data[0];
      if (!sampleRecord) {
        throw new Error('No data available for export validation');
      }
      
      const missingFields = requiredFields.filter(field => 
        !(field in sampleRecord) || sampleRecord[field as keyof Person] === undefined
      );
      
      if (missingFields.length > 0) {
        throw new Error(`Missing required fields for export: ${missingFields.join(', ')}`);
      }
      
      // Validate that verification_token is not present
      if ('verification_token' in sampleRecord) {
        throw new Error('verification_token field should not be present in export data');
      }
      
      // Validate role-specific fields
      const roleSpecificValidation = this.validateRoleSpecificFields(data);
      
      return {
        testName: 'Export Data Completeness',
        passed: true,
        details: `Export data completeness validated. ${roleSpecificValidation}`,
        fieldsIncluded: Object.keys(sampleRecord).filter(key => 
          sampleRecord[key as keyof Person] !== undefined
        ),
        excludedFields: ['verification_token']
      };
      
    } catch (error) {
      return {
        testName: 'Export Data Completeness',
        passed: false,
        details: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private validateRoleSpecificFields(data: Person[]): string {
    const roleFieldValidation: string[] = [];
    
    // Check brigadistas have lider_id
    const brigadistas = data.filter(p => p.role === 'brigadista');
    if (brigadistas.length > 0) {
      const brigadistasWithLiderId = brigadistas.filter(b => b.lider_id);
      roleFieldValidation.push(`Brigadistas with lider_id: ${brigadistasWithLiderId.length}/${brigadistas.length}`);
    }
    
    // Check movilizadores have brigadista_id
    const movilizadores = data.filter(p => p.role === 'movilizador');
    if (movilizadores.length > 0) {
      const movilizadoresWithBrigadistaId = movilizadores.filter(m => m.brigadista_id);
      roleFieldValidation.push(`Movilizadores with brigadista_id: ${movilizadoresWithBrigadistaId.length}/${movilizadores.length}`);
    }
    
    // Check ciudadanos have movilizador_id
    const ciudadanos = data.filter(p => p.role === 'ciudadano');
    if (ciudadanos.length > 0) {
      const ciudadanosWithMovilizadorId = ciudadanos.filter(c => c.movilizador_id);
      roleFieldValidation.push(`Ciudadanos with movilizador_id: ${ciudadanosWithMovilizadorId.length}/${ciudadanos.length}`);
    }
    
    return roleFieldValidation.join(', ');
  }

  async runAllExportValidations(data: Person[], selectedIds: string[]): Promise<ExportValidationResult[]> {
    console.log('📤 Running comprehensive export validation...');
    
    const results: ExportValidationResult[] = [];
    
    // Test all export functions
    results.push(await this.validateExcelExport(data, selectedIds));
    results.push(await this.validatePDFExport(data, selectedIds));
    results.push(await this.validateInteractiveExcelExport(data, selectedIds));
    results.push(await this.validateExportCompleteness(data));
    
    // Summary
    const passedTests = results.filter(r => r.passed).length;
    const totalTests = results.length;
    
    console.log(`📊 Export validation summary: ${passedTests}/${totalTests} tests passed`);
    
    return results;
  }
}

export const exportValidator = new ExportValidator();