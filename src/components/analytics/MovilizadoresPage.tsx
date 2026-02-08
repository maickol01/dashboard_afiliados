import React, { useMemo } from 'react';
import { useSubordinates } from '../../hooks/queries/useSubordinates';
import { useGlobalFilter } from '../../context/GlobalFilterContext';
import { ProductivityTable } from '../shared';
import { AlertCircle } from 'lucide-react';
import { getFilterDateRange } from '../../utils/dateUtils';

/**
 * Página de productividad para Movilizadores.
 * Muestra el rendimiento de los movilizadores y permite filtrar por Brigadista.
 * Optimizada para carga bajo demanda vía RPC.
 */
const MovilizadoresPage: React.FC = () => {
  const { selectedBrigadistaId, selectedOption, customRange } = useGlobalFilter();
  const { start, end } = useMemo(() => getFilterDateRange(selectedOption, customRange), [selectedOption, customRange]);

  // Obtener solo los movilizadores del brigadista seleccionado
  const {
    data: movilizadores = [],
    isLoading: loading,
    error
  } = useSubordinates(selectedBrigadistaId, 'brigadista', start, end);

  if (error) {
    return (
      <div className="p-6 text-center text-red-600 bg-red-50 rounded-lg flex flex-col items-center">
        <AlertCircle className="h-8 w-8 mb-2" />
        <p className="font-semibold">Error al cargar movilizadores:</p>
        <p className="text-sm">{error instanceof Error ? error.message : 'Error desconocido'}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 italic">
              Mostrando movilizadores para el brigadista seleccionado. Los datos se cargan bajo demanda.
          </p>
      </div>
      <ProductivityTable
        role="movilizador"
        data={movilizadores}
        loading={loading}
        onNameClick={() => {}} // No hay nivel inferior (ciudadanos) en esta tabla por ahora
      />
    </div>
  );
};

export default MovilizadoresPage;