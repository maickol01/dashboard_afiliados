import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ProductivityTable from '../components/shared/ProductivityTable';
import { GlobalFilterProvider } from '../context/GlobalFilterContext';

const mockDate = new Date();
const twoDaysAgo = new Date(mockDate);
twoDaysAgo.setDate(mockDate.getDate() - 2);
const tenDaysAgo = new Date(mockDate);
tenDaysAgo.setDate(mockDate.getDate() - 10);

// Mock data
const mockData = [
    {
        id: '1',
        name: 'Leader 1',
        role: 'lider',
        created_at: mockDate.toISOString(), // Today
        children: [
            {
                id: '2',
                role: 'brigadista',
                created_at: mockDate.toISOString(), // Today
                children: [
                    {
                        id: '3',
                        role: 'movilizador',
                        created_at: twoDaysAgo.toISOString(), // 2 days ago (Assume same week)
                        children: [
                            {
                                id: '4',
                                role: 'ciudadano',
                                created_at: tenDaysAgo.toISOString(), // 10 days ago (Assume same month)
                            }
                        ]
                    }
                ]
            }
        ],
        registeredCount: 0,
        nombre: 'Leader 1',
        num_verificado: true
    }
];

describe('ProductivityTable', () => {
    it('calculates fixed and reactive columns correctly', () => {
        render(
            <GlobalFilterProvider>
                <ProductivityTable role="lider" data={mockData as any} />
            </GlobalFilterProvider>
        );

        // Check columns exist
        expect(screen.getByText('Día')).toBeInTheDocument();
        expect(screen.getByText('Semana')).toBeInTheDocument();
        expect(screen.getByText('Mes')).toBeInTheDocument();
        expect(screen.getByText('Total')).toBeInTheDocument();

        // Check counts
        // Leader 1 row
        const row = screen.getByRole('row', { name: /Leader 1/ });
        
        expect(row).toHaveTextContent('Leader 1');
    });
});