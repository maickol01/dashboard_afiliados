import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useMobileDetection } from '../useMobileDetection';

// Mock window.innerWidth
const mockInnerWidth = (width: number) => {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: width,
  });
};

describe('useMobileDetection', () => {
  let originalInnerWidth: number;

  beforeEach(() => {
    originalInnerWidth = window.innerWidth;
  });

  afterEach(() => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: originalInnerWidth,
    });
  });

  it('should detect mobile screen size correctly', () => {
    mockInnerWidth(500);
    
    const { result } = renderHook(() => useMobileDetection());
    
    expect(result.current.isMobile).toBe(true);
    expect(result.current.isTablet).toBe(false);
    expect(result.current.isDesktop).toBe(false);
    expect(result.current.screenWidth).toBe(500);
  });

  it('should detect tablet screen size correctly', () => {
    mockInnerWidth(800);
    
    const { result } = renderHook(() => useMobileDetection());
    
    expect(result.current.isMobile).toBe(false);
    expect(result.current.isTablet).toBe(true);
    expect(result.current.isDesktop).toBe(false);
    expect(result.current.screenWidth).toBe(800);
  });

  it('should detect desktop screen size correctly', () => {
    mockInnerWidth(1200);
    
    const { result } = renderHook(() => useMobileDetection());
    
    expect(result.current.isMobile).toBe(false);
    expect(result.current.isTablet).toBe(false);
    expect(result.current.isDesktop).toBe(true);
    expect(result.current.screenWidth).toBe(1200);
  });

  it('should update on window resize', () => {
    mockInnerWidth(1200);
    
    const { result } = renderHook(() => useMobileDetection());
    
    expect(result.current.isMobile).toBe(false);
    expect(result.current.isDesktop).toBe(true);
    
    // Simulate window resize to mobile
    act(() => {
      mockInnerWidth(600);
      window.dispatchEvent(new Event('resize'));
    });
    
    expect(result.current.isMobile).toBe(true);
    expect(result.current.isDesktop).toBe(false);
  });

  it('should handle edge case at mobile breakpoint', () => {
    mockInnerWidth(768);
    
    const { result } = renderHook(() => useMobileDetection());
    
    expect(result.current.isMobile).toBe(false);
    expect(result.current.isTablet).toBe(true);
  });

  it('should handle edge case just below mobile breakpoint', () => {
    mockInnerWidth(767);
    
    const { result } = renderHook(() => useMobileDetection());
    
    expect(result.current.isMobile).toBe(true);
    expect(result.current.isTablet).toBe(false);
  });
});