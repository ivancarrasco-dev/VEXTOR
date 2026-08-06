import React from 'react';
import { cn } from '../../../utils/cn';

const NotificationsSection = ({ notificationToggles, handleToggleNotification }) => {
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        {Object.keys(notificationToggles).map((key) => {
          const labels = {
            email: { title: 'Correos Electrónicos', desc: 'Notificar reportes, vencimientos y novedades críticas por email.' },
            reminders: { title: 'Recordatorios', desc: 'Alertar con 15 días de antelación sobre revisiones técnicas y SOAT.' },
            alerts: { title: 'Alertas de Operación', desc: 'Alertar de inmediato si un vehículo supera límites de velocidad o desvíos.' },
            internal: { title: 'Notificaciones Internas', desc: 'Notificar en tiempo real en la bandeja interna del dashboard.' }
          };
          return (
            <div key={key} className="flex justify-between items-center bg-v-dark/20 p-4 border border-v-dark-border/40 rounded-xl">
              <div>
                <p className="font-bold text-v-white text-sm">{labels[key].title}</p>
                <p className="text-xs text-v-gray mt-0.5">{labels[key].desc}</p>
              </div>

              {/* Elegant Switch */}
              <button
                type="button"
                onClick={() => handleToggleNotification(key)}
                className={cn(
                  "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                  notificationToggles[key] ? "bg-primary" : "bg-v-dark-border"
                )}
              >
                <span
                  className={cn(
                    "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-v-dark shadow ring-0 transition duration-200 ease-in-out",
                    notificationToggles[key] ? "translate-x-5 bg-v-dark-constant" : "translate-x-0 bg-v-gray"
                  )}
                />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default NotificationsSection;
