import React, { useState, useEffect } from 'react';
import { useData } from '../../hooks/useData';
import HierarchyTable from '../tables/HierarchyTable';
import { exportToPDF } from '../../utils/export';
import DateFilter, { DateRange } from '../shared/DateFilter';
import DetailsPanel from '../shared/DetailsPanel';
import { Person } from '../../types';
import { DataService } from '../../services/dataService';

const HierarchyPage: React.FC = () => {
  const [dateRange, setDateRange] = useState<DateRange | null>(null);
  const { data, loading, error, refetchData } = useData(dateRange);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);

  const [lideres, setLideres] = useState<{ id: string; nombre: string }[]>([]);
  const [brigadistas, setBrigadistas] = useState<{ id: string; nombre: string }[]>([]);

  useEffect(() => {
    const fetchLists = async () => {
      try {
        const [lideresList, brigadistasList] = await Promise.all([
          DataService.getLideresList(),
          DataService.getBrigadistasList(),
        ]);
        setLideres(lideresList);
        setBrigadistas(brigadistasList);
      } catch (error) {
        console.error("Error fetching parent lists:", error);
        // Optionally set an error state here to show in the UI
      }
    };
    fetchLists();
  }, []);

  const handleFilterChange = (newDateRange: DateRange | null) => {
    setDateRange(newDateRange);
  };

  const handleExportPDF = (selectedItems: string[]) => {
    exportToPDF(data, selectedItems);
  };

  const handleRowClick = (person: Person) => {
    setSelectedPerson(person);
    setIsPanelOpen(true);
  };

  const handlePanelClose = () => {
    setIsPanelOpen(false);
    setSelectedPerson(null);
  };

  const handleReassign = async (personId: string, newParentId: string, role: 'brigadista' | 'movilizador') => {
    try {
      await DataService.reassignPerson(personId, newParentId, role);
      handlePanelClose();
      refetchData(); // Refetch all data to reflect the change in the hierarchy
    } catch (error) {
      console.error("Failed to reassign person:", error);
      // This will now show the detailed message from the database function
      alert(`Error al reasignar: ${error instanceof Error ? error.message : String(error)}`);
    }
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
        <p className="text-gray-600 mb-4">
          Gestiona la estructura organizacional, reasigna miembros y exporta datos.
        </p>
        <DateFilter onFilterChange={handleFilterChange} />
      </div>
      
      <HierarchyTable 
        data={data} 
        onExportPDF={handleExportPDF}
        onRowClick={handleRowClick}
      />

      <DetailsPanel
        isOpen={isPanelOpen}
        onClose={handlePanelClose}
        person={selectedPerson}
        lideres={lideres}
        brigadistas={brigadistas}
        onReassign={handleReassign}
        hierarchicalData={data}
      />
    </div>
  );
};

export default HierarchyPage;