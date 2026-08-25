import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Truck,
  MapPin,
  Calendar,
  Clock,
  ChevronRight,
  Users,
  Wrench,
  Settings,
  Plus,
  Edit2,
  Trash2,
  BarChart3,
  X,
  History,
  Info
} from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL } from '../../config/api';
import { cn } from '../../utils/cn';
import StatsCard from './components/StatsCard';
import QuickActionCard from './components/QuickActionCard';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from 'react-i18next';

// Mapping helper for activity actions
const getActivityMeta = (modulo, tipo_accion) => {
  let icon = History;
  let color = 'text-primary';
  let bg = 'bg-primary/10';

  if (modulo === 'Vehículos') {
    icon = Truck;
    color = 'text-blue-500';
    bg = 'bg-blue-500/10';
  } else if (modulo === 'Conductores') {
    icon = Users;
    color = 'text-teal-500';
    bg = 'bg-teal-500/10';
  } else if (modulo === 'Rutas') {
    icon = MapPin;
    color = 'text-purple-500';
    bg = 'bg-purple-500/10';
  } else if (modulo === 'Mantenimientos') {
    icon = Wrench;
    color = 'text-amber-500';
    bg = 'bg-amber-500/10';
  } else if (modulo === 'Usuarios') {
    icon = Users;
    color = 'text-pink-500';
    bg = 'bg-pink-500/10';
  } else if (modulo === 'Configuración') {
    icon = Settings;
    color = 'text-indigo-500';
    bg = 'bg-indigo-500/10';
  } else if (modulo === 'Reportes') {
    icon = BarChart3;
    color = 'text-emerald-500';
    bg = 'bg-emerald-500/10';
  }

  // Override icons slightly based on action
  if (tipo_accion === 'ELIMINAR') {
    color = 'text-red-500';
    bg = 'bg-red-500/10';
  }

  return { icon, color, bg };
};

// Helper to format date cleanly
const formatFriendlyDate = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('es-CO', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
};

