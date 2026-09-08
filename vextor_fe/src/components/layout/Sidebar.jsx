import { useState, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Truck,
  Users,
  MapPin,
  Wrench,
  BarChart3,
  Settings,
  ChevronLeft,
  Menu,
  X,
  LogOut
} from 'lucide-react';
import { Logo } from '../ui/Logo';
import { cn } from '../../utils/cn';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { showConfirm } from '../../utils/sweetalert';

/**
 * Sidebar Component - VEXTOR UI System
 */
const adminMenuGroups = [
  {
    titleKey: 'sidebar.groupOperation',
    titleDefault: 'MONITOREO Y OPERACIÓN',
    items: [
      { path: '/dashboard', labelKey: 'sidebar.dashboard', labelDefault: 'Dashboard', icon: LayoutDashboard },
      { path: '/routes', labelKey: 'sidebar.routes', labelDefault: 'Rutas y Rastreo', icon: MapPin },
    ]
  },
  {
    titleKey: 'sidebar.groupFleet',
    titleDefault: 'GESTIÓN DE FLOTA',
    items: [
      { path: '/vehicles', labelKey: 'sidebar.vehicles', labelDefault: 'Vehículos', icon: Truck },
      { path: '/drivers', labelKey: 'sidebar.drivers', labelDefault: 'Conductores', icon: Users },
      { path: '/maintenance', labelKey: 'sidebar.maintenance', labelDefault: 'Mantenimiento', icon: Wrench },
    ]
  },
  {
    titleKey: 'sidebar.groupAnalytics',
    titleDefault: 'ANALÍTICA Y SISTEMA',
    items: [
      { path: '/reports', labelKey: 'sidebar.reports', labelDefault: 'Reportes', icon: BarChart3 },
      { path: '/settings', labelKey: 'sidebar.settings', labelDefault: 'Configuración', icon: Settings },
    ]
  }
];

const driverMenuGroups = [
  {
    titleKey: 'sidebar.groupOperation',
    titleDefault: 'OPERACIÓN CONDUCTOR',
    items: [
      { path: '/driver/my-routes', labelText: 'Mis Rutas Asignadas', icon: MapPin },
      { path: '/settings', labelText: 'Configuración de Cuenta', icon: Settings },
    ]
  }
];

