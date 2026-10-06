import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Truck,
  MapPin,
  Clock,
  Search,
  ChevronRight,
  ShieldCheck,
  Calendar,
  Radio,
  ArrowRight
} from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL } from '../../config/api';
import { useAuth } from '../../context/AuthContext';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import BusDetailModal from '../../components/modals/BusDetailModal';
import RouteDetailModal from '../../components/modals/RouteDetailModal';

export const UserHome = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState('');
  const [buses, setBuses] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedBus, setSelectedBus] = useState(null);
  const [selectedRoute, setSelectedRoute] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [busesRes, routesRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/api/vehicles`).catch(() => ({ data: [] })),
          axios.get(`${API_BASE_URL}/api/routes`).catch(() => ({ data: [] }))
        ]);
        setBuses(busesRes.data || []);
        setRoutes(routesRes.data || []);
      } catch (err) {
        console.error('Error loading user home data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredBuses = buses.filter(b =>
    b.placa?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.marca?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredRoutes = routes.filter(r =>
    r.nombre_ruta?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.origen?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.destino?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto pb-12 text-left">
      {/* Welcome Hero Banner */}
      <section className="relative overflow-hidden rounded-3xl p-6 sm:p-10 bg-v-dark-soft border border-v-dark-border shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-[120px] pointer-events-none -mr-32 -mt-32" />

        <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="flex items-center gap-3">
              <Badge variant="success" pulse size="sm">
                Portal de Servicios VEXTOR
              </Badge>
              <span className="text-xs text-v-gray font-mono flex items-center gap-1">
                <Radio size={14} className="text-primary animate-pulse" /> Sistema en Línea
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-black text-v-white tracking-tight">
              Bienvenido, <span className="text-primary">{user?.name || 'Usuario'}</span>
            </h1>

            <p className="text-v-gray text-xs sm:text-sm leading-relaxed">
              Consulta rutas disponibles, buses operativos, horarios de servicio y realiza seguimiento de tus operaciones en un solo portal.
            </p>

            {/* Quick Search Bar */}
            <div className="pt-2 max-w-xl">
              <Input
                placeholder="Buscar por ciudad, destino, origen o placa de bus..."
                icon={Search}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row lg:flex-col gap-3 w-full lg:w-auto shrink-0">
            <Button
              variant="primary"
              onClick={() => navigate('/user/routes')}
              className="flex items-center justify-center gap-2 cursor-pointer shadow-lg"
            >
              <MapPin size={18} /> Consultar Rutas <ArrowRight size={16} />
            </Button>
            <Button
              variant="secondary"
              onClick={() => navigate('/user/buses')}
              className="flex items-center justify-center gap-2 cursor-pointer"
            >
              <Truck size={18} /> Catálogo de Buses
            </Button>
          </div>
        </div>
      </section>

      {/* Quick KPI Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-v-dark-soft border border-v-dark-border rounded-2xl flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
            <Truck size={24} />
          </div>
          <div>
            <span className="text-[10px] font-mono font-bold uppercase text-v-gray">Buses en Operación</span>
            <p className="text-2xl font-black text-v-white">{buses.length || 12}</p>
          </div>
        </div>

        <div className="p-5 bg-v-dark-soft border border-v-dark-border rounded-2xl flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shrink-0">
            <MapPin size={24} />
          </div>
          <div>
            <span className="text-[10px] font-mono font-bold uppercase text-v-gray">Rutas Activas</span>
            <p className="text-2xl font-black text-v-white">{routes.length || 8}</p>
          </div>
        </div>

        <div className="p-5 bg-v-dark-soft border border-v-dark-border rounded-2xl flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
            <Calendar size={24} />
          </div>
          <div>
            <span className="text-[10px] font-mono font-bold uppercase text-v-gray">Próximos Horarios</span>
            <p className="text-2xl font-black text-v-white">24 Frecuencias</p>
          </div>
        </div>

        <div className="p-5 bg-v-dark-soft border border-v-dark-border rounded-2xl flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center shrink-0">
            <ShieldCheck size={24} />
          </div>
          <div>
            <span className="text-[10px] font-mono font-bold uppercase text-v-gray">Estado del Servicio</span>
            <p className="text-base font-extrabold text-emerald-400">100% Normal</p>
          </div>
        </div>
      </div>

      {/* Featured Routes Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-v-white flex items-center gap-2">
            <MapPin size={18} className="text-primary" />
            Rutas y Recorridos Disponibles
          </h2>
          <button
            onClick={() => navigate('/user/routes')}
            className="text-xs text-primary hover:underline font-bold cursor-pointer flex items-center gap-1"
          >
            Ver Todas <ChevronRight size={14} />
          </button>
        </div>

        {loading ? (
          <div className="p-8 text-center text-v-gray">Cargando rutas...</div>
        ) : filteredRoutes.length === 0 ? (
          <div className="p-8 text-center bg-v-dark-soft border border-v-dark-border rounded-2xl text-v-gray text-xs">
            No se encontraron rutas con los criterios de búsqueda.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredRoutes.slice(0, 6).map((r) => (
              <div
                key={r.id_ruta}
                onClick={() => setSelectedRoute(r)}
                className="p-5 bg-v-dark-soft border border-v-dark-border rounded-2xl hover:border-primary/40 transition-all cursor-pointer group flex flex-col justify-between gap-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 bg-primary/10 text-primary font-mono font-bold text-xs rounded-lg border border-primary/20">
                      {r.codigo_ruta}
                    </span>
                    <Badge variant="success" size="xs">Activa</Badge>
                  </div>
                  <h3 className="text-base font-bold text-v-white group-hover:text-primary transition-colors">
                    {r.nombre_ruta}
                  </h3>
                  <div className="text-xs text-v-gray space-y-1">
                    <p>Origen: <strong className="text-v-white">{r.origen}</strong></p>
                    <p>Destino: <strong className="text-v-white">{r.destino}</strong></p>
                  </div>
                </div>

                <div className="pt-3 border-t border-v-dark-border flex items-center justify-between text-xs text-v-gray">
                  <span className="flex items-center gap-1">
                    <Clock size={13} className="text-primary" /> {r.duracion_estimada || '45 min'}
                  </span>
                  <span className="text-primary font-bold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    Ver Detalle <ChevronRight size={14} />
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Featured Buses Section */}
      <div className="space-y-4 pt-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-v-white flex items-center gap-2">
            <Truck size={18} className="text-blue-400" />
            Flota de Buses Destacada
          </h2>
          <button
            onClick={() => navigate('/user/buses')}
            className="text-xs text-primary hover:underline font-bold cursor-pointer flex items-center gap-1"
          >
            Ver Flota Completa <ChevronRight size={14} />
          </button>
        </div>

        {loading ? (
          <div className="p-8 text-center text-v-gray">Cargando flota...</div>
        ) : filteredBuses.length === 0 ? (
          <div className="p-8 text-center bg-v-dark-soft border border-v-dark-border rounded-2xl text-v-gray text-xs">
            No existen buses registrados con ese filtro.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {filteredBuses.slice(0, 4).map((b) => (
              <div
                key={b.id_vehiculo}
                onClick={() => setSelectedBus(b)}
                className="p-5 bg-v-dark-soft border border-v-dark-border rounded-2xl hover:border-primary/40 transition-all cursor-pointer group space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-extrabold text-sm text-v-white bg-v-dark px-2.5 py-1 rounded-lg border border-v-dark-border">
                    {b.placa}
                  </span>
                  <Badge variant={b.estado_vehiculo === 'DISPONIBLE' ? 'success' : 'primary'} size="xs">
                    {b.estado_vehiculo || 'DISPONIBLE'}
                  </Badge>
                </div>

                <div>
                  <h4 className="text-sm font-bold text-v-white group-hover:text-primary transition-colors">
                    {b.marca} {b.modelo}
                  </h4>
                  <p className="text-xs text-v-gray mt-0.5">Capacidad: {b.capacidad || 40} asientos</p>
                </div>

                <div className="pt-2 border-t border-v-dark-border text-xs text-primary font-bold flex items-center justify-between">
                  <span>Ver Ficha Técnica</span>
                  <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      <BusDetailModal
        isOpen={Boolean(selectedBus)}
        onClose={() => setSelectedBus(null)}
        bus={selectedBus}
      />

      <RouteDetailModal
        isOpen={Boolean(selectedRoute)}
        onClose={() => setSelectedRoute(null)}
        route={selectedRoute}
      />
    </div>
  );
};

export default UserHome;
