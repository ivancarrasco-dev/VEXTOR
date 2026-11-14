import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Layers, MapPin, Navigation, Compass, Loader2, ChevronDown, ChevronUp, AlertCircle, ExternalLink } from 'lucide-react';
import { cn } from '../../../utils/cn';
import { useTheme } from '../../../context/ThemeContext';
import { routeService } from '../services/routeService';

// Tile Providers configuration list
const TILE_PROVIDERS = [
  {
    id: 'esri-dark',
    name: 'Esri Dark Gray Canvas',
    label: 'Oscuro',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles © Esri — Esri, DeLorme, NAVTEQ',
    subdomains: [],
    maxZoom: 18
  },
  {
    id: 'osm',
    name: 'OpenStreetMap Standard',
    label: 'Calles',
    url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '© OpenStreetMap contributors',
    subdomains: 'abc',
    maxZoom: 19
  },
  {
    id: 'esri-light',
    name: 'Esri Light Gray Canvas',
    label: 'Claro',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles © Esri — Esri, DeLorme, NAVTEQ',
    subdomains: [],
    maxZoom: 18
  },
  {
    id: 'opentopo',
    name: 'OpenTopoMap',
    label: 'Relieve',
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution: '© OpenTopoMap contributors © OpenStreetMap',
    subdomains: 'abc',
    maxZoom: 17
  },
  {
    id: 'esri-satellite',
    name: 'Esri World Imagery',
    label: 'Satélite',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles © Esri — Source: Esri, USDA, USGS, GeoEye',
    subdomains: [],
    maxZoom: 18
  }
];

export const STOP_COLORS = [
  { hex: '#3b82f6', bgClass: 'bg-blue-500', textClass: 'text-blue-500', borderClass: 'border-blue-500' },
  { hex: '#10b981', bgClass: 'bg-emerald-500', textClass: 'text-emerald-500', borderClass: 'border-emerald-500' },
  { hex: '#f59e0b', bgClass: 'bg-amber-500', textClass: 'text-amber-500', borderClass: 'border-amber-500' },
  { hex: '#8b5cf6', bgClass: 'bg-purple-500', textClass: 'text-purple-500', borderClass: 'border-purple-500' },
  { hex: '#ef4444', bgClass: 'bg-red-500', textClass: 'text-red-500', borderClass: 'border-red-500' },
  { hex: '#06b6d4', bgClass: 'bg-cyan-500', textClass: 'text-cyan-500', borderClass: 'border-cyan-500' },
  { hex: '#ec4899', bgClass: 'bg-pink-500', textClass: 'text-pink-500', borderClass: 'border-pink-500' },
  { hex: '#6366f1', bgClass: 'bg-indigo-500', textClass: 'text-indigo-500', borderClass: 'border-indigo-500' },
];

export const getStopColor = (index) => {
  return STOP_COLORS[index % STOP_COLORS.length];
};

const createNumberedMarkerIcon = (number, colorHex = '#3b82f6') => {
  return L.divIcon({
    html: `<div class="relative flex items-center justify-center w-8 h-8">
             <span class="animate-ping absolute inline-flex h-full w-full rounded-full opacity-30" style="background-color: ${colorHex}"></span>
             <div class="relative flex items-center justify-center w-7 h-7 rounded-full text-white font-extrabold text-xs shadow-xl border-2 border-white" style="background-color: ${colorHex}">
               ${number}
             </div>
           </div>`,
    className: 'custom-numbered-marker-div',
    iconSize: [32, 32],
    iconAnchor: [16, 16]
  });
};

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

const DISTINCT_COLORS = [
  { stroke: '#3b82f6', bg: 'bg-blue-500' },
  { stroke: '#f59e0b', bg: 'bg-amber-500' },
  { stroke: '#8b5cf6', bg: 'bg-violet-500' },
  { stroke: '#ec4899', bg: 'bg-pink-500' },
  { stroke: '#06b6d4', bg: 'bg-cyan-500' },
  { stroke: '#f97316', bg: 'bg-orange-500' },
];

