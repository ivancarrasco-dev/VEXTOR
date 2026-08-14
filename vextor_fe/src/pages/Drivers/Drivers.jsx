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
  Mail,
  User,
  Phone,
  FileText,
  CalendarCheck
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Select';
import { driverService } from '../../services/driverService';
import { cn } from '../../utils/cn';
import { useTranslation } from 'react-i18next';

const DRIVER_STATUSES = [
  { value: 'ACTIVO', label: 'Activo', color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' },
  { value: 'INACTIVO', label: 'Inactivo', color: 'bg-red-500/10 text-red-500 border-red-500/20' },
  { value: 'SUSPENDIDO', label: 'Suspendido', color: 'bg-amber-500/10 text-amber-500 border-amber-500/20' }
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
  const [currentDriver, setCurrentDriver] = useState(null); // null for Create, driver object for Edit
  const [driverToDelete, setDriverToDelete] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    nombre_conductor: '',
    apellido_conductor: '',
    cedula_conductor: '',
    telefono_conductor: '',
    licencia: 'C2',
    estado_conductor: 'ACTIVO',
    fecha_ingreso: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [apiError, setApiError] = useState('');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Load drivers from API
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

  // Handle URL query parameters to trigger "Create Driver" from Dashboard Quick Action
  useEffect(() => {
    if (searchParams.get('action') === 'new' && drivers.length > 0) {
      handleOpenCreate();
      setSearchParams({});
    }
  }, [searchParams, drivers]);

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

    if (!formData.nombre_conductor.trim()) {
      errors.nombre_conductor = 'El nombre es obligatorio';
    } else if (formData.nombre_conductor.length > 100) {
      errors.nombre_conductor = 'Máximo 100 caracteres';
    }

    if (!formData.apellido_conductor.trim()) {
      errors.apellido_conductor = 'El apellido es obligatorio';
    } else if (formData.apellido_conductor.length > 100) {
      errors.apellido_conductor = 'Máximo 100 caracteres';
    }

    if (!formData.cedula_conductor.trim()) {
      errors.cedula_conductor = 'La cédula es obligatoria';
    } else if (!/^[0-9]{3,10}$/.test(formData.cedula_conductor.trim())) {
      errors.cedula_conductor = 'Debe tener entre 3 y 10 dígitos (numéricos únicamente)';
    }

    if (formData.telefono_conductor) {
      const cleanPhone = formData.telefono_conductor.replace(/\s+/g, '');
      if (!/^(\+57|57)?3[0-9]{9}$/.test(cleanPhone)) {
        errors.telefono_conductor = 'Formato de celular colombiano inválido. Debe tener 10 dígitos y comenzar con 3 (ej. 3123456789).';
      }
    }

    if (!formData.fecha_ingreso) {
      errors.fecha_ingreso = 'La fecha de ingreso es obligatoria';
    }

    return errors;
  };

  // Open Create Form modal
  const handleOpenCreate = () => {
    setCurrentDriver(null);
    setFormData({
      nombre_conductor: '',
      apellido_conductor: '',
      cedula_conductor: '',
      telefono_conductor: '',
      licencia: 'C2',
      estado_conductor: 'ACTIVO',
      fecha_ingreso: new Date().toISOString().split('T')[0]
    });
    setFormErrors({});
    setApiError('');
    setIsFormOpen(true);
  };

  // Open Edit Form modal
  const handleOpenEdit = (driver) => {
    setCurrentDriver(driver);
    setFormData({
      nombre_conductor: driver.nombre_conductor,
      apellido_conductor: driver.apellido_conductor,
      cedula_conductor: driver.cedula_conductor,
      telefono_conductor: driver.telefono_conductor || '',
      licencia: driver.licencia,
      estado_conductor: driver.estado_conductor,
      fecha_ingreso: driver.fecha_ingreso
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
      if (currentDriver) {
        // Edit Mode
        await driverService.updateDriver(currentDriver.id_conductor, formData);
      } else {
        // Create Mode
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

  // Open Delete confirmation dialog
  const handleOpenDelete = (driver) => {
    setDriverToDelete(driver);
    setApiError('');
    setIsDeleteOpen(true);
  };

  // Confirm Delete
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

  // Filter & Search Logic
  const filteredDrivers = drivers.filter(driver => {
    const query = search.trim().toLowerCase();
    const matchesSearch =
      driver.nombre_conductor.toLowerCase().includes(query) ||
      driver.apellido_conductor.toLowerCase().includes(query) ||
      driver.cedula_conductor.includes(query) ||
      driver.licencia.toLowerCase().includes(query);

    const matchesStatus = statusFilter ? driver.estado_conductor === statusFilter : true;

    return matchesSearch && matchesStatus;
  });

  // Pagination Logic
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

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-v-dark-soft p-6 rounded-2xl border border-v-dark-border">
        <div>
          <h2 className="text-2xl font-bold text-v-white">{t('drivers.title')}</h2>
          <p className="text-v-gray text-sm mt-0.5">{t('drivers.subtitle')}</p>
        </div>
        <Button
          variant="primary"
          onClick={handleOpenCreate}
          className="flex items-center gap-2 self-stretch sm:self-auto shrink-0"
        >
          <Plus size={18} /> {t('drivers.addBtn')}
        </Button>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-4 bg-v-dark-soft p-4 rounded-xl border border-v-dark-border">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-v-gray" />
          <input
            type="text"
            placeholder={t('drivers.placeholderSearch')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-v-dark border border-v-dark-border focus:border-primary text-v-white text-sm pl-10 pr-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all"
          />
        </div>

        {/* Filters dropdowns */}
        <div className="flex gap-3">
          <div className="flex items-center gap-1.5 bg-v-dark border border-v-dark-border px-3 py-1.5 rounded-lg shrink-0">
            <SlidersHorizontal size={15} className="text-v-gray" />
            <span className="text-v-gray text-xs font-medium">{t('reports.filters.status')}:</span>
          </div>

          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-40"
          >
            <option value="">{t('drivers.filterAll')}</option>
            {DRIVER_STATUSES.map(st => (
              <option key={st.value} value={st.value}>{st.label}</option>
            ))}
          </Select>
        </div>
      </div>

      {/* Main Table */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh] bg-v-dark-soft border border-v-dark-border rounded-2xl p-12">
          <div className="h-10 w-10 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-v-gray text-sm">Cargando personal de conducción...</p>
        </div>
      ) : filteredDrivers.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh] bg-v-dark-soft border border-v-dark-border rounded-2xl p-12 text-center">
          <Info size={40} className="text-v-gray mb-4" />
          <h3 className="text-lg font-bold text-v-white mb-1">No se encontraron conductores</h3>
          <p className="text-v-gray text-sm max-w-sm">Intente modificar los filtros o el término de búsqueda ingresado.</p>
        </div>
      ) : (
        <div className="bg-v-dark-soft border border-v-dark-border rounded-2xl overflow-hidden shadow-xl">
          {/* Responsive Table Wrapper */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-v-dark-border bg-v-dark/40">
                  <th className="p-4 text-xs font-bold uppercase text-v-gray tracking-wider">Cédula</th>
                  <th className="p-4 text-xs font-bold uppercase text-v-gray tracking-wider">Conductor</th>
                  <th className="p-4 text-xs font-bold uppercase text-v-gray tracking-wider">Teléfono / Licencia</th>
                  <th className="p-4 text-xs font-bold uppercase text-v-gray tracking-wider">Fecha Ingreso</th>
                  <th className="p-4 text-xs font-bold uppercase text-v-gray tracking-wider">Estado</th>
                  <th className="p-4 text-xs font-bold uppercase text-v-gray tracking-wider text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-v-dark-border">
                {currentItems.map((driver) => {
                  const statusInfo = DRIVER_STATUSES.find(st => st.value === driver.estado_conductor) || { label: driver.estado_conductor, color: 'bg-v-dark border-v-dark-border text-v-white' };
                  return (
                    <tr key={driver.id_conductor} className="hover:bg-v-dark/20 transition-colors group">
                      <td className="p-4">
                        <span className="font-mono text-xs font-bold px-2.5 py-1.5 bg-v-dark border border-v-dark-border rounded-md text-primary">
                          {driver.cedula_conductor}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="font-semibold text-v-white text-sm">
                          {driver.nombre_conductor} {driver.apellido_conductor}
                        </div>
                        <div className="text-v-gray text-xs mt-0.5">ID: {driver.id_conductor.substring(0, 8)}...</div>
                      </td>
                      <td className="p-4">
                        <div className="text-v-white text-sm">{driver.licencia}</div>
                        <div className="text-v-gray text-xs mt-0.5">{driver.telefono_conductor || 'Sin teléfono'}</div>
                      </td>
                      <td className="p-4">
                        <div className="text-v-white text-sm font-medium">{driver.fecha_ingreso}</div>
                      </td>
                      <td className="p-4">
                        <span className={cn("text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider border", statusInfo.color)}>
                          {statusInfo.label}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleOpenEdit(driver)}
                            className="p-1.5 hover:bg-v-dark border border-transparent hover:border-v-dark-border rounded-lg text-v-gray hover:text-v-white transition-all duration-200"
                            title="Editar Conductor"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleOpenDelete(driver)}
                            className="p-1.5 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 rounded-lg text-v-gray hover:text-red-400 transition-all duration-200"
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

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="p-4 flex items-center justify-between border-t border-v-dark-border bg-v-dark/20 text-sm">
              <span className="text-v-gray">
                Mostrando <span className="font-bold text-v-white">{indexOfFirstItem + 1}</span> - <span className="font-bold text-v-white">{Math.min(indexOfLastItem, totalItems)}</span> de <span className="font-bold text-v-white">{totalItems}</span> conductores
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
                    {currentDriver ? 'Editar Conductor' : 'Registrar Nuevo Conductor'}
                  </h3>
                  <p className="text-xs text-v-gray mt-0.5">
                    {currentDriver ? 'Actualice la información del operador.' : 'Complete los datos requeridos para el alta del conductor.'}
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
                  {/* Nombre */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-v-gray">Nombre(s)</label>
                    <div className="relative">
                      <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-v-gray" />
                      <input
                        type="text"
                        name="nombre_conductor"
                        placeholder="Ej. Juan"
                        value={formData.nombre_conductor}
                        onChange={handleInputChange}
                        className={cn(
                          "w-full bg-v-dark border focus:border-primary text-v-white text-sm pl-10 pr-3.5 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all",
                          formErrors.nombre_conductor ? "border-red-500 focus:ring-red-500/10" : "border-v-dark-border"
                        )}
                      />
                    </div>
                    {formErrors.nombre_conductor && <p className="text-xs text-red-500 mt-0.5 font-medium">{formErrors.nombre_conductor}</p>}
                  </div>

                  {/* Apellido */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-v-gray">Apellido(s)</label>
                    <div className="relative">
                      <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-v-gray" />
                      <input
                        type="text"
                        name="apellido_conductor"
                        placeholder="Ej. Pérez"
                        value={formData.apellido_conductor}
                        onChange={handleInputChange}
                        className={cn(
                          "w-full bg-v-dark border focus:border-primary text-v-white text-sm pl-10 pr-3.5 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all",
                          formErrors.apellido_conductor ? "border-red-500 focus:ring-red-500/10" : "border-v-dark-border"
                        )}
                      />
                    </div>
                    {formErrors.apellido_conductor && <p className="text-xs text-red-500 mt-0.5 font-medium">{formErrors.apellido_conductor}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Cédula */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-v-gray">Documento de Cédula / DNI</label>
                    <div className="relative">
                      <FileText size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-v-gray" />
                      <input
                        type="text"
                        name="cedula_conductor"
                        placeholder="Mínimo 10 dígitos"
                        value={formData.cedula_conductor}
                        onChange={handleInputChange}
                        className={cn(
                          "w-full bg-v-dark border focus:border-primary text-v-white text-sm pl-10 pr-3.5 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all font-mono",
                          formErrors.cedula_conductor ? "border-red-500 focus:ring-red-500/10" : "border-v-dark-border"
                        )}
                      />
                    </div>
                    {formErrors.cedula_conductor && <p className="text-xs text-red-500 mt-0.5 font-medium">{formErrors.cedula_conductor}</p>}
                  </div>

                  {/* Teléfono */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-v-gray">Teléfono (Opcional)</label>
                    <div className="relative">
                      <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-v-gray" />
                      <input
                        type="text"
                        name="telefono_conductor"
                        placeholder="Ej. +593 98 765 4321"
                        value={formData.telefono_conductor}
                        onChange={handleInputChange}
                        className={cn(
                          "w-full bg-v-dark border focus:border-primary text-v-white text-sm pl-10 pr-3.5 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all",
                          formErrors.telefono_conductor ? "border-red-500 focus:ring-red-500/10" : "border-v-dark-border"
                        )}
                      />
                    </div>
                    {formErrors.telefono_conductor && <p className="text-xs text-red-500 mt-0.5 font-medium">{formErrors.telefono_conductor}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Tipo de Licencia */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-v-gray">Tipo de Licencia</label>
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

                  {/* Fecha de Ingreso */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-v-gray">Fecha de Ingreso</label>
                    <div className="relative">
                      <CalendarCheck size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-v-gray z-10" />
                      <input
                        type="date"
                        name="fecha_ingreso"
                        value={formData.fecha_ingreso}
                        onChange={handleInputChange}
                        className={cn(
                          "w-full bg-v-dark border focus:border-primary text-v-white text-sm pl-10 pr-3.5 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all",
                          formErrors.fecha_ingreso ? "border-red-500 focus:ring-red-500/10" : "border-v-dark-border"
                        )}
                      />
                    </div>
                    {formErrors.fecha_ingreso && <p className="text-xs text-red-500 mt-0.5 font-medium">{formErrors.fecha_ingreso}</p>}
                  </div>
                </div>

                {/* Estado Conductor */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-v-gray">Estado Laboral</label>
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
                    {currentDriver ? 'Guardar Cambios' : 'Registrar'}
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
                    Está a punto de eliminar el conductor <strong className="text-v-white font-semibold">{driverToDelete?.nombre_conductor} {driverToDelete?.apellido_conductor}</strong> (Cédula: <span className="font-mono">{driverToDelete?.cedula_conductor}</span>). Se desvinculará también su cuenta de usuario del sistema. Esta acción es irreversible.
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

export default Drivers;
