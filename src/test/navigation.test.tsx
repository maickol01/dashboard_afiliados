import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import App from '../App';
import { GlobalFilterProvider } from '../context/GlobalFilterContext';

// Mock useData hook
vi.mock('../hooks/useData', () => ({
    useData: () => ({
        data: [
            { id: '1', name: 'Leader 1', role: 'lider', children: [] }
        ],
        loading: false,
        error: null,
        analytics: {
            totalLideres: 1,
            totalBrigadistas: 0,
            totalMobilizers: 0,
            totalCitizens: 0,
            dailyRegistrations: [],
            weeklyRegistrations: [],
            monthlyRegistrations: [],
            goals: { overallProgress: { percentage: 0, current: 0, target: 100 } }
        },
        realTimeStatus: { isConnected: true, error: null },
        recentUpdates: [],
        triggerRealTimeRefresh: vi.fn(),
        checkRealTimeConnection: vi.fn(),
        detectManualUpdates: vi.fn(),
        clearRealTimeError: vi.fn(),
        clearRecentUpdates: vi.fn(),
        refetchData: vi.fn()
    })
}));

describe('Navigation Integration', () => {
    it('navigates between pages using context', () => {
        render(
            <GlobalFilterProvider>
                <App />
            </GlobalFilterProvider>
        );

        // Check initial page
        expect(screen.getByRole('heading', { level: 2, name: 'Analytics' })).toBeInTheDocument();

        // Find Brigadistas link in sidebar (desktop version is usually visible in test env if not hidden)
        const brigadistasLinks = screen.getAllByText('Brigadistas');
        // Usually there's one in mobile menu and one in desktop sidebar.
        fireEvent.click(brigadistasLinks[0]);

        // Check if page changed
        expect(screen.getByText('Detalle de Productividad por Brigadista')).toBeInTheDocument();
        expect(screen.getByRole('heading', { level: 2, name: 'Brigadistas' })).toBeInTheDocument();
    });
});
