import React, { useState } from 'react';
import Layout, { PageType } from './components/layout/Layout';
import ConsolidatedAnalyticsPage from './components/analytics/ConsolidatedAnalyticsPage';
import HierarchyPage from './components/hierarchy/HierarchyPage';
import { GeographicAnalysisPage, DataQualityPage } from './components/pages';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { DataErrorBoundary } from './components/common/DataErrorBoundary';

function App() {
  const [currentPage, setCurrentPage] = useState<PageType>('analytics');
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  const renderPage = () => {
    switch (currentPage) {
      case 'analytics':
        return <ConsolidatedAnalyticsPage />;
      case 'geographic':
        return <GeographicAnalysisPage />;
      case 'quality':
        return <DataQualityPage />;
      case 'hierarchy':
        return <HierarchyPage isPanelOpen={isPanelOpen} setIsPanelOpen={setIsPanelOpen} />;
      default:
        return <ConsolidatedAnalyticsPage />;
    }
  };

  return (
    <ErrorBoundary>
      <Layout currentPage={currentPage} onPageChange={setCurrentPage} isModalOpen={isPanelOpen}>
        <DataErrorBoundary>
          {renderPage()}
        </DataErrorBoundary>
      </Layout>
    </ErrorBoundary>
  );
}

export default App;