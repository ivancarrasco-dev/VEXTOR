import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  MapPin,
  Clock,
  Truck,
  Navigation,
  CheckCircle2,
  AlertCircle,
  Radio,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Compass,
  Square,
  ShieldCheck
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import MapComponent from '../Routes/components/MapComponent';
import { showConfirm, showAlert } from '../../utils/sweetalert';

const ActiveRoutePage = () => {
  const { idRuta } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [activeRoute, setActiveRoute] = useState(null);
  const [routeMetrics, setRouteMetrics] = useState({
    distance: '--',
    duration: '--',
    instructions: []
  });
  const [showInstructions, setShowInstructions] = useState(false);

  // GPS Tracking states
  const [currentPosition, setCurrentPosition] = useState(null);
  const [gpsError, setGpsError] = useState(null);
  const [isGpsActive, setIsGpsActive] = useState(false);
  const [lastGpsUpdate, setLastGpsUpdate] = useState(null);

  // WebSocket & Watcher Refs
  const wsRef = useRef(null);
  const watchIdRef = useRef(null);
  const updateIntervalRef = useRef(null);

  // Fetch active route details
  const fetchActiveRoute = async () => {
    try {
      setLoading(true);
      const res = await axios.get('http://localhost:8000/api/routes/driver/my-routes');
      const active = res.data.active_route;

      if (active) {
        if (!idRuta || active.id_ruta === idRuta) {
          setActiveRoute(active);
        } else {
          setActiveRoute(active);
        }
      } else {
        // No active route found
        setActiveRoute(null);
      }
    } catch (err) {
      console.error('Error fetching active route:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveRoute();
  }, [idRuta]);

  // Connect WebSocket for tracking when active route is present
  useEffect(() => {
    if (!activeRoute) return;

    // 1. Establish WebSocket Connection
    try {
      const ws = new WebSocket('ws://localhost:8000/ws/tracking');
      ws.onopen = () => {
        console.log('Tracking WebSocket connected');
      };
      ws.onerror = (err) => {
        console.warn('Tracking WebSocket error:', err);
      };
      wsRef.current = ws;
    } catch (err) {
      console.warn('Failed to establish WebSocket connection:', err);
    }

    // 2. Start HTML5 Geolocation Watcher
    if ('geolocation' in navigator) {
      setIsGpsActive(true);
      setGpsError(null);

      const handleLocationSuccess = (position) => {
        const { latitude, longitude, speed, heading } = position.coords;
        const lat = parseFloat(latitude.toFixed(6));
        const lng = parseFloat(longitude.toFixed(6));
        const posObj = { lat, lng, speed: speed || 0, heading: heading || 0 };

        setCurrentPosition(posObj);
        setLastGpsUpdate(new Date());

        // Send via WebSocket if open
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({
            type: 'location_update',
            id_ruta: activeRoute.id_ruta,
            latitud: lat,
            longitud: lng,
            velocidad: speed || 0.0,
            heading: heading || 0.0
          }));
        } else {
          // Fallback via HTTP POST
          axios.post(`http://localhost:8000/api/routes/${activeRoute.id_ruta}/location`, {
            id_ruta: activeRoute.id_ruta,
            latitud: lat,
            longitud: lng,
            velocidad: speed || 0.0,
            heading: heading || 0.0
          }).catch((err) => console.warn('HTTP location fallback failed:', err));
        }
      };

      const handleLocationError = (error) => {
        console.warn('GPS location error:', error);
        let msg = 'No pudimos acceder a tu ubicación. Activa los permisos de ubicación para iniciar el seguimiento.';
        if (error.code === error.PERMISSION_DENIED) {
          msg = 'Permiso de ubicación denegado por el navegador. Habilítalo en los ajustes para compartir tu posición.';
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          msg = 'Señales GPS no disponibles temporalmente.';
        }
        setGpsError(msg);
        setIsGpsActive(false);
      };

      // Watch position continuously
      watchIdRef.current = navigator.geolocation.watchPosition(
        handleLocationSuccess,
        handleLocationError,
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 5000 }
      );

      // Backup interval every 10s to ensure periodic updates
      updateIntervalRef.current = setInterval(() => {
        navigator.geolocation.getCurrentPosition(
          handleLocationSuccess,
          () => {},
          { enableHighAccuracy: true, timeout: 8000 }
        );
      }, 10000);

    } else {
      setGpsError('La geolocalización no está disponible en este dispositivo.');
      setIsGpsActive(false);
    }

    return () => {
      // Cleanup GPS watcher and WS on unmount or route finish
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
      setIsGpsActive(false);
    };
  }, [activeRoute]);

  const handleFinishRoute = async () => {
    const confirm = await showConfirm(
      '¿Deseas finalizar esta ruta?',
      'Al finalizar la ruta se detendrá el seguimiento GPS de ubicación y la ruta quedará registrada como completada.',
      'Sí, Finalizar Ruta',
      'Cancelar',
      true
    );

    if (!confirm.isConfirmed) return;

    try {
      await axios.post(`http://localhost:8000/api/routes/${activeRoute.id_ruta}/finish`);

      // Stop GPS immediately
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
      setIsGpsActive(false);

      await showAlert('¡Ruta Finalizada!', 'La ruta ha sido completada con éxito.', 'success');
      navigate('/driver/my-routes');
    } catch (err) {
      const msg = err.response?.data?.detail || 'No se pudo finalizar la ruta.';
      showAlert('Error', msg, 'error');
    }
  };

  const handleRouteCalculated = (metrics) => {
    if (!metrics) {
      setRouteMetrics({ distance: '--', duration: '--', instructions: [] });
      return;
    }
    setRouteMetrics({
      distance: metrics.distance || '--',
      duration: metrics.duration || '--',
      instructions: metrics.instructions || []
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-v-gray text-sm font-medium">Cargando navegación de la ruta activa...</p>
        </div>
      </div>
    );
  }

  if (!activeRoute) {
    return (
      <div className="max-w-xl mx-auto py-12 text-center space-y-6">
        <div className="p-8 bg-v-dark-soft border border-v-dark-border rounded-3xl space-y-4 shadow-xl">
          <AlertCircle size={48} className="mx-auto text-amber-400" />
          <h2 className="text-xl font-bold text-v-white">No hay ruta activa en este momento</h2>
          <p className="text-v-gray text-sm">
            Para iniciar el seguimiento y la navegación GPS, selecciona e inicia una de tus rutas asignadas.
          </p>
          <Button
            onClick={() => navigate('/driver/my-routes')}
            className="w-full justify-center cursor-pointer"
          >
            <ArrowLeft size={18} className="mr-2" />
            Volver a Mis Rutas
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Banner Navigation Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-v-dark-soft border border-v-dark-border p-4 sm:p-6 rounded-3xl shadow-2xl">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/driver/my-routes')}
            className="p-3 rounded-2xl bg-v-dark hover:bg-v-dark-border text-v-gray hover:text-v-white transition-colors cursor-pointer border border-v-dark-border"
            title="Volver"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-md bg-blue-500/20 text-blue-400 font-extrabold text-xs border border-blue-500/30">
                {activeRoute.codigo_ruta}
              </span>
              <h1 className="text-xl font-bold text-v-white">{activeRoute.nombre_ruta}</h1>
            </div>
            <p className="text-xs text-v-gray mt-1">
              Vehículo: <strong className="text-v-white">{activeRoute.vehiculo?.placa || 'Asignado'}</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 self-end sm:self-auto">
          <Button
            onClick={handleFinishRoute}
            className="bg-red-600 hover:bg-red-500 text-white font-bold py-3 px-6 rounded-2xl text-xs flex items-center gap-2 shadow-lg cursor-pointer transition-all"
          >
            <Square size={16} fill="white" />
            Finalizar Ruta
          </Button>
        </div>
      </div>

      {/* GPS Status Indicator Bar */}
      <div className="p-4 bg-v-dark-soft/90 border border-v-dark-border rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center">
            <span className="animate-ping absolute inline-flex h-4 w-4 rounded-full bg-emerald-400 opacity-75"></span>
            <Radio size={18} className="text-emerald-400 relative z-10" />
          </div>
          <div>
            <div className="text-xs font-bold text-emerald-400 flex items-center gap-2">
              Seguimiento GPS en Tiempo Real Activo
            </div>
            <p className="text-[11px] text-v-gray">
              Tu ubicación exacta se comparte con la central mientras realices esta ruta.
            </p>
          </div>
        </div>

        {lastGpsUpdate && (
          <span className="text-[11px] text-v-gray bg-v-dark px-3 py-1.5 rounded-xl border border-v-dark-border self-start sm:self-auto">
            Último reporte: <strong className="text-v-white">{lastGpsUpdate.toLocaleTimeString('es-CO')}</strong>
          </span>
        )}
      </div>

      {/* GPS Error Warning Notice */}
      {gpsError && (
        <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-start gap-3 text-amber-400 text-xs shadow-md">
          <AlertCircle size={18} className="shrink-0 mt-0.5" />
          <div>
            <strong className="font-bold">Advertencia de Geolocalización:</strong> {gpsError}
          </div>
        </div>
      )}

      {/* HUD Navigation Banner */}
      {routeMetrics.instructions.length > 0 && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center justify-between gap-4 shadow-xl">
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-2xl border border-emerald-500/30">
              <Navigation size={22} className="-rotate-45" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest block">Próxima Indicación</span>
              <p className="text-sm sm:text-base font-extrabold text-v-white">
                {routeMetrics.instructions[0]?.text || 'Sigue la ruta marcada en el mapa'}
              </p>
            </div>
          </div>
          <div className="text-right shrink-0">
            <span className="text-[10px] text-v-gray block uppercase font-bold">Velocidad</span>
            <span className="text-xl font-extrabold text-emerald-400">
              {((currentPosition?.speed || 0) * 3.6).toFixed(0)} <span className="text-xs font-normal text-v-gray">km/h</span>
            </span>
          </div>
        </div>
      )}

      {/* Main Grid: Map & Navigation Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Map Container (Takes 2 Columns) */}
        <div className="lg:col-span-2 h-[500px] lg:h-[650px] relative rounded-3xl overflow-hidden border border-v-dark-border shadow-2xl">
          <MapComponent
            routes={[]}
            activeRoute={activeRoute}
            driverPosition={currentPosition}
            isNavigationMode={true}
            onRouteCalculated={handleRouteCalculated}
          />
        </div>

        {/* Live Route Info Card (1 Column) */}
        <div className="space-y-4">
          <div className="p-6 bg-v-dark-soft border border-v-dark-border rounded-3xl space-y-6 shadow-xl">
            <div className="flex items-center justify-between pb-4 border-b border-v-dark-border">
              <span className="text-xs font-bold uppercase tracking-wider text-v-gray">Métricas de Navegación</span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                En Curso
              </span>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-v-dark border border-v-dark-border space-y-1">
                <span className="text-[11px] text-v-gray">Distancia Est.</span>
                <div className="text-2xl font-extrabold text-v-white">{routeMetrics.distance} km</div>
              </div>
              <div className="p-4 rounded-2xl bg-v-dark border border-v-dark-border space-y-1">
                <span className="text-[11px] text-v-gray">Tiempo Est.</span>
                <div className="text-2xl font-extrabold text-emerald-400">{routeMetrics.duration} min</div>
              </div>
            </div>

            {/* Route Details */}
            <div className="space-y-3 pt-2">
              <div className="flex items-start gap-3">
                <MapPin size={18} className="text-emerald-400 mt-0.5 shrink-0" />
                <div className="text-xs">
                  <span className="text-v-gray block">Punto de Origen:</span>
                  <strong className="text-v-white text-sm">{activeRoute.origen}</strong>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MapPin size={18} className="text-red-400 mt-0.5 shrink-0" />
                <div className="text-xs">
                  <span className="text-v-gray block">Punto de Destino:</span>
                  <strong className="text-v-white text-sm">{activeRoute.destino}</strong>
                </div>
              </div>

              {activeRoute.vehiculo && (
                <div className="flex items-start gap-3 pt-2 border-t border-v-dark-border">
                  <Truck size={18} className="text-primary mt-0.5 shrink-0" />
                  <div className="text-xs">
                    <span className="text-v-gray block">Vehículo Asignado:</span>
                    <strong className="text-v-white text-sm">{activeRoute.vehiculo.placa} ({activeRoute.vehiculo.marca} {activeRoute.vehiculo.modelo})</strong>
                  </div>
                </div>
              )}
            </div>

            {/* Collapsible Turn-by-turn Turn Directions Drawer */}
            {routeMetrics.instructions.length > 0 && (
              <div className="pt-4 border-t border-v-dark-border space-y-3">
                <button
                  onClick={() => setShowInstructions(!showInstructions)}
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-v-dark hover:bg-v-dark-border border border-v-dark-border text-xs font-bold text-v-white transition-all cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <Navigation size={14} className="text-primary" />
                    Indicaciones del Recorrido ({routeMetrics.instructions.length})
                  </span>
                  {showInstructions ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>

                {showInstructions && (
                  <div className="max-h-60 overflow-y-auto space-y-2 pr-1 custom-scrollbar animate-in fade-in duration-200">
                    {routeMetrics.instructions.map((inst, idx) => (
                      <div key={idx} className="p-3 rounded-xl bg-v-dark/60 border border-v-dark-border text-xs space-y-1">
                        <p className="text-v-white font-medium">{inst.text}</p>
                        {inst.distance && (
                          <span className="text-[10px] text-v-gray block">
                            En {(inst.distance / 1000).toFixed(1)} km
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActiveRoutePage;
