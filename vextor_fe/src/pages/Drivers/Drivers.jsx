import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  X,
  AlertTriangle,
  Users,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  Mail,
  User,
  Phone,
  FileText,
  CalendarCheck,
  Navigation,
  MapPin,
  Truck,
  Radio,
  CheckSquare,
  Square
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Select';
import { Badge } from '../../components/ui/Badge';
import { PageHeader } from '../../components/ui/PageHeader';
import { EmptyState } from '../../components/ui/EmptyState';
import { driverService } from './services/driverService';
import { routeService } from '../Routes/services/routeService';
import MapComponent from '../Routes/components/MapComponent';
import { cn } from '../../utils/cn';
import { useTranslation } from 'react-i18next';

const DRIVER_STATUSES = [
  { value: 'DISPONIBLE', label: 'Disponible', variant: 'success' },
  { value: 'EN_RUTA', label: 'En Ruta', variant: 'info', pulse: true },
  { value: 'NO_DISPONIBLE', label: 'No Disponible', variant: 'neutral' },
  { value: 'ACTIVO', label: 'Activo', variant: 'success' },
  { value: 'INACTIVO', label: 'Inactivo', variant: 'danger' },
  { value: 'SUSPENDIDO', label: 'Suspendido', variant: 'warning' }
];

const LICENSE_TYPES = ['A1', 'A2', 'B1', 'B2', 'B3', 'C1', 'C2', 'C3'];

