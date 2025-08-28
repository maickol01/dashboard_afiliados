import React from 'react';
import { render, screen } from '@testing-library/react';
import { Users } from 'lucide-react';
import KPICardsSection from '../KPICardsSection';

describe('KPICardsSection', () => {
  const mockCards = [
    {
      name: 'Total Líderes',
      value: 10,
      icon: Users,
      color: 'bg-primary',
      change: '+12%',
      trend: 'up' as const,
    },
    {
      name: 'Total Brigadistas',
      value: 25,
      icon: Users,
      color: 'bg-secondary',
      change: '+8%',
      trend: 'up' as const,
    },
  ];

  it('renders KPI cards correctly', () => {
    render(<KPICardsSection cards={mockCards} />);
    
    expect(screen.getByText('Total Líderes')).toBeInTheDocument();
    expect(screen.getByText('Total Brigadistas')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getByText('25')).toBeInTheDocument();
    expect(screen.getByText('+12%')).toBeInTheDocument();
    expect(screen.getByText('+8%')).toBeInTheDocument();
  });

  it('renders title when provided', () => {
    render(<KPICardsSection title="Test Title" cards={mockCards} />);
    
    expect(screen.getByText('Test Title')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    render(<KPICardsSection cards={mockCards} loading={true} />);
    
    // Should show skeleton loaders
    expect(document.querySelectorAll('.animate-pulse')).toHaveLength(1);
  });

  it('handles empty cards array', () => {
    render(<KPICardsSection cards={[]} />);
    
    // Should render without crashing
    expect(document.querySelector('.grid')).toBeInTheDocument();
  });
});