const MapComponent = ({
  routes = [],
  activeRoute = null,
  stops = [],
  selectedOrigin = '',
  selectedDestination = '',
  driverPosition = null,
  isNavigationMode = false,
  onSelectPoints,
  onMarkerDragEnd,
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
  
  // Waze Traffic Modal State
  const [showWazeTraffic, setShowWazeTraffic] = useState(false);

  const tileLayerRef = useRef(null);
  const activeLayersRef = useRef([]);
  const vehicleMarkerRef = useRef(null);
  const pathHistoryRef = useRef([]);
  const completedPolylineRef = useRef(null);
  const routingGenerationRef = useRef(0);
  const routePolylineRef = useRef(null);
  const myLocationMarkerRef = useRef(null);
  const lastRouteKeyRef = useRef(null);

  const dropdownRef = useRef(null);

  const parseCoordinates = (coordString) => {
    if (!coordString || typeof coordString !== 'string') return null;
    const parts = coordString.split(',');
    if (parts.length !== 2) return null;
    let val1 = parseFloat(parts[0].trim());
    let val2 = parseFloat(parts[1].trim());
    if (isNaN(val1) || isNaN(val2)) return null;

    if (Math.abs(val1) > 30 && Math.abs(val2) <= 30) {
      return [val2, val1];
    }
    if (Math.abs(val1) <= 90 && Math.abs(val2) <= 180) {
      return [val1, val2];
    }
    return null;
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

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (mapContainerRef.current._leaflet_id) {
      delete mapContainerRef.current._leaflet_id;
    }

    const map = L.map(mapContainerRef.current, {
      center: [4.7110, -74.0721],
      zoom: 12,
      zoomControl: false,
    });

    L.control.zoom({
      position: 'topright'
    }).addTo(map);

    mapInstanceRef.current = map;

    const initialTileId = theme === 'dark' ? 'esri-dark' : 'esri-light';
    switchTileLayer(initialTileId);

    map.on('dragstart zoomstart', () => {
      setIsAutoFollowing(false);
    });

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
          console.warn('Reverse geocoding failed:', err);
          onSelectPoints?.({ coordinates: coordString, address: `Coordenadas: ${coordString}` });
        });
    });

    const resizeObserver = new ResizeObserver(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    });
    
    if (mapContainerRef.current) {
      resizeObserver.observe(mapContainerRef.current);
    }

    const timer1 = setTimeout(() => { map.invalidateSize(); }, 150);
    const timer2 = setTimeout(() => { map.invalidateSize(); }, 600);

    const handleWindowResize = () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    };
    window.addEventListener('resize', handleWindowResize);

    return () => {
      routingGenerationRef.current += 1;
      resizeObserver.disconnect();
      window.removeEventListener('resize', handleWindowResize);
      clearTimeout(timer1);
      clearTimeout(timer2);

      const map = mapInstanceRef.current;
      if (map) {
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
        lastRouteKeyRef.current = null;

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

  useEffect(() => {
    if (mapInstanceRef.current) {
      const targetTileId = theme === 'dark' ? 'esri-dark' : 'esri-light';
      switchTileLayer(targetTileId);
    }
  }, [theme]);

  const switchTileLayer = (providerId) => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const provider = TILE_PROVIDERS.find(p => p.id === providerId) || TILE_PROVIDERS[0];

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

    newLayer.on('loading', () => { setIsTilesLoading(true); });
    newLayer.on('load', () => { setIsTilesLoading(false); });
    newLayer.on('tileerror', (error) => {
      console.error(`Tile layer load error for ${provider.name}:`, error);
      setIsTilesLoading(false);
      setHasTileError(true);

      if (providerId !== 'osm') {
        switchTileLayer('osm');
      }
    });

    newLayer.addTo(map);
    tileLayerRef.current = newLayer;
    setActiveTileId(providerId);

    setTimeout(() => {
      map.invalidateSize();
    }, 50);
  };

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
        alert('No se pudo determinar su ubicación actual.');
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const currentRouteKey = activeRoute
      ? `${activeRoute.id_ruta || ''}|${activeRoute.origen || ''}|${activeRoute.destino || ''}|${activeRoute.paradas || ''}`
      : `${stops.map(s => `${s.id}:${s.coordinates}`).join(';')}|${selectedOrigin}|${selectedDestination}`;

    if (lastRouteKeyRef.current === currentRouteKey && routePolylineRef.current && map.hasLayer(routePolylineRef.current)) {
      return;
    }

    lastRouteKeyRef.current = currentRouteKey;

    pathHistoryRef.current = [];
    if (completedPolylineRef.current && map.hasLayer(completedPolylineRef.current)) {
      map.removeLayer(completedPolylineRef.current);
      completedPolylineRef.current = null;
    }

    routingGenerationRef.current += 1;
    const currentGen = routingGenerationRef.current;

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

    if (myLocationMarkerRef.current && !map.hasLayer(myLocationMarkerRef.current)) {
      myLocationMarkerRef.current.addTo(map);
    }

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

    const renderActiveRoute = async () => {
      let activeRouteName = activeRoute?.nombre_ruta || activeRoute?.codigo_ruta || 'Ruta';
      let stopsToRender = [];

      if (stops && stops.length > 0) {
        stopsToRender = stops;
      } else if (activeRoute) {
        if (activeRoute.paradas) {
          try {
            const parsed = typeof activeRoute.paradas === 'string' ? JSON.parse(activeRoute.paradas) : activeRoute.paradas;
            if (Array.isArray(parsed) && parsed.length > 0) {
              stopsToRender = parsed;
            }
          } catch (e) {
            console.warn('Error parsing activeRoute.paradas:', e);
          }
        }
        if (stopsToRender.length === 0) {
          stopsToRender = [
            { id: 'stop-1', order: 1, address: activeRoute.origen, coordinates: activeRoute.origen },
            { id: 'stop-2', order: 2, address: activeRoute.destino, coordinates: activeRoute.destino },
          ];
        }
      } else if (selectedOrigin || selectedDestination) {
        stopsToRender = [
          ...(selectedOrigin ? [{ id: 'stop-orig', order: 1, address: selectedOrigin, coordinates: selectedOrigin }] : []),
          ...(selectedDestination ? [{ id: 'stop-dest', order: 2, address: selectedDestination, coordinates: selectedDestination }] : []),
        ];
      }

      if (currentGen !== routingGenerationRef.current || !mapInstanceRef.current) return;

      const validWaypoints = [];
      const validMarkers = [];

      for (let idx = 0; idx < stopsToRender.length; idx++) {
        const stop = stopsToRender[idx];
        const stopNumber = idx + 1;
        const colorInfo = getStopColor(idx);
        const resolvedCoords = await resolveCoordsAsync(stop.coordinates);

        if (currentGen !== routingGenerationRef.current || !mapInstanceRef.current) return;

        if (resolvedCoords) {
          validWaypoints.push(resolvedCoords);

          const marker = L.marker(resolvedCoords, {
            icon: createNumberedMarkerIcon(stopNumber, colorInfo.hex),
            draggable: true
          })
            .bindPopup(`<b>Parada ${stopNumber}</b><br>${stop.address || 'Sin dirección'}`)
            .addTo(map);

          marker.on('dragend', (e) => {
            const { lat, lng } = e.target.getLatLng();
            const newCoordString = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;

            fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=es`, {
              headers: { 'User-Agent': 'VextorFleetApp/1.0' }
            })
              .then(res => res.json())
              .then(data => {
                const address = data?.display_name || `Ubicación en ${lat.toFixed(4)}, ${lng.toFixed(4)}`;
                onMarkerDragEnd?.({
                  stopId: stop.id,
                  stopIndex: idx,
                  coordinates: newCoordString,
                  address,
                  type: idx === 0 ? 'origin' : (idx === stopsToRender.length - 1 ? 'destination' : 'stop')
                });
              })
              .catch(err => {
                console.warn('Reverse geocoding error on marker drag:', err);
                onMarkerDragEnd?.({
                  stopId: stop.id,
                  stopIndex: idx,
                  coordinates: newCoordString,
                  address: newCoordString,
                  type: idx === 0 ? 'origin' : (idx === stopsToRender.length - 1 ? 'destination' : 'stop')
                });
              });
          });

          activeLayersRef.current.push(marker);
          validMarkers.push(marker);
        }
      }

      if (validWaypoints.length >= 2) {
        routeService.calculateRoute({ waypoints: validWaypoints })
          .then((route) => {
            if (currentGen !== routingGenerationRef.current || !mapInstanceRef.current) return;

            if (!route?.geometry?.coordinates || !Array.isArray(route.geometry.coordinates)) {
              throw new Error('La geometría de la ruta recibida no es válida.');
            }

            const latLngs = route.geometry.coordinates.map(([lng, lat]) => [lat, lng]);
            if (latLngs.length < 2) throw new Error('La geometría recibida no contiene suficientes puntos.');

            if (routePolylineRef.current && map.hasLayer(routePolylineRef.current)) {
              map.removeLayer(routePolylineRef.current);
            }

            const polyline = L.polyline(latLngs, {
              color: '#10b981',
              weight: 6,
              opacity: 0.9
            }).bindPopup(`<b>${activeRouteName} (${validWaypoints.length} paradas)</b>`).addTo(map);
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
        if (validWaypoints.length === 1) {
          map.setView(validWaypoints[0], 14);
        }
      }
    };

    renderActiveRoute();

    setTimeout(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    }, 150);

  }, [routes, activeRoute, stops, selectedOrigin, selectedDestination]);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (!driverPosition || !driverPosition.lat || !driverPosition.lng) {
      if (vehicleMarkerRef.current && map.hasLayer(vehicleMarkerRef.current)) {
        map.removeLayer(vehicleMarkerRef.current);
        vehicleMarkerRef.current = null;
      }
      return;
    }

    const { lat, lng, heading } = driverPosition;
    const vehicleLatLng = [lat, lng];

    if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return;

    const lastPos = pathHistoryRef.current[pathHistoryRef.current.length - 1];
    const hasMoved = !lastPos || Math.abs(lastPos[0] - lat) > 0.00005 || Math.abs(lastPos[1] - lng) > 0.00005;

    if (hasMoved) {
      pathHistoryRef.current.push(vehicleLatLng);
    }

    if (!vehicleMarkerRef.current) {
      vehicleMarkerRef.current = L.marker(vehicleLatLng, { icon: createVehicleIcon(heading || 0) })
        .bindPopup('<b>Vehículo en Ruta</b>')
        .addTo(map);
    } else {
      vehicleMarkerRef.current.setLatLng(vehicleLatLng);
      vehicleMarkerRef.current.setIcon(createVehicleIcon(heading || 0));
    }

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
                        ? "bg-primary text-white font-semibold shadow-lg"
                        : "text-v-gray hover:bg-v-dark hover:text-v-white"
                    )}
                  >
                    <span>{provider.name}</span>
                    <span className="text-[10px] opacity-75 uppercase px-1.5 py-0.5 bg-black/20 rounded">
                      {provider.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Botón de Tráfico en Vivo con Waze */}
        <button
          type="button"
          onClick={() => setShowWazeTraffic(true)}
          className="flex items-center gap-2 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs rounded-xl shadow-xl transition-all cursor-pointer hover:scale-105 active:scale-95 border border-blue-400/30"
          title="Ver tráfico en tiempo real con Waze"
        >
          <span>🚦 Tráfico en Vivo (Waze)</span>
        </button>
      </div>

      {/* Floating Control Buttons (Bottom Right / Geolocation & Recenter) */}
      <div className="absolute bottom-6 right-6 z-20 flex flex-col gap-2">
        <button
          onClick={handleMyLocation}
          className="p-3 bg-v-dark-soft/95 backdrop-blur-md border border-v-dark-border rounded-xl shadow-2xl text-v-white hover:border-primary/40 hover:text-primary transition-all cursor-pointer hover:scale-105 active:scale-95"
          title="Mi ubicación GPS"
        >
          <Compass size={18} />
        </button>
      </div>

      {/* Modal de Waze Live Map */}
      {showWazeTraffic && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-5xl h-[82vh] flex flex-col overflow-hidden">
            
            {/* Cabecera del Modal */}
            <div className="flex items-center justify-between px-5 py-3.5 bg-slate-950 border-b border-slate-800 text-white">
              <div className="flex items-center gap-2.5">
                <span className="text-sm font-semibold tracking-wide">Monitor de Tráfico en Tiempo Real - Bogotá (Waze)</span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/30 font-medium">
                  En Vivo
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowWazeTraffic(false)}
                className="text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer"
              >
                ✕ Cerrar
              </button>
            </div>

            {/* Contenedor del Iframe de Waze */}
            <div className="flex-1 w-full h-full bg-slate-950 relative">
              <iframe
                src="https://embed.waze.com/iframe?zoom=12&lat=4.6533&lon=-74.0836&ct=livemap"
                width="100%"
                height="100%"
                allowFullScreen
                loading="lazy"
                title="Waze Live Traffic Bogotá"
                className="border-0 w-full h-full"
              />
            </div>

            {/* Pie de modal */}
            <div className="px-5 py-2.5 bg-slate-950 border-t border-slate-800 flex justify-between items-center text-xs text-slate-400">
              <span>Datos de congestión, accidentes y obras viales provistos por Waze Live Map.</span>
              <a
                href="https://www.waze.com/live-map"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline flex items-center gap-1 font-medium"
              >
                Abrir en pantalla completa <ExternalLink size={12} />
              </a>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default MapComponent;