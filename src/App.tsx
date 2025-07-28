import React, { useState } from 'react';
import Layout from './components/layout/Layout';
import AnalyticsPage from './components/analytics/AnalyticsPage';
import HierarchyPage from './components/hierarchy/HierarchyPage';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { DataErrorBoundary } from './components/common/DataErrorBoundary';

function App() {
  const [currentPage, setCurrentPage] = useState<'analytics' | 'hierarchy'>('analytics');

  const renderPage = () => {
    switch (currentPage) {
      case 'analytics':
        return <AnalyticsPage />;
      case 'hierarchy':
        return <HierarchyPage />;
      default:
        return <AnalyticsPage />;
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