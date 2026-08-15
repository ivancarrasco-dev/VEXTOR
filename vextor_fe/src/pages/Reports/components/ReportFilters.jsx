import { Calendar, Search, Clock, Info, SlidersHorizontal } from 'lucide-react';
import { Select } from '../../../components/ui/Select';

export const ReportFilters = ({
  activeReport,
  filters,
  setFilters,
  isExporting
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 bg-v-dark-soft p-5 rounded-2xl border border-v-dark-border">
      {/* Date Start and End Input Wrapper */}
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-v-gray flex items-center gap-1.5">
          <Calendar size={13} /> Rango de fechas
        </label>
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={filters.dateStart}
            onChange={(e) => setFilters(prev => ({ ...prev, dateStart: e.target.value }))}
            className="w-full bg-v-dark border border-v-dark-border focus:border-primary text-v-white text-xs px-2.5 py-2.5 rounded-lg focus:outline-none transition-all focus:ring-1 focus:ring-primary/20"
            placeholder="Desde"
            disabled={isExporting}
          />
          <span className="text-v-gray text-xs">-</span>
          <input
            type="date"
            value={filters.dateEnd}
            onChange={(e) => setFilters(prev => ({ ...prev, dateEnd: e.target.value }))}
            className="w-full bg-v-dark border border-v-dark-border focus:border-primary text-v-white text-xs px-2.5 py-2.5 rounded-lg focus:outline-none transition-all focus:ring-1 focus:ring-primary/20"
            placeholder="Hasta"
            disabled={isExporting}
          />
        </div>
      </div>

      {/* Status Select dropdown */}
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-v-gray flex items-center gap-1.5">
          <SlidersHorizontal size={13} /> Estado
        </label>
        <Select
          value={filters.status}
          onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
          disabled={isExporting}
        >
          <option value="">Todos los estados</option>
          {activeReport === 'vehicles' && (
            <>
              <option value="DISPONIBLE">Disponible</option>
              <option value="EN_RUTA">En Ruta</option>
              <option value="MANTENIMIENTO">Mantenimiento</option>
              <option value="INACTIVO">Inactivo</option>
            </>
          )}
          {activeReport === 'drivers' && (
            <>
              <option value="ACTIVO">Activo</option>
              <option value="INACTIVO">Inactivo</option>
              <option value="SUSPENDIDO">Suspendido</option>
            </>
          )}
          {activeReport === 'routes' && (
            <>
              <option value="PROGRAMADA">Programada</option>
              <option value="EN_PROCESO">En Proceso</option>
              <option value="COMPLETADA">Completada</option>
              <option value="SUSPENDIDA">Suspendida</option>
            </>
          )}
          {activeReport === 'maintenances' && (
            <>
              <option value="PROGRAMADO">Programado</option>
              <option value="EN_PROCESO">En Proceso</option>
              <option value="COMPLETADO">Completado</option>
              <option value="CANCELADO">Cancelado</option>
            </>
          )}
          {['day', 'week', 'month', 'general'].includes(activeReport) && (
            <>
              <option value="ACTIVO">Activo</option>
              <option value="COMPLETADO">Completado</option>
              <option value="COMPLETADA">Completada</option>
              <option value="PROGRAMADO">Programado</option>
              <option value="PROGRAMADA">Programada</option>
              <option value="EN_PROCESO">En Proceso</option>
              <option value="CANCELADO">Cancelado</option>
              <option value="INACTIVO">Inactivo</option>
            </>
          )}
        </Select>
      </div>

      {/* Text Search Bar */}
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-v-gray flex items-center gap-1.5">
          <Search size={13} /> Buscar por texto
        </label>
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-v-gray" />
          <input
            type="text"
            placeholder="Escriba filtro..."
            value={filters.search}
            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
            className="w-full bg-v-dark border border-v-dark-border focus:border-primary text-v-white text-xs pl-8 pr-3 py-2.5 rounded-lg focus:outline-none transition-all"
            disabled={isExporting}
          />
        </div>
      </div>

      {/* Sort selector */}
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-v-gray flex items-center gap-1.5">
          <Clock size={13} /> Ordenar
        </label>
        <Select
          value={filters.sort}
          onChange={(e) => setFilters(prev => ({ ...prev, sort: e.target.value }))}
          disabled={isExporting}
        >
          <option value="recent">Más recientes primero</option>
          <option value="oldest">Más antiguos primero</option>
          <option value="name_az">Alfabético (A-Z)</option>
          <option value="name_za">Alfabético (Z-A)</option>
        </Select>
      </div>

      {/* Type / Subtype Selector */}
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-v-gray flex items-center gap-1.5">
          <Info size={13} /> Selector de tipo
        </label>
        <Select
          value={filters.type}
          onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
          disabled={isExporting}
        >
          <option value="">Ver todas las categorías</option>
          {activeReport === 'vehicles' && (
            <>
              <option value="Automóvil">Automóviles</option>
              <option value="Camioneta">Camionetas</option>
              <option value="Furgón">Furgones</option>
              <option value="Camión">Camiones</option>
              <option value="Bus">Buses</option>
            </>
          )}
          {activeReport === 'drivers' && (
            <>
              <option value="Tipo B">Licencia Tipo B</option>
              <option value="Tipo C">Licencia Tipo C</option>
              <option value="Tipo D">Licencia Tipo D</option>
              <option value="Tipo E">Licencia Tipo E</option>
            </>
          )}
          {activeReport === 'maintenances' && (
            <>
              <option value="PREVENTIVO">Preventivos</option>
              <option value="CORRECTIVO">Correctivos</option>
              <option value="PREDICTIVO">Predictivos</option>
            </>
          )}
          {['day', 'week', 'month', 'general'].includes(activeReport) && (
            <>
              <option value="Vehículos">Solo Vehículos</option>
              <option value="Conductores">Solo Conductores</option>
              <option value="Rutas">Solo Rutas</option>
              <option value="Mantenimientos">Solo Mantenimientos</option>
            </>
          )}
        </Select>
      </div>
    </div>
  );
};
