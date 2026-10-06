import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Users, Search, Clock, Phone, Check } from 'lucide-react';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

export const PassengerListModal = ({ isOpen, onClose, routeName, passengersList = [] }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [passengers, setPassengers] = useState(() => {
    if (passengersList && passengersList.length > 0) return passengersList;
    return [
      { id: '1', seat: '01', name: 'Carlos Andrés Mendoza', doc: '1018293842', phone: '310 456 7890', boarded: true },
      { id: '2', seat: '02', name: 'Laura Valentina Gómez', doc: '1029384756', phone: '312 987 6543', boarded: true },
      { id: '3', seat: '03', name: 'Mariana Isabel Ruiz', doc: '1038475612', phone: '315 234 5678', boarded: false },
      { id: '4', seat: '04', name: 'Jorge Eduardo Silva', doc: '1047561239', phone: '318 876 5432', boarded: true },
      { id: '5', seat: '05', name: 'Sonia Esperanza Parra', doc: '1056123984', phone: '320 345 6789', boarded: false },
    ];
  });

  if (!isOpen) return null;

  const toggleBoarded = (id) => {
    setPassengers(prev =>
      prev.map(p => p.id === id ? { ...p, boarded: !p.boarded } : p)
    );
  };

  const filteredPassengers = passengers.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.doc.includes(searchTerm) ||
    p.seat.includes(searchTerm)
  );

  const boardedCount = passengers.filter(p => p.boarded).length;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="bg-v-dark-soft border border-v-dark-border rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
        >
          {/* Header */}
          <div className="p-6 border-b border-v-dark-border bg-v-dark/40 flex items-center justify-between">
            <div className="flex items-center gap-3.5 text-left">
              <div className="h-12 w-12 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 shrink-0">
                <Users size={24} />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-v-white tracking-tight">Manifiesto de Pasajeros</h3>
                <p className="text-xs text-v-gray mt-0.5">{routeName || 'Ruta Operativa'}</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-v-gray hover:text-v-white hover:bg-v-dark-border/40 rounded-xl transition-colors cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>

          {/* Stats Bar & Search */}
          <div className="p-4 bg-v-dark/20 border-b border-v-dark-border space-y-3 text-left">
            <div className="flex items-center justify-between text-xs">
              <span className="text-v-gray font-mono font-bold uppercase">
                Abordados: <strong className="text-emerald-400">{boardedCount}</strong> / {passengers.length}
              </span>
              <Badge variant="primary" size="xs">Control de Abordaje</Badge>
            </div>

            <Input
              placeholder="Buscar por nombre, documento o asiento..."
              icon={Search}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* List */}
          <div className="p-4 overflow-y-auto custom-scrollbar space-y-2 text-left flex-1">
            {filteredPassengers.length === 0 ? (
              <div className="p-8 text-center text-v-gray text-xs">
                No se encontraron pasajeros con el término ingresado.
              </div>
            ) : (
              filteredPassengers.map((pas) => (
                <div
                  key={pas.id}
                  className="p-3 bg-v-dark/50 border border-v-dark-border rounded-2xl flex items-center justify-between gap-3 hover:border-primary/40 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="h-9 w-9 rounded-xl bg-v-dark border border-v-dark-border font-mono font-bold text-xs text-primary flex items-center justify-center shrink-0">
                      #{pas.seat}
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-v-white truncate">{pas.name}</p>
                      <p className="text-[10px] text-v-gray flex items-center gap-2 mt-0.5">
                        <span>C.C. {pas.doc}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1"><Phone size={10} /> {pas.phone}</span>
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => toggleBoarded(pas.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 border ${
                      pas.boarded
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                        : 'bg-v-dark border-v-dark-border text-v-gray hover:text-v-white'
                    }`}
                  >
                    {pas.boarded ? <Check size={14} /> : <Clock size={14} />}
                    {pas.boarded ? 'Abordado' : 'Pendiente'}
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-v-dark-border bg-v-dark/40 flex justify-end">
            <Button variant="ghost" onClick={onClose} className="cursor-pointer">
              Cerrar Manifiesto
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default PassengerListModal;
