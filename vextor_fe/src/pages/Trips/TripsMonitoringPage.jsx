import React, { useState, useEffect } from 'react';
import { Activity, MapPin, Truck, Search, RefreshCw, Clock } from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL } from '../../config/api';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';

export const TripsMonitoringPage = () => {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('TODOS');

  const fetchTrips = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE_URL}/api/routes`);
      setTrips(res.data || []);
    } catch (err) {
      console.error('Error fetching trips:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrips();
  }, []);

  const filteredTrips = trips.filter(t => {
    const matchSearch = t.nombre_ruta?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        t.codigo_ruta?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        t.origen?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        t.destino?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchStatus = statusFilter === 'TODOS' || t.estado_ruta === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-v-dark-soft p-6 sm:p-8 rounded-3xl border border-v-dark-border shadow-xl">
        <div>
          <h1 className="text-2xl font-black text-v-white tracking-tight flex items-center gap-2">
            <Activity className="text-primary" size={28} /> Monitoreo y Gestión de Recorridos
          </h1>
          <p className="text-xs text-v-gray mt-1">
            Supervisión en tiempo real de servicios activos, recorridos programados y viajes completados.
          </p>
        </div>

        <Button
          variant="ghost"
          onClick={fetchTrips}
          className="flex items-center gap-2 text-xs font-bold cursor-pointer shrink-0"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Sincronizar
        </Button>
      </div>

      {/* Filters */}
      <div className="p-4 bg-v-dark-soft border border-v-dark-border rounded-2xl grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Input
          placeholder="Buscar por código, ruta, origen o destino..."
          icon={Search}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="TODOS">Todos los Estados</option>
          <option value="EN_RUTA">En Ruta / Activos</option>
          <option value="PROGRAMADA">Programados</option>
          <option value="SUSPENDIDA">Pausados / Suspendidos</option>
          <option value="COMPLETADA">Completados</option>
        </Select>
      </div>

      {/* Trips Monitoring Cards */}
      {loading ? (
        <div className="p-12 text-center text-v-gray">Cargando tablero de recorridos...</div>
      ) : filteredTrips.length === 0 ? (
        <div className="p-12 text-center bg-v-dark-soft border border-v-dark-border rounded-3xl text-v-gray space-y-2">
          <Activity size={36} className="mx-auto text-v-gray opacity-50" />
          <p className="text-sm font-bold text-v-white">Sin recorridos registrados</p>
          <p className="text-xs">No se encontraron datos con el filtro seleccionado.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredTrips.map((trip) => {
            const isEnRuta = trip.estado_ruta === 'EN_RUTA';
            const isPausada = trip.estado_ruta === 'SUSPENDIDA';

            return (
              <div
                key={trip.id_ruta}
                className="p-6 bg-v-dark-soft border border-v-dark-border rounded-3xl hover:border-primary/40 transition-all flex flex-col justify-between gap-5 shadow-lg group"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-3 py-1 bg-primary/10 text-primary font-mono font-bold text-xs rounded-xl border border-primary/20">
                      {trip.codigo_ruta}
                    </span>
                    <Badge
                      variant={isEnRuta ? 'primary' : isPausada ? 'warning' : 'success'}
                      pulse={isEnRuta}
                      size="xs"
                    >
                      {trip.estado_ruta || 'PROGRAMADA'}
                    </Badge>
                  </div>

                  <h3 className="text-lg font-bold text-v-white group-hover:text-primary transition-colors">
                    {trip.nombre_ruta}
                  </h3>

                  <div className="p-4 bg-v-dark/40 border border-v-dark-border rounded-2xl space-y-2 text-xs">
                    <div className="flex items-center gap-2 text-v-gray">
                      <MapPin size={14} className="text-emerald-400 shrink-0" />
                      <span>Origen: <strong className="text-v-white">{trip.origen}</strong></span>
                    </div>
                    <div className="flex items-center gap-2 text-v-gray">
                      <MapPin size={14} className="text-red-400 shrink-0" />
                      <span>Destino: <strong className="text-v-white">{trip.destino}</strong></span>
                    </div>
                    {trip.vehiculo && (
                      <div className="flex items-center gap-2 text-v-gray pt-1 border-t border-v-dark-border/60">
                        <Truck size={14} className="text-primary shrink-0" />
                        <span>Bus: <strong className="text-v-white">{trip.vehiculo.placa}</strong> ({trip.vehiculo.marca})</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-v-dark-border flex items-center justify-between text-xs text-v-gray">
                  <span className="flex items-center gap-1">
                    <Clock size={14} className="text-primary" /> {trip.duracion_estimada || '45 min'}
                  </span>
                  <span className="font-mono text-[10px] text-v-white">
                    {isEnRuta ? 'Rastreo Activo' : 'Monitoreo GPS'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TripsMonitoringPage;
