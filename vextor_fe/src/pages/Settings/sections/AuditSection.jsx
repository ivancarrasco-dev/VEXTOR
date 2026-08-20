import React, { useState, useEffect, useCallback } from 'react';
import {
  RefreshCw,
  History,
  Search,
  ChevronLeft,
  ChevronRight,
  Filter,
  CheckCircle2,
  XCircle,
  Calendar,
  Shield,
  Truck,
  Users,
  MapPin,
  Wrench,
  Settings as SettingsIcon,
  BarChart3,
  UserCheck
} from 'lucide-react';
import { Select } from '../../../components/ui/Select';
import { Input } from '../../../components/ui/Input';
import { cn } from '../../../utils/cn';
import axios from 'axios';
import { API_BASE_URL } from '../../../config/api';

const formatFriendlyDate = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleString('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
};

const getModuleIcon = (modulo) => {
  switch (modulo) {
    case 'Seguridad':
      return Shield;
    case 'Vehículos':
      return Truck;
    case 'Conductores':
      return Users;
    case 'Rutas':
      return MapPin;
    case 'Mantenimientos':
      return Wrench;
    case 'Usuarios':
      return UserCheck;
    case 'Configuración':
      return SettingsIcon;
    case 'Reportes':
      return BarChart3;
    default:
      return History;
  }
};

const getActionBadgeColor = (tipo_accion, resultado) => {
  if (resultado === 'FALLIDO') {
    return 'bg-red-500/15 text-red-400 border-red-500/30';
  }
  switch (tipo_accion) {
    case 'LOGIN':
    case 'CREAR':
      return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
    case 'EDITAR':
    case 'CONFIGURACION':
    case 'CAMBIO_CONTRASENA':
      return 'bg-blue-500/15 text-blue-400 border-blue-500/30';
    case 'ELIMINAR':
    case 'REVOCAR_SESION':
      return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
    case 'LOGOUT':
      return 'bg-purple-500/15 text-purple-400 border-purple-500/30';
    default:
      return 'bg-v-dark-border text-v-gray border-v-dark-border';
  }
};

