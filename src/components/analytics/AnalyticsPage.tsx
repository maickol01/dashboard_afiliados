import React from 'react';
import ConsolidatedAnalyticsPage from './ConsolidatedAnalyticsPage';

/**
 * Legacy AnalyticsPage component - now redirects to ConsolidatedAnalyticsPage
 * This component is kept for backward compatibility but should not be used directly.
 * Use ConsolidatedAnalyticsPage instead.
 */
const AnalyticsPage: React.FC = () => {
  return <ConsolidatedAnalyticsPage />;
};

export default AnalyticsPage;