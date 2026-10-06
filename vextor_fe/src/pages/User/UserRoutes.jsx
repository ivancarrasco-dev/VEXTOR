import React, { useState, useEffect } from 'react';
import { MapPin, Search, Clock, Navigation, Eye, RefreshCw, Flag } from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL } from '../../config/api';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import RouteDetailModal from '../../components/modals/RouteDetailModal';

export const UserRoutes = () => {
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRoute, setSelectedRoute] = useState(null);

  const fetchRoutes = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE_URL}/api/routes`);
      setRoutes(res.data || []);
    } catch (err) {
      console.error('Error fetching routes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoutes();
  }, []);

  const filteredRoutes = routes.filter(r =>
    r.nombre_ruta?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.codigo_ruta?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.origen?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.destino?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-v-dark-soft p-6 rounded-3xl border border-v-dark-border shadow-lg">
        <div>
          <h1 className="text-2xl font-black text-v-white tracking-tight flex items-center gap-2">
            <MapPin className="text-primary" size={26} /> Consulta de Rutas y Destinos
          </h1>
          <p className="text-xs text-v-gray mt-1">
            Explora las rutas habilitadas, ciudades de origen y destino, y duraciones estimadas.
          </p>
        </div>

        <Button
          variant="ghost"
          onClick={fetchRoutes}
          className="flex items-center gap-2 text-xs font-bold cursor-pointer shrink-0"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Sincronizar
        </Button>
      </div>

      {/* Search Bar */}
      <div className="p-4 bg-v-dark-soft border border-v-dark-border rounded-2xl">
        <Input
          placeholder="Buscar por origen, destino, código de ruta o nombre..."
          icon={Search}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Routes Grid */}
      {loading ? (
        <div className="p-12 text-center text-v-gray">Cargando catálogo de rutas...</div>
      ) : filteredRoutes.length === 0 ? (
        <div className="p-12 text-center bg-v-dark-soft border border-v-dark-border rounded-3xl text-v-gray space-y-2">
          <MapPin size={36} className="mx-auto text-v-gray opacity-50" />
          <p className="text-sm font-bold text-v-white">No se encontraron rutas</p>
          <p className="text-xs">Intenta realizar una búsqueda diferente.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredRoutes.map((route) => (
            <div
              key={route.id_ruta}
              className="p-6 bg-v-dark-soft border border-v-dark-border rounded-3xl hover:border-primary/40 transition-all flex flex-col justify-between gap-5 group shadow-lg"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 bg-primary/10 text-primary font-mono font-bold text-xs rounded-xl border border-primary/20">
                    {route.codigo_ruta}
                  </span>
                  <Badge variant="success" size="xs">Operativa</Badge>
                </div>

                <h3 className="text-lg font-bold text-v-white group-hover:text-primary transition-colors">
                  {route.nombre_ruta}
                </h3>

                <div className="p-4 bg-v-dark/40 border border-v-dark-border rounded-2xl space-y-2 text-xs">
                  <div className="flex items-center gap-2 text-v-gray">
                    <MapPin size={14} className="text-emerald-400 shrink-0" />
                    <span>Origen: <strong className="text-v-white">{route.origen}</strong></span>
                  </div>
                  <div className="flex items-center gap-2 text-v-gray">
                    <Flag size={14} className="text-red-400 shrink-0" />
                    <span>Destino: <strong className="text-v-white">{route.destino}</strong></span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs text-v-gray">
                  <div className="flex items-center gap-1.5">
                    <Clock size={14} className="text-primary" />
                    <span>Frecuencia: Cada 30m</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Navigation size={14} className="text-blue-400" />
                    <span>{route.duracion_estimada || '1h 15m'}</span>
                  </div>
                </div>
              </div>

              <Button
                variant="primary"
                onClick={() => setSelectedRoute(route)}
                className="w-full flex items-center justify-center gap-2 cursor-pointer text-xs font-bold"
              >
                <Eye size={16} /> Ver Información de Ruta
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      <RouteDetailModal
        isOpen={Boolean(selectedRoute)}
        onClose={() => setSelectedRoute(null)}
        route={selectedRoute}
      />
    </div>
  );
};

export default UserRoutes;
