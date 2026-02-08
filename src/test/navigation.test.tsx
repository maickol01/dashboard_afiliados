import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from '../App';
import { GlobalFilterProvider } from '../context/GlobalFilterContext';

// Mock useData hook
vi.mock('../hooks/useData', () => ({
    useData: () => ({
// ... (rest of the mock remains the same)
        refetchData: vi.fn()
    })
}));

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: false,
        },
    },
});

describe('Navigation Integration', () => {
    it('navigates between pages using context', () => {
        render(
            <QueryClientProvider client={queryClient}>
                <GlobalFilterProvider>
                    <App />
                </GlobalFilterProvider>
            </QueryClientProvider>
        );

        // Check initial page
// ... (rest remains the same)
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
