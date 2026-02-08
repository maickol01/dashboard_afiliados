import React, { useMemo, useEffect, lazy, Suspense } from 'react';
import Layout from './components/layout/Layout';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { DataErrorBoundary } from './components/common/DataErrorBoundary';
import { useGlobalFilter } from './context/GlobalFilterContext';
import { useLideresList } from './hooks/queries/useLideresList';
import { useSubordinates } from './hooks/queries/useSubordinates';
import { HierarchicalFilterDropdown } from './components/shared';
import { removeLoader } from './utils/loader';
import { DataService } from './services/dataService';
import LoadingSpinner from './components/common/LoadingSpinner';

const ConsolidatedAnalyticsPage = lazy(() => import('./components/analytics/ConsolidatedAnalyticsPage'));
const BrigadistasPage = lazy(() => import('./components/analytics/BrigadistasPage'));
const MovilizadoresPage = lazy(() => import('./components/analytics/MovilizadoresPage'));
const HierarchyPage = lazy(() => import('./components/hierarchy/HierarchyPage'));
const GeographicAnalysisPage = lazy(() => import('./components/pages/GeographicAnalysisPage'));
const DataQualityPage = lazy(() => import('./components/pages/DataQualityPage'));

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
          <Suspense fallback={<LoadingSpinner />}>
            {renderPage()}
          </Suspense>
        </DataErrorBoundary>
      </Layout>
    </ErrorBoundary>
  );
}

export default App;