import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList, Cell } from 'recharts';
import { AlertTriangle, TrendingUp, Users, Filter, ArrowUpDown, Download, Eye, X, FileText, FileSpreadsheet } from 'lucide-react';
import { SectionStackedBarChartProps, NavojoaElectoralSection } from '../../../types/navojoa-electoral';
import { useMobileDetection } from '../../../hooks/useMobileDetection';

// Types for new functionality
type DensityFilter = 'all' | 'high' | 'medium' | 'low';
type SortOption = 'registrations-desc' | 'registrations-asc' | 'section-asc' | 'section-desc';

// Extended section type with density properties
interface ExtendedSection extends NavojoaElectoralSection {
  densityLevel: 'high' | 'medium' | 'low';
  densityColor: string;
  verificationRate: number;
}

interface SectionDetailModalProps {
  section: ExtendedSection | null;
  isOpen: boolean;
  onClose: () => void;
}

interface TooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
}

interface LabelProps {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  value?: number;
}

const SectionVerticalBarChart: React.FC<SectionStackedBarChartProps> = ({ 
  sectionData, 
  onSectionClick,
  loading = false 
}) => {
  const { isMobile } = useMobileDetection();
  
  // State for new functionality
  const [densityFilter, setDensityFilter] = useState<DensityFilter>('all');
  const [sortOption, setSortOption] = useState<SortOption>('registrations-desc');
  const [selectedSection, setSelectedSection] = useState<ExtendedSection | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  
  // Debug: Log received data
  React.useEffect(() => {
    console.log('🔍 SectionVerticalBarChart - Datos recibidos:', {
      sectionDataLength: sectionData.length,
      loading,
      hasData: sectionData.length > 0
    });
  }, [sectionData.length, loading]);
  
  // Filter and sort functions
  const applyDensityFilter = (data: ExtendedSection[], filter: DensityFilter) => {
    if (filter === 'all') return data;
    return data.filter(section => section.densityLevel === filter);
  };

  const applySorting = (data: ExtendedSection[], sort: SortOption) => {
    switch (sort) {
      case 'registrations-desc':
        return [...data].sort((a, b) => b.totalRegistrations - a.totalRegistrations);
      case 'registrations-asc':
        return [...data].sort((a, b) => a.totalRegistrations - b.totalRegistrations);
      case 'section-asc':
        return [...data].sort((a, b) => a.sectionNumber.localeCompare(b.sectionNumber));
      case 'section-desc':
        return [...data].sort((a, b) => b.sectionNumber.localeCompare(a.sectionNumber));
      default:
        return data;
    }
  };

  // Process and sort sections for vertical bar chart
  const chartData = React.useMemo(() => {
    if (!sectionData || sectionData.length === 0) {
      console.log('🔍 SectionVerticalBarChart - No hay datos de secciones');
      return [];
    }

    // First, process all data
    const processed: ExtendedSection[] = sectionData
      .filter(section => section.totalRegistrations > 0)
      .map(section => {
        // Determine density level for color coding
        let densityLevel: 'high' | 'medium' | 'low' = 'low';
        let densityColor = '#ef4444'; // red for low
        
        if (section.totalRegistrations >= 50) {
          densityLevel = 'high';
          densityColor = '#22c55e'; // green for high
        } else if (section.totalRegistrations >= 20) {
          densityLevel = 'medium';
          densityColor = '#f59e0b'; // yellow for medium
        }

        return {
          ...section,
          densityLevel,
          densityColor,
          // Calculate verification rate (assuming ciudadanos are the ones verified)
          verificationRate: section.ciudadanos > 0 ? Math.round((section.ciudadanos * 0.7) * 100) / 100 : 0
        };
      });

    // Apply filters and sorting
    let filtered = applyDensityFilter(processed, densityFilter);
    let sorted = applySorting(filtered, sortOption);
    
    // Limit for better visualization
    const limited = sorted.slice(0, isMobile ? 10 : 20);
    
    console.log('🔍 SectionVerticalBarChart - Datos procesados:', {
      originalLength: sectionData.length,
      processedLength: processed.length,
      filteredLength: filtered.length,
      finalLength: limited.length,
      filter: densityFilter,
      sort: sortOption
    });
    
    return limited;
  }, [sectionData, isMobile, densityFilter, sortOption]);

  // Custom tooltip component
  const CustomTooltip: React.FC<TooltipProps> = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      
      return (
        <div className={`bg-white border border-gray-200 rounded-lg shadow-lg ${isMobile ? 'p-3 text-xs' : 'p-4'}`}>
          <div className="flex items-center gap-2 mb-2">
            <h4 className={`font-semibold text-gray-900 ${isMobile ? 'text-sm' : 'text-base'}`}>
              Sección {label}
            </h4>
            {!data.hasMinimumData && (
              <AlertTriangle className={`text-yellow-500 ${isMobile ? 'h-3 w-3' : 'h-4 w-4'}`} />
            )}
          </div>
          
          {data.colonia && (
            <p className={`text-gray-600 mb-2 ${isMobile ? 'text-xs' : 'text-sm'}`}>
              📍 {data.colonia}
            </p>
          )}
          
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className={`font-medium ${isMobile ? 'text-xs' : 'text-sm'}`}>Total Registros:</span>
              <span className={`font-bold text-lg ${data.densityLevel === 'high' ? 'text-green-600' : data.densityLevel === 'medium' ? 'text-yellow-600' : 'text-red-600'}`}>
                {data.totalRegistrations}
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className={`text-gray-600 ${isMobile ? 'text-xs' : 'text-sm'}`}>Nivel de Densidad:</span>
              <span className={`font-medium capitalize ${isMobile ? 'text-xs' : 'text-sm'}`} style={{ color: data.densityColor }}>
                {data.densityLevel === 'high' ? 'Alta' : data.densityLevel === 'medium' ? 'Media' : 'Baja'}
              </span>
            </div>
            
            <hr className="my-2" />
            
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex justify-between">
                <span>👥 Líderes:</span>
                <span className="font-medium">{data.lideres}</span>
              </div>
              <div className="flex justify-between">
                <span>🎖️ Brigadistas:</span>
                <span className="font-medium">{data.brigadistas}</span>
              </div>
              <div className="flex justify-between">
                <span>🚀 Movilizadores:</span>
                <span className="font-medium">{data.movilizadores}</span>
              </div>
              <div className="flex justify-between">
                <span>👤 Ciudadanos:</span>
                <span className="font-medium">{data.ciudadanos}</span>
              </div>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  // Custom label component for bars
  const CustomLabel: React.FC<LabelProps> = (props) => {
    const { x = 0, y = 0, width = 0, height = 0, value = 0 } = props;
    
    // Only show labels for bars with enough height
    if (height < 20) return null;
    
    return (
      <text 
        x={x + width / 2} 
        y={y - 5} 
        fill="#374151" 
        textAnchor="middle" 
        fontSize={isMobile ? 10 : 12}
        fontWeight="600"
      >
        {value}
      </text>
    );
  };

  // Section Detail Modal Component
  const SectionDetailModal: React.FC<SectionDetailModalProps> = ({ section, isOpen, onClose }) => {
    // Handle ESC key press
    React.useEffect(() => {
      const handleEscKey = (event: KeyboardEvent) => {
        if (event.key === 'Escape' && isOpen) {
          onClose();
        }
      };

      if (isOpen) {
        document.addEventListener('keydown', handleEscKey);
        // Prevent body scroll when modal is open
        document.body.style.overflow = 'hidden';
      }

      return () => {
        document.removeEventListener('keydown', handleEscKey);
        document.body.style.overflow = 'unset';
      };
    }, [isOpen, onClose]);

    if (!isOpen || !section) return null;

    // Handle click on backdrop (outside modal)
    const handleBackdropClick = (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
        onClose();
      }
    };

    return (
      <div 
        className="fixed inset-0 bg-transparent flex items-center justify-center z-50 p-4"
        onClick={handleBackdropClick}
      >
        <div 
          className={`bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto ${isMobile ? 'mx-2' : ''}`}
          onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside modal
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <Eye className="h-6 w-6 text-primary" />
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Sección {section.sectionNumber}
                </h2>
                <p className="text-xs text-gray-500 mt-1">
                  Presiona ESC o haz clic afuera para cerrar
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Cerrar (ESC)"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">Información General</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Número de Sección:</span>
                    <span className="font-medium">{section.sectionNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Colonia:</span>
                    <span className="font-medium">{section.colonia || 'No especificada'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Registros:</span>
                    <span className="font-bold text-lg text-primary">{section.totalRegistrations}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Nivel de Densidad:</span>
                    <span 
                      className="font-medium capitalize px-2 py-1 rounded text-xs"
                      style={{ 
                        backgroundColor: section.densityColor + '20', 
                        color: section.densityColor 
                      }}
                    >
                      {section.densityLevel === 'high' ? 'Alta' : section.densityLevel === 'medium' ? 'Media' : 'Baja'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">Distribución por Roles</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                      <span className="text-sm text-gray-600">Líderes</span>
                    </div>
                    <span className="font-semibold">{section.lideres}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                      <span className="text-sm text-gray-600">Brigadistas</span>
                    </div>
                    <span className="font-semibold">{section.brigadistas}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                      <span className="text-sm text-gray-600">Movilizadores</span>
                    </div>
                    <span className="font-semibold">{section.movilizadores}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                      <span className="text-sm text-gray-600">Ciudadanos</span>
                    </div>
                    <span className="font-semibold">{section.ciudadanos}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Performance Metrics */}
            <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Métricas de Rendimiento</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {section.totalRegistrations >= 50 ? '🏆' : section.totalRegistrations >= 20 ? '⭐' : '📈'}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    {section.totalRegistrations >= 50 ? 'Excelente' : section.totalRegistrations >= 20 ? 'Bueno' : 'Mejorable'}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {section.movilizadores > 0 ? Math.round(section.ciudadanos / section.movilizadores) : 0}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">Ciudadanos por Movilizador</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {section.hasMinimumData ? '✅' : '⚠️'}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    {section.hasMinimumData ? 'Datos Suficientes' : 'Requiere Atención'}
                  </div>
                </div>
              </div>
            </div>

            {/* Recommendations */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h3 className="font-semibold text-yellow-800 mb-2">Recomendaciones</h3>
              <div className="text-sm text-yellow-700 space-y-1">
                {section.totalRegistrations < 20 && (
                  <p>• Incrementar esfuerzos de registro en esta sección</p>
                )}
                {section.movilizadores === 0 && (
                  <p>• Asignar movilizadores para mejorar la cobertura</p>
                )}
                {section.movilizadores > 0 && section.ciudadanos / section.movilizadores > 10 && (
                  <p>• Considerar agregar más movilizadores para mejor distribución</p>
                )}
                {section.totalRegistrations >= 50 && (
                  <p>• ¡Excelente trabajo! Mantener el nivel de actividad</p>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Export functions
  const exportToPDF = () => {
    // Create a simple text-based PDF content
    const content = `
ANÁLISIS DE DENSIDAD ELECTORAL POR SECCIÓN
Fecha: ${new Date().toLocaleDateString()}
Filtro: ${densityFilter === 'all' ? 'Todas las densidades' : `Densidad ${densityFilter}`}
Ordenamiento: ${sortOption}

RESUMEN:
- Total secciones mostradas: ${chartData.length}
- Total registros: ${chartData.reduce((sum, s) => sum + s.totalRegistrations, 0)}
- Secciones alta densidad: ${chartData.filter(s => s.densityLevel === 'high').length}

DETALLE POR SECCIÓN:
${chartData.map(section => `
Sección ${section.sectionNumber} (${section.colonia || 'Sin colonia'})
- Total registros: ${section.totalRegistrations}
- Líderes: ${section.lideres}
- Brigadistas: ${section.brigadistas}
- Movilizadores: ${section.movilizadores}
- Ciudadanos: ${section.ciudadanos}
- Densidad: ${section.densityLevel}
`).join('\n')}
    `;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analisis-densidad-electoral-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setShowExportMenu(false);
  };

  const exportToCSV = () => {
    const headers = ['Sección', 'Total Registros', 'Líderes', 'Brigadistas', 'Movilizadores', 'Ciudadanos', 'Colonia', 'Densidad'];
    const csvContent = [
      headers.join(','),
      ...chartData.map(section => [
        section.sectionNumber,
        section.totalRegistrations,
        section.lideres,
        section.brigadistas,
        section.movilizadores,
        section.ciudadanos,
        section.colonia || 'Sin colonia',
        section.densityLevel
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `datos-secciones-electorales-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setShowExportMenu(false);
  };

  // Handle bar click - now opens modal
  const handleBarClick = React.useCallback((data: any) => {
    console.log('🔍 SectionVerticalBarChart - Click en sección:', data.sectionNumber);
    setSelectedSection(data);
    setIsModalOpen(true);
    
    // Also call original callback if provided
    if (onSectionClick && data?.sectionNumber) {
      onSectionClick(data.sectionNumber);
    }
  }, [onSectionClick]);

  // Loading state
  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow-md ${isMobile ? 'p-4' : 'p-6'}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded mb-4"></div>
          <div className="grid grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // No data state
  if (chartData.length === 0) {
    return (
      <div className={`bg-white rounded-lg shadow-md ${isMobile ? 'p-4' : 'p-6'}`}>
        <h3 className={`font-semibold text-gray-900 mb-4 ${isMobile ? 'text-base' : 'text-lg'}`}>
          Análisis de Densidad Electoral por Sección
        </h3>
        <div className={`text-center ${isMobile ? 'py-8' : 'py-12'}`}>
          <AlertTriangle className={`text-gray-400 mx-auto mb-4 ${isMobile ? 'h-8 w-8' : 'h-12 w-12'}`} />
          <p className={`text-gray-500 ${isMobile ? 'text-sm' : ''}`}>No hay datos de secciones disponibles</p>
        </div>
      </div>
    );
  }

  // Calculate summary statistics
  const totalRegistrations = chartData.reduce((sum, section) => sum + section.totalRegistrations, 0);
  const highDensitySections = chartData.filter(s => s.densityLevel === 'high').length;
  const averageRegistrations = Math.round(totalRegistrations / chartData.length);

  return (
    <div className={`bg-white rounded-lg shadow-md ${isMobile ? 'p-4' : 'p-6'}`}>
      {/* Header */}
      <div className={`flex items-center justify-between mb-6 ${isMobile ? 'flex-col gap-2' : ''}`}>
        <div className="flex items-center gap-3">
          <TrendingUp className={`text-primary ${isMobile ? 'h-5 w-5' : 'h-6 w-6'}`} />
          <h3 className={`font-semibold text-gray-900 ${isMobile ? 'text-base' : 'text-lg'}`}>
            Análisis de Densidad Electoral por Sección
          </h3>
        </div>
        <div className={`text-gray-600 ${isMobile ? 'text-xs' : 'text-sm'}`}>
          {chartData.length} secciones mostradas
        </div>
      </div>

      {/* Controls */}
      <div className={`flex flex-wrap gap-4 mb-6 ${isMobile ? 'flex-col' : 'items-center justify-between'}`}>
        {/* Filters and Sorting */}
        <div className={`flex flex-wrap gap-3 ${isMobile ? 'w-full' : ''}`}>
          {/* Density Filter */}
          <div className="flex items-center gap-2">
            <Filter className={`text-gray-500 ${isMobile ? 'h-4 w-4' : 'h-5 w-5'}`} />
            <select
              value={densityFilter}
              onChange={(e) => setDensityFilter(e.target.value as DensityFilter)}
              className={`border border-gray-300 rounded-lg px-3 py-2 bg-white text-gray-700 focus:ring-2 focus:ring-primary focus:border-transparent ${isMobile ? 'text-sm' : ''}`}
            >
              <option value="all">Todas las densidades</option>
              <option value="high">Alta densidad (≥50)</option>
              <option value="medium">Media densidad (20-49)</option>
              <option value="low">Baja densidad (&lt;20)</option>
            </select>
          </div>

          {/* Sort Options */}
          <div className="flex items-center gap-2">
            <ArrowUpDown className={`text-gray-500 ${isMobile ? 'h-4 w-4' : 'h-5 w-5'}`} />
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value as SortOption)}
              className={`border border-gray-300 rounded-lg px-3 py-2 bg-white text-gray-700 focus:ring-2 focus:ring-primary focus:border-transparent ${isMobile ? 'text-sm' : ''}`}
            >
              <option value="registrations-desc">Más registros primero</option>
              <option value="registrations-asc">Menos registros primero</option>
              <option value="section-asc">Sección A-Z</option>
              <option value="section-desc">Sección Z-A</option>
            </select>
          </div>
        </div>

        {/* Export Button */}
        <div className="relative">
          <button
            onClick={() => setShowExportMenu(!showExportMenu)}
            className={`flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors ${isMobile ? 'text-sm w-full justify-center' : ''}`}
          >
            <Download className={`${isMobile ? 'h-4 w-4' : 'h-5 w-5'}`} />
            Exportar
          </button>

          {/* Export Menu */}
          {showExportMenu && (
            <div className={`absolute ${isMobile ? 'left-0 right-0' : 'right-0'} mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-48`}>
              <button
                onClick={exportToPDF}
                className="flex items-center gap-3 w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors border-b border-gray-100"
              >
                <FileText className="h-4 w-4 text-red-500" />
                <div>
                  <div className="font-medium text-gray-900">Exportar como TXT</div>
                  <div className="text-xs text-gray-500">Reporte completo en texto</div>
                </div>
              </button>
              <button
                onClick={exportToCSV}
                className="flex items-center gap-3 w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors"
              >
                <FileSpreadsheet className="h-4 w-4 text-green-500" />
                <div>
                  <div className="font-medium text-gray-900">Exportar como CSV</div>
                  <div className="text-xs text-gray-500">Datos para Excel/Sheets</div>
                </div>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Density Legend */}
      <div className={`flex flex-wrap gap-4 mb-6 bg-gray-50 rounded-lg ${isMobile ? 'p-3 gap-2' : 'p-4'}`}>
        <div className="flex items-center gap-2">
          <div className={`rounded-full ${isMobile ? 'w-3 h-3' : 'w-4 h-4'}`} style={{ backgroundColor: '#22c55e' }}></div>
          <span className={`font-medium ${isMobile ? 'text-xs' : 'text-sm'}`}>Alta Densidad (≥50)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className={`rounded-full ${isMobile ? 'w-3 h-3' : 'w-4 h-4'}`} style={{ backgroundColor: '#f59e0b' }}></div>
          <span className={`font-medium ${isMobile ? 'text-xs' : 'text-sm'}`}>Media Densidad (20-49)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className={`rounded-full ${isMobile ? 'w-3 h-3' : 'w-4 h-4'}`} style={{ backgroundColor: '#ef4444' }}></div>
          <span className={`font-medium ${isMobile ? 'text-xs' : 'text-sm'}`}>Baja Densidad (&lt;20)</span>
        </div>
        <div className={`flex items-center gap-2 ${isMobile ? '' : 'ml-4'}`}>
          <AlertTriangle className={`text-yellow-500 ${isMobile ? 'h-3 w-3' : 'h-4 w-4'}`} />
          <span className={`text-gray-600 ${isMobile ? 'text-xs' : 'text-sm'}`}>Requiere atención</span>
        </div>
      </div>

      {/* Vertical Bar Chart */}
      <div className="w-full" style={{ height: isMobile ? '300px' : '400px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ 
              top: 30, 
              right: isMobile ? 10 : 30, 
              left: isMobile ? 10 : 20, 
              bottom: isMobile ? 60 : 80 
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis 
              dataKey="sectionNumber" 
              tick={{ fontSize: isMobile ? 9 : 11, textAnchor: 'end' }}
              height={isMobile ? 60 : 80}
              interval={0}
            />
            <YAxis 
              tick={{ fontSize: isMobile ? 10 : 12 }}
              label={{ 
                value: 'Registros', 
                angle: -90, 
                position: 'insideLeft',
                style: { textAnchor: 'middle', fontSize: isMobile ? 10 : 12 }
              }}
            />
            <Tooltip content={<CustomTooltip />} />
            
            <Bar 
              dataKey="totalRegistrations" 
              onClick={handleBarClick}
              style={{ cursor: onSectionClick ? 'pointer' : 'default' }}
              radius={[4, 4, 0, 0]}
            >
              <LabelList content={<CustomLabel />} />
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.densityColor} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Summary Statistics */}
      <div className={`mt-6 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg ${isMobile ? 'p-3' : 'p-4'}`}>
        <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-3'}`}>
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Users className={`text-blue-600 ${isMobile ? 'h-4 w-4' : 'h-5 w-5'}`} />
              <div className={`font-bold text-blue-600 ${isMobile ? 'text-lg' : 'text-2xl'}`}>
                {totalRegistrations.toLocaleString()}
              </div>
            </div>
            <div className={`text-gray-600 ${isMobile ? 'text-xs' : 'text-sm'}`}>Total Registros</div>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <TrendingUp className={`text-green-600 ${isMobile ? 'h-4 w-4' : 'h-5 w-5'}`} />
              <div className={`font-bold text-green-600 ${isMobile ? 'text-lg' : 'text-2xl'}`}>
                {highDensitySections}
              </div>
            </div>
            <div className={`text-gray-600 ${isMobile ? 'text-xs' : 'text-sm'}`}>Secciones Alta Densidad</div>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <div className={`rounded-full bg-yellow-500 ${isMobile ? 'w-4 h-4' : 'w-5 h-5'} flex items-center justify-center`}>
                <span className={`text-white font-bold ${isMobile ? 'text-xs' : 'text-sm'}`}>Ø</span>
              </div>
              <div className={`font-bold text-yellow-600 ${isMobile ? 'text-lg' : 'text-2xl'}`}>
                {averageRegistrations}
              </div>
            </div>
            <div className={`text-gray-600 ${isMobile ? 'text-xs' : 'text-sm'}`}>Promedio por Sección</div>
          </div>
        </div>
      </div>

      {/* Performance Insights */}
      {!isMobile && (
        <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="text-yellow-600 h-5 w-5 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-medium text-yellow-800 mb-1">Insights de Rendimiento</h4>
              <div className="text-yellow-700 text-sm space-y-1">
                <p>• <strong>{highDensitySections}</strong> secciones han alcanzado alta densidad electoral</p>
                <p>• <strong>{chartData.filter(s => s.densityLevel === 'low').length}</strong> secciones requieren mayor atención</p>
                <p>• Promedio de <strong>{averageRegistrations}</strong> registros por sección activa</p>
                <p>• Haz clic en cualquier barra para ver detalles completos de la sección</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Section Detail Modal */}
      <SectionDetailModal 
        section={selectedSection}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />

      {/* Click outside to close export menu */}
      {showExportMenu && (
        <div 
          className="fixed inset-0 z-5" 
          onClick={() => setShowExportMenu(false)}
        />
      )}
    </div>
  );
};

export default SectionVerticalBarChart;