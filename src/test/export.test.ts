import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'
import jsPDF from 'jspdf'
import { exportToExcel, exportToPDF, exportInteractiveExcel, exportTableToExcel } from '../utils/export'
import { mockHierarchicalData } from './mockData'

// Mock external dependencies
vi.mock('xlsx', () => ({
  utils: {
    table_to_sheet: vi.fn(),
    json_to_sheet: vi.fn(),
    book_new: vi.fn(),
    book_append_sheet: vi.fn()
  },
  write: vi.fn()
}))

vi.mock('file-saver', () => ({
  saveAs: vi.fn()
}))

vi.mock('jspdf', () => {
  const mockDoc = {
    setFontSize: vi.fn(),
    setTextColor: vi.fn(),
    text: vi.fn(),
    save: vi.fn(),
    addPage: vi.fn(),
    lastAutoTable: { finalY: 100 }
  }
  return {
    default: vi.fn(() => mockDoc)
  }
})

vi.mock('jspdf-autotable', () => ({
  default: vi.fn()
}))

const mockXLSX = XLSX as any
const mockSaveAs = saveAs as any
const mockJsPDF = jsPDF as any

describe('Export Utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Setup default mocks
    mockXLSX.utils.book_new.mockReturnValue({})
    mockXLSX.utils.json_to_sheet.mockReturnValue({})
    mockXLSX.utils.table_to_sheet.mockReturnValue({})
    mockXLSX.write.mockReturnValue(new ArrayBuffer(8))

    // Mock Blob constructor
    global.Blob = vi.fn().mockImplementation((content, options) => ({
      content,
      options,
      size: content[0].byteLength || 0,
      type: options?.type || ''
    })) as any

    // Mock Date for consistent file naming
    vi.setSystemTime(new Date('2024-01-15T10:00:00.000Z'))
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('exportToExcel', () => {
    it('should export hierarchical data to Excel with multiple sheets', () => {
      const selectedItems = ['lider-1', 'lider-2']

      exportToExcel(mockHierarchicalData, selectedItems)

      expect(mockXLSX.utils.book_new).toHaveBeenCalled()
      expect(mockXLSX.utils.json_to_sheet).toHaveBeenCalledTimes(7) // Hierarchical, Flat, Leaders, Brigadistas, Movilizadores, Ciudadanos, Summary
      expect(mockXLSX.utils.book_append_sheet).toHaveBeenCalledTimes(7)
      expect(mockXLSX.write).toHaveBeenCalled()
      expect(mockSaveAs).toHaveBeenCalled()
    })

    it('should include all required database fields in export', () => {
      const selectedItems = ['lider-1']

      exportToExcel(mockHierarchicalData, selectedItems)

      // Verify that json_to_sheet was called with data containing required fields
      const calls = mockXLSX.utils.json_to_sheet.mock.calls
      const hierarchicalCall = calls.find(call =>
        call[0] && call[0].length > 0 && call[0][0]['Nombre']
      )

      expect(hierarchicalCall).toBeDefined()
      const firstRow = hierarchicalCall[0][0]

      // Check for required fields
      expect(firstRow).toHaveProperty('ID')
      expect(firstRow).toHaveProperty('Nombre')
      expect(firstRow).toHaveProperty('Rol')
      expect(firstRow).toHaveProperty('Dirección')
      expect(firstRow).toHaveProperty('Colonia')
      expect(firstRow).toHaveProperty('Sección')
      expect(firstRow).toHaveProperty('Número Celular')
      expect(firstRow).toHaveProperty('Verificado')
      expect(firstRow).toHaveProperty('Clave Electoral')
      expect(firstRow).toHaveProperty('CURP')
      expect(firstRow).toHaveProperty('Entidad')
      expect(firstRow).toHaveProperty('Municipio')
    })

    it('should create separate sheets for each role', () => {
      const selectedItems = ['lider-1', 'lider-2']

      exportToExcel(mockHierarchicalData, selectedItems)

      const appendSheetCalls = mockXLSX.utils.book_append_sheet.mock.calls
      const sheetNames = appendSheetCalls.map(call => call[2])

      expect(sheetNames).toContain('Estructura Jerárquica')
      expect(sheetNames).toContain('Datos Planos')
      expect(sheetNames).toContain('Líderes')
      expect(sheetNames).toContain('Brigadistas')
      expect(sheetNames).toContain('Movilizadores')
      expect(sheetNames).toContain('Ciudadanos')
      expect(sheetNames).toContain('Resumen')
    })

    it('should handle empty selection gracefully', () => {
      exportToExcel(mockHierarchicalData, [])

      expect(mockXLSX.utils.book_new).toHaveBeenCalled()
      expect(mockSaveAs).toHaveBeenCalled()
    })

    it('should generate file with correct timestamp', () => {
      const selectedItems = ['lider-1']

      exportToExcel(mockHierarchicalData, selectedItems)

      const saveAsCall = mockSaveAs.mock.calls[0]
      const fileName = saveAsCall[1]

      expect(fileName).toContain('2024-01-15')
      expect(fileName).toContain('estructura_electoral')
      expect(fileName.endsWith('.xlsx')).toBe(true)
    })

    it('should include hierarchical relationships in export data', () => {
      const selectedItems = ['lider-1']

      exportToExcel(mockHierarchicalData, selectedItems)

      const calls = mockXLSX.utils.json_to_sheet.mock.calls
      const flatDataCall = calls.find(call =>
        call[0] && call[0].length > 0 && call[0][0]['Líder']
      )

      expect(flatDataCall).toBeDefined()
      const citizenRow = flatDataCall[0].find((row: any) => row['Rol'] === 'Ciudadano')

      expect(citizenRow).toHaveProperty('Líder')
      expect(citizenRow).toHaveProperty('Brigadista')
      expect(citizenRow).toHaveProperty('Movilizador')
    })
  })

  describe('exportInteractiveExcel', () => {
    it('should create interactive Excel with grouping', () => {
      const selectedItems = ['lider-1']

      exportInteractiveExcel(mockHierarchicalData, selectedItems)

      expect(mockXLSX.utils.book_new).toHaveBeenCalled()
      expect(mockXLSX.utils.json_to_sheet).toHaveBeenCalledTimes(2) // Interactive + Summary
      expect(mockXLSX.utils.book_append_sheet).toHaveBeenCalledTimes(2)

      const sheetCall = mockXLSX.utils.json_to_sheet.mock.calls[0]
      const worksheet = mockXLSX.utils.json_to_sheet.mock.results[0].value

      // Verify worksheet has grouping configuration
      expect(worksheet).toHaveProperty('!rows')
      expect(worksheet).toHaveProperty('!cols')
    })

    it('should include instructions sheet', () => {
      const selectedItems = ['lider-1']

      exportInteractiveExcel(mockHierarchicalData, selectedItems)

      const appendSheetCalls = mockXLSX.utils.book_append_sheet.mock.calls
      const sheetNames = appendSheetCalls.map(call => call[2])

      expect(sheetNames).toContain('Estructura Interactiva')
      expect(sheetNames).toContain('Resumen e Instrucciones')
    })

    it('should generate correct filename for interactive export', () => {
      const selectedItems = ['lider-1']

      exportInteractiveExcel(mockHierarchicalData, selectedItems)

      const saveAsCall = mockSaveAs.mock.calls[0]
      const fileName = saveAsCall[1]

      expect(fileName).toContain('estructura_interactiva')
      expect(fileName).toContain('2024-01-15')
      expect(fileName.endsWith('.xlsx')).toBe(true)
    })
  })

  describe('exportToPDF', () => {
    it('should create PDF with hierarchical structure', () => {
      const selectedItems = ['lider-1']

      exportToPDF(mockHierarchicalData, selectedItems)

      expect(mockJsPDF).toHaveBeenCalled()

      const docInstance = mockJsPDF.mock.results[0].value
      expect(docInstance.setFontSize).toHaveBeenCalled()
      expect(docInstance.setTextColor).toHaveBeenCalled()
      expect(docInstance.text).toHaveBeenCalled()
      expect(docInstance.save).toHaveBeenCalled()
    })

    it('should include summary section in PDF', () => {
      const selectedItems = ['lider-1', 'lider-2']

      exportToPDF(mockHierarchicalData, selectedItems)

      const docInstance = mockJsPDF.mock.results[0].value
      const textCalls = docInstance.text.mock.calls

      const summaryCall = textCalls.find(call => call[0] === 'Resumen')
      expect(summaryCall).toBeDefined()
    })

    it('should create detailed page with all database fields', () => {
      const selectedItems = ['lider-1']

      exportToPDF(mockHierarchicalData, selectedItems)

      const docInstance = mockJsPDF.mock.results[0].value
      expect(docInstance.addPage).toHaveBeenCalled()

      const textCalls = docInstance.text.mock.calls
      const detailCall = textCalls.find(call =>
        call[0] && call[0].includes('Detalle Completo')
      )
      expect(detailCall).toBeDefined()
    })

    it('should generate PDF with correct filename', () => {
      const selectedItems = ['lider-1']

      exportToPDF(mockHierarchicalData, selectedItems)

      const docInstance = mockJsPDF.mock.results[0].value
      const saveCall = docInstance.save.mock.calls[0]
      const fileName = saveCall[0]

      expect(fileName).toContain('estructura_electoral')
      expect(fileName).toContain('2024-01-15')
      expect(fileName.endsWith('.pdf')).toBe(true)
    })

    it('should handle empty selection in PDF export', () => {
      exportToPDF(mockHierarchicalData, [])

      expect(mockJsPDF).toHaveBeenCalled()

      const docInstance = mockJsPDF.mock.results[0].value
      expect(docInstance.save).toHaveBeenCalled()
    })
  })

  describe('exportTableToExcel', () => {
    it('should export HTML table to Excel', () => {
      // Mock DOM element
      const mockTable = {
        id: 'test-table'
      }

      document.getElementById = vi.fn().mockReturnValue(mockTable)

      exportTableToExcel('test-table', 'test-export')

      expect(document.getElementById).toHaveBeenCalledWith('test-table')
      expect(mockXLSX.utils.table_to_sheet).toHaveBeenCalledWith(mockTable)
      expect(mockXLSX.utils.book_new).toHaveBeenCalled()
      expect(mockXLSX.utils.book_append_sheet).toHaveBeenCalled()
      expect(mockSaveAs).toHaveBeenCalled()
    })

    it('should handle missing table element', () => {
      document.getElementById = vi.fn().mockReturnValue(null)

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { })

      exportTableToExcel('non-existent-table')

      expect(consoleSpy).toHaveBeenCalledWith('No se encontró la tabla con ID: non-existent-table')
      expect(mockXLSX.utils.table_to_sheet).not.toHaveBeenCalled()

      consoleSpy.mockRestore()
    })

    it('should use default filename when not provided', () => {
      const mockTable = { id: 'test-table' }
      document.getElementById = vi.fn().mockReturnValue(mockTable)

      exportTableToExcel('test-table')

      const saveAsCall = mockSaveAs.mock.calls[0]
      const fileName = saveAsCall[1]

      expect(fileName).toContain('tabla_datos')
      expect(fileName).toContain('2024-01-15')
    })
  })

  describe('data filtering and selection', () => {
    it('should filter data based on selected items', () => {
      const selectedItems = ['lider-1'] // Only select first leader

      exportToExcel(mockHierarchicalData, selectedItems)

      const calls = mockXLSX.utils.json_to_sheet.mock.calls
      const hierarchicalCall = calls[0]

      // Should only include data related to lider-1
      const exportedData = hierarchicalCall[0]
      const leaderIds = exportedData
        .filter((row: any) => row['Rol'] === 'Líder')
        .map((row: any) => row['ID Sin Formato'])

      expect(leaderIds).toContain('lider-1')
      expect(leaderIds).not.toContain('lider-2')
    })

    it('should include complete hierarchy for selected leaders', () => {
      const selectedItems = ['lider-1']

      exportToExcel(mockHierarchicalData, selectedItems)

      const calls = mockXLSX.utils.json_to_sheet.mock.calls
      const flatDataCall = calls.find(call =>
        call[0] && call[0].length > 0 && call[0][0]['Líder']
      )

      const exportedData = flatDataCall[0]
      const roles = exportedData.map((row: any) => row['Rol'])

      // Should include all roles in the hierarchy
      expect(roles).toContain('Líder')
      expect(roles).toContain('Brigadista')
      expect(roles).toContain('Movilizador')
      expect(roles).toContain('Ciudadano')
    })

    it('should calculate correct summary statistics', () => {
      const selectedItems = ['lider-1', 'lider-2']

      exportToExcel(mockHierarchicalData, selectedItems)

      const calls = mockXLSX.utils.json_to_sheet.mock.calls
      const summaryCall = calls.find(call =>
        call[0] && call[0].length > 0 && call[0][0]['Concepto']
      )

      expect(summaryCall).toBeDefined()
      const summaryData = summaryCall[0]

      const totalLeaders = summaryData.find((row: any) => row['Concepto'] === 'Total Líderes Seleccionados')
      expect(totalLeaders).toBeDefined()
      expect(totalLeaders['Cantidad']).toBe(2)
    })
  })

  describe('field validation', () => {
    it('should include all required database fields in Excel export', () => {
      const selectedItems = ['lider-1']

      exportToExcel(mockHierarchicalData, selectedItems)

      const calls = mockXLSX.utils.json_to_sheet.mock.calls
      const detailedCall = calls.find(call =>
        call[0] && call[0].length > 0 && call[0][0]['Clave Electoral']
      )

      expect(detailedCall).toBeDefined()
      const firstRow = detailedCall[0][0]

      // Verify all required fields are present
      const requiredFields = [
        'ID', 'Nombre', 'Rol', 'Clave Electoral', 'CURP', 'Sección',
        'Entidad', 'Municipio', 'Dirección', 'Colonia', 'Código Postal',
        'Número Celular', 'Verificado', 'Fecha Registro'
      ]

      requiredFields.forEach(field => {
        expect(firstRow).toHaveProperty(field)
      })
    })

    it('should handle missing optional fields gracefully', () => {
      // Create test data with missing optional fields
      const incompleteData = [{
        ...mockHierarchicalData[0],
        direccion: undefined,
        colonia: undefined,
        numero_cel: undefined
      }]

      const selectedItems = ['lider-1']

      expect(() => {
        exportToExcel(incompleteData, selectedItems)
      }).not.toThrow()

      expect(mockSaveAs).toHaveBeenCalled()
    })

    it('should format verification status correctly', () => {
      const selectedItems = ['lider-1']

      exportToExcel(mockHierarchicalData, selectedItems)

      const calls = mockXLSX.utils.json_to_sheet.mock.calls
      const dataCall = calls.find(call =>
        call[0] && call[0].length > 0 && call[0][0]['Verificado']
      )

      expect(dataCall).toBeDefined()
      const exportedData = dataCall[0]

      exportedData.forEach((row: any) => {
        if (row['Verificado'] !== '') {
          expect(['Sí', 'No']).toContain(row['Verificado'])
        }
      })
    })
  })
})