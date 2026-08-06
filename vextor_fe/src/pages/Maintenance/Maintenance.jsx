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
  Info,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  Wrench,
  DollarSign,
  Calendar,
  Gauge,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Select';
import { maintenanceService } from '../../services/maintenanceService';
import { vehicleService } from '../../services/vehicleService';
import { cn } from '../../utils/cn';
import { useTranslation } from 'react-i18next';

const MAINTENANCE_STATUSES = [
  { value: 'PROGRAMADO', label: 'Programado', color: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
  { value: 'EN_PROCESO', label: 'En Proceso', color: 'bg-amber-500/10 text-amber-500 border-amber-500/20' },
  { value: 'COMPLETADO', label: 'Completado', color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' },
  { value: 'CANCELADO', label: 'Cancelado', color: 'bg-red-500/10 text-red-500 border-red-500/20' }
];

const MAINTENANCE_TYPES = ['PREVENTIVO', 'CORRECTIVO', 'PREDICTIVO'];

const Maintenance = () => {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [maintenances, setMaintenances] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitLoading, setIsSubmitLoading] = useState(false);

  // Search & Filters state
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [currentMaintenance, setCurrentMaintenance] = useState(null); // null for Create, maintenance object for Edit
  const [maintenanceToDelete, setMaintenanceToDelete] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    id_vehiculo: '',
    tipo_mantenimiento: 'PREVENTIVO',
    descripcion_mantenimiento: '',
    fecha_mantenimiento: '',
    costo_mantenimiento: '',
    kilometraje_mantenimiento: '',
    estado_mantenimiento: 'PROGRAMADO'
  });
  const [formErrors, setFormErrors] = useState({});
  const [apiError, setApiError] = useState('');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Load vehicles and maintenance records
  const loadData = async () => {
    setIsLoading(true);
    try {
      const vData = await vehicleService.getVehicles();
      const mData = await maintenanceService.getMaintenances();
      setVehicles(vData);
      setMaintenances(mData);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Handle URL query parameters to trigger "Create Maintenance" from Dashboard Quick Action
  useEffect(() => {
    if (searchParams.get('action') === 'new' && vehicles.length > 0) {
      handleOpenCreate();
      setSearchParams({});
    }
  }, [searchParams, vehicles]);

  // Form field change handler
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Form validator
  const validateForm = () => {
    const errors = {};

    if (!formData.id_vehiculo) {
      errors.id_vehiculo = 'Debe seleccionar un vehículo';
    }

    if (!formData.descripcion_mantenimiento.trim()) {
      errors.descripcion_mantenimiento = 'La descripción es obligatoria';
    }

    if (!formData.fecha_mantenimiento) {
      errors.fecha_mantenimiento = 'La fecha es obligatoria';
    }

    const costoNum = parseFloat(formData.costo_mantenimiento);
    if (!formData.costo_mantenimiento) {
      errors.costo_mantenimiento = 'El costo es obligatorio';
    } else if (isNaN(costoNum) || costoNum < 0) {
      errors.costo_mantenimiento = 'Debe ser mayor o igual a 0';
    }

    const kmNum = parseInt(formData.kilometraje_mantenimiento, 10);
    if (!formData.kilometraje_mantenimiento) {
      errors.kilometraje_mantenimiento = 'El kilometraje es obligatorio';
    } else if (isNaN(kmNum) || kmNum < 0) {
      errors.kilometraje_mantenimiento = 'Debe ser mayor o igual a 0';
    }

    return errors;
  };

  // Open Create Form modal
  const handleOpenCreate = () => {
    setCurrentMaintenance(null);
    setFormData({
      id_vehiculo: vehicles[0]?.id_vehiculo || '',
      tipo_mantenimiento: 'PREVENTIVO',
      descripcion_mantenimiento: '',
      fecha_mantenimiento: new Date().toISOString().split('T')[0],
      costo_mantenimiento: '',
      kilometraje_mantenimiento: '',
      estado_mantenimiento: 'PROGRAMADO'
    });
    setFormErrors({});
    setApiError('');
    setIsFormOpen(true);
  };

  // Open Edit Form modal
  const handleOpenEdit = (maint) => {
    setCurrentMaintenance(maint);
    setFormData({
      id_vehiculo: maint.id_vehiculo,
      tipo_mantenimiento: maint.tipo_mantenimiento,
      descripcion_mantenimiento: maint.descripcion_mantenimiento,
      fecha_mantenimiento: maint.fecha_mantenimiento,
      costo_mantenimiento: maint.costo_mantenimiento.toString(),
      kilometraje_mantenimiento: maint.kilometraje_mantenimiento.toString(),
      estado_mantenimiento: maint.estado_mantenimiento
    });
    setFormErrors({});
    setApiError('');
    setIsFormOpen(true);
  };

  // Submit Form (Create / Edit)
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
      if (currentMaintenance) {
        await maintenanceService.updateMaintenance(currentMaintenance.id_mantenimiento, formData);
      } else {
        await maintenanceService.createMaintenance(formData);
      }
      setIsFormOpen(false);
      loadData();
    } catch (err) {
      setApiError(err.message || 'Ocurrió un error al procesar el mantenimiento.');
    } finally {
      setIsSubmitLoading(false);
    }
  };

  // Open Delete confirmation dialog
  const handleOpenDelete = (maint) => {
    setMaintenanceToDelete(maint);
    setApiError('');
    setIsDeleteOpen(true);
  };

  // Confirm Delete
  const handleConfirmDelete = async () => {
    setIsSubmitLoading(true);
    setApiError('');
    try {
      await maintenanceService.deleteMaintenance(maintenanceToDelete.id_mantenimiento);
      setIsDeleteOpen(false);
      setMaintenanceToDelete(null);
      loadData();
    } catch (err) {
      setApiError(err.message || 'Error al eliminar el registro de mantenimiento.');
    } finally {
      setIsSubmitLoading(false);
    }
  };

  // Helper to find vehicle info
  const getVehicleInfo = (id_vehiculo) => {
    return vehicles.find(v => v.id_vehiculo === id_vehiculo) || { placa: 'S/P', marca: 'Desconocido', modelo: 'Desconocido' };
  };

  // Filter & Search Logic
  const filteredMaintenances = maintenances.filter(maint => {
    const vInfo = getVehicleInfo(maint.id_vehiculo);
    const query = search.toLowerCase();

    const matchesSearch =
      vInfo.placa.toLowerCase().includes(query) ||
      vInfo.marca.toLowerCase().includes(query) ||
      vInfo.modelo.toLowerCase().includes(query) ||
      maint.descripcion_mantenimiento.toLowerCase().includes(query);

    const matchesStatus = statusFilter ? maint.estado_mantenimiento === statusFilter : true;
    const matchesType = typeFilter ? maint.tipo_mantenimiento === typeFilter : true;

    return matchesSearch && matchesStatus && matchesType;
  });

  // Pagination Logic
  const totalItems = filteredMaintenances.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredMaintenances.slice(indexOfFirstItem, indexOfLastItem);

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, typeFilter]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-v-dark-soft p-6 rounded-2xl border border-v-dark-border">
        <div>
          <h2 className="text-2xl font-bold text-v-white">{t('maintenance.title')}</h2>
          <p className="text-v-gray text-sm mt-0.5">{t('maintenance.subtitle')}</p>
        </div>
        <Button
          variant="primary"
          onClick={handleOpenCreate}
          disabled={vehicles.length === 0}
          className="flex items-center gap-2 self-stretch sm:self-auto shrink-0"
        >
          <Plus size={18} /> {t('maintenance.addBtn')}
        </Button>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col md:flex-row gap-4 bg-v-dark-soft p-4 rounded-xl border border-v-dark-border">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-v-gray" />
          <input
            type="text"
            placeholder="Buscar por placa, vehículo o descripción de taller..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-v-dark border border-v-dark-border focus:border-primary text-v-white text-sm pl-10 pr-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all"
          />
        </div>

        {/* Filters dropdowns */}
        <div className="flex flex-wrap sm:flex-nowrap gap-3">
          <div className="flex items-center gap-1.5 bg-v-dark border border-v-dark-border px-3 py-1.5 rounded-lg shrink-0">
            <SlidersHorizontal size={15} className="text-v-gray" />
            <span className="text-v-gray text-xs font-medium">Filtros:</span>
          </div>

          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-48"
          >
            <option value="">Todos los estados</option>
            {MAINTENANCE_STATUSES.map(st => (
              <option key={st.value} value={st.value}>{st.label}</option>
            ))}
          </Select>

          <Select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-48"
          >
            <option value="">Todos los tipos</option>
            {MAINTENANCE_TYPES.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </Select>
        </div>
      </div>

      {/* Main Table */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh] bg-v-dark-soft border border-v-dark-border rounded-2xl p-12">
          <div className="h-10 w-10 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-v-gray text-sm">Cargando historial de mantenimientos...</p>
        </div>
      ) : filteredMaintenances.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh] bg-v-dark-soft border border-v-dark-border rounded-2xl p-12 text-center">
          <Info size={40} className="text-v-gray mb-4" />
          <h3 className="text-lg font-bold text-v-white mb-1">No se encontraron mantenimientos</h3>
          <p className="text-v-gray text-sm max-w-sm">Intente modificar los filtros o registre una nueva orden de servicio técnico.</p>
        </div>
      ) : (
        <div className="bg-v-dark-soft border border-v-dark-border rounded-2xl overflow-hidden shadow-xl">
          {/* Responsive Table Wrapper */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-v-dark-border bg-v-dark/40">
                  <th className="p-4 text-xs font-bold uppercase text-v-gray tracking-wider">Vehículo</th>
                  <th className="p-4 text-xs font-bold uppercase text-v-gray tracking-wider">Tipo</th>
                  <th className="p-4 text-xs font-bold uppercase text-v-gray tracking-wider">Descripción del Servicio</th>
                  <th className="p-4 text-xs font-bold uppercase text-v-gray tracking-wider">Fecha / Kilometraje</th>
                  <th className="p-4 text-xs font-bold uppercase text-v-gray tracking-wider">Costo</th>
                  <th className="p-4 text-xs font-bold uppercase text-v-gray tracking-wider">Estado</th>
                  <th className="p-4 text-xs font-bold uppercase text-v-gray tracking-wider text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-v-dark-border">
                {currentItems.map((maint) => {
                  const vInfo = getVehicleInfo(maint.id_vehiculo);
                  const statusInfo = MAINTENANCE_STATUSES.find(st => st.value === maint.estado_mantenimiento) || { label: maint.estado_mantenimiento, color: 'bg-v-dark border-v-dark-border text-v-white' };
                  return (
                    <tr key={maint.id_mantenimiento} className="hover:bg-v-dark/20 transition-colors group">
                      <td className="p-4">
                        <div className="flex flex-col gap-1.5">
                          <span className="font-mono text-[11px] font-bold px-2 py-0.5 bg-v-dark border border-v-dark-border rounded-md text-primary w-fit">
                            {vInfo.placa}
                          </span>
                          <span className="text-v-white text-sm font-semibold">{vInfo.marca} {vInfo.modelo}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={cn(
                          "text-[11px] font-bold px-2 py-1 rounded-md border",
                          maint.tipo_mantenimiento === 'PREVENTIVO' ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/10" :
                          maint.tipo_mantenimiento === 'CORRECTIVO' ? "bg-red-500/10 text-red-500 border-red-500/10" : "bg-blue-500/10 text-blue-500 border-blue-500/10"
                        )}>
                          {maint.tipo_mantenimiento}
                        </span>
                      </td>
                      <td className="p-4">
                        <p className="text-v-white text-sm max-w-xs truncate" title={maint.descripcion_mantenimiento}>
                          {maint.descripcion_mantenimiento}
                        </p>
                      </td>
                      <td className="p-4">
                        <div className="text-v-white text-sm">{maint.fecha_mantenimiento}</div>
                        <div className="text-v-gray text-xs mt-0.5">{maint.kilometraje_mantenimiento.toLocaleString()} km</div>
                      </td>
                      <td className="p-4 font-mono font-semibold text-v-white text-sm">
                        ${maint.costo_mantenimiento.toFixed(2)}
                      </td>
                      <td className="p-4">
                        <span className={cn("text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider border", statusInfo.color)}>
                          {statusInfo.label}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleOpenEdit(maint)}
                            className="p-1.5 hover:bg-v-dark border border-transparent hover:border-v-dark-border rounded-lg text-v-gray hover:text-v-white transition-all duration-200"
                            title="Editar Orden"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleOpenDelete(maint)}
                            className="p-1.5 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 rounded-lg text-v-gray hover:text-red-400 transition-all duration-200"
                            title="Eliminar Orden"
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

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="p-4 flex items-center justify-between border-t border-v-dark-border bg-v-dark/20 text-sm">
              <span className="text-v-gray">
                Mostrando <span className="font-bold text-v-white">{indexOfFirstItem + 1}</span> - <span className="font-bold text-v-white">{Math.min(indexOfLastItem, totalItems)}</span> de <span className="font-bold text-v-white">{totalItems}</span> órdenes
              </span>
              <div className="flex gap-2">
                <button
                  onClick={handlePrevPage}
                  disabled={currentPage === 1}
                  className="p-1.5 rounded-lg border border-v-dark-border bg-v-dark text-v-gray hover:text-v-white disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="flex items-center px-3 font-semibold text-v-white">
                  Pág. {currentPage} de {totalPages}
                </span>
                <button
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                  className="p-1.5 rounded-lg border border-v-dark-border bg-v-dark text-v-gray hover:text-v-white disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* CREATE & EDIT FORM MODAL */}
      <AnimatePresence>
        {isFormOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
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
              className="relative w-full max-w-2xl bg-v-dark-soft border border-v-dark-border rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col z-10"
            >
              {/* Modal Header */}
              <div className="flex justify-between items-center px-6 py-5 border-b border-v-dark-border bg-v-dark/20">
                <div>
                  <h3 className="text-xl font-bold text-v-white">
                    {currentMaintenance ? 'Editar Registro de Mantenimiento' : 'Agendar Nuevo Mantenimiento'}
                  </h3>
                  <p className="text-xs text-v-gray mt-0.5">
                    {currentMaintenance ? 'Modifique la orden de taller.' : 'Asigne un servicio técnico a un vehículo de la flota.'}
                  </p>
                </div>
                <button
                  onClick={() => setIsFormOpen(false)}
                  className="p-2 text-v-gray hover:text-v-white hover:bg-v-dark-border/40 rounded-lg transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Modal Form */}
              <form onSubmit={handleFormSubmit} className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar">
                {apiError && (
                  <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm flex items-start gap-2.5">
                    <AlertTriangle className="shrink-0 mt-0.5" size={16} />
                    <span>{apiError}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Select Vehículo */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-v-gray">Vehículo de la Flota</label>
                    <Select
                      name="id_vehiculo"
                      value={formData.id_vehiculo}
                      onChange={handleInputChange}
                      disabled={!!currentMaintenance} // Immutable in standard repair orders
                    >
                      {vehicles.map(v => (
                        <option key={v.id_vehiculo} value={v.id_vehiculo}>
                          {v.placa} — {v.marca} {v.modelo} (Km: {v.kilometraje_actual.toLocaleString()})
                        </option>
                      ))}
                    </Select>
                    {formErrors.id_vehiculo && <p className="text-xs text-red-500 mt-0.5 font-medium">{formErrors.id_vehiculo}</p>}
                  </div>

                  {/* Tipo Mantenimiento */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-v-gray">Tipo de Servicio</label>
                    <Select
                      name="tipo_mantenimiento"
                      value={formData.tipo_mantenimiento}
                      onChange={handleInputChange}
                    >
                      {MAINTENANCE_TYPES.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </Select>
                  </div>
                </div>

                {/* Descripción del taller */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-v-gray">Detalle de las reparaciones / observaciones de taller</label>
                  <textarea
                    name="descripcion_mantenimiento"
                    rows="3"
                    placeholder="Escriba los desperfectos, repuestos a cambiar, o detalles del chequeo..."
                    value={formData.descripcion_mantenimiento}
                    onChange={handleInputChange}
                    className={cn(
                      "w-full bg-v-dark border focus:border-primary text-v-white text-sm px-3.5 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all resize-none custom-scrollbar",
                      formErrors.descripcion_mantenimiento ? "border-red-500 focus:ring-red-500/10" : "border-v-dark-border"
                    )}
                  />
                  {formErrors.descripcion_mantenimiento && <p className="text-xs text-red-500 mt-0.5 font-medium">{formErrors.descripcion_mantenimiento}</p>}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Fecha */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-v-gray">Fecha Programada</label>
                    <div className="relative">
                      <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-v-gray z-10" />
                      <input
                        type="date"
                        name="fecha_mantenimiento"
                        value={formData.fecha_mantenimiento}
                        onChange={handleInputChange}
                        className={cn(
                          "w-full bg-v-dark border focus:border-primary text-v-white text-sm pl-10 pr-3.5 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all",
                          formErrors.fecha_mantenimiento ? "border-red-500 focus:ring-red-500/10" : "border-v-dark-border"
                        )}
                      />
                    </div>
                    {formErrors.fecha_mantenimiento && <p className="text-xs text-red-500 mt-0.5 font-medium">{formErrors.fecha_mantenimiento}</p>}
                  </div>

                  {/* Kilometraje registrado */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-v-gray">Kilometraje Orden (km)</label>
                    <div className="relative">
                      <Gauge size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-v-gray" />
                      <input
                        type="number"
                        name="kilometraje_mantenimiento"
                        placeholder="Ej. 12000"
                        value={formData.kilometraje_mantenimiento}
                        onChange={handleInputChange}
                        className={cn(
                          "w-full bg-v-dark border focus:border-primary text-v-white text-sm pl-10 pr-3.5 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all",
                          formErrors.kilometraje_mantenimiento ? "border-red-500 focus:ring-red-500/10" : "border-v-dark-border"
                        )}
                      />
                    </div>
                    {formErrors.kilometraje_mantenimiento && <p className="text-xs text-red-500 mt-0.5 font-medium">{formErrors.kilometraje_mantenimiento}</p>}
                  </div>

                  {/* Costo */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-v-gray">Costo Estimado ($)</label>
                    <div className="relative">
                      <DollarSign size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-v-gray" />
                      <input
                        type="number"
                        step="0.01"
                        name="costo_mantenimiento"
                        placeholder="0.00"
                        value={formData.costo_mantenimiento}
                        onChange={handleInputChange}
                        className={cn(
                          "w-full bg-v-dark border focus:border-primary text-v-white text-sm pl-10 pr-3.5 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all",
                          formErrors.costo_mantenimiento ? "border-red-500 focus:ring-red-500/10" : "border-v-dark-border"
                        )}
                      />
                    </div>
                    {formErrors.costo_mantenimiento && <p className="text-xs text-red-500 mt-0.5 font-medium">{formErrors.costo_mantenimiento}</p>}
                  </div>
                </div>

                {/* Estado Mantenimiento */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-v-gray">Estado del Servicio</label>
                  <Select
                    name="estado_mantenimiento"
                    value={formData.estado_mantenimiento}
                    onChange={handleInputChange}
                  >
                    {MAINTENANCE_STATUSES.map(st => (
                      <option key={st.value} value={st.value}>{st.label}</option>
                    ))}
                  </Select>
                </div>

                {/* Modal Footer */}
                <div className="flex justify-end gap-3 pt-4 border-t border-v-dark-border bg-v-dark-soft">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setIsFormOpen(false)}
                    disabled={isSubmitLoading}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    isLoading={isSubmitLoading}
                  >
                    {currentMaintenance ? 'Guardar Cambios' : 'Agendar'}
                  </Button>
                </div>
              </form>
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
              className="relative w-full max-w-md bg-v-dark-soft border border-v-dark-border rounded-2xl shadow-2xl p-6 z-10 space-y-6"
            >
              <div className="flex gap-4">
                <div className="h-12 w-12 rounded-xl bg-red-500/10 text-red-500 flex items-center justify-center shrink-0">
                  <AlertTriangle size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-v-white">¿Confirmar eliminación?</h3>
                  <p className="text-sm text-v-gray mt-1.5 leading-relaxed">
                    Está a punto de eliminar el registro de mantenimiento del vehículo con placa <strong className="text-v-white font-semibold font-mono">{getVehicleInfo(maintenanceToDelete?.id_vehiculo).placa}</strong> ({maintenanceToDelete?.tipo_mantenimiento}). Esta acción es irreversible y afectará los históricos del taller.
                  </p>
                </div>
              </div>

              {apiError && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-xs flex items-start gap-2">
                  <AlertTriangle className="shrink-0 mt-0.5" size={14} />
                  <span>{apiError}</span>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <Button
                  variant="ghost"
                  onClick={() => setIsDeleteOpen(false)}
                  disabled={isSubmitLoading}
                >
                  Cancelar
                </Button>
                <Button
                  variant="outline"
                  onClick={handleConfirmDelete}
                  isLoading={isSubmitLoading}
                  className="bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-v-white border-red-500/20 shadow-none hover:shadow-lg hover:shadow-red-500/10"
                >
                  Sí, eliminar
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Maintenance;
