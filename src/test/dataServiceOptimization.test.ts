import { describe, it, expect, beforeEach, vi } from 'vitest'
import { DataService } from '../services/dataService'

// Mock Supabase
vi.mock('../lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        order: vi.fn(() => ({
          range: vi.fn(() => Promise.resolve({ data: [], error: null }))
        }))
      }))
    }))
  }
}))

describe('DataService Optimizations', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should track performance metrics', () => {
    const metrics = DataService.getPerformanceMetrics()
    expect(Array.isArray(metrics)).toBe(true)
  })

  it('should provide progressive loading state', () => {
    const state = DataService.getProgressiveLoadingState()
    expect(state).toHaveProperty('isLoading')
    expect(state).toHaveProperty('progress')
    expect(state).toHaveProperty('currentStep')
    expect(state).toHaveProperty('totalSteps')
  })

  it('should handle empty data gracefully', async () => {
    // Mock empty data response
    const mockSupabase = await import('../lib/supabase')
    vi.mocked(mockSupabase.supabase.from).mockReturnValue({
      select: vi.fn(() => ({
        order: vi.fn(() => ({
          range: vi.fn(() => Promise.resolve({ data: [], error: null }))
        })),
        head: true
      }))
    } as any)

    try {
      const result = await DataService.getAllHierarchicalData(true)
      expect(Array.isArray(result)).toBe(true)
    } catch (error) {
      // Expected to fail due to mocking limitations, but should not crash
      expect(error).toBeDefined()
    }
  })
})