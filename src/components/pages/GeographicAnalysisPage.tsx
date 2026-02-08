import React, { useState, useMemo } from 'react';
import { AlertTriangle, RefreshCw, MapPin } from 'lucide-react';
import { useDashboardSummary } from '../../hooks/queries/useDashboardSummary';
import { useMapData } from '../../hooks/queries/useMapData';
import { NavojoaElectoralAnalytics } from '../../types/navojoa-electoral';
import { navojoaElectoralService } from '../../services/navojoaElectoralService';
import { useMobileDetection } from '../../hooks/useMobileDetection';
import { useGlobalFilter } from '../../context/GlobalFilterContext';
import { checkDateFilter, getFilterDateRange } from '../../utils/dateUtils';

// Import the three main Navojoa components
import KPICards from '../analytics/navojoa/KPICards';
import SectionVerticalBarChart from '../analytics/navojoa/SectionVerticalBarChart';
import NavojoaMapLibre from '../analytics/navojoa/NavojoaMapLibre';
import SectionHeatMap from '../analytics/navojoa/SectionHeatMap';

const GeographicAnalysisPage: React.FC = () => {
  const { isMobile } = useMobileDetection();
  const { selectedOption, customRange } = useGlobalFilter();
  const { start, end } = useMemo(() => getFilterDateRange(selectedOption, customRange), [selectedOption, customRange]);
  
  // State for filtering
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // 1. Obtener datos optimizados del Mapa (solo geolocalizados y filtrados por fecha en servidor)
  const {
    data: mapPeople = [],
    isLoading: loadingMap,
    error: errorMap,
    refetch: refetchMap
  } = useMapData(start, end);

  // 2. Obtener resumen de analíticas (KPIs por sección pre-agregados)
  const {
    data: summary,
    isLoading: loadingSummary,
    error: errorSummary,
    refetch: refetchSummary
  } = useDashboardSummary(start, end);

  const loading = loadingMap || loadingSummary;
  const dataError = errorMap || errorSummary;

  // Filtrar los datos del mapa localmente (solo Búsqueda y Rol, la Fecha ya viene del servidor)
  const filteredMapData = useMemo(() => {
    if (!mapPeople) return [];
    
    console.log(`🔍 [MAP DEBUG] Puntos recibidos del servidor: ${mapPeople.length}`);
    
    let filtered = mapPeople;

    // Filtrar por rol si no es 'all'
    if (selectedRole !== 'all') {
      filtered = filtered.filter(p => p.role === selectedRole);
    }

    // Filtrar por término de búsqueda
    if (searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(p => 
        p.nombre.toLowerCase().includes(term) ||
        p.id.toLowerCase().includes(term)
      );
    }

    console.log(`🔍 [MAP DEBUG] Puntos a mostrar tras filtro local: ${filtered.length}`);
    return filtered;
  }, [mapPeople, selectedRole, searchTerm]);

  // Transformar los datos del resumen para los componentes de Navojoa
  const navojoaData = useMemo<NavojoaElectoralAnalytics | null>(() => {
    if (!summary) return null;
    return navojoaElectoralService.generateAnalyticsFromSummary(summary);
  }, [summary]);

  // Handle manual refresh
  const handleRefresh = async () => {
    refetchMap();
    refetchSummary();
  };

  // Handle section click from stacked bar chart
  const handleSectionClick = (sectionNumber: string) => {
    console.log(`Section ${sectionNumber} clicked`);
  };

  // Handle loading state
  if (loading && !mapPeople.length) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando análisis geográfico optimizado...</p>
          <p className="text-xs text-gray-400 mt-2">Accediendo a caché local (IndexedDB)...</p>
        </div>
      </div>
    );
  }

  // Handle error state
  if (dataError) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center p-6 bg-white rounded-lg shadow-md max-w-md mx-auto">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error al cargar análisis</h3>
          <p className="text-gray-600 mb-4">{dataError instanceof Error ? dataError.message : 'Error de conexión'}</p>
          <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-light transition-colors"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with status */}
      <div className={`flex items-center justify-between bg-white rounded-lg shadow-md ${isMobile ? 'p-4' : 'p-6'}`}>
        <div>
          <h2 className={`font-bold text-gray-900 flex items-center gap-2 ${isMobile ? 'text-lg' : 'text-2xl'}`}>
            <MapPin className="text-primary" />
            Análisis Geográfico - Navojoa
          </h2>
          <p className={`text-gray-600 mt-1 ${isMobile ? 'text-xs' : 'text-sm'}`}>
            Optimizado: Cargando {mapPeople.length.toLocaleString()} ubicaciones geolocalizadas
          </p>
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
              <option value="ciudadano">Ciudadanos</option>
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
      <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-100">
        <div className={`p-4 border-b border-gray-100 flex items-center justify-between ${isMobile ? 'flex-col items-start gap-2' : ''}`}>
          <h3 className="font-bold text-gray-800 flex items-center gap-2">
            📍 Mapa Interactivo
          </h3>
          <div className="flex gap-4">
             <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-600"></div>
                <span className="text-xs text-gray-600">Afiliados</span>
             </div>
             <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500 opacity-50"></div>
                <span className="text-xs text-gray-600">Densidad</span>
             </div>
          </div>
        </div>
        <NavojoaMapLibre 
          data={filteredMapData as any}
          height={isMobile ? '400px' : '600px'}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          allPeople={mapPeople as any}
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

      {/* Data Info Indicator */}
      {navojoaData && !loading && (
        <div className={`bg-blue-50 border border-blue-200 rounded-lg ${isMobile ? 'p-3' : 'p-4'}`}>
          <div className="flex items-start gap-3">
            <div className="text-blue-600 mt-0.5 flex-shrink-0">ℹ️</div>
            <div>
              <h4 className={`font-medium text-blue-800 mb-1 ${isMobile ? 'text-sm' : ''}`}>
                Información de Rendimiento
              </h4>
              <div className={`text-blue-700 space-y-1 ${isMobile ? 'text-xs' : 'text-sm'}`}>
                <p>• Los datos se cargan instantáneamente desde la caché local (IndexedDB).</p>
                <p>• El mapa solo procesa {mapPeople.length.toLocaleString()} registros con coordenadas.</p>
                <p>• El resumen analítico fue pre-calculado en el servidor para mayor velocidad.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GeographicAnalysisPage;