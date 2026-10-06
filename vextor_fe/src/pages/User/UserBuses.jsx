import React, { useState, useEffect } from 'react';
import { Truck, Search, Eye, RefreshCw } from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL } from '../../config/api';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import BusDetailModal from '../../components/modals/BusDetailModal';

export const UserBuses = () => {
  const [buses, setBuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('TODOS');
  const [brandFilter, setBrandFilter] = useState('TODAS');
  const [selectedBus, setSelectedBus] = useState(null);

  const fetchBuses = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE_URL}/api/vehicles`);
      setBuses(res.data || []);
    } catch (err) {
      console.error('Error fetching buses:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBuses();
  }, []);

  const uniqueBrands = Array.from(new Set(buses.map(b => b.marca).filter(Boolean)));

  const filteredBuses = buses.filter(b => {
    const matchesSearch =
      b.placa?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.marca?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.modelo?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'TODOS' || b.estado_vehiculo === statusFilter;
    const matchesBrand = brandFilter === 'TODAS' || b.marca === brandFilter;

    return matchesSearch && matchesStatus && matchesBrand;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-v-dark-soft p-6 rounded-3xl border border-v-dark-border shadow-lg">
        <div>
          <h1 className="text-2xl font-black text-v-white tracking-tight flex items-center gap-2">
            <Truck className="text-primary" size={26} /> Consulta de Flota y Buses
          </h1>
          <p className="text-xs text-v-gray mt-1">
            Visualiza las unidades de transporte disponibles, capacidades y estado técnico.
          </p>
        </div>

        <Button
          variant="ghost"
          onClick={fetchBuses}
          className="flex items-center gap-2 text-xs font-bold cursor-pointer shrink-0"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Sincronizar
        </Button>
      </div>

      {/* Filters Bar */}
      <div className="p-4 bg-v-dark-soft border border-v-dark-border rounded-2xl grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Input
          placeholder="Buscar por placa, marca o modelo..."
          icon={Search}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        <div className="space-y-1">
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="TODOS">Todos los Estados</option>
            <option value="DISPONIBLE">Disponible</option>
            <option value="EN_RUTA">En Ruta</option>
            <option value="MANTENIMIENTO">Mantenimiento</option>
          </Select>
        </div>

        <div className="space-y-1">
          <Select
            value={brandFilter}
            onChange={(e) => setBrandFilter(e.target.value)}
          >
            <option value="TODAS">Todas las Marcas</option>
            {uniqueBrands.map(b => (
              <option key={b} value={b}>{b}</option>
            ))}
          </Select>
        </div>
      </div>

      {/* Buses Catalog Grid */}
      {loading ? (
        <div className="p-12 text-center text-v-gray">Cargando flota de buses...</div>
      ) : filteredBuses.length === 0 ? (
        <div className="p-12 text-center bg-v-dark-soft border border-v-dark-border rounded-3xl text-v-gray space-y-2">
          <Truck size={36} className="mx-auto text-v-gray opacity-50" />
          <p className="text-sm font-bold text-v-white">No se encontraron buses</p>
          <p className="text-xs">Intenta cambiar los términos de búsqueda o filtros.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredBuses.map((bus) => (
            <div
              key={bus.id_vehiculo}
              className="p-6 bg-v-dark-soft border border-v-dark-border rounded-3xl hover:border-primary/40 transition-all flex flex-col justify-between gap-5 group shadow-lg"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 bg-v-dark text-primary font-mono font-black text-sm rounded-xl border border-v-dark-border shadow-inner">
                    {bus.placa}
                  </span>
                  <Badge
                    variant={bus.estado_vehiculo === 'DISPONIBLE' ? 'success' : bus.estado_vehiculo === 'EN_RUTA' ? 'primary' : 'warning'}
                    pulse={bus.estado_vehiculo === 'EN_RUTA' || bus.estado_vehiculo === 'DISPONIBLE'}
                    size="xs"
                  >
                    {bus.estado_vehiculo || 'DISPONIBLE'}
                  </Badge>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-v-white group-hover:text-primary transition-colors">
                    {bus.marca} {bus.modelo}
                  </h3>
                  <p className="text-xs text-v-gray mt-0.5">Año fabricación: {bus.anio || bus.año || '2024'}</p>
                </div>

                <div className="p-3 bg-v-dark/40 border border-v-dark-border rounded-2xl grid grid-cols-2 gap-2 text-xs text-v-gray">
                  <div>
                    <span className="text-[10px] uppercase font-mono block text-v-gray">Capacidad</span>
                    <strong className="text-v-white font-bold">{bus.capacidad || 40} Asientos</strong>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-mono block text-v-gray">Soat / Tecno</span>
                    <strong className="text-emerald-400 font-bold">Vigente</strong>
                  </div>
                </div>
              </div>

              <Button
                variant="primary"
                onClick={() => setSelectedBus(bus)}
                className="w-full flex items-center justify-center gap-2 cursor-pointer text-xs font-bold"
              >
                <Eye size={16} /> Ver Ficha Técnica Completa
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      <BusDetailModal
        isOpen={Boolean(selectedBus)}
        onClose={() => setSelectedBus(null)}
        bus={selectedBus}
      />
    </div>
  );
};

export default UserBuses;
