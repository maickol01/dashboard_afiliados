import React from 'react';
import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import ConsolidatedAnalyticsPage from '../components/analytics/ConsolidatedAnalyticsPage';
import { useData } from '../hooks/useData';

// Mock useData hook
vi.mock('../hooks/useData');

// Mock child components to avoid deep rendering and dependency issues
vi.mock('../components/charts/LineChart', () => ({
  default: () => <div data-testid="line-chart">LineChart</div>
}));
vi.mock('../components/charts/EnhancedLeaderPerformanceChart', () => ({
  default: () => <div data-testid="enhanced-leader-chart">EnhancedLeaderPerformanceChart</div>
}));
vi.mock('../components/shared/KPICardsSection', () => ({
  default: ({ title }: { title: string }) => <div data-testid="kpi-section">{title}</div>
}));
// LeaderProductivityTable is a named export
vi.mock('../components/shared', () => ({
    LeaderProductivityTable: () => <div data-testid="leader-productivity-table">LeaderProductivityTable</div>,
    KPICardsSection: ({ title }: { title: string }) => <div data-testid="kpi-section">{title}</div>
}));

vi.mock('../components/charts/BrigadierPerformanceLineChart', () => ({
    default: () => <div data-testid="brigadier-chart">BrigadierPerformanceLineChart</div>
}));
vi.mock('../components/charts/LeaderPerformanceLineChart', () => ({
    default: () => <div data-testid="leader-chart">LeaderPerformanceLineChart</div>
}));
vi.mock('../components/analytics/RealTimeIndicator', () => ({
    default: () => <div data-testid="realtime-indicator">RealTimeIndicator</div>
}));
vi.mock('../components/analytics/UpdateDetector', () => ({
    default: () => <div data-testid="update-detector">UpdateDetector</div>
}));

describe('ConsolidatedAnalyticsPage Cleanup', () => {
    it('renders all components initially', () => {
        const mockData = {
            data: [],
            analytics: {
                totalLideres: 10,
                totalBrigadistas: 50,
                totalMobilizers: 200,
                totalCitizens: 5000,
                goals: {
                    overallProgress: { percentage: 50, current: 5000, target: 10000 },
                    individualGoals: [
                        { id: '1', name: 'Leader 1', current: 100, target: 200, status: 'on-track' }
                    ],
                    milestones: [
                        { description: 'Milestone 1', date: '2026-01-01', target: 1000, completed: true }
                    ]
                },
                dailyRegistrations: [],
                weeklyRegistrations: [],
                monthlyRegistrations: []
            },
            loading: false,
            error: null,
            realTimeStatus: 'connected',
            recentUpdates: [],
            // ... other mocked returns
            getRegistrationsByPeriod: vi.fn(),
            refetchData: vi.fn(),
            triggerRealTimeRefresh: vi.fn(),
            checkRealTimeConnection: vi.fn(),
            detectManualUpdates: vi.fn(),
            clearRealTimeError: vi.fn(),
            clearRecentUpdates: vi.fn()
        };

        (useData as any).mockReturnValue(mockData);

        render(<ConsolidatedAnalyticsPage />);

        // Check for components to be REMOVED (should NOT be in document)
        expect(screen.queryByTestId('brigadier-chart')).not.toBeInTheDocument();
        expect(screen.queryByTestId('leader-chart')).not.toBeInTheDocument();
        expect(screen.queryByTestId('enhanced-leader-chart')).not.toBeInTheDocument();
        expect(screen.queryByText('Metas Individuales por Líder')).not.toBeInTheDocument();
        expect(screen.queryByText('Hitos del Año')).not.toBeInTheDocument();

        // Check for components to be KEPT (should be in document)
        expect(screen.getByTestId('line-chart')).toBeInTheDocument();
        expect(screen.getByTestId('kpi-section')).toBeInTheDocument();
        expect(screen.getByText('Meta General del Año')).toBeInTheDocument();
        expect(screen.getByTestId('leader-productivity-table')).toBeInTheDocument();
    });
});
