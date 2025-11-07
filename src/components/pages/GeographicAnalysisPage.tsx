import React, { useState, useEffect } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { useData } from '../../hooks/useData';
import { NavojoaElectoralAnalytics } from '../../types/navojoa-electoral';
import { navojoaElectoralService } from '../../services/navojoaElectoralService';
import { useMobileDetection } from '../../hooks/useMobileDetection';

// Import the three main Navojoa components
import KPICards from '../analytics/navojoa/KPICards';
import SectionVerticalBarChart from '../analytics/navojoa/SectionVerticalBarChart';
import SectionHeatMap from '../analytics/navojoa/SectionHeatMap';

const GeographicAnalysisPage: React.FC = () => {
  const { isMobile } = useMobileDetection();
  
  // Get data from useData hook
  const {
    data: hierarchicalData,
    analytics,
    loading: dataLoading,
    error: dataError,
    refetchData
  } = useData(null);

  // State for Navojoa electoral data
  const [navojoaData, setNavojoaData] = useState<NavojoaElectoralAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  // Load Navojoa electoral data on component mount and when hierarchical data changes
  useEffect(() => {
    const loadNavojoaData = async () => {
      if (!hierarchicalData || !analytics) {
        setLoading(dataLoading);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        console.log('🔍 GeographicAnalysisPage - Datos recibidos:', {
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
  }, [hierarchicalData, analytics, dataLoading]);

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

      // Refresh base data first
      await refetchData();

      if (hierarchicalData && analytics) {
        const navojoaAnalytics = await navojoaElectoralService.generateNavojoaElectoralAnalytics(
          hierarchicalData,
          analytics
        );

        setNavojoaData(navojoaAnalytics);
        setLastRefresh(new Date());
      }
    } catch (err) {
      console.error('Error refreshing Navojoa data:', err);
      setError(err instanceof Error ? err.message : 'Error al actualizar datos');
    } finally {
      setLoading(false);
    }
  };

  // Handle data loading state
  if (dataLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando datos de Supabase...</p>
        </div>
      </div>
    );
  }

  // Handle data error state
  if (dataError) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <svg className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error al cargar datos</h3>
          <p className="text-gray-600 mb-4">{dataError}</p>
          <button
            onClick={refetchData}
            className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-light"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  // Handle geographic analysis error state
  if (error) {
    return (
      <div className={`bg-white rounded-lg shadow-md ${isMobile ? 'p-4' : 'p-6'}`}>
        <div className="text-center">
          <AlertTriangle className={`text-red-500 mx-auto mb-4 ${isMobile ? 'h-8 w-8' : 'h-12 w-12'}`} />
          <h3 className={`font-semibold text-gray-900 mb-2 ${isMobile ? 'text-base' : 'text-lg'}`}>
            Error al cargar análisis geográfico
          </h3>
          <p className={`text-gray-600 mb-4 ${isMobile ? 'text-sm' : ''}`}>{error}</p>
          <button
            onClick={handleRefresh}
            disabled={loading}
            className={`inline-flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-light disabled:opacity-50 disabled:cursor-not-allowed ${isMobile ? 'text-sm' : ''}`}
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
        loading={loading}      />
    </div>
  );
};

export default GeographicAnalysisPage;