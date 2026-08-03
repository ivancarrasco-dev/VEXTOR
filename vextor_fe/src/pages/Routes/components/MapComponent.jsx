import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet-routing-machine';
import { Layers, MapPin, Navigation, Compass, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '../../../utils/cn';

// Tile Providers configuration list
const TILE_PROVIDERS = [
  {
    id: 'carto-dark',
    name: 'Carto Dark Matter',
    label: 'Oscuro',
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
    subdomains: 'abcd',
    maxZoom: 20
  },
  {
    id: 'osm',
    name: 'OpenStreetMap Standard',
    label: 'Calles',
    url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap contributors',
    subdomains: 'abc',
    maxZoom: 19
  },
  {
    id: 'carto-positron',
    name: 'Carto Positron',
    label: 'Claro',
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
    subdomains: 'abcd',
    maxZoom: 20
  },
  {
    id: 'opentopo',
    name: 'OpenTopoMap',
    label: 'Relieve',
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenTopoMap contributors &copy; OpenStreetMap',
    subdomains: 'abc',
    maxZoom: 17
  },
  {
    id: 'esri-satellite',
    name: 'Esri World Imagery',
    label: 'Satélite',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, USDA, USGS, GeoEye',
    subdomains: [],
    maxZoom: 18
  }
];

// Custom Marker Icons using pure Tailwind to avoid asset path errors in Vite
const createMarkerIcon = (type, label = '') => {
  const colorClass = type === 'origin' ? 'bg-emerald-500' : 'bg-red-500';
  return L.divIcon({
    html: `<div class="relative flex items-center justify-center w-6 h-6">
             <span class="animate-ping absolute inline-flex h-full w-full rounded-full ${colorClass} opacity-40"></span>
             <div class="relative flex items-center justify-center w-5 h-5 rounded-full ${colorClass} border-2 border-white shadow-lg text-white font-bold text-[9px]">
               ${label}
             </div>
           </div>`,
    className: 'custom-leaflet-marker-div',
    iconSize: [24, 24],
    iconAnchor: [12, 12]
  });
};

const createOtherMarkerIcon = (colorClass) => {
  return L.divIcon({
    html: `<div class="w-3.5 h-3.5 rounded-full ${colorClass} border border-white shadow-md"></div>`,
    className: 'other-leaflet-marker-div',
    iconSize: [14, 14],
    iconAnchor: [7, 7]
  });
};

const createMyLocationIcon = () => {
  return L.divIcon({
    html: `<div class="relative flex items-center justify-center w-6 h-6">
             <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-50"></span>
             <div class="relative w-3.5 h-3.5 rounded-full bg-primary border-2 border-white shadow-lg"></div>
           </div>`,
    className: 'mylocation-leaflet-marker-div',
    iconSize: [24, 24],
    iconAnchor: [12, 12]
  });
};

// Colors for other routes to make them distinctive
const DISTINCT_COLORS = [
  { stroke: '#3b82f6', bg: 'bg-blue-500' },     // Blue
  { stroke: '#f59e0b', bg: 'bg-amber-500' },    // Amber
  { stroke: '#8b5cf6', bg: 'bg-violet-500' },   // Violet
  { stroke: '#ec4899', bg: 'bg-pink-500' },     // Pink
  { stroke: '#06b6d4', bg: 'bg-cyan-500' },     // Cyan
  { stroke: '#f97316', bg: 'bg-orange-500' },   // Orange
];

const MapComponent = ({
  routes = [],
  activeRoute = null,
  selectedOrigin = '',
  selectedDestination = '',
  onSelectPoints,
  onRouteCalculated,
}) => {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);

  // UI States
  const [activeTileId, setActiveTileId] = useState('carto-dark');
  const [isTilesLoading, setIsTilesLoading] = useState(false);
  const [hasTileError, setHasTileError] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // References to active layers and tile layer
  const tileLayerRef = useRef(null);
  const activeLayersRef = useRef([]);
  const routingControlRef = useRef(null);
  const myLocationMarkerRef = useRef(null);

  // Click outside to close dropdown ref
  const dropdownRef = useRef(null);

  // Helper to safely parse coordinate string "lat, lng" into [lat, lng] array
  const parseCoordinates = (coordString) => {
    if (!coordString) return null;
    const parts = coordString.split(',');
    if (parts.length !== 2) return null;
    const lat = parseFloat(parts[0]);
    const lng = parseFloat(parts[1]);
    if (isNaN(lat) || isNaN(lng)) return null;
    return [lat, lng];
  };

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Centered in Bogotá: Lat 4.7110, Lng -74.0721, zoom 12
    const map = L.map(mapContainerRef.current, {
      center: [4.7110, -74.0721],
      zoom: 12,
      zoomControl: false,
    });

    // Add custom zoom control in top right
    L.control.zoom({
      position: 'topright'
    }).addTo(map);

    mapInstanceRef.current = map;

    // Load initial tile layer (Carto Dark Matter is a gorgeous theme)
    switchTileLayer('carto-dark');

    // Handle map clicks for selecting points
    map.on('click', (e) => {
      if (e.originalEvent.defaultPrevented) return;
      
      const { lat, lng } = e.latlng;
      const coordString = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;

      fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=es`, {
        headers: {
          'User-Agent': 'VextorFleetApp/1.0 (contact: info@vextor.com)'
        }
      })
        .then((res) => res.json())
        .then((data) => {
          const address = data?.display_name || `Ubicación en ${lat.toFixed(4)}, ${lng.toFixed(4)}`;
          onSelectPoints?.({ coordinates: coordString, address });
        })
        .catch((err) => {
          console.warn('Reverse geocoding failed, falling back to raw coordinates:', err);
          onSelectPoints?.({ coordinates: coordString, address: `Coordenadas: ${coordString}` });
        });
    });

    // 🌟 ABSOLUTE CRITICAL FIX FOR CUT-OFF MAP: 🌟
    // Force Leaflet to invalidate size and redraw tiles properly once the container and flex-layout render is fully completed.
    const resizeObserver = new ResizeObserver(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    });
    
    if (mapContainerRef.current) {
      resizeObserver.observe(mapContainerRef.current);
    }

    const timer1 = setTimeout(() => {
      map.invalidateSize();
    }, 150);

    const timer2 = setTimeout(() => {
      map.invalidateSize();
    }, 600);

    // Listen to global window resize events too
    const handleWindowResize = () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    };
    window.addEventListener('resize', handleWindowResize);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', handleWindowResize);
      clearTimeout(timer1);
      clearTimeout(timer2);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Set tile loading states and handle tile layer swaps
  const switchTileLayer = (providerId) => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const provider = TILE_PROVIDERS.find(p => p.id === providerId) || TILE_PROVIDERS[0];

    // Remove existing tile layer
    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }

    setHasTileError(false);
    setIsTilesLoading(true);

    const newLayer = L.tileLayer(provider.url, {
      attribution: provider.attribution,
      subdomains: provider.subdomains,
      maxZoom: provider.maxZoom,
    });

    // Tile Load Listeners for a modern UX loading state indicator
    newLayer.on('loading', () => {
      setIsTilesLoading(true);
    });
    newLayer.on('load', () => {
      setIsTilesLoading(false);
    });
    newLayer.on('tileerror', (error) => {
      console.error(`Tile layer load error for ${provider.name}:`, error);
      setIsTilesLoading(false);
      setHasTileError(true);

      // Robust Auto Fallback to OSM
      if (providerId !== 'osm') {
        console.warn('Falling back to OpenStreetMap Standard layer automatically...');
        switchTileLayer('osm');
      }
    });

    newLayer.addTo(map);
    tileLayerRef.current = newLayer;
    setActiveTileId(providerId);

    // Force map invalidation on layer swaps to ensure tiles load seamlessly
    setTimeout(() => {
      map.invalidateSize();
    }, 50);
  };

  // Browser Geolocation API wrapper to locate User's location
  const handleMyLocation = () => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (!navigator.geolocation) {
      alert('La geolocalización no es compatible con su navegador.');
      return;
    }

    setIsTilesLoading(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsTilesLoading(false);
        const { latitude, longitude } = position.coords;
        const userLatLng = [latitude, longitude];

        // Place beautiful pulsing dot marker
        if (myLocationMarkerRef.current) {
          map.removeLayer(myLocationMarkerRef.current);
        }

        const marker = L.marker(userLatLng, { icon: createMyLocationIcon() })
          .bindPopup('<b>Mi ubicación actual</b>')
          .addTo(map);

        myLocationMarkerRef.current = marker;
        map.setView(userLatLng, 15, { animate: true, duration: 1 });
      },
      (error) => {
        setIsTilesLoading(false);
        console.warn('Geolocation error:', error);
        alert('No se pudo determinar su ubicación actual. Asegúrese de otorgar permisos de ubicación.');
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  // Update map state and render routes/markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // 1. Clear previous layers & routing controls
    activeLayersRef.current.forEach(layer => map.removeLayer(layer));
    activeLayersRef.current = [];

    if (routingControlRef.current) {
      map.removeControl(routingControlRef.current);
      routingControlRef.current = null;
    }

    // Preserve the User's Location dot if it exists
    if (myLocationMarkerRef.current) {
      myLocationMarkerRef.current.addTo(map);
    }

    // 2. Draw Other (Non-Active) Routes in background
    routes.forEach((route, index) => {
      if (activeRoute && route.id_ruta === activeRoute.id_ruta) return;

      const originCoords = parseCoordinates(route.origen);
      const destCoords = parseCoordinates(route.destino);

      if (originCoords && destCoords) {
        const colorSet = DISTINCT_COLORS[index % DISTINCT_COLORS.length];

        // Draw markers
        const startMarker = L.marker(originCoords, { icon: createOtherMarkerIcon(colorSet.bg) })
          .bindPopup(`<b>${route.codigo_ruta} (Inicio)</b><br>${route.nombre_ruta}`)
          .addTo(map);
        const endMarker = L.marker(destCoords, { icon: createOtherMarkerIcon(colorSet.bg) })
          .bindPopup(`<b>${route.codigo_ruta} (Fin)</b><br>${route.nombre_ruta}`)
          .addTo(map);

        // Draw simple Polyline for other background routes
        const polyline = L.polyline([originCoords, destCoords], {
          color: colorSet.stroke,
          weight: 3.5,
          opacity: 0.55,
          dashArray: '4, 8'
        })
          .bindPopup(`<b>Ruta: ${route.codigo_ruta}</b><br>${route.nombre_ruta}`)
          .addTo(map);

        activeLayersRef.current.push(startMarker, endMarker, polyline);
      }
    });

    // 3. Draw Active Route or Temporary Clicked Points
    let originToDraw = null;
    let destToDraw = null;
    let activeRouteName = 'Nueva Ruta';

    if (activeRoute) {
      originToDraw = parseCoordinates(activeRoute.origen);
      destToDraw = parseCoordinates(activeRoute.destino);
      activeRouteName = activeRoute.nombre_ruta || activeRoute.codigo_ruta || 'Ruta Seleccionada';
    } else {
      originToDraw = parseCoordinates(selectedOrigin);
      destToDraw = parseCoordinates(selectedDestination);
    }

    if (originToDraw) {
      const origMarker = L.marker(originToDraw, { icon: createMarkerIcon('origin', 'A') })
        .bindPopup(`<b>Origen (A)</b><br>${activeRouteName}`)
        .addTo(map);
      activeLayersRef.current.push(origMarker);
    }

    if (destToDraw) {
      const destMarker = L.marker(destToDraw, { icon: createMarkerIcon('destination', 'B') })
        .bindPopup(`<b>Destino (B)</b><br>${activeRouteName}`)
        .addTo(map);
      activeLayersRef.current.push(destMarker);
    }

    // 4. Draw route line for Active Route
    if (originToDraw && destToDraw) {
      // Use free OSRM (Open Source Routing Machine) to trace real streets without API keys
      try {
        const routingControl = L.Routing.control({
          waypoints: [
            L.latLng(originToDraw[0], originToDraw[1]),
            L.latLng(destToDraw[0], destToDraw[1])
          ],
          router: L.Routing.osrmv1({
            serviceUrl: 'https://router.project-osrm.org/route/v1',
            profile: 'driving'
          }),
          lineOptions: {
            styles: [
              { color: '#10b981', opacity: 0.9, weight: 6 } // Vextor Primary Color (Emerald-500)
            ],
            addWaypoints: false
          },
          createMarker: () => null, // Hide default routing machine pins
          show: false, // Suppress routing description details list
          addWaypoints: false,
          fitSelectedRoutes: false
        }).addTo(map);

        routingControlRef.current = routingControl;

        // Callback with real street distance and time metrics on success
        routingControl.on('routesfound', (e) => {
          if (e.routes && e.routes[0]) {
            const summary = e.routes[0].summary;
            const distanceKm = (summary.totalDistance / 1000).toFixed(2);
            const durationMins = Math.round(summary.totalTime / 60);

            onRouteCalculated?.({
              distance: distanceKm,
              duration: durationMins,
              originAddress: selectedOrigin ? 'Dirección de Origen' : 'Ubicación Origen',
              destinationAddress: selectedDestination ? 'Dirección de Destino' : 'Ubicación Destino'
            });
          }
        });

        // Fallback to straight line on routing error
        routingControl.on('routingerror', () => {
          console.warn('OSRM routing failed, drawing direct Polyline fallback...');
          drawActivePolyline(map, originToDraw, destToDraw, activeRouteName);
        });

      } catch (err) {
        console.error('Failed to run Routing Machine:', err);
        drawActivePolyline(map, originToDraw, destToDraw, activeRouteName);
      }

      // Center view and fit bounds on active route
      const bounds = L.latLngBounds([originToDraw, destToDraw]);
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });

    } else if (originToDraw) {
      map.setView(originToDraw, 14);
    } else if (destToDraw) {
      map.setView(destToDraw, 14);
    }

    // Force invalidation on route changes to make sure tiles display perfectly without cutoffs
    setTimeout(() => {
      map.invalidateSize();
    }, 150);

  }, [routes, activeRoute, selectedOrigin, selectedDestination]);

  // Fallback Polyline drawing helper
  const drawActivePolyline = (map, origin, dest, title) => {
    const polyline = L.polyline([origin, dest], {
      color: '#10b981',
      weight: 5.5,
      opacity: 0.95
    })
      .bindPopup(`<b>${title}</b>`)
      .addTo(map);
    activeLayersRef.current.push(polyline);

    // Estimate direct distance
    const distMeters = map.distance(origin, dest);
    const distanceKm = (distMeters / 1000).toFixed(2);
    const durationMins = Math.round(distMeters / 1000 * 2.5);

    onRouteCalculated?.({
      distance: distanceKm,
      duration: durationMins,
      originAddress: 'Origen (Trayecto Directo)',
      destinationAddress: 'Destino (Trayecto Directo)'
    });
  };

  const handleRecenter = () => {
    const map = mapInstanceRef.current;
    if (!map) return;
    map.setView([4.7110, -74.0721], 12, { animate: true });
    setTimeout(() => {
      map.invalidateSize();
    }, 150);
  };

  const activeProvider = TILE_PROVIDERS.find(p => p.id === activeTileId);

  return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden border border-v-dark-border shadow-2xl transition-all duration-300">
      
      {/* Real Map Canvas */}
      <div ref={mapContainerRef} className="w-full h-full min-h-[400px] lg:min-h-[600px] z-10" />

      {/* Modern custom tile loader overlay */}
      {isTilesLoading && (
        <div className="absolute top-4 right-14 z-20 flex items-center gap-1.5 px-3 py-1.5 bg-v-dark-soft/90 backdrop-blur-md border border-v-dark-border rounded-xl shadow-xl">
          <Loader2 size={13} className="text-primary animate-spin" />
          <span className="text-[10px] font-semibold text-v-white">Cargando...</span>
        </div>
      )}

      {/* Premium Floating Dropdown: Style Selector */}
      <div ref={dropdownRef} className="absolute top-4 left-4 z-20">
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="flex items-center gap-2 px-3 py-2 bg-v-dark-soft/95 backdrop-blur-md border border-v-dark-border rounded-xl shadow-2xl text-xs font-semibold text-v-white hover:border-primary/40 transition-all cursor-pointer hover:scale-105 active:scale-95"
        >
          <Layers size={14} className="text-primary" />
          <span>Estilo: {activeProvider?.label}</span>
          {isDropdownOpen ? <ChevronUp size={13} className="text-v-gray" /> : <ChevronDown size={13} className="text-v-gray" />}
        </button>

        {isDropdownOpen && (
          <div className="absolute left-0 mt-1.5 w-44 bg-v-dark-soft/95 backdrop-blur-md border border-v-dark-border rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
            <div className="p-1 flex flex-col gap-0.5">
              {TILE_PROVIDERS.map(provider => (
                <button
                  key={provider.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    switchTileLayer(provider.id);
                    setIsDropdownOpen(false);
                  }}
                  className={cn(
                    "w-full px-3 py-2 rounded-lg text-left text-xs font-medium transition-all flex items-center justify-between cursor-pointer",
                    activeTileId === provider.id
                      ? "bg-primary/20 text-primary font-bold"
                      : "text-v-gray hover:text-v-white hover:bg-v-dark/50"
                  )}
                >
                  <span>{provider.name.replace(' Standard', '').replace(' World Imagery', '')}</span>
                  {activeTileId === provider.id && (
                    <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Active Layer Legend Indicator (Bottom-Center) */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 px-3.5 py-1.5 bg-v-dark-soft/95 backdrop-blur-md border border-v-dark-border rounded-full shadow-lg flex items-center gap-2 pointer-events-none text-[10px] sm:text-xs">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
        <span className="text-v-gray">Capa:</span>
        <span className="font-bold text-v-white">{activeProvider?.name}</span>
      </div>

      {/* Floating Action Controls Block (Bottom Right) */}
      <div className="absolute bottom-4 right-4 z-20 flex flex-col gap-2">
        {/* Find My Location Button */}
        <button
          onClick={handleMyLocation}
          className="p-3 bg-v-dark-soft/95 backdrop-blur-sm border border-v-dark-border rounded-xl text-v-gray hover:text-v-white hover:border-primary/40 shadow-lg cursor-pointer transition-all hover:scale-105 active:scale-95"
          title="Obtener mi ubicación actual"
        >
          <Compass size={16} className="text-primary" />
        </button>

        {/* Recenter Map Button */}
        <button
          onClick={handleRecenter}
          className="p-3 bg-v-dark-soft/95 backdrop-blur-sm border border-v-dark-border rounded-xl text-v-gray hover:text-v-white hover:border-primary/40 shadow-lg cursor-pointer transition-all hover:scale-105 active:scale-95"
          title="Centrar en Bogotá"
        >
          <Navigation size={16} className="rotate-45" />
        </button>
      </div>

      {/* Interactive Overlay Info Instructions */}
      <div className="absolute bottom-4 left-4 bg-v-dark-soft/95 backdrop-blur-md border border-v-dark-border px-3.5 py-2.5 rounded-2xl text-xs text-v-white z-20 pointer-events-none shadow-xl space-y-1 max-w-[280px] text-left">
        <div className="font-bold text-emerald-400 flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          Navegación Interactiva Gratis
        </div>
        <p className="text-[11px] text-v-gray leading-relaxed">
          Haz clic en cualquier parte del mapa para marcar <strong className="text-emerald-400">Origen (A)</strong> y <strong className="text-red-400">Destino (B)</strong> utilizando geocodificación gratuita.
        </p>
      </div>
    </div>
  );
};

export default MapComponent;
