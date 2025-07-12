import React from 'react';
import { useData } from '../../hooks/useData';
import HierarchyTable from '../tables/HierarchyTable';
import { exportToExcel, exportToPDF } from '../../utils/export';

const HierarchyPage: React.FC = () => {
  const { data, loading } = useData();

  const handleExportExcel = (selectedItems: string[]) => {
    exportToExcel(data, selectedItems);
  };

  const handleExportPDF = (selectedItems: string[]) => {
    exportToPDF(data, selectedItems);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
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