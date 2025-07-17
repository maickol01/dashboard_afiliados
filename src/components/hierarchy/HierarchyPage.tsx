import React from 'react';
import { useData } from '../../hooks/useData';
import HierarchyTable from '../tables/HierarchyTable';
import { exportToExcel, exportToPDF } from '../../utils/export';

const HierarchyPage: React.FC = () => {
  const { data, loading, error, refetchData } = useData();

  const handleExportExcel = (selectedItems: string[]) => {
    exportToExcel(data, selectedItems);
  };

  const handleExportPDF = (selectedItems: string[]) => {
    exportToPDF(data, selectedItems);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando datos de Supabase...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <svg className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error al cargar datos</h3>
          <p className="text-gray-600 mb-4">{error}</p>
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

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Estructura Jerárquica
        </h2>
        <p className="text-gray-600">
          Gestiona la estructura organizacional y exporta datos en Excel o PDF por elementos seleccionados.
        </p>
      </div>
      
      <HierarchyTable 
        data={data} 
        onExport={handleExportExcel}
        onExportPDF={handleExportPDF}
      />
    </div>
  );
};

export default HierarchyPage;