import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import App from '../App';
import { GlobalFilterProvider } from '../context/GlobalFilterContext';

// App depends on GlobalFilterProvider being above it, which I added to main.tsx
// But for unit tests of App, I should wrap it or mock the context.
// Since I want to test the integration of Context + App, I'll wrap it.

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
        expect(screen.getByText('Productividad de Brigadistas')).toBeInTheDocument();
        expect(screen.getByRole('heading', { level: 2, name: 'Brigadistas' })).toBeInTheDocument();
    });
});