const AuditSection = ({ showToast }) => {
  // Filter states
  const [search, setSearch] = useState('');
  const [tipoAccion, setTipoAccion] = useState('TODOS');
  const [modulo, setModulo] = useState('TODOS');
  const [resultado, setResultado] = useState('TODOS');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');

  // Pagination states
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Data states
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch audit logs with filters and pagination
  const fetchAuditLogs = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = {
        page,
        limit
      };
      if (search.trim()) params.search = search.trim();
      if (tipoAccion !== 'TODOS') params.tipo_accion = tipoAccion;
      if (modulo !== 'TODOS') params.modulo = modulo;
      if (resultado !== 'TODOS') params.resultado = resultado;
      if (fechaInicio) params.fecha_inicio = fechaInicio;
      if (fechaFin) params.fecha_fin = fechaFin;

      const response = await axios.get(`${API_BASE_URL}/api/activities`, { params });

      if (response.data && typeof response.data === 'object' && 'items' in response.data) {
        setLogs(response.data.items || []);
        setTotalItems(response.data.total || 0);
        setTotalPages(response.data.pages || 1);
      } else if (Array.isArray(response.data)) {
        setLogs(response.data);
        setTotalItems(response.data.length);
        setTotalPages(1);
      }
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      showToast('Error al obtener la bitácora de auditoría.');
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, search, tipoAccion, modulo, resultado, fechaInicio, fechaFin, showToast]);

  useEffect(() => {
    fetchAuditLogs();
  }, [fetchAuditLogs]);

  // Reset filters
  const handleResetFilters = () => {
    setSearch('');
    setTipoAccion('TODOS');
    setModulo('TODOS');
    setResultado('TODOS');
    setFechaInicio('');
    setFechaFin('');
    setPage(1);
  };

  return (
    <div className="space-y-6 text-left">
      {/* Header with Title & Refresh */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h4 className="font-bold text-base text-v-white">Bitácora de Auditoría del Sistema</h4>
          <p className="text-xs text-v-gray mt-0.5">
            Registro inmutable de todas las operaciones, accesos y cambios de seguridad realizados en la plataforma.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            fetchAuditLogs();
            showToast('Bitácora de auditoría actualizada.');
          }}
          disabled={isLoading}
          className="text-xs font-bold text-primary hover:underline flex items-center gap-1.5 cursor-pointer shrink-0 self-end sm:self-center bg-v-dark/40 px-3 py-2 rounded-xl border border-v-dark-border hover:bg-v-dark"
        >
          <RefreshCw size={13} className={cn(isLoading && "animate-spin")} /> Refrescar Registro
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-v-dark/20 border border-v-dark-border p-4 rounded-2xl space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold text-v-gray uppercase tracking-wider">
          <Filter size={14} className="text-primary" /> Filtros de Auditoría
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search Box */}
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-v-gray" />
            <input
              type="text"
              placeholder="Buscar por usuario o acción..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full bg-v-dark-soft border border-v-dark-border rounded-xl pl-9 pr-3 py-2 text-xs text-v-white focus:border-primary focus:outline-none transition-colors"
            />
          </div>

          {/* Module Filter */}
          <Select
            value={modulo}
            onChange={(e) => {
              setModulo(e.target.value);
              setPage(1);
            }}
            className="text-xs py-2"
          >
            <option value="TODOS">Todos los Módulos</option>
            <option value="Seguridad">Seguridad</option>
            <option value="Vehículos">Vehículos</option>
            <option value="Conductores">Conductores</option>
            <option value="Rutas">Rutas</option>
            <option value="Mantenimientos">Mantenimientos</option>
            <option value="Usuarios">Usuarios</option>
            <option value="Configuración">Configuración</option>
            <option value="Reportes">Reportes</option>
          </Select>

          {/* Action Filter */}
          <Select
            value={tipoAccion}
            onChange={(e) => {
              setTipoAccion(e.target.value);
              setPage(1);
            }}
            className="text-xs py-2"
          >
            <option value="TODOS">Todas las Acciones</option>
            <option value="LOGIN">Inicios de Sesión (LOGIN)</option>
            <option value="LOGOUT">Cierres de Sesión (LOGOUT)</option>
            <option value="LOGIN_FAILED">Intentos Fallidos (LOGIN_FAILED)</option>
            <option value="CREAR">Creación de Registros</option>
            <option value="EDITAR">Edición de Registros</option>
            <option value="ELIMINAR">Eliminación de Registros</option>
            <option value="REVOCAR_SESION">Revocación de Sesión</option>
            <option value="CAMBIO_CONTRASENA">Cambio de Contraseña</option>
            <option value="CONFIGURACION">Cambios de Configuración</option>
            <option value="REPORTE">Generación de Reportes</option>
          </Select>

          {/* Status Filter */}
          <Select
            value={resultado}
            onChange={(e) => {
              setResultado(e.target.value);
              setPage(1);
            }}
            className="text-xs py-2"
          >
            <option value="TODOS">Todos los Resultados</option>
            <option value="EXITOSO">Exitoso</option>
            <option value="FALLIDO">Fallido</option>
          </Select>
        </div>

        {/* Date Filters & Clear Button */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          <div>
            <label className="text-[10px] font-bold text-v-gray uppercase tracking-wider block mb-1">Fecha Desde</label>
            <Input
              type="date"
              value={fechaInicio}
              onChange={(e) => {
                setFechaInicio(e.target.value);
                setPage(1);
              }}
              className="text-xs py-1.5"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold text-v-gray uppercase tracking-wider block mb-1">Fecha Hasta</label>
            <Input
              type="date"
              value={fechaFin}
              onChange={(e) => {
                setFechaFin(e.target.value);
                setPage(1);
              }}
              className="text-xs py-1.5"
            />
          </div>
          <div className="flex items-end">
            <button
              type="button"
              onClick={handleResetFilters}
              className="w-full text-xs font-semibold text-v-gray hover:text-v-white bg-v-dark/40 hover:bg-v-dark border border-v-dark-border py-2 rounded-xl transition-all cursor-pointer text-center"
            >
              Limpiar Filtros
            </button>
          </div>
        </div>
      </div>

      {/* Audit Logs List */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="p-12 border border-v-dark-border bg-v-dark/10 rounded-2xl text-center text-v-gray">
            <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Cargando registros de auditoría...
          </div>
        ) : logs.length === 0 ? (
          <div className="p-12 border border-v-dark-border bg-v-dark/10 rounded-2xl text-center text-v-gray space-y-2">
            <History size={32} className="mx-auto text-v-gray/50" />
            <p className="font-bold text-v-white text-sm">Sin registros de auditoría que coincidan</p>
            <p className="text-xs text-v-gray max-w-sm mx-auto">
              No se encontraron registros de eventos para los filtros aplicados.
            </p>
          </div>
        ) : (
          logs.map((log) => {
            const Icon = getModuleIcon(log.modulo);
            const badgeColor = getActionBadgeColor(log.tipo_accion, log.resultado);
            const isFailed = log.resultado === 'FALLIDO';

            return (
              <div
                key={log.id_actividad}
                className={cn(
                  "p-4 border rounded-2xl flex items-start gap-3.5 text-sm transition-all duration-200",
                  isFailed
                    ? "border-red-500/20 bg-red-500/5 hover:bg-red-500/10"
                    : "border-v-dark-border bg-v-dark/10 hover:bg-v-dark/30"
                )}
              >
                <div className={cn(
                  "h-10 w-10 rounded-xl border flex items-center justify-center shrink-0 mt-0.5",
                  isFailed
                    ? "bg-red-500/10 border-red-500/30 text-red-400"
                    : "bg-v-dark border-v-dark-border text-primary"
                )}>
                  <Icon size={18} />
                </div>

                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-v-white">{log.modulo}</span>
                      <span className={cn("text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md border tracking-wider", badgeColor)}>
                        {log.tipo_accion}
                      </span>
                      {isFailed && (
                        <span className="text-[10px] font-bold px-2 py-0.5 bg-red-500/20 text-red-400 rounded-md border border-red-500/30 flex items-center gap-1">
                          <XCircle size={10} /> Fallido
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-v-gray font-mono shrink-0">
                      {formatFriendlyDate(log.fecha_hora)}
                    </span>
                  </div>

                  <p className="text-xs text-v-white font-medium leading-relaxed">
                    {log.descripcion}
                  </p>

                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-1 text-[11px] text-v-gray">
                    <span>Usuario: <strong className="text-v-white">{log.nombres_usuario || 'Sistema'}</strong></span>
                    <span>•</span>
                    <span>IP Origen: <strong className="text-v-white font-mono">{log.ip_origen || '127.0.0.1'}</strong></span>
                    {log.id_registro_afectado && (
                      <>
                        <span>•</span>
                        <span>ID Recurso: <strong className="text-v-white font-mono text-[10px]">{log.id_registro_afectado}</strong></span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pagination Bar */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-v-dark-border">
          <div className="text-xs text-v-gray">
            Mostrando <strong className="text-v-white">{logs.length}</strong> de <strong className="text-v-white">{totalItems}</strong> registros
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage(p => Math.max(p - 1, 1))}
              className="p-2 rounded-xl border border-v-dark-border bg-v-dark/40 hover:bg-v-dark text-v-white disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all"
            >
              <ChevronLeft size={16} />
            </button>

            <span className="text-xs font-bold text-v-white px-3 py-1 bg-v-dark border border-v-dark-border rounded-xl">
              Página {page} de {totalPages}
            </span>

            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage(p => Math.min(p + 1, totalPages))}
              className="p-2 rounded-xl border border-v-dark-border bg-v-dark/40 hover:bg-v-dark text-v-white disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all"
            >
              <ChevronRight size={16} />
            </button>

            <Select
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setPage(1);
              }}
              className="text-xs py-1.5 px-2 ml-2"
            >
              <option value={10}>10 por pág.</option>
              <option value={20}>20 por pág.</option>
              <option value={50}>50 por pág.</option>
            </Select>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuditSection;
