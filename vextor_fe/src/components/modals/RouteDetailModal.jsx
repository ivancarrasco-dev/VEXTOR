import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin, Clock, Truck, Navigation, Calendar, Flag } from 'lucide-react';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

export const RouteDetailModal = ({ isOpen, onClose, route }) => {
  if (!isOpen || !route) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="bg-v-dark-soft border border-v-dark-border rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="p-6 border-b border-v-dark-border bg-v-dark/40 flex items-center justify-between">
            <div className="flex items-center gap-4 text-left">
              <div className="h-14 w-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-inner shrink-0">
                <MapPin size={28} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 bg-primary/20 text-primary border border-primary/30 rounded-lg text-xs font-mono font-bold">
                    {route.codigo_ruta || 'R-101'}
                  </span>
                  <h3 className="text-xl font-extrabold text-v-white tracking-tight">
                    {route.nombre_ruta || 'Ruta Principal'}
                  </h3>
                </div>
                <p className="text-xs text-v-gray mt-1">
                  {route.origen || 'Origen'} → {route.destino || 'Destino'}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-v-gray hover:text-v-white hover:bg-v-dark-border/40 rounded-xl transition-colors cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 overflow-y-auto custom-scrollbar space-y-6 text-left">
            {/* Origin & Destination Timeline */}
            <div className="p-5 bg-v-dark/50 border border-v-dark-border rounded-2xl space-y-4 relative">
              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-bold shrink-0 mt-0.5">
                  <MapPin size={16} />
                </div>
                <div>
                  <span className="text-[10px] font-mono font-bold uppercase text-v-gray">Terminal de Origen</span>
                  <p className="text-sm font-extrabold text-v-white">{route.origen || 'Terminal Central'}</p>
                </div>
              </div>

              <div className="ml-4 border-l-2 border-dashed border-v-dark-border h-6 my-1" />

              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-full bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400 font-bold shrink-0 mt-0.5">
                  <Flag size={16} />
                </div>
                <div>
                  <span className="text-[10px] font-mono font-bold uppercase text-v-gray">Terminal de Destino</span>
                  <p className="text-sm font-extrabold text-v-white">{route.destino || 'Estación Final'}</p>
                </div>
              </div>
            </div>

            {/* General Specs */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="p-3.5 bg-v-dark/50 border border-v-dark-border rounded-2xl">
                <span className="text-[10px] font-mono uppercase font-bold text-v-gray block">Horario Salida</span>
                <span className="text-sm font-extrabold text-v-white flex items-center gap-1.5 mt-1">
                  <Clock size={15} className="text-primary" />
                  {route.horario || '06:00 AM - 08:00 PM'}
                </span>
              </div>

              <div className="p-3.5 bg-v-dark/50 border border-v-dark-border rounded-2xl">
                <span className="text-[10px] font-mono uppercase font-bold text-v-gray block">Duración Estimada</span>
                <span className="text-sm font-extrabold text-v-white flex items-center gap-1.5 mt-1">
                  <Navigation size={15} className="text-blue-400" />
                  {route.duracion_estimada || '45 minutos'}
                </span>
              </div>

              <div className="p-3.5 bg-v-dark/50 border border-v-dark-border rounded-2xl col-span-2 sm:col-span-1">
                <span className="text-[10px] font-mono uppercase font-bold text-v-gray block">Frecuencia</span>
                <span className="text-sm font-extrabold text-v-white flex items-center gap-1.5 mt-1">
                  <Calendar size={15} className="text-amber-400" />
                  Cada 20 min
                </span>
              </div>
            </div>

            {/* Assigned Vehicle */}
            {route.vehiculo && (
              <div className="p-4 bg-v-dark/30 border border-v-dark-border rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Truck size={20} className="text-primary shrink-0" />
                  <div>
                    <span className="text-[10px] text-v-gray font-mono font-bold uppercase block">Bus Asignado</span>
                    <strong className="text-sm text-v-white">{route.vehiculo.placa} ({route.vehiculo.marca} {route.vehiculo.modelo})</strong>
                  </div>
                </div>
                <Badge variant="success" size="xs">Asignado</Badge>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-v-dark-border bg-v-dark/40 flex justify-end">
            <Button variant="ghost" onClick={onClose} className="cursor-pointer">
              Cerrar Detalle
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default RouteDetailModal;
