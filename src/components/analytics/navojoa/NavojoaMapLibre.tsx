import React, { useRef, useState, useCallback, useMemo, useEffect } from 'react';
import MapLibre, { NavigationControl, MapRef, Popup, Marker } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Person, NavojoaElectoralSection } from '../../../types';
import { ElectoralSectionLayerLibre } from './ElectoralSectionLayerLibre';
import { AffiliateMarkerLayerLibre } from './AffiliateMarkerLayerLibre';
import { navojoaElectoralService } from '../../../services/navojoaElectoralService';
import { MapPin, X, Maximize, Minimize } from 'lucide-react';
import { SearchOverlay } from './SearchOverlay';

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

const NAVOJOA_CENTER = {
    longitude: -109.4437,
    latitude: 27.0728,
    zoom: 12
};

// SVG for the draggable pin (Red Pin)
const RED_PIN_SVG = `
<svg width="32" height="30" viewBox="0 0 32 30" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M16 0C8.27 0 2 6.27 2 14C2 22.5 16 30 16 30C16 30 30 22.5 30 14C30 6.27 23.73 0 16 0Z" fill="#9f2241"/>
  <circle cx="16" cy="14" r="8" fill="white"/>
  <circle cx="16" cy="14" r="3" fill="#9f2241"/>
</svg>
`;

// OSM Raster Style
const OSM_STYLE = {
    version: 8,
    sources: {
        'osm-tiles': {
            type: 'raster',
            tiles: [
                'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
            ],
            tileSize: 256,
            attribution: '&copy; OpenStreetMap Contributors'
        }
    },
    layers: [
        {
            id: 'osm-tiles-layer',
            type: 'raster',
            source: 'osm-tiles',
            minzoom: 0,
            maxzoom: 19
        }
    ]
};

