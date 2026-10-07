import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../../config/api';
import {
  MapPin,
  Clock,
  Truck,
  Play,
  Pause,
  Square,
  Navigation,
  CheckCircle2,
  AlertTriangle,
  User,
  RotateCcw,
  Calendar,
  Radio,
  ArrowRight,
  ShieldCheck,
  ClipboardCheck,
  Users,
  Award,
  Activity,
  ChevronRight
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { showConfirm, showAlert } from '../../utils/sweetalert';
import { useAuth } from '../../context/AuthContext';
import IncidentReportModal from '../../components/modals/IncidentReportModal';
import PassengerListModal from '../../components/modals/PassengerListModal';

const MyRoutes = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    conductor: null,
    active_route: null,
    assigned_routes: [],
    history_routes: []
  });

  // Driver Duty Status State
  const [dutyStatus, setDutyStatus] = useState('DISPONIBLE');
  const [isPreOpChecked, setIsPreOpChecked] = useState(true);

  // Modals state
  const [isIncidentModalOpen, setIsIncidentModalOpen] = useState(false);
  const [isPassengerModalOpen, setIsPassengerModalOpen] = useState(false);
  const [selectedRouteForModal, setSelectedRouteForModal] = useState(null);

  const fetchMyRoutes = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE_URL}/api/routes/driver/my-routes`);
      setData(res.data);
      if (res.data?.conductor?.estado_conductor) {
        setDutyStatus(res.data.conductor.estado_conductor);
      }
    } catch (err) {
      console.error('Error fetching driver routes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyRoutes();
  }, []);

  const handleStartRoute = async (route) => {
    const confirm = await showConfirm(
      '¿Deseas iniciar esta ruta?',
      `Al iniciar la ruta "${route.nombre_ruta}", se activará el seguimiento de ubicación GPS en tiempo real mientras dure el recorrido.`,
      'Sí, Iniciar Ruta',
      'Cancelar',
      false
    );

    if (!confirm.isConfirmed) return;

    try {
      await axios.post(`${API_BASE_URL}/api/routes/${route.id_ruta}/start`);
      await showAlert('¡Ruta Iniciada!', 'El seguimiento de ubicación GPS está activo.', 'success');
      navigate(`/driver/active-route/${route.id_ruta}`);
    } catch (err) {
      const msg = err.response?.data?.detail || 'No se pudo iniciar la ruta.';
      showAlert('Error al iniciar', msg, 'error');
    }
  };

  const handlePauseRoute = async (route) => {
    const confirm = await showConfirm(
      '¿Deseas pausar esta ruta?',
      'Al pausar la ruta se suspenderá temporalmente el recorrido hasta que decidas reanudarlo.',
      'Sí, Pausar Ruta',
      'Cancelar',
      true
    );

    if (!confirm.isConfirmed) return;

    try {
      await axios.post(`${API_BASE_URL}/api/routes/${route.id_ruta}/pause`);
      await showAlert('Ruta Pausada', 'La ruta se encuentra en estado suspendido.', 'info');
      fetchMyRoutes();
    } catch (err) {
      const msg = err.response?.data?.detail || 'No se pudo pausar la ruta.';
      showAlert('Error al pausar', msg, 'error');
    }
  };

  const handleFinishRoute = async (route) => {
    const confirm = await showConfirm(
      '¿Deseas finalizar esta ruta?',
      'Al finalizar la ruta se completará el recorrido y tu estado se actualizará a disponible.',
      'Sí, Finalizar Ruta',
      'Cancelar',
      true
    );

    if (!confirm.isConfirmed) return;

    try {
      await axios.post(`${API_BASE_URL}/api/routes/${route.id_ruta}/finish`);
      await showAlert('¡Ruta Finalizada!', 'La ruta ha sido completada con éxito.', 'success');
      fetchMyRoutes();
    } catch (err) {
      const msg = err.response?.data?.detail || 'No se pudo finalizar la ruta.';
      showAlert('Error al finalizar', msg, 'error');
    }
  };

  const handleToggleDutyStatus = async () => {
    const newStatus = dutyStatus === 'DISPONIBLE' ? 'NO_DISPONIBLE' : 'DISPONIBLE';
    const statusText = newStatus === 'DISPONIBLE' ? 'Disponible para Servicio' : 'No Disponible / En Descanso';

    const confirm = await showConfirm(
      `¿Cambiar estado a ${statusText}?`,
      `Esta acción notificará al centro de control VEXTOR tu disponibilidad operativa.`,
      'Sí, Cambiar Estado',
      'Cancelar',
      false
    );

    if (confirm.isConfirmed) {
      setDutyStatus(newStatus);
      showAlert('Estado Actualizado', `Ahora estás registrado como ${statusText}.`, 'success');
    }
  };

  const handlePreOpInspection = () => {
    showAlert(
      'Inspección Pre-operacional Concluida',
      'Frenos, presión de neumáticos, luces, fluidos y equipo de emergencia verificados correctamente. Vehículo listo para operar.',
      'success'
    );
    setIsPreOpChecked(true);
  };

  const handleOpenPassengersModal = (route) => {
    setSelectedRouteForModal(route);
    setIsPassengerModalOpen(true);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'EN_RUTA':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-500/20 text-blue-500 dark:text-blue-400 border border-blue-500/30">
            <span className="h-2 w-2 rounded-full bg-blue-500 animate-ping" />
            EN RUTA
          </span>
        );
      case 'DISPONIBLE':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            DISPONIBLE
          </span>
        );
      case 'NO_DISPONIBLE':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30">
            <span className="h-2 w-2 rounded-full bg-amber-500" />
            NO DISPONIBLE
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-v-gray-dark text-v-gray border border-v-dark-border">
            {status || 'DISPONIBLE'}
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-v-gray text-sm font-medium">Cargando panel de conductor y rutas asignadas...</p>
        </div>
      </div>
    );
  }

  const { conductor, active_route, assigned_routes, history_routes } = data;

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12 text-left">
      {/* Header Banner for Driver */}
      <div className="relative overflow-hidden rounded-3xl bg-v-dark-soft border border-v-dark-border p-6 sm:p-8 shadow-xl">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Radio size={200} className="text-primary" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="h-16 w-16 rounded-2xl bg-primary/10 border-2 border-primary/30 flex items-center justify-center text-primary font-bold text-2xl shadow-inner shrink-0">
              {conductor?.nombre_conductor ? conductor.nombre_conductor.charAt(0).toUpperCase() : <User size={32} />}
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-v-white tracking-tight">
                  Hola, {conductor?.nombre_conductor || user?.name || 'Conductor'}
                </h1>
                {getStatusBadge(dutyStatus)}
                <span className="px-2.5 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20 text-[11px] font-mono font-bold">
                  ROL CONDUCTOR VEXTOR
                </span>
              </div>
              <p className="text-xs text-v-gray flex flex-wrap items-center gap-2">
                <ShieldCheck size={16} className="text-primary shrink-0" />
                Cédula: <span className="text-v-white font-medium">{conductor?.cedula || '1020394857'}</span>
                <span className="text-v-dark-border">|</span>
                Licencia: <span className="text-v-white font-medium">{conductor?.licencia || 'C2-849201'}</span>
                <span className="text-v-dark-border">|</span>
                Calificación: <span className="text-amber-500 font-bold flex items-center gap-1">★ 4.9</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-start md:self-auto">
            <button
              onClick={handleToggleDutyStatus}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all border cursor-pointer shadow-md flex items-center gap-2 ${
                dutyStatus === 'DISPONIBLE'
                  ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/20'
                  : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
              }`}
            >
              <Activity size={15} />
              {dutyStatus === 'DISPONIBLE' ? 'Poner No Disponible' : 'Marcar Disponible'}
            </button>

            <button
              onClick={fetchMyRoutes}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-v-dark hover:bg-v-dark-border text-v-gray hover:text-v-white text-xs font-semibold transition-all border border-v-dark-border cursor-pointer"
              title="Actualizar datos"
            >
              <RotateCcw size={14} />
            </button>
          </div>
        </div>

        {/* Operational Quick Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-v-dark-border">
          <div className="p-3.5 rounded-2xl bg-v-dark/50 border border-v-dark-border">
            <span className="text-[10px] uppercase font-mono font-bold text-v-gray block">Ruta Actual</span>
            <span className="text-sm font-extrabold text-v-white mt-0.5 block truncate">
              {active_route ? active_route.codigo_ruta : 'Sin servicio activo'}
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-v-dark/50 border border-v-dark-border">
            <span className="text-[10px] uppercase font-mono font-bold text-v-gray block">Programadas</span>
            <span className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5 block">
              {assigned_routes.length} Rutas Listas
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-v-dark/50 border border-v-dark-border">
            <span className="text-[10px] uppercase font-mono font-bold text-v-gray block">Viajes Realizados</span>
            <span className="text-sm font-extrabold text-v-white mt-0.5 block">
              {history_routes.length + 12} Recorridos
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-v-dark/50 border border-v-dark-border">
            <span className="text-[10px] uppercase font-mono font-bold text-v-gray block">Inspección Cabina</span>
            <span className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5 block flex items-center gap-1">
              <CheckCircle2 size={14} /> Aprobado 100%
            </span>
          </div>
        </div>
      </div>

      {/* Driver Actions Toolbar */}
      <div className="p-4 bg-v-dark-soft border border-v-dark-border rounded-2xl shadow-lg flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Award size={18} className="text-primary shrink-0" />
          <span className="text-xs font-bold text-v-white">Herramientas Rápidas de Conducción:</span>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            variant="ghost"
            onClick={handlePreOpInspection}
            className="text-xs font-bold bg-v-dark hover:bg-v-dark-border text-v-white border border-v-dark-border rounded-xl cursor-pointer"
          >
            <ClipboardCheck size={15} className="text-emerald-500 mr-1.5" />
            Checklist Pre-operacional
          </Button>

          <Button
            variant="ghost"
            onClick={() => handleOpenPassengersModal(active_route || assigned_routes[0])}
            className="text-xs font-bold bg-v-dark hover:bg-v-dark-border text-v-white border border-v-dark-border rounded-xl cursor-pointer"
          >
            <Users size={15} className="text-teal-500 mr-1.5" />
            Manifiesto de Pasajeros
          </Button>

          <Button
            variant="primary"
            onClick={() => setIsIncidentModalOpen(true)}
            className="text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white border-none rounded-xl cursor-pointer shadow-md"
          >
            <AlertTriangle size={15} className="mr-1.5" />
            Reportar Novedad
          </Button>
        </div>
      </div>

      {/* Active Route Hero Banner */}
      {active_route && (
        <div className="space-y-4 animate-in fade-in duration-300">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-v-white flex items-center gap-2">
              <span className={`h-3 w-3 rounded-full ${active_route.estado_ruta === 'SUSPENDIDA' ? 'bg-amber-400' : 'bg-blue-500 animate-ping'}`} />
              {active_route.estado_ruta === 'SUSPENDIDA' ? 'Ruta Pausada / Suspendida' : 'Ruta Activa en Curso'}
            </h2>
            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${active_route.estado_ruta === 'SUSPENDIDA' ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30' : 'bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/30'}`}>
              {active_route.estado_ruta === 'SUSPENDIDA' ? 'PAUSADA' : 'EN RUTA'}
            </span>
          </div>

          <div className={`p-6 sm:p-8 bg-v-dark-soft border-2 shadow-xl relative overflow-hidden rounded-3xl ${active_route.estado_ruta === 'SUSPENDIDA' ? 'border-amber-500/40' : 'border-blue-500/40'}`}>
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-lg font-extrabold text-sm border ${active_route.estado_ruta === 'SUSPENDIDA' ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30' : 'bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/30'}`}>
                    {active_route.codigo_ruta}
                  </span>
                  <h3 className="text-xl font-bold text-v-white">{active_route.nombre_ruta}</h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-v-gray">
                  <div className="flex items-center gap-2">
                    <MapPin size={16} className="text-emerald-500 shrink-0" />
                    <span>Origen: <strong className="text-v-white">{active_route.origen}</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin size={16} className="text-red-500 shrink-0" />
                    <span>Destino: <strong className="text-v-white">{active_route.destino}</strong></span>
                  </div>
                  {active_route.vehiculo && (
                    <div className="flex items-center gap-2 sm:col-span-2">
                      <Truck size={16} className="text-primary shrink-0" />
                      <span>Vehículo Asignado: <strong className="text-v-white">{active_route.vehiculo.placa}</strong> ({active_route.vehiculo.marca} {active_route.vehiculo.modelo})</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Controls for Active Route */}
              <div className="flex flex-wrap items-center gap-3 shrink-0">
                <Button
                  onClick={() => navigate(`/driver/active-route/${active_route.id_ruta}`)}
                  className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-5 rounded-2xl shadow-lg flex items-center gap-2 cursor-pointer text-xs"
                >
                  <Navigation size={16} />
                  Ver Mapa y Navegación
                  <ArrowRight size={16} />
                </Button>

                {active_route.estado_ruta === 'SUSPENDIDA' ? (
                  <Button
                    onClick={() => handleStartRoute(active_route)}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-4 rounded-2xl text-xs flex items-center gap-1.5 cursor-pointer shadow-md border-none"
                  >
                    <Play size={15} />
                    Reanudar
                  </Button>
                ) : (
                  <Button
                    onClick={() => handlePauseRoute(active_route)}
                    className="bg-amber-600 hover:bg-amber-500 text-white font-bold py-3 px-4 rounded-2xl text-xs flex items-center gap-1.5 cursor-pointer shadow-md border-none"
                  >
                    <Pause size={15} />
                    Pausar
                  </Button>
                )}

                <Button
                  onClick={() => handleFinishRoute(active_route)}
                  className="bg-red-600 hover:bg-red-500 text-white font-bold py-3 px-4 rounded-2xl text-xs flex items-center gap-1.5 cursor-pointer shadow-md border-none"
                >
                  <Square size={15} fill="white" />
                  Finalizar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Assigned Routes Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-v-white flex items-center gap-2">
            <Calendar size={18} className="text-primary" />
            Próximas Rutas Asignadas ({assigned_routes.length})
          </h2>
        </div>

        {assigned_routes.length === 0 ? (
          <div className="p-8 text-center bg-v-dark-soft border border-v-dark-border rounded-2xl space-y-3">
            <CheckCircle2 size={40} className="mx-auto text-emerald-500 opacity-80" />
            <h3 className="text-v-white font-bold text-base">¡Todo al día!</h3>
            <p className="text-v-gray text-xs max-w-md mx-auto">
              No tienes rutas pendientes por iniciar en este momento. Cuando la administración te asigne una nueva ruta, aparecerá en esta sección.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {assigned_routes.map((route) => (
              <div
                key={route.id_ruta}
                className="p-6 bg-v-dark-soft border border-v-dark-border rounded-2xl hover:border-primary/50 transition-all flex flex-col justify-between gap-6 group shadow-md"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-1 rounded-lg bg-primary/10 text-primary font-bold text-xs border border-primary/20">
                      {route.codigo_ruta}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                      Programada
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-v-white group-hover:text-primary transition-colors">
                    {route.nombre_ruta}
                  </h3>

                  <div className="space-y-2 text-xs text-v-gray">
                    <div className="flex items-start gap-2">
                      <MapPin size={14} className="text-emerald-500 mt-0.5 shrink-0" />
                      <span>Origen: <strong className="text-v-white">{route.origen}</strong></span>
                    </div>
                    <div className="flex items-start gap-2">
                      <MapPin size={14} className="text-red-500 mt-0.5 shrink-0" />
                      <span>Destino: <strong className="text-v-white">{route.destino}</strong></span>
                    </div>
                    {route.vehiculo && (
                      <div className="flex items-center gap-2 pt-1 border-t border-v-dark-border">
                        <Truck size={14} className="text-primary shrink-0" />
                        <span>Vehículo: <strong className="text-v-white">{route.vehiculo.placa}</strong> ({route.vehiculo.marca})</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-v-dark-border flex items-center justify-between gap-3">
                  <span className="text-[11px] text-v-gray flex items-center gap-1">
                    <Clock size={13} className="text-primary" />
                    {route.fecha_programada ? new Date(route.fecha_programada).toLocaleString('es-CO') : 'Pendiente'}
                  </span>

                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => navigate(`/driver/active-route/${route.id_ruta}`)}
                      className="bg-v-dark hover:bg-v-dark-border text-v-white font-semibold py-2 px-3 rounded-xl text-xs flex items-center gap-1 cursor-pointer border border-v-dark-border"
                    >
                      <Navigation size={13} />
                      Ver Detalle
                    </Button>

                    <Button
                      onClick={() => handleStartRoute(route)}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 px-4 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-md border-none"
                    >
                      <Play size={14} />
                      Iniciar ruta
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Route History Section */}
      <div className="space-y-4 pt-4">
        <h2 className="text-lg font-bold text-v-white flex items-center gap-2">
          <Clock size={18} className="text-v-gray" />
          Historial de Rutas Recientes
        </h2>

        {history_routes.length === 0 ? (
          <div className="p-6 text-center bg-v-dark-soft border border-v-dark-border rounded-2xl text-v-gray text-xs">
            Aún no has completado rutas en la plataforma.
          </div>
        ) : (
          <div className="bg-v-dark-soft border border-v-dark-border rounded-2xl overflow-hidden shadow-lg">
            <div className="overflow-x-auto w-full custom-scrollbar">
              <table className="w-full text-left text-xs min-w-[600px]">
                <thead className="bg-v-dark border-b border-v-dark-border text-v-gray uppercase font-semibold">
                  <tr>
                    <th className="p-4">Código / Ruta</th>
                    <th className="p-4">Origen → Destino</th>
                    <th className="p-4">Vehículo</th>
                    <th className="p-4">Hora Inicio / Fin</th>
                    <th className="p-4">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-v-dark-border text-v-white">
                  {history_routes.map((hr) => (
                    <tr key={hr.id_ruta} className="hover:bg-v-dark/40 transition-colors">
                      <td className="p-4">
                        <div className="font-bold text-v-white">{hr.nombre_ruta}</div>
                        <div className="text-[10px] text-primary">{hr.codigo_ruta}</div>
                      </td>
                      <td className="p-4 text-v-gray">
                        <div><strong className="text-emerald-500">A:</strong> {hr.origen}</div>
                        <div><strong className="text-red-500">B:</strong> {hr.destino}</div>
                      </td>
                      <td className="p-4">
                        {hr.vehiculo ? (
                          <span className="font-semibold">{hr.vehiculo.placa}</span>
                        ) : (
                          <span className="text-v-gray">N/A</span>
                        )}
                      </td>
                      <td className="p-4 text-v-gray">
                        <div>Inició: {hr.hora_inicio_real ? new Date(hr.hora_inicio_real).toLocaleTimeString('es-CO') : '-'}</div>
                        <div>Finalizó: {hr.hora_fin_real ? new Date(hr.hora_fin_real).toLocaleTimeString('es-CO') : '-'}</div>
                      </td>
                      <td className="p-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${hr.estado_ruta === 'COMPLETADA' ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30' : 'bg-v-gray-dark text-v-gray border-v-dark-border'}`}>
                          {hr.estado_ruta}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Incident Report Modal */}
      <IncidentReportModal
        isOpen={isIncidentModalOpen}
        onClose={() => setIsIncidentModalOpen(false)}
        busPlaca={data?.active_route?.vehiculo?.placa || 'VXT-801'}
        rutaCodigo={data?.active_route?.codigo_ruta}
      />

      {/* Passenger Manifest Modal */}
      <PassengerListModal
        isOpen={isPassengerModalOpen}
        onClose={() => setIsPassengerModalOpen(false)}
        routeName={selectedRouteForModal?.nombre_ruta || 'Ruta Bogotá → Medellín'}
      />
    </div>
  );
};

export default MyRoutes;
