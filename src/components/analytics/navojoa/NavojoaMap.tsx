import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, LayersControl, useMap } from 'react-leaflet';
import L from 'leaflet';
import { ElectoralSectionLayer } from './ElectoralSectionLayer';
import { AffiliateMarkerLayer } from './AffiliateMarkerLayer';
import { Person, NavojoaElectoralSection } from '../../../types';
import { X, Users, MapPin, Search } from 'lucide-react';

// Fix for default Leaflet icon issues with Vite/Webpack
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

// Navojoa Coordinates
const NAVOJOA_CENTER: [number, number] = [27.0728, -109.4437];
const DEFAULT_ZOOM = 13;

interface NavojoaMapProps {
    data?: Person[];
    height?: string;
    isEditable?: boolean;
    searchTerm?: string;
    onSearchChange?: (term: string) => void;
    allPeople?: Person[];
    selectedRole?: string;
    onRoleChange?: (role: string) => void;
}

const MapController = () => {
    const map = useMap();
    useEffect(() => {
        setTimeout(() => map.invalidateSize(), 100);
    }, [map]);
    return null;
};

const SectionDetailPanel: React.FC<{ section: NavojoaElectoralSection | null, onClose: () => void }> = ({ section, onClose }) => {
    if (!section) return null;

    return (
        <div className="absolute top-4 right-4 z-[1000] w-72 bg-white/95 backdrop-blur-sm rounded-lg shadow-xl border border-gray-200 p-4 animate-fade-in-right">
            <div className="flex justify-between items-center mb-3">
                <h3 className="font-bold text-primary flex items-center gap-2">
                    <MapPin className="w-5 h-5"/>
                    Sección {section.sectionNumber}
                </h3>
                <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full"><X className="w-4 h-4"/></button>
            </div>
            <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                    <span className="text-gray-600">Colonia Principal:</span>
                    <span className="font-medium text-gray-800">{section.colonia || 'N/D'}</span>
                </div>
                <div className="flex justify-between items-center bg-gray-50 p-2 rounded-md">
                    <span className="text-gray-700 font-bold">Total Registros:</span>
                    <span className="font-bold text-lg text-primary">{section.totalRegistrations}</span>
                </div>
                <div className="border-t my-2"></div>
                <h4 className="font-semibold text-gray-700 pt-1">Desglose:</h4>
                <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Líderes:</span>
                    <span className="font-medium">{section.lideres}</span>
                </div>
                <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Brigadistas:</span>
                    <span className="font-medium">{section.brigadistas}</span>
                </div>
                <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Movilizadores:</span>
                    <span className="font-medium">{section.movilizadores}</span>
                </div>
                <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Ciudadanos:</span>
                    <span className="font-medium">{section.ciudadanos}</span>
                </div>
            </div>
        </div>
    );
};

