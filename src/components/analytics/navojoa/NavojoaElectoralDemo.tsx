import React from 'react';
import { useData } from '../../../hooks/useData';
import { navojoaElectoralService } from '../../../services/navojoaElectoralService';
import KPICards from './KPICards';
import SectionStackedBarChart from './SectionStackedBarChart';
import SectionHeatMap from './SectionHeatMap';

/**
 * Demo component showing how to integrate KPICards with existing data
 * This can be used as a reference for integrating into GeographicAnalysis
 */
const NavojoaElectoralDemo: React.FC = () => {
  const { data, loading, error } = useData(null);

  // Transform hierarchical data to section data
  const sectionData = React.useMemo(() => {
    if (!data || data.length === 0) return [];
    return navojoaElectoralService.transformHierarchicalDataToSections(data);
  }, [data]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando datos electorales de Navojoa...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-red-800 mb-2">Error al cargar datos</h3>
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Análisis Electoral de Navojoa
        </h2>
        <p className="text-gray-600 mb-6">
          Visualización de KPIs específicos para las 74 secciones electorales de Navojoa, Sonora.
          Esta vista muestra la cobertura territorial, distribución por roles organizacionales y métricas clave.
        </p>
      </div>

      <KPICards 
        sectionData={sectionData}
        loading={loading}
      />

      <SectionStackedBarChart 
        sectionData={sectionData}
        loading={loading}
        onSectionClick={(sectionNumber) => {
          console.log(`Clicked on section: ${sectionNumber}`);
          // Here you could implement navigation or detailed view
        }}
      />

      <SectionHeatMap 
        sectionData={sectionData}
        loading={loading}
        colorScale="green"
      />

      {/* Additional info section */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-blue-800 mb-2">
          Información del Componente
        </h3>
        <div className="text-sm text-blue-700 space-y-2">
          <p><strong>Secciones procesadas:</strong> {sectionData.length}</p>
          <p><strong>Total registros:</strong> {sectionData.reduce((sum, s) => sum + s.totalRegistrations, 0)}</p>
          <p><strong>Cobertura:</strong> {((sectionData.length / 74) * 100).toFixed(1)}% de las 74 secciones de Navojoa</p>
        </div>
      </div>
    </div>
  );
};

export default NavojoaElectoralDemo;