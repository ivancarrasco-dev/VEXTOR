import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Truck, User, ShieldCheck, MapPin, Wrench, CheckCircle2, Users, Activity } from 'lucide-react';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

export const BusDetailModal = ({ isOpen, onClose, bus }) => {
  if (!isOpen || !bus) return null;

  const getStatusBadge = (status) => {
    switch (status) {
      case 'DISPONIBLE':
        return <Badge variant="success" pulse size="sm">Disponible</Badge>;
      case 'EN_RUTA':
        return <Badge variant="primary" pulse size="sm">En Ruta</Badge>;
      case 'MANTENIMIENTO':
        return <Badge variant="warning" size="sm">En Mantenimiento</Badge>;
      case 'INACTIVO':
        return <Badge variant="danger" size="sm">Inactivo</Badge>;
      default:
        return <Badge variant="neutral" size="sm">{status || 'Disponible'}</Badge>;
    }
  };

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
                <Truck size={28} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-extrabold text-v-white tracking-tight">
                    Bus Placa <span className="text-primary font-mono">{bus.placa}</span>
                  </h3>
                  {getStatusBadge(bus.estado_vehiculo)}
                </div>
                <p className="text-xs text-v-gray mt-0.5">
                  {bus.marca || 'Mercedes-Benz'} {bus.modelo || 'MarcoPolo'} • Año {bus.anio || bus.año || '2024'}
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

          {/* Body content */}
          <div className="p-6 overflow-y-auto custom-scrollbar space-y-6 text-left">
            {/* Tech Specs Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="p-3.5 bg-v-dark/50 border border-v-dark-border rounded-2xl">
                <span className="text-[10px] font-mono uppercase font-bold text-v-gray block">Capacidad</span>
                <span className="text-base font-extrabold text-v-white flex items-center gap-1.5 mt-1">
                  <Users size={16} className="text-primary" />
                  {bus.capacidad || 42} Pasajeros
                </span>
              </div>

              <div className="p-3.5 bg-v-dark/50 border border-v-dark-border rounded-2xl">
                <span className="text-[10px] font-mono uppercase font-bold text-v-gray block">Tipo Vehículo</span>
                <span className="text-base font-extrabold text-v-white flex items-center gap-1.5 mt-1">
                  <Truck size={16} className="text-blue-400" />
                  {bus.tipo_vehiculo || 'Bus Intermunicipal'}
                </span>
              </div>

              <div className="p-3.5 bg-v-dark/50 border border-v-dark-border rounded-2xl col-span-2 sm:col-span-1">
                <span className="text-[10px] font-mono uppercase font-bold text-v-gray block">Kilometraje</span>
                <span className="text-base font-extrabold text-v-white flex items-center gap-1.5 mt-1">
                  <Activity size={16} className="text-teal-400" />
                  {bus.kilometraje ? `${bus.kilometraje.toLocaleString()} km` : '48,500 km'}
                </span>
              </div>
            </div>

            {/* Operational Assignment */}
            <div className="p-4 bg-v-dark/30 border border-v-dark-border rounded-2xl space-y-3">
              <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-primary">
                Asignación Operativa
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="flex items-center gap-2.5">
                  <User size={16} className="text-v-gray shrink-0" />
                  <div>
                    <span className="text-v-gray block text-[10px]">Conductor Asignado:</span>
                    <strong className="text-v-white font-medium">{bus.conductor_nombre || bus.conductor || 'Sin Conductor Asignado'}</strong>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <MapPin size={16} className="text-v-gray shrink-0" />
                  <div>
                    <span className="text-v-gray block text-[10px]">Ruta Asignada:</span>
                    <strong className="text-v-white font-medium">{bus.ruta_nombre || bus.ruta || 'Operación Disponible'}</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Legal Documents Status */}
            <div className="space-y-3">
              <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-v-gray">
                Documentación y Revisiones Técnicas
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck size={18} className="text-emerald-400 shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-emerald-200">SOAT Vigente</p>
                      <p className="text-[10px] text-emerald-300/80">Vence: 15 Dic 2026</p>
                    </div>
                  </div>
                  <CheckCircle2 size={16} className="text-emerald-400" />
                </div>

                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Wrench size={18} className="text-emerald-400 shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-emerald-200">Tecnomecánica</p>
                      <p className="text-[10px] text-emerald-300/80">Vence: 30 Oct 2026</p>
                    </div>
                  </div>
                  <CheckCircle2 size={16} className="text-emerald-400" />
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-v-dark-border bg-v-dark/40 flex justify-end">
            <Button variant="ghost" onClick={onClose} className="cursor-pointer">
              Cerrar Ficha
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default BusDetailModal;
