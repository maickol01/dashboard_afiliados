import React, { useMemo } from 'react';
import MarkerClusterGroup from 'react-leaflet-cluster';
import { Person } from '../../../types';
import { PinMarker } from './PinMarker';
import L from 'leaflet';

interface AffiliateMarkerLayerProps {
    data: Person[];
    isEditable?: boolean;
}

// SVG para el icono del clúster (Pin Azul)
const BLUE_PIN_SVG_CLUSTER = (count: number) => `
<svg width="32" height="30" viewBox="0 0 32 30" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M16 0C8.27 0 2 6.27 2 14C2 22.5 16 30 16 30C16 30 30 22.5 30 14C30 6.27 23.73 0 16 0Z" fill="#2563eb"/>
  <circle cx="16" cy="14" r="8" fill="white"/>
  <text x="16" y="18" font-size="12" font-weight="bold" text-anchor="middle" fill="#2563eb">${count}</text>
</svg>
`;

// Función para crear el icono del clúster personalizado
const createClusterCustomIcon = function (cluster: any) {
  const count = cluster.getChildCount();
  return L.divIcon({
    html: BLUE_PIN_SVG_CLUSTER(count),
    className: 'custom-cluster-pin',
    iconSize: L.point(32, 30, true),
    iconAnchor: [16, 30]
  });
};


export const AffiliateMarkerLayer: React.FC<AffiliateMarkerLayerProps> = ({ data, isEditable = false }) => {
    // La data ya viene aplanada, solo la filtramos
    const displayPeople = useMemo(() => {
        return data.filter(p => {
            const hasCoords = p.lat != null && p.lng != null;
            const isSuccess = p.geocode_status === 'success' || p.geocode_status === 'manual' || p.geocode_status === 'complete';
            return hasCoords && (isEditable || isSuccess);
        });
    }, [data, isEditable]);

    const handleDragEnd = async (personId: string, role: string, e: any) => {
        const position = e.target.getLatLng();
        try {
            console.log(`Actualizando ubicación manual para ${personId}:`, position);
            const { DataService } = await import('../../../services/dataService');
            await DataService.updateGeolocatedPerson(personId, role, {
                lat: position.lat,
                lng: position.lng,
                geocode_status: 'manual',
                geocoded_at: new Date()
            });
            alert(`Ubicación actualizada correctamente.`);
        } catch (error) {
            console.error('Error updating manual location:', error);
            alert('Error al actualizar la ubicación.');
        }
    };

    const markers = displayPeople.map(person => (
        <PinMarker 
            key={person.id}
            person={person}
            isEditable={isEditable}
            onDragEnd={handleDragEnd}
        />
    ));

    // Si estamos en modo edición, renderizamos los marcadores directamente.
    if (isEditable) {
        return <>{markers}</>;
    }

    // En modo normal, usamos clustering para el rendimiento.
    return (
        <MarkerClusterGroup
            chunkedLoading
            spiderfyOnMaxZoom={true}
            zoomToBoundsOnClick={true}
            maxClusterRadius={15} // Muy bajo para agrupar solo cuando están muy juntos
            disableClusteringAtZoom={16} // Desactiva el clustering un nivel antes
            iconCreateFunction={createClusterCustomIcon} // ¡NUEVO! Icono personalizado
        >
            {markers}
        </MarkerClusterGroup>
    );
};


