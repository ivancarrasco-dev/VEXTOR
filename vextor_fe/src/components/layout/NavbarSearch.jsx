import React, { useState, useEffect, useRef } from 'react';
import { Search, MapPin, Truck, Users, Wrench, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../../config/api';
import { cn } from '../../utils/cn';

const NavbarSearch = () => {
  const [search, setSearch] = useState('');
  const [results, setResults] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);
  const navigate = useNavigate();

  // Handle clicking outside of the search results dropdown to close it
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch and search across modules (Vehicles, Drivers, Routes, Maintenances)
  const performSearch = async (term) => {
    const query = term.trim().toLowerCase();
    if (!query) {
      setResults([]);
      return;
    }

    try {
      const [vRes, dRes, rRes, mRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/vehicles`),
        axios.get(`${API_BASE_URL}/api/drivers`),
        axios.get(`${API_BASE_URL}/api/routes`),
        axios.get(`${API_BASE_URL}/api/maintenance`)
      ]);

      const matchedResults = [];

      // 1. Search Vehicles
      vRes.data.forEach(v => {
        if (v.placa.toLowerCase().includes(query) || v.marca.toLowerCase().includes(query) || v.modelo.toLowerCase().includes(query)) {
          matchedResults.push({
            id: v.id_vehiculo,
            title: `${v.marca} ${v.modelo}`,
            subtitle: `Placa: ${v.placa} • ${v.tipo_vehiculo}`,
            type: 'vehicle',
            icon: Truck,
            route: '/vehicles'
          });
        }
      });

      // 2. Search Drivers
      dRes.data.forEach(d => {
        if (d.nombre_conductor.toLowerCase().includes(query) || d.apellido_conductor.toLowerCase().includes(query) || d.cedula_conductor.includes(query)) {
          matchedResults.push({
            id: d.id_conductor,
            title: `${d.nombre_conductor} ${d.apellido_conductor}`,
            subtitle: `Cédula: ${d.cedula_conductor} • Licencia: ${d.licencia}`,
            type: 'driver',
            icon: Users,
            route: '/drivers'
          });
        }
      });

      // 3. Search Routes
      rRes.data.forEach(r => {
        if (r.codigo_ruta.toLowerCase().includes(query) || r.nombre_ruta.toLowerCase().includes(query)) {
          matchedResults.push({
            id: r.id_ruta,
            title: r.nombre_ruta,
            subtitle: `Ruta: ${r.codigo_ruta} • Estado: ${r.estado_ruta}`,
            type: 'route',
            icon: MapPin,
            route: '/routes'
          });
        }
      });

      // 4. Search Maintenances
      mRes.data.forEach(m => {
        if (m.tipo_mantenimiento.toLowerCase().includes(query) || m.descripcion_mantenimiento.toLowerCase().includes(query)) {
          matchedResults.push({
            id: m.id_mantenimiento,
            title: `Mantenimiento ${m.tipo_mantenimiento}`,
            subtitle: m.descripcion_mantenimiento,
            type: 'maintenance',
            icon: Wrench,
            route: '/maintenance'
          });
        }
      });

      setResults(matchedResults.slice(0, 5)); // Limit to top 5 results
    } catch (err) {
      console.error('Error during global search:', err);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      performSearch(search);
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [search]);

  const handleResultClick = (route) => {
    navigate(route);
    setSearch('');
    setIsOpen(false);
  };

  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);

  return (
    <div className="flex-1 max-w-md mx-2 sm:mx-6 relative" ref={containerRef}>
      {/* Mobile Search Button */}
      <button
        onClick={() => setIsMobileSearchOpen(true)}
        className="p-2 text-v-gray hover:text-v-white hover:bg-v-dark-border rounded-xl sm:hidden cursor-pointer"
        aria-label="Buscar"
      >
        <Search size={20} />
      </button>

      {/* Desktop & Tablet Inline Search Bar */}
      <div className="hidden sm:block relative group">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-v-gray group-focus-within:text-primary transition-colors" />
        <input
          type="text"
          placeholder="Buscar vehículos, conductores, rutas..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          className="w-full bg-v-dark-soft border border-v-dark-border rounded-xl py-2 pl-10 pr-4 text-sm text-v-white placeholder:text-v-gray focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
        />
      </div>

      {/* Mobile Overlay Modal Search */}
      {isMobileSearchOpen && (
        <div className="fixed inset-0 bg-v-dark/95 backdrop-blur-md z-50 p-4 sm:hidden flex flex-col gap-4 animate-in fade-in">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-v-gray" />
              <input
                type="text"
                autoFocus
                placeholder="Buscar vehículos, rutas..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-v-dark-soft border border-v-dark-border rounded-xl py-2.5 pl-10 pr-4 text-sm text-v-white focus:outline-none focus:border-primary"
              />
            </div>
            <button
              onClick={() => {
                setIsMobileSearchOpen(false);
                setSearch('');
              }}
              className="p-2 text-v-gray hover:text-v-white rounded-xl"
            >
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-v-dark-border bg-v-dark-soft border border-v-dark-border rounded-2xl p-2">
            {results.length === 0 && search.trim() ? (
              <div className="p-4 text-center text-v-gray text-xs">
                No se encontraron resultados coincidentes.
              </div>
            ) : (
              results.map((res) => {
                const Icon = res.icon;
                return (
                  <button
                    key={`${res.type}-${res.id}`}
                    onClick={() => {
                      handleResultClick(res.route);
                      setIsMobileSearchOpen(false);
                    }}
                    className="w-full flex items-center gap-3 p-3 hover:bg-v-dark/40 transition-colors text-left"
                  >
                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                      <Icon size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-v-white truncate">{res.title}</p>
                      <p className="text-[10px] text-v-gray truncate mt-0.5">{res.subtitle}</p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Desktop Search Results Dropdown */}
      {isOpen && search.trim() && !isMobileSearchOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-v-dark-soft border border-v-dark-border rounded-xl shadow-2xl overflow-hidden z-50 hidden sm:block">
          {results.length === 0 ? (
            <div className="p-4 text-center text-v-gray text-xs">
              No se encontraron resultados coincidentes.
            </div>
          ) : (
            <div className="divide-y divide-v-dark-border">
              {results.map((res) => {
                const Icon = res.icon;
                return (
                  <button
                    key={`${res.type}-${res.id}`}
                    onClick={() => handleResultClick(res.route)}
                    className="w-full flex items-center gap-3 p-3 hover:bg-v-dark/40 transition-colors text-left"
                  >
                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                      <Icon size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-v-white truncate">{res.title}</p>
                      <p className="text-[10px] text-v-gray truncate mt-0.5">{res.subtitle}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NavbarSearch;
