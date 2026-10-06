import React, { useState } from 'react';
import { Calendar, Clock, Truck, Search } from 'lucide-react';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';

export const UserSchedules = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const schedulesList = [
    { id: '1', code: 'R-101', route: 'Bogotá → Medellín', depTime: '06:00 AM', arrTime: '02:00 PM', freq: 'Diario', status: 'CONFIRMADO', bus: 'BUS-001 (VH-102)' },
    { id: '2', code: 'R-102', route: 'Bogotá → Cali', depTime: '07:30 AM', arrTime: '04:30 PM', freq: 'Diario', status: 'CONFIRMADO', bus: 'BUS-004 (VH-204)' },
    { id: '3', code: 'R-103', route: 'Medellín → Cartagena', depTime: '08:00 AM', arrTime: '08:00 PM', freq: 'Lun-Vie', status: 'A TIEMPO', bus: 'BUS-008 (VH-305)' },
    { id: '4', code: 'R-104', route: 'Cali → Pasto', depTime: '09:15 AM', arrTime: '03:15 PM', freq: 'Diario', status: 'A TIEMPO', bus: 'BUS-012 (VH-410)' },
    { id: '5', code: 'R-105', route: 'Bogotá → Bucaramanga', depTime: '11:00 AM', arrTime: '07:00 PM', freq: 'Diario', status: 'PROGRAMADO', bus: 'BUS-015 (VH-520)' },
    { id: '6', code: 'R-106', route: 'Barranquilla → Santa Marta', depTime: '01:00 PM', arrTime: '03:00 PM', freq: 'Cada hora', status: 'PROGRAMADO', bus: 'BUS-018 (VH-612)' },
  ];

  const filteredSchedules = schedulesList.filter(s =>
    s.route.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.bus.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 text-left">
      {/* Header */}
      <div className="bg-v-dark-soft p-6 rounded-3xl border border-v-dark-border shadow-lg">
        <h1 className="text-2xl font-black text-v-white tracking-tight flex items-center gap-2">
          <Calendar className="text-primary" size={26} /> Consulta de Horarios y Frecuencias
        </h1>
        <p className="text-xs text-v-gray mt-1">
          Tabla de salidas programadas, horas estimadas de llegada y frecuencias de servicio.
        </p>
      </div>

      {/* Search */}
      <div className="p-4 bg-v-dark-soft border border-v-dark-border rounded-2xl">
        <Input
          placeholder="Filtrar por ruta, código o vehículo..."
          icon={Search}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Schedule Table */}
      <div className="bg-v-dark-soft border border-v-dark-border rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto w-full custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[650px]">
            <thead>
              <tr className="bg-v-dark/50 border-b border-v-dark-border text-xs font-bold uppercase text-v-gray font-mono tracking-wider">
                <th className="p-4">Código / Ruta</th>
                <th className="p-4">Salida</th>
                <th className="p-4">Llegada Estimada</th>
                <th className="p-4">Frecuencia</th>
                <th className="p-4">Bus Asignado</th>
                <th className="p-4 text-center">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-v-dark-border/60 text-sm">
              {filteredSchedules.map((item) => (
                <tr key={item.id} className="hover:bg-v-dark/30 transition-colors">
                  <td className="p-4">
                    <span className="text-xs font-mono font-bold text-primary block">{item.code}</span>
                    <span className="font-bold text-v-white">{item.route}</span>
                  </td>
                  <td className="p-4 font-bold text-emerald-400 font-mono">
                    <span className="flex items-center gap-1.5"><Clock size={14} /> {item.depTime}</span>
                  </td>
                  <td className="p-4 text-v-gray font-mono">
                    {item.arrTime}
                  </td>
                  <td className="p-4 text-v-gray text-xs">
                    {item.freq}
                  </td>
                  <td className="p-4 text-xs font-semibold text-v-white">
                    <span className="flex items-center gap-1.5"><Truck size={14} className="text-primary" /> {item.bus}</span>
                  </td>
                  <td className="p-4 text-center">
                    <Badge variant="success" size="xs">{item.status}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default UserSchedules;
