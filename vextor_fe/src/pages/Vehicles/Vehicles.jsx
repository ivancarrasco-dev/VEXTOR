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
  Truck,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  Grid2X2,
  List
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Select';
import { Badge } from '../../components/ui/Badge';
import { PageHeader } from '../../components/ui/PageHeader';
import { EmptyState } from '../../components/ui/EmptyState';
import { vehicleService } from './services/vehicleService';
import { cn } from '../../utils/cn';
import { useTranslation } from 'react-i18next';
import { API_BASE_URL } from '../../config/api';

const VEHICLE_STATUSES = [
  { value: 'DISPONIBLE', label: 'Disponible', variant: 'success' },
  { value: 'EN_RUTA', label: 'En Ruta', variant: 'info', pulse: true },
  { value: 'MANTENIMIENTO', label: 'Mantenimiento', variant: 'warning' },
  { value: 'INACTIVO', label: 'Inactivo', variant: 'danger' }
];

const VEHICLE_TYPES = ['Automóvil', 'Camioneta', 'Furgón', 'Camión', 'Bus'];

const Vehicles = () => {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [vehicles, setVehicles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitLoading, setIsSubmitLoading] = useState(false);
  const [selectedImages, setSelectedImages] = useState([]);
  const [selectedImagePreviews, setSelectedImagePreviews] = useState([]);
  const [deletingImageIds, setDeletingImageIds] = useState([]);
  const [viewMode, setViewMode] = useState('list');

  // Search & Filters state
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [currentVehicle, setCurrentVehicle] = useState(null);
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

  useEffect(() => {
    const previews = selectedImages.map((image) => ({ name: image.name, url: URL.createObjectURL(image) }));
    setSelectedImagePreviews(previews);
    return () => previews.forEach((preview) => URL.revokeObjectURL(preview.url));
  }, [selectedImages]);

  useEffect(() => {
    if (searchParams.get('action') === 'new' && vehicles.length > 0) {
      handleOpenCreate();
      setSearchParams({});
    }
  }, [searchParams, vehicles]);

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

  const validateForm = () => {
    const errors = {};
    const currentYear = new Date().getFullYear();

    if (!formData.placa) {
      errors.placa = 'La placa es obligatoria';
    } else if (!/^[A-Z]{3}-?([0-9]{3}|[0-9]{2}[A-Z])$/i.test(formData.placa)) {
      errors.placa = 'Formato de placa inválido. Ejemplo: ABC-123 o ABC-12C';
    }

    if (!formData.marca.trim()) errors.marca = 'La marca es obligatoria';
    if (!formData.modelo.trim()) errors.modelo = 'El modelo es obligatorio';

    const anioNum = parseInt(formData.anio, 10);
    if (!formData.anio) {
      errors.anio = 'El año es obligatorio';
    } else if (isNaN(anioNum) || anioNum < 1950 || anioNum > currentYear + 1) {
      errors.anio = `Año inválido (1950 - ${currentYear + 1})`;
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
      errors.kilometraje_limite_mantenimiento = 'El límite es obligatorio';
    } else if (isNaN(kmLimiteNum) || kmLimiteNum <= 0) {
      errors.kilometraje_limite_mantenimiento = 'Debe ser mayor a 0';
    } else if (!isNaN(kmActualNum) && kmLimiteNum <= kmActualNum) {
      errors.kilometraje_limite_mantenimiento = 'Debe ser mayor al kilometraje actual';
    }

    return errors;
  };

  const handleOpenCreate = () => {
    setCurrentVehicle(null);
    setSelectedImages([]);
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

  const handleOpenEdit = (vehicle) => {
    setCurrentVehicle(vehicle);
    setSelectedImages([]);
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

  const handleDeleteVehicleImage = async (image) => {
    if (!currentVehicle?.id_vehiculo || deletingImageIds.includes(image.id_imagen)) return;
    setDeletingImageIds((prev) => [...prev, image.id_imagen]);
    setApiError('');
    try {
      await vehicleService.deleteVehicleImage(currentVehicle.id_vehiculo, image.id_imagen);
      const remainingImages = (currentVehicle.imagenes || []).filter((item) => item.id_imagen !== image.id_imagen);
      const normalizedImages = image.es_principal
        ? remainingImages.map((item, index) => ({ ...item, es_principal: index === 0 }))
        : remainingImages;
      setCurrentVehicle((prev) => ({ ...prev, imagenes: normalizedImages }));
      setVehicles((prev) => prev.map((vehicle) => vehicle.id_vehiculo === currentVehicle.id_vehiculo
        ? { ...vehicle, imagenes: normalizedImages }
        : vehicle));
    } catch (err) {
      setApiError(err.message || 'No se pudo eliminar la fotografía.');
    } finally {
      setDeletingImageIds((prev) => prev.filter((id) => id !== image.id_imagen));
    }
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
      let savedVehicle;
      if (currentVehicle) {
        savedVehicle = await vehicleService.updateVehicle(currentVehicle.id_vehiculo, formData);
      } else {
        savedVehicle = await vehicleService.createVehicle(formData);
      }
      if (selectedImages.length > 0 && savedVehicle?.id_vehiculo) {
        await vehicleService.uploadVehicleImages(savedVehicle.id_vehiculo, selectedImages);
      }
      setIsFormOpen(false);
      loadVehicles();
    } catch (err) {
      setApiError(err.message || 'Ocurrió un error al procesar el vehículo.');
    } finally {
      setIsSubmitLoading(false);
    }
  };

  const handleOpenDelete = (vehicle) => {
    setVehicleToDelete(vehicle);
    setApiError('');
    setIsDeleteOpen(true);
  };

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

  const filteredVehicles = vehicles.filter(vehicle => {
    const query = search.trim().toLowerCase();
    const matchesSearch =
      vehicle.placa.toLowerCase().includes(query) ||
      vehicle.marca.toLowerCase().includes(query) ||
      vehicle.modelo.toLowerCase().includes(query);

    const matchesStatus = statusFilter ? vehicle.estado_vehiculo === statusFilter : true;
    const matchesType = typeFilter ? vehicle.tipo_vehiculo === typeFilter : true;

    return matchesSearch && matchesStatus && matchesType;
  });

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

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, typeFilter]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Page Header */}
      <PageHeader
        title={t('vehicles.title', 'Gestión de Flota Vehicular')}
        subtitle={t('vehicles.subtitle', 'Supervisión de unidades, kilometraje, mantenimiento y capacidad operativa.')}
        badge={
          <Badge variant="primary" pulse size="xs">
            {vehicles.length} Unidades
          </Badge>
        }
        actions={
          <Button
            variant="primary"
            onClick={handleOpenCreate}
            className="flex items-center gap-2 w-full sm:w-auto cursor-pointer"
          >
            <Plus size={18} /> {t('vehicles.addBtn', 'Registrar Vehículo')}
          </Button>
        }
      />

      {/* Filters Bar */}
      <div className="flex flex-col md:flex-row gap-4 bg-v-dark-soft p-4 rounded-2xl border border-v-dark-border shadow-sm">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-v-gray" />
          <input
            type="text"
            placeholder={t('vehicles.placeholderSearch', 'Buscar por placa, marca o modelo...')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-v-dark border border-v-dark-border focus:border-primary text-v-white text-sm pl-10 pr-4 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all font-medium"
          />
        </div>

        <div className="flex flex-wrap sm:flex-nowrap gap-3">
          <div className="flex items-center gap-1.5 bg-v-dark border border-v-dark-border px-3.5 py-2 rounded-xl shrink-0">
            <SlidersHorizontal size={15} className="text-v-gray" />
            <span className="text-v-gray text-xs font-bold uppercase font-mono">Filtros:</span>
          </div>

          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-48"
          >
            <option value="">Todos los Estados</option>
            {VEHICLE_STATUSES.map(st => (
              <option key={st.value} value={st.value}>{st.label}</option>
            ))}
          </Select>

          <Select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-48"
          >
            <option value="">Todos los Tipos</option>
            {VEHICLE_TYPES.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </Select>
        </div>

        <div className="flex items-center gap-1 rounded-xl border border-v-dark-border bg-v-dark p-1 self-start md:self-auto">
          <button type="button" onClick={() => setViewMode('list')} aria-pressed={viewMode === 'list'}
            className={cn("inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition-colors cursor-pointer", viewMode === 'list' ? "bg-primary text-white shadow" : "text-v-gray hover:text-v-white")}
            title="Vista en filas">
            <List size={16} /> Filas
          </button>
          <button type="button" onClick={() => setViewMode('cards')} aria-pressed={viewMode === 'cards'}
            className={cn("inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition-colors cursor-pointer", viewMode === 'cards' ? "bg-primary text-white shadow" : "text-v-gray hover:text-v-white")}
            title="Vista en tarjetas">
            <Grid2X2 size={16} /> Tarjetas
          </button>
        </div>
      </div>

      {/* Main Content */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center min-h-[350px] bg-v-dark-soft border border-v-dark-border rounded-2xl p-12">
          <div className="h-10 w-10 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-v-gray text-sm font-medium">Cargando flota vehicular de la plataforma...</p>
        </div>
      ) : filteredVehicles.length === 0 ? (
        <EmptyState
          icon={Truck}
          title="No se encontraron vehículos"
          description="No existen registros vehiculares que coincidan con los criterios de búsqueda o filtros seleccionados."
          action={
            (search || statusFilter || typeFilter) ? (
              <Button
                variant="outline"
                onClick={() => { setSearch(''); setStatusFilter(''); setTypeFilter(''); }}
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
                <Plus size={16} className="mr-1.5" /> Registrar Primer Vehículo
              </Button>
            )
          }
        />
      ) : (
        <>
        {viewMode === 'cards' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
            {currentItems.map((vehicle) => {
              const statusInfo = VEHICLE_STATUSES.find(st => st.value === vehicle.estado_vehiculo) || { label: vehicle.estado_vehiculo, variant: 'neutral' };
              const primaryImage = vehicle.imagenes?.find(image => image.es_principal) || vehicle.imagenes?.[0];
              return (
                <article key={vehicle.id_vehiculo} className="overflow-hidden rounded-2xl border border-v-dark-border bg-v-dark-soft shadow-lg transition-all hover:-translate-y-1 hover:border-primary/40">
                  <div className="relative h-52 sm:h-56 bg-v-dark">
                    {primaryImage ? (
                      <img src={`${API_BASE_URL}${primaryImage.url_imagen}`} alt={`Vehículo ${vehicle.placa}`} className="h-full w-full object-cover" loading="lazy" />
                    ) : (
                      <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-v-gray">
                        <Truck size={42} /><span className="text-xs">Sin fotografía</span>
                      </div>
                    )}
                    <span className="absolute left-3 top-3 rounded-lg border border-v-dark-border bg-v-dark/90 px-3 py-1.5 font-mono text-xs font-extrabold text-primary backdrop-blur">{vehicle.placa}</span>
                    <div className="absolute right-3 top-3"><Badge variant={statusInfo.variant} pulse={statusInfo.pulse}>{statusInfo.label}</Badge></div>
                  </div>
                  <div className="space-y-4 p-5">
                    <div>
                      <h3 className="text-lg font-extrabold text-v-white">{vehicle.marca} {vehicle.modelo}</h3>
                      <p className="mt-1 text-xs font-medium text-v-gray">{vehicle.tipo_vehiculo} · {vehicle.anio} · {vehicle.color || 'Color no especificado'}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3 border-y border-v-dark-border py-3">
                      <div><p className="text-[10px] font-bold uppercase tracking-wider text-v-gray">Capacidad</p><p className="mt-1 text-sm font-semibold text-v-white">{vehicle.capacidad_pasajeros} pasajeros</p></div>
                      <div><p className="text-[10px] font-bold uppercase tracking-wider text-v-gray">Kilometraje</p><p className="mt-1 text-sm font-semibold text-v-white">{Number(vehicle.kilometraje_actual || 0).toLocaleString()} km</p></div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <button onClick={() => handleOpenEdit(vehicle)} className="inline-flex items-center gap-2 rounded-xl border border-v-dark-border px-3 py-2 text-xs font-semibold text-v-gray transition-colors hover:bg-v-dark hover:text-v-white cursor-pointer" title="Editar vehículo"><Edit2 size={15} /> Editar</button>
                      <button onClick={() => handleOpenDelete(vehicle)} className="inline-flex items-center gap-2 rounded-xl border border-red-500/20 px-3 py-2 text-xs font-semibold text-red-400 transition-colors hover:bg-red-500/10 cursor-pointer" title="Eliminar vehículo"><Trash2 size={15} /> Eliminar</button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
        <div className="bg-v-dark-soft border border-v-dark-border rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto w-full custom-scrollbar">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="border-b border-v-dark-border bg-v-dark/40 text-xs font-bold uppercase text-v-gray font-mono tracking-wider">
                  <th className="p-4">Placa</th>
                  <th className="p-4">Vehículo</th>
                  <th className="p-4">Año / Color</th>
                  <th className="p-4">Tipo / Capacidad</th>
                  <th className="p-4">Kilometraje</th>
                  <th className="p-4">Estado Operativo</th>
                  <th className="p-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-v-dark-border">
                {currentItems.map((vehicle) => {
                  const statusInfo = VEHICLE_STATUSES.find(st => st.value === vehicle.estado_vehiculo) || { label: vehicle.estado_vehiculo, variant: 'neutral' };
                  return (
                    <tr key={vehicle.id_vehiculo} className="hover:bg-v-dark/30 transition-colors group">
                      <td className="p-4">
                        {(() => {
                          const primaryImage = vehicle.imagenes?.find(image => image.es_principal) || vehicle.imagenes?.[0];
                          return primaryImage ? (
                            <img
                              src={`${API_BASE_URL}${primaryImage.url_imagen}`}
                              alt={`Vehículo ${vehicle.placa}`}
                              className="w-16 h-12 object-cover rounded-lg border border-v-dark-border mb-2"
                              loading="lazy"
                            />
                          ) : (
                            <div className="w-16 h-12 rounded-lg border border-dashed border-v-dark-border flex items-center justify-center text-v-gray mb-2">
                              <Truck size={18} />
                            </div>
                          );
                        })()}
                        <span className="font-mono text-xs font-extrabold px-3 py-1.5 bg-v-dark border border-v-dark-border rounded-lg text-primary shadow-sm">
                          {vehicle.placa}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="font-bold text-v-white text-sm">{vehicle.marca}</div>
                        <div className="text-v-gray text-xs mt-0.5 font-medium">{vehicle.modelo}</div>
                      </td>
                      <td className="p-4">
                        <div className="text-v-white text-sm font-semibold">{vehicle.anio}</div>
                        <div className="text-v-gray text-xs mt-0.5">{vehicle.color || 'No especificado'}</div>
                      </td>
                      <td className="p-4">
                        <div className="text-v-white text-sm font-medium">{vehicle.tipo_vehiculo}</div>
                        <div className="text-v-gray text-xs mt-0.5">{vehicle.capacidad_pasajeros} pasajeros</div>
                      </td>
                      <td className="p-4">
                        <div className="text-v-white text-sm font-bold font-mono">{vehicle.kilometraje_actual.toLocaleString()} km</div>
                        <div className="text-[11px] text-v-gray mt-0.5 font-mono">Límite: {vehicle.kilometraje_limite_mantenimiento.toLocaleString()} km</div>
                      </td>
                      <td className="p-4">
                        <Badge variant={statusInfo.variant} pulse={statusInfo.pulse}>
                          {statusInfo.label}
                        </Badge>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleOpenEdit(vehicle)}
                            className="p-2 hover:bg-v-dark border border-transparent hover:border-v-dark-border rounded-xl text-v-gray hover:text-v-white transition-all cursor-pointer"
                            title="Editar Vehículo"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleOpenDelete(vehicle)}
                            className="p-2 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 rounded-xl text-v-gray hover:text-red-400 transition-all cursor-pointer"
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

          {totalPages > 1 && (
            <div className="p-4 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-v-dark-border bg-v-dark/30 text-xs text-v-gray font-medium">
              <span>
                Mostrando <strong className="text-v-white">{indexOfFirstItem + 1}</strong> - <strong className="text-v-white">{Math.min(indexOfLastItem, totalItems)}</strong> de <strong className="text-v-white">{totalItems}</strong> unidades
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
        </>
      )}

      {/* CREATE & EDIT FORM MODAL */}
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
              className="relative w-full max-w-2xl bg-v-dark-soft border border-v-dark-border rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col z-10"
            >
              <div className="flex justify-between items-center px-6 py-5 border-b border-v-dark-border bg-v-dark/20 text-left">
                <div>
                  <h3 className="text-xl font-extrabold text-v-white">
                    {currentVehicle ? 'Editar Vehículo' : 'Registrar Nuevo Vehículo'}
                  </h3>
                  <p className="text-xs text-v-gray mt-0.5">
                    {currentVehicle ? 'Actualice los parámetros de la unidad.' : 'Ingrese los datos de la nueva unidad vehicular.'}
                  </p>
                </div>
                <button
                  onClick={() => setIsFormOpen(false)}
                  className="p-2 text-v-gray hover:text-v-white hover:bg-v-dark-border/40 rounded-xl transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleFormSubmit} className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar text-left">
                {apiError && (
                  <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs font-semibold flex items-start gap-2.5">
                    <AlertTriangle className="shrink-0 mt-0.5" size={16} />
                    <span>{apiError}</span>
                  </div>
                )}

                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-v-gray font-mono">Fotografías del vehículo</label>
                    <p className="mt-1 text-xs text-v-gray">Visualiza las fotos guardadas, elimina las que no necesites o agrega nuevas.</p>
                  </div>

                  {currentVehicle?.imagenes?.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {currentVehicle.imagenes.map((image) => (
                        <div key={image.id_imagen} className="relative overflow-hidden rounded-xl border border-v-dark-border bg-v-dark">
                          <img src={`${API_BASE_URL}${image.url_imagen}`} alt={`Fotografía de ${currentVehicle.placa}`} className="h-28 w-full object-cover" />
                          {image.es_principal && <span className="absolute left-2 top-2 rounded-md bg-primary px-2 py-1 text-[10px] font-bold text-white">Principal</span>}
                          <button
                            type="button"
                            onClick={() => handleDeleteVehicleImage(image)}
                            disabled={deletingImageIds.includes(image.id_imagen) || isSubmitLoading}
                            className="absolute right-2 top-2 rounded-lg border border-red-500/30 bg-v-dark/90 p-2 text-red-400 transition-colors hover:bg-red-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                            title="Eliminar fotografía"
                            aria-label="Eliminar fotografía"
                          >
                            {deletingImageIds.includes(image.id_imagen)
                              ? <span className="block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                              : <Trash2 size={15} />}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {selectedImagePreviews.length > 0 && (
                    <div>
                      <p className="mb-2 text-xs font-semibold text-primary">Nuevas fotografías ({selectedImagePreviews.length})</p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {selectedImagePreviews.map((preview, index) => (
                          <div key={`${preview.name}-${index}`} className="relative overflow-hidden rounded-xl border border-primary/30 bg-v-dark">
                            <img src={preview.url} alt={preview.name} className="h-28 w-full object-cover" />
                            <button
                              type="button"
                              onClick={() => setSelectedImages((prev) => prev.filter((_, imageIndex) => imageIndex !== index))}
                              disabled={isSubmitLoading}
                              className="absolute right-2 top-2 rounded-lg border border-red-500/30 bg-v-dark/90 p-2 text-red-400 transition-colors hover:bg-red-500 hover:text-white disabled:opacity-50"
                              title="Quitar fotografía seleccionada"
                              aria-label="Quitar fotografía seleccionada"
                            >
                              <X size={15} />
                            </button>
                            <span className="block truncate px-2 py-1.5 text-[10px] text-v-gray">{preview.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-v-dark-border bg-v-dark px-4 py-3 text-sm font-semibold text-v-gray transition-colors hover:border-primary hover:text-primary">
                    <Plus size={17} /> Subir fotografías
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      multiple
                      disabled={isSubmitLoading}
                      onChange={(event) => {
                        const incoming = Array.from(event.target.files || []);
                        setSelectedImages((prev) => [...prev, ...incoming]);
                        event.target.value = '';
                      }}
                      className="hidden"
                    />
                  </label>
                  <p className="text-xs text-v-gray">JPG, PNG o WEBP. Máximo 10 MB por imagen. Las nuevas se guardarán al pulsar {currentVehicle ? 'Guardar Cambios' : 'Registrar'}.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-v-gray font-mono">Placa Vehicular</label>
                    <input
                      type="text"
                      name="placa"
                      placeholder="ABC-123"
                      value={formData.placa}
                      onChange={handleInputChange}
                      disabled={!!currentVehicle}
                      className={cn(
                        "w-full bg-v-dark border focus:border-primary text-v-white text-sm px-3.5 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all font-mono uppercase font-bold",
                        formErrors.placa ? "border-red-500 focus:ring-red-500/10" : "border-v-dark-border",
                        currentVehicle && "opacity-60 cursor-not-allowed"
                      )}
                    />
                    {formErrors.placa && <p className="text-xs text-red-400 mt-0.5 font-medium">{formErrors.placa}</p>}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-v-gray font-mono">Tipo de Vehículo</label>
                    <Select
                      name="tipo_vehiculo"
                      value={formData.tipo_vehiculo}
                      onChange={handleInputChange}
                    >
                      {VEHICLE_TYPES.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-v-gray font-mono">Marca</label>
                    <input
                      type="text"
                      name="marca"
                      placeholder="Ej. Toyota"
                      value={formData.marca}
                      onChange={handleInputChange}
                      className={cn(
                        "w-full bg-v-dark border focus:border-primary text-v-white text-sm px-3.5 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all font-medium",
                        formErrors.marca ? "border-red-500" : "border-v-dark-border"
                      )}
                    />
                    {formErrors.marca && <p className="text-xs text-red-400 mt-0.5 font-medium">{formErrors.marca}</p>}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-v-gray font-mono">Modelo</label>
                    <input
                      type="text"
                      name="modelo"
                      placeholder="Ej. Hilux"
                      value={formData.modelo}
                      onChange={handleInputChange}
                      className={cn(
                        "w-full bg-v-dark border focus:border-primary text-v-white text-sm px-3.5 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all font-medium",
                        formErrors.modelo ? "border-red-500" : "border-v-dark-border"
                      )}
                    />
                    {formErrors.modelo && <p className="text-xs text-red-400 mt-0.5 font-medium">{formErrors.modelo}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-v-gray font-mono">Año</label>
                    <input
                      type="number"
                      name="anio"
                      placeholder="2023"
                      value={formData.anio}
                      onChange={handleInputChange}
                      className={cn(
                        "w-full bg-v-dark border focus:border-primary text-v-white text-sm px-3.5 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all font-mono",
                        formErrors.anio ? "border-red-500" : "border-v-dark-border"
                      )}
                    />
                    {formErrors.anio && <p className="text-xs text-red-400 mt-0.5 font-medium">{formErrors.anio}</p>}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-v-gray font-mono">Color</label>
                    <input
                      type="text"
                      name="color"
                      placeholder="Blanco"
                      value={formData.color}
                      onChange={handleInputChange}
                      className="w-full bg-v-dark border border-v-dark-border focus:border-primary text-v-white text-sm px-3.5 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-v-gray font-mono">Pasajeros</label>
                    <input
                      type="number"
                      name="capacidad_pasajeros"
                      placeholder="5"
                      value={formData.capacidad_pasajeros}
                      onChange={handleInputChange}
                      className={cn(
                        "w-full bg-v-dark border focus:border-primary text-v-white text-sm px-3.5 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all font-mono",
                        formErrors.capacidad_pasajeros ? "border-red-500" : "border-v-dark-border"
                      )}
                    />
                    {formErrors.capacidad_pasajeros && <p className="text-xs text-red-400 mt-0.5 font-medium">{formErrors.capacidad_pasajeros}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-v-gray font-mono">Kilometraje Actual</label>
                    <input
                      type="number"
                      name="kilometraje_actual"
                      placeholder="0"
                      value={formData.kilometraje_actual}
                      onChange={handleInputChange}
                      className={cn(
                        "w-full bg-v-dark border focus:border-primary text-v-white text-sm px-3.5 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all font-mono",
                        formErrors.kilometraje_actual ? "border-red-500" : "border-v-dark-border"
                      )}
                    />
                    {formErrors.kilometraje_actual && <p className="text-xs text-red-400 mt-0.5 font-medium">{formErrors.kilometraje_actual}</p>}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-v-gray font-mono">Límite Mantenimiento (km)</label>
                    <input
                      type="number"
                      name="kilometraje_limite_mantenimiento"
                      placeholder="10000"
                      value={formData.kilometraje_limite_mantenimiento}
                      onChange={handleInputChange}
                      className={cn(
                        "w-full bg-v-dark border focus:border-primary text-v-white text-sm px-3.5 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all font-mono",
                        formErrors.kilometraje_limite_mantenimiento ? "border-red-500" : "border-v-dark-border"
                      )}
                    />
                    {formErrors.kilometraje_limite_mantenimiento && <p className="text-xs text-red-400 mt-0.5 font-medium">{formErrors.kilometraje_limite_mantenimiento}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-v-gray font-mono">Estado Operativo</label>
                    <Select
                      name="estado_vehiculo"
                      value={formData.estado_vehiculo}
                      onChange={handleInputChange}
                    >
                      {VEHICLE_STATUSES.map(st => (
                        <option key={st.value} value={st.value}>{st.label}</option>
                      ))}
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-v-gray font-mono">Documentación</label>
                    <input
                      type="text"
                      name="documentacion_vehiculo"
                      placeholder="SOAT vigencia 2026"
                      value={formData.documentacion_vehiculo}
                      onChange={handleInputChange}
                      className="w-full bg-v-dark border border-v-dark-border focus:border-primary text-v-white text-sm px-3.5 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all"
                    />
                  </div>
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
              className="relative w-full max-w-md bg-v-dark-soft border border-v-dark-border rounded-2xl shadow-2xl p-6 z-10 space-y-6 text-left"
            >
              <div className="flex gap-4">
                <div className="h-12 w-12 rounded-2xl bg-red-500/10 text-red-500 border border-red-500/20 flex items-center justify-center shrink-0">
                  <AlertTriangle size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-v-white">¿Confirmar baja de unidad?</h3>
                  <p className="text-xs text-v-gray mt-1.5 leading-relaxed">
                    Está a punto de eliminar el vehículo con placa <strong className="text-v-white font-bold font-mono">{vehicleToDelete?.placa}</strong> ({vehicleToDelete?.marca} {vehicleToDelete?.modelo}).
                  </p>
                </div>
              </div>

              {apiError && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs flex items-start gap-2 font-medium">
                  <AlertTriangle className="shrink-0 mt-0.5" size={14} />
                  <span>{apiError}</span>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <Button
                  variant="ghost"
                  onClick={() => setIsDeleteOpen(false)}
                  disabled={isSubmitLoading}
                  className="cursor-pointer"
                >
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

export default Vehicles;
