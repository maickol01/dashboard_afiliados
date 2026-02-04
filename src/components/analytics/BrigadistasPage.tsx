import React, { useMemo } from 'react';
import { useData } from '../../hooks/useData';
import { useGlobalFilter } from '../../context/GlobalFilterContext';
import { ProductivityTable } from '../shared';
import { Person } from '../../types';

/**
 * Página de productividad para Brigadistas.
 * Muestra el rendimiento de los brigadistas y permite filtrar por Líder.
 */
const BrigadistasPage: React.FC = () => {
  const { selectedLeaderId, setLeader, setBrigadista, setCurrentPage } = useGlobalFilter();
  const { data: hierarchicalData, loading, error } = useData(null);

  // Obtener la lista de brigadistas basada en el filtro de líder
  const filteredBrigadistas = useMemo(() => {
    if (!hierarchicalData) return [];

    let brigadistas: Person[] = [];

    if (selectedLeaderId) {
      // Si hay un líder seleccionado, obtener solo sus brigadistas
      const leader = hierarchicalData.find(l => l.id === selectedLeaderId);
      if (leader && leader.children) {
        brigadistas = leader.children.filter(child => child.role === 'brigadista');
      }
    } else {
      // Si no hay líder seleccionado, obtener todos los brigadistas de todos los líderes
      hierarchicalData.forEach(leader => {
        if (leader.children) {
          const leaderBrigadistas = leader.children.filter(child => child.role === 'brigadista');
          brigadistas = [...brigadistas, ...leaderBrigadistas];
        }
      });
    }

    return brigadistas;
  }, [hierarchicalData, selectedLeaderId]);

  // Manejar el clic en un brigadista para profundizar a movilizadores
  const handleBrigadistaClick = (brigadista: Person) => {
    // Si el líder no estaba seleccionado, seleccionarlo basándose en el parentId del brigadista
    if (!selectedLeaderId && brigadista.parentId) {
        setLeader(brigadista.parentId);
    }
    setBrigadista(brigadista.id);
    setCurrentPage('movilizadores');
  };

  if (error) {
    return (
      <div className="p-6 text-center text-red-600 bg-red-50 rounded-lg">
        <p className="font-semibold">Error al cargar datos:</p>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ProductivityTable
        role="brigadista"
        data={filteredBrigadistas}
        loading={loading}
        onNameClick={handleBrigadistaClick}
      />
    </div>
  );
};

export default BrigadistasPage;