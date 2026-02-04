import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import ConsolidatedAnalyticsPage from '../components/analytics/ConsolidatedAnalyticsPage';
import { useData } from '../hooks/useData';
import { GlobalFilterProvider } from '../context/GlobalFilterContext';
import { useGlobalFilter } from '../context/GlobalFilterContext';

// Mock useData
vi.mock('../hooks/useData');

// Mock components
vi.mock('../components/charts/LineChart', () => ({
  default: ({ registrations }: any) => <div data-testid="line-chart">{registrations.daily.length} points</div>
}));
vi.mock('../components/shared/KPICardsSection', () => ({
  default: ({ cards }: any) => (
    <div data-testid="kpi-section">
      {cards.map((c: any) => (
        <div key={c.name} data-testid={`kpi-${c.name}`}>{c.value}</div>
      ))}
    </div>
  )
}));
vi.mock('../components/shared/LeaderProductivityTable', () => ({
    default: ({ hierarchicalData }: any) => <div data-testid="leader-productivity-table">Table</div>
}));
vi.mock('../components/analytics/RealTimeIndicator', () => ({ default: () => <div /> }));
vi.mock('../components/analytics/UpdateDetector', () => ({ default: () => <div /> }));

// Helper component to change filter in test
const FilterControl = () => {
    const { setFilter } = useGlobalFilter();
    return (
        <button onClick={() => setFilter('day')}>Set Day Filter</button>
    );
};

describe('ConsolidatedAnalyticsPage Filtering', () => {
    it('filters KPI cards based on global filter', async () => {
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);

        const mockData = {
            data: [
                { id: '1', role: 'lider', created_at: today.toISOString(), children: [] },
                { id: '2', role: 'lider', created_at: yesterday.toISOString(), children: [] }
            ],
            analytics: {
                totalLideres: 2,
                totalBrigadistas: 0,
                totalMobilizers: 0,
                totalCitizens: 0,
                goals: { overallProgress: { percentage: 0, current: 0, target: 100 } },
                dailyRegistrations: [
                    { date: today.toISOString(), count: 1 },
                    { date: yesterday.toISOString(), count: 1 }
                ],
                weeklyRegistrations: [],
                monthlyRegistrations: []
            },
            loading: false,
            error: null
        };

        (useData as any).mockReturnValue(mockData);

        render(
            <GlobalFilterProvider>
                <FilterControl />
                <ConsolidatedAnalyticsPage />
            </GlobalFilterProvider>
        );

        // Initially Total (2 leaders)
        expect(screen.getByTestId('kpi-Total Líderes')).toHaveTextContent('2');
        expect(screen.getByTestId('line-chart')).toHaveTextContent('2 points');

        // Click to set filter to Day
        fireEvent.click(screen.getByText('Set Day Filter'));

        // Should filter to 1 leader (Today)
        await waitFor(() => {
            expect(screen.getByTestId('kpi-Total Líderes')).toHaveTextContent('1');
        });
        
        // Line chart should also be filtered
        expect(screen.getByTestId('line-chart')).toHaveTextContent('1 points');
    });
});
