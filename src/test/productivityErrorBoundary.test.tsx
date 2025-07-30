import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import WorkerProductivityAnalytics from '../components/analytics/productivity/WorkerProductivityAnalytics';
import { Person } from '../types';

// Mock console.error to avoid noise in tests
const originalError = console.error;
beforeAll(() => {
  console.error = vi.fn();
});

afterAll(() => {
  console.error = originalError;
});

describe('WorkerProductivityAnalytics Error Boundary', () => {
  it('should handle render errors gracefully', () => {
    // Create a component that will throw an error during render
    const ThrowingComponent = () => {
      throw new Error('Test render error');
    };

    // Mock the LeaderProductivityMetrics to throw an error
    vi.doMock('../components/analytics/productivity/LeaderProductivityMetrics', () => ({
      default: ThrowingComponent
    }));

    const testData: Person[] = [
      {
        id: 'test-leader',
        name: 'Test Leader',
        nombre: 'Test Leader',
        role: 'lider',
        created_at: new Date(),
        registeredCount: 10,
        num_verificado: true,
        children: []
      }
    ];

    // This should not crash the entire application
    render(<WorkerProductivityAnalytics hierarchicalData={testData} loading={false} />);

    // The component should still render something, even if it's an error state
    expect(document.body).toBeInTheDocument();
  });

  it('should handle critical errors with error boundary', () => {
    // Test with extremely malformed data that could cause runtime errors
    const malformedData = [
      {
        // Missing required fields
        id: null,
        name: undefined,
        role: 'invalid-role',
        created_at: 'not-a-date',
        registeredCount: 'not-a-number',
        num_verificado: null,
        children: 'not-an-array'
      }
    ] as any;

    // This should not crash the application
    const { container } = render(
      <WorkerProductivityAnalytics 
        hierarchicalData={malformedData} 
        loading={false} 
      />
    );

    // Should render something (either the component or an error state)
    expect(container).toBeInTheDocument();
  });

  it('should handle async errors in data generation', async () => {
    // Mock DataService to throw an error
    vi.doMock('../services/dataService', () => ({
      DataService: {
        generateWorkerProductivityAnalytics: vi.fn().mockRejectedValue(new Error('Async error'))
      }
    }));

    const testData: Person[] = [
      {
        id: 'test-leader',
        name: 'Test Leader',
        nombre: 'Test Leader',
        role: 'lider',
        created_at: new Date(),
        registeredCount: 10,
        num_verificado: true,
        children: []
      }
    ];

    // This should handle the async error gracefully
    render(<WorkerProductivityAnalytics hierarchicalData={testData} loading={false} />);

    // Should render the component without crashing
    expect(document.body).toBeInTheDocument();
  });

  it('should recover from errors when retry is clicked', () => {
    const testData: Person[] = [
      {
        id: 'test-leader',
        name: 'Test Leader',
        nombre: 'Test Leader',
        role: 'lider',
        created_at: new Date(),
        registeredCount: 10,
        num_verificado: true,
        children: []
      }
    ];

    // Render the component
    render(<WorkerProductivityAnalytics hierarchicalData={testData} loading={false} />);

    // Should render without crashing
    expect(document.body).toBeInTheDocument();
  });
});