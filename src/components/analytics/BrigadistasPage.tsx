import React, { useMemo } from 'react';
import { useSubordinates } from '../../hooks/queries/useSubordinates';
import { useGlobalFilter } from '../../context/GlobalFilterContext';
import { ProductivityTable } from '../shared';
import { Person } from '../../types';
import { AlertCircle } from 'lucide-react';
import { getFilterDateRange } from '../../utils/dateUtils';

/**
 * Página de productividad para Brigadistas.
 * Muestra el rendimiento de los brigadistas y permite filtrar por Líder.
 * Optimizada para cargar solo los subordinados necesarios vía RPC.
 */
const BrigadistasPage: React.FC = () => {
  const { selectedLeaderId, selectedOption, customRange, setHierarchy, setCurrentPage } = useGlobalFilter();
  const { start, end } = useMemo(() => getFilterDateRange(selectedOption, customRange), [selectedOption, customRange]);

  // Obtener solo los brigadistas del líder seleccionado
  const { 
    data: brigadistas = [], 
    isLoading: loading, 
    error 
  } = useSubordinates(selectedLeaderId, 'lider', start, end);

  // Manejar el clic en un brigadista para profundizar a movilizadores
  const handleBrigadistaClick = (brigadista: Person) => {
    const leaderId = selectedLeaderId || brigadista.parentId || null;
    setHierarchy(leaderId, brigadista.id);
    setCurrentPage('movilizadores');
  };

  if (error) {
    return (
      <div className="p-6 text-center text-red-600 bg-red-50 rounded-lg flex flex-col items-center">
        <AlertCircle className="h-8 w-8 mb-2" />
        <p className="font-semibold">Error al cargar brigadistas:</p>
        <p className="text-sm">{error instanceof Error ? error.message : 'Error desconocido'}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 italic">
              Mostrando brigadistas para el líder seleccionado. Los datos se cargan bajo demanda.
          </p>
      </div>
      <ProductivityTable
        role="brigadista"
        data={brigadistas}
        loading={loading}
        onNameClick={handleBrigadistaClick}
      />
    </div>
  );
};

export default BrigadistasPage;