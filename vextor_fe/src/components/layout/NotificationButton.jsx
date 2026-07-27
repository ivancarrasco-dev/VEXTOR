import { useState } from 'react';
import { Bell } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * NotificationButton Component
 *
 * Responsabilidad:
 * Mostrar alertas y notificaciones relevantes para el usuario.
 *
 * Utilizado en:
 * * Navbar
 *
 * Funcionalidades:
 * * Toggle de dropdown con animaciones de Framer Motion.
 * * Indicador visual (badge) de nuevas notificaciones.
 * * Lista de notificaciones recientes con categorías y tiempos.
 */
const NotificationButton = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [hasNotifications] = useState(true);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2.5 rounded-xl hover:bg-v-dark-border text-v-gray hover:text-v-white transition-all relative group"
      >
        <Bell size={20} className="group-hover:rotate-12 transition-transform" />
        {hasNotifications && (
          <span className="absolute top-2 right-2.5 w-2 h-2 bg-primary rounded-full border-2 border-v-dark" />
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute right-0 mt-2 w-80 bg-v-dark-soft border border-v-dark-border rounded-2xl shadow-2xl z-20 overflow-hidden"
            >
              <div className="p-4 border-b border-v-dark-border flex justify-between items-center bg-v-dark-soft/50">
                <h3 className="font-bold text-v-white">Notificaciones</h3>
                <span className="text-[10px] bg-primary/20 text-primary px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                  2 Nuevas
                </span>
              </div>

              <div className="max-h-[350px] overflow-y-auto">
                <div className="p-4 border-b border-v-dark-border hover:bg-v-dark-border/30 transition-colors cursor-pointer">
                  <p className="text-xs text-primary font-bold mb-1 uppercase tracking-wider">Mantenimiento</p>
                  <p className="text-sm text-v-white mb-1">Vehículo XYZ-123 requiere revisión inmediata.</p>
                  <p className="text-[10px] text-v-gray">Hace 15 minutos</p>
                </div>
                <div className="p-4 border-b border-v-dark-border hover:bg-v-dark-border/30 transition-colors cursor-pointer">
                  <p className="text-xs text-blue-400 font-bold mb-1 uppercase tracking-wider">Ruta</p>
                  <p className="text-sm text-v-white mb-1">Nueva ruta escolar norte asignada.</p>
                  <p className="text-[10px] text-v-gray">Hace 2 horas</p>
                </div>
              </div>

              <button className="w-full py-3 text-center text-xs text-v-gray hover:text-v-white hover:bg-v-dark-border transition-colors font-medium">
                Ver todas las notificaciones
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationButton;