const SectionDetailPanel: React.FC<{ section: NavojoaElectoralSection | null, onClose: () => void }> = ({ section, onClose }) => {
    if (!section) return null;

    return (
        <div className="absolute top-32 right-4 z-20 w-72 bg-white/95 backdrop-blur-sm rounded-lg shadow-xl border border-gray-200 p-4 animate-fade-in-right">
            <div className="flex justify-between items-center mb-3">
                <h3 className="font-bold text-primary flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    Sección {section.sectionNumber}
                </h3>
                <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full"><X className="w-4 h-4" /></button>
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

const NavojoaMapLibre: React.FC<NavojoaMapProps> = ({
    data = [],
    height = '600px',
    isEditable: initialEditable = false,
    searchTerm = '',
    onSearchChange = () => { },
    allPeople = [],
    selectedRole = 'all',
    onRoleChange = () => { }
}) => {
    const mapRef = useRef<MapRef>(null);
    const [isEditable, setIsEditable] = useState(initialEditable);
    const [selectedSection, setSelectedSection] = useState<NavojoaElectoralSection | null>(null);
    const [popupInfo, setPopupInfo] = useState<any>(null);
    const [isMapLoaded, setIsMapLoaded] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const hoveredSectionIdRef = useRef<string | number | null>(null);
    const selectedSectionIdRef = useRef<string | number | null>(null);

    // Escape key handler
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isFullscreen) {
                setIsFullscreen(false);
            }
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [isFullscreen]);

    // Resize map when fullscreen changes
    useEffect(() => {
        if (mapRef.current) {
            mapRef.current.resize();
        }
    }, [isFullscreen]);

    // Add images to map when loaded
    const onMapLoad = useCallback((event: any) => {
        const map = event.target;

        const createMarkerImage = (color: string, name: string) => {
            const svg = `
            <svg width="32" height="30" viewBox="0 0 32 30" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M16 0C8.27 0 2 6.27 2 14C2 22.5 16 30 16 30C16 30 30 22.5 30 14C30 6.27 23.73 0 16 0Z" fill="${color}"/>
                <circle cx="16" cy="14" r="8" fill="white"/>
            </svg>`;
            const img = new Image();
            const svgBlob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
            const url = URL.createObjectURL(svgBlob);
            img.onload = () => {
                if (!map.hasImage(name)) {
                    map.addImage(name, img);
                    console.log(`Added image ${name} to map`);
                }
                URL.revokeObjectURL(url);
            };
            img.onerror = (e) => console.error(`Failed to load marker image ${name}`, e);
            img.src = url;
        };

        // Standard Icons (Spec colors)
        createMarkerImage('#9f2241', 'marker-ciudadano'); // Red
        createMarkerImage('#FBBF24', 'marker-lider');     // Gold
        createMarkerImage('#A855F7', 'marker-brigadista'); // Purple
        createMarkerImage('#22C55E', 'marker-movilizador'); // Green
        
        // Cluster Icons
        createMarkerImage('#3b82f6', 'cluster-ciudadano');  // Blue
        createMarkerImage('#B45309', 'cluster-lider');      // Dark Gold
        createMarkerImage('#6B21A8', 'cluster-brigadista'); // Dark Purple
        createMarkerImage('#15803D', 'cluster-movilizador'); // Dark Green

        // Legacy support (to avoid breaking existing layers until fully migrated)
        createMarkerImage('#9f2241', 'marker-#9f2241'); 
        createMarkerImage('#3b82f6', 'marker-#3b82f6'); 

        setIsMapLoaded(true);
    }, []);

    const handleDragEnd = async (personId: string, role: string, event: any) => {
        const { lng, lat } = event.lngLat;
        try {
            console.log(`Actualizando ubicación manual para ${personId}:`, { lat, lng });
            const { DataService } = await import('../../../services/dataService');
            await DataService.updateGeolocatedPerson(personId, role, {
                lat: lat,
                lng: lng,
                geocode_status: 'manual',
                geocoded_at: new Date()
            });
            alert(`Ubicación actualizada correctamente.`);
        } catch (error) {
            console.error('Error updating manual location:', error);
            alert('Error al actualizar la ubicación.');
        }
    };

    // Memoize section stats for click handling
    const sectionStats = useMemo(() => {
        const statsData = allPeople.length > 0 ? allPeople : data;
        const sections = navojoaElectoralService.transformHierarchicalDataToSections(statsData);
        return new Map(sections.map(s => [s.sectionNumber.toString(), s]));
    }, [data, allPeople]);

    const onMouseMove = useCallback((event: any) => {
        if (!mapRef.current) return;
        const map = mapRef.current.getMap();

        // Check for point hover first
        const pointFeatures = map.queryRenderedFeatures(event.point, { layers: ['unclustered-point', 'clusters'] });
        if (pointFeatures.length > 0) {
            map.getCanvas().style.cursor = 'pointer';
            if (hoveredSectionIdRef.current !== null) {
                map.setFeatureState({ source: 'sections-source', id: hoveredSectionIdRef.current }, { hover: false });
                hoveredSectionIdRef.current = null;
            }
            return;
        }

        // Check for section hover
        const features = map.queryRenderedFeatures(event.point, { layers: ['sections-fill'] });
        const feature = features[0];

        if (feature && feature.id !== undefined) {
            map.getCanvas().style.cursor = 'pointer';
            if (hoveredSectionIdRef.current !== feature.id) {
                if (hoveredSectionIdRef.current !== null) {
                    map.setFeatureState({ source: 'sections-source', id: hoveredSectionIdRef.current }, { hover: false });
                }
                hoveredSectionIdRef.current = feature.id;
                map.setFeatureState({ source: 'sections-source', id: feature.id }, { hover: true });
            }
        } else {
            map.getCanvas().style.cursor = '';
            if (hoveredSectionIdRef.current !== null) {
                map.setFeatureState({ source: 'sections-source', id: hoveredSectionIdRef.current }, { hover: false });
                hoveredSectionIdRef.current = null;
            }
        }
    }, []);

    const onClick = useCallback((event: any) => {
        if (!mapRef.current) return;
        const map = mapRef.current.getMap();

        const pointFeatures = map.queryRenderedFeatures(event.point, { layers: ['unclustered-point', 'clusters'] });
        if (pointFeatures.length > 0) {
            const feature = pointFeatures[0];
            const geometry = feature.geometry;

            if (geometry.type !== 'Point') return;

            if (feature.layer.id === 'clusters') {
                const clusterId = feature.properties.cluster_id;
                const source: any = map.getSource('affiliates-source');
                source.getClusterExpansionZoom(clusterId, (err: any, zoom: number) => {
                    if (err) return;
                    map.easeTo({ center: geometry.coordinates as [number, number], zoom: zoom });
                });
            } else {
                setPopupInfo({
                    longitude: geometry.coordinates[0],
                    latitude: geometry.coordinates[1],
                    person: feature.properties
                });
            }
            return;
        }

        const sectionFeatures = map.queryRenderedFeatures(event.point, { layers: ['sections-fill'] });
        const feature = sectionFeatures[0];

        if (!feature) {
            if (selectedSectionIdRef.current !== null) {
                map.setFeatureState({ source: 'sections-source', id: selectedSectionIdRef.current }, { selected: false });
                selectedSectionIdRef.current = null;
            }
            setSelectedSection(null);
            setPopupInfo(null);
            return;
        }

        if (feature.layer.id === 'sections-fill' && feature.id !== undefined) {
            const sectionIdStr = feature.id.toString();
            const stats = sectionStats.get(sectionIdStr);
            if (selectedSectionIdRef.current !== feature.id) {
                if (selectedSectionIdRef.current !== null) {
                    map.setFeatureState({ source: 'sections-source', id: selectedSectionIdRef.current }, { selected: false });
                }
                selectedSectionIdRef.current = feature.id;
                map.setFeatureState({ source: 'sections-source', id: feature.id }, { selected: true });
                if (stats) setSelectedSection(stats);
            } else {
                map.setFeatureState({ source: 'sections-source', id: feature.id }, { selected: false });
                selectedSectionIdRef.current = null;
                setSelectedSection(null);
            }
        }
    }, [sectionStats]);

    const handleSectionSelect = useCallback((section: NavojoaElectoralSection | null) => {
        setSelectedSection(section);
    }, []);

    return (
        <div
            style={isFullscreen ? { height: '100vh', width: '100vw', position: 'fixed', top: 0, left: 0, zIndex: 2000 } : { height, width: '100%', position: 'relative' }}
            className={`rounded-xl overflow-hidden border border-gray-200 shadow-sm bg-white transition-all duration-300 ${isFullscreen ? 'rounded-none' : ''} z-0`}
        >
            <SectionDetailPanel section={selectedSection} onClose={() => {
                setSelectedSection(null);
                if (mapRef.current && selectedSectionIdRef.current !== null) {
                    mapRef.current.getMap().setFeatureState({ source: 'sections-source', id: selectedSectionIdRef.current }, { selected: false });
                    selectedSectionIdRef.current = null;
                }
            }} />

            <SearchOverlay searchTerm={searchTerm} onSearchChange={onSearchChange} allPeople={allPeople} />

            <div className="absolute top-4 left-[23rem] z-10 w-40">
                <select value={selectedRole} onChange={(e) => onRoleChange(e.target.value)} className="w-full bg-white/95 backdrop-blur-sm border border-gray-300 text-gray-700 text-sm rounded-lg shadow-md focus:ring-primary focus:border-primary block p-2">
                    <option value="all">Todos los Roles</option>
                    <option value="lider">Líderes</option>
                    <option value="brigadista">Brigadistas</option>
                    <option value="movilizador">Movilizadores</option>
                    <option value="ciudadano">Ciudadanos</option>
                </select>
            </div>

            <div className="absolute bottom-4 left-3 z-10 flex flex-col gap-2">
                <button onClick={() => setIsFullscreen(!isFullscreen)} className="p-2 rounded-md shadow-md bg-white text-gray-700 hover:bg-gray-50 transition-colors" title={isFullscreen ? "Salir de pantalla completa (ESC)" : "Pantalla completa"}>
                    {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
                </button>

                <button
                    onClick={() => setIsEditable(!isEditable)}
                    className={`p-2 rounded-md shadow-md transition-colors ${isEditable ? 'bg-secondary text-white ring-2 ring-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
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
                <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 bg-secondary text-white px-4 py-1 rounded-full text-xs font-bold shadow-lg animate-pulse border-2 border-white">
                    MODO EDICIÓN ACTIVO: Arrastre los pines para corregir
                </div>
            )}

            <MapLibre
                ref={mapRef}
                initialViewState={NAVOJOA_CENTER}
                style={{ width: '100%', height: '100%' }}
                mapStyle={OSM_STYLE as any}
                attributionControl={false}
                interactiveLayerIds={isEditable ? [] : ['sections-fill', 'unclustered-point', 'clusters']}
                onMouseMove={onMouseMove}
                onClick={onClick}
                onLoad={onMapLoad}
            >
                <NavigationControl position="top-right" />

                <ElectoralSectionLayerLibre data={data} onSectionSelect={handleSectionSelect} />

                {!isEditable && (
                    <AffiliateMarkerLayerLibre data={data} isEditable={isEditable} />
                )}

                {isEditable && data.filter(p => p.lat != null && p.lng != null).map(person => (
                    <Marker
                        key={person.id}
                        longitude={person.lng!}
                        latitude={person.lat!}
                        draggable
                        onDragEnd={(e) => handleDragEnd(person.id, person.role, e)}
                    >
                        <div
                            dangerouslySetInnerHTML={{ __html: RED_PIN_SVG }}
                            style={{ width: 32, height: 30, cursor: 'grab' }}
                        />
                    </Marker>
                ))}

                {popupInfo && (
                    <Popup longitude={popupInfo.longitude} latitude={popupInfo.latitude} anchor="bottom" onClose={() => setPopupInfo(null)} closeOnClick={false}>
                        <div className="p-1 min-w-[150px]">
                            <div className="flex items-center gap-2 mb-2">
                                <div className={`w-3 h-3 rounded-full ${popupInfo.person.role === 'lider' ? 'bg-[#235b4e]' : popupInfo.person.role === 'brigadista' ? 'bg-[#9f2241]' : popupInfo.person.role === 'movilizador' ? 'bg-[#f59e0b]' : 'bg-gray-400'}`} />
                                <span className="text-xs font-bold uppercase tracking-wider text-neutral">{popupInfo.person.role}</span>
                            </div>
                            <h3 className="font-bold text-sm mb-1">{popupInfo.person.name}</h3>
                            {popupInfo.person.seccion && <div className="text-[10px] text-gray-500">Sección: <span className="font-medium text-gray-700">{popupInfo.person.seccion}</span></div>}
                        </div>
                    </Popup>
                )}
            </MapLibre>
        </div>
    );
};

export default NavojoaMapLibre;
