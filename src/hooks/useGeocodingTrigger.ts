import { useEffect, useRef } from 'react';
import { realTimeUpdateService, UpdateEvent } from '../services/realTimeUpdateService';
import { GeocodingService } from '../services/geocodingService';
import { DataService } from '../services/dataService';
import { Person } from '../types';

export const useGeocodingTrigger = (isEnabled: boolean = true) => {
  const processedIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!isEnabled) return;

    const handleUpdate = async (event: UpdateEvent) => {
      // Only process INSERT or UPDATE for people tables
      if (
        (event.eventType === 'INSERT' || event.eventType === 'UPDATE') &&
        ['lideres', 'brigadistas', 'movilizadores', 'ciudadanos'].includes(event.table) &&
        event.new
      ) {
        const person = event.new as any;
        const personId = person.id;

        // Debounce/Prevent double processing within short window
        if (processedIds.current.has(personId)) return;
        
        // Skip if it doesn't have an address to geocode
        if (!person.direccion) return;

        // Skip if already geocoded successfully or manually
        if (person.geocode_status === 'success' || person.geocode_status === 'manual') return;

        processedIds.current.add(personId);
        
        // Clear from processed after a while to allow future legitimate updates
        setTimeout(() => {
          processedIds.current.delete(personId);
        }, 10000);

        try {
          console.log(`Triggering lazy geocoding for ${event.table}:${personId}`);
          
          // Construct a Partial<Person> for the geocoding service
          const personData: Partial<Person> = {
            id: personId,
            role: event.table.slice(0, -1) as any, // Simple table to role mapping
            direccion: person.direccion,
            colonia: person.colonia,
            municipio: person.municipio,
            entidad: person.entidad,
            geocode_status: person.geocode_status
          };

          // Handle special cases for role mapping if table names differ
          if (event.table === 'lideres') personData.role = 'lider';

          await GeocodingService.processLazyGeocoding(
            personData,
            DataService.updateGeolocatedPerson.bind(DataService)
          );
        } catch (error) {
          console.error(`Error in geocoding trigger for ${personId}:`, error);
        }
      }
    };

    const listener = {
      onUpdate: handleUpdate,
      onError: (err: Error) => console.error('Geocoding trigger realtime error:', err)
    };

    realTimeUpdateService.addListener(listener);
    console.log('Geocoding real-time trigger initialized');

    return () => {
      realTimeUpdateService.removeListener(listener);
    };
  }, [isEnabled]);
};
