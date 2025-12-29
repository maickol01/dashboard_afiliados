import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GeocodingService } from '../geocodingService';

describe('GeocodingService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    GeocodingService.setTokenOverride('test-token');
  });

  describe('formatAddress', () => {
    it('should format a full address correctly', () => {
      const person = {
        direccion: 'Calle 123',
        colonia: 'Centro',
        municipio: 'Navojoa',
        entidad: 'Sonora'
      };
      const result = GeocodingService.formatAddress(person as any);
      expect(result).toBe('Calle 123, Centro, Navojoa, Sonora, Mexico');
    });

    it('should handle missing fields gracefully', () => {
      const person = {
        direccion: 'Calle 123',
        colonia: 'Centro'
      };
      const result = GeocodingService.formatAddress(person as any);
      expect(result).toBe('Calle 123, Centro, Navojoa, Sonora, Mexico');
    });
  });

  describe('geocodeAddress', () => {
    it('should return coordinates on success', async () => {
      const mockResponse = {
        features: [
          {
            center: [-109.44, 27.07],
            relevance: 0.9
          }
        ]
      };

      global.fetch = vi.fn().mockResolvedValue({
        json: () => Promise.resolve(mockResponse)
      });

      const result = await GeocodingService.geocodeAddress('Test Address');
      expect(result.status).toBe('success');
      expect(result.lat).toBe(27.07);
      expect(result.lng).toBe(-109.44);
    });

    it('should return failed status on low relevance', async () => {
      const mockResponse = {
        features: [
          {
            center: [-109.44, 27.07],
            relevance: 0.4
          }
        ]
      };

      global.fetch = vi.fn().mockResolvedValue({
        json: () => Promise.resolve(mockResponse)
      });

      const result = await GeocodingService.geocodeAddress('Test Address');
      expect(result.status).toBe('failed');
    });

    it('should return failed status on error', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Network Error'));

      const result = await GeocodingService.geocodeAddress('Test Address');
      expect(result.status).toBe('failed');
      expect(result.lat).toBe(0);
    });
  });
});
