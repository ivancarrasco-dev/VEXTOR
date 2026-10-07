import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL, WS_BASE_URL } from '../../config/api';
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
  Play,
  Pause,
  ShieldCheck,
  ListOrdered,
  AlertTriangle,
  Users
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import MapComponent from '../Routes/components/MapComponent';
import { showConfirm, showAlert } from '../../utils/sweetalert';
import IncidentReportModal from '../../components/modals/IncidentReportModal';
import PassengerListModal from '../../components/modals/PassengerListModal';
import { reverseGeocodeAddress } from '../../utils/geocoding';

const EMPTY_ROUTES = [];

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

  // Address Display States
  const [originAddress, setOriginAddress] = useState('');
  const [destAddress, setDestAddress] = useState('');

  // GPS Tracking states
  const [currentPosition, setCurrentPosition] = useState(null);
  const [gpsError, setGpsError] = useState(null);
  const [isGpsActive, setIsGpsActive] = useState(false);
  const [lastGpsUpdate, setLastGpsUpdate] = useState(null);

  // Modal States
  const [isIncidentModalOpen, setIsIncidentModalOpen] = useState(false);
  const [isPassengerModalOpen, setIsPassengerModalOpen] = useState(false);

  // WebSocket & Watcher Refs
  const wsRef = useRef(null);
  const watchIdRef = useRef(null);
  const updateIntervalRef = useRef(null);

  // Fetch active or assigned route details
  const fetchActiveRoute = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE_URL}/api/routes/driver/my-routes`);
      const { active_route, assigned_routes } = res.data;

      let targetRoute = null;

      if (idRuta) {
        if (active_route && active_route.id_ruta === idRuta) {
          targetRoute = active_route;
        } else {
          const matchedAssigned = (assigned_routes || []).find(r => r.id_ruta === idRuta);
          if (matchedAssigned) {
            targetRoute = matchedAssigned;
          }
        }
      } else {
        targetRoute = active_route || (assigned_routes && assigned_routes[0]) || null;
      }

      setActiveRoute(targetRoute);

      if (targetRoute) {
        resolveFriendlyAddresses(targetRoute.origen, targetRoute.destino);
      }
    } catch (err) {
      console.error('Error fetching route details:', err);
    } finally {
      setLoading(false);
    }
  };

  const resolveFriendlyAddresses = async (orig, dest) => {
    if (!orig || !dest) return;
    setOriginAddress(orig);
    setDestAddress(dest);

    try {
      const [resolvedOrig, resolvedDest] = await Promise.all([
        reverseGeocodeAddress(orig),
        reverseGeocodeAddress(dest)
      ]);
      setOriginAddress(resolvedOrig);
      setDestAddress(resolvedDest);
    } catch (err) {
      console.warn('Error resolving active route addresses:', err);
    }
  };

  useEffect(() => {
    fetchActiveRoute();
  }, [idRuta]);

  // Connect WebSocket and GPS tracking only when route is in EN_PROCESO / EN_RUTA
  useEffect(() => {
    if (!activeRoute || (activeRoute.estado_ruta !== 'EN_PROCESO' && activeRoute.estado_ruta !== 'EN_RUTA')) {
      return;
    }

    try {
      const wsUrl = `${WS_BASE_URL}/ws/tracking`;
      const ws = new WebSocket(wsUrl);
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
          axios.post(`${API_BASE_URL}/api/routes/${activeRoute.id_ruta}/location`, {
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

      watchIdRef.current = navigator.geolocation.watchPosition(
        handleLocationSuccess,
        handleLocationError,
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 5000 }
      );

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

  const handleStartRoute = async () => {
    if (!activeRoute) return;

    const confirm = await showConfirm(
      '¿Deseas iniciar esta ruta?',
      `Al iniciar la ruta "${activeRoute.nombre_ruta}", se activará el seguimiento de ubicación GPS en tiempo real y tu estado cambiará a EN RUTA.`,
      'Sí, Iniciar Ruta',
      'Cancelar',
      false
    );

    if (!confirm.isConfirmed) return;

    try {
      await axios.post(`${API_BASE_URL}/api/routes/${activeRoute.id_ruta}/start`);
      await showAlert('¡Ruta Iniciada!', 'El seguimiento de ubicación GPS está activo.', 'success');
      fetchActiveRoute();
    } catch (err) {
      const msg = err.response?.data?.detail || 'No se pudo iniciar la ruta.';
      showAlert('Error al iniciar', msg, 'error');
    }
  };

  const handlePauseRoute = async () => {
    if (!activeRoute) return;

    const confirm = await showConfirm(
      '¿Deseas pausar esta ruta?',
      'Al pausar la ruta se suspenderá temporalmente el recorrido hasta que decidas reanudarlo.',
      'Sí, Pausar Ruta',
      'Cancelar',
      true
    );

    if (!confirm.isConfirmed) return;

    try {
      await axios.post(`${API_BASE_URL}/api/routes/${activeRoute.id_ruta}/pause`);
      await showAlert('Ruta Pausada', 'La ruta se encuentra en estado suspendido.', 'info');
      fetchActiveRoute();
    } catch (err) {
      const msg = err.response?.data?.detail || 'No se pudo pausar la ruta.';
      showAlert('Error al pausar', msg, 'error');
    }
  };

  const handleFinishRoute = async () => {
    if (!activeRoute) return;

    const confirm = await showConfirm(
      '¿Deseas finalizar esta ruta?',
      'Al finalizar la ruta se detendrá el seguimiento GPS y la ruta quedará registrada como completada.',
      'Sí, Finalizar Ruta',
      'Cancelar',
      true
    );

    if (!confirm.isConfirmed) return;

    try {
      await axios.post(`${API_BASE_URL}/api/routes/${activeRoute.id_ruta}/finish`);

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

  const handleRouteCalculated = useCallback((metrics) => {
    if (!metrics) {
      setRouteMetrics({ distance: '--', duration: '--', instructions: [] });
      return;
    }
    setRouteMetrics({
      distance: metrics.distance || '--',
      duration: metrics.duration || '--',
      instructions: metrics.instructions || []
    });
  }, []);

  const getRouteStatusBadge = (status) => {
    switch (status) {
      case 'EN_PROCESO':
      case 'EN_RUTA':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/30 flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-blue-500 animate-ping" />
            EN RUTA
          </span>
        );
      case 'SUSPENDIDA':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30">
            PAUSADA
          </span>
        );
      case 'PROGRAMADA':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
            PROGRAMADA
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-v-gray-dark text-v-gray border border-v-dark-border">
            {status || 'PROGRAMADA'}
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-v-gray text-sm font-medium">Cargando detalles de navegación de la ruta...</p>
        </div>
      </div>
    );
  }

  if (!activeRoute) {
    return (
      <div className="max-w-xl mx-auto py-12 text-center space-y-6">
        <div className="p-8 bg-v-dark-soft border border-v-dark-border rounded-3xl space-y-4 shadow-xl">
          <AlertCircle size={48} className="mx-auto text-amber-500" />
          <h2 className="text-xl font-bold text-v-white">No se encontró la ruta solicitada</h2>
          <p className="text-v-gray text-sm">
            No tienes rutas activas o asignadas con este identificador.
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

  const isRouteActive = activeRoute.estado_ruta === 'EN_PROCESO' || activeRoute.estado_ruta === 'EN_RUTA';

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 text-left">
      {/* Top Banner Navigation & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-v-dark-soft border border-v-dark-border p-4 sm:p-6 rounded-3xl shadow-xl">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/driver/my-routes')}
            className="p-3 rounded-2xl bg-v-dark hover:bg-v-dark-border text-v-gray hover:text-v-white transition-colors cursor-pointer border border-v-dark-border"
            title="Volver"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-md bg-primary/20 text-primary font-extrabold text-xs border border-primary/30">
                {activeRoute.codigo_ruta}
              </span>
              <h1 className="text-xl font-bold text-v-white">{activeRoute.nombre_ruta}</h1>
              {getRouteStatusBadge(activeRoute.estado_ruta)}
            </div>
            <p className="text-xs text-v-gray mt-1">
              Vehículo: <strong className="text-v-white">{activeRoute.vehiculo?.placa || 'Asignado'}</strong>
            </p>
          </div>
        </div>

        {/* Dynamic Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 self-end sm:self-auto">
          <Button
            variant="ghost"
            onClick={() => setIsPassengerModalOpen(true)}
            className="bg-v-dark hover:bg-v-dark-border text-v-white text-xs font-bold py-2.5 px-3.5 rounded-2xl border border-v-dark-border flex items-center gap-1.5 cursor-pointer"
          >
            <Users size={15} className="text-teal-500" />
            Pasajeros
          </Button>

          <Button
            variant="ghost"
            onClick={() => setIsIncidentModalOpen(true)}
            className="bg-amber-600/10 hover:bg-amber-600/20 text-amber-600 dark:text-amber-400 text-xs font-bold py-2.5 px-3.5 rounded-2xl border border-amber-500/30 flex items-center gap-1.5 cursor-pointer"
          >
            <AlertTriangle size={15} />
            Novedad
          </Button>

          {activeRoute.estado_ruta === 'PROGRAMADA' && (
            <Button
              onClick={handleStartRoute}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 px-5 rounded-2xl text-xs flex items-center gap-2 shadow-md cursor-pointer border-none"
            >
              <Play size={16} />
              Iniciar Ruta
            </Button>
          )}

          {isRouteActive && (
            <>
              <Button
                onClick={handlePauseRoute}
                className="bg-amber-600 hover:bg-amber-500 text-white font-bold py-2.5 px-4 rounded-2xl text-xs flex items-center gap-1.5 shadow-md cursor-pointer border-none"
              >
                <Pause size={16} />
                Pausar
              </Button>
              <Button
                onClick={handleFinishRoute}
                className="bg-red-600 hover:bg-red-500 text-white font-bold py-2.5 px-4 rounded-2xl text-xs flex items-center gap-1.5 shadow-md cursor-pointer border-none"
              >
                <Square size={16} fill="white" />
                Finalizar
              </Button>
            </>
          )}

          {activeRoute.estado_ruta === 'SUSPENDIDA' && (
            <>
              <Button
                onClick={handleStartRoute}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 px-4 rounded-2xl text-xs flex items-center gap-1.5 shadow-md cursor-pointer border-none"
              >
                <Play size={16} />
                Reanudar
              </Button>
              <Button
                onClick={handleFinishRoute}
                className="bg-red-600 hover:bg-red-500 text-white font-bold py-2.5 px-4 rounded-2xl text-xs flex items-center gap-1.5 shadow-md cursor-pointer border-none"
              >
                <Square size={16} fill="white" />
                Finalizar
              </Button>
            </>
          )}
        </div>
      </div>

      {/* GPS Status Indicator Bar */}
      {isRouteActive ? (
        <div className="p-4 bg-v-dark-soft border border-v-dark-border rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center">
              <span className="animate-ping absolute inline-flex h-4 w-4 rounded-full bg-emerald-400 opacity-75"></span>
              <Radio size={18} className="text-emerald-500 relative z-10" />
            </div>
            <div>
              <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                Seguimiento GPS en Tiempo Real Activo
              </div>
              <p className="text-[11px] text-v-gray">
                Tu ubicación exacta se transmite a la central mientras dure esta ruta.
              </p>
            </div>
          </div>

          {lastGpsUpdate && (
            <span className="text-[11px] text-v-gray bg-v-dark px-3 py-1.5 rounded-xl border border-v-dark-border self-start sm:self-auto">
              Último reporte: <strong className="text-v-white">{lastGpsUpdate.toLocaleTimeString('es-CO')}</strong>
            </span>
          )}
        </div>
      ) : activeRoute.estado_ruta === 'PROGRAMADA' ? (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center justify-between gap-3 text-emerald-600 dark:text-emerald-400 text-xs shadow-md">
          <div className="flex items-center gap-2.5">
            <Clock size={18} className="shrink-0" />
            <span>
              <strong>Ruta Programada:</strong> Presiona el botón <strong>"Iniciar Ruta"</strong> para comenzar la navegación y activar la transmisión GPS en vivo.
            </span>
          </div>
        </div>
      ) : (
        <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center justify-between gap-3 text-amber-600 dark:text-amber-400 text-xs shadow-md">
          <div className="flex items-center gap-2.5">
            <AlertCircle size={18} className="shrink-0" />
            <span>
              <strong>Ruta Pausada:</strong> El seguimiento GPS está en pausa. Presiona <strong>"Reanudar Ruta"</strong> para reactivar.
            </span>
          </div>
        </div>
      )}

      {/* GPS Error Warning Notice */}
      {gpsError && isRouteActive && (
        <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-start gap-3 text-amber-600 dark:text-amber-400 text-xs shadow-md">
          <AlertCircle size={18} className="shrink-0 mt-0.5" />
          <div>
            <strong className="font-bold">Advertencia de Geolocalización:</strong> {gpsError}
          </div>
        </div>
      )}

      {/* HUD Navigation Banner */}
      {routeMetrics.instructions.length > 0 && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center justify-between gap-4 shadow-lg">
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-2xl border border-emerald-500/30">
              <Navigation size={22} className="-rotate-45" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest block">Próxima Indicación</span>
              <p className="text-sm sm:text-base font-extrabold text-v-white">
                {routeMetrics.instructions[0]?.text || 'Sigue la ruta marcada en el mapa'}
              </p>
            </div>
          </div>
          <div className="text-right shrink-0">
            <span className="text-[10px] text-v-gray block uppercase font-bold">Velocidad</span>
            <span className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400">
              {((currentPosition?.speed || 0) * 3.6).toFixed(0)} <span className="text-xs font-normal text-v-gray">km/h</span>
            </span>
          </div>
        </div>
      )}

      {/* Main Grid: Map & Navigation Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Map Container (Takes 2 Columns) */}
        <div className="lg:col-span-2 h-[380px] sm:h-[500px] lg:h-[650px] relative rounded-3xl overflow-hidden border border-v-dark-border shadow-2xl">
          <MapComponent
            routes={EMPTY_ROUTES}
            activeRoute={activeRoute}
            driverPosition={currentPosition}
            isNavigationMode={true}
            onRouteCalculated={handleRouteCalculated}
          />
        </div>

        {/* Live Route Info & Stops List Card (1 Column) */}
        <div className="space-y-4">
          <div className="p-6 bg-v-dark-soft border border-v-dark-border rounded-3xl space-y-6 shadow-xl">
            <div className="flex items-center justify-between pb-4 border-b border-v-dark-border">
              <span className="text-xs font-bold uppercase tracking-wider text-v-gray">Detalles del Recorrido</span>
              {getRouteStatusBadge(activeRoute.estado_ruta)}
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-v-dark border border-v-dark-border space-y-1">
                <span className="text-[11px] text-v-gray">Distancia Est.</span>
                <div className="text-2xl font-extrabold text-v-white">{routeMetrics.distance} km</div>
              </div>
              <div className="p-4 rounded-2xl bg-v-dark border border-v-dark-border space-y-1">
                <span className="text-[11px] text-v-gray">Tiempo Est.</span>
                <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">{routeMetrics.duration} min</div>
              </div>
            </div>

            {/* Route Points / Stops Details */}
            <div className="space-y-4 pt-2">
              <div className="flex items-start gap-3">
                <MapPin size={18} className="text-emerald-500 mt-0.5 shrink-0" />
                <div className="text-xs space-y-0.5">
                  <span className="text-v-gray block font-semibold uppercase text-[10px] tracking-wider">Punto A - Origen:</span>
                  <strong className="text-v-white text-sm block leading-snug">{originAddress || activeRoute.origen}</strong>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MapPin size={18} className="text-red-500 mt-0.5 shrink-0" />
                <div className="text-xs space-y-0.5">
                  <span className="text-v-gray block font-semibold uppercase text-[10px] tracking-wider">Punto B - Destino:</span>
                  <strong className="text-v-white text-sm block leading-snug">{destAddress || activeRoute.destino}</strong>
                </div>
              </div>

              {activeRoute.vehiculo && (
                <div className="flex items-start gap-3 pt-3 border-t border-v-dark-border">
                  <Truck size={18} className="text-primary mt-0.5 shrink-0" />
                  <div className="text-xs">
                    <span className="text-v-gray block font-semibold uppercase text-[10px] tracking-wider">Vehículo Asignado:</span>
                    <strong className="text-v-white text-sm">{activeRoute.vehiculo.placa} ({activeRoute.vehiculo.marca} {activeRoute.vehiculo.modelo})</strong>
                  </div>
                </div>
              )}
            </div>

            {/* Collapsible Turn-by-turn Directions Drawer */}
            {routeMetrics.instructions.length > 0 && (
              <div className="pt-4 border-t border-v-dark-border space-y-3">
                <button
                  onClick={() => setShowInstructions(!showInstructions)}
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-v-dark hover:bg-v-dark-border border border-v-dark-border text-xs font-bold text-v-white transition-all cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <ListOrdered size={15} className="text-primary" />
                    Lista de Indicaciones ({routeMetrics.instructions.length})
                  </span>
                  {showInstructions ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>

                {showInstructions && (
                  <div className="max-h-60 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                    {routeMetrics.instructions.map((inst, idx) => (
                      <div key={idx} className="p-3 rounded-xl bg-v-dark border border-v-dark-border text-xs space-y-1">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-v-white font-semibold flex items-center gap-2">
                            <span className="text-primary font-mono font-bold">{idx + 1}.</span>
                            {inst.text}
                          </p>
                        </div>
                        {inst.distance > 0 && (
                          <span className="text-[10px] text-v-gray block font-mono pl-5">
                            {inst.distance >= 1000
                              ? `En ${(inst.distance / 1000).toFixed(1)} km`
                              : `En ${Math.round(inst.distance)} m`}
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

      {/* Incident Modal */}
      <IncidentReportModal
        isOpen={isIncidentModalOpen}
        onClose={() => setIsIncidentModalOpen(false)}
        busPlaca={activeRoute.vehiculo?.placa || 'VXT-801'}
        rutaCodigo={activeRoute.codigo_ruta}
      />

      {/* Passenger Manifest Modal */}
      <PassengerListModal
        isOpen={isPassengerModalOpen}
        onClose={() => setIsPassengerModalOpen(false)}
        routeName={activeRoute.nombre_ruta}
      />
    </div>
  );
};

export default ActiveRoutePage;
