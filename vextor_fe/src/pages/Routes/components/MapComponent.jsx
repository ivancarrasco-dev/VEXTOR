import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet-routing-machine';

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
}) => {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);

  // Keep references to current interactive layers to clean them up on redraw
  const activeLayersRef = useRef([]);
  const routingControlRef = useRef(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Centered in Bogotá: Lat 4.7110, Lng -74.0721, zoom 12
    const map = L.map(mapContainerRef.current, {
      center: [4.7110, -74.0721],
      zoom: 12,
      zoomControl: true,
    });

    // Premium dark tile layer matching Vextor's dark theme
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 20
    }).addTo(map);

    mapInstanceRef.current = map;

    // Handle map clicks for selecting points
    map.on('click', (e) => {
      const { lat, lng } = e.latlng;
      const coordString = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
      onSelectPoints(coordString);
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

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

    // 2. Draw Other (Non-Active) Routes
    routes.forEach((route, index) => {
      // Skip if this is the active route (we draw active route with high priority next)
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

        // Draw simple Polyline for other routes
        const polyline = L.polyline([originCoords, destCoords], {
          color: colorSet.stroke,
          weight: 3,
          opacity: 0.6,
          dashArray: '5, 10'
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
    let isEditingOrCreate = false;

    if (activeRoute) {
      originToDraw = parseCoordinates(activeRoute.origen);
      destToDraw = parseCoordinates(activeRoute.destino);
      activeRouteName = activeRoute.nombre_ruta || activeRoute.codigo_ruta || 'Ruta Seleccionada';
    } else {
      originToDraw = parseCoordinates(selectedOrigin);
      destToDraw = parseCoordinates(selectedDestination);
      isEditingOrCreate = true;
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
      // Try to use Leaflet Routing Machine for streets
      try {
        const routingControl = L.Routing.control({
          waypoints: [
            L.latLng(originToDraw[0], originToDraw[1]),
            L.latLng(destToDraw[0], destToDraw[1])
          ],
          router: L.Routing.osrmv1({
            serviceUrl: 'https://router.project-osrm.org/route/v1'
          }),
          lineOptions: {
            styles: [
              { color: '#10b981', opacity: 0.9, weight: 6 } // Vextor Primary Color (Emerald-500)
            ],
            addWaypoints: false
          },
          createMarker: () => null, // Suppress default ugly routing machine markers
          show: false, // Suppress routing instruction box
          addWaypoints: false,
          fitSelectedRoutes: false
        }).addTo(map);

        routingControlRef.current = routingControl;

        // Fallback to polyline on routing error (e.g. OSRM rate limits or offline)
        routingControl.on('routingerror', () => {
          console.warn('Routing machine error, falling back to Polyline...');
          drawActivePolyline(map, originToDraw, destToDraw, activeRouteName);
        });

      } catch (err) {
        console.error('Failed to initialize routing machine:', err);
        drawActivePolyline(map, originToDraw, destToDraw, activeRouteName);
      }

      // Center view on active route
      const bounds = L.latLngBounds([originToDraw, destToDraw]);
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });

    } else if (originToDraw) {
      // If only origin is selected, center on it
      map.setView(originToDraw, 14);
    } else if (destToDraw) {
      map.setView(destToDraw, 14);
    }

  }, [routes, activeRoute, selectedOrigin, selectedDestination]);

  // Utility to draw a robust emerald Polyline for the active route
  const drawActivePolyline = (map, origin, dest, title) => {
    const polyline = L.polyline([origin, dest], {
      color: '#10b981', // Emerald-500
      weight: 5,
      opacity: 0.95
    })
      .bindPopup(`<b>${title}</b>`)
      .addTo(map);
    activeLayersRef.current.push(polyline);
  };

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

  return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden border border-v-dark-border shadow-xl">
      <div ref={mapContainerRef} className="w-full h-full min-h-[400px] lg:min-h-[600px] z-10" />

      {/* Visual map Overlay Instruction */}
      <div className="absolute bottom-4 left-4 bg-v-dark-soft/95 backdrop-blur-md border border-v-dark-border px-3 py-2 rounded-xl text-xs text-v-white z-20 pointer-events-none shadow-lg space-y-1 max-w-[280px]">
        <div className="font-bold text-emerald-400 flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          ¿Cómo crear un trayecto?
        </div>
        <p className="text-v-gray leading-relaxed">
          Haz clic en el mapa para marcar el <strong className="text-emerald-400">Origen (A)</strong> y un segundo clic para el <strong className="text-red-400">Destino (B)</strong>.
        </p>
      </div>
    </div>
  );
};

export default MapComponent;
