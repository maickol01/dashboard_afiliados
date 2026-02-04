import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Layout from '../components/layout/Layout';
import { GlobalFilterProvider } from '../context/GlobalFilterContext';

describe('Layout Date Filter', () => {
    it('renders date filter on analytics page', () => {
        render(
            <GlobalFilterProvider>
                <Layout currentPage="analytics" onPageChange={() => {}}>
                    <div>Content</div>
                </Layout>
            </GlobalFilterProvider>
        );

        expect(screen.getByTestId('date-filter-dropdown')).toBeInTheDocument();
        // Use heading role to distinguish from sidebar buttons
        expect(screen.getByRole('heading', { level: 2, name: 'Analytics' })).toBeInTheDocument();
    });

    it('does not render date filter on other pages', () => {
        render(
            <GlobalFilterProvider>
                <Layout currentPage="geographic" onPageChange={() => {}}>
                    <div>Content</div>
                </Layout>
            </GlobalFilterProvider>
        );

        expect(screen.queryByTestId('date-filter-dropdown')).not.toBeInTheDocument();
        expect(screen.getByRole('heading', { level: 2, name: 'Análisis Geográfico' })).toBeInTheDocument();
    });
});
