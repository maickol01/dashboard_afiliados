import React from 'react';
import Layout from './components/layout/Layout';
import ConsolidatedAnalyticsPage from './components/analytics/ConsolidatedAnalyticsPage';
import BrigadistasPage from './components/analytics/BrigadistasPage';
import MovilizadoresPage from './components/analytics/MovilizadoresPage';
import HierarchyPage from './components/hierarchy/HierarchyPage';
import { GeographicAnalysisPage, DataQualityPage } from './components/pages';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { DataErrorBoundary } from './components/common/DataErrorBoundary';
import { useGlobalFilter, PageType } from './context/GlobalFilterContext';
import { useData } from './hooks/useData';
import { HierarchicalFilterDropdown } from './components/shared';

function App() {
  const { 
    currentPage, 
    setCurrentPage, 
    selectedLeaderId, 
    setLeader, 
    selectedBrigadistaId, 
    setBrigadista 
  } = useGlobalFilter();
  
  const { data: hierarchicalData, loading } = useData(null);

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
      const leaders = hierarchicalData.map(l => ({ id: l.id, name: l.name }));
      
      let brigadistas: { id: string; name: string }[] = [];
      if (currentPage === 'movilizadores') {
          if (selectedLeaderId) {
              const leader = hierarchicalData.find(l => l.id === selectedLeaderId);
              if (leader && leader.children) {
                  brigadistas = leader.children
                    .filter(c => c.role === 'brigadista')
                    .map(b => ({ id: b.id, name: b.name }));
              }
          } else {
              // If no leader selected, show all brigadistas
              hierarchicalData.forEach(l => {
                  if (l.children) {
                      l.children
                        .filter(c => c.role === 'brigadista')
                        .forEach(b => brigadistas.push({ id: b.id, name: b.name }));
                  }
              });
          }
      }

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