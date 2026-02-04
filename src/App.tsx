import React from 'react';
import Layout from './components/layout/Layout';
import ConsolidatedAnalyticsPage from './components/analytics/ConsolidatedAnalyticsPage';
import BrigadistasPage from './components/analytics/BrigadistasPage';
import MovilizadoresPage from './components/analytics/MovilizadoresPage';
import HierarchyPage from './components/hierarchy/HierarchyPage';
import { GeographicAnalysisPage, DataQualityPage } from './components/pages';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { DataErrorBoundary } from './components/common/DataErrorBoundary';
import { useGlobalFilter } from './context/GlobalFilterContext';

function App() {
  const { currentPage, setCurrentPage } = useGlobalFilter();

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

  return (
    <ErrorBoundary>
      <Layout currentPage={currentPage} onPageChange={setCurrentPage}>
        <DataErrorBoundary>
          {renderPage()}
        </DataErrorBoundary>
      </Layout>
    </ErrorBoundary>
  );
}

export default App;