const SearchOverlay: React.FC<{ 
    searchTerm: string, 
    onSearchChange: (term: string) => void,
    allPeople: Person[]
}> = ({ searchTerm, onSearchChange, allPeople }) => {
    // ... (Existing implementation)
    const [suggestions, setSuggestions] = useState<Person[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    // Filter suggestions when searchTerm changes
    useEffect(() => {
        if (!searchTerm || searchTerm.length < 2) {
            setSuggestions([]);
            return;
        }

        const term = searchTerm.toLowerCase();
        // Limit to 8 suggestions for performance and UI fit
        const matches = allPeople
            .filter(p => p.nombre.toLowerCase().includes(term) || (p.clave_electoral && p.clave_electoral.toLowerCase().includes(term)))
            .slice(0, 8);
        
        setSuggestions(matches);
        setShowSuggestions(true);
    }, [searchTerm, allPeople]);

    // Click outside to close
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setShowSuggestions(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [wrapperRef]);

    const handleSelect = (person: Person) => {
        onSearchChange(person.nombre);
        setShowSuggestions(false);
    };

    return (
        <div ref={wrapperRef} className="absolute top-4 left-14 z-[1000] w-72">
            <div className="relative">
                <input
                    type="text"
                    placeholder="Buscar afiliado..."
                    value={searchTerm}
                    onChange={(e) => {
                        onSearchChange(e.target.value);
                        setShowSuggestions(true);
                    }}
                    className="w-full bg-white/95 backdrop-blur-sm border border-gray-300 text-gray-700 text-sm rounded-lg shadow-md focus:ring-primary focus:border-primary block p-2 pl-9"
                />
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                {searchTerm && (
                    <button 
                        onClick={() => onSearchChange('')}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                        <X className="w-4 h-4" />
                    </button>
                )}
            </div>
            
            {showSuggestions && suggestions.length > 0 && (
                <ul className="absolute z-[1001] w-full bg-white mt-1 rounded-lg shadow-lg border border-gray-100 max-h-60 overflow-y-auto">
                    {suggestions.map(person => (
                        <li 
                            key={person.id}
                            onClick={() => handleSelect(person)}
                            className="px-3 py-2 hover:bg-gray-50 cursor-pointer text-sm border-b border-gray-50 last:border-0"
                        >
                            <div className="font-medium text-gray-800">{person.nombre}</div>
                            <div className="text-xs text-gray-500 flex justify-between">
                                <span>{person.role}</span>
                                {person.clave_electoral && <span>{person.clave_electoral}</span>}
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export const NavojoaMap: React.FC<NavojoaMapProps> = ({ 
    data = [], 
    height = '600px',
    isEditable: initialEditable = false,
    searchTerm = '',
    onSearchChange = () => {},
    allPeople = [],
    selectedRole = 'all',
    onRoleChange = () => {}
}) => {
    const [isEditable, setIsEditable] = React.useState(initialEditable);
    const [selectedSection, setSelectedSection] = React.useState<NavojoaElectoralSection | null>(null);

    return (
        <div style={{ height, width: '100%', position: 'relative' }} className="rounded-xl overflow-hidden border border-gray-200 shadow-sm">
            
            <SectionDetailPanel section={selectedSection} onClose={() => setSelectedSection(null)} />
            
            {/* Search Overlay */}
            <SearchOverlay 
                searchTerm={searchTerm} 
                onSearchChange={onSearchChange} 
                allPeople={allPeople} 
            />

            {/* Role Filter Overlay (New) */}
            <div className="absolute top-16 left-14 z-[1000] w-40">
                <select
                    value={selectedRole}
                    onChange={(e) => onRoleChange(e.target.value)}
                    className="w-full bg-white/95 backdrop-blur-sm border border-gray-300 text-gray-700 text-xs rounded-lg shadow-md focus:ring-primary focus:border-primary block p-2"
                >
                    <option value="all">Todos los Roles</option>
                    <option value="lider">Líderes</option>
                    <option value="brigadista">Brigadistas</option>
                    <option value="movilizador">Movilizadores</option>
                </select>
            </div>
            
            {/* Botón de Modo Edición en la esquina inferior izquierda */}
            <div className="absolute bottom-4 left-3 z-[1000] flex flex-col gap-2">
                <button
                    onClick={() => setIsEditable(!isEditable)}
                    className={`p-2 rounded-md shadow-md transition-colors ${
                        isEditable 
                        ? 'bg-secondary text-white ring-2 ring-white' 
                        : 'bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                    title={isEditable ? "Desactivar edición" : "Activar edición de ubicación (Arrastrar pines)"}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                        <circle cx="12" cy="10" r="3"></circle>
                        {isEditable && <path d="M12 2v4M12 18v4M2 12h4M18 12h4"></path>}
                    </svg>
                </button>
            </div>

            {isEditable && (
                <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[1000] bg-secondary text-white px-4 py-1 rounded-full text-xs font-bold shadow-lg animate-pulse border-2 border-white">
                    MODO EDICIÓN ACTIVO: Arrastre los pines para corregir
                </div>
            )}

            <MapContainer
                center={NAVOJOA_CENTER}
                zoom={DEFAULT_ZOOM}
                scrollWheelZoom={true}
                style={{ height: '100%', width: '100%' }}
            >
                <MapController />
                
                <LayersControl position="topright">
                    <LayersControl.BaseLayer checked name="Calles (OSM)">
                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                    </LayersControl.BaseLayer>
                    
                    <LayersControl.BaseLayer name="Alto Contraste">
                        <TileLayer
                            attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
                            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                        />
                    </LayersControl.BaseLayer>

                    <LayersControl.BaseLayer name="Satélite">
                        <TileLayer
                            attribution='&copy; Esri, i-cubed, USDA, USGS'
                            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                        />
                    </LayersControl.BaseLayer>

                    <LayersControl.Overlay checked name="Secciones Electorales">
                        <ElectoralSectionLayer data={data} onSectionSelect={setSelectedSection} isEditable={isEditable} />
                    </LayersControl.Overlay>

                    <LayersControl.Overlay checked name="Afiliados">
                        <AffiliateMarkerLayer data={data} isEditable={isEditable} />
                    </LayersControl.Overlay>
                </LayersControl>
            </MapContainer>
        </div>
    );
};


export default NavojoaMap;
