import { useState, useEffect } from 'react';
import { Bell, X, Info, Check, CheckCheck, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { cn } from '../../utils/cn';

/**
 * NotificationButton Component
 *
 * Responsabilidad:
 * Mostrar alertas y notificaciones reales conectadas al backend de Vextor.
 */
const NotificationButton = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchNotifications = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/notifications');
      if (response.data) {
        setNotifications(response.data);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Poll notifications every 30 seconds for live updates
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const unreadCount = notifications.filter(n => !n.leido).length;

  const handleMarkAsRead = async (id, e) => {
    e.stopPropagation();
    try {
      await axios.put(`http://localhost:8000/api/notifications/${id}/read`);
      // Update local state
      setNotifications(prev => prev.map(n => n.id_notificacion === id ? { ...n, leido: true } : n));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await axios.put('http://localhost:8000/api/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, leido: true })));
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const getNotificationColor = (tipo) => {
    switch (tipo) {
      case 'mantenimiento': return 'text-amber-500 bg-amber-500/10';
      case 'ruta': return 'text-purple-500 bg-purple-500/10';
      case 'vehiculo': return 'text-blue-500 bg-blue-500/10';
      case 'conductor': return 'text-teal-500 bg-teal-500/10';
      case 'usuario': return 'text-pink-500 bg-pink-500/10';
      default: return 'text-primary bg-primary/10';
    }
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }) + ' ' + d.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' });
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2.5 rounded-xl hover:bg-v-dark-border text-v-gray hover:text-v-white transition-all relative group cursor-pointer"
      >
        <Bell size={20} className="group-hover:rotate-12 transition-transform" />
        {unreadCount > 0 && (
          <span className="absolute top-2 right-2.5 w-4 h-4 bg-primary text-v-dark-constant rounded-full border-2 border-v-dark flex items-center justify-center text-[9px] font-black leading-none">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Popover Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute right-0 mt-2 w-85 bg-v-dark-soft border border-v-dark-border rounded-2xl shadow-2xl z-20 overflow-hidden text-left"
            >
              <div className="p-4 border-b border-v-dark-border flex justify-between items-center bg-v-dark-soft/50">
                <div>
                  <h3 className="font-bold text-v-white">Notificaciones</h3>
                  <p className="text-[10px] text-v-gray mt-0.5">Alertas reales del sistema.</p>
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllAsRead}
                    className="text-[10px] text-primary hover:underline font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <CheckCheck size={12} /> Marcar todo leído
                  </button>
                )}
              </div>

              <div className="max-h-[350px] overflow-y-auto custom-scrollbar">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-v-gray text-xs flex flex-col items-center gap-2">
                    <Bell size={24} className="text-v-gray/50" />
                    No hay notificaciones.
                  </div>
                ) : (
                  notifications.slice(0, 5).map((notif) => (
                    <div
                      key={notif.id_notificacion}
                      onClick={(e) => !notif.leido && handleMarkAsRead(notif.id_notificacion, e)}
                      className={cn(
                        "p-4 border-b border-v-dark-border hover:bg-v-dark-border/20 transition-colors cursor-pointer relative flex gap-3 items-start",
                        !notif.leido && "bg-primary/5"
                      )}
                    >
                      <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5", getNotificationColor(notif.tipo))}>
                        <Bell size={15} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs font-bold text-v-white uppercase tracking-wider">{notif.titulo}</p>
                          {!notif.leido && (
                            <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                          )}
                        </div>
                        <p className="text-sm text-v-gray mt-1 leading-snug">{notif.descripcion}</p>
                        <p className="text-[10px] text-v-gray mt-1.5">{formatTime(notif.fecha_hora)}</p>
                      </div>
                      {!notif.leido && (
                        <button
                          onClick={(e) => handleMarkAsRead(notif.id_notificacion, e)}
                          className="p-1 hover:bg-v-dark-border rounded text-v-gray hover:text-primary shrink-0 cursor-pointer self-center"
                          title="Marcar como leída"
                        >
                          <Check size={14} />
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>

              <button
                onClick={() => {
                  setIsOpen(false);
                  setIsDrawerOpen(true);
                }}
                className="w-full py-3.5 text-center text-xs text-v-gray hover:text-v-white hover:bg-v-dark-border transition-colors font-medium border-t border-v-dark-border bg-v-dark/10 cursor-pointer"
              >
                Ver todas las notificaciones
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* DETAILED NOTIFICATIONS SLIDING DRAWER */}
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
                className="w-screen max-w-md bg-v-dark-soft border-l border-v-dark-border shadow-2xl flex flex-col text-left"
              >
                {/* Header */}
                <div className="px-6 py-5 border-b border-v-dark-border bg-v-dark/20 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                      <Bell size={18} />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-v-white">Notificaciones</h3>
                      <p className="text-xs text-v-gray mt-0.5">Centro de alertas de la flota.</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsDrawerOpen(false)}
                    className="p-2 text-v-gray hover:text-v-white hover:bg-v-dark-border/40 rounded-lg transition-colors cursor-pointer"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                  {notifications.length === 0 ? (
                    <div className="h-64 flex flex-col items-center justify-center text-center text-v-gray gap-2">
                      <Info size={36} className="text-v-gray" />
                      <p className="text-sm font-semibold">Sin notificaciones</p>
                      <p className="text-xs max-w-xs text-v-gray">No se han registrado eventos recientes en el sistema.</p>
                    </div>
                  ) : (
                    notifications.map((notif) => (
                      <div
                        key={notif.id_notificacion}
                        onClick={(e) => !notif.leido && handleMarkAsRead(notif.id_notificacion, e)}
                        className={cn(
                          "p-4 rounded-xl border border-v-dark-border/50 hover:border-v-dark-border bg-v-dark/20 flex gap-3 items-start transition-all cursor-pointer relative",
                          !notif.leido && "bg-primary/5 border-primary/30"
                        )}
                      >
                        <div className={cn("h-9 w-9 rounded-xl flex items-center justify-center shrink-0", getNotificationColor(notif.tipo))}>
                          <Bell size={16} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <h4 className="text-xs font-black text-v-white uppercase tracking-wider">{notif.titulo}</h4>
                            {!notif.leido ? (
                              <span className="text-[9px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full uppercase">Nuevo</span>
                            ) : (
                              <span className="text-[9px] font-bold text-v-gray bg-v-dark border border-v-dark-border px-2 py-0.5 rounded-full uppercase">Leído</span>
                            )}
                          </div>
                          <p className="text-sm text-v-gray mt-1 leading-snug">{notif.descripcion}</p>
                          <p className="text-[10px] text-v-gray mt-2 font-medium">{formatTime(notif.fecha_hora)}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-v-dark-border bg-v-dark/10 flex justify-between gap-3">
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllAsRead}
                      className="px-4 py-2 border border-primary/20 hover:border-primary/40 bg-primary/5 text-primary text-xs font-bold rounded-xl transition-all cursor-pointer"
                    >
                      Marcar todo como leído
                    </button>
                  )}
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

export default NotificationButton;
