import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Bell, X, Info, Check, CheckCheck, Loader2, AlertCircle, RotateCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { cn } from '../../utils/cn';

/**
 * NotificationButton Component
 *
 * Responsabilidad:
 * Mostrar alertas y notificaciones reales conectadas al backend de Vextor.
 * Incluye panel emergente (Popover) y drawer lateral renderizado en Portal.
 */
const NotificationButton = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  const fetchNotifications = async () => {
    setIsLoading(true);
    setIsError(false);
    try {
      const response = await axios.get('http://localhost:8000/api/notifications');
      if (response.data) {
        setNotifications(response.data);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Poll notifications every 30 seconds for live updates
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const unreadCount = notifications.filter(n => !n.leido).length;

  const handleToggleReadStatus = async (notif, e) => {
    if (e) e.stopPropagation();
    const isCurrentlyRead = notif.leido;
    const endpoint = isCurrentlyRead
      ? `http://localhost:8000/api/notifications/${notif.id_notificacion}/unread`
      : `http://localhost:8000/api/notifications/${notif.id_notificacion}/read`;

    // Optimistic local update
    setNotifications(prev =>
      prev.map(n => n.id_notificacion === notif.id_notificacion ? { ...n, leido: !isCurrentlyRead } : n)
    );

    try {
      await axios.put(endpoint);
    } catch (error) {
      console.error('Error updating notification read status:', error);
      // Revert if error
      setNotifications(prev =>
        prev.map(n => n.id_notificacion === notif.id_notificacion ? { ...n, leido: isCurrentlyRead } : n)
      );
    }
  };

  const handleMarkAllAsRead = async () => {
    // Optimistic update
    setNotifications(prev => prev.map(n => ({ ...n, leido: true })));
    try {
      await axios.put('http://localhost:8000/api/notifications/read-all');
    } catch (error) {
      console.error('Error marking all as read:', error);
      fetchNotifications();
    }
  };

  const getNotificationColor = (tipo) => {
    switch (tipo) {
      case 'mantenimiento': return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
      case 'ruta': return 'text-purple-500 bg-purple-500/10 border-purple-500/20';
      case 'vehiculo': return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
      case 'conductor': return 'text-teal-500 bg-teal-500/10 border-teal-500/20';
      case 'usuario': return 'text-pink-500 bg-pink-500/10 border-pink-500/20';
      default: return 'text-primary bg-primary/10 border-primary/20';
    }
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return (
      d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }) +
      ' • ' +
      d.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })
    );
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2.5 rounded-xl hover:bg-v-dark-border text-v-gray hover:text-v-white transition-all relative group cursor-pointer"
        aria-label="Notificaciones"
      >
        <Bell size={20} className="group-hover:rotate-12 transition-transform" />
        {unreadCount > 0 && (
          <span className="absolute top-2 right-2.5 w-4 h-4 bg-primary text-v-dark-constant rounded-full border-2 border-v-dark flex items-center justify-center text-[9px] font-black leading-none animate-in zoom-in">
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
                  <p className="text-[10px] text-v-gray mt-0.5">Alertas en tiempo real de la flota.</p>
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
                {isLoading ? (
                  <div className="p-8 text-center text-v-gray flex flex-col items-center gap-2">
                    <Loader2 size={24} className="animate-spin text-primary" />
                    <span className="text-xs">Cargando notificaciones...</span>
                  </div>
                ) : isError ? (
                  <div className="p-6 text-center text-red-400 flex flex-col items-center gap-2">
                    <AlertCircle size={24} />
                    <span className="text-xs font-semibold">Error al cargar notificaciones</span>
                    <button
                      onClick={fetchNotifications}
                      className="mt-1 px-3 py-1 bg-red-500/10 border border-red-500/20 rounded-lg text-[11px] font-bold text-red-300 hover:bg-red-500/20 flex items-center gap-1 cursor-pointer"
                    >
                      <RotateCw size={12} /> Reintentar
                    </button>
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="p-8 text-center text-v-gray text-xs flex flex-col items-center gap-2">
                    <Bell size={24} className="text-v-gray/40" />
                    No tienes notificaciones.
                  </div>
                ) : (
                  notifications.slice(0, 5).map((notif) => (
                    <div
                      key={notif.id_notificacion}
                      onClick={(e) => handleToggleReadStatus(notif, e)}
                      className={cn(
                        "p-4 border-b border-v-dark-border hover:bg-v-dark-border/20 transition-colors cursor-pointer relative flex gap-3 items-start",
                        !notif.leido && "bg-primary/5"
                      )}
                    >
                      <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 border", getNotificationColor(notif.tipo))}>
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
                    </div>
                  ))
                )}
              </div>

              <button
                onClick={() => {
                  setIsOpen(false);
                  setIsDrawerOpen(true);
                }}
                className="w-full py-3.5 text-center text-xs text-v-gray hover:text-v-white hover:bg-v-dark-border transition-colors font-semibold border-t border-v-dark-border bg-v-dark/10 cursor-pointer"
              >
                Ver todas las notificaciones
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* DETAILED NOTIFICATIONS SLIDING DRAWER (PORTAL) */}
      {typeof document !== 'undefined' &&
        createPortal(
          <AnimatePresence>
            {isDrawerOpen && (
              <div className="fixed inset-0 z-50 overflow-hidden">
                {/* Backdrop */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setIsDrawerOpen(false)}
                  className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                />

                {/* Drawer Container */}
                <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
                  <motion.div
                    initial={{ x: '100%' }}
                    animate={{ x: 0 }}
                    exit={{ x: '100%' }}
                    transition={{ type: 'spring', damping: 25, stiffness: 220 }}
                    className="w-screen max-w-md bg-v-dark-soft border-l border-v-dark-border shadow-2xl flex flex-col text-left"
                  >
                    {/* Header */}
                    <div className="px-6 py-5 border-b border-v-dark-border bg-v-dark/40 flex items-center justify-between shrink-0">
                      <div className="flex items-center gap-3">
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
                        className="p-2 text-v-gray hover:text-v-white hover:bg-v-dark-border/40 rounded-xl transition-colors cursor-pointer"
                      >
                        <X size={18} />
                      </button>
                    </div>

                    {/* Body */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                      {isLoading ? (
                        <div className="h-64 flex flex-col items-center justify-center text-center text-v-gray gap-3">
                          <Loader2 size={32} className="animate-spin text-primary" />
                          <p className="text-sm font-semibold">Cargando notificaciones...</p>
                        </div>
                      ) : isError ? (
                        <div className="h-64 flex flex-col items-center justify-center text-center text-red-400 gap-3">
                          <AlertCircle size={36} />
                          <p className="text-sm font-bold">Error de conexión con el backend</p>
                          <p className="text-xs text-v-gray max-w-xs">No se pudieron recuperar las notificaciones del servidor.</p>
                          <button
                            onClick={fetchNotifications}
                            className="mt-2 px-4 py-2 bg-red-500/10 border border-red-500/30 rounded-xl text-xs font-bold text-red-300 hover:bg-red-500/20 flex items-center gap-2 cursor-pointer transition-colors"
                          >
                            <RotateCw size={14} /> Reintentar
                          </button>
                        </div>
                      ) : notifications.length === 0 ? (
                        <div className="h-64 flex flex-col items-center justify-center text-center text-v-gray gap-3">
                          <div className="h-14 w-14 rounded-2xl bg-v-dark border border-v-dark-border flex items-center justify-center text-v-gray/50">
                            <Info size={28} />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-v-white">No tienes notificaciones</p>
                            <p className="text-xs text-v-gray mt-1 max-w-xs">No se han registrado eventos ni alertas recientes en la plataforma.</p>
                          </div>
                        </div>
                      ) : (
                        notifications.map((notif) => (
                          <div
                            key={notif.id_notificacion}
                            onClick={(e) => handleToggleReadStatus(notif, e)}
                            className={cn(
                              "p-4 rounded-2xl border transition-all cursor-pointer relative flex gap-3.5 items-start group",
                              !notif.leido
                                ? "bg-primary/5 border-primary/30 shadow-[0_4px_15px_rgba(16,185,129,0.05)]"
                                : "bg-v-dark/30 border-v-dark-border/60 opacity-80 hover:opacity-100 hover:border-v-dark-border"
                            )}
                          >
                            <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center shrink-0 border mt-0.5", getNotificationColor(notif.tipo))}>
                              <Bell size={18} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <h4 className="text-xs font-black text-v-white uppercase tracking-wider">{notif.titulo}</h4>
                                {!notif.leido ? (
                                  <span className="text-[9px] font-extrabold text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full uppercase">Nuevo</span>
                                ) : (
                                  <span className="text-[9px] font-bold text-v-gray bg-v-dark border border-v-dark-border px-2 py-0.5 rounded-full uppercase">Leído</span>
                                )}
                              </div>
                              <p className="text-sm text-v-gray mt-1.5 leading-snug">{notif.descripcion}</p>
                              <div className="flex items-center justify-between mt-3 pt-2 border-t border-v-dark-border/40">
                                <p className="text-[10px] text-v-gray font-medium">{formatTime(notif.fecha_hora)}</p>
                                <button
                                  type="button"
                                  onClick={(e) => handleToggleReadStatus(notif, e)}
                                  className="text-[10px] font-bold text-v-gray hover:text-primary transition-colors cursor-pointer"
                                >
                                  {notif.leido ? 'Marcar no leída' : 'Marcar leída'}
                                </button>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Footer */}
                    <div className="p-4 border-t border-v-dark-border bg-v-dark/20 flex justify-between gap-3 shrink-0">
                      {unreadCount > 0 ? (
                        <button
                          onClick={handleMarkAllAsRead}
                          className="px-4 py-2 border border-primary/20 hover:border-primary/40 bg-primary/10 text-primary text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                        >
                          <CheckCheck size={14} /> Marcar todo como leído
                        </button>
                      ) : (
                        <div />
                      )}
                      <button
                        onClick={() => setIsDrawerOpen(false)}
                        className="px-4 py-2 bg-v-dark border border-v-dark-border hover:bg-v-dark-border rounded-xl text-v-white text-xs font-bold transition-all cursor-pointer ml-auto"
                      >
                        Cerrar
                      </button>
                    </div>
                  </motion.div>
                </div>
              </div>
            )}
          </AnimatePresence>,
          document.body
        )}
    </div>
  );
};

export default NotificationButton;
