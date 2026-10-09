import { Menu, Activity } from 'lucide-react';
import UserMenu from './UserMenu';
import NotificationButton from './NotificationButton';
import { useLocation } from 'react-router-dom';
import { Logo } from '../ui/Logo';
import { Badge } from '../ui/Badge';
import { ThemeToggle } from '../ui/ThemeToggle';
import { useTranslation } from 'react-i18next';
/**
 * Navbar Component
 *
 * Responsabilidad:
 * Header superior de la plataforma B2B VEXTOR.
 * Muestra el título contextual del módulo,
 * el indicador de conectividad en tiempo real y controles de usuario.
 */
const Navbar = ({ onMenuClick }) => {
  const location = useLocation();
  const { t } = useTranslation();

  const getPageTitle = () => {
    const path = location.pathname;

    if (path.startsWith('/driver/my-routes')) return 'Inicio / Mis Rutas';
    if (path.startsWith('/driver/my-bus')) return 'Mi Bus Asignado';
    if (path.startsWith('/driver/active-route')) return 'Monitoreo de Ruta Activa';
    if (path.startsWith('/driver/notifications')) return 'Notificaciones Conductor';

    if (path.startsWith('/user/home')) return 'Inicio / Portal Usuario';
    if (path.startsWith('/user/buses')) return 'Consulta de Buses';
    if (path.startsWith('/user/routes')) return 'Consulta de Rutas';
    if (path.startsWith('/user/schedules')) return 'Horarios y Frecuencias';
    if (path.startsWith('/user/history')) return 'Historial / Recorridos';
    if (path.startsWith('/user/notifications')) return 'Notificaciones de Usuario';
    if (path.startsWith('/user/profile')) return 'Mi Perfil';

    switch(path) {
      case '/dashboard': return t('sidebar.dashboard', 'Centro de Control');
      case '/users': return 'Gestión de Usuarios';
      case '/recorridos': return 'Gestión de Recorridos';
      case '/vehicles': return t('sidebar.vehicles', 'Gestión de Vehículos');
      case '/drivers': return t('sidebar.drivers', 'Gestión de Conductores');
      case '/routes': return t('sidebar.routes', 'Monitoreo de Rutas');
      case '/maintenance': return t('sidebar.maintenance', 'Control de Mantenimiento');
      case '/reports': return t('sidebar.reports', 'Centro de Reportes');
      case '/settings': return t('sidebar.settings', 'Configuración de Sistema');
      default: return 'VEXTOR Fleet Platform';
    }
  };

  return (
    <header className="h-20 bg-v-dark-soft/80 backdrop-blur-md border-b border-v-dark-border sticky top-0 z-30 px-3.5 sm:px-6 shadow-sm">
      <div className="h-full flex items-center justify-between gap-4">
        {/* Left Section: Mobile Menu + Logo + Page Title */}
        <div className="flex items-center gap-2 sm:gap-4 min-w-0">
          <button
            onClick={onMenuClick}
            className="p-2 rounded-xl hover:bg-v-dark-border/60 text-v-gray hover:text-v-white lg:hidden shrink-0 cursor-pointer transition-colors"
            aria-label="Abrir Menú Navegación"
          >
            <Menu size={22} />
          </button>

          <div className="lg:hidden shrink-0">
            <Logo variant="iso" size="sm" />
          </div>

          <div className="hidden lg:block shrink-0">
            <Logo size="sm" />
          </div>

          <div className="hidden lg:block w-px h-6 bg-v-dark-border mx-1 shrink-0" />

          <div className="min-w-0 flex items-center gap-3">
            <h1 className="text-base sm:text-xl font-extrabold text-v-white truncate tracking-tight">
              {getPageTitle()}
            </h1>
            <div className="hidden xl:block shrink-0">
              <Badge variant="success" size="xs" pulse className="font-mono text-[10px]">
                En Línea
              </Badge>
            </div>
          </div>
        </div>

        {/* Right Section: Theme Toggle + Notifications + User Menu */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          <ThemeToggle />
          <NotificationButton />
          <div className="w-px h-7 bg-v-dark-border mx-1 hidden sm:block" />
          <UserMenu />
        </div>
      </div>
    </header>
  );
};

export default Navbar;
