import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Truck, MapPin, Calendar, Clock, ChevronRight, Users, Wrench } from 'lucide-react';
import { cn } from '../../utils/cn';
import StatsCard from '../../components/dashboard/StatsCard';
import QuickActionCard from '../../components/dashboard/QuickActionCard';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { vehicleService } from '../../services/vehicleService';
import { driverService } from '../../services/driverService';
import { maintenanceService } from '../../services/maintenanceService';
import { routeService } from '../../services/routeService';

const recentActivity = [
  { id: 1, type: 'route', title: 'Ruta Escolar Norte', user: 'Juan Pérez', status: 'Completada', time: 'hace 15 min', icon: MapPin, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  { id: 2, type: 'vehicle', title: 'Registro de Vehículo ABC-123', user: 'Admin', status: 'Exitoso', time: 'hace 2 horas', icon: Truck, color: 'text-blue-500', bg: 'bg-blue-500/10' },
  { id: 3, type: 'maintenance', title: 'Cambio de aceite - V-102', user: 'Carlos Ruiz', status: 'Programado', time: 'hace 5 horas', icon: Calendar, color: 'text-amber-500', bg: 'bg-amber-500/10' },
  { id: 4, type: 'alert', title: 'Retraso en Ruta Sur', user: 'Sistema', status: 'Crítico', time: 'hace 6 horas', icon: Clock, color: 'text-red-500', bg: 'bg-red-500/10' },
];

/**
 * Dashboard Page
 *
 * Responsabilidad:
 * Vista principal de control operativo para gerentes de flota.
 */
const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  // Dynamic counts state
  const [stats, setStats] = useState({
    activeVehicles: '0',
    driversCount: '0',
    routesCount: '0',
    maintenanceCount: '0'
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        const vehicles = await vehicleService.getVehicles();
        const drivers = await driverService.getDrivers();
        const routes = await routeService.getRoutes();
        const maintenances = await maintenanceService.getMaintenances();

        // Calculate active vehicles (excluding INACTIVO)
        const activeVeh = vehicles.filter(v => v.estado_vehiculo !== 'INACTIVO').length;

        setStats({
          activeVehicles: activeVeh.toString(),
          driversCount: drivers.length.toString(),
          routesCount: routes.length.toString(),
          maintenanceCount: maintenances.length.toString()
        });
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardStats();
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header Section */}
      <section className="relative overflow-hidden rounded-3xl p-8 bg-v-dark-soft border border-v-dark-border">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 blur-[100px] -mr-32 -mt-32" />
        <div className="relative z-10">
          <motion.h2
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-3xl font-bold text-v-white mb-2"
          >
            {t('dashboard.welcome')} {user?.name?.split(' ')[0] || 'Admin'}
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="text-v-gray max-w-xl"
          >
            {t('dashboard.subtitle')}
          </motion.p>
        </div>
      </section>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title={t('dashboard.stats.totalVehicles')}
          value={isLoading ? '...' : stats.activeVehicles}
          icon={Truck}
          trend="up"
          trendValue={12}
          delay={0.1}
        />
        <StatsCard
          title={t('dashboard.stats.activeDrivers')}
          value={isLoading ? '...' : stats.driversCount}
          icon={Users}
          trend="up"
          trendValue={5}
          delay={0.2}
        />
        <StatsCard
          title={t('dashboard.stats.routesToday')}
          value={isLoading ? '...' : stats.routesCount}
          icon={MapPin}
          trend="down"
          trendValue={2}
          delay={0.3}
        />
        <StatsCard
          title={t('dashboard.stats.activeMaintenance')}
          value={isLoading ? '...' : stats.maintenanceCount}
          icon={Wrench}
          trend="up"
          trendValue={1}
          delay={0.4}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Activity Table */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center px-2">
            <h3 className="text-xl font-bold text-v-white">{t('dashboard.recentActivity.title')}</h3>
            <button className="text-sm text-primary hover:underline font-medium">
              {t('dashboard.recentActivity.viewAll')}
            </button>
          </div>
          <div className="bg-v-dark-soft border border-v-dark-border rounded-2xl overflow-hidden">
            <div className="divide-y divide-v-dark-border">
              {recentActivity.map((activity, idx) => (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * idx }}
                  className="p-4 flex items-center gap-4 hover:bg-v-dark-border/20 transition-colors cursor-pointer group"
                >
                  <div className={cn("h-12 w-12 rounded-xl flex items-center justify-center shrink-0", activity.bg, activity.color)}>
                    <activity.icon size={22} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-v-white truncate">{activity.title}</p>
                    <p className="text-xs text-v-gray truncate">Iniciado por {activity.user} • {activity.time}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className={cn("text-[11px] font-bold px-2 py-1 rounded-full uppercase tracking-wider", activity.bg, activity.color)}>
                      {activity.status}
                    </span>
                  </div>
                  <ChevronRight size={18} className="text-v-dark-border group-hover:text-v-white transition-colors" />
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-v-white px-2">{t('dashboard.quickActions.title')}</h3>
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
    </div>
  );
};

export default Dashboard;