const Sidebar = ({ isCollapsed, setIsCollapsed, isMobileOpen, setIsMobileOpen }) => {
  const { user, logout } = useAuth();
  const isConductor = user?.role === 'rol-conductor' || user?.role === 'Conductor';
  const menuGroups = isConductor ? driverMenuGroups : adminMenuGroups;
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [width, setWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024);

  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = width < 1024;

  const sidebarVariants = {
    expanded: { width: 260, x: 0 },
    collapsed: { width: 80, x: 0 },
    mobileOpen: { width: 280, x: 0 },
    mobileClosed: { x: -340 }
  };

  const currentVariant = isMobile
    ? (isMobileOpen ? 'mobileOpen' : 'mobileClosed')
    : (isCollapsed ? 'collapsed' : 'expanded');

  return (
    <>
      {/* Mobile Overlay */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar Container */}
      <motion.aside
        initial={false}
        animate={currentVariant}
        variants={sidebarVariants}
        transition={{ type: 'tween', duration: 0.2, ease: 'easeInOut' }}
        className={cn(
          "fixed top-0 left-0 z-50 h-screen bg-v-dark-soft border-r border-v-dark-border max-w-[85vw] lg:max-w-none flex flex-col justify-between select-none shadow-lg",
          isMobile ? "w-72" : (isCollapsed ? "w-20" : "w-65")
        )}
      >
        <div className="flex flex-col h-full overflow-hidden">
          {/* Header & Branding */}
          <div className="h-20 flex flex-col justify-center px-4 border-b border-v-dark-border shrink-0 bg-v-dark/20">
            <div className="flex items-center justify-between">
              <div className={cn("flex items-center gap-2 overflow-hidden transition-all duration-200", isCollapsed && !isMobile ? "w-10 justify-center" : "w-auto")}>
                <Logo
                  variant={isCollapsed && !isMobile ? "iso" : "full"}
                  size={isCollapsed && !isMobile ? "sm" : "md"}
                />
              </div>

              <button
                onClick={() => isMobileOpen ? setIsMobileOpen(false) : setIsCollapsed(!isCollapsed)}
                className="p-2 rounded-xl hover:bg-v-dark-border/60 text-v-gray hover:text-v-white transition-colors cursor-pointer shrink-0"
                title={isCollapsed ? "Expandir navegación" : "Colapsar navegación"}
              >
                {isMobileOpen ? <X size={20} /> : (isCollapsed ? <Menu size={20} /> : <ChevronLeft size={20} />)}
              </button>
            </div>
          </div>

          {/* Navigation Items Grouped */}
          <nav className="flex-1 py-5 px-3 space-y-6 overflow-y-auto custom-scrollbar text-left">
            {menuGroups.map((group, gIdx) => (
              <div key={gIdx} className="space-y-1.5">
                {(!isCollapsed || isMobile) && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="px-3 text-[10px] font-bold text-v-gray uppercase tracking-widest font-mono"
                  >
                    {t(group.titleKey, group.titleDefault)}
                  </motion.p>
                )}

                {group.items.map((item) => {
                  const label = item.labelText || t(item.labelKey, item.labelDefault);
                  const isActive = location.pathname === item.path;

                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={() => isMobile && setIsMobileOpen(false)}
                      className={({ isActive: linkActive }) => cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 group relative text-xs sm:text-sm font-semibold",
                        linkActive
                          ? "bg-primary/10 text-primary border border-primary/25 shadow-sm"
                          : "text-v-gray hover:text-v-white hover:bg-v-dark-border/50 border border-transparent",
                        isCollapsed && !isMobile ? "justify-center px-0" : ""
                      )}
                      title={isCollapsed && !isMobile ? label : undefined}
                    >
                      <item.icon
                        size={19}
                        className={cn(
                          "shrink-0 transition-transform duration-150",
                          isActive ? "text-primary scale-105" : "group-hover:scale-105 group-hover:text-v-white"
                        )}
                      />

                      {(!isCollapsed || isMobile) && (
                        <span className="truncate whitespace-nowrap tracking-tight">
                          {label}
                        </span>
                      )}

                      {isActive && (
                        <motion.div
                          layoutId="active-pill"
                          className="absolute left-0 top-2 bottom-2 w-1 bg-primary rounded-r-full"
                          transition={{ type: "spring", stiffness: 350, damping: 30 }}
                        />
                      )}
                    </NavLink>
                  );
                })}
              </div>
            ))}
          </nav>

          {/* User & Session Footer */}
          <div className="p-3 border-t border-v-dark-border bg-v-dark/30 shrink-0">
            {(!isCollapsed || isMobile) ? (
              <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-v-dark-soft border border-v-dark-border shadow-sm">
                <div className="flex items-center gap-2.5 min-w-0">
                  {user?.photo ? (
                    <img src={user.photo} alt={user.name} className="h-8 w-8 rounded-lg object-cover border border-v-dark-border shrink-0" />
                  ) : (
                    <div className="h-8 w-8 rounded-lg bg-primary/10 border border-primary/25 flex items-center justify-center text-primary font-extrabold text-xs shrink-0">
                      {user?.avatar || 'AD'}
                    </div>
                  )}
                  <div className="min-w-0 text-left">
                    <p className="text-xs font-bold text-v-white truncate leading-tight">{user?.name || 'Administrador'}</p>
                    <p className="text-[10px] text-v-gray truncate mt-0.5">{user?.email || 'admin@vextor.com'}</p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    showConfirm(
                      t('navbar.logoutConfirm'),
                      t('navbar.logoutText'),
                      t('navbar.logoutYes'),
                      t('common.cancel'),
                      true
                    ).then((result) => {
                      if (result.isConfirmed) {
                        logout();
                        navigate('/login');
                      }
                    });
                  }}
                  className="p-1.5 rounded-lg text-v-gray hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer shrink-0"
                  title={t('sidebar.logout')}
                >
                  <LogOut size={16} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  showConfirm(
                    t('navbar.logoutConfirm'),
                    t('navbar.logoutText'),
                    t('navbar.logoutYes'),
                    t('common.cancel'),
                    true
                  ).then((result) => {
                    if (result.isConfirmed) {
                      logout();
                      navigate('/login');
                    }
                  });
                }}
                className="flex items-center justify-center w-full py-2 rounded-xl text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                title={t('sidebar.logout')}
              >
                <LogOut size={18} />
              </button>
            )}
          </div>
        </div>
      </motion.aside>
    </>
  );
};

export default Sidebar;
