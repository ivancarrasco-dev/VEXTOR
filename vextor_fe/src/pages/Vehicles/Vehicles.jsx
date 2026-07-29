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
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { vehicleService } from '../../services/vehicleService';
import { cn } from '../../utils/cn';

const VEHICLE_STATUSES = [
  { value: 'DISPONIBLE', label: 'Disponible', color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' },
  { value: 'EN_RUTA', label: 'En Ruta', color: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
  { value: 'MANTENIMIENTO', label: 'Mantenimiento', color: 'bg-amber-500/10 text-amber-500 border-amber-500/20' },
  { value: 'INACTIVO', label: 'Inactivo', color: 'bg-red-500/10 text-red-500 border-red-500/20' }
];

const VEHICLE_TYPES = ['Automóvil', 'Camioneta', 'Furgón', 'Camión', 'Bus'];

const Vehicles = () => {
  const [searchParams, setSearchParams] = useSearchParams();
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
  const [currentVehicle, setCurrentVehicle] = useState(null); // null for Create, vehicle object for Edit
  const [vehicleToDelete, setVehicleToDelete] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    placa: '',
    marca: '',
    modelo: '',
    anio: '',
    color: '',
    tipo_vehiculo: 'Automóvil',
    capacidad_pasajeros: '',
    kilometraje_actual: '0',
    kilometraje_limite_mantenimiento: '',
    estado_vehiculo: 'DISPONIBLE',
    documentacion_vehiculo: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [apiError, setApiError] = useState('');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Load vehicles from API
  const loadVehicles = async () => {
    setIsLoading(true);
    try {
      const data = await vehicleService.getVehicles();
      setVehicles(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadVehicles();
  }, []);

  // Handle URL query parameters to trigger "Create Vehicle" from Dashboard Quick Action
  useEffect(() => {
    if (searchParams.get('action') === 'new' && vehicles.length > 0) {
      handleOpenCreate();
      // Clear parameter so it doesn't reopen on refresh
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
    const currentYear = new Date().getFullYear();

    // Placa: format of AAA-999 or AAA-9999 (Latinamerican standard plates)
    if (!formData.placa) {
      errors.placa = 'La placa es obligatoria';
    } else if (!/^[A-Z]{3}-[0-9]{3,4}$/i.test(formData.placa)) {
      errors.placa = 'Formato inválido. Ejemplo: ABC-1234';
    }

    if (!formData.marca.trim()) {
      errors.marca = 'La marca es obligatoria';
    } else if (formData.marca.length > 50) {
      errors.marca = 'Máximo 50 caracteres';
    }

    if (!formData.modelo.trim()) {
      errors.modelo = 'El modelo es obligatorio';
    } else if (formData.modelo.length > 50) {
      errors.modelo = 'Máximo 50 caracteres';
    }

    const anioNum = parseInt(formData.anio, 10);
    if (!formData.anio) {
      errors.anio = 'El año es obligatorio';
    } else if (isNaN(anioNum) || anioNum < 1950 || anioNum > currentYear + 1) {
      errors.anio = `Año inválido (1950 - ${currentYear + 1})`;
    }

    if (formData.color && formData.color.length > 30) {
      errors.color = 'Máximo 30 caracteres';
    }

    const pasajerosNum = parseInt(formData.capacidad_pasajeros, 10);
    if (!formData.capacidad_pasajeros) {
      errors.capacidad_pasajeros = 'La capacidad es obligatoria';
    } else if (isNaN(pasajerosNum) || pasajerosNum <= 0) {
      errors.capacidad_pasajeros = 'Debe ser mayor a 0';
    }

    const kmActualNum = parseInt(formData.kilometraje_actual, 10);
    if (formData.kilometraje_actual === '' || formData.kilometraje_actual === undefined) {
      errors.kilometraje_actual = 'El kilometraje es obligatorio';
    } else if (isNaN(kmActualNum) || kmActualNum < 0) {
      errors.kilometraje_actual = 'Debe ser mayor o igual a 0';
    }

    const kmLimiteNum = parseInt(formData.kilometraje_limite_mantenimiento, 10);
    if (!formData.kilometraje_limite_mantenimiento) {
      errors.kilometraje_limite_mantenimiento = 'El límite de mantenimiento es obligatorio';
    } else if (isNaN(kmLimiteNum) || kmLimiteNum <= 0) {
      errors.kilometraje_limite_mantenimiento = 'Debe ser mayor a 0';
    } else if (!isNaN(kmActualNum) && kmLimiteNum <= kmActualNum) {
      errors.kilometraje_limite_mantenimiento = 'Debe ser mayor al kilometraje actual';
    }

    if (formData.documentacion_vehiculo && formData.documentacion_vehiculo.length > 255) {
      errors.documentacion_vehiculo = 'Máximo 255 caracteres';
    }

    return errors;
  };

  // Open Create Form modal
  const handleOpenCreate = () => {
    setCurrentVehicle(null);
    setFormData({
      placa: '',
      marca: '',
      modelo: '',
      anio: '',
      color: '',
      tipo_vehiculo: 'Automóvil',
      capacidad_pasajeros: '5',
      kilometraje_actual: '0',
      kilometraje_limite_mantenimiento: '',
      estado_vehiculo: 'DISPONIBLE',
      documentacion_vehiculo: ''
    });
    setFormErrors({});
    setApiError('');
    setIsFormOpen(true);
  };

  // Open Edit Form modal
  const handleOpenEdit = (vehicle) => {
    setCurrentVehicle(vehicle);
    setFormData({
      placa: vehicle.placa,
      marca: vehicle.marca,
      modelo: vehicle.modelo,
      anio: vehicle.anio.toString(),
      color: vehicle.color || '',
      tipo_vehiculo: vehicle.tipo_vehiculo,
      capacidad_pasajeros: vehicle.capacidad_pasajeros.toString(),
      kilometraje_actual: vehicle.kilometraje_actual.toString(),
      kilometraje_limite_mantenimiento: vehicle.kilometraje_limite_mantenimiento.toString(),
      estado_vehiculo: vehicle.estado_vehiculo,
      documentacion_vehiculo: vehicle.documentacion_vehiculo || ''
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
      if (currentVehicle) {
        // Edit Mode
        await vehicleService.updateVehicle(currentVehicle.id_vehiculo, formData);
      } else {
        // Create Mode
        await vehicleService.createVehicle(formData);
      }
      setIsFormOpen(false);
      loadVehicles();
    } catch (err) {
      setApiError(err.message || 'Ocurrió un error al procesar el vehículo.');
    } finally {
      setIsSubmitLoading(false);
    }
  };

  // Open Delete confirmation dialog
  const handleOpenDelete = (vehicle) => {
    setVehicleToDelete(vehicle);
    setApiError('');
    setIsDeleteOpen(true);
  };

  // Confirm Delete
  const handleConfirmDelete = async () => {
    setIsSubmitLoading(true);
    setApiError('');
    try {
      await vehicleService.deleteVehicle(vehicleToDelete.id_vehiculo);
      setIsDeleteOpen(false);
      setVehicleToDelete(null);
      loadVehicles();
    } catch (err) {
      setApiError(err.message || 'Error al eliminar el vehículo.');
    } finally {
      setIsSubmitLoading(false);
    }
  };

  // Filter & Search Logic
  const filteredVehicles = vehicles.filter(vehicle => {
    const query = search.toLowerCase();
    const matchesSearch =
      vehicle.placa.toLowerCase().includes(query) ||
      vehicle.marca.toLowerCase().includes(query) ||
      vehicle.modelo.toLowerCase().includes(query);

    const matchesStatus = statusFilter ? vehicle.estado_vehiculo === statusFilter : true;
    const matchesType = typeFilter ? vehicle.tipo_vehiculo === typeFilter : true;

    return matchesSearch && matchesStatus && matchesType;
  });

  // Pagination Logic
  const totalItems = filteredVehicles.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredVehicles.slice(indexOfFirstItem, indexOfLastItem);

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
          <h2 className="text-2xl font-bold text-v-white">Gestión de Vehículos</h2>
          <p className="text-v-gray text-sm mt-0.5">Monitoree, agregue y administre la flota vehicular operativa.</p>
        </div>
        <Button
          variant="primary"
          onClick={handleOpenCreate}
          className="flex items-center gap-2 self-stretch sm:self-auto shrink-0"
        >
          <Plus size={18} /> Registrar Vehículo
        </Button>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col md:flex-row gap-4 bg-v-dark-soft p-4 rounded-xl border border-v-dark-border">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-v-gray" />
          <input
            type="text"
            placeholder="Buscar por placa, marca o modelo..."
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

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-v-dark border border-v-dark-border focus:border-primary text-v-white text-sm px-3 py-2 rounded-lg focus:outline-none cursor-pointer"
          >
            <option value="">Todos los estados</option>
            {VEHICLE_STATUSES.map(st => (
              <option key={st.value} value={st.value}>{st.label}</option>
            ))}
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-v-dark border border-v-dark-border focus:border-primary text-v-white text-sm px-3 py-2 rounded-lg focus:outline-none cursor-pointer"
          >
            <option value="">Todos los tipos</option>
            {VEHICLE_TYPES.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Table / Grid view */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh] bg-v-dark-soft border border-v-dark-border rounded-2xl p-12">
          <div className="h-10 w-10 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-v-gray text-sm">Cargando flota vehicular...</p>
        </div>
      ) : filteredVehicles.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh] bg-v-dark-soft border border-v-dark-border rounded-2xl p-12 text-center">
          <Info size={40} className="text-v-gray mb-4" />
          <h3 className="text-lg font-bold text-v-white mb-1">No se encontraron vehículos</h3>
          <p className="text-v-gray text-sm max-w-sm">Intente modificar los filtros o el término de búsqueda ingresado.</p>
        </div>
      ) : (
        <div className="bg-v-dark-soft border border-v-dark-border rounded-2xl overflow-hidden shadow-xl">
          {/* Responsive Table Wrapper */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-v-dark-border bg-v-dark/40">
                  <th className="p-4 text-xs font-bold uppercase text-v-gray tracking-wider">Placa</th>
                  <th className="p-4 text-xs font-bold uppercase text-v-gray tracking-wider">Vehículo</th>
                  <th className="p-4 text-xs font-bold uppercase text-v-gray tracking-wider">Año / Color</th>
                  <th className="p-4 text-xs font-bold uppercase text-v-gray tracking-wider">Tipo / Capacidad</th>
                  <th className="p-4 text-xs font-bold uppercase text-v-gray tracking-wider">Kilometraje</th>
                  <th className="p-4 text-xs font-bold uppercase text-v-gray tracking-wider">Estado</th>
                  <th className="p-4 text-xs font-bold uppercase text-v-gray tracking-wider text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-v-dark-border">
                {currentItems.map((vehicle) => {
                  const statusInfo = VEHICLE_STATUSES.find(st => st.value === vehicle.estado_vehiculo) || { label: vehicle.estado_vehiculo, color: 'bg-v-dark border-v-dark-border text-v-white' };
                  return (
                    <tr key={vehicle.id_vehiculo} className="hover:bg-v-dark/20 transition-colors group">
                      <td className="p-4">
                        <span className="font-mono text-xs font-bold px-2.5 py-1.5 bg-v-dark border border-v-dark-border rounded-md text-primary">
                          {vehicle.placa}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="font-semibold text-v-white text-sm">{vehicle.marca}</div>
                        <div className="text-v-gray text-xs mt-0.5">{vehicle.modelo}</div>
                      </td>
                      <td className="p-4">
                        <div className="text-v-white text-sm">{vehicle.anio}</div>
                        <div className="text-v-gray text-xs mt-0.5">{vehicle.color || 'No especificado'}</div>
                      </td>
                      <td className="p-4">
                        <div className="text-v-white text-sm">{vehicle.tipo_vehiculo}</div>
                        <div className="text-v-gray text-xs mt-0.5">{vehicle.capacidad_pasajeros} pasajeros</div>
                      </td>
                      <td className="p-4">
                        <div className="text-v-white text-sm font-semibold">{vehicle.kilometraje_actual.toLocaleString()} km</div>
                        <div className="text-[11px] text-v-gray mt-0.5">Límite: {vehicle.kilometraje_limite_mantenimiento.toLocaleString()} km</div>
                      </td>
                      <td className="p-4">
                        <span className={cn("text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider border", statusInfo.color)}>
                          {statusInfo.label}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleOpenEdit(vehicle)}
                            className="p-1.5 hover:bg-v-dark border border-transparent hover:border-v-dark-border rounded-lg text-v-gray hover:text-v-white transition-all duration-200"
                            title="Editar Vehículo"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleOpenDelete(vehicle)}
                            className="p-1.5 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 rounded-lg text-v-gray hover:text-red-400 transition-all duration-200"
                            title="Eliminar Vehículo"
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
                Mostrando <span className="font-bold text-v-white">{indexOfFirstItem + 1}</span> - <span className="font-bold text-v-white">{Math.min(indexOfLastItem, totalItems)}</span> de <span className="font-bold text-v-white">{totalItems}</span> unidades
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
            {/* Modal Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsFormOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />

            {/* Modal Dialog container */}
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
                    {currentVehicle ? 'Editar Vehículo' : 'Registrar Nuevo Vehículo'}
                  </h3>
                  <p className="text-xs text-v-gray mt-0.5">
                    {currentVehicle ? 'Actualice la información de la unidad.' : 'Complete todos los atributos obligatorios del vehículo.'}
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
                  {/* Placa */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-v-gray">Placa (Formato: ABC-1234)</label>
                    <input
                      type="text"
                      name="placa"
                      placeholder="ABC-1234"
                      value={formData.placa}
                      onChange={handleInputChange}
                      disabled={!!currentVehicle} // Placa is immutable in standard logistics systems
                      className={cn(
                        "w-full bg-v-dark border focus:border-primary text-v-white text-sm px-3.5 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all font-mono uppercase",
                        formErrors.placa ? "border-red-500 focus:ring-red-500/10" : "border-v-dark-border",
                        currentVehicle && "opacity-60 cursor-not-allowed"
                      )}
                    />
                    {formErrors.placa && <p className="text-xs text-red-500 mt-0.5 font-medium">{formErrors.placa}</p>}
                  </div>

                  {/* Tipo de Vehículo */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-v-gray">Tipo de Vehículo</label>
                    <select
                      name="tipo_vehiculo"
                      value={formData.tipo_vehiculo}
                      onChange={handleInputChange}
                      className="w-full bg-v-dark border border-v-dark-border focus:border-primary text-v-white text-sm px-3.5 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all"
                    >
                      {VEHICLE_TYPES.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Marca */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-v-gray">Marca</label>
                    <input
                      type="text"
                      name="marca"
                      placeholder="Ej. Toyota"
                      value={formData.marca}
                      onChange={handleInputChange}
                      className={cn(
                        "w-full bg-v-dark border focus:border-primary text-v-white text-sm px-3.5 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all",
                        formErrors.marca ? "border-red-500 focus:ring-red-500/10" : "border-v-dark-border"
                      )}
                    />
                    {formErrors.marca && <p className="text-xs text-red-500 mt-0.5 font-medium">{formErrors.marca}</p>}
                  </div>

                  {/* Modelo */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-v-gray">Modelo</label>
                    <input
                      type="text"
                      name="modelo"
                      placeholder="Ej. Hilux"
                      value={formData.modelo}
                      onChange={handleInputChange}
                      className={cn(
                        "w-full bg-v-dark border focus:border-primary text-v-white text-sm px-3.5 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all",
                        formErrors.modelo ? "border-red-500 focus:ring-red-500/10" : "border-v-dark-border"
                      )}
                    />
                    {formErrors.modelo && <p className="text-xs text-red-500 mt-0.5 font-medium">{formErrors.modelo}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Año */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-v-gray">Año de Fabricación</label>
                    <input
                      type="number"
                      name="anio"
                      placeholder="2022"
                      value={formData.anio}
                      onChange={handleInputChange}
                      className={cn(
                        "w-full bg-v-dark border focus:border-primary text-v-white text-sm px-3.5 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all",
                        formErrors.anio ? "border-red-500 focus:ring-red-500/10" : "border-v-dark-border"
                      )}
                    />
                    {formErrors.anio && <p className="text-xs text-red-500 mt-0.5 font-medium">{formErrors.anio}</p>}
                  </div>

                  {/* Color */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-v-gray">Color (Opcional)</label>
                    <input
                      type="text"
                      name="color"
                      placeholder="Ej. Plateado"
                      value={formData.color}
                      onChange={handleInputChange}
                      className={cn(
                        "w-full bg-v-dark border focus:border-primary text-v-white text-sm px-3.5 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all",
                        formErrors.color ? "border-red-500 focus:ring-red-500/10" : "border-v-dark-border"
                      )}
                    />
                    {formErrors.color && <p className="text-xs text-red-500 mt-0.5 font-medium">{formErrors.color}</p>}
                  </div>

                  {/* Capacidad */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-v-gray">Capacidad (Pasajeros)</label>
                    <input
                      type="number"
                      name="capacidad_pasajeros"
                      placeholder="5"
                      value={formData.capacidad_pasajeros}
                      onChange={handleInputChange}
                      className={cn(
                        "w-full bg-v-dark border focus:border-primary text-v-white text-sm px-3.5 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all",
                        formErrors.capacidad_pasajeros ? "border-red-500 focus:ring-red-500/10" : "border-v-dark-border"
                      )}
                    />
                    {formErrors.capacidad_pasajeros && <p className="text-xs text-red-500 mt-0.5 font-medium">{formErrors.capacidad_pasajeros}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Kilometraje Actual */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-v-gray">Kilometraje Actual (km)</label>
                    <input
                      type="number"
                      name="kilometraje_actual"
                      placeholder="0"
                      value={formData.kilometraje_actual}
                      onChange={handleInputChange}
                      className={cn(
                        "w-full bg-v-dark border focus:border-primary text-v-white text-sm px-3.5 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all",
                        formErrors.kilometraje_actual ? "border-red-500 focus:ring-red-500/10" : "border-v-dark-border"
                      )}
                    />
                    {formErrors.kilometraje_actual && <p className="text-xs text-red-500 mt-0.5 font-medium">{formErrors.kilometraje_actual}</p>}
                  </div>

                  {/* Kilometraje Limite Mantenimiento */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-v-gray">Próximo Mantenimiento (km límite)</label>
                    <input
                      type="number"
                      name="kilometraje_limite_mantenimiento"
                      placeholder="Ej. 10000"
                      value={formData.kilometraje_limite_mantenimiento}
                      onChange={handleInputChange}
                      className={cn(
                        "w-full bg-v-dark border focus:border-primary text-v-white text-sm px-3.5 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all",
                        formErrors.kilometraje_limite_mantenimiento ? "border-red-500 focus:ring-red-500/10" : "border-v-dark-border"
                      )}
                    />
                    {formErrors.kilometraje_limite_mantenimiento && <p className="text-xs text-red-500 mt-0.5 font-medium">{formErrors.kilometraje_limite_mantenimiento}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Estado Vehículo */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-v-gray">Estado Operativo</label>
                    <select
                      name="estado_vehiculo"
                      value={formData.estado_vehiculo}
                      onChange={handleInputChange}
                      className="w-full bg-v-dark border border-v-dark-border focus:border-primary text-v-white text-sm px-3.5 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all"
                    >
                      {VEHICLE_STATUSES.map(st => (
                        <option key={st.value} value={st.value}>{st.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Documentación */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-v-gray">Documentación (Opcional)</label>
                    <input
                      type="text"
                      name="documentacion_vehiculo"
                      placeholder="Ej. SOAT al día hasta Dic 2026"
                      value={formData.documentacion_vehiculo}
                      onChange={handleInputChange}
                      className={cn(
                        "w-full bg-v-dark border focus:border-primary text-v-white text-sm px-3.5 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all",
                        formErrors.documentacion_vehiculo ? "border-red-500 focus:ring-red-500/10" : "border-v-dark-border"
                      )}
                    />
                    {formErrors.documentacion_vehiculo && <p className="text-xs text-red-500 mt-0.5 font-medium">{formErrors.documentacion_vehiculo}</p>}
                  </div>
                </div>

                {/* Modal Footer (Form buttons) */}
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
                    {currentVehicle ? 'Guardar Cambios' : 'Registrar'}
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
                    Está a punto de eliminar el vehículo con placa <strong className="text-v-white font-semibold font-mono">{vehicleToDelete?.placa}</strong> ({vehicleToDelete?.marca} {vehicleToDelete?.modelo}). Esta acción no se puede deshacer.
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

export default Vehicles;