const Drivers = () => {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [drivers, setDrivers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitLoading, setIsSubmitLoading] = useState(false);

  // Search & Filters state
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isTrackingOpen, setIsTrackingOpen] = useState(false);
  const [currentDriver, setCurrentDriver] = useState(null);
  const [driverToDelete, setDriverToDelete] = useState(null);
  // Batch Selection state
  const [selectedDriverIds, setSelectedDriverIds] = useState([]);
  const [isBatchDeleteOpen, setIsBatchDeleteOpen] = useState(false);
  const [batchDeleteResult, setBatchDeleteResult] = useState(null);

  const [trackingDriver, setTrackingDriver] = useState(null);
  const [trackingData, setTrackingData] = useState(null);
  const [isTrackingLoading, setIsTrackingLoading] = useState(false);

  const [formData, setFormData] = useState({
    nombre_conductor: '',
    apellido_conductor: '',
    cedula_conductor: '',
    telefono_conductor: '',
    correo_conductor: '',
    licencia: 'C2',
    estado_conductor: 'DISPONIBLE',
    fecha_ingreso: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [apiError, setApiError] = useState('');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const loadDrivers = async () => {
    setIsLoading(true);
    try {
      const data = await driverService.getDrivers();
      setDrivers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDrivers();
  }, []);

  useEffect(() => {
    if (searchParams.get('action') === 'new' && drivers.length > 0) {
      handleOpenCreate();
      setSearchParams({});
    }
  }, [searchParams, drivers]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.nombre_conductor.trim()) errors.nombre_conductor = 'El nombre es obligatorio';
    if (!formData.apellido_conductor.trim()) errors.apellido_conductor = 'El apellido es obligatorio';

    if (!formData.cedula_conductor.trim()) {
      errors.cedula_conductor = 'La cédula es obligatoria';
    } else if (!/^[0-9]{3,20}$/.test(formData.cedula_conductor.trim())) {
      errors.cedula_conductor = 'Debe tener entre 3 y 20 dígitos numéricos';
    }

    if (formData.correo_conductor && formData.correo_conductor.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.correo_conductor.trim())) {
        errors.correo_conductor = 'El correo electrónico es inválido';
      }
    }

    if (!formData.fecha_ingreso) errors.fecha_ingreso = 'La fecha de ingreso es obligatoria';

    return errors;
  };

  const handleOpenCreate = () => {
    setCurrentDriver(null);
    setFormData({
      nombre_conductor: '',
      apellido_conductor: '',
      cedula_conductor: '',
      telefono_conductor: '',
      correo_conductor: '',
      licencia: 'C2',
      estado_conductor: 'DISPONIBLE',
      fecha_ingreso: new Date().toISOString().split('T')[0]
    });
    setFormErrors({});
    setApiError('');
    setIsFormOpen(true);
  };

  const handleOpenEdit = (driver) => {
    setCurrentDriver(driver);
    setFormData({
      nombre_conductor: driver.nombre_conductor,
      apellido_conductor: driver.apellido_conductor,
      cedula_conductor: driver.cedula_conductor,
      telefono_conductor: driver.telefono_conductor || '',
      correo_conductor: driver.correo_conductor || '',
      licencia: driver.licencia,
      estado_conductor: driver.estado_conductor,
      fecha_ingreso: driver.fecha_ingreso
    });
    setFormErrors({});
    setApiError('');
    setIsFormOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setIsSubmitLoading(true);
    setApiError('');

    try {
      if (currentDriver) {
        await driverService.updateDriver(currentDriver.id_conductor, formData);
      } else {
        await driverService.createDriver(formData);
      }
      setIsFormOpen(false);
      loadDrivers();
    } catch (err) {
      setApiError(err.message || 'Ocurrió un error al procesar el conductor.');
    } finally {
      setIsSubmitLoading(false);
    }
  };

  const handleOpenTracking = async (driver) => {
    setTrackingDriver(driver);
    setTrackingData(null);
    setIsTrackingLoading(true);
    setIsTrackingOpen(true);

    try {
      const activeTrackings = await routeService.getActiveTracking();
      if (Array.isArray(activeTrackings)) {
        const found = activeTrackings.find(
          tr => tr.conductor?.id_conductor === driver.id_conductor || tr.conductor?.cedula === driver.cedula_conductor
        );
        if (found) setTrackingData(found);
      }
    } catch (err) {
      console.warn('Error loading driver tracking data:', err);
    } finally {
      setIsTrackingLoading(false);
    }
  };

  const handleOpenDelete = (driver) => {
    setDriverToDelete(driver);
    setApiError('');
    setIsDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    setIsSubmitLoading(true);
    setApiError('');
    try {
      await driverService.deleteDriver(driverToDelete.id_conductor);
      setIsDeleteOpen(false);
      setDriverToDelete(null);
      loadDrivers();
    } catch (err) {
      setApiError(err.message || 'Error al eliminar el conductor.');
    } finally {
      setIsSubmitLoading(false);
    }
  };

  const filteredDrivers = drivers.filter(driver => {
    const query = search.trim().toLowerCase();
    const matchesSearch =
      driver.nombre_conductor.toLowerCase().includes(query) ||
      driver.apellido_conductor.toLowerCase().includes(query) ||
      driver.cedula_conductor.includes(query) ||
      driver.licencia.toLowerCase().includes(query) ||
      (driver.correo_conductor && driver.correo_conductor.toLowerCase().includes(query));

    const matchesStatus = statusFilter ? driver.estado_conductor === statusFilter : true;
    return matchesSearch && matchesStatus;
  });

  const totalItems = filteredDrivers.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredDrivers.slice(indexOfFirstItem, indexOfLastItem);

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  useEffect(() => {
    setCurrentPage(1);
    setSelectedDriverIds([]);
  }, [search, statusFilter]);

  const handleSelectAllVisible = () => {
    const visibleIds = currentItems.map(d => d.id_conductor);
    const allSelected = visibleIds.every(id => selectedDriverIds.includes(id));
    if (allSelected) {
      setSelectedDriverIds(prev => prev.filter(id => !visibleIds.includes(id)));
    } else {
      setSelectedDriverIds(prev => Array.from(new Set([...prev, ...visibleIds])));
    }
  };

  const handleToggleSelectDriver = (id) => {
    setSelectedDriverIds(prev =>
      prev.includes(id) ? prev.filter(dId => dId !== id) : [...prev, id]
    );
  };

  const handleConfirmBatchDelete = async () => {
    setIsSubmitLoading(true);
    setApiError('');
    try {
      const res = await driverService.batchDeleteDrivers(selectedDriverIds);
      setBatchDeleteResult(res);
      setSelectedDriverIds([]);
      loadDrivers();
    } catch (err) {
      setApiError(err.message || 'Error en la eliminación masiva.');
    } finally {
      setIsSubmitLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Page Header */}
      <PageHeader
        title={t('drivers.title', 'Gestión de Conductores')}
        subtitle={t('drivers.subtitle', 'Control del personal de conducción, licencias, datos de contacto y estado operativo.')}
        badge={
          <Badge variant="emerald" pulse size="xs">
            {drivers.length} Operadores
          </Badge>
        }
        actions={
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {selectedDriverIds.length > 0 && (
              <Button
                variant="outline"
                onClick={() => { setBatchDeleteResult(null); setIsBatchDeleteOpen(true); }}
                className="bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white border-red-500/20 cursor-pointer flex items-center gap-2"
              >
                <Trash2 size={16} /> Eliminar ({selectedDriverIds.length})
              </Button>
            )}
            <Button
              variant="primary"
              onClick={handleOpenCreate}
              className="flex items-center gap-2 cursor-pointer shrink-0"
            >
              <Plus size={18} /> {t('drivers.addBtn', 'Registrar Conductor')}
            </Button>
          </div>
        }
      />

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-4 bg-v-dark-soft p-4 rounded-2xl border border-v-dark-border shadow-sm">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-v-gray" />
          <input
            type="text"
            placeholder={t('drivers.placeholderSearch', 'Buscar por nombre, cédula o correo...')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-v-dark border border-v-dark-border focus:border-primary text-v-white text-sm pl-10 pr-4 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all font-medium"
          />
        </div>

        <div className="flex gap-3">
          <div className="flex items-center gap-1.5 bg-v-dark border border-v-dark-border px-3.5 py-2 rounded-xl shrink-0">
            <SlidersHorizontal size={15} className="text-v-gray" />
            <span className="text-v-gray text-xs font-bold uppercase font-mono">Estado:</span>
          </div>

          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-48"
          >
            <option value="">Todos los Estados</option>
            {DRIVER_STATUSES.map(st => (
              <option key={st.value} value={st.value}>{st.label}</option>
            ))}
          </Select>
        </div>
      </div>

      {/* Main Table Content */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center min-h-[350px] bg-v-dark-soft border border-v-dark-border rounded-2xl p-12">
          <div className="h-10 w-10 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-v-gray text-sm font-medium">Cargando personal de conducción...</p>
        </div>
      ) : filteredDrivers.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No se encontraron conductores"
          description="No existen registros de conductores que coincidan con la búsqueda o filtro seleccionado."
          action={
            (search || statusFilter) ? (
              <Button
                variant="outline"
                onClick={() => { setSearch(''); setStatusFilter(''); }}
                className="cursor-pointer"
              >
                Limpiar Filtros
              </Button>
            ) : (
              <Button
                variant="primary"
                onClick={handleOpenCreate}
                className="cursor-pointer"
              >
                <Plus size={16} className="mr-1.5" /> Registrar Primer Conductor
              </Button>
            )
          }
        />
      ) : (
        <div className="bg-v-dark-soft border border-v-dark-border rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto w-full custom-scrollbar">
            <table className="w-full text-left border-collapse min-w-[650px]">
              <thead>
                <tr className="border-b border-v-dark-border bg-v-dark/40 text-xs font-bold uppercase text-v-gray font-mono tracking-wider">
                  <th className="p-4 w-10">
                    <button
                      type="button"
                      onClick={handleSelectAllVisible}
                      className="text-v-gray hover:text-v-white cursor-pointer"
                      title="Seleccionar / deseleccionar todos los visibles"
                    >
                      {currentItems.length > 0 && currentItems.every(d => selectedDriverIds.includes(d.id_conductor)) ? (
                        <CheckSquare size={18} className="text-primary" />
                      ) : (
                        <Square size={18} />
                      )}
                    </button>
                  </th>
                  <th className="p-4">Cédula</th>
                  <th className="p-4">Conductor</th>
                  <th className="p-4">Contacto</th>
                  <th className="p-4">Licencia</th>
                  <th className="p-4">Fecha Ingreso</th>
                  <th className="p-4">Estado Operativo</th>
                  <th className="p-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-v-dark-border">
                {currentItems.map((driver) => {
                  const statusInfo = DRIVER_STATUSES.find(st => st.value === driver.estado_conductor) || { label: driver.estado_conductor, variant: 'neutral' };
                  const isSelected = selectedDriverIds.includes(driver.id_conductor);
                  return (
                    <tr key={driver.id_conductor} className={cn("hover:bg-v-dark/30 transition-colors group", isSelected && "bg-primary/5")}>
                      <td className="p-4">
                        <button
                          type="button"
                          onClick={() => handleToggleSelectDriver(driver.id_conductor)}
                          className="text-v-gray hover:text-v-white cursor-pointer"
                        >
                          {isSelected ? (
                            <CheckSquare size={18} className="text-primary" />
                          ) : (
                            <Square size={18} />
                          )}
                        </button>
                      </td>
                      <td className="p-4">
                        <span className="font-mono text-xs font-extrabold px-3 py-1.5 bg-v-dark border border-v-dark-border rounded-lg text-primary shadow-sm">
                          {driver.cedula_conductor}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="font-bold text-v-white text-sm">
                          {driver.nombre_conductor} {driver.apellido_conductor}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="text-v-white text-xs font-medium flex items-center gap-1.5">
                          <Mail size={13} className="text-primary shrink-0" />
                          <span className="truncate">{driver.correo_conductor || 'Sin correo'}</span>
                        </div>
                        <div className="text-v-gray text-xs mt-0.5 font-mono">{driver.telefono_conductor || 'Sin teléfono'}</div>
                      </td>
                      <td className="p-4">
                        <span className="text-xs font-mono font-bold px-2 py-1 bg-v-dark border border-v-dark-border rounded text-v-white">
                          {driver.licencia}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="text-v-white text-sm font-medium font-mono">{driver.fecha_ingreso}</div>
                      </td>
                      <td className="p-4">
                        <Badge variant={statusInfo.variant} pulse={statusInfo.pulse}>
                          {statusInfo.label}
                        </Badge>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleOpenTracking(driver)}
                            className="p-2 hover:bg-emerald-500/10 border border-transparent hover:border-emerald-500/20 rounded-xl text-v-gray hover:text-emerald-400 transition-all cursor-pointer"
                            title="Monitoreo GPS Conductor"
                          >
                            <Navigation size={16} className="rotate-45" />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(driver)}
                            className="p-2 hover:bg-v-dark border border-transparent hover:border-v-dark-border rounded-xl text-v-gray hover:text-v-white transition-all cursor-pointer"
                            title="Editar Conductor"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleOpenDelete(driver)}
                            className="p-2 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 rounded-xl text-v-gray hover:text-red-400 transition-all cursor-pointer"
                            title="Eliminar Conductor"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="p-4 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-v-dark-border bg-v-dark/30 text-xs text-v-gray font-medium">
              <span>
                Mostrando <strong className="text-v-white">{indexOfFirstItem + 1}</strong> - <strong className="text-v-white">{Math.min(indexOfLastItem, totalItems)}</strong> de <strong className="text-v-white">{totalItems}</strong> conductores
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrevPage}
                  disabled={currentPage === 1}
                  className="p-2 rounded-xl border border-v-dark-border bg-v-dark text-v-gray hover:text-v-white disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="px-3 font-bold text-v-white font-mono">
                  {currentPage} / {totalPages}
                </span>
                <button
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-xl border border-v-dark-border bg-v-dark text-v-gray hover:text-v-white disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* CREATE & EDIT MODAL */}
      <AnimatePresence>
        {isFormOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsFormOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-2xl bg-v-dark-soft border border-v-dark-border rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col z-10 text-left"
            >
              <div className="flex justify-between items-center px-6 py-5 border-b border-v-dark-border bg-v-dark/20">
                <div>
                  <h3 className="text-xl font-extrabold text-v-white">
                    {currentDriver ? 'Editar Conductor' : 'Registrar Nuevo Conductor'}
                  </h3>
                  <p className="text-xs text-v-gray mt-0.5">
                    {currentDriver ? 'Actualice el expediente del conductor.' : 'Defina las credenciales del nuevo operador de flota.'}
                  </p>
                </div>
                <button
                  onClick={() => setIsFormOpen(false)}
                  className="p-2 text-v-gray hover:text-v-white hover:bg-v-dark-border/40 rounded-xl transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleFormSubmit} className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar">
                {apiError && (
                  <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs font-semibold flex items-start gap-2.5">
                    <AlertTriangle className="shrink-0 mt-0.5" size={16} />
                    <span>{apiError}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-v-gray font-mono">Nombre(s)</label>
                    <input
                      type="text"
                      name="nombre_conductor"
                      placeholder="Juan"
                      value={formData.nombre_conductor}
                      onChange={handleInputChange}
                      className={cn(
                        "w-full bg-v-dark border focus:border-primary text-v-white text-sm px-3.5 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all font-medium",
                        formErrors.nombre_conductor ? "border-red-500" : "border-v-dark-border"
                      )}
                    />
                    {formErrors.nombre_conductor && <p className="text-xs text-red-400 mt-0.5 font-medium">{formErrors.nombre_conductor}</p>}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-v-gray font-mono">Apellido(s)</label>
                    <input
                      type="text"
                      name="apellido_conductor"
                      placeholder="Pérez"
                      value={formData.apellido_conductor}
                      onChange={handleInputChange}
                      className={cn(
                        "w-full bg-v-dark border focus:border-primary text-v-white text-sm px-3.5 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all font-medium",
                        formErrors.apellido_conductor ? "border-red-500" : "border-v-dark-border"
                      )}
                    />
                    {formErrors.apellido_conductor && <p className="text-xs text-red-400 mt-0.5 font-medium">{formErrors.apellido_conductor}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-v-gray font-mono">Cédula / DNI</label>
                    <input
                      type="text"
                      name="cedula_conductor"
                      placeholder="1234567890"
                      value={formData.cedula_conductor}
                      onChange={handleInputChange}
                      className={cn(
                        "w-full bg-v-dark border focus:border-primary text-v-white text-sm px-3.5 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all font-mono",
                        formErrors.cedula_conductor ? "border-red-500" : "border-v-dark-border"
                      )}
                    />
                    {formErrors.cedula_conductor && <p className="text-xs text-red-400 mt-0.5 font-medium">{formErrors.cedula_conductor}</p>}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-v-gray font-mono">Teléfono</label>
                    <input
                      type="text"
                      name="telefono_conductor"
                      placeholder="3121234567"
                      value={formData.telefono_conductor}
                      onChange={handleInputChange}
                      className="w-full bg-v-dark border border-v-dark-border focus:border-primary text-v-white text-sm px-3.5 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-v-gray font-mono">Correo Electrónico</label>
                  <input
                    type="email"
                    name="correo_conductor"
                    placeholder="conductor@empresa.com"
                    value={formData.correo_conductor}
                    onChange={handleInputChange}
                    className={cn(
                      "w-full bg-v-dark border focus:border-primary text-v-white text-sm px-3.5 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all font-medium",
                      formErrors.correo_conductor ? "border-red-500" : "border-v-dark-border"
                    )}
                  />
                  {formErrors.correo_conductor && <p className="text-xs text-red-400 mt-0.5 font-medium">{formErrors.correo_conductor}</p>}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-v-gray font-mono">Categoría Licencia</label>
                    <Select
                      name="licencia"
                      value={formData.licencia}
                      onChange={handleInputChange}
                    >
                      {LICENSE_TYPES.map(lic => (
                        <option key={lic} value={lic}>{lic}</option>
                      ))}
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-v-gray font-mono">Fecha Ingreso</label>
                    <input
                      type="date"
                      name="fecha_ingreso"
                      value={formData.fecha_ingreso}
                      onChange={handleInputChange}
                      className={cn(
                        "w-full bg-v-dark border focus:border-primary text-v-white text-sm px-3.5 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all font-mono",
                        formErrors.fecha_ingreso ? "border-red-500" : "border-v-dark-border"
                      )}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-v-gray font-mono">Estado Laboral</label>
                  <Select
                    name="estado_conductor"
                    value={formData.estado_conductor}
                    onChange={handleInputChange}
                  >
                    {DRIVER_STATUSES.map(st => (
                      <option key={st.value} value={st.value}>{st.label}</option>
                    ))}
                  </Select>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-v-dark-border">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setIsFormOpen(false)}
                    disabled={isSubmitLoading}
                    className="cursor-pointer"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    isLoading={isSubmitLoading}
                    className="cursor-pointer"
                  >
                    {currentDriver ? 'Guardar Cambios' : 'Registrar'}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* TRACKING MODAL */}
      <AnimatePresence>
        {isTrackingOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsTrackingOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-3xl bg-v-dark-soft border border-v-dark-border rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col z-10 text-left"
            >
              <div className="flex justify-between items-center px-6 py-4 border-b border-v-dark-border bg-v-dark/20">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                    <Navigation size={20} className="rotate-45" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-v-white">
                      Rastreo Conductor: {trackingDriver?.nombre_conductor} {trackingDriver?.apellido_conductor}
                    </h3>
                    <p className="text-xs text-v-gray mt-0.5">
                      Cédula: <span className="font-mono text-v-white">{trackingDriver?.cedula_conductor}</span> — Licencia: <span className="text-v-white">{trackingDriver?.licencia}</span>
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsTrackingOpen(false)}
                  className="p-2 text-v-gray hover:text-v-white hover:bg-v-dark-border/40 rounded-xl transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-6 space-y-4 overflow-y-auto custom-scrollbar flex-1">
                {isTrackingLoading ? (
                  <div className="flex flex-col items-center justify-center py-16">
                    <div className="h-10 w-10 border-4 border-primary border-t-transparent rounded-full animate-spin mb-3" />
                    <p className="text-v-gray text-xs font-medium">Consultando posición GPS en tiempo real...</p>
                  </div>
                ) : trackingData ? (
                  <div className="space-y-4">
                    <div className="p-4 bg-v-dark border border-v-dark-border rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <Badge variant="success" pulse size="sm">
                          Ruta Activa
                        </Badge>
                        <div>
                          <p className="text-xs font-bold text-v-white">{trackingData.codigo_ruta} — {trackingData.nombre_ruta}</p>
                          <p className="text-[11px] text-v-gray mt-0.5">
                            Vehículo: <span className="text-v-white font-mono font-bold">{trackingData.vehiculo?.placa}</span>
                          </p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-[10px] text-v-gray block uppercase font-bold font-mono">Velocidad</span>
                        <span className="text-xl font-extrabold text-emerald-400 font-mono">
                          {trackingData.velocidad || 0} <span className="text-xs text-v-gray font-normal font-sans">km/h</span>
                        </span>
                      </div>
                    </div>

                    <div className="h-80 relative rounded-2xl overflow-hidden border border-v-dark-border shadow-xl">
                      <MapComponent
                        routes={[]}
                        activeRoute={{
                          origen: trackingData.origen,
                          destino: trackingData.destino,
                          nombre_ruta: trackingData.nombre_ruta,
                          codigo_ruta: trackingData.codigo_ruta
                        }}
                        driverPosition={{
                          lat: trackingData.latitud,
                          lng: trackingData.longitud,
                          speed: trackingData.velocidad,
                          heading: trackingData.heading
                        }}
                        isNavigationMode={true}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="py-12 px-4 text-center space-y-3 bg-v-dark/40 border border-v-dark-border rounded-2xl">
                    <Truck size={36} className="text-v-gray mx-auto opacity-50" />
                    <h4 className="text-base font-bold text-v-white">Sin Servicio en Progreso</h4>
                    <p className="text-xs text-v-gray max-w-md mx-auto">
                      El conductor actualmente no posee una ruta activa en emisión GPS.
                    </p>
                  </div>
                )}
              </div>

              <div className="p-4 border-t border-v-dark-border bg-v-dark/20 flex justify-end">
                <Button variant="ghost" onClick={() => setIsTrackingOpen(false)} className="cursor-pointer">
                  Cerrar
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* BATCH DELETE CONFIRMATION MODAL */}
      <AnimatePresence>
        {isBatchDeleteOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsBatchDeleteOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-lg bg-v-dark-soft border border-v-dark-border rounded-2xl shadow-2xl p-6 z-10 space-y-5 text-left"
            >
              <div className="flex gap-4">
                <div className="h-12 w-12 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 flex items-center justify-center shrink-0">
                  <AlertTriangle size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-v-white">¿Eliminar conductores seleccionados?</h3>
                  <p className="text-xs text-v-gray mt-1 leading-relaxed">
                    Está a punto de procesar la eliminación masiva de <strong className="text-v-white font-bold">{selectedDriverIds.length}</strong> conductor(es). Los operadores asignados a rutas o con historial en el sistema no serán eliminados.
                  </p>
                </div>
              </div>

              {batchDeleteResult && (
                <div className="p-4 bg-v-dark border border-v-dark-border rounded-xl space-y-2 text-xs">
                  <p className="font-bold text-v-white">{batchDeleteResult.message}</p>
                  {batchDeleteResult.failed_items && batchDeleteResult.failed_items.length > 0 && (
                    <div className="space-y-1 max-h-32 overflow-y-auto custom-scrollbar pt-2 border-t border-v-dark-border">
                      <span className="text-red-400 font-bold block">No eliminados ({batchDeleteResult.failed_items.length}):</span>
                      {batchDeleteResult.failed_items.map((item, idx) => (
                        <div key={idx} className="text-v-gray flex justify-between gap-2">
                          <span className="font-bold text-v-white">{item.nombre || item.id}</span>
                          <span className="text-red-300">{item.reason}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {apiError && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs font-semibold flex items-start gap-2">
                  <AlertTriangle className="shrink-0 mt-0.5" size={14} />
                  <span>{apiError}</span>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <Button
                  variant="ghost"
                  onClick={() => setIsBatchDeleteOpen(false)}
                  disabled={isSubmitLoading}
                  className="cursor-pointer"
                >
                  {batchDeleteResult ? 'Cerrar' : 'Cancelar'}
                </Button>
                {!batchDeleteResult && (
                  <Button
                    variant="outline"
                    onClick={handleConfirmBatchDelete}
                    isLoading={isSubmitLoading}
                    className="bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white border-red-500/20 cursor-pointer"
                  >
                    Confirmar Eliminación Masiva
                  </Button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DELETE CONFIRMATION MODAL */}
      <AnimatePresence>
        {isDeleteOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDeleteOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md bg-v-dark-soft border border-v-dark-border rounded-2xl shadow-2xl p-6 z-10 space-y-6 text-left"
            >
              <div className="flex gap-4">
                <div className="h-12 w-12 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 flex items-center justify-center shrink-0">
                  <AlertTriangle size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-v-white">¿Confirmar baja de conductor?</h3>
                  <p className="text-xs text-v-gray mt-1.5 leading-relaxed">
                    Está a punto de eliminar el conductor <strong className="text-v-white font-bold">{driverToDelete?.nombre_conductor} {driverToDelete?.apellido_conductor}</strong>.
                  </p>
                </div>
              </div>

              {apiError && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs font-semibold flex items-start gap-2">
                  <AlertTriangle className="shrink-0 mt-0.5" size={14} />
                  <span>{apiError}</span>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <Button variant="ghost" onClick={() => setIsDeleteOpen(false)} disabled={isSubmitLoading} className="cursor-pointer">
                  Cancelar
                </Button>
                <Button
                  variant="outline"
                  onClick={handleConfirmDelete}
                  isLoading={isSubmitLoading}
                  className="bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white border-red-500/20 cursor-pointer"
                >
                  Confirmar Eliminar
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Drivers;
