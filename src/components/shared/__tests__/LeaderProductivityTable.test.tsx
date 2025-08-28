import React from 'react';
import { render, screen } from '@testing-library/react';
import LeaderProductivityTable from '../LeaderProductivityTable';
import { Person } from '../../../types';

describe('LeaderProductivityTable', () => {
  const mockHierarchicalData: Person[] = [
    {
      id: '1',
      name: 'Líder 1',
      nombre: 'Líder 1',
      role: 'lider',
      created_at: new Date(),
      registeredCount: 50,
      num_verificado: false,
      children: [
        {
          id: '2',
          name: 'Brigadista 1',
          nombre: 'Brigadista 1',
          role: 'brigadista',
          created_at: new Date(),
          registeredCount: 25,
          num_verificado: false,
          children: [
            {
              id: '3',
              name: 'Movilizador 1',
              nombre: 'Movilizador 1',
              role: 'movilizador',
              created_at: new Date(),
              registeredCount: 10,
              num_verificado: false,
            },
          ],
        },
      ],
    },
  ];

  it('renders leader productivity table correctly', () => {
    render(<LeaderProductivityTable hierarchicalData={mockHierarchicalData} />);
    
    expect(screen.getByText('Detalle de Productividad por Líder')).toBeInTheDocument();
    expect(screen.getByText('Líder 1')).toBeInTheDocument();
    expect(screen.getByText('50')).toBeInTheDocument(); // ciudadanos
    expect(screen.getByText('#1')).toBeInTheDocument(); // ranking
  });

  it('shows loading state', () => {
    render(<LeaderProductivityTable hierarchicalData={[]} loading={true} />);
    
    expect(document.querySelectorAll('.animate-pulse')).toHaveLength(1);
  });

  it('handles empty data', () => {
    render(<LeaderProductivityTable hierarchicalData={[]} />);
    
    expect(screen.getByText('No hay datos de líderes disponibles')).toBeInTheDocument();
  });

  it('calculates ranking correctly', () => {
    const multipleLeaders: Person[] = [
      {
        id: '1',
        name: 'Líder 1',
        nombre: 'Líder 1',
        role: 'lider',
        created_at: new Date(),
        registeredCount: 30,
        num_verificado: false,
      },
      {
        id: '2',
        name: 'Líder 2',
        nombre: 'Líder 2',
        role: 'lider',
        created_at: new Date(),
        registeredCount: 50,
        num_verificado: false,
      },
    ];

    render(<LeaderProductivityTable hierarchicalData={multipleLeaders} />);
    
    // Líder 2 should be #1 (highest ciudadanos), Líder 1 should be #2
    const rows = screen.getAllByRole('row');
    expect(rows[1]).toHaveTextContent('Líder 2'); // First data row
    expect(rows[1]).toHaveTextContent('#1');
    expect(rows[2]).toHaveTextContent('Líder 1'); // Second data row
    expect(rows[2]).toHaveTextContent('#2');
  });
});