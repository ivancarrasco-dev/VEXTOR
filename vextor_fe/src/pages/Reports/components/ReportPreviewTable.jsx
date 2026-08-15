import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, ChevronDown, FileText, FileSpreadsheet, Info, Users, Truck, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { cn } from '../../../utils/cn';

const STATUS_STYLES = {
  // Vehicles
  'DISPONIBLE': 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  'EN_RUTA': 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  'MANTENIMIENTO': 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  'INACTIVO': 'bg-red-500/10 text-red-500 border-red-500/20',

  // Drivers
  'ACTIVO': 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  'SUSPENDIDO': 'bg-amber-500/10 text-amber-500 border-amber-500/20',

  // Routes
  'PROGRAMADA': 'bg-purple-500/10 text-purple-500 border-purple-500/20',
  'EN_PROCESO': 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  'COMPLETADA': 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  'SUSPENDIDA': 'bg-red-500/10 text-red-500 border-red-500/20',

  // Maintenances
  'PROGRAMADO': 'bg-purple-500/10 text-purple-500 border-purple-500/20',
  'COMPLETADO': 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  'CANCELADO': 'bg-red-500/10 text-red-500 border-red-500/20',
};

export const ReportPreviewTable = ({
  activeReport,
  reportLabel,
  currentItems,
  totalItems,
  startIndex,
  itemsPerPage,
  currentPage,
  totalPages,
  isLoadingPreview,
  tableSort,
  onRequestSort,
  onPrevPage,
  onNextPage,
  onExport,
  isExporting,
  user
}) => {
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const exportMenuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target)) {
        setIsExportMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleExportClick = (format) => {
    setIsExportMenuOpen(false);
    onExport(reportLabel, activeReport, format);
  };

  return (
    <div className="bg-v-dark-soft border border-v-dark-border rounded-2xl overflow-visible shadow-2xl relative z-20">
      {/* Header Action Button Area above the Table */}
      <div className="p-4 sm:p-5 border-b border-v-dark-border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-v-dark/20">
        <div>
          <h4 className="font-bold text-base text-v-white">Registros encontrados ({totalItems})</h4>
          <p className="text-v-gray text-xs mt-0.5">Haga clic en las columnas para ordenar los datos.</p>
        </div>

        {/* Export Dropdown Menu Button */}
        <div className="relative shrink-0 self-stretch sm:self-auto" ref={exportMenuRef}>
          <Button
            variant="outline"
            onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
            disabled={isExporting || totalItems === 0}
            className="flex items-center gap-2 w-full sm:w-auto font-bold border-v-gray-dark text-v-white hover:bg-v-dark-border cursor-pointer"
          >
            <Download size={15} /> Exportar reporte <ChevronDown size={14} className={cn("transition-transform duration-200", isExportMenuOpen && "rotate-180")} />
          </Button>

          <AnimatePresence>
            {isExportMenuOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 6 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 6 }}
                className="absolute right-0 mt-2 w-56 bg-v-dark-soft/95 backdrop-blur-md border border-v-dark-border rounded-xl shadow-2xl p-1.5 z-50 flex flex-col gap-1 focus:outline-none"
              >
                <button
                  type="button"
                  onClick={() => handleExportClick('pdf')}
                  className="flex items-center gap-2.5 w-full px-3 py-2 text-sm rounded-lg text-v-white hover:bg-primary/10 hover:text-primary transition-colors text-left cursor-pointer"
                >
                  <FileText size={15} className="text-red-500" /> Exportar como PDF
                </button>
                {user?.role === 'Super Administrador' && (
                  <button
                    type="button"
                    onClick={() => handleExportClick('xlsx')}
                    className="flex items-center gap-2.5 w-full px-3 py-2 text-sm rounded-lg text-v-white hover:bg-primary/10 hover:text-primary transition-colors text-left cursor-pointer"
                  >
                    <FileSpreadsheet size={15} className="text-emerald-500" /> Exportar como Excel (.xlsx)
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleExportClick('csv')}
                  className="flex items-center gap-2.5 w-full px-3 py-2 text-sm rounded-lg text-v-white hover:bg-primary/10 hover:text-primary transition-colors text-left cursor-pointer"
                >
                  <Download size={15} className="text-blue-400" /> Exportar como CSV
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Main table loading/empty/data states */}
      {isLoadingPreview ? (
        <div className="p-8 space-y-4">
          <div className="flex gap-4">
            <div className="h-4 bg-v-dark-border rounded-full animate-pulse w-1/4" />
            <div className="h-4 bg-v-dark-border rounded-full animate-pulse w-1/4" />
            <div className="h-4 bg-v-dark-border rounded-full animate-pulse w-1/4" />
            <div className="h-4 bg-v-dark-border rounded-full animate-pulse w-1/4" />
          </div>
          <hr className="border-v-dark-border/40" />
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex gap-4 items-center pt-2">
              <div className="h-10 bg-v-dark-border rounded-xl animate-pulse w-12" />
              <div className="space-y-2 flex-1">
                <div className="h-3 bg-v-dark-border rounded-full animate-pulse w-1/2" />
                <div className="h-2 bg-v-dark-border rounded-full animate-pulse w-1/3" />
              </div>
              <div className="h-4 bg-v-dark-border rounded-full animate-pulse w-24" />
              <div className="h-6 bg-v-dark-border rounded-full animate-pulse w-20" />
            </div>
          ))}
        </div>
      ) : totalItems === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[300px] p-8 text-center bg-v-dark/10">
          <div className="h-14 w-14 rounded-full bg-v-dark border border-v-dark-border text-v-gray flex items-center justify-center mb-4">
            <Info size={24} />
          </div>
          <h5 className="text-base font-bold text-v-white mb-1">Sin registros coincidentes</h5>
          <p className="text-v-gray text-xs max-w-sm">No existen datos que cumplan los filtros actuales en este reporte. Modifique las fechas, el estado o el término de búsqueda.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="border-b border-v-dark-border bg-v-dark/30">
                {activeReport === 'vehicles' && (
                  <>
                    <th onClick={() => onRequestSort('placa')} className="p-4 text-xs font-bold uppercase text-v-gray tracking-wider cursor-pointer hover:text-v-white select-none">
                      Placa {tableSort.column === 'placa' && (tableSort.direction === 'asc' ? '▲' : '▼')}
                    </th>
                    <th onClick={() => onRequestSort('marca')} className="p-4 text-xs font-bold uppercase text-v-gray tracking-wider cursor-pointer hover:text-v-white select-none">
                      Vehículo / Modelo {tableSort.column === 'marca' && (tableSort.direction === 'asc' ? '▲' : '▼')}
                    </th>
                    <th onClick={() => onRequestSort('anio')} className="p-4 text-xs font-bold uppercase text-v-gray tracking-wider cursor-pointer hover:text-v-white select-none">
                      Año / Color {tableSort.column === 'anio' && (tableSort.direction === 'asc' ? '▲' : '▼')}
                    </th>
                    <th onClick={() => onRequestSort('tipo_vehiculo')} className="p-4 text-xs font-bold uppercase text-v-gray tracking-wider cursor-pointer hover:text-v-white select-none">
                      Tipo / Capacidad {tableSort.column === 'tipo_vehiculo' && (tableSort.direction === 'asc' ? '▲' : '▼')}
                    </th>
                    <th onClick={() => onRequestSort('kilometraje_actual')} className="p-4 text-xs font-bold uppercase text-v-gray tracking-wider cursor-pointer hover:text-v-white select-none">
                      Kilometraje {tableSort.column === 'kilometraje_actual' && (tableSort.direction === 'asc' ? '▲' : '▼')}
                    </th>
                    <th className="p-4 text-xs font-bold uppercase text-v-gray tracking-wider">Estado</th>
                  </>
                )}

                {activeReport === 'drivers' && (
                  <>
                    <th onClick={() => onRequestSort('nombre_conductor')} className="p-4 text-xs font-bold uppercase text-v-gray tracking-wider cursor-pointer hover:text-v-white select-none">
                      Conductor {tableSort.column === 'nombre_conductor' && (tableSort.direction === 'asc' ? '▲' : '▼')}
                    </th>
                    <th onClick={() => onRequestSort('cedula_conductor')} className="p-4 text-xs font-bold uppercase text-v-gray tracking-wider cursor-pointer hover:text-v-white select-none">
                      Cédula {tableSort.column === 'cedula_conductor' && (tableSort.direction === 'asc' ? '▲' : '▼')}
                    </th>
                    <th className="p-4 text-xs font-bold uppercase text-v-gray tracking-wider">Teléfono</th>
                    <th onClick={() => onRequestSort('licencia')} className="p-4 text-xs font-bold uppercase text-v-gray tracking-wider cursor-pointer hover:text-v-white select-none">
                      Licencia {tableSort.column === 'licencia' && (tableSort.direction === 'asc' ? '▲' : '▼')}
                    </th>
                    <th onClick={() => onRequestSort('fecha_ingreso')} className="p-4 text-xs font-bold uppercase text-v-gray tracking-wider cursor-pointer hover:text-v-white select-none">
                      Fecha Ingreso {tableSort.column === 'fecha_ingreso' && (tableSort.direction === 'asc' ? '▲' : '▼')}
                    </th>
                    <th className="p-4 text-xs font-bold uppercase text-v-gray tracking-wider">Estado</th>
                  </>
                )}

                {activeReport === 'routes' && (
                  <>
                    <th onClick={() => onRequestSort('codigo_ruta')} className="p-4 text-xs font-bold uppercase text-v-gray tracking-wider cursor-pointer hover:text-v-white select-none">
                      Código {tableSort.column === 'codigo_ruta' && (tableSort.direction === 'asc' ? '▲' : '▼')}
                    </th>
                    <th onClick={() => onRequestSort('nombre_ruta')} className="p-4 text-xs font-bold uppercase text-v-gray tracking-wider cursor-pointer hover:text-v-white select-none">
                      Nombre Ruta {tableSort.column === 'nombre_ruta' && (tableSort.direction === 'asc' ? '▲' : '▼')}
                    </th>
                    <th className="p-4 text-xs font-bold uppercase text-v-gray tracking-wider">Asignación</th>
                    <th className="p-4 text-xs font-bold uppercase text-v-gray tracking-wider">Origen / Destino</th>
                    <th onClick={() => onRequestSort('fecha_programada')} className="p-4 text-xs font-bold uppercase text-v-gray tracking-wider cursor-pointer hover:text-v-white select-none">
                      Fecha Programada {tableSort.column === 'fecha_programada' && (tableSort.direction === 'asc' ? '▲' : '▼')}
                    </th>
                    <th className="p-4 text-xs font-bold uppercase text-v-gray tracking-wider">Estado</th>
                  </>
                )}

                {activeReport === 'maintenances' && (
                  <>
                    <th className="p-4 text-xs font-bold uppercase text-v-gray tracking-wider">Vehículo</th>
                    <th onClick={() => onRequestSort('tipo_mantenimiento')} className="p-4 text-xs font-bold uppercase text-v-gray tracking-wider cursor-pointer hover:text-v-white select-none">
                      Tipo {tableSort.column === 'tipo_mantenimiento' && (tableSort.direction === 'asc' ? '▲' : '▼')}
                    </th>
                    <th className="p-4 text-xs font-bold uppercase text-v-gray tracking-wider">Descripción</th>
                    <th onClick={() => onRequestSort('fecha_mantenimiento')} className="p-4 text-xs font-bold uppercase text-v-gray tracking-wider cursor-pointer hover:text-v-white select-none">
                      Fecha {tableSort.column === 'fecha_mantenimiento' && (tableSort.direction === 'asc' ? '▲' : '▼')}
                    </th>
                    <th onClick={() => onRequestSort('costo_mantenimiento')} className="p-4 text-xs font-bold uppercase text-v-gray tracking-wider cursor-pointer hover:text-v-white select-none">
                      Costo {tableSort.column === 'costo_mantenimiento' && (tableSort.direction === 'asc' ? '▲' : '▼')}
                    </th>
                    <th className="p-4 text-xs font-bold uppercase text-v-gray tracking-wider">Estado</th>
                  </>
                )}

                {['day', 'week', 'month', 'general'].includes(activeReport) && (
                  <>
                    <th onClick={() => onRequestSort('modulo')} className="p-4 text-xs font-bold uppercase text-v-gray tracking-wider cursor-pointer hover:text-v-white select-none">
                      Módulo {tableSort.column === 'modulo' && (tableSort.direction === 'asc' ? '▲' : '▼')}
                    </th>
                    <th onClick={() => onRequestSort('detalle')} className="p-4 text-xs font-bold uppercase text-v-gray tracking-wider cursor-pointer hover:text-v-white select-none">
                      Actividad / Detalle {tableSort.column === 'detalle' && (tableSort.direction === 'asc' ? '▲' : '▼')}
                    </th>
                    <th onClick={() => onRequestSort('fecha')} className="p-4 text-xs font-bold uppercase text-v-gray tracking-wider cursor-pointer hover:text-v-white select-none">
                      Fecha Registro {tableSort.column === 'fecha' && (tableSort.direction === 'asc' ? '▲' : '▼')}
                    </th>
                    <th className="p-4 text-xs font-bold uppercase text-v-gray tracking-wider">Operador / Referencia</th>
                    <th className="p-4 text-xs font-bold uppercase text-v-gray tracking-wider">Atributo</th>
                    <th className="p-4 text-xs font-bold uppercase text-v-gray tracking-wider">Estado</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-v-dark-border">
              {currentItems.map((item, idx) => {
                return (
                  <tr key={item.id_vehiculo || item.id_conductor || item.id_ruta || item.id_mantenimiento || item.id || idx} className="hover:bg-v-dark/20 transition-colors group">
                    {activeReport === 'vehicles' && (
                      <>
                        <td className="p-4 font-mono text-xs font-bold text-primary">{item.placa}</td>
                        <td className="p-4">
                          <div className="font-semibold text-v-white text-sm">{item.marca}</div>
                          <div className="text-v-gray text-xs">{item.modelo}</div>
                        </td>
                        <td className="p-4">
                          <div className="text-v-white text-sm">{item.anio}</div>
                          <div className="text-v-gray text-xs">{item.color || 'Gris'}</div>
                        </td>
                        <td className="p-4">
                          <div className="text-v-white text-sm">{item.tipo_vehiculo}</div>
                          <div className="text-v-gray text-xs">{item.capacidad_pasajeros} pasajeros</div>
                        </td>
                        <td className="p-4">
                          <div className="text-v-white text-sm font-semibold">{item.kilometraje_actual?.toLocaleString()} km</div>
                          <div className="text-[11px] text-v-gray">Límite: {item.kilometraje_limite_mantenimiento?.toLocaleString()} km</div>
                        </td>
                        <td className="p-4">
                          <span className={cn("text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider border", STATUS_STYLES[item.estado_vehiculo])}>
                            {item.estado_vehiculo}
                          </span>
                        </td>
                      </>
                    )}

                    {activeReport === 'drivers' && (
                      <>
                        <td className="p-4">
                          <div className="font-semibold text-v-white text-sm">{item.nombre_conductor} {item.apellido_conductor}</div>
                          <div className="text-v-gray text-[11px] font-mono">ID: {item.id_conductor ? String(item.id_conductor).slice(0,8) : 'N/A'}</div>
                        </td>
                        <td className="p-4 text-v-white text-sm font-mono">{item.cedula_conductor}</td>
                        <td className="p-4 text-v-gray text-sm">{item.telefono_conductor || 'No registrado'}</td>
                        <td className="p-4 text-v-white text-xs font-medium">{item.licencia}</td>
                        <td className="p-4 text-v-gray text-xs">{item.fecha_ingreso}</td>
                        <td className="p-4">
                          <span className={cn("text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider border", STATUS_STYLES[item.estado_conductor] || 'bg-v-dark-border/40 text-v-white border-v-dark-border')}>
                            {item.estado_conductor}
                          </span>
                        </td>
                      </>
                    )}

                    {activeReport === 'routes' && (
                      <>
                        <td className="p-4 font-mono text-xs font-bold text-primary">{item.codigo_ruta}</td>
                        <td className="p-4 text-v-white text-sm font-semibold">{item.nombre_ruta}</td>
                        <td className="p-4 space-y-0.5">
                          <div className="text-xs text-v-white font-medium flex items-center gap-1">
                            <Users size={12} className="text-primary" /> {item.responsable || 'Sin asignar'}
                          </div>
                          <div className="text-[11px] text-v-gray flex items-center gap-1">
                            <Truck size={12} /> {item.extra || 'Sin vehículo'}
                          </div>
                        </td>
                        <td className="p-4 space-y-0.5 max-w-[200px] truncate">
                          <div className="text-xs text-v-white truncate">O: {item.origen}</div>
                          <div className="text-[11px] text-v-gray truncate">D: {item.destino}</div>
                        </td>
                        <td className="p-4 text-v-gray text-xs font-medium">{item.fecha_programada ? String(item.fecha_programada).replace('T', ' ') : ''}</td>
                        <td className="p-4">
                          <span className={cn("text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider border", STATUS_STYLES[item.estado_ruta])}>
                            {item.estado_ruta}
                          </span>
                        </td>
                      </>
                    )}

                    {activeReport === 'maintenances' && (
                      <>
                        <td className="p-4">
                          <div className="font-semibold text-v-white text-xs">{item.extra || 'Unidad Externa'}</div>
                        </td>
                        <td className="p-4">
                          <span className="text-xs font-bold text-primary px-2 py-0.5 rounded bg-primary/10">
                            {item.tipo_mantenimiento}
                          </span>
                        </td>
                        <td className="p-4 text-v-white text-sm max-w-xs truncate" title={item.descripcion_mantenimiento}>
                          {item.descripcion_mantenimiento}
                        </td>
                        <td className="p-4 text-v-gray text-xs">{item.fecha_mantenimiento}</td>
                        <td className="p-4 text-v-white text-sm font-bold">${item.costo_mantenimiento?.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} COP</td>
                        <td className="p-4">
                          <span className={cn("text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider border", STATUS_STYLES[item.estado_mantenimiento])}>
                            {item.estado_mantenimiento}
                          </span>
                        </td>
                      </>
                    )}

                    {['day', 'week', 'month', 'general'].includes(activeReport) && (
                      <>
                        <td className="p-4">
                          <span className={cn(
                            "text-[10px] font-extrabold px-2.5 py-0.5 rounded uppercase tracking-wider",
                            item.modulo === 'Vehículos' && 'bg-blue-500/15 text-blue-400',
                            item.modulo === 'Conductores' && 'bg-teal-500/15 text-teal-400',
                            item.modulo === 'Rutas' && 'bg-purple-500/15 text-purple-400',
                            item.modulo === 'Mantenimientos' && 'bg-amber-500/15 text-amber-400',
                          )}>
                            {item.modulo}
                          </span>
                        </td>
                        <td className="p-4 text-v-white text-sm font-medium">{item.detalle}</td>
                        <td className="p-4 text-v-gray text-xs">{item.fecha ? String(item.fecha).replace('T', ' ') : ''}</td>
                        <td className="p-4 text-v-white text-xs font-semibold">{item.responsable}</td>
                        <td className="p-4 text-v-gray text-xs truncate max-w-[150px]">{item.extra}</td>
                        <td className="p-4">
                          <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider border", STATUS_STYLES[item.estado] || 'bg-v-dark-border/40 text-v-white border-v-dark-border')}>
                            {item.estado}
                          </span>
                        </td>
                      </>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Table pagination footer controls */}
      {!isLoadingPreview && totalPages > 1 && (
        <div className="p-4 flex items-center justify-between border-t border-v-dark-border bg-v-dark/30 text-sm">
          <span className="text-v-gray text-xs">
            Mostrando <span className="font-bold text-v-white">{startIndex + 1}</span> - <span className="font-bold text-v-white">{Math.min(startIndex + itemsPerPage, totalItems)}</span> de <span className="font-bold text-v-white">{totalItems}</span> registros
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onPrevPage}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-v-dark-border bg-v-dark text-v-gray hover:text-v-white disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="flex items-center px-3 font-semibold text-v-white text-xs">
              Pág. {currentPage} de {totalPages}
            </span>
            <button
              type="button"
              onClick={onNextPage}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg border border-v-dark-border bg-v-dark text-v-gray hover:text-v-white disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
