import React, { useEffect } from 'react';
import { MapContainer, TileLayer, LayersControl, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { ElectoralSectionLayer } from './ElectoralSectionLayer';
import { AffiliateMarkerLayer } from './AffiliateMarkerLayer';
import { Person } from '../../../types';

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
}

/**
 * Component to handle map resizing and other leaflet-specific logic
 */
const MapController = () => {
    const map = useMap();
    
    useEffect(() => {
        // Force a resize check after mount to ensure map fills container
        setTimeout(() => {
            map.invalidateSize();
        }, 100);
    }, [map]);

    return null;
};

export const NavojoaMap: React.FC<NavojoaMapProps> = ({ 
    data = [], 
    height = '600px',
    isEditable: initialEditable = false
}) => {
    const [isEditable, setIsEditable] = React.useState(initialEditable);

    return (
        <div style={{ height, width: '100%', position: 'relative' }} className="rounded-xl overflow-hidden border border-gray-200 shadow-sm">
            {/* Toggle Editable Mode Button */}
            <div className="absolute top-20 left-3 z-[1000] flex flex-col gap-2">
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
                    <LayersControl.BaseLayer checked name="Calles (OpenStreetMap)">
                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                    </LayersControl.BaseLayer>
                    
                    <LayersControl.BaseLayer name="Alto Contraste (CartoDB)">
                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                        />
                    </LayersControl.BaseLayer>

                    <LayersControl.BaseLayer name="Satélite">
                        <TileLayer
                            attribution='&copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
                            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                        />
                    </LayersControl.BaseLayer>

                    <LayersControl.Overlay checked name="Secciones Electorales">
                        <ElectoralSectionLayer data={data} />
                    </LayersControl.Overlay>

                    <LayersControl.Overlay checked name="Afiliados (Líderes, Brigadistas...)">
                        <AffiliateMarkerLayer data={data} isEditable={isEditable} />
                    </LayersControl.Overlay>
                </LayersControl>
            </MapContainer>
        </div>
    );
};

export default NavojoaMap;
