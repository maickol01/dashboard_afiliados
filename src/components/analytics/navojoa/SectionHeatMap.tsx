import React from 'react';
import { AlertTriangle, Info } from 'lucide-react';
import { SectionHeatMapProps, HeatMapCell, NAVOJOA_CONSTANTS } from '../../../types/navojoa-electoral';
import { navojoaElectoralService } from '../../../services/navojoaElectoralService';
import { useMobileDetection } from '../../../hooks/useMobileDetection';

const SectionHeatMap: React.FC<SectionHeatMapProps> = ({ 
  sectionData, 
  colorScale = 'green',
  loading = false 
}) => {
  const { isMobile } = useMobileDetection();
  // Generate heat map data with intensity calculations
  const heatMapData = React.useMemo(() => {
    const data = navojoaElectoralService.generateHeatMapData(sectionData);
    
    // Create a map for quick lookup of sections with data
    const dataMap = new Map(data.map(item => [item.sectionNumber, item]));
    
    // Generate all real sections, filling in missing ones with zero data
    const allSections: HeatMapCell[] = NAVOJOA_CONSTANTS.REAL_SECTIONS.map(sectionNumber => {
      const existingData = dataMap.get(sectionNumber);
      
      if (existingData) {
        return existingData;
      } else {
        // Add sections without data
        return {
          sectionNumber: sectionNumber,
          registrationCount: 0,
          intensity: 0
        };
      }
    });
    
    // Sort by section number for consistent display
    return allSections.sort((a, b) => {
      const numA = parseInt(a.sectionNumber);
      const numB = parseInt(b.sectionNumber);
      return numA - numB;
    });
  }, [sectionData]);

  // Get color based on intensity and selected color scale
  const getColorForIntensity = (intensity: number): string => {
    if (intensity === 0) {
      return '#f3f4f6'; // Neutral gray for sections without data
    }
    
    const colors = NAVOJOA_CONSTANTS.HEAT_MAP_COLORS[colorScale];
    const colorIndex = Math.min(Math.floor((intensity / 100) * (colors.length - 1)), colors.length - 1);
    return colors[colorIndex];
  };

  // Get text color based on background intensity for better contrast
  const getTextColorForIntensity = (intensity: number): string => {
    // Use white text for high intensity (dark backgrounds) and dark text for low intensity (light backgrounds)
    return intensity > 50 ? '#ffffff' : '#374151'; // white for dark backgrounds, gray-700 for light backgrounds
  };

  // Statistics for the heat map
  const stats = React.useMemo(() => {
    const sectionsWithData = heatMapData.filter(cell => cell.registrationCount > 0);
    const sectionsWithoutData = heatMapData.filter(cell => cell.registrationCount === 0);
    const totalRegistrations = heatMapData.reduce((sum, cell) => sum + cell.registrationCount, 0);
    const maxRegistrations = heatMapData.length > 0 ? Math.max(...heatMapData.map(cell => cell.registrationCount)) : 0;
    const avgRegistrations = sectionsWithData.length > 0 
      ? totalRegistrations / sectionsWithData.length 
      : 0;

    return {
      sectionsWithData: sectionsWithData.length,
      sectionsWithoutData: sectionsWithoutData.length,
      totalRegistrations,
      maxRegistrations,
      avgRegistrations,
      coveragePercentage: (sectionsWithData.length / NAVOJOA_CONSTANTS.TOTAL_SECTIONS) * 100
    };
  }, [heatMapData]);

  // Loading state
  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow-md ${isMobile ? 'p-4' : 'p-6'}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className={`grid gap-2 mb-4 ${isMobile ? 'grid-cols-6' : 'grid-cols-8'}`}>
            {Array.from({ length: isMobile ? 36 : 64 }).map((_, index) => (
              <div key={index} className={`bg-gray-200 rounded ${isMobile ? 'h-8' : 'h-12'}`}></div>
            ))}
          </div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-md ${isMobile ? 'p-4' : 'p-6'}`}>
      {/* Header */}
      <div className={`flex items-center justify-between mb-6 ${isMobile ? 'flex-col gap-2' : ''}`}>
        <h3 className={`font-semibold text-gray-900 ${isMobile ? 'text-base text-center' : 'text-lg'}`}>
          Mapa de Calor - Secciones Electorales de Navojoa
        </h3>
        <div className={`flex items-center gap-2 text-gray-600 ${isMobile ? 'text-xs' : 'text-sm'}`}>
          <Info className={isMobile ? 'h-3 w-3' : 'h-4 w-4'} />
          <span>78 secciones totales</span>
        </div>
      </div>

      {/* Color Scale Legend */}
      <div className={`mb-6 bg-gray-50 rounded-lg ${isMobile ? 'p-3' : 'p-4'}`}>
        <div className={`flex items-center justify-between mb-3 ${isMobile ? 'flex-col gap-2' : ''}`}>
          <span className={`font-medium text-gray-700 ${isMobile ? 'text-xs' : 'text-sm'}`}>Intensidad de Registros</span>
          <div className={`flex items-center gap-4 text-gray-600 ${isMobile ? 'text-xs gap-2 flex-wrap justify-center' : 'text-xs'}`}>
            <div className="flex items-center gap-1">
              <div className={`rounded ${isMobile ? 'w-2 h-2' : 'w-3 h-3'}`} style={{ backgroundColor: '#f3f4f6' }}></div>
              <span>Sin datos</span>
            </div>
            <div className="flex items-center gap-1">
              <div className={`rounded ${isMobile ? 'w-2 h-2' : 'w-3 h-3'}`} style={{ backgroundColor: getColorForIntensity(25) }}></div>
              <span>Bajo</span>
            </div>
            <div className="flex items-center gap-1">
              <div className={`rounded ${isMobile ? 'w-2 h-2' : 'w-3 h-3'}`} style={{ backgroundColor: getColorForIntensity(50) }}></div>
              <span>Medio</span>
            </div>
            <div className="flex items-center gap-1">
              <div className={`rounded ${isMobile ? 'w-2 h-2' : 'w-3 h-3'}`} style={{ backgroundColor: getColorForIntensity(75) }}></div>
              <span>Alto</span>
            </div>
            <div className="flex items-center gap-1">
              <div className={`rounded ${isMobile ? 'w-2 h-2' : 'w-3 h-3'}`} style={{ backgroundColor: getColorForIntensity(100) }}></div>
              <span>Máximo</span>
            </div>
          </div>
        </div>
        
        {/* Gradient bar */}
        <div className={`rounded-full overflow-hidden ${isMobile ? 'h-2' : 'h-3'}`} style={{
          background: `linear-gradient(to right, ${NAVOJOA_CONSTANTS.HEAT_MAP_COLORS[colorScale].join(', ')})`
        }}></div>
        <div className={`flex justify-between text-gray-500 mt-1 ${isMobile ? 'text-xs' : 'text-xs'}`}>
          <span>0 registros</span>
          <span>{stats.maxRegistrations} registros</span>
        </div>
      </div>

      {/* Heat Map Grid */}
      <div className="mb-6">
        <div className={`grid gap-1 mb-4 ${isMobile ? 'grid-cols-6' : 'grid-cols-6 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12'}`}>
          {heatMapData.map((cell) => (
            <div
              key={cell.sectionNumber}
              className={`relative group aspect-square rounded cursor-pointer transition-all duration-200 hover:scale-110 hover:z-10 border border-gray-200 ${isMobile ? 'touch-manipulation' : ''}`}
              style={{ 
                backgroundColor: getColorForIntensity(cell.intensity),
                minHeight: isMobile ? '24px' : '32px'
              }}
              title={`Sección ${cell.sectionNumber}: ${cell.registrationCount} registros`}
            >
              {/* Section number label with dynamic text color for better contrast */}
              <div className="absolute inset-0 flex items-center justify-center">
                <span 
                  className={`font-medium opacity-90 ${isMobile ? 'text-xs' : 'text-xs'}`}
                  style={{ color: getTextColorForIntensity(cell.intensity) }}
                >
                  {parseInt(cell.sectionNumber)}
                </span>
              </div>
              
              {/* Hover tooltip - simplified for mobile */}
              {!isMobile && (
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-20">
                  <div className="font-semibold">Sección {cell.sectionNumber}</div>
                  <div>{cell.registrationCount} registros</div>
                  {cell.registrationCount === 0 && (
                    <div className="text-yellow-300 flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      Sin cobertura
                    </div>
                  )}
                  {/* Arrow */}
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Coverage Statistics */}
      <div className={`grid gap-4 mb-6 ${isMobile ? 'grid-cols-2' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'}`}>
        <div className={`text-center bg-green-50 rounded-lg ${isMobile ? 'p-3' : 'p-4'}`}>
          <div className={`font-bold text-green-600 ${isMobile ? 'text-xl' : 'text-2xl'}`}>
            {stats.sectionsWithData}
          </div>
          <div className={`text-gray-600 ${isMobile ? 'text-xs' : 'text-sm'}`}>Secciones con Datos</div>
          <div className={`text-gray-500 mt-1 ${isMobile ? 'text-xs' : 'text-xs'}`}>
            {stats.coveragePercentage.toFixed(1)}% cobertura
          </div>
        </div>
        
        <div className={`text-center bg-gray-50 rounded-lg ${isMobile ? 'p-3' : 'p-4'}`}>
          <div className={`font-bold text-gray-600 ${isMobile ? 'text-xl' : 'text-2xl'}`}>
            {stats.sectionsWithoutData}
          </div>
          <div className={`text-gray-600 ${isMobile ? 'text-xs' : 'text-sm'}`}>Sin Cobertura</div>
          <div className={`text-gray-500 mt-1 ${isMobile ? 'text-xs' : 'text-xs'}`}>
            Oportunidades de crecimiento
          </div>
        </div>
        
        <div className={`text-center bg-blue-50 rounded-lg ${isMobile ? 'p-3' : 'p-4'}`}>
          <div className={`font-bold text-blue-600 ${isMobile ? 'text-xl' : 'text-2xl'}`}>
            {stats.totalRegistrations.toLocaleString()}
          </div>
          <div className={`text-gray-600 ${isMobile ? 'text-xs' : 'text-sm'}`}>Total Registros</div>
          <div className={`text-gray-500 mt-1 ${isMobile ? 'text-xs' : 'text-xs'}`}>
            En territorio completo
          </div>
        </div>
        
        <div className={`text-center bg-purple-50 rounded-lg ${isMobile ? 'p-3' : 'p-4'}`}>
          <div className={`font-bold text-purple-600 ${isMobile ? 'text-xl' : 'text-2xl'}`}>
            {stats.avgRegistrations.toFixed(1)}
          </div>
          <div className={`text-gray-600 ${isMobile ? 'text-xs' : 'text-sm'}`}>Promedio por Sección</div>
          <div className={`text-gray-500 mt-1 ${isMobile ? 'text-xs' : 'text-xs'}`}>
            En secciones activas
          </div>
        </div>
      </div>

      {/* Coverage Analysis */}
      <div className={`${stats.sectionsWithoutData > 0 ? 'bg-yellow-50 border-yellow-200' : 'bg-green-50 border-green-200'} rounded-lg border ${isMobile ? 'p-3' : 'p-4'}`}>
        <div className="flex items-start gap-3">
          <div className={`${stats.sectionsWithoutData > 0 ? 'text-yellow-600' : 'text-green-600'} mt-0.5 flex-shrink-0 ${isMobile ? 'text-xs' : 'text-sm'}`}>
            {stats.sectionsWithoutData > 0 ? '⚠️' : '✅'}
          </div>
          <div>
            <h4 className={`font-medium ${stats.sectionsWithoutData > 0 ? 'text-yellow-800' : 'text-green-800'} mb-1 ${isMobile ? 'text-sm' : ''}`}>
              Análisis de Cobertura Territorial
            </h4>
            <p className={`${stats.sectionsWithoutData > 0 ? 'text-yellow-700' : 'text-green-700'} mb-2 ${isMobile ? 'text-xs' : 'text-sm'}`}>
              {stats.sectionsWithoutData > 0 ? (
                <>
                  Se tienen registros en <strong>{stats.sectionsWithData} de 78 secciones electorales</strong> de Navojoa.
                  {!isMobile && ` Quedan ${stats.sectionsWithoutData} secciones sin cobertura que representan oportunidades de expansión.`}
                </>
              ) : (
                <>
                  ¡Excelente! Se ha logrado cobertura en <strong>todas las 78 secciones electorales</strong> de Navojoa.
                  {!isMobile && ' El enfoque ahora debe ser fortalecer las secciones con menor densidad de registros.'}
                </>
              )}
            </p>
            <div className={`${stats.sectionsWithoutData > 0 ? 'text-yellow-600' : 'text-green-600'} ${isMobile ? 'text-xs' : 'text-xs'}`}>
              <p>• Cobertura actual: <strong>{stats.coveragePercentage.toFixed(1)}%</strong> del territorio electoral</p>
              <p>• Secciones activas: <strong>{stats.sectionsWithData}</strong> de {NAVOJOA_CONSTANTS.TOTAL_SECTIONS} totales</p>
              {stats.sectionsWithoutData > 0 && (
                <p>• Oportunidades de expansión: <strong>{stats.sectionsWithoutData}</strong> secciones sin registros</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SectionHeatMap;