import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import Navbar from '../components/layout/Navbar';

/**
 * DashboardLayout
 *
 * Propósito:
 * Definir la estructura visual base para todas las páginas internas de la aplicación (privadas).
 *
 * Páginas que lo utilizan:
 * * Dashboard
 * * Vehicles, Drivers, Routes, Maintenance, etc.
 *
 * Estructura:
 * * Renderiza un Sidebar fijo a la izquierda.
 * * Renderiza un Navbar pegajoso en la parte superior.
 * * Contiene un área de contenido principal donde se inyectan las páginas mediante <Outlet />.
 */
const DashboardLayout = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Close sidebar automatically on window resize if needed
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsMobileOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="flex min-h-screen bg-v-dark text-v-white overflow-hidden">
      <Sidebar
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
      />

      <div
        className={`flex-1 flex flex-col transition-all duration-300 ${
          isCollapsed ? 'lg:pl-20' : 'lg:pl-[260px]'
        }`}
      >
        <Navbar onMenuClick={() => setIsMobileOpen(true)} />

        <main className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
