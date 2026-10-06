import React, { useState } from 'react';
import { History, MapPin, Truck, Calendar } from 'lucide-react';
import { Badge } from '../../components/ui/Badge';

export const UserHistory = () => {
  const [filter, setFilter] = useState('TODOS');

  const historyList = [
    {
      id: 'OP-901',
      date: '2026-03-28',
      route: 'Bogotá → Medellín',
      origin: 'Terminal Salitre, Bogotá',
      destination: 'Terminal Norte, Medellín',
      bus: 'VH-102 (Placa VXT-801)',
      driver: 'Jorge Luis Morales',
      status: 'COMPLETADO',
      cost: '$85.000 COP'
    },
    {
      id: 'OP-882',
      date: '2026-03-20',
      route: 'Medellín → Cartagena',
      origin: 'Terminal Norte, Medellín',
      destination: 'Terminal de Transportes, Cartagena',
      bus: 'VH-305 (Placa VXT-805)',
      driver: 'Carlos Alberto Restrepo',
      status: 'COMPLETADO',
      cost: '$120.000 COP'
    },
    {
      id: 'OP-750',
      date: '2026-03-12',
      route: 'Bogotá → Cali',
      origin: 'Terminal Salitre, Bogotá',
      destination: 'Terminal de Transportes, Cali',
      bus: 'VH-204 (Placa VXT-803)',
      driver: 'Andrés Felipe Gómez',
      status: 'COMPLETADO',
      cost: '$90.000 COP'
    }
  ];

  const filtered = historyList.filter(item => filter === 'TODOS' || item.status === filter);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 text-left">
      {/* Header */}
      <div className="bg-v-dark-soft p-6 rounded-3xl border border-v-dark-border shadow-lg">
        <h1 className="text-2xl font-black text-v-white tracking-tight flex items-center gap-2">
          <History className="text-primary" size={26} /> Historial de Operaciones y Servicios
        </h1>
        <p className="text-xs text-v-gray mt-1">
          Registro completo de recorridos realizados y estado de servicios contratados.
        </p>
      </div>

      {/* Filter Chips */}
      <div className="flex items-center gap-2">
        {['TODOS', 'COMPLETADO', 'EN_CURSO', 'PROGRAMADO'].map((st) => (
          <button
            key={st}
            onClick={() => setFilter(st)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
              filter === st
                ? 'bg-primary text-white border-primary shadow-md'
                : 'bg-v-dark-soft text-v-gray border-v-dark-border hover:text-v-white'
            }`}
          >
            {st === 'TODOS' ? 'Todos los Registros' : st}
          </button>
        ))}
      </div>

      {/* History Cards */}
      <div className="space-y-4">
        {filtered.length === 0 ? (
          <div className="p-12 text-center bg-v-dark-soft border border-v-dark-border rounded-3xl text-v-gray text-xs">
            No se encontraron registros de historial para este filtro.
          </div>
        ) : (
          filtered.map((item) => (
            <div
              key={item.id}
              className="p-6 bg-v-dark-soft border border-v-dark-border rounded-3xl hover:border-primary/40 transition-all shadow-lg space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-v-dark-border/60 pb-3">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono font-black text-primary bg-primary/10 border border-primary/20 px-3 py-1 rounded-xl">
                    {item.id}
                  </span>
                  <h3 className="text-base font-bold text-v-white">{item.route}</h3>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono font-bold text-v-gray flex items-center gap-1">
                    <Calendar size={13} className="text-primary" /> {item.date}
                  </span>
                  <Badge variant="success" size="xs">{item.status}</Badge>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs text-v-gray">
                <div>
                  <span className="text-[10px] uppercase font-mono block text-v-gray">Origen</span>
                  <strong className="text-v-white font-medium flex items-center gap-1.5 mt-0.5">
                    <MapPin size={14} className="text-emerald-400 shrink-0" /> {item.origin}
                  </strong>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-mono block text-v-gray">Destino</span>
                  <strong className="text-v-white font-medium flex items-center gap-1.5 mt-0.5">
                    <MapPin size={14} className="text-red-400 shrink-0" /> {item.destination}
                  </strong>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-mono block text-v-gray">Bus y Conductor</span>
                  <strong className="text-v-white font-medium flex items-center gap-1.5 mt-0.5">
                    <Truck size={14} className="text-primary shrink-0" /> {item.bus}
                  </strong>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default UserHistory;
