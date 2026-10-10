import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Truck,
  MapPin,
  Clock,
  ChevronRight,
  Users,
  Wrench,
  Settings,
  BarChart3,
  X,
  History,
  Info,
  AlertCircle,
  RotateCw,
  Activity,
  ShieldCheck,
  Radio,
  Zap
} from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL } from '../../config/api';
import { cn } from '../../utils/cn';
import StatsCard from './components/StatsCard';
import QuickActionCard from './components/QuickActionCard';
import { Badge } from '../../components/ui/Badge';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from 'react-i18next';

// Helper for relative time (e.g. "Hace 10 minutos")
const formatDescriptionText = (text) => {
  if (!text) return '';
  const uuidRegex = /[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/g;
  return text.replace(uuidRegex, (match) => `#${match.slice(0, 8).toUpperCase()}`);
};

const getRelativeTime = (dateStr) => {
  if (!dateStr) return '';
  const now = new Date();
  const past = new Date(dateStr);
  const diffMs = now - past;
  const diffMins = Math.floor(diffMs / 1000 / 60);

  if (diffMins < 1) return 'Hace un momento';
  if (diffMins < 60) return `Hace ${diffMins} min`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `Hace ${diffHours} ${diffHours === 1 ? 'hora' : 'horas'}`;

  const diffDays = Math.floor(diffHours / 24);
  return `Hace ${diffDays} ${diffDays === 1 ? 'día' : 'días'}`;
};

// Helper for formatted friendly date
const formatFriendlyDate = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('es-CO', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
};

const getActivityMeta = (modulo, tipo_accion) => {
  let icon = History;
  let color = 'text-primary';
  let bg = 'bg-primary/10';

  if (modulo === 'Vehículos') {
    icon = Truck;
    color = 'text-blue-400';
    bg = 'bg-blue-500/10';
  } else if (modulo === 'Conductores') {
    icon = Users;
    color = 'text-teal-400';
    bg = 'bg-teal-500/10';
  } else if (modulo === 'Rutas') {
    icon = MapPin;
    color = 'text-purple-400';
    bg = 'bg-purple-500/10';
  } else if (modulo === 'Mantenimientos' || modulo === 'Mantenimiento') {
    icon = Wrench;
    color = 'text-amber-400';
    bg = 'bg-amber-500/10';
  } else if (modulo === 'Usuarios') {
    icon = Users;
    color = 'text-pink-400';
    bg = 'bg-pink-500/10';
  } else if (modulo === 'Configuración') {
    icon = Settings;
    color = 'text-indigo-400';
    bg = 'bg-indigo-500/10';
  } else if (modulo === 'Reportes') {
    icon = BarChart3;
    color = 'text-emerald-400';
    bg = 'bg-emerald-500/10';
  }

  if (tipo_accion === 'ELIMINAR' || tipo_accion === 'ELIMINACION') {
    color = 'text-red-400';
    bg = 'bg-red-500/10';
  }

  return { icon, color, bg };
};

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  // Dynamic counts & trends state
  const [statsData, setStatsData] = useState({
    vehicles: { value: 0, trend: 'up', trendValue: null },
    drivers: { value: 0, trend: 'up', trendValue: null },
    routes: { value: 0, trend: 'up', trendValue: null },
    maintenances: { value: 0, trend: 'up', trendValue: null },
    users: { value: 0, trend: 'up', trendValue: null }
  });

  const [activities, setActivities] = useState([]);
  const [vehiclesList, setVehiclesList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    setIsError(false);
    setErrorMessage('');

    try {
      const [statsRes, activitiesRes, vehiclesRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/dashboard/stats`),
        axios.get(`${API_BASE_URL}/api/activities`),
        axios.get(`${API_BASE_URL}/api/vehicles`).catch(() => ({ data: [] }))
      ]);

      if (statsRes.data) setStatsData(statsRes.data);
      if (activitiesRes.data) setActivities(activitiesRes.data);
      if (vehiclesRes.data) setVehiclesList(vehiclesRes.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setIsError(true);
      setErrorMessage(
        error.response?.data?.detail || 'No se pudo conectar con el servidor de control VEXTOR.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Calculate Fleet Operational Breakdown
  const totalVehiclesCount = vehiclesList.length || statsData.vehicles.value || 1;
  const availableVehicles = vehiclesList.filter(v => v.estado_vehiculo === 'DISPONIBLE').length;
  const onRouteVehicles = vehiclesList.filter(v => v.estado_vehiculo === 'EN_RUTA').length;
  const maintenanceVehicles = vehiclesList.filter(v => v.estado_vehiculo === 'MANTENIMIENTO').length;
  const inactiveVehicles = vehiclesList.filter(v => v.estado_vehiculo === 'INACTIVO').length;

  const getGroupedActivities = () => {
    const groups = {};
    activities.forEach(act => {
      const dateKey = formatFriendlyDate(act.fecha_hora);
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(act);
    });
    return groups;
  };

  const groupedActivities = getGroupedActivities();

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* CONTROL CENTER COMMAND HEADER */}
      <section className="relative overflow-hidden rounded-3xl p-6 sm:p-8 bg-v-dark-soft border border-v-dark-border shadow-2xl text-left">
        <div className="absolute top-0 right-0 w-80 h-80 bg-primary/10 rounded-full blur-[100px] pointer-events-none -mr-32 -mt-32" />

        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-3 flex-wrap">
              <Badge variant="success" pulse size="sm">
                Centro de Control Activo
              </Badge>
              <span className="text-xs text-v-gray font-mono font-medium flex items-center gap-1.5">
                <Radio size={14} className="text-primary animate-pulse" /> Monitoreo Continuo
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold text-v-white tracking-tight">
              {t('dashboard.welcome', 'Panel de Monitoreo General')} — {user?.name?.split(' ')[0] || 'Administrador'}
            </h2>

            <p className="text-v-gray text-xs sm:text-sm leading-relaxed font-normal">
              Supervisión de flota vehicular, asignación de rutas y estado de conductores en tiempo real para optimización logística.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto shrink-0">
            <button
              onClick={fetchDashboardData}
              className="px-4 py-2.5 bg-v-dark border border-v-dark-border hover:border-primary/40 rounded-xl text-xs font-bold text-v-white flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm active:scale-95"
            >
              <RotateCw size={14} className={isLoading ? "animate-spin text-primary" : "text-v-gray"} />
              Sincronizar Datos
            </button>
            <button
              onClick={() => navigate('/routes')}
              className="px-5 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(16,185,129,0.25)] active:scale-95 cursor-pointer"
            >
              <Activity size={16} /> Mapa de Rastreo
            </button>
          </div>
        </div>
      </section>

      {/* ERROR BANNER */}
      {isError && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-5 rounded-2xl bg-red-500/10 border border-red-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-left"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-red-500/20 text-red-400 shrink-0">
              <AlertCircle size={22} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-red-200">Error de comunicación con el Backend</h4>
              <p className="text-xs text-red-300/80 mt-0.5">{errorMessage}</p>
            </div>
          </div>
          <button
            onClick={fetchDashboardData}
            className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 rounded-xl text-xs font-bold text-red-200 flex items-center gap-2 cursor-pointer transition-colors shrink-0"
          >
            <RotateCw size={14} /> Reintentar
          </button>
        </motion.div>
      )}

      {/* CORE KPI GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatsCard
          title="Flota Vehicular"
          value={isLoading ? '...' : isError ? 'N/A' : statsData.vehicles.value}
          subtitle="Unidades registradas en plataforma"
          icon={Truck}
          trend={statsData.vehicles.trend}
          trendValue={statsData.vehicles.trendValue}
          variant="blue"
          delay={0.1}
        />
        <StatsCard
          title="Conductores"
          value={isLoading ? '...' : isError ? 'N/A' : statsData.drivers.value}
          subtitle="Conductores vinculados"
          icon={Users}
          trend={statsData.drivers.trend}
          trendValue={statsData.drivers.trendValue}
          variant="emerald"
          delay={0.15}
        />
        <StatsCard
          title="Rutas en Progreso"
          value={isLoading ? '...' : isError ? 'N/A' : statsData.routes.value}
          subtitle="Servicios de transporte activos"
          icon={MapPin}
          trend={statsData.routes.trend}
          trendValue={statsData.routes.trendValue}
          variant="purple"
          delay={0.2}
        />
        <StatsCard
          title="Mantenimientos"
          value={isLoading ? '...' : isError ? 'N/A' : statsData.maintenances.value}
          subtitle="Alertas y servicios pendientes"
          icon={Wrench}
          trend={statsData.maintenances.trend}
          trendValue={statsData.maintenances.trendValue}
          variant="amber"
          delay={0.25}
        />
      </div>

      {/* FLEET HEALTH & DISTRIBUTION BAR */}
      {vehiclesList.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-v-dark-soft border border-v-dark-border p-6 rounded-2xl shadow-lg text-left space-y-4"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-base font-extrabold text-v-white">Estado de Salud Operativa de Flota</h3>
              <p className="text-xs text-v-gray mt-0.5">Distribución porcentual de unidades por estado operativo actual.</p>
            </div>
            <div className="flex items-center gap-3 text-xs font-mono font-bold">
              <span className="text-v-white">{vehiclesList.length} Unidades Totales</span>
            </div>
          </div>

          {/* Multi-segmented Distribution Bar */}
          <div className="h-3 w-full bg-v-dark rounded-full overflow-hidden flex gap-0.5 border border-v-dark-border p-0.5">
            <div
              style={{ width: `${Math.max((availableVehicles / totalVehiclesCount) * 100, 2)}%` }}
              className="h-full bg-emerald-500 rounded-l-full transition-all duration-500"
              title={`Disponibles: ${availableVehicles}`}
            />
            <div
              style={{ width: `${Math.max((onRouteVehicles / totalVehiclesCount) * 100, 2)}%` }}
              className="h-full bg-blue-500 transition-all duration-500"
              title={`En Ruta: ${onRouteVehicles}`}
            />
            <div
              style={{ width: `${Math.max((maintenanceVehicles / totalVehiclesCount) * 100, 2)}%` }}
              className="h-full bg-amber-500 transition-all duration-500"
              title={`Mantenimiento: ${maintenanceVehicles}`}
            />
            <div
              style={{ width: `${Math.max((inactiveVehicles / totalVehiclesCount) * 100, 2)}%` }}
              className="h-full bg-red-500 rounded-r-full transition-all duration-500"
              title={`Inactivos: ${inactiveVehicles}`}
            />
          </div>

          {/* Legend Chips */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
            <div className="flex items-center gap-2 p-2 rounded-xl bg-v-dark/50 border border-v-dark-border">
              <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 shrink-0" />
              <div className="min-w-0 text-left">
                <span className="text-[10px] text-v-gray font-bold uppercase block font-mono">Disponibles</span>
                <span className="text-sm font-black text-v-white">{availableVehicles}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 p-2 rounded-xl bg-v-dark/50 border border-v-dark-border">
              <div className="h-2.5 w-2.5 rounded-full bg-blue-500 shrink-0" />
              <div className="min-w-0 text-left">
                <span className="text-[10px] text-v-gray font-bold uppercase block font-mono">En Ruta</span>
                <span className="text-sm font-black text-v-white">{onRouteVehicles}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 p-2 rounded-xl bg-v-dark/50 border border-v-dark-border">
              <div className="h-2.5 w-2.5 rounded-full bg-amber-500 shrink-0" />
              <div className="min-w-0 text-left">
                <span className="text-[10px] text-v-gray font-bold uppercase block font-mono">Mantenimiento</span>
                <span className="text-sm font-black text-v-white">{maintenanceVehicles}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 p-2 rounded-xl bg-v-dark/50 border border-v-dark-border">
              <div className="h-2.5 w-2.5 rounded-full bg-red-500 shrink-0" />
              <div className="min-w-0 text-left">
                <span className="text-[10px] text-v-gray font-bold uppercase block font-mono">Inactivos</span>
                <span className="text-sm font-black text-v-white">{inactiveVehicles}</span>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* MAIN TWO COLUMN SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* RECENT AUDIT ACTIVITY TIMELINE */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2 text-left">
              <h3 className="text-lg font-bold text-v-white">Bitácora de Eventos Recientes</h3>
              <Badge variant="primary" size="xs">Auditoría</Badge>
            </div>
            <button
              onClick={() => setIsDrawerOpen(true)}
              className="text-xs text-primary hover:underline font-bold cursor-pointer flex items-center gap-1"
            >
              Ver Bitácora Completa <ChevronRight size={14} />
            </button>
          </div>

          <div className="bg-v-dark-soft border border-v-dark-border rounded-2xl overflow-hidden shadow-lg text-left">
            {isLoading ? (
              <div className="p-8 text-center text-v-gray">
                <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                Cargando historial operativo...
              </div>
            ) : isError ? (
              <div className="p-8 text-center text-red-400 flex flex-col items-center gap-2">
                <AlertCircle size={24} />
                <span className="text-xs font-semibold">No se pudo recuperar la auditoría.</span>
              </div>
            ) : activities.length === 0 ? (
              <div className="p-8 text-center text-v-gray flex flex-col items-center gap-2">
                <Info size={24} className="text-v-gray" />
                <span className="text-sm font-medium">No existen eventos registrados recientemente.</span>
              </div>
            ) : (
              <div className="divide-y divide-v-dark-border/80">
                {activities.slice(0, 5).map((activity, idx) => {
                  const meta = getActivityMeta(activity.modulo, activity.tipo_accion);
                  const Icon = meta.icon;
                  return (
                    <motion.div
                      key={activity.id_actividad}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.05 * idx }}
                      className="p-4 flex items-center justify-between gap-4 hover:bg-v-dark-border/30 transition-all cursor-pointer group"
                      onClick={() => setIsDrawerOpen(true)}
                    >
                      <div className="flex items-center gap-3.5 min-w-0 flex-1">
                        <div className={cn("h-11 w-11 rounded-2xl flex items-center justify-center shrink-0 border border-v-dark-border", meta.bg, meta.color)}>
                          <Icon size={20} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-v-white truncate group-hover:text-primary transition-colors">
                            {formatDescriptionText(activity.descripcion)}
                          </p>
                          <p className="text-xs text-v-gray truncate mt-0.5">
                            Por <strong className="text-v-white font-medium">{activity.nombres_usuario || 'Sistema'}</strong> • {getRelativeTime(activity.fecha_hora)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <Badge variant="neutral" size="xs" className="font-mono text-[9px]">
                          {activity.modulo}
                        </Badge>
                        <ChevronRight size={18} className="text-v-dark-border group-hover:text-v-white transition-colors" />
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* QUICK ACTIONS COMMAND CENTER */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1 text-left">
            <h3 className="text-lg font-bold text-v-white">Acciones Rápidas</h3>
            <Badge variant="neutral" size="xs">Operatividad</Badge>
          </div>

          <div className="grid grid-cols-1 gap-3.5">
            <QuickActionCard
              title="Registrar Nuevo Vehículo"
              description="Alta de unidad vehicular en la flota."
              icon={Truck}
              onClick={() => navigate('/vehicles?action=new')}
              delay={0.35}
            />
            <QuickActionCard
              title="Vincular Conductor"
              description="Registrar y asignar credenciales de conductor."
              icon={Users}
              onClick={() => navigate('/drivers?action=new')}
              delay={0.4}
            />
            <QuickActionCard
              title="Programar Servicio de Ruta"
              description="Definir origen, destino y asignaciones."
              icon={MapPin}
              onClick={() => navigate('/routes')}
              delay={0.45}
            />
            <QuickActionCard
              title="Agendar Mantenimiento"
              description="Programar revisión técnica u orden de taller."
              icon={Wrench}
              onClick={() => navigate('/maintenance?action=new')}
              delay={0.5}
            />
          </div>
        </div>
      </div>

      {/* DRAWER FOR FULL AUDIT TIMELINE */}
      <AnimatePresence>
        {isDrawerOpen && (
          <div className="fixed inset-0 z-50 overflow-hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDrawerOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />

            <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 220 }}
                className="w-full max-w-full sm:max-w-lg bg-v-dark-soft border-l border-v-dark-border shadow-2xl flex flex-col"
              >
                <div className="px-6 py-5 border-b border-v-dark-border bg-v-dark/20 flex items-center justify-between">
                  <div className="flex items-center gap-3 text-left">
                    <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-md">
                      <History size={18} />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-v-white">Bitácora Completa de Operaciones</h3>
                      <p className="text-xs text-v-gray mt-0.5">Historial de auditoría inmutable en el sistema.</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsDrawerOpen(false)}
                    className="p-2 text-v-gray hover:text-v-white hover:bg-v-dark-border/40 rounded-lg transition-colors cursor-pointer"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar text-left">
                  {Object.keys(groupedActivities).length === 0 ? (
                    <div className="h-64 flex flex-col items-center justify-center text-center text-v-gray gap-2">
                      <Info size={36} className="text-v-gray" />
                      <p className="text-sm font-semibold">Sin registros de auditoría</p>
                    </div>
                  ) : (
                    Object.entries(groupedActivities).map(([dateLabel, groupList]) => (
                      <div key={dateLabel} className="space-y-3">
                        <div className="sticky top-0 z-10 bg-v-dark-soft/90 backdrop-blur-sm py-1 border-b border-v-dark-border/40 text-xs font-black text-primary uppercase tracking-widest font-mono">
                          {dateLabel}
                        </div>
                        <div className="relative border-l-2 border-v-dark-border pl-4 ml-3.5 space-y-4">
                          {groupList.map((act) => {
                            const meta = getActivityMeta(act.modulo, act.tipo_accion);
                            const actTime = new Date(act.fecha_hora).toLocaleTimeString('es-CO', {
                              hour: '2-digit',
                              minute: '2-digit'
                            });
                            return (
                              <div key={act.id_actividad} className="relative space-y-1">
                                <div className={cn("absolute -left-6.25 top-1 h-3.5 w-3.5 rounded-full border border-v-dark-soft flex items-center justify-center ring-4 ring-v-dark-soft", meta.color, meta.bg)}>
                                  <div className="h-1.5 w-1.5 rounded-full bg-current" />
                                </div>
                                <div className="flex items-center justify-between gap-2">
                                  <span className="text-[10px] text-v-gray font-mono font-bold uppercase">
                                    {actTime} — {act.nombres_usuario || 'Sistema'}
                                  </span>
                                  <Badge variant="neutral" size="xs">{act.modulo}</Badge>
                                </div>
                                <p className="text-xs text-v-white font-medium leading-relaxed">
                                  {formatDescriptionText(act.descripcion)}
                                </p>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="p-4 border-t border-v-dark-border bg-v-dark/10 flex justify-end">
                  <button
                    onClick={() => setIsDrawerOpen(false)}
                    className="px-4 py-2 bg-v-dark border border-v-dark-border hover:bg-v-dark-border rounded-xl text-v-white text-xs font-bold transition-all cursor-pointer"
                  >
                    Cerrar Panel
                  </button>
                </div>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Dashboard;
