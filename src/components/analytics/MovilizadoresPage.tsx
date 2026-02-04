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
    if (!hierarchicalData) return [];

    let movilizadores: Person[] = [];

    const getMovilizadoresFromBrigadista = (brigadista: Person) => {
        if (brigadista.children) {
            return brigadista.children.filter(child => child.role === 'movilizador');
        }
        return [];
    };

    const getMovilizadoresFromLeader = (leader: Person) => {
        let results: Person[] = [];
        if (leader.children) {
            leader.children.forEach(brigadista => {
                if (brigadista.role === 'brigadista') {
                    if (!selectedBrigadistaId || brigadista.id === selectedBrigadistaId) {
                        results = [...results, ...getMovilizadoresFromBrigadista(brigadista)];
                    }
                }
            });
        }
        return results;
    };

    if (selectedLeaderId) {
        // Filtrar por Líder específico
        const leader = hierarchicalData.find(l => l.id === selectedLeaderId);
        if (leader) {
            movilizadores = getMovilizadoresFromLeader(leader);
        }
    } else if (selectedBrigadistaId) {
        // Si no hay líder pero hay brigadista (caso raro debido al cascading, pero posible)
        hierarchicalData.forEach(leader => {
            if (leader.children) {
                const brigadista = leader.children.find(b => b.id === selectedBrigadistaId);
                if (brigadista) {
                    movilizadores = getMovilizadoresFromBrigadista(brigadista);
                }
            }
        });
    } else {
        // Mostrar todos los movilizadores
        hierarchicalData.forEach(leader => {
            movilizadores = [...movilizadores, ...getMovilizadoresFromLeader(leader)];
        });
    }

    return movilizadores;
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