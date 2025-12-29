import React, { useState } from 'react';
import Layout, { PageType } from './components/layout/Layout';
import ConsolidatedAnalyticsPage from './components/analytics/ConsolidatedAnalyticsPage';
import HierarchyPage from './components/hierarchy/HierarchyPage';
import { GeographicAnalysisPage, DataQualityPage } from './components/pages';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { DataErrorBoundary } from './components/common/DataErrorBoundary';
import { useGeocodingTrigger } from './hooks/useGeocodingTrigger';

function App() {
  const [currentPage, setCurrentPage] = useState<PageType>('analytics');
  
  // Enable background geocoding for new/updated records
  useGeocodingTrigger(true);

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
      <Layout currentPage={currentPage} onPageChange={setCurrentPage}>
        <DataErrorBoundary>
          {renderPage()}
        </DataErrorBoundary>
      </Layout>
    </ErrorBoundary>
  );
}

export default App;