// Helper for relative time (e.g. "Hace 10 minutos")
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

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  // Dynamic counts & trends state
  const [statsData, setStatsData] = useState({
    vehicles: { value: 0, trend: 'up', trendValue: null },
    drivers: { value: 0, trend: 'up', trendValue: null },
    routes: { value: 0, trend: 'up', trendValue: null },
    maintenances: { value: 0, trend: 'up', trendValue: null }
  });

  // Recent activities list
  const [activities, setActivities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Drawer modal state for viewing all activities
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const [statsRes, activitiesRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/dashboard/stats`),
        axios.get(`${API_BASE_URL}/api/activities`)
      ]);

      if (statsRes.data) {
        setStatsData(statsRes.data);
      }
      if (activitiesRes.data) {
        setActivities(activitiesRes.data);
      }
    } catch (error) {
      console.error('Error fetching dashboard real data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Group activities by date helper
  const getGroupedActivities = () => {
    const groups = {};
    activities.forEach(act => {
      const dateKey = formatFriendlyDate(act.fecha_hora);
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(act);
    });
    return groups;
  };

  const groupedActivities = getGroupedActivities();

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header Section */}
      <section className="relative overflow-hidden rounded-3xl p-5 sm:p-8 bg-v-dark-soft border border-v-dark-border">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 blur-[100px] -mr-32 -mt-32" />
        <div className="relative z-10 text-left">
          <motion.h2
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-2xl sm:text-3xl font-bold text-v-white mb-2"
          >
            {t('dashboard.welcome')} {user?.name?.split(' ')[0] || 'Admin'}
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="text-v-gray max-w-xl text-sm"
          >
            {t('dashboard.subtitle')}
          </motion.p>
        </div>
      </section>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title={t('dashboard.stats.totalVehicles')}
          value={isLoading ? '...' : statsData.vehicles.value}
          icon={Truck}
          trend={statsData.vehicles.trend}
          trendValue={statsData.vehicles.trendValue}
          delay={0.1}
        />
        <StatsCard
          title={t('dashboard.stats.activeDrivers')}
          value={isLoading ? '...' : statsData.drivers.value}
          icon={Users}
          trend={statsData.drivers.trend}
          trendValue={statsData.drivers.trendValue}
          delay={0.2}
        />
        <StatsCard
          title={t('dashboard.stats.routesToday')}
          value={isLoading ? '...' : statsData.routes.value}
          icon={MapPin}
          trend={statsData.routes.trend}
          trendValue={statsData.routes.trendValue}
          delay={0.3}
        />
        <StatsCard
          title={t('dashboard.stats.activeMaintenance')}
          value={isLoading ? '...' : statsData.maintenances.value}
          icon={Wrench}
          trend={statsData.maintenances.trend}
          trendValue={statsData.maintenances.trendValue}
          delay={0.4}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Activity Section */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center px-2">
            <h3 className="text-xl font-bold text-v-white">{t('dashboard.recentActivity.title')}</h3>
            <button
              onClick={() => setIsDrawerOpen(true)}
              className="text-sm text-primary hover:underline font-medium cursor-pointer"
            >
              {t('dashboard.recentActivity.viewAll')}
            </button>
          </div>
          <div className="bg-v-dark-soft border border-v-dark-border rounded-2xl overflow-hidden text-left">
            {isLoading ? (
              <div className="p-8 text-center text-v-gray">
                <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                Cargando actividad...
              </div>
            ) : activities.length === 0 ? (
              <div className="p-8 text-center text-v-gray flex flex-col items-center gap-2">
                <Info size={24} className="text-v-gray" />
                <span>No se registran actividades recientes en el sistema.</span>
              </div>
            ) : (
              <div className="divide-y divide-v-dark-border">
                {activities.slice(0, 4).map((activity, idx) => {
                  const meta = getActivityMeta(activity.modulo, activity.tipo_accion);
                  const Icon = meta.icon;
                  return (
                    <motion.div
                      key={activity.id_actividad}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.05 * idx }}
                      className="p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-v-dark-border/20 transition-colors cursor-pointer group"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className={cn("h-10 w-10 sm:h-12 sm:w-12 rounded-xl flex items-center justify-center shrink-0", meta.bg, meta.color)}>
                          <Icon size={20} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-v-white truncate">{activity.descripcion}</p>
                          <p className="text-xs text-v-gray truncate">
                            Por {activity.nombres_usuario || 'Sistema'} • {getRelativeTime(activity.fecha_hora)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0">
                        <span className={cn("text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider border", meta.bg, meta.color)}>
                          {activity.tipo_accion}
                        </span>
                        <ChevronRight size={18} className="text-v-dark-border group-hover:text-v-white transition-colors" />
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-v-white px-2 text-left">{t('dashboard.quickActions.title')}</h3>
          <div className="grid grid-cols-1 gap-4">
            <QuickActionCard
              title={t('dashboard.quickActions.registerVehicle')}
              description={t('dashboard.quickActions.registerVehicleDesc')}
              icon={Truck}
              onClick={() => navigate('/vehicles?action=new')}
              delay={0.5}
            />
            <QuickActionCard
              title={t('dashboard.quickActions.registerDriver')}
              description={t('dashboard.quickActions.registerDriverDesc')}
              icon={Users}
              onClick={() => navigate('/drivers?action=new')}
              delay={0.6}
            />
            <QuickActionCard
              title={t('dashboard.quickActions.programRoute')}
              description={t('dashboard.quickActions.programRouteDesc')}
              icon={MapPin}
              onClick={() => navigate('/routes')}
              delay={0.7}
            />
            <QuickActionCard
              title={t('dashboard.quickActions.maintenanceAlert')}
              description={t('dashboard.quickActions.maintenanceAlertDesc')}
              icon={Wrench}
              onClick={() => navigate('/maintenance?action=new')}
              delay={0.8}
            />
          </div>
        </div>
      </div>

      {/* STUNNING PREMIUM LATERAL DRAWER FOR VIEWING ALL ACTIVITIES */}
      <AnimatePresence>
        {isDrawerOpen && (
          <div className="fixed inset-0 z-50 overflow-hidden">
            {/* Backdrop overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDrawerOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />

            {/* Slide-out Drawer Panel */}
            <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 220 }}
                className="w-full max-w-full sm:max-w-lg bg-v-dark-soft border-l border-v-dark-border shadow-2xl flex flex-col"
              >
                {/* Drawer Header */}
                <div className="px-6 py-5 border-b border-v-dark-border bg-v-dark/20 flex items-center justify-between">
                  <div className="flex items-center gap-2.5 text-left">
                    <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                      <History size={18} />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-v-white">Historial de Actividad</h3>
                      <p className="text-xs text-v-gray mt-0.5">Bitácora completa y persistente del sistema.</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsDrawerOpen(false)}
                    className="p-2 text-v-gray hover:text-v-white hover:bg-v-dark-border/40 rounded-lg transition-colors cursor-pointer"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Drawer Content Body with Scroll */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar text-left">
                  {Object.keys(groupedActivities).length === 0 ? (
                    <div className="h-64 flex flex-col items-center justify-center text-center text-v-gray gap-2">
                      <Info size={36} className="text-v-gray" />
                      <p className="text-sm font-semibold">Sin registros de auditoría</p>
                      <p className="text-xs max-w-xs text-v-gray">Los eventos importantes que se ejecuten en la plataforma aparecerán organizados cronológicamente aquí.</p>
                    </div>
                  ) : (
                    Object.entries(groupedActivities).map(([dateLabel, groupList]) => (
                      <div key={dateLabel} className="space-y-3">
                        <div className="sticky top-0 z-10 bg-v-dark-soft/90 backdrop-blur-sm py-1 border-b border-v-dark-border/40 text-xs font-black text-primary uppercase tracking-widest">
                          {dateLabel}
                        </div>
                        <div className="relative border-l-2 border-v-dark-border pl-4 ml-3.5 space-y-4">
                          {groupList.map((act) => {
                            const meta = getActivityMeta(act.modulo, act.tipo_accion);
                            const Icon = meta.icon;
                            const actTime = new Date(act.fecha_hora).toLocaleTimeString('es-CO', {
                              hour: '2-digit',
                              minute: '2-digit'
                            });
                            return (
                              <div key={act.id_actividad} className="relative">
                                {/* Timeline Bullet dot */}
                                <div className={cn("absolute -left-6.25 top-1 h-3.5 w-3.5 rounded-full border border-v-dark-soft flex items-center justify-center ring-4 ring-v-dark-soft", meta.color, meta.bg)}>
                                  <div className="h-1.5 w-1.5 rounded-full bg-current" />
                                </div>
                                <div className="space-y-1">
                                  <span className="text-[10px] text-v-gray font-bold font-mono uppercase">
                                    {actTime} — {act.nombres_usuario || 'Sistema'} — <span className="text-primary font-sans font-bold">{act.modulo}</span>
                                  </span>
                                  <p className="text-sm text-v-white font-medium leading-relaxed ">
                                    {act.descripcion}
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Drawer Footer */}
                <div className="p-4 border-t border-v-dark-border bg-v-dark/10 flex justify-end">
                  <button
                    onClick={() => setIsDrawerOpen(false)}
                    className="px-4 py-2 bg-v-dark border border-v-dark-border hover:bg-v-dark-border rounded-xl text-v-white text-xs font-bold transition-all cursor-pointer"
                  >
                    Cerrar panel
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
