import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { AlertTriangle } from 'lucide-react';
import { SectionStackedBarChartProps } from '../../../types/navojoa-electoral';
import { NAVOJOA_CONSTANTS } from '../../../types/navojoa-electoral';
import { useMobileDetection } from '../../../hooks/useMobileDetection';

const SectionStackedBarChart: React.FC<SectionStackedBarChartProps> = ({ 
  sectionData, 
  onSectionClick,
  loading = false 
}) => {
  const { isMobile } = useMobileDetection();
  
  // Debug: Log received data (only when data changes)
  React.useEffect(() => {
    console.log('🔍 SectionStackedBarChart - Datos recibidos:', {
      sectionDataLength: sectionData.length,
      loading,
      hasData: sectionData.length > 0
    });
  }, [sectionData.length, loading]);
  
  // Filter and sort sections: only those with at least one registration, ordered by total desc
  const chartData = React.useMemo(() => {
    if (!sectionData || sectionData.length === 0) {
      console.log('🔍 SectionStackedBarChart - No hay datos de secciones');
      return [];
    }

    const filtered = sectionData
      .filter(section => section.totalRegistrations > 0)
      .sort((a, b) => b.totalRegistrations - a.totalRegistrations)
      .map(section => ({
        sectionNumber: section.sectionNumber,
        lideres: section.lideres,
        brigadistas: section.brigadistas,
        movilizadores: section.movilizadores,
        ciudadanos: section.ciudadanos,
        totalRegistrations: section.totalRegistrations,
        hasMinimumData: section.hasMinimumData,
        colonia: section.colonia
      }));
    
    if (filtered.length > 0) {
      console.log('🔍 SectionStackedBarChart - Datos procesados:', {
        originalLength: sectionData.length,
        filteredLength: filtered.length,
        secciones: filtered.map(f => `${f.sectionNumber}(${f.totalRegistrations})`)
      });
    }
    
    return filtered;
  }, [sectionData]);

  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const total = data.totalRegistrations;
      
      return (
        <div className={`bg-white border border-gray-200 rounded-lg shadow-lg ${isMobile ? 'p-3 text-xs' : 'p-4'}`}>
          <div className="flex items-center gap-2 mb-2">
            <h4 className={`font-semibold text-gray-900 ${isMobile ? 'text-xs' : 'text-sm'}`}>Sección {label}</h4>
            {!data.hasMinimumData && (
              <AlertTriangle className={`text-yellow-500 ${isMobile ? 'h-3 w-3' : 'h-4 w-4'}`} />
            )}
          </div>
          {data.colonia && !isMobile && (
            <p className="text-sm text-gray-600 mb-2">{data.colonia}</p>
          )}
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <span className={`font-medium ${isMobile ? 'text-xs' : 'text-sm'}`}>Total:</span>
              <span className={`font-semibold ${isMobile ? 'text-xs' : 'text-sm'}`}>{total} registros</span>
            </div>
            <hr className="my-2" />
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className={`rounded-full ${isMobile ? 'w-2 h-2' : 'w-3 h-3'}`} style={{ backgroundColor: NAVOJOA_CONSTANTS.ROLE_COLORS.lideres }}></div>
                  <span className={isMobile ? 'text-xs' : 'text-sm'}>Líderes:</span>
                </div>
                <span className={`font-medium ${isMobile ? 'text-xs' : 'text-sm'}`}>{data.lideres}</span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className={`rounded-full ${isMobile ? 'w-2 h-2' : 'w-3 h-3'}`} style={{ backgroundColor: NAVOJOA_CONSTANTS.ROLE_COLORS.brigadistas }}></div>
                  <span className={isMobile ? 'text-xs' : 'text-sm'}>Brigadistas:</span>
                </div>
                <span className={`font-medium ${isMobile ? 'text-xs' : 'text-sm'}`}>{data.brigadistas}</span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className={`rounded-full ${isMobile ? 'w-2 h-2' : 'w-3 h-3'}`} style={{ backgroundColor: NAVOJOA_CONSTANTS.ROLE_COLORS.movilizadores }}></div>
                  <span className={isMobile ? 'text-xs' : 'text-sm'}>Movilizadores:</span>
                </div>
                <span className={`font-medium ${isMobile ? 'text-xs' : 'text-sm'}`}>{data.movilizadores}</span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className={`rounded-full ${isMobile ? 'w-2 h-2' : 'w-3 h-3'}`} style={{ backgroundColor: NAVOJOA_CONSTANTS.ROLE_COLORS.ciudadanos }}></div>
                  <span className={isMobile ? 'text-xs' : 'text-sm'}>Ciudadanos:</span>
                </div>
                <span className={`font-medium ${isMobile ? 'text-xs' : 'text-sm'}`}>{data.ciudadanos}</span>
              </div>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  // Handle bar click
  const handleBarClick = React.useCallback((data: any) => {
    if (onSectionClick && data?.sectionNumber) {
      console.log('🔍 SectionStackedBarChart - Click en sección:', data.sectionNumber);
      onSectionClick(data.sectionNumber);
    }
  }, [onSectionClick]);

  // Loading state
  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow-md ${isMobile ? 'p-4' : 'p-6'}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {Array.from({ length: isMobile ? 5 : 8 }).map((_, index) => (
              <div key={index} className="flex items-center space-x-4">
                <div className="h-4 bg-gray-200 rounded w-16"></div>
                <div className="h-8 bg-gray-200 rounded flex-1"></div>
              </div>
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
          Distribución por Secciones Electorales
        </h3>
        <div className={`text-center ${isMobile ? 'py-8' : 'py-12'}`}>
          <AlertTriangle className={`text-gray-400 mx-auto mb-4 ${isMobile ? 'h-8 w-8' : 'h-12 w-12'}`} />
          <p className={`text-gray-500 ${isMobile ? 'text-sm' : ''}`}>No hay datos de secciones disponibles</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-md ${isMobile ? 'p-4' : 'p-6'}`}>
      <div className={`flex items-center justify-between mb-6 ${isMobile ? 'flex-col gap-2' : ''}`}>
        <h3 className={`font-semibold text-gray-900 ${isMobile ? 'text-base text-center' : 'text-lg'}`}>
          Distribución por Secciones Electorales
        </h3>
        <div className={`text-gray-600 ${isMobile ? 'text-xs' : 'text-sm'}`}>
          {chartData.length} secciones con registros
        </div>
      </div>

      {/* Legend */}
      <div className={`flex flex-wrap gap-4 mb-6 bg-gray-50 rounded-lg ${isMobile ? 'p-3 gap-2' : 'p-4'}`}>
        <div className="flex items-center gap-2">
          <div className={`rounded ${isMobile ? 'w-3 h-3' : 'w-4 h-4'}`} style={{ backgroundColor: NAVOJOA_CONSTANTS.ROLE_COLORS.lideres }}></div>
          <span className={`font-medium ${isMobile ? 'text-xs' : 'text-sm'}`}>Líderes</span>
        </div>
        <div className="flex items-center gap-2">
          <div className={`rounded ${isMobile ? 'w-3 h-3' : 'w-4 h-4'}`} style={{ backgroundColor: NAVOJOA_CONSTANTS.ROLE_COLORS.brigadistas }}></div>
          <span className={`font-medium ${isMobile ? 'text-xs' : 'text-sm'}`}>Brigadistas</span>
        </div>
        <div className="flex items-center gap-2">
          <div className={`rounded ${isMobile ? 'w-3 h-3' : 'w-4 h-4'}`} style={{ backgroundColor: NAVOJOA_CONSTANTS.ROLE_COLORS.movilizadores }}></div>
          <span className={`font-medium ${isMobile ? 'text-xs' : 'text-sm'}`}>Movilizadores</span>
        </div>
        <div className="flex items-center gap-2">
          <div className={`rounded ${isMobile ? 'w-3 h-3' : 'w-4 h-4'}`} style={{ backgroundColor: NAVOJOA_CONSTANTS.ROLE_COLORS.ciudadanos }}></div>
          <span className={`font-medium ${isMobile ? 'text-xs' : 'text-sm'}`}>Ciudadanos</span>
        </div>
        <div className={`flex items-center gap-2 ${isMobile ? '' : 'ml-4'}`}>
          <AlertTriangle className={`text-yellow-500 ${isMobile ? 'h-3 w-3' : 'h-4 w-4'}`} />
          <span className={`text-gray-600 ${isMobile ? 'text-xs' : 'text-sm'}`}>Menos de 3 registros</span>
        </div>
      </div>

      {/* Chart */}
      <div className="w-full" style={{ height: `${Math.max(isMobile ? 300 : 400, chartData.length * (isMobile ? 30 : 40))}px` }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData.slice(0, isMobile ? 15 : chartData.length)}
            layout="horizontal"
            margin={{ 
              top: 20, 
              right: isMobile ? 20 : 40, 
              left: isMobile ? 60 : 80, 
              bottom: 20 
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
            <XAxis 
              type="number" 
              tick={{ fontSize: isMobile ? 10 : 12 }}
              tickFormatter={(value) => value.toString()}
              domain={[0, 'dataMax']}
            />
            <YAxis 
              type="category" 
              dataKey="sectionNumber" 
              tick={{ fontSize: isMobile ? 10 : 12 }}
              width={isMobile ? 50 : 70}
              tickFormatter={(value) => `Sec ${value}`}
            />
            <Tooltip content={<CustomTooltip />} />
            
            {/* Stacked bars for each role */}
            <Bar 
              dataKey="lideres" 
              stackId="roles"
              fill={NAVOJOA_CONSTANTS.ROLE_COLORS.lideres}
              onClick={handleBarClick}
              style={{ cursor: onSectionClick ? 'pointer' : 'default' }}
              radius={[0, 0, 0, 0]}
            />
            
            <Bar 
              dataKey="brigadistas" 
              stackId="roles"
              fill={NAVOJOA_CONSTANTS.ROLE_COLORS.brigadistas}
              onClick={handleBarClick}
              style={{ cursor: onSectionClick ? 'pointer' : 'default' }}
              radius={[0, 0, 0, 0]}
            />
            
            <Bar 
              dataKey="movilizadores" 
              stackId="roles"
              fill={NAVOJOA_CONSTANTS.ROLE_COLORS.movilizadores}
              onClick={handleBarClick}
              style={{ cursor: onSectionClick ? 'pointer' : 'default' }}
              radius={[0, 0, 0, 0]}
            />
            
            <Bar 
              dataKey="ciudadanos" 
              stackId="roles"
              fill={NAVOJOA_CONSTANTS.ROLE_COLORS.ciudadanos}
              onClick={handleBarClick}
              style={{ cursor: onSectionClick ? 'pointer' : 'default' }}
              radius={[0, 0, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Summary stats */}
      <div className={`mt-6 bg-gray-50 rounded-lg ${isMobile ? 'p-3' : 'p-4'}`}>
        <div className={`grid gap-4 text-center ${isMobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-3'}`}>
          <div>
            <div className={`font-bold text-primary ${isMobile ? 'text-xl' : 'text-2xl'}`}>
              {chartData.length}
            </div>
            <div className={`text-gray-600 ${isMobile ? 'text-xs' : 'text-sm'}`}>Secciones Activas</div>
          </div>
          <div>
            <div className={`font-bold text-green-600 ${isMobile ? 'text-xl' : 'text-2xl'}`}>
              {chartData.reduce((sum, section) => sum + section.totalRegistrations, 0).toLocaleString()}
            </div>
            <div className={`text-gray-600 ${isMobile ? 'text-xs' : 'text-sm'}`}>Total Registros</div>
          </div>
          <div>
            <div className={`font-bold text-yellow-600 ${isMobile ? 'text-xl' : 'text-2xl'}`}>
              {chartData.filter(section => !section.hasMinimumData).length}
            </div>
            <div className={`text-gray-600 ${isMobile ? 'text-xs' : 'text-sm'}`}>Secciones con &lt;3 registros</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SectionStackedBarChart;