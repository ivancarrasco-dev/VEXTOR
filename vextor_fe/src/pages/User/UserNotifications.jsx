import React, { useState } from 'react';
import { Bell, ShieldAlert, CheckCircle2, Info, Trash2, Check, Truck, MapPin } from 'lucide-react';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../context/AuthContext';

export const UserNotifications = () => {
  const { user } = useAuth();
  const roleLower = (user?.role || '').toLowerCase();
  const isConductor = roleLower.includes('conductor');

  const initialNotifications = isConductor
    ? [
        {
          id: '1',
          title: 'Asignación de Nueva Ruta Programada',
          message: 'Se te ha asignado la ruta Bogotá → Medellín (VXT-301) programada para inicio a las 06:00 AM.',
          type: 'info',
          date: 'Hace 5 min',
          read: false
        },
        {
          id: '2',
          title: 'Aviso de Mantenimiento Preventivo',
          message: 'El bus VXT-801 fue aprobado en inspección técnica pre-operacional.',
          type: 'success',
          date: 'Hace 45 min',
          read: false
        },
        {
          id: '3',
          title: 'Alerta de Tráfico en Corredor Vial',
          message: 'Obras en el km 42 de la Vía al Llano. Se recomienda mantener velocidad precavida.',
          type: 'warning',
          date: 'Hace 2 horas',
          read: true
        }
      ]
    : [
        {
          id: '1',
          title: 'Servicio Programado Confirmado',
          message: 'Tu bus asignado para la ruta Bogotá → Medellín ha sido confirmado y está listo en plataforma.',
          type: 'info',
          date: 'Hace 10 min',
          read: false
        },
        {
          id: '2',
          title: 'Actualización de Horarios',
          message: 'Se han optimizado las frecuencias de la ruta Bogotá → Cali. Revisa los nuevos itinerarios.',
          type: 'success',
          date: 'Hace 1 hora',
          read: false
        },
        {
          id: '3',
          title: 'Novedad de Tráfico en Vía',
          message: 'Mantenimiento preventivo en el corredor Bogotá - Girardot. Tiempo estimado de viaje ajustado.',
          type: 'warning',
          date: 'Hace 3 horas',
          read: true
        }
      ];

  const [notifications, setNotifications] = useState(initialNotifications);

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const deleteNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12 text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-v-dark-soft p-6 sm:p-8 rounded-3xl border border-v-dark-border shadow-xl">
        <div>
          <h1 className="text-2xl font-black text-v-white tracking-tight flex items-center gap-2">
            <Bell className="text-primary" size={26} /> Notificaciones del Sistema
          </h1>
          <p className="text-xs text-v-gray mt-1">
            {isConductor
              ? 'Alertas operativas de rutas, despacho y mantenimiento en tiempo real.'
              : 'Novedades de rutas, avisos de servicio y alertas informativas en tiempo real.'}
          </p>
        </div>

        <Button
          variant="ghost"
          onClick={markAllAsRead}
          className="flex items-center gap-1.5 text-xs font-bold cursor-pointer shrink-0 bg-v-dark border border-v-dark-border text-v-white"
        >
          <Check size={14} /> Marcar todas como leídas
        </Button>
      </div>

      {/* Notifications Feed */}
      <div className="space-y-3">
        {notifications.length === 0 ? (
          <div className="p-12 text-center bg-v-dark-soft border border-v-dark-border rounded-3xl text-v-gray text-xs shadow-md">
            No tienes notificaciones pendientes.
          </div>
        ) : (
          notifications.map((item) => (
            <div
              key={item.id}
              className={`p-5 rounded-2xl border transition-all flex items-start justify-between gap-4 shadow-md ${
                item.read
                  ? 'bg-v-dark-soft/60 border-v-dark-border text-v-gray'
                  : 'bg-v-dark-soft border-primary/40 text-v-white shadow-primary/5'
              }`}
            >
              <div className="flex items-start gap-3.5 min-w-0">
                <div className={`p-2.5 rounded-xl border shrink-0 mt-0.5 ${
                  item.type === 'warning'
                    ? 'bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400'
                    : item.type === 'success'
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                    : 'bg-primary/10 border-primary/20 text-primary'
                }`}>
                  {item.type === 'warning' ? <ShieldAlert size={18} /> : item.type === 'success' ? <CheckCircle2 size={18} /> : <Info size={18} />}
                </div>

                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold truncate text-v-white">{item.title}</h4>
                    {!item.read && <Badge variant="primary" size="xs">Nueva</Badge>}
                  </div>
                  <p className="text-xs leading-relaxed text-v-gray">{item.message}</p>
                  <span className="text-[10px] text-v-gray font-mono block pt-1">{item.date}</span>
                </div>
              </div>

              <button
                onClick={() => deleteNotification(item.id)}
                className="p-1.5 text-v-gray hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer shrink-0"
                title="Eliminar notificación"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default UserNotifications;
