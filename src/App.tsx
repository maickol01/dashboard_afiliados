import React, { useState } from 'react';
import Layout, { PageType } from './components/layout/Layout';
import ConsolidatedAnalyticsPage from './components/analytics/ConsolidatedAnalyticsPage';
import HierarchyPage from './components/hierarchy/HierarchyPage';
import { GeographicAnalysisPage, DataQualityPage } from './components/pages';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { DataErrorBoundary } from './components/common/DataErrorBoundary';
import { GlobalFilterProvider } from './context/GlobalFilterContext';

function App() {
  const [currentPage, setCurrentPage] = useState<PageType>('analytics');

  const renderPage = () => {
    switch (currentPage) {
      case 'analytics':
        return <ConsolidatedAnalyticsPage />;
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
      <GlobalFilterProvider>
        <Layout currentPage={currentPage} onPageChange={setCurrentPage}>
          <DataErrorBoundary>
            {renderPage()}
          </DataErrorBoundary>
        </Layout>
      </GlobalFilterProvider>
    </ErrorBoundary>
  );
}

export default App;