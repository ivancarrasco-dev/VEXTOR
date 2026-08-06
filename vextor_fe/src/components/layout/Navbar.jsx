import { Search, Menu } from 'lucide-react';
import UserMenu from './UserMenu';
import NotificationButton from './NotificationButton';
import { useLocation } from 'react-router-dom';
import { Logo } from '../ui/Logo';
import { ThemeToggle } from '../ui/ThemeToggle';
import { useTranslation } from 'react-i18next';

/**
 * Navbar Component
 *
 * Responsabilidad:
 * Mostrar la navegación superior y controles globales del panel de control.
 *
 * Utilizado en:
 * * DashboardLayout
 *
 * Funcionalidades:
 * * Branding de la plataforma (Logo) visible en móviles.
 * * Título dinámico basado en la ruta actual.
 * * Buscador global (placeholder).
 * * Notificaciones y Menú de Usuario.
 * * Botón de menú hamburguesa para móviles.
 */
const Navbar = ({ onMenuClick }) => {
  const location = useLocation();
  const { t } = useTranslation();

  const getPageTitle = () => {
    const path = location.pathname;
    switch(path) {
      case '/dashboard': return t('sidebar.dashboard');
      case '/vehicles': return t('sidebar.vehicles');
      case '/drivers': return t('sidebar.drivers');
      case '/routes': return t('sidebar.routes');
      case '/maintenance': return t('sidebar.maintenance');
      case '/reports': return t('sidebar.reports');
      case '/settings': return t('sidebar.settings');
      default: return 'Vextor';
    }
  };

  return (
    <header className="h-20 bg-v-dark/50 backdrop-blur-md border-b border-v-dark-border sticky top-0 z-30 px-6">
      <div className="h-full flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuClick}
            className="p-2 rounded-lg hover:bg-v-dark-border text-v-gray hover:text-v-white lg:hidden"
          >
            <Menu size={20} />
          </button>

          <div className="lg:hidden">
            <Logo variant="iso" size="sm" />
          </div>

          <div className="hidden lg:block">
            <Logo size="sm" />
          </div>

          <div className="hidden lg:block w-px h-6 bg-v-dark-border mx-2" />

          <h1 className="text-xl font-bold text-v-white hidden sm:block">
            {getPageTitle()}
          </h1>
        </div>

        {/* Global Search */}
        <div className="flex-1 max-w-md mx-8 hidden md:block">
          <div className="relative group">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-v-gray group-focus-within:text-primary transition-colors" />
            <input
              type="text"
              placeholder={t('navbar.search')}
              className="w-full bg-v-dark-soft border border-v-dark-border rounded-xl py-2.5 pl-10 pr-4 text-sm text-v-white placeholder:text-v-gray focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          <NotificationButton />
          <div className="w-px h-8 bg-v-dark-border mx-2 hidden sm:block" />
          <UserMenu />
        </div>
      </div>
    </header>
  );
};

export default Navbar;
  