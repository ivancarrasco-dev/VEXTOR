import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  X,
  AlertTriangle,
  Info,
  MapPin,
  Calendar,
  Clock,
  User,
  Truck,
  RotateCcw,
  Save,
  CheckCircle2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { routeService } from '../../services/routeService';
import { driverService } from '../../services/driverService';
import { vehicleService } from '../../services/vehicleService';
import MapComponent from './components/MapComponent';
import { cn } from '../../utils/cn';

const ROUTE_STATUSES = [
  { value: 'PROGRAMADA', label: 'Programada', color: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
  { value: 'EN_PROCESO', label: 'En Proceso', color: 'bg-amber-500/10 text-amber-500 border-amber-500/20' },
  { value: 'COMPLETADA', label: 'Completada', color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' },
  { value: 'SUSPENDIDA', label: 'Suspendida', color: 'bg-red-500/10 text-red-500 border-red-500/20' },
  { value: 'CANCELADA', label: 'Cancelada', color: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20' }
];

const Routes = () => {
  // Data lists
  const [routes, setRoutes] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [vehicles, setVehicles] = useState([]);

  // Loading states
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitLoading, setIsSubmitLoading] = useState(false);

  // Search & Filters state
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Active / Selected state
  const [selectedRoute, setSelectedRoute] = useState(null); // Highlighting on map and loading in form
  const [routeToDelete, setRouteToDelete] = useState(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    codigo_ruta: '',
    nombre_ruta: '',
    origen: '',
    destino: '',
    fecha_programada: '',
    hora_inicio_real: '',
    hora_fin_real: '',
    estado_ruta: 'PROGRAMADA',
    motivo_suspension: '',
    id_conductor: '',
    id_vehiculo: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [feedback, setFeedback] = useState({ type: '', message: '' }); // success/error feedback banner

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Load drivers, vehicles and routes
  const loadData = async () => {
    setIsLoading(true);
    try {
      const rData = await routeService.getRoutes();
      const dData = await driverService.getDrivers();
      const vData = await vehicleService.getVehicles();

      // Only active drivers/vehicles for new assignments
      setDrivers(dData.filter(d => d.estado_conductor === 'ACTIVO'));
      setVehicles(vData.filter(v => v.estado_vehiculo !== 'INACTIVO'));
      setRoutes(rData);

      // Set defaults for form if drivers/vehicles exist
      const activeDrivers = dData.filter(d => d.estado_conductor === 'ACTIVO');
      const activeVehicles = vData.filter(v => v.estado_vehiculo !== 'INACTIVO');

      setFormData(prev => ({
        ...prev,
        id_conductor: activeDrivers[0]?.id_conductor || '',
        id_vehiculo: activeVehicles[0]?.id_vehiculo || ''
      }));

    } catch (err) {
      console.error('Error loading routes details:', err);
      showFeedback('error', 'Error al cargar los datos del servidor.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const showFeedback = (type, message) => {
    setFeedback({ type, message });
    setTimeout(() => {
      setFeedback({ type: '', message: '' });
    }, 5000);
  };

  // Form input changes
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

  // Click on Map coordinates callback
  const handleSelectPointsOnMap = (coords) => {
    setFormData(prev => {
      let updated = { ...prev };

      if (!prev.origen) {
        updated.origen = coords;
        if (formErrors.origen) setFormErrors(errs => ({ ...errs, origen: '' }));
      } else if (prev.origen && !prev.destino) {
        updated.destino = coords;
        if (formErrors.destino) setFormErrors(errs => ({ ...errs, destino: '' }));
      } else {
        // Reset both and start fresh
        updated.origen = coords;
        updated.destino = '';
      }
      return updated;
    });
  };

  // Form validator
  const validateForm = () => {
    const errors = {};
    const now = new Date();

    if (!formData.codigo_ruta.trim()) {
      errors.codigo_ruta = 'El código de ruta es obligatorio';
    } else if (formData.codigo_ruta.length > 50) {
      errors.codigo_ruta = 'Máximo 50 caracteres';
    }

    if (!formData.nombre_ruta.trim()) {
      errors.nombre_ruta = 'El nombre de la ruta es obligatorio';
    } else if (formData.nombre_ruta.length > 100) {
      errors.nombre_ruta = 'Máximo 100 caracteres';
    }

    if (!formData.origen.trim()) {
      errors.origen = 'El origen es obligatorio (clic en el mapa)';
    }

    if (!formData.destino.trim()) {
      errors.destino = 'El destino es obligatorio (clic en el mapa)';
    }

    if (!formData.fecha_programada) {
      errors.fecha_programada = 'La fecha programada es obligatoria';
    } else {
      const scheduledDate = new Date(formData.fecha_programada);
      if (!selectedRoute && scheduledDate < now) {
        errors.fecha_programada = 'La fecha programada no puede ser en el pasado';
      }
    }

    if (!formData.id_conductor) {
      errors.id_conductor = 'Debe seleccionar un conductor operativo';
    }

    if (!formData.id_vehiculo) {
      errors.id_vehiculo = 'Debe seleccionar un vehículo activo';
    }

    if (formData.estado_ruta === 'SUSPENDIDA' && !formData.motivo_suspension.trim()) {
      errors.motivo_suspension = 'El motivo de suspensión es obligatorio para este estado';
    }

    if (formData.hora_inicio_real && formData.hora_fin_real) {
      const startReal = new Date(formData.hora_inicio_real);
      const endReal = new Date(formData.hora_fin_real);
      if (endReal <= startReal) {
        errors.hora_fin_real = 'La hora de fin debe ser posterior a la de inicio';
      }
    }

    return errors;
  };

  // Submit Form: Create or Edit
  const handleSubmitForm = async (e) => {
    e.preventDefault();
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      showFeedback('error', 'Por favor, corrija los campos obligatorios del formulario.');
      return;
    }

    setIsSubmitLoading(true);
    try {
      if (selectedRoute) {
        // Edit mode
        await routeService.updateRoute(selectedRoute.id_ruta, formData);
        showFeedback('success', 'Ruta actualizada correctamente.');
      } else {
        // Create mode
        await routeService.createRoute(formData);
        showFeedback('success', 'Nueva ruta programada correctamente.');
      }
      handleClearForm();
      const updatedList = await routeService.getRoutes();
      setRoutes(updatedList);
    } catch (err) {
      showFeedback('error', err.message || 'Error al procesar la ruta.');
    } finally {
      setIsSubmitLoading(false);
    }
  };

  // Select a route to load in form and center on map
  const handleSelectRoute = (route) => {
    setSelectedRoute(route);
    setFormData({
      codigo_ruta: route.codigo_ruta,
      nombre_ruta: route.nombre_ruta,
      origen: route.origen,
      destino: route.destino,
      fecha_programada: route.fecha_programada,
      hora_inicio_real: route.hora_inicio_real || '',
      hora_fin_real: route.hora_fin_real || '',
      estado_ruta: route.estado_ruta,
      motivo_suspension: route.motivo_suspension || '',
      id_conductor: route.id_conductor,
      id_vehiculo: route.id_vehiculo
    });
    setFormErrors({});
  };

  // Reset form
  const handleClearForm = () => {
    setSelectedRoute(null);
    setFormData({
      codigo_ruta: '',
      nombre_ruta: '',
      origen: '',
      destino: '',
      fecha_programada: '',
      hora_inicio_real: '',
      hora_fin_real: '',
      estado_ruta: 'PROGRAMADA',
      motivo_suspension: '',
      id_conductor: drivers[0]?.id_conductor || '',
      id_vehiculo: vehicles[0]?.id_vehiculo || ''
    });
    setFormErrors({});
  };

  // Open delete dialog
  const handleOpenDelete = (route, e) => {
    e.stopPropagation(); // Stop row click selection
    setRouteToDelete(route);
    setIsDeleteOpen(true);
  };

  // Confirm delete
  const handleConfirmDelete = async () => {
    setIsSubmitLoading(true);
    try {
      await routeService.deleteRoute(routeToDelete.id_ruta);
      showFeedback('success', 'Ruta eliminada con éxito.');
      setIsDeleteOpen(false);

      // If we deleted the route currently loaded in the form, reset form
      if (selectedRoute && selectedRoute.id_ruta === routeToDelete.id_ruta) {
        handleClearForm();
      }

      setRouteToDelete(null);
      const updatedList = await routeService.getRoutes();
      setRoutes(updatedList);
    } catch (err) {
      showFeedback('error', err.message || 'Error al eliminar la ruta.');
    } finally {
      setIsSubmitLoading(false);
    }
  };

  // Search and Filter logic
  const filteredRoutes = routes.filter(route => {
    const query = search.toLowerCase();
    const driver = drivers.find(d => d.id_conductor === route.id_conductor);
    const vehicle = vehicles.find(v => v.id_vehiculo === route.id_vehiculo);
    const driverName = driver ? `${driver.nombre_conductor} ${driver.apellido_conductor}`.toLowerCase() : '';
    const plate = vehicle ? vehicle.placa.toLowerCase() : '';

    const matchesSearch =
      route.codigo_ruta.toLowerCase().includes(query) ||
      route.nombre_ruta.toLowerCase().includes(query) ||
      driverName.includes(query) ||
      plate.includes(query);

    const matchesStatus = statusFilter ? route.estado_ruta === statusFilter : true;

    return matchesSearch && matchesStatus;
  });

  // Helpers to fetch relations text
  const getDriverName = (id_conductor) => {
    const d = drivers.find(drv => drv.id_conductor === id_conductor);
    return d ? `${d.nombre_conductor} ${d.apellido_conductor}` : 'Sin Conductor';
  };

  const getVehiclePlate = (id_vehiculo) => {
    const v = vehicles.find(veh => veh.id_vehiculo === id_vehiculo);
    return v ? v.placa : 'Sin Placa';
  };

  // Pagination logic
  const totalItems = filteredRoutes.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredRoutes.slice(indexOfFirstItem, indexOfLastItem);

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  // Reset page on search or filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">

      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-v-dark-soft p-6 rounded-2xl border border-v-dark-border">
        <div>
          <h2 className="text-2xl font-bold text-v-white">Planificación Interactiva de Rutas</h2>
          <p className="text-v-gray text-sm mt-0.5">Gestione y programe trayectos directamente sobre el mapa de Bogotá.</p>
        </div>
      </div>

      {/* Main Split Layout: Left Map, Right Form/Table */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">

        {/* PANEL IZQUIERDO: Mapa Interactivo (60% width on LG screen) */}
        <div className="lg:col-span-3 h-[450px] lg:h-[680px]">
          <MapComponent
            routes={routes}
            activeRoute={selectedRoute}
            selectedOrigin={formData.origen}
            selectedDestination={formData.destino}
            onSelectPoints={handleSelectPointsOnMap}
          />
        </div>

        {/* PANEL DERECHO: Formulario & Tabla (40% width on LG screen) */}
        <div className="lg:col-span-2 space-y-6">

          {/* Feedbacks */}
          <AnimatePresence>
            {feedback.message && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={cn(
                  "p-4 rounded-xl border text-sm flex items-start gap-2.5 shadow-lg",
                  feedback.type === 'success' ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-red-500/10 border-red-500/20 text-red-400"
                )}
              >
                {feedback.type === 'success' ? <CheckCircle2 className="shrink-0 mt-0.5" size={16} /> : <AlertTriangle className="shrink-0 mt-0.5" size={16} />}
                <span>{feedback.message}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* CRUD Form */}
          <div className="bg-v-dark-soft border border-v-dark-border rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex justify-between items-center border-b border-v-dark-border pb-3.5">
              <div>
                <h3 className="text-lg font-bold text-v-white">
                  {selectedRoute ? 'Editar Ruta Seleccionada' : 'Crear Nueva Ruta'}
                </h3>
                <p className="text-xs text-v-gray mt-0.5">
                  {selectedRoute ? 'Actualice la información del trayecto.' : 'Complete el formulario interactuando con el mapa.'}
                </p>
              </div>
              {selectedRoute && (
                <button
                  onClick={handleClearForm}
                  className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                >
                  <RotateCcw size={12} /> Nueva Ruta
                </button>
              )}
            </div>

            <form onSubmit={handleSubmitForm} className="space-y-4 text-left">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Código de Ruta */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-v-gray">Código único</label>
                  <input
                    type="text"
                    name="codigo_ruta"
                    placeholder="Ej. RUT-104"
                    value={formData.codigo_ruta}
                    onChange={handleInputChange}
                    className={cn(
                      "w-full bg-v-dark border focus:border-primary text-v-white text-sm px-3.5 py-2.5 rounded-lg focus:outline-none transition-all uppercase font-mono",
                      formErrors.codigo_ruta ? "border-red-500" : "border-v-dark-border"
                    )}
                  />
                  {formErrors.codigo_ruta && <p className="text-[11px] text-red-500 mt-0.5 font-medium">{formErrors.codigo_ruta}</p>}
                </div>

                {/* Nombre Ruta */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-v-gray">Nombre descriptivo</label>
                  <input
                    type="text"
                    name="nombre_ruta"
                    placeholder="Ej. Ruta Portal 80"
                    value={formData.nombre_ruta}
                    onChange={handleInputChange}
                    className={cn(
                      "w-full bg-v-dark border focus:border-primary text-v-white text-sm px-3.5 py-2.5 rounded-lg focus:outline-none transition-all",
                      formErrors.nombre_ruta ? "border-red-500" : "border-v-dark-border"
                    )}
                  />
                  {formErrors.nombre_ruta && <p className="text-[11px] text-red-500 mt-0.5 font-medium">{formErrors.nombre_ruta}</p>}
                </div>
              </div>

              {/* Origen & Destino */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Origen */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-v-gray flex items-center gap-1.5">
                    <MapPin size={13} className="text-emerald-500 animate-pulse" /> Origen (Lat, Lng)
                  </label>
                  <input
                    type="text"
                    name="origen"
                    placeholder="Haz clic en el mapa..."
                    value={formData.origen}
                    onChange={handleInputChange}
                    className={cn(
                      "w-full bg-v-dark border focus:border-primary text-v-white text-sm px-3.5 py-2.5 rounded-lg focus:outline-none transition-all font-mono text-xs",
                      formErrors.origen ? "border-red-500" : "border-v-dark-border"
                    )}
                  />
                  {formErrors.origen && <p className="text-[11px] text-red-500 mt-0.5 font-medium">{formErrors.origen}</p>}
                </div>

                {/* Destino */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-v-gray flex items-center gap-1.5">
                    <MapPin size={13} className="text-red-500 animate-pulse" /> Destino (Lat, Lng)
                  </label>
                  <input
                    type="text"
                    name="destino"
                    placeholder="Haz clic en el mapa..."
                    value={formData.destino}
                    onChange={handleInputChange}
                    className={cn(
                      "w-full bg-v-dark border focus:border-primary text-v-white text-sm px-3.5 py-2.5 rounded-lg focus:outline-none transition-all font-mono text-xs",
                      formErrors.destino ? "border-red-500" : "border-v-dark-border"
                    )}
                  />
                  {formErrors.destino && <p className="text-[11px] text-red-500 mt-0.5 font-medium">{formErrors.destino}</p>}
                </div>
              </div>

              {/* Conductor & Vehículo */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Conductor */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-v-gray flex items-center gap-1.5">
                    <User size={13} className="text-v-gray" /> Conductor asignado
                  </label>
                  <select
                    name="id_conductor"
                    value={formData.id_conductor}
                    onChange={handleInputChange}
                    className="w-full bg-v-dark border border-v-dark-border focus:border-primary text-v-white text-sm px-3.5 py-2.5 rounded-lg focus:outline-none transition-all cursor-pointer"
                  >
                    <option value="">Seleccione Conductor...</option>
                    {drivers.map(d => (
                      <option key={d.id_conductor} value={d.id_conductor}>
                        {d.nombre_conductor} {d.apellido_conductor}
                      </option>
                    ))}
                  </select>
                  {formErrors.id_conductor && <p className="text-[11px] text-red-500 mt-0.5 font-medium">{formErrors.id_conductor}</p>}
                </div>

                {/* Vehículo */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-v-gray flex items-center gap-1.5">
                    <Truck size={13} className="text-v-gray" /> Vehículo asignado
                  </label>
                  <select
                    name="id_vehiculo"
                    value={formData.id_vehiculo}
                    onChange={handleInputChange}
                    className="w-full bg-v-dark border border-v-dark-border focus:border-primary text-v-white text-sm px-3.5 py-2.5 rounded-lg focus:outline-none transition-all cursor-pointer"
                  >
                    <option value="">Seleccione Vehículo...</option>
                    {vehicles.map(v => (
                      <option key={v.id_vehiculo} value={v.id_vehiculo}>
                        {v.placa} — {v.marca} {v.modelo}
                      </option>
                    ))}
                  </select>
                  {formErrors.id_vehiculo && <p className="text-[11px] text-red-500 mt-0.5 font-medium">{formErrors.id_vehiculo}</p>}
                </div>
              </div>

              {/* Fecha Programada & Estado */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Fecha Programada */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-v-gray flex items-center gap-1.5">
                    <Calendar size={13} className="text-v-gray" /> Fecha Programada
                  </label>
                  <input
                    type="datetime-local"
                    name="fecha_programada"
                    value={formData.fecha_programada}
                    onChange={handleInputChange}
                    className={cn(
                      "w-full bg-v-dark border focus:border-primary text-v-white text-sm px-3.5 py-2.5 rounded-lg focus:outline-none transition-all",
                      formErrors.fecha_programada ? "border-red-500" : "border-v-dark-border"
                    )}
                  />
                  {formErrors.fecha_programada && <p className="text-[11px] text-red-500 mt-0.5 font-medium">{formErrors.fecha_programada}</p>}
                </div>

                {/* Estado */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-v-gray">Estado Operativo</label>
                  <select
                    name="estado_ruta"
                    value={formData.estado_ruta}
                    onChange={handleInputChange}
                    className="w-full bg-v-dark border border-v-dark-border focus:border-primary text-v-white text-sm px-3.5 py-2.5 rounded-lg focus:outline-none transition-all cursor-pointer"
                  >
                    {ROUTE_STATUSES.map(st => (
                      <option key={st.value} value={st.value}>{st.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Suspension Reason (Only displayed when SUSPENDIDA is active) */}
              <AnimatePresence>
                {formData.estado_ruta === 'SUSPENDIDA' && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="space-y-1.5 overflow-hidden"
                  >
                    <label className="text-xs font-medium text-red-400">Motivo de Suspensión (Obligatorio)</label>
                    <textarea
                      name="motivo_suspension"
                      rows="2"
                      placeholder="Escriba los motivos del retraso o suspensión..."
                      value={formData.motivo_suspension}
                      onChange={handleInputChange}
                      className={cn(
                        "w-full bg-v-dark border focus:border-primary text-v-white text-sm px-3.5 py-2 rounded-lg focus:outline-none resize-none",
                        formErrors.motivo_suspension ? "border-red-500" : "border-v-dark-border"
                      )}
                    />
                    {formErrors.motivo_suspension && <p className="text-[11px] text-red-500 mt-0.5 font-medium">{formErrors.motivo_suspension}</p>}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Real Times: Start / End (Optional/Nullable) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                {/* Hora Inicio Real */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-v-gray flex items-center gap-1.5">
                    <Clock size={13} className="text-v-gray" /> Inicio Real (Opcional)
                  </label>
                  <input
                    type="datetime-local"
                    name="hora_inicio_real"
                    value={formData.hora_inicio_real}
                    onChange={handleInputChange}
                    className="w-full bg-v-dark border border-v-dark-border focus:border-primary text-v-white text-sm px-3.5 py-2.5 rounded-lg focus:outline-none transition-all"
                  />
                </div>

                {/* Hora Fin Real */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-v-gray flex items-center gap-1.5">
                    <Clock size={13} className="text-v-gray" /> Fin Real (Opcional)
                  </label>
                  <input
                    type="datetime-local"
                    name="hora_fin_real"
                    value={formData.hora_fin_real}
                    onChange={handleInputChange}
                    className={cn(
                      "w-full bg-v-dark border focus:border-primary text-v-white text-sm px-3.5 py-2.5 rounded-lg focus:outline-none transition-all",
                      formErrors.hora_fin_real ? "border-red-500" : "border-v-dark-border"
                    )}
                  />
                  {formErrors.hora_fin_real && <p className="text-[11px] text-red-500 mt-0.5 font-medium">{formErrors.hora_fin_real}</p>}
                </div>
              </div>

              {/* Form Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-v-dark-border">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleClearForm}
                  disabled={isSubmitLoading}
                  className="flex items-center gap-1.5"
                >
                  Limpiar
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  isLoading={isSubmitLoading}
                  className="flex items-center gap-1.5"
                >
                  <Save size={16} /> {selectedRoute ? 'Guardar Cambios' : 'Registrar'}
                </Button>
              </div>
            </form>
          </div>

          {/* Table Container */}
          <div className="bg-v-dark-soft border border-v-dark-border rounded-2xl p-5 shadow-xl space-y-4">

            {/* Table Search */}
            <div className="flex justify-between items-center pb-2 border-b border-v-dark-border">
              <h3 className="text-lg font-bold text-v-white">Listado de Rutas</h3>
              <div className="relative max-w-xs">
                <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-v-gray" />
                <input
                  type="text"
                  placeholder="Buscar..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="bg-v-dark border border-v-dark-border focus:border-primary text-v-white text-xs pl-8 pr-3 py-1.5 rounded-lg focus:outline-none"
                />
              </div>
            </div>

            {/* Existing Routes List Table */}
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="h-8 w-8 border-3 border-primary border-t-transparent rounded-full animate-spin mb-3" />
                <p className="text-v-gray text-xs">Cargando rutas...</p>
              </div>
            ) : filteredRoutes.length === 0 ? (
              <div className="text-center py-12 space-y-2">
                <Info size={30} className="text-v-gray mx-auto" />
                <p className="text-v-gray text-xs">No se encontraron rutas programadas.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-v-dark-border bg-v-dark/40">
                        <th className="p-3 font-bold uppercase text-v-gray">Ruta</th>
                        <th className="p-3 font-bold uppercase text-v-gray">Conductor / Placa</th>
                        <th className="p-3 font-bold uppercase text-v-gray">Fecha / Estado</th>
                        <th className="p-3 font-bold uppercase text-v-gray text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-v-dark-border">
                      {currentItems.map((route) => {
                        const statusInfo = ROUTE_STATUSES.find(st => st.value === route.estado_ruta) || { label: route.estado_ruta, color: 'bg-v-dark text-v-white border-v-dark-border' };
                        const isSelected = selectedRoute && selectedRoute.id_ruta === route.id_ruta;
                        return (
                          <tr
                            key={route.id_ruta}
                            onClick={() => handleSelectRoute(route)}
                            className={cn(
                              "hover:bg-v-dark/20 transition-colors cursor-pointer group",
                              isSelected && "bg-primary/5 border-l-2 border-primary"
                            )}
                          >
                            <td className="p-3">
                              <div className="font-mono font-bold text-primary">{route.codigo_ruta}</div>
                              <div className="text-v-white font-medium mt-0.5">{route.nombre_ruta}</div>
                            </td>
                            <td className="p-3 space-y-1">
                              <div className="text-v-white">{getDriverName(route.id_conductor)}</div>
                              <span className="font-mono px-1.5 py-0.5 bg-v-dark border border-v-dark-border rounded text-[10px] text-v-gray">
                                {getVehiclePlate(route.id_vehiculo)}
                              </span>
                            </td>
                            <td className="p-3 space-y-1.5">
                              <div className="text-v-gray text-[11px] flex items-center gap-1">
                                <Calendar size={11} /> {route.fecha_programada.replace('T', ' ')}
                              </div>
                              <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider border", statusInfo.color)}>
                                {statusInfo.label}
                              </span>
                            </td>
                            <td className="p-3 text-right" onClick={(e) => e.stopPropagation()}>
                              <div className="flex justify-end gap-1.5">
                                <button
                                  onClick={() => handleSelectRoute(route)}
                                  className="p-1 hover:bg-v-dark border border-transparent hover:border-v-dark-border rounded text-v-gray hover:text-v-white transition-all"
                                  title="Editar"
                                >
                                  <Edit2 size={13} />
                                </button>
                                <button
                                  onClick={(e) => handleOpenDelete(route, e)}
                                  className="p-1 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 rounded text-v-gray hover:text-red-400 transition-all"
                                  title="Eliminar"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between pt-3 border-t border-v-dark-border text-xs">
                    <span className="text-v-gray">
                      Pág. <span className="font-semibold text-v-white">{currentPage}</span> de <span className="font-semibold text-v-white">{totalPages}</span>
                    </span>
                    <div className="flex gap-1.5">
                      <button
                        onClick={handlePrevPage}
                        disabled={currentPage === 1}
                        className="p-1.5 rounded border border-v-dark-border bg-v-dark text-v-gray hover:text-v-white disabled:opacity-45 disabled:cursor-not-allowed transition-all"
                      >
                        <ChevronLeft size={13} />
                      </button>
                      <button
                        onClick={handleNextPage}
                        disabled={currentPage === totalPages}
                        className="p-1.5 rounded border border-v-dark-border bg-v-dark text-v-gray hover:text-v-white disabled:opacity-45 disabled:cursor-not-allowed transition-all"
                      >
                        <ChevronRight size={13} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

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
                <div className="text-left">
                  <h3 className="text-lg font-bold text-v-white">¿Confirmar eliminación de ruta?</h3>
                  <p className="text-sm text-v-gray mt-1.5 leading-relaxed">
                    Está a punto de eliminar la ruta <strong className="text-v-white font-semibold font-mono">{routeToDelete?.codigo_ruta}</strong> ({routeToDelete?.nombre_ruta}). Esta acción afectará el historial operativo de viajes de la flota y es irreversible.
                  </p>
                </div>
              </div>

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
                  className="bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-v-white border-red-500/20 shadow-none"
                >
                  Sí, eliminar ruta
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Routes;
