import React, { useState } from 'react';
import Layout from './components/layout/Layout';
import AnalyticsPage from './components/analytics/AnalyticsPage';
import HierarchyPage from './components/hierarchy/HierarchyPage';

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
    <Layout currentPage={currentPage} onPageChange={setCurrentPage}>
      {renderPage()}
    </Layout>
  );
}

export default App;