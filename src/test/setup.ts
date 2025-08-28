/**
 * Test setup file for Vitest
 */

import { vi } from 'vitest';
import '@testing-library/jest-dom';

// Mock environment variables
process.env.NODE_ENV = 'test';

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
};

// Mock Date.now for consistent testing
const mockDate = new Date('2024-01-01T00:00:00.000Z');
vi.setSystemTime(mockDate);