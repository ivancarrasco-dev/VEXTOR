import { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
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

/**
 * Sidebar Component
 *
 * Responsabilidad:
 * Navegación lateral principal de la aplicación operativa.
 *
 * Utilizado en:
 * * DashboardLayout
 *
 * Funcionalidades:
 * * Navegación mediante NavLink de React Router.
 * * Soporte para modo colapsado/expandido.
 * * Menú lateral móvil con overlay.
 * * Manejo de marca (Logo/Isotipo) según estado.
 * * Indicador visual de ruta activa.
 */
const menuItems = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/vehicles', icon: Truck, label: 'Vehículos' },
  { path: '/drivers', icon: Users, label: 'Conductores' },
  { path: '/routes', icon: MapPin, label: 'Rutas' },
  { path: '/maintenance', icon: Wrench, label: 'Mantenimientos' },
  { path: '/reports', icon: BarChart3, label: 'Reportes' },
  { path: '/settings', icon: Settings, label: 'Configuración' },
];

const Sidebar = ({ isCollapsed, setIsCollapsed, isMobileOpen, setIsMobileOpen }) => {
  const { logout } = useAuth();
  const location = useLocation();
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
    mobileClosed: { x: -300 }
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
        transition={{ type: 'tween', duration: 0.3, ease: 'easeInOut' }}
        className={cn(
          "fixed top-0 left-0 z-50 h-screen bg-v-dark-soft border-r border-v-dark-border",
          isMobile ? "w-[280px]" : (isCollapsed ? "w-20" : "w-[260px]")
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="h-20 flex items-center justify-between px-6 border-b border-v-dark-border">
            <div className={cn("flex items-center overflow-hidden transition-all duration-300", isCollapsed && !isMobile ? "w-10" : "w-auto")}>
              <Logo
                variant={isCollapsed && !isMobile ? "iso" : "full"}
                size="sm"
              />
            </div>

            <button
              onClick={() => isMobileOpen ? setIsMobileOpen(false) : setIsCollapsed(!isCollapsed)}
              className="p-2 rounded-lg hover:bg-v-dark-border text-v-gray hover:text-v-white transition-colors"
            >
              {isMobileOpen ? <X size={20} /> : (isCollapsed ? <Menu size={20} /> : <ChevronLeft size={20} />)}
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto custom-scrollbar">
            {menuItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => cn(
                  "flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group relative",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-v-gray hover:text-v-white hover:bg-v-dark-border/50",
                  isCollapsed && !isMobile ? "justify-center" : ""
                )}
              >
                <item.icon size={22} className={cn("shrink-0 transition-transform duration-200", !isCollapsed && "group-hover:scale-110")} />

                <AnimatePresence>
                  {(!isCollapsed || isMobile) && (
                    <motion.span
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      className="font-medium whitespace-nowrap"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>

                {location.pathname === item.path && (
                  <motion.div
                    layoutId="active-pill"
                    className="absolute left-0 w-1 h-6 bg-primary rounded-r-full"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
              </NavLink>
            ))}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-v-dark-border">
            <button
              onClick={logout}
              className={cn(
                "flex items-center gap-3 w-full px-3 py-3 rounded-xl text-red-400 hover:bg-red-500/10 transition-all duration-200",
                isCollapsed && !isMobile ? "justify-center" : ""
              )}
            >
              <LogOut size={22} className="shrink-0" />
              {(!isCollapsed || isMobile) && <span className="font-medium">Cerrar Sesión</span>}
            </button>
          </div>
        </div>
      </motion.aside>
    </>
  );
};

export default Sidebar;
