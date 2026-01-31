import React, { useState, useEffect } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { useData } from '../../hooks/useData';
import { NavojoaElectoralAnalytics } from '../../types/navojoa-electoral';
import { navojoaElectoralService } from '../../services/navojoaElectoralService';
import { useMobileDetection } from '../../hooks/useMobileDetection';
import { DataService } from '../../services/dataService';

// Import the three main Navojoa components
import KPICards from '../analytics/navojoa/KPICards';
import SectionVerticalBarChart from '../analytics/navojoa/SectionVerticalBarChart';
import NavojoaMapLibre from '../analytics/navojoa/NavojoaMapLibre';
import SectionHeatMap from '../analytics/navojoa/SectionHeatMap';

const GeographicAnalysisPage: React.FC = () => {
  const { isMobile } = useMobileDetection();
  
  // State for filtering
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Get data from useData hook
  const {
    data: hierarchicalData,
    analytics,
    loading: dataLoading,
    error: dataError,
    refetchData,
  } = useData(null);

  // Memoize the flattened data (all people)
  const flatData = React.useMemo(() => {
    if (!hierarchicalData) return [];
    return DataService.getAllPeopleFlat(hierarchicalData);
  }, [hierarchicalData]);

  // Memoize the filtered data for the map view
  const mapData = React.useMemo(() => {
    console.log(`[MAP FILTER] Recalculating... Search: "${searchTerm}", Role: "${selectedRole}"`);

    // Helper to collect all descendant IDs recursively
    const collectHierarchyIds = (people: Person[], idSet: Set<string>) => {
      people.forEach(p => {
        idSet.add(p.id);
        if (p.children && p.children.length > 0) {
          collectHierarchyIds(p.children, idSet);
        }
      });
    };

    // 1. Search term takes priority
    if (searchTerm.trim() !== '') {
        const term = searchTerm.toLowerCase();
        const rootMatches = flatData.filter(p => 
            p.nombre.toLowerCase().includes(term) ||
            (p.clave_electoral && p.clave_electoral.toLowerCase().includes(term))
        );
        
        console.log(`[MAP FILTER] Found ${rootMatches.length} search matches.`);
        const relevantIds = new Set<string>();
        collectHierarchyIds(rootMatches, relevantIds);
        
        const finalData = flatData.filter(p => relevantIds.has(p.id));
        console.log(`[MAP FILTER] Returning ${finalData.length} people based on search.`);
        return finalData;
    }

    // 2. If no search, use role filter
    if (selectedRole !== 'all') {
        const normalize = (str: string) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
        
        const uniqueRoles = Array.from(new Set(flatData.map(p => p.role)));
        console.log(`[MAP FILTER] Available roles: ${uniqueRoles.join(', ')}. Filtering for: "${selectedRole}"`);
        
        const matches = flatData.filter(p => {
            const pRole = (p.role || '').toLowerCase();
            const sRole = selectedRole.toLowerCase();
            // Permissive check
            return pRole.includes(sRole) || sRole.includes(pRole);
        });
        console.log(`[MAP FILTER] Returning ${matches.length} people based on strict role filter.`);
        return matches;
    }

    // 3. Default view if no search and role is 'all' - show everyone
    const finalData = flatData;
    console.log(`[MAP FILTER] Returning ${finalData.length} people for default view (all roles).`);
    return finalData;

  }, [flatData, selectedRole, searchTerm]);

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
        <div className="flex items-center gap-2">
          {!isMobile && (
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="bg-white border border-gray-300 text-gray-700 text-sm rounded-lg focus:ring-primary focus:border-primary block p-2"
            >
              <option value="all">Todos los Roles</option>
              <option value="lider">Líderes</option>
              <option value="brigadista">Brigadistas</option>
              <option value="movilizador">Movilizadores</option>
            </select>
          )}
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
      </div>

      {/* Interactive Navojoa Map Component */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className={`p-4 border-b border-gray-100 flex items-center justify-between ${isMobile ? 'flex-col items-start gap-2' : ''}`}>
          <h3 className="font-bold text-gray-800 flex items-center gap-2">
            📍 Mapa Interactivo de Navojoa
          </h3>
          <div className="flex gap-2">
            <span className="flex items-center gap-1 text-[10px] text-gray-500">
              <span className="w-2 h-2 rounded-full bg-red-400"></span> Afiliados
            </span>
            <span className="flex items-center gap-1 text-[10px] text-gray-500">
              <span className="w-2 h-2 rounded-full bg-green-600 opacity-40"></span> Densidad Alta
            </span>
          </div>
        </div>
        <NavojoaMapLibre 
          data={mapData}
          height={isMobile ? '400px' : '600px'}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          allPeople={flatData}
          selectedRole={selectedRole}
          onRoleChange={setSelectedRole}
        />
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

export default GeographicAnalysisPage;