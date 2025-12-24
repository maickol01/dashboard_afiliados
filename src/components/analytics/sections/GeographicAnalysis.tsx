import React, { useState, useEffect } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Analytics, Person } from '../../../types';
import { NavojoaElectoralAnalytics } from '../../../types/navojoa-electoral';
import { navojoaElectoralService } from '../../../services/navojoaElectoralService';
import { useMobileDetection } from '../../../hooks/useMobileDetection';

// Import the three main Navojoa components
import KPICards from '../navojoa/KPICards';
import SectionVerticalBarChart from '../navojoa/SectionVerticalBarChart';
import SectionHeatMap from '../navojoa/SectionHeatMap';

interface GeographicAnalysisProps {
  analytics: Analytics;
  hierarchicalData?: Person[];
}

const GeographicAnalysis: React.FC<GeographicAnalysisProps> = ({ 
  analytics, 
  hierarchicalData = [] 
}) => {
  const { isMobile} = useMobileDetection();
  
  // State for Navojoa electoral data
  const [navojoaData, setNavojoaData] = useState<NavojoaElectoralAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  // Load Navojoa electoral data on component mount and when hierarchical data changes
  useEffect(() => {
    const loadNavojoaData = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log('🔍 GeographicAnalysis - Datos recibidos:', {
          hierarchicalDataLength: hierarchicalData.length,
          analyticsExists: !!analytics,
          analyticsKeys: analytics ? Object.keys(analytics) : []
        });

        // Generate Navojoa electoral analytics from hierarchical data
        const navojoaAnalytics = await navojoaElectoralService.generateNavojoaElectoralAnalytics(
          hierarchicalData,
          analytics
        );

        setNavojoaData(navojoaAnalytics);
        setLastRefresh(new Date());
      } catch (err) {
        console.error('Error loading Navojoa electoral data:', err);
        setError(err instanceof Error ? err.message : 'Error desconocido al cargar datos');
      } finally {
        setLoading(false);
      }
    };

    loadNavojoaData();
  }, [hierarchicalData, analytics]);

  // Handle section click from stacked bar chart
  const handleSectionClick = (sectionNumber: string) => {
    console.log(`Section ${sectionNumber} clicked`);
    // Future enhancement: could show detailed section view or filter other components
  };

  // Handle manual refresh
  const handleRefresh = async () => {
    if (loading) return;
    
    try {
      setLoading(true);
      setError(null);

      const navojoaAnalytics = await navojoaElectoralService.generateNavojoaElectoralAnalytics(
        hierarchicalData,
        analytics
      );

      setNavojoaData(navojoaAnalytics);
      setLastRefresh(new Date());
    } catch (err) {
      console.error('Error refreshing Navojoa data:', err);
      setError(err instanceof Error ? err.message : 'Error al actualizar datos');
    } finally {
      setLoading(false);
    }
  };

  // Error state
  if (error) {
    return (
      <div className={`bg-white rounded-lg shadow-md ${isMobile ? 'p-4' : 'p-6'}`}>
        <div className="text-center">
          <AlertTriangle className={`text-red-500 mx-auto mb-4 ${isMobile ? 'h-8 w-8' : 'h-12 w-12'}`} />
          <h3 className={`font-semibold text-gray-900 mb-2 ${isMobile ? 'text-base' : 'text-lg'}`}>
            Error al cargar datos
          </h3>
          <p className={`text-gray-600 mb-4 ${isMobile ? 'text-sm' : ''}`}>{error}</p>
          <button
            onClick={handleRefresh}
            disabled={loading}
            className={`inline-flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed ${isMobile ? 'text-sm' : ''}`}
          >
            <RefreshCw className={`mr-2 ${loading ? 'animate-spin' : ''} ${isMobile ? 'h-3 w-3' : 'h-4 w-4'}`} />
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with refresh button */}
      <div className={`flex items-center justify-between bg-white rounded-lg shadow-md ${isMobile ? 'p-4' : 'p-6'}`}>
        <div>
          <h2 className={`font-bold text-gray-900 ${isMobile ? 'text-lg' : 'text-2xl'}`}>
            Análisis Geográfico - Navojoa
          </h2>
          <p className={`text-gray-600 mt-1 ${isMobile ? 'text-xs' : 'text-sm'}`}>
            Análisis hiperlocal de las 78 secciones electorales
          </p>
          {navojoaData && (
            <p className={`text-gray-500 mt-1 ${isMobile ? 'text-xs' : 'text-xs'}`}>
              Última actualización: {lastRefresh.toLocaleTimeString()}
            </p>
          )}
        </div>
        <button
          onClick={handleRefresh}
          disabled={loading}
          className={`inline-flex items-center px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${isMobile ? 'text-xs px-2 py-1' : ''}`}
          title="Actualizar datos"
        >
          <RefreshCw className={`${loading ? 'animate-spin' : ''} ${isMobile ? 'h-3 w-3' : 'h-4 w-4 mr-2'}`} />
          {!isMobile && 'Actualizar'}
        </button>
      </div>

      {/* KPI Cards Component */}
      <KPICards 
        sectionData={navojoaData?.sectionData || []}
        loading={loading}
      />

      {/* Section Vertical Bar Chart Component */}
      <SectionVerticalBarChart 
        sectionData={navojoaData?.sectionData || []}
        onSectionClick={handleSectionClick}
        loading={loading}
      />

      {/* Section Heat Map Component */}
      <SectionHeatMap 
        sectionData={navojoaData?.sectionData || []}
        colorScale="green"
        loading={loading}
      />

      {/* Data Quality Indicator */}
      {navojoaData && !loading && (
        <div className={`bg-blue-50 border border-blue-200 rounded-lg ${isMobile ? 'p-3' : 'p-4'}`}>
          <div className="flex items-start gap-3">
            <div className={`text-blue-600 mt-0.5 flex-shrink-0 ${isMobile ? 'text-xs' : 'text-sm'}`}>
              ℹ️
            </div>
            <div>
              <h4 className={`font-medium text-blue-800 mb-1 ${isMobile ? 'text-sm' : ''}`}>
                Información del Análisis
              </h4>
              <div className={`text-blue-700 space-y-1 ${isMobile ? 'text-xs' : 'text-sm'}`}>
                <p>
                  • <strong>{navojoaData.sectionData.length}</strong> secciones con datos de {navojoaData.kpis.totalRegistrations.toLocaleString()} registros totales
                </p>
                <p>
                  • Cobertura territorial: <strong>{navojoaData.kpis.coveragePercentage.toFixed(1)}%</strong> de las 78 secciones de Navojoa
                </p>
                <p>
                  • Promedio de <strong>{navojoaData.kpis.averageRegistrationsPerSection.toFixed(1)}</strong> registros por sección activa
                </p>
                {!isMobile && (
                  <p className="text-blue-600 mt-2">
                    Los datos se actualizan automáticamente cuando cambia la información jerárquica.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GeographicAnalysis;