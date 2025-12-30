import React from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { Person } from '../../../types';

interface PinMarkerProps {
    person: Person;
    isEditable: boolean;
    onDragEnd: (personId: string, role: string, e: any) => void;
}

// Icono y SVG definidos aquí para que el componente sea autocontenido
const RED_PIN_SVG = `
<svg width="100%" height="100%" viewBox="0 0 24 22.5" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M12 0C7.58 0 4 3.58 4 8C4 13.5 12 22.5 12 22.5C12 22.5 20 13.5 20 8C20 3.58 16.42 0 12 0Z" fill="#9f2241"/>
  <circle cx="12" cy="8" r="3" fill="white"/>
</svg>
`;

const RedPinIcon = L.divIcon({
  html: RED_PIN_SVG,
  className: "custom-pin",
  iconSize: [32, 30],
  iconAnchor: [16, 30],
  popupAnchor: [0, -30]
});

export const PinMarker: React.FC<PinMarkerProps> = ({ person, isEditable, onDragEnd }) => {
    return (
        <Marker
            position={[person.lat!, person.lng!]}
            icon={RedPinIcon}
            draggable={isEditable}
            eventHandlers={{
                dragend: (e) => onDragEnd(person.id, person.role, e),
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
    );
};
