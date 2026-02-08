import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { removeLoader } from '../loader';

describe('loader utility', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('removes the loader element if it exists', () => {
    const loader = document.createElement('div');
    loader.id = 'root-loader';
    document.body.appendChild(loader);

    expect(document.getElementById('root-loader')).not.toBeNull();

    removeLoader();

    expect(document.getElementById('root-loader')).toBeNull();
  });

  it('does nothing if the loader element does not exist', () => {
    expect(document.getElementById('root-loader')).toBeNull();

    // Should not throw error
    expect(() => removeLoader()).not.toThrow();
  });
});
