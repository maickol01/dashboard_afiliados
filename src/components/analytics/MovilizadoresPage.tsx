import React, { useMemo } from 'react';
import { useData } from '../../hooks/useData';
import { useGlobalFilter } from '../../context/GlobalFilterContext';
import { ProductivityTable } from '../shared';
import { Person } from '../../types';

/**
 * Página de productividad para Movilizadores.
 * Muestra el rendimiento de los movilizadores y permite filtrar por Líder y Brigadista.
 */
const MovilizadoresPage: React.FC = () => {
  const { selectedLeaderId, selectedBrigadistaId, setCurrentPage } = useGlobalFilter();
  const { data: hierarchicalData, loading, error } = useData(null);

  // Obtener la lista de movilizadores basada en los filtros
  const filteredMovilizadores = useMemo(() => {
    if (!hierarchicalData || hierarchicalData.length === 0) return [];

    const isFiltered = !!(selectedLeaderId || selectedBrigadistaId);
    let results: Person[] = [];

    const getMovilizadoresFromBrigadista = (brigadista: Person) => {
        if (brigadista.children) {
            return brigadista.children.filter(child => child.role === 'movilizador');
        }
        return [];
    };

    const getMovilizadoresFromLeader = (leader: Person) => {
        let leaderResults: Person[] = [];
        if (leader.children) {
            leader.children.forEach(brigadista => {
                if (brigadista.role === 'brigadista') {
                    // Si hay brigadista seleccionado, solo tomamos ese. Si no, tomamos todos.
                    if (!selectedBrigadistaId || brigadista.id === selectedBrigadistaId) {
                        leaderResults = [...leaderResults, ...getMovilizadoresFromBrigadista(brigadista)];
                    }
                }
            });
        }
        return leaderResults;
    };

    if (selectedLeaderId) {
        // Caso 1: Filtrado por Líder (y opcionalmente por Brigadista vía getMovilizadoresFromLeader)
        const leader = hierarchicalData.find(l => l.id === selectedLeaderId);
        if (leader) {
            results = getMovilizadoresFromLeader(leader);
        }
    } else if (selectedBrigadistaId) {
        // Caso 2: Filtrado solo por Brigadista
        hierarchicalData.forEach(leader => {
            if (leader.children) {
                const brigadista = leader.children.find(b => b.id === selectedBrigadistaId);
                if (brigadista) {
                    results = [...results, ...getMovilizadoresFromBrigadista(brigadista)];
                }
            }
        });
    } else {
        // Caso 3: Sin filtros, mostrar todos
        hierarchicalData.forEach(leader => {
            results = [...results, ...getMovilizadoresFromLeader(leader)];
        });
    }

    return results;
  }, [hierarchicalData, selectedLeaderId, selectedBrigadistaId]);

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
        role="movilizador"
        data={filteredMovilizadores}
        loading={loading}
        onNameClick={() => {}} // No hay nivel inferior por ahora
      />
    </div>
  );
};

export default MovilizadoresPage;