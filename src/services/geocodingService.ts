import { Person } from '../types';

export interface GeocodingResult {
  lat: number;
  lng: number;
  precision: number;
  status: 'success' | 'failed';
}

export class GeocodingService {
  private static tokenOverride: string | null = null;

  static setTokenOverride(token: string | null) {
    this.tokenOverride = token;
  }

  private static getAccessToken(): string | undefined {
    return this.tokenOverride || import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
  }

  /**
   * Geocodes an address using Mapbox API
   * @param address Full address string
   * @returns GeocodingResult
   */
  static async geocodeAddress(address: string): Promise<GeocodingResult> {
    const token = this.getAccessToken();
    if (!token) {
      console.error('Mapbox Access Token is missing');
      return { lat: 0, lng: 0, precision: 0, status: 'failed' };
    }

    try {
      const query = encodeURIComponent(address);
      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${query}.json?access_token=${token}&limit=1&bbox=-109.84,26.50,-109.03,27.38`; // Bounding box for Navojoa region

      const response = await fetch(url);
      const data = await response.json();

      if (data.features && data.features.length > 0) {
        const feature = data.features[0];
        const [lng, lat] = feature.center;
        const relevance = feature.relevance || 0;

        return {
          lat,
          lng,
          precision: relevance,
          status: relevance > 0.7 ? 'success' : 'failed'
        };
      }

      return { lat: 0, lng: 0, precision: 0, status: 'failed' };
    } catch (error) {
      console.error('Error in geocoding:', error);
      return { lat: 0, lng: 0, precision: 0, status: 'failed' };
    }
  }

  /**
   * Formats a Person's address for geocoding
   */
  static formatAddress(person: Partial<Person>): string {
    const parts = [
      person.direccion,
      person.colonia,
      person.municipio || 'Navojoa',
      person.entidad || 'Sonora',
      'Mexico'
    ].filter(Boolean);
    
    return parts.join(', ');
  }

  /**
   * Processes a single person for geocoding
   * This is the "Lazy Geocoding" core logic
   */
  static async processLazyGeocoding(
    person: Partial<Person>, 
    updateFn: (id: string, role: string, data: Partial<Person>) => Promise<void>
  ): Promise<void> {
    if (!person.id || !person.role || !person.direccion) return;

    // Only geocode if pending or failed (retry)
    if (person.geocode_status === 'success' || person.geocode_status === 'manual') return;

    const fullAddress = this.formatAddress(person);
    const result = await this.geocodeAddress(fullAddress);

    const updateData: Partial<Person> = {
      lat: result.lat,
      lng: result.lng,
      geocode_status: result.status,
      geocoded_at: new Date()
    };

    await updateFn(person.id, person.role, updateData);
  }
}
