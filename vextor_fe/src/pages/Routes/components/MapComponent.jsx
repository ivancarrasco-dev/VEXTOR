import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Layers, MapPin, Navigation, Compass, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '../../../utils/cn';
import { useTheme } from '../../../context/ThemeContext';
import { routeService } from '../services/routeService';
import { TOMTOM_API_KEY } from '../../../config/api';

// Tile Providers configuration list
const TILE_PROVIDERS = [
  {
    id: 'esri-dark',
    name: 'Esri Dark Gray Canvas',
    label: 'Oscuro',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ',
    subdomains: [],
    maxZoom: 18
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
    id: 'esri-light',
    name: 'Esri Light Gray Canvas',
    label: 'Claro',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ',
    subdomains: [],
    maxZoom: 18
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

// Vehicle marker icon with heading rotation
const createVehicleIcon = (heading = 0) => {
  return L.divIcon({
    html: `<div class="relative flex items-center justify-center w-10 h-10 transition-transform duration-300 ease-out" style="transform: rotate(${heading}deg);">
             <span class="animate-ping absolute inline-flex h-8 w-8 rounded-full bg-emerald-500 opacity-40"></span>
             <div class="relative flex items-center justify-center w-8 h-8 rounded-full bg-v-dark border-2 border-emerald-400 shadow-2xl text-emerald-400">
               <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                 <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/>
                 <path d="M15 18H9"/>
                 <path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/>
                 <circle cx="6.5" cy="17.5" r="2.5"/>
                 <circle cx="16.5" cy="17.5" r="2.5"/>
               </svg>
             </div>
           </div>`,
    className: 'custom-vehicle-marker-div',
    iconSize: [40, 40],
    iconAnchor: [20, 20]
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
  driverPosition = null,
  isNavigationMode = false,
  onSelectPoints,
  onRouteCalculated,
}) => {
  const { theme } = useTheme();
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);

  // UI States
  const [activeTileId, setActiveTileId] = useState(theme === 'dark' ? 'esri-dark' : 'esri-light');
  const [isTilesLoading, setIsTilesLoading] = useState(false);
  const [hasTileError, setHasTileError] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isAutoFollowing, setIsAutoFollowing] = useState(true);
  const [isTrafficEnabled, setIsTrafficEnabled] = useState(Boolean(TOMTOM_API_KEY));
  const [showTrafficLegend, setShowTrafficLegend] = useState(false);
  const [trafficErrorStatus, setTrafficErrorStatus] = useState(null);

  // References to map layers and a generation token for asynchronous route requests.
  const tileLayerRef = useRef(null);
  const trafficLayerRef = useRef(null);
  const activeLayersRef = useRef([]);
  const vehicleMarkerRef = useRef(null);
  const pathHistoryRef = useRef([]);
  const completedPolylineRef = useRef(null);
  const routingGenerationRef = useRef(0);
  const routePolylineRef = useRef(null);
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

  const resolveCoordsAsync = async (locationStr) => {
    const coords = parseCoordinates(locationStr);
    if (coords) return coords;
    if (!locationStr || typeof locationStr !== 'string') return null;

    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(locationStr)}&countrycodes=co&limit=1`, {
        headers: { 'User-Agent': 'VextorFleetApp/1.0' }
      });
      const data = await res.json();
      if (data && data.length > 0) {
        return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
      }
    } catch (e) {
      console.warn('Nominatim geocoding error:', e);
    }
    return null;
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

    // Clean up container _leaflet_id if present to avoid "Map container is already initialized" error
    if (mapContainerRef.current._leaflet_id) {
      delete mapContainerRef.current._leaflet_id;
    }

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

    // Load initial tile layer based on current theme
    const initialTileId = theme === 'dark' ? 'esri-dark' : 'esri-light';
    switchTileLayer(initialTileId);

    // Pause auto-following when user interacts with map manually
    map.on('dragstart zoomstart', () => {
      setIsAutoFollowing(false);
    });

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
      // Robust full map unmount cleanup
      routingGenerationRef.current += 1;
      resizeObserver.disconnect();
      window.removeEventListener('resize', handleWindowResize);
      clearTimeout(timer1);
      clearTimeout(timer2);

      const map = mapInstanceRef.current;
      if (map) {
        // Clean up layers safely and reset refs
        if (myLocationMarkerRef.current && map.hasLayer(myLocationMarkerRef.current)) {
          map.removeLayer(myLocationMarkerRef.current);
        }
        myLocationMarkerRef.current = null;

        if (vehicleMarkerRef.current && map.hasLayer(vehicleMarkerRef.current)) {
          map.removeLayer(vehicleMarkerRef.current);
        }
        vehicleMarkerRef.current = null;

        if (completedPolylineRef.current && map.hasLayer(completedPolylineRef.current)) {
          map.removeLayer(completedPolylineRef.current);
        }
        completedPolylineRef.current = null;

        if (routePolylineRef.current && map.hasLayer(routePolylineRef.current)) {
          map.removeLayer(routePolylineRef.current);
        }
        routePolylineRef.current = null;

        if (trafficLayerRef.current && map.hasLayer(trafficLayerRef.current)) {
          map.removeLayer(trafficLayerRef.current);
        }
        trafficLayerRef.current = null;

        activeLayersRef.current.forEach(layer => {
          if (layer && map.hasLayer(layer)) {
            map.removeLayer(layer);
          }
        });
        activeLayersRef.current = [];
        pathHistoryRef.current = [];

        map.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update TomTom Traffic Layer dynamically when enabled status, theme, or map instance changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Always remove existing traffic layer to avoid duplication/leaks
    if (trafficLayerRef.current && map.hasLayer(trafficLayerRef.current)) {
      map.removeLayer(trafficLayerRef.current);
      trafficLayerRef.current = null;
    }

    if (isTrafficEnabled && TOMTOM_API_KEY) {
      setTrafficErrorStatus(null);
      // TomTom relative0 / relative0-dark style for crisp, clear non-blurred traffic lines
      const trafficStyle = theme === 'dark' ? 'relative0-dark' : 'relative0';
      const trafficUrl = `https://api.tomtom.com/traffic/map/4/tile/flow/${trafficStyle}/{z}/{x}/{y}.png?key=${TOMTOM_API_KEY}&tileSize=256`;

      const layer = L.tileLayer(trafficUrl, {
        attribution: '&copy; <a href="https://www.tomtom.com" target="_blank" rel="noopener noreferrer">TomTom</a> Traffic',
        tileSize: 256,
        maxZoom: 19,
        opacity: 0.9,
      });

      layer.on('tileerror', (err) => {
        console.warn('Error al cargar tiles de tráfico de TomTom (API Key inválida, caducada o límite de cuota excedido):', err);
        setTrafficErrorStatus('Respuesta HTTP fallida o API Key de TomTom rechazada por el servidor.');
      });

      layer.addTo(map);
      trafficLayerRef.current = layer;
    }
  }, [isTrafficEnabled, theme]);

  // Switch tile layer automatically when global theme changes
  useEffect(() => {
    if (mapInstanceRef.current) {
      const targetTileId = theme === 'dark' ? 'esri-dark' : 'esri-light';
      switchTileLayer(targetTileId);
    }
  }, [theme]);

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

  // Update map state and render routes/markers. Route computation lives in FastAPI.
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Increment generation token to invalidate any pending async callbacks
    routingGenerationRef.current += 1;
    const currentGen = routingGenerationRef.current;

    // 1. Safe clearance of active layers
    activeLayersRef.current.forEach(layer => {
      if (layer && map.hasLayer(layer)) {
        map.removeLayer(layer);
      }
    });
    activeLayersRef.current = [];

    if (routePolylineRef.current && map.hasLayer(routePolylineRef.current)) {
      map.removeLayer(routePolylineRef.current);
      routePolylineRef.current = null;
    }

    // Preserve the User's Location dot if it exists
    if (myLocationMarkerRef.current && !map.hasLayer(myLocationMarkerRef.current)) {
      myLocationMarkerRef.current.addTo(map);
    }

    // 2. Draw Other (Non-Active) Routes in background
    routes.forEach((route, index) => {
      if (activeRoute && route.id_ruta === activeRoute.id_ruta) return;

      const originCoords = parseCoordinates(route.origen);
      const destCoords = parseCoordinates(route.destino);

      if (originCoords && destCoords) {
        const colorSet = DISTINCT_COLORS[index % DISTINCT_COLORS.length];

        const startMarker = L.marker(originCoords, { icon: createOtherMarkerIcon(colorSet.bg) })
          .bindPopup(`<b>${route.codigo_ruta} (Inicio)</b><br>${route.nombre_ruta}`)
          .addTo(map);
        const endMarker = L.marker(destCoords, { icon: createOtherMarkerIcon(colorSet.bg) })
          .bindPopup(`<b>${route.codigo_ruta} (Fin)</b><br>${route.nombre_ruta}`)
          .addTo(map);

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
    const renderActiveRoute = async () => {
      let originToDraw = null;
      let destToDraw = null;
      let activeRouteName = 'Nueva Ruta';

      if (activeRoute) {
        originToDraw = await resolveCoordsAsync(activeRoute.origen);
        destToDraw = await resolveCoordsAsync(activeRoute.destino);
        activeRouteName = activeRoute.nombre_ruta || activeRoute.codigo_ruta || 'Ruta Seleccionada';
      } else {
        originToDraw = await resolveCoordsAsync(selectedOrigin);
        destToDraw = await resolveCoordsAsync(selectedDestination);
      }

      if (currentGen !== routingGenerationRef.current || !mapInstanceRef.current) return;

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

      // 4. Ask VEXTOR's API for the real route, then render its GeoJSON geometry.
      if (originToDraw && destToDraw) {
        routeService.calculateRoute({ origin: originToDraw, destination: destToDraw })
          .then((route) => {
            if (currentGen !== routingGenerationRef.current || !mapInstanceRef.current) return;

            if (!route?.geometry?.coordinates || !Array.isArray(route.geometry.coordinates)) {
              throw new Error('La geometría de la ruta recibida no es válida.');
            }

            const latLngs = route.geometry.coordinates.map(([lng, lat]) => [lat, lng]);
            if (latLngs.length < 2) throw new Error('La geometría recibida no contiene suficientes puntos.');

            const polyline = L.polyline(latLngs, {
              color: '#10b981',
              weight: 6,
              opacity: 0.9
            }).bindPopup(`<b>${activeRouteName}</b>`).addTo(map);
            routePolylineRef.current = polyline;

            map.fitBounds(polyline.getBounds(), { padding: [50, 50], maxZoom: 15 });
            onRouteCalculated?.({
              distance: (route.distance / 1000).toFixed(2),
              duration: Math.round(route.duration / 60),
              instructions: route.instructions || []
            });
          })
          .catch((error) => {
            if (currentGen !== routingGenerationRef.current || !mapInstanceRef.current) return;
            console.warn('VEXTOR routing API failed:', error);
            onRouteCalculated?.(null);
          });

      } else {
        onRouteCalculated?.(null);
        if (originToDraw) {
          map.setView(originToDraw, 14);
        } else if (destToDraw) {
          map.setView(destToDraw, 14);
        }
      }
    };

    renderActiveRoute();

    setTimeout(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    }, 150);

  }, [routes, activeRoute, selectedOrigin, selectedDestination]);

  // Update vehicle position marker and center view when autoFollow is active
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !driverPosition || !driverPosition.lat || !driverPosition.lng) return;

    const { lat, lng, heading } = driverPosition;
    const vehicleLatLng = [lat, lng];

    // Update path history array
    pathHistoryRef.current.push(vehicleLatLng);

    if (!vehicleMarkerRef.current) {
      vehicleMarkerRef.current = L.marker(vehicleLatLng, { icon: createVehicleIcon(heading || 0) })
        .bindPopup('<b>Vehículo en Ruta</b>')
        .addTo(map);
    } else {
      vehicleMarkerRef.current.setLatLng(vehicleLatLng);
      vehicleMarkerRef.current.setIcon(createVehicleIcon(heading || 0));
    }

    // Draw completed path polyline in solid emerald
    if (pathHistoryRef.current.length > 1) {
      if (completedPolylineRef.current) {
        completedPolylineRef.current.setLatLngs(pathHistoryRef.current);
      } else {
        completedPolylineRef.current = L.polyline(pathHistoryRef.current, {
          color: '#059669',
          weight: 7,
          opacity: 0.95
        }).addTo(map);
      }
    }

    if (isAutoFollowing) {
      map.setView(vehicleLatLng, map.getZoom() < 15 ? 15 : map.getZoom(), { animate: true, duration: 0.5 });
    }
  }, [driverPosition, isAutoFollowing]);

  const handleRecenter = () => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (driverPosition && driverPosition.lat && driverPosition.lng) {
      setIsAutoFollowing(true);
      map.setView([driverPosition.lat, driverPosition.lng], 16, { animate: true });
    } else {
      map.setView([4.7110, -74.0721], 12, { animate: true });
    }

    setTimeout(() => {
      map.invalidateSize();
    }, 150);
  };

  const activeProvider = TILE_PROVIDERS.find(p => p.id === activeTileId);

  return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden border border-v-dark-border shadow-2xl transition-all duration-300">
      
      {/* Real Map Canvas */}
      <div ref={mapContainerRef} className="w-full h-full min-h-100 lg:min-h-150 z-10" />

      {/* Modern custom tile loader overlay */}
      {isTilesLoading && (
        <div className="absolute top-4 right-14 z-20 flex items-center gap-1.5 px-3 py-1.5 bg-v-dark-soft/90 backdrop-blur-md border border-v-dark-border rounded-xl shadow-xl">
          <Loader2 size={13} className="text-primary animate-spin" />
          <span className="text-[10px] font-semibold text-v-white">Cargando...</span>
        </div>
      )}

      {/* Premium Floating Controls (Top Left) */}
      <div ref={dropdownRef} className="absolute top-4 left-4 z-20 flex items-center gap-2">
        {/* Style Selector Dropdown */}
        <div className="relative">
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

        {/* Traffic & Incidents Info Control */}
        <div className="relative flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => {
              if (!TOMTOM_API_KEY) {
                setShowTrafficLegend(!showTrafficLegend);
                return;
              }
              setIsTrafficEnabled(!isTrafficEnabled);
            }}
            className={cn(
              "px-3 py-2 bg-v-dark-soft/95 backdrop-blur-md border rounded-xl shadow-2xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 hover:scale-105 active:scale-95",
              isTrafficEnabled
                ? "border-emerald-500/60 text-emerald-400 bg-emerald-500/10"
                : "border-v-dark-border text-v-gray hover:text-v-white"
            )}
            title={TOMTOM_API_KEY ? "Activar/desactivar tráfico en tiempo real" : "TomTom Traffic API Key no detectada"}
          >
            <span>🚦</span>
            <span>Tráfico</span>
            <span className={cn(
              "w-2 h-2 rounded-full transition-colors",
              isTrafficEnabled ? "bg-emerald-500 animate-pulse" : "bg-v-gray/40"
            )} />
          </button>

          {/* Legend Details Toggle Button */}
          <button
            type="button"
            onClick={() => setShowTrafficLegend(!showTrafficLegend)}
            className="p-2 bg-v-dark-soft/95 backdrop-blur-md border border-v-dark-border rounded-xl text-v-gray hover:text-v-white shadow-xl cursor-pointer text-xs font-bold transition-all hover:scale-105 active:scale-95"
            title="Ver leyenda e información de tráfico"
          >
            ℹ️
          </button>

          {/* Traffic Legend & Info Modal Card */}
          {showTrafficLegend && (
            <div className="absolute left-0 top-full mt-2 w-72 sm:w-80 p-4 bg-v-dark-soft/95 backdrop-blur-xl border border-v-dark-border rounded-2xl shadow-2xl z-50 text-left space-y-3 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="flex items-center justify-between border-b border-v-dark-border pb-2">
                <div className="flex items-center gap-2 text-v-white font-bold text-xs">
                  <span>🚦</span>
                  <span>Tráfico TomTom en Tiempo Real</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowTrafficLegend(false)}
                  className="text-v-gray hover:text-v-white text-xs font-bold px-1.5 py-0.5 rounded-md hover:bg-v-dark/60 cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {!TOMTOM_API_KEY ? (
                <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-300 leading-relaxed">
                  ⚠️ <strong>API Key Requerida:</strong> Configura <code>VITE_TOMTOM_API_KEY</code> en tu archivo <code>.env</code> para activar la capa visual en tiempo real.
                </div>
              ) : trafficErrorStatus && (
                <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-[11px] text-red-300 leading-relaxed">
                  ⛔ <strong>Error de Servidor TomTom:</strong> La API Key está inyectada en el cliente pero TomTom no devolvió datos válidos (posible clave inválida, caducada o límite de cuota alcanzado).
                </div>
              )}

              {/* Traffic Colors Legend */}
              <div className="space-y-1.5 text-xs">
                <div className="text-[10px] uppercase font-semibold text-v-gray tracking-wider">Estado del Tráfico</div>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="flex items-center gap-2 px-2 py-1 rounded-lg bg-v-dark/60 border border-v-dark-border">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm shrink-0" />
                    <span className="text-v-white">🟢 Fluido</span>
                  </div>
                  <div className="flex items-center gap-2 px-2 py-1 rounded-lg bg-v-dark/60 border border-v-dark-border">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-sm shrink-0" />
                    <span className="text-v-white">🟡 Moderado</span>
                  </div>
                  <div className="flex items-center gap-2 px-2 py-1 rounded-lg bg-v-dark/60 border border-v-dark-border">
                    <span className="w-2.5 h-2.5 rounded-full bg-orange-500 shadow-sm shrink-0" />
                    <span className="text-v-white">🟠 Congestionado</span>
                  </div>
                  <div className="flex items-center gap-2 px-2 py-1 rounded-lg bg-v-dark/60 border border-v-dark-border">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-600 shadow-sm shrink-0" />
                    <span className="text-v-white">🔴 Muy congestionado</span>
                  </div>
                </div>
              </div>

              <div className="pt-1 text-[10px] text-v-gray leading-relaxed border-t border-v-dark-border">
                Capa independiente renderizada mediante la API oficial TomTom Raster Flow Tiles sin alterar las rutas calculadas por OSRM.
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Active Layer Legend Indicator (Bottom-Center) */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 px-3.5 py-1.5 bg-v-dark-soft/95 backdrop-blur-md border border-v-dark-border rounded-full shadow-lg flex items-center gap-2 pointer-events-none text-[10px] sm:text-xs">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
        <span className="text-v-gray">Capa:</span>
        <span className="font-bold text-v-white">{activeProvider?.name}</span>
      </div>

      {/* Floating Action Controls Block (Bottom Right) */}
      <div className="absolute bottom-4 right-4 z-20 flex flex-col gap-2">
        {/* Follow Vehicle / Auto-center button when driverPosition is present */}
        {driverPosition && (
          <button
            onClick={() => {
              setIsAutoFollowing(true);
              if (mapInstanceRef.current && driverPosition.lat && driverPosition.lng) {
                mapInstanceRef.current.setView([driverPosition.lat, driverPosition.lng], 16, { animate: true });
              }
            }}
            className={cn(
              "px-3 py-2 bg-v-dark-soft/95 backdrop-blur-sm border rounded-xl shadow-xl flex items-center gap-1.5 text-xs font-bold transition-all cursor-pointer hover:scale-105 active:scale-95",
              isAutoFollowing
                ? "border-emerald-500/50 text-emerald-400 bg-emerald-500/10"
                : "border-v-dark-border text-v-gray hover:text-v-white"
            )}
            title="Seguir posición del vehículo"
          >
            <Compass size={15} className={cn("shrink-0", isAutoFollowing && "animate-spin text-emerald-400")} />
            <span>{isAutoFollowing ? "Seguimiento Activo" : "🎯 Seguir vehículo"}</span>
          </button>
        )}

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
          title="Centrar mapa"
        >
          <Navigation size={16} className="rotate-45" />
        </button>
      </div>

      {/* Interactive Overlay Info Instructions */}
      <div className="absolute bottom-4 left-4 bg-v-dark-soft/95 backdrop-blur-md border border-v-dark-border px-3.5 py-2.5 rounded-2xl text-xs text-v-white z-20 pointer-events-none shadow-xl space-y-1 max-w-70 text-left">
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
