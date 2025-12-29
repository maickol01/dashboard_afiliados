import React, { useMemo } from 'react';
import { Marker, Popup } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import L from 'leaflet';
import { Person } from '../../../types';

interface AffiliateMarkerLayerProps {
    data: Person[];
    isEditable?: boolean;
}

// Custom Red Pin SVG
const RED_PIN_SVG = `
<svg width="30" height="42" viewBox="0 0 30 42" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M15 0C6.71573 0 0 6.71573 0 15C0 26.25 15 42 15 42C15 42 30 26.25 30 15C30 6.71573 23.2843 0 15 0ZM15 20.25C12.1005 20.25 9.75 17.8995 9.75 15C9.75 12.1005 12.1005 9.75 15 9.75C17.8995 9.75 20.25 12.1005 20.25 15C20.25 17.8995 17.8995 20.25 15 20.25Z" fill="#9f2241"/>
    <circle cx="15" cy="15" r="5" fill="white"/>
</svg>
`;

const RedPinIcon = L.divIcon({
    html: RED_PIN_SVG,
    className: 'custom-div-icon',
    iconSize: [30, 42],
    iconAnchor: [15, 42],
    popupAnchor: [0, -40]
});

export const AffiliateMarkerLayer: React.FC<AffiliateMarkerLayerProps> = ({ data, isEditable = false }) => {
    // Flatten and filter for geocoded people or all people if in editable mode
    const displayPeople = useMemo(() => {
        const flat: Person[] = [];
        const flatten = (items: Person[]) => {
            items.forEach(p => {
                const hasCoords = p.lat && p.lng;
                const isSuccess = p.geocode_status === 'success' || p.geocode_status === 'manual';
                
                // In editable mode, show everyone (to fix failed ones)
                // In normal mode, only show successful ones
                if (hasCoords && (isEditable || isSuccess)) {
                    flat.push(p);
                }
                if (p.children) flatten(p.children);
            });
        };
        flatten(data);
        return flat;
    }, [data, isEditable]);

    const handleDragEnd = async (personId: string, role: string, e: L.DragEndEvent) => {
        const marker = e.target;
        const position = marker.getLatLng();
        
        try {
            console.log(`Actualizando ubicación manual para ${personId}:`, position);
            
            // Use DataService to update the coordinates
            // Importing DataService here if needed or passed via props
            const { DataService } = await import('../../../services/dataService');
            
            await DataService.updateGeolocatedPerson(personId, role, {
                lat: position.lat,
                lng: position.lng,
                geocode_status: 'manual',
                geocoded_at: new Date()
            });
            
            // Note: In a real app, you'd want a notification here
            alert(`Ubicación de ${personId} actualizada correctamente.`);
        } catch (error) {
            console.error('Error updating manual location:', error);
            alert('Error al actualizar la ubicación.');
        }
    };

    return (
        <MarkerClusterGroup
            chunkedLoading
            maxClusterRadius={50}
            showCoverageOnHover={false}
            polygonOptions={{
                fillColor: '#9f2241',
                color: '#9f2241',
                weight: 2,
                opacity: 0.5,
                fillOpacity: 0.2,
            }}
        >
            {displayPeople.map(person => (
                <Marker 
                    key={person.id} 
                    position={[person.lat!, person.lng!]} 
                    icon={RedPinIcon}
                    draggable={isEditable}
                    eventHandlers={{
                        dragend: (e) => handleDragEnd(person.id, person.role, e),
                    }}
                >
                    <Popup className="custom-leaflet-popup">
                        <div className="p-1 min-w-[150px]">
                            {isEditable && (
                                <div className="bg-yellow-50 text-yellow-700 text-[10px] p-1 rounded mb-2 font-bold text-center border border-yellow-200">
                                    MODO EDICIÓN: Arrastre para mover
                                </div>
                            )}
                            <div className="flex items-center gap-2 mb-2">
                                <div className={`w-3 h-3 rounded-full ${
                                    person.role === 'lider' ? 'bg-primary' : 
                                    person.role === 'brigadista' ? 'bg-secondary' : 
                                    person.role === 'movilizador' ? 'bg-accent' : 'bg-gray-400'
                                }`} />
                                <span className="text-xs font-bold uppercase tracking-wider text-neutral">
                                    {person.role}
                                </span>
                            </div>
                            
                            <h3 className="font-bold text-sm mb-1">{person.name}</h3>
                            <p className="text-xs text-gray-600 mb-2 leading-tight">
                                {person.direccion}, {person.colonia}
                            </p>
                            
                            <div className="border-t border-gray-100 pt-2 flex flex-col gap-1">
                                {person.geocode_status === 'failed' && (
                                    <div className="text-[10px] text-red-500 font-bold mb-1">
                                        ⚠️ Geocodificación fallida
                                    </div>
                                )}
                                {person.seccion && (
                                    <div className="text-[10px] text-gray-500">
                                        Sección: <span className="font-medium text-gray-700">{person.seccion}</span>
                                    </div>
                                )}
                                <button 
                                    className="mt-1 text-[10px] text-secondary font-bold hover:underline text-left"
                                    onClick={() => console.log('Ver perfil:', person.id)}
                                >
                                    VER PERFIL COMPLETO →
                                </button>
                            </div>
                        </div>
                    </Popup>
                </Marker>
            ))}
        </MarkerClusterGroup>
    );
};

export default AffiliateMarkerLayer;
