import React, { useMemo, useEffect } from 'react';
import Layout from './components/layout/Layout';
import ConsolidatedAnalyticsPage from './components/analytics/ConsolidatedAnalyticsPage';
import BrigadistasPage from './components/analytics/BrigadistasPage';
import MovilizadoresPage from './components/analytics/MovilizadoresPage';
import HierarchyPage from './components/hierarchy/HierarchyPage';
import { GeographicAnalysisPage, DataQualityPage } from './components/pages';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { DataErrorBoundary } from './components/common/DataErrorBoundary';
import { useGlobalFilter } from './context/GlobalFilterContext';
import { useLideresList } from './hooks/queries/useLideresList';
import { useSubordinates } from './hooks/queries/useSubordinates';
import { HierarchicalFilterDropdown } from './components/shared';
import { removeLoader } from './utils/loader';
import { DataService } from './services/DataService';

function App() {
  const { 
    currentPage, 
    setCurrentPage, 
    selectedLeaderId, 
    setLeader, 
    selectedBrigadistaId, 
    setBrigadista 
  } = useGlobalFilter();

  useEffect(() => {
    // Remove native loader
    removeLoader();

    // Initialize cache warming strategies asynchronously
    // Using requestIdleCallback to avoid blocking the main thread during initial render
    const initCache = () => {
      DataService.setupCacheWarmingStrategies();
    };

    if ('requestIdleCallback' in window) {
      (window as any).requestIdleCallback(initCache);
    } else {
      // Fallback for browsers that don't support requestIdleCallback
      setTimeout(initCache, 2000);
    }
  }, []);
  
  // Obtenemos solo la lista de líderes para el header
  const { data: lideresList = [] } = useLideresList();
  
  // Obtenemos brigadistas solo si estamos en movilizadores y hay un líder seleccionado
  const { data: brigadistasList = [] } = useSubordinates(
    currentPage === 'movilizadores' ? selectedLeaderId : null, 
    'lider'
  );

  const renderPage = () => {
    switch (currentPage) {
      case 'analytics':
        return <ConsolidatedAnalyticsPage />;
      case 'brigadistas':
        return <BrigadistasPage />;
      case 'movilizadores':
        return <MovilizadoresPage />;
      case 'geographic':
        return <GeographicAnalysisPage />;
      case 'quality':
        return <DataQualityPage />;
      case 'hierarchy':
        return <HierarchyPage />;
      default:
        return <ConsolidatedAnalyticsPage />;
    }
  };

  const renderHeaderActions = () => {
    if (currentPage === 'brigadistas' || currentPage === 'movilizadores') {
      const leaders = lideresList.map(l => ({ id: l.id, name: l.nombre }));
      
      const brigadistas = brigadistasList.map(b => ({ id: b.id, name: b.nombre }));

      return (
        <>
          <HierarchicalFilterDropdown 
            label="Líder"
            options={leaders}
            selectedId={selectedLeaderId}
            onSelect={setLeader}
            placeholder="Todos los Líderes"
          />
          {currentPage === 'movilizadores' && (
            <HierarchicalFilterDropdown 
              label="Brigadista"
              options={brigadistas}
              selectedId={selectedBrigadistaId}
              onSelect={setBrigadista}
              icon="brigadista"
              placeholder="Todos los Brigadistas"
            />
          )}
        </>
      );
    }
    return null;
  };

  return (
    <ErrorBoundary>
      <Layout 
        currentPage={currentPage} 
        onPageChange={setCurrentPage}
        headerActions={renderHeaderActions()}
      >
        <DataErrorBoundary>
          {renderPage()}
        </DataErrorBoundary>
      </Layout>
    </ErrorBoundary>
  );
}

export default App;