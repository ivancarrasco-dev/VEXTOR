import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  Clock,
  TrendingUp,
  BarChart3,
  Truck,
  Users,
  MapPin,
  Wrench,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Search,
  Download,
  Check,
  FileText,
  FileSpreadsheet,
  FileDown,
  Info,
  Loader2,
  X,
  SlidersHorizontal,
  Sliders
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Select';
import { vehicleService } from '../../services/vehicleService';
import { driverService } from '../../services/driverService';
import { routeService } from '../../services/routeService';
import { maintenanceService } from '../../services/maintenanceService';
import { cn } from '../../utils/cn';
import { useTranslation } from 'react-i18next';

// Status styling mapping for consistent look
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

const Reports = () => {
  const { t } = useTranslation();
  // Navigation / Active report selection
  // Possible values: 'vehicles' | 'drivers' | 'routes' | 'maintenances' | 'day' | 'week' | 'month' | 'general'
  const [activeReport, setActiveReport] = useState(null);

  // Stats / Counts
  const [counts, setCounts] = useState({
    vehicles: 0,
    drivers: 0,
    routes: 0,
    maintenances: 0
  });

  // Master records cache
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [maintenances, setMaintenances] = useState([]);

  // Dictionaries for mapping IDs to names
  const [vehiclesMap, setVehiclesMap] = useState({});
  const [driversMap, setDriversMap] = useState({});

  // Loading States
  const [isLoadingCounts, setIsLoadingCounts] = useState(true);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState('');

  // Dropdown States
  const [isQuickExportOpen, setIsQuickExportOpen] = useState(false);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);

  // References for closing menus
  const quickExportRef = useRef(null);
  const exportMenuRef = useRef(null);

  // Floating toasts list
  const [toasts, setToasts] = useState([]);

  // Filters State
  const [filters, setFilters] = useState({
    dateStart: '',
    dateEnd: '',
    status: '',
    search: '',
    sort: 'recent',
    type: ''
  });

  // Sort criteria inside table (column-specific sorting)
  const [tableSort, setTableSort] = useState({ column: '', direction: 'asc' });

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Add a toast notification helper
  const addToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (quickExportRef.current && !quickExportRef.current.contains(event.target)) {
        setIsQuickExportOpen(false);
      }
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target)) {
        setIsExportMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch initial stats and data
  const loadSystemStats = async () => {
    setIsLoadingCounts(true);
    try {
      const [vehList, drvList, rtList, maintList] = await Promise.all([
        vehicleService.getVehicles(),
        driverService.getDrivers(),
        routeService.getRoutes(),
        maintenanceService.getMaintenances()
      ]);

      setVehicles(vehList);
      setDrivers(drvList);
      setRoutes(rtList);
      setMaintenances(maintList);

      setCounts({
        vehicles: vehList.length,
        drivers: drvList.length,
        routes: rtList.length,
        maintenances: maintList.length
      });

      // Construct maps for ID mapping
      const vMap = {};
      vehList.forEach(v => {
        vMap[v.id_vehiculo] = `${v.marca} ${v.modelo} [${v.placa}]`;
      });
      setVehiclesMap(vMap);

      const dMap = {};
      drvList.forEach(d => {
        dMap[d.id_conductor] = `${d.nombre_conductor} ${d.apellido_conductor}`;
      });
      setDriversMap(dMap);

    } catch (err) {
      console.error('Error cargando estadísticas de reportes:', err);
      addToast('Error al conectar con los servicios del sistema.', 'error');
    } finally {
      setIsLoadingCounts(false);
    }
  };

  useEffect(() => {
    loadSystemStats();
  }, []);

  // Set active report tab & trigger preview simulation
  const handleSelectReport = (reportType) => {
    setActiveReport(reportType);
    setCurrentPage(1);
    setTableSort({ column: '', direction: 'asc' });
    setFilters({
      dateStart: '',
      dateEnd: '',
      status: '',
      search: '',
      sort: 'recent',
      type: ''
    });

    // Simulate skeleton loading state for realistic SaaS feeling
    setIsLoadingPreview(true);
    setTimeout(() => {
      setIsLoadingPreview(false);
    }, 600);
  };

  // Run instant export simulation (Quick Export / Header buttons)
  const handleRunExportSimulation = (reportName, format) => {
    if (isExporting) return;
    setIsExporting(true);
    setIsQuickExportOpen(false);
    setIsExportMenuOpen(false);

    const steps = [
      'Extrayendo registros...',
      'Estructurando matriz de datos...',
      `Compilando plantilla ${format.toUpperCase()}...`,
      'Firmando reporte digitalmente...',
      'Listo para descarga.'
    ];

    let currentStep = 0;
    setExportProgress(steps[0]);

    const interval = setInterval(() => {
      currentStep++;
      if (currentStep < steps.length) {
        setExportProgress(steps[currentStep]);
      } else {
        clearInterval(interval);
        setIsExporting(false);
        setExportProgress('');
        addToast(`Reporte "${reportName}" exportado con éxito en formato ${format.toUpperCase()}`);
      }
    }, 450);
  };

  // Filter & Search helper mapping logic
  const getFilteredData = () => {
    let rawList = [];

    // 1. Assign correct list based on active tab
    if (activeReport === 'vehicles') {
      rawList = vehicles.map(v => ({
        ...v,
        _searchString: `${v.placa} ${v.marca} ${v.modelo} ${v.tipo_vehiculo}`.toLowerCase()
      }));
    } else if (activeReport === 'drivers') {
      rawList = drivers.map(d => ({
        ...d,
        _searchString: `${d.nombre_conductor} ${d.apellido_conductor} ${d.cedula_conductor} ${d.licencia}`.toLowerCase()
      }));
    } else if (activeReport === 'routes') {
      rawList = routes.map(r => ({
        ...r,
        _searchString: `${r.codigo_ruta} ${r.nombre_ruta} ${vehiclesMap[r.id_vehiculo] || ''} ${driversMap[r.id_conductor] || ''}`.toLowerCase()
      }));
    } else if (activeReport === 'maintenances') {
      rawList = maintenances.map(m => ({
        ...m,
        _searchString: `${m.tipo_mantenimiento} ${m.descripcion_mantenimiento} ${vehiclesMap[m.id_vehiculo] || ''}`.toLowerCase()
      }));
    } else if (['day', 'week', 'month', 'general'].includes(activeReport)) {
      // General / Quick Summary reports: build an aggregated logs list
      const allEvents = [];

      // Add routes
      routes.forEach(r => {
        allEvents.push({
          id: r.id_ruta,
          modulo: 'Rutas',
          detalle: `Ruta ${r.codigo_ruta}: ${r.nombre_ruta}`,
          fecha: r.fecha_programada,
          estado: r.estado_ruta,
          responsable: driversMap[r.id_conductor] || 'Sin asignar',
          extra: vehiclesMap[r.id_vehiculo] || 'Sin vehículo'
        });
      });

      // Add maintenances
      maintenances.forEach(m => {
        allEvents.push({
          id: m.id_mantenimiento,
          modulo: 'Mantenimientos',
          detalle: `Mantenimiento ${m.tipo_mantenimiento}: ${m.descripcion_mantenimiento}`,
          fecha: m.fecha_mantenimiento,
          estado: m.estado_mantenimiento,
          responsable: 'Taller Autorizado',
          extra: vehiclesMap[m.id_vehiculo] || 'Sin vehículo'
        });
      });

      // Add drivers (using fecha_ingreso as date)
      drivers.forEach(d => {
        allEvents.push({
          id: d.id_conductor,
          modulo: 'Conductores',
          detalle: `Ingreso de Conductor: ${d.nombre_conductor} ${d.apellido_conductor}`,
          fecha: d.fecha_ingreso,
          estado: d.estado_conductor,
          responsable: 'Recursos Humanos',
          extra: `Cédula: ${d.cedula_conductor}`
        });
      });

      // Filter by period
      const now = new Date();
      rawList = allEvents.filter(evt => {
        if (!evt.fecha) return true;
        const evtDate = new Date(evt.fecha);
        if (activeReport === 'day') {
          // Scheduled for today (simplified: check same year/month/day or simply active items)
          const diffTime = Math.abs(now - evtDate);
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          return diffDays <= 1; // within 24h
        }
        if (activeReport === 'week') {
          const diffTime = Math.abs(now - evtDate);
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          return diffDays <= 7; // within 7 days
        }
        if (activeReport === 'month') {
          const diffTime = Math.abs(now - evtDate);
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          return diffDays <= 30; // within 30 days
        }
        return true; // General summary returns everything
      });

      rawList = rawList.map(e => ({
        ...e,
        _searchString: `${e.modulo} ${e.detalle} ${e.responsable} ${e.extra}`.toLowerCase()
      }));
    }

    // 2. Filter: Search text query
    if (filters.search) {
      const q = filters.search.trim().toLowerCase();
      rawList = rawList.filter(item => item._searchString?.includes(q));
    }

    // 3. Filter: Status match
    if (filters.status) {
      if (['day', 'week', 'month', 'general'].includes(activeReport)) {
        rawList = rawList.filter(item => item.estado === filters.status);
      } else if (activeReport === 'vehicles') {
        rawList = rawList.filter(item => item.estado_vehiculo === filters.status);
      } else if (activeReport === 'drivers') {
        rawList = rawList.filter(item => item.estado_conductor === filters.status);
      } else if (activeReport === 'routes') {
        rawList = rawList.filter(item => item.estado_ruta === filters.status);
      } else if (activeReport === 'maintenances') {
        rawList = rawList.filter(item => item.estado_mantenimiento === filters.status);
      }
    }

    // 4. Filter: Date Range (Start & End)
    if (filters.dateStart) {
      const startLimit = new Date(filters.dateStart);
      rawList = rawList.filter(item => {
        const itemDateVal = item.fecha_programada || item.fecha_mantenimiento || item.fecha_ingreso || item.fecha;
        if (!itemDateVal) return true;
        return new Date(itemDateVal) >= startLimit;
      });
    }
    if (filters.dateEnd) {
      const endLimit = new Date(filters.dateEnd);
      endLimit.setHours(23, 59, 59, 999); // Include full day
      rawList = rawList.filter(item => {
        const itemDateVal = item.fecha_programada || item.fecha_mantenimiento || item.fecha_ingreso || item.fecha;
        if (!itemDateVal) return true;
        return new Date(itemDateVal) <= endLimit;
      });
    }

    // 5. Filter: Type matching
    if (filters.type) {
      if (activeReport === 'vehicles') {
        rawList = rawList.filter(item => item.tipo_vehiculo === filters.type);
      } else if (activeReport === 'drivers') {
        // License types
        rawList = rawList.filter(item => item.licencia?.includes(filters.type));
      } else if (activeReport === 'maintenances') {
        rawList = rawList.filter(item => item.tipo_mantenimiento === filters.type);
      } else if (['day', 'week', 'month', 'general'].includes(activeReport)) {
        // Module types for general summary
        rawList = rawList.filter(item => item.modulo === filters.type);
      }
    }

    // 6. Sorting (from dropdown or manual table sorting)
    const activeSortCol = tableSort.column;
    const activeSortDir = tableSort.direction;

    if (activeSortCol) {
      rawList.sort((a, b) => {
        let valA = a[activeSortCol] ?? '';
        let valB = b[activeSortCol] ?? '';

        if (typeof valA === 'string') valA = valA.toLowerCase();
        if (typeof valB === 'string') valB = valB.toLowerCase();

        if (valA < valB) return activeSortDir === 'asc' ? -1 : 1;
        if (valA > valB) return activeSortDir === 'asc' ? 1 : -1;
        return 0;
      });
    } else {
      // Default Sort dropdown selection mapping
      if (filters.sort === 'recent') {
        rawList.sort((a, b) => {
          const dateA = new Date(a.fecha_programada || a.fecha_mantenimiento || a.fecha_ingreso || a.fecha || 0);
          const dateB = new Date(b.fecha_programada || b.fecha_mantenimiento || b.fecha_ingreso || b.fecha || 0);
          return dateB - dateA;
        });
      } else if (filters.sort === 'oldest') {
        rawList.sort((a, b) => {
          const dateA = new Date(a.fecha_programada || a.fecha_mantenimiento || a.fecha_ingreso || a.fecha || 0);
          const dateB = new Date(b.fecha_programada || b.fecha_mantenimiento || b.fecha_ingreso || b.fecha || 0);
          return dateA - dateB;
        });
      } else if (filters.sort === 'name_az') {
        rawList.sort((a, b) => {
          const nameA = (a.nombre_conductor || a.nombre_ruta || a.marca || a.detalle || '').toLowerCase();
          const nameB = (b.nombre_conductor || b.nombre_ruta || b.marca || b.detalle || '').toLowerCase();
          return nameA.localeCompare(nameB);
        });
      } else if (filters.sort === 'name_za') {
        rawList.sort((a, b) => {
          const nameA = (a.nombre_conductor || a.nombre_ruta || a.marca || a.detalle || '').toLowerCase();
          const nameB = (b.nombre_conductor || b.nombre_ruta || b.marca || b.detalle || '').toLowerCase();
          return nameB.localeCompare(nameA);
        });
      }
    }

    return rawList;
  };

  const processedData = getFilteredData();

  // Pagination bounds
  const totalItems = processedData.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentItems = processedData.slice(startIndex, startIndex + itemsPerPage);

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  // Format active report label name for user messages
  const getActiveReportLabel = () => {
    switch (activeReport) {
      case 'vehicles': return 'Reporte de Vehículos';
      case 'drivers': return 'Reporte de Conductores';
      case 'routes': return 'Reporte de Rutas';
      case 'maintenances': return 'Reporte de Mantenimientos';
      case 'day': return 'Reporte Diario de Actividad';
      case 'week': return 'Reporte Semanal de Actividad';
      case 'month': return 'Reporte Mensual de Actividad';
      case 'general': return 'Resumen General del Sistema';
      default: return 'Reporte Personalizado';
    }
  };

  // Handle column header clicks for instant sorting
  const handleRequestSort = (columnKey) => {
    let direction = 'asc';
    if (tableSort.column === columnKey && tableSort.direction === 'asc') {
      direction = 'desc';
    }
    setTableSort({ column: columnKey, direction });
  };

  // Reset page pagination on filter parameter change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  return (
    <div className="space-y-8 animate-in fade-in duration-700 relative">
      {/* Toast Manager Overlay */}
      <div className="fixed top-6 right-6 z-50 flex flex-col gap-3 pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: -20, scale: 0.9, x: 20 }}
              animate={{ opacity: 1, y: 0, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.95, x: 20 }}
              className={cn(
                "p-4 rounded-xl shadow-2xl border flex items-center gap-3 w-80 pointer-events-auto backdrop-blur-md",
                toast.type === 'error'
                  ? 'bg-red-500/10 border-red-500/20 text-red-400'
                  : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
              )}
            >
              <div className="shrink-0">
                {toast.type === 'error' ? (
                  <Info size={18} className="text-red-400 animate-pulse" />
                ) : (
                  <Check size={18} className="text-emerald-400 animate-bounce" />
                )}
              </div>
              <p className="text-sm font-medium flex-1 leading-snug text-v-white">{toast.message}</p>
              <button
                onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
                className="text-v-gray hover:text-v-white p-1 rounded-lg hover:bg-v-dark-border/40 transition-colors"
              >
                <X size={14} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Global simulated progress overlay for export action */}
      <AnimatePresence>
        {isExporting && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="bg-v-dark-soft border border-v-dark-border rounded-2xl shadow-2xl p-8 max-w-sm w-full text-center space-y-5"
            >
              <div className="relative inline-flex items-center justify-center">
                <div className="h-16 w-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                <FileDown className="absolute h-6 w-6 text-primary animate-pulse" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-v-white">Generando archivo de reporte</h4>
                <p className="text-v-gray text-xs mt-1">Por favor espere mientras se procesan los datos...</p>
              </div>
              <div className="bg-v-dark p-3.5 rounded-xl border border-v-dark-border font-mono text-xs text-primary font-bold animate-pulse">
                {exportProgress || 'Procesando registros...'}
              </div>
              <div className="w-full bg-v-dark-border h-1.5 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: '5%' }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 2.2, ease: 'easeInOut' }}
                  className="bg-primary h-full"
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Section */}
      <section className="relative overflow-hidden rounded-3xl p-8 bg-v-dark-soft border border-v-dark-border flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 blur-[100px] -mr-32 -mt-32 pointer-events-none" />
        <div className="relative z-10 space-y-2 max-w-2xl">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shadow-[0_0_15px_rgba(16,185,129,0.15)]">
              <BarChart3 size={20} />
            </div>
            <h2 className="text-3xl font-bold text-v-white">{t('reports.title')}</h2>
          </div>
          <p className="text-v-gray text-sm md:text-base leading-relaxed">
            {t('reports.subtitle')}
          </p>
        </div>

        {/* Quick Export Button Dropdown Container */}
        <div className="relative z-20 self-stretch md:self-auto shrink-0" ref={quickExportRef}>
          <Button
            variant="primary"
            onClick={() => setIsQuickExportOpen(!isQuickExportOpen)}
            className="flex items-center gap-2.5 w-full md:w-auto font-bold"
            disabled={isExporting}
          >
            <Download size={16} /> {t('reports.btnExport')} <ChevronDown size={14} className={cn("transition-transform duration-200", isQuickExportOpen && "rotate-180")} />
          </Button>

          <AnimatePresence>
            {isQuickExportOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 8 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 mt-2 w-64 bg-v-dark-soft/95 backdrop-blur-md border border-v-dark-border rounded-xl shadow-2xl p-2 z-[60] flex flex-col gap-1 focus:outline-none"
              >
                <div className="px-3 py-2 text-[11px] font-bold text-v-gray uppercase tracking-wider border-b border-v-dark-border/60 mb-1">
                  Descargas directas (PDF)
                </div>
                <button
                  onClick={() => handleRunExportSimulation('Resumen General de Flota', 'pdf')}
                  className="flex items-center gap-2.5 w-full px-3 py-2 text-sm rounded-lg text-v-white hover:bg-primary/10 hover:text-primary hover:translate-x-1 transition-all duration-150 text-left cursor-pointer"
                >
                  <BarChart3 size={15} /> Resumen General (PDF)
                </button>
                <button
                  onClick={() => handleRunExportSimulation('Listado de Vehículos', 'pdf')}
                  className="flex items-center gap-2.5 w-full px-3 py-2 text-sm rounded-lg text-v-white hover:bg-primary/10 hover:text-primary hover:translate-x-1 transition-all duration-150 text-left cursor-pointer"
                >
                  <Truck size={15} /> Todos los Vehículos (PDF)
                </button>
                <button
                  onClick={() => handleRunExportSimulation('Listado de Conductores', 'pdf')}
                  className="flex items-center gap-2.5 w-full px-3 py-2 text-sm rounded-lg text-v-white hover:bg-primary/10 hover:text-primary hover:translate-x-1 transition-all duration-150 text-left cursor-pointer"
                >
                  <Users size={15} /> Todos los Conductores (PDF)
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* QUICK REPORTS BUTTONS SECTION */}
      <section className="space-y-4">
        <h3 className="text-lg font-bold text-v-white flex items-center gap-2">
          <Clock size={18} className="text-primary" /> {t('reports.selectReport')}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            onClick={() => handleSelectReport('day')}
            className={cn(
              "flex items-start gap-4 p-5 rounded-2xl border text-left transition-all duration-200 group relative overflow-hidden",
              activeReport === 'day'
                ? "bg-primary/5 border-primary shadow-[0_0_15px_rgba(16,185,129,0.08)]"
                : "bg-v-dark-soft border-v-dark-border hover:border-v-gray/50 hover:bg-v-dark-border/10"
            )}
            disabled={isExporting}
          >
            <div className="p-3 rounded-xl bg-v-dark border border-v-dark-border text-primary group-hover:scale-105 transition-transform shrink-0">
              <Calendar size={18} />
            </div>
            <div className="space-y-1">
              <h4 className="font-bold text-sm text-v-white group-hover:text-primary transition-colors">{t('reports.dayReport', 'Reporte del día')}</h4>
              <p className="text-xs text-v-gray leading-snug">Rutas y mantenimientos planificados para hoy.</p>
            </div>
          </button>

          <button
            onClick={() => handleSelectReport('week')}
            className={cn(
              "flex items-start gap-4 p-5 rounded-2xl border text-left transition-all duration-200 group relative overflow-hidden",
              activeReport === 'week'
                ? "bg-primary/5 border-primary shadow-[0_0_15px_rgba(16,185,129,0.08)]"
                : "bg-v-dark-soft border-v-dark-border hover:border-v-gray/50 hover:bg-v-dark-border/10"
            )}
            disabled={isExporting}
          >
            <div className="p-3 rounded-xl bg-v-dark border border-v-dark-border text-primary group-hover:scale-105 transition-transform shrink-0">
              <Clock size={18} />
            </div>
            <div className="space-y-1">
              <h4 className="font-bold text-sm text-v-white group-hover:text-primary transition-colors">{t('reports.weekReport', 'Reporte de esta semana')}</h4>
              <p className="text-xs text-v-gray leading-snug">Consolidado operativo de los últimos 7 días.</p>
            </div>
          </button>

          <button
            onClick={() => handleSelectReport('month')}
            className={cn(
              "flex items-start gap-4 p-5 rounded-2xl border text-left transition-all duration-200 group relative overflow-hidden",
              activeReport === 'month'
                ? "bg-primary/5 border-primary shadow-[0_0_15px_rgba(16,185,129,0.08)]"
                : "bg-v-dark-soft border-v-dark-border hover:border-v-gray/50 hover:bg-v-dark-border/10"
            )}
            disabled={isExporting}
          >
            <div className="p-3 rounded-xl bg-v-dark border border-v-dark-border text-primary group-hover:scale-105 transition-transform shrink-0">
              <TrendingUp size={18} />
            </div>
            <div className="space-y-1">
              <h4 className="font-bold text-sm text-v-white group-hover:text-primary transition-colors">{t('reports.monthReport', 'Reporte del mes')}</h4>
              <p className="text-xs text-v-gray leading-snug">Análisis de rendimiento mensual de la flota.</p>
            </div>
          </button>

          <button
            onClick={() => handleSelectReport('general')}
            className={cn(
              "flex items-start gap-4 p-5 rounded-2xl border text-left transition-all duration-200 group relative overflow-hidden",
              activeReport === 'general'
                ? "bg-primary/5 border-primary shadow-[0_0_15px_rgba(16,185,129,0.08)]"
                : "bg-v-dark-soft border-v-dark-border hover:border-v-gray/50 hover:bg-v-dark-border/10"
            )}
            disabled={isExporting}
          >
            <div className="p-3 rounded-xl bg-v-dark border border-v-dark-border text-primary group-hover:scale-105 transition-transform shrink-0">
              <BarChart3 size={18} />
            </div>
            <div className="space-y-1">
              <h4 className="font-bold text-sm text-v-white group-hover:text-primary transition-colors">{t('reports.generalReport', 'Resumen general')}</h4>
              <p className="text-xs text-v-gray leading-snug">Base consolidada total de auditorías y estados.</p>
            </div>
          </button>
        </div>
      </section>

      {/* MODULE REPORTS CARD LIST */}
      <section className="space-y-4">
        <h3 className="text-lg font-bold text-v-white flex items-center gap-2">
          <Sliders size={18} className="text-primary" /> Reportes por módulo
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* VEHICLES MODULE CARD */}
          <div
            className={cn(
              "bg-v-dark-soft border p-6 rounded-2xl flex flex-col justify-between transition-colors group relative overflow-hidden",
              activeReport === 'vehicles' ? "border-primary shadow-[0_0_15px_rgba(16,185,129,0.08)]" : "border-v-dark-border hover:border-primary/50"
            )}
          >
            <div>
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 rounded-xl bg-v-dark border border-v-dark-border text-primary group-hover:scale-110 transition-transform shrink-0">
                  <Truck size={24} />
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold text-primary uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/10">
                    {t('sidebar.vehicles')}
                  </span>
                </div>
              </div>
              <div className="mb-5">
                <p className="text-v-gray text-xs font-medium mb-0.5">{t('reports.stats.totalRecords')}</p>
                <h3 className="text-3xl font-bold text-v-white">
                  {isLoadingCounts ? '...' : counts.vehicles}
                </h3>
                <p className="text-v-gray text-xs mt-1.5 leading-snug">Monitoreo de estado operativo, marca, kilometraje y tipos de flota.</p>
              </div>
            </div>
            <Button
              variant={activeReport === 'vehicles' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => handleSelectReport('vehicles')}
              className="w-full font-bold mt-auto"
              disabled={isExporting}
            >
              {t('reports.btnGenerate')}
            </Button>
          </div>

          {/* DRIVERS MODULE CARD */}
          <div
            className={cn(
              "bg-v-dark-soft border p-6 rounded-2xl flex flex-col justify-between transition-colors group relative overflow-hidden",
              activeReport === 'drivers' ? "border-primary shadow-[0_0_15px_rgba(16,185,129,0.08)]" : "border-v-dark-border hover:border-primary/50"
            )}
          >
            <div>
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 rounded-xl bg-v-dark border border-v-dark-border text-primary group-hover:scale-110 transition-transform shrink-0">
                  <Users size={24} />
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold text-primary uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/10">
                    Conductores
                  </span>
                </div>
              </div>
              <div className="mb-5">
                <p className="text-v-gray text-xs font-medium mb-0.5">Total registrados</p>
                <h3 className="text-3xl font-bold text-v-white">
                  {isLoadingCounts ? '...' : counts.drivers}
                </h3>
                <p className="text-v-gray text-xs mt-1.5 leading-snug">Información de licencias, cédulas de identidad, teléfono y estados.</p>
              </div>
            </div>
            <Button
              variant={activeReport === 'drivers' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => handleSelectReport('drivers')}
              className="w-full font-bold mt-auto"
              disabled={isExporting}
            >
              Generar reporte
            </Button>
          </div>

          {/* ROUTES MODULE CARD */}
          <div
            className={cn(
              "bg-v-dark-soft border p-6 rounded-2xl flex flex-col justify-between transition-colors group relative overflow-hidden",
              activeReport === 'routes' ? "border-primary shadow-[0_0_15px_rgba(16,185,129,0.08)]" : "border-v-dark-border hover:border-primary/50"
            )}
          >
            <div>
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 rounded-xl bg-v-dark border border-v-dark-border text-primary group-hover:scale-110 transition-transform shrink-0">
                  <MapPin size={24} />
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold text-primary uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/10">
                    Rutas
                  </span>
                </div>
              </div>
              <div className="mb-5">
                <p className="text-v-gray text-xs font-medium mb-0.5">Total registradas</p>
                <h3 className="text-3xl font-bold text-v-white">
                  {isLoadingCounts ? '...' : counts.routes}
                </h3>
                <p className="text-v-gray text-xs mt-1.5 leading-snug">Asignación de choferes, vehículos, coordenadas y progreso del viaje.</p>
              </div>
            </div>
            <Button
              variant={activeReport === 'routes' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => handleSelectReport('routes')}
              className="w-full font-bold mt-auto"
              disabled={isExporting}
            >
              Generar reporte
            </Button>
          </div>

          {/* MAINTENANCE MODULE CARD */}
          <div
            className={cn(
              "bg-v-dark-soft border p-6 rounded-2xl flex flex-col justify-between transition-colors group relative overflow-hidden",
              activeReport === 'maintenances' ? "border-primary shadow-[0_0_15px_rgba(16,185,129,0.08)]" : "border-v-dark-border hover:border-primary/50"
            )}
          >
            <div>
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 rounded-xl bg-v-dark border border-v-dark-border text-primary group-hover:scale-110 transition-transform shrink-0">
                  <Wrench size={24} />
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold text-primary uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/10">
                    Mantenimientos
                  </span>
                </div>
              </div>
              <div className="mb-5">
                <p className="text-v-gray text-xs font-medium mb-0.5">Total registrados</p>
                <h3 className="text-3xl font-bold text-v-white">
                  {isLoadingCounts ? '...' : counts.maintenances}
                </h3>
                <p className="text-v-gray text-xs mt-1.5 leading-snug">Seguimiento de costos operativos, tipos preventivos y programaciones.</p>
              </div>
            </div>
            <Button
              variant={activeReport === 'maintenances' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => handleSelectReport('maintenances')}
              className="w-full font-bold mt-auto"
              disabled={isExporting}
            >
              Generar reporte
            </Button>
          </div>
        </div>
      </section>

      {/* FILTER PANEL AND PREVIEW VIEW */}
      <AnimatePresence mode="wait">
        {activeReport ? (
          <motion.section
            key={activeReport}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="space-y-6"
          >
            <div className="border-t border-v-dark-border/60 my-6" />

            {/* Filter Panel Layout Header */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2.5">
                <SlidersHorizontal size={18} className="text-primary animate-pulse" />
                <h3 className="text-xl font-bold text-v-white">
                  Filtros & Vista Previa: <span className="text-primary font-extrabold">{getActiveReportLabel()}</span>
                </h3>
              </div>
              <p className="text-v-gray text-xs">
                Ajuste las dimensiones deseadas. Los resultados en la vista previa se actualizan en tiempo real.
              </p>
            </div>

            {/* Actual Form Filters Bar */}
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
                  {/* Render conditional statuses matching active report */}
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

            {/* PREVIEW TABLE WITH EXPORT OPTIONS */}
            <div className="bg-v-dark-soft border border-v-dark-border rounded-2xl overflow-hidden shadow-2xl relative">
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
                    className="flex items-center gap-2 w-full sm:w-auto font-bold border-v-gray-dark text-v-white hover:bg-v-dark-border"
                  >
                    <Download size={15} /> Exportar reporte <ChevronDown size={14} className={cn("transition-transform duration-200", isExportMenuOpen && "rotate-180")} />
                  </Button>

                  <AnimatePresence>
                    {isExportMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 6 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 6 }}
                        className="absolute right-0 mt-2 w-56 bg-v-dark-soft/95 backdrop-blur-md border border-v-dark-border rounded-xl shadow-2xl p-1.5 z-40 flex flex-col gap-1 focus:outline-none"
                      >
                        <button
                          onClick={() => handleRunExportSimulation(getActiveReportLabel(), 'pdf')}
                          className="flex items-center gap-2.5 w-full px-3 py-2 text-sm rounded-lg text-v-white hover:bg-primary/10 hover:text-primary transition-colors text-left cursor-pointer"
                        >
                          <FileText size={15} className="text-red-500" /> Exportar como PDF
                        </button>
                        {user?.role === 'Super Administrador' && (
                          <button
                            onClick={() => handleRunExportSimulation(getActiveReportLabel(), 'xlsx')}
                            className="flex items-center gap-2.5 w-full px-3 py-2 text-sm rounded-lg text-v-white hover:bg-primary/10 hover:text-primary transition-colors text-left cursor-pointer"
                          >
                            <FileSpreadsheet size={15} className="text-emerald-500" /> Exportar como Excel (.xlsx)
                          </button>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Main table loading/empty/data states */}
              {isLoadingPreview ? (
                /* Beautiful Skeleton loader */
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
                /* Elegant Empty State */
                <div className="flex flex-col items-center justify-center min-h-[300px] p-8 text-center bg-v-dark/10">
                  <div className="h-14 w-14 rounded-full bg-v-dark border border-v-dark-border text-v-gray flex items-center justify-center mb-4">
                    <Info size={24} />
                  </div>
                  <h5 className="text-base font-bold text-v-white mb-1">Sin registros coincidentes</h5>
                  <p className="text-v-gray text-xs max-w-sm">No existen datos que cumplan los filtros actuales en este reporte. Modifique las fechas, el estado o el término de búsqueda.</p>
                </div>
              ) : (
                /* Table Content view */
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[700px]">
                    <thead>
                      <tr className="border-b border-v-dark-border bg-v-dark/30">
                        {/* VEHICLES HEADERS */}
                        {activeReport === 'vehicles' && (
                          <>
                            <th onClick={() => handleRequestSort('placa')} className="p-4 text-xs font-bold uppercase text-v-gray tracking-wider cursor-pointer hover:text-v-white select-none">
                              Placa {tableSort.column === 'placa' && (tableSort.direction === 'asc' ? '▲' : '▼')}
                            </th>
                            <th onClick={() => handleRequestSort('marca')} className="p-4 text-xs font-bold uppercase text-v-gray tracking-wider cursor-pointer hover:text-v-white select-none">
                              Vehículo / Modelo {tableSort.column === 'marca' && (tableSort.direction === 'asc' ? '▲' : '▼')}
                            </th>
                            <th onClick={() => handleRequestSort('anio')} className="p-4 text-xs font-bold uppercase text-v-gray tracking-wider cursor-pointer hover:text-v-white select-none">
                              Año / Color {tableSort.column === 'anio' && (tableSort.direction === 'asc' ? '▲' : '▼')}
                            </th>
                            <th onClick={() => handleRequestSort('tipo_vehiculo')} className="p-4 text-xs font-bold uppercase text-v-gray tracking-wider cursor-pointer hover:text-v-white select-none">
                              Tipo / Capacidad {tableSort.column === 'tipo_vehiculo' && (tableSort.direction === 'asc' ? '▲' : '▼')}
                            </th>
                            <th onClick={() => handleRequestSort('kilometraje_actual')} className="p-4 text-xs font-bold uppercase text-v-gray tracking-wider cursor-pointer hover:text-v-white select-none">
                              Kilometraje {tableSort.column === 'kilometraje_actual' && (tableSort.direction === 'asc' ? '▲' : '▼')}
                            </th>
                            <th className="p-4 text-xs font-bold uppercase text-v-gray tracking-wider">Estado</th>
                          </>
                        )}

                        {/* DRIVERS HEADERS */}
                        {activeReport === 'drivers' && (
                          <>
                            <th onClick={() => handleRequestSort('nombre_conductor')} className="p-4 text-xs font-bold uppercase text-v-gray tracking-wider cursor-pointer hover:text-v-white select-none">
                              Conductor {tableSort.column === 'nombre_conductor' && (tableSort.direction === 'asc' ? '▲' : '▼')}
                            </th>
                            <th onClick={() => handleRequestSort('cedula_conductor')} className="p-4 text-xs font-bold uppercase text-v-gray tracking-wider cursor-pointer hover:text-v-white select-none">
                              Cédula {tableSort.column === 'cedula_conductor' && (tableSort.direction === 'asc' ? '▲' : '▼')}
                            </th>
                            <th className="p-4 text-xs font-bold uppercase text-v-gray tracking-wider">Teléfono</th>
                            <th onClick={() => handleRequestSort('licencia')} className="p-4 text-xs font-bold uppercase text-v-gray tracking-wider cursor-pointer hover:text-v-white select-none">
                              Licencia {tableSort.column === 'licencia' && (tableSort.direction === 'asc' ? '▲' : '▼')}
                            </th>
                            <th onClick={() => handleRequestSort('fecha_ingreso')} className="p-4 text-xs font-bold uppercase text-v-gray tracking-wider cursor-pointer hover:text-v-white select-none">
                              Fecha Ingreso {tableSort.column === 'fecha_ingreso' && (tableSort.direction === 'asc' ? '▲' : '▼')}
                            </th>
                            <th className="p-4 text-xs font-bold uppercase text-v-gray tracking-wider">Estado</th>
                          </>
                        )}

                        {/* ROUTES HEADERS */}
                        {activeReport === 'routes' && (
                          <>
                            <th onClick={() => handleRequestSort('codigo_ruta')} className="p-4 text-xs font-bold uppercase text-v-gray tracking-wider cursor-pointer hover:text-v-white select-none">
                              Código {tableSort.column === 'codigo_ruta' && (tableSort.direction === 'asc' ? '▲' : '▼')}
                            </th>
                            <th onClick={() => handleRequestSort('nombre_ruta')} className="p-4 text-xs font-bold uppercase text-v-gray tracking-wider cursor-pointer hover:text-v-white select-none">
                              Nombre Ruta {tableSort.column === 'nombre_ruta' && (tableSort.direction === 'asc' ? '▲' : '▼')}
                            </th>
                            <th className="p-4 text-xs font-bold uppercase text-v-gray tracking-wider">Asignación</th>
                            <th className="p-4 text-xs font-bold uppercase text-v-gray tracking-wider">Origen / Destino</th>
                            <th onClick={() => handleRequestSort('fecha_programada')} className="p-4 text-xs font-bold uppercase text-v-gray tracking-wider cursor-pointer hover:text-v-white select-none">
                              Fecha Programada {tableSort.column === 'fecha_programada' && (tableSort.direction === 'asc' ? '▲' : '▼')}
                            </th>
                            <th className="p-4 text-xs font-bold uppercase text-v-gray tracking-wider">Estado</th>
                          </>
                        )}

                        {/* MAINTENANCE HEADERS */}
                        {activeReport === 'maintenances' && (
                          <>
                            <th className="p-4 text-xs font-bold uppercase text-v-gray tracking-wider">Vehículo</th>
                            <th onClick={() => handleRequestSort('tipo_mantenimiento')} className="p-4 text-xs font-bold uppercase text-v-gray tracking-wider cursor-pointer hover:text-v-white select-none">
                              Tipo {tableSort.column === 'tipo_mantenimiento' && (tableSort.direction === 'asc' ? '▲' : '▼')}
                            </th>
                            <th className="p-4 text-xs font-bold uppercase text-v-gray tracking-wider">Descripción</th>
                            <th onClick={() => handleRequestSort('fecha_mantenimiento')} className="p-4 text-xs font-bold uppercase text-v-gray tracking-wider cursor-pointer hover:text-v-white select-none">
                              Fecha {tableSort.column === 'fecha_mantenimiento' && (tableSort.direction === 'asc' ? '▲' : '▼')}
                            </th>
                            <th onClick={() => handleRequestSort('costo_mantenimiento')} className="p-4 text-xs font-bold uppercase text-v-gray tracking-wider cursor-pointer hover:text-v-white select-none">
                              Costo {tableSort.column === 'costo_mantenimiento' && (tableSort.direction === 'asc' ? '▲' : '▼')}
                            </th>
                            <th className="p-4 text-xs font-bold uppercase text-v-gray tracking-wider">Estado</th>
                          </>
                        )}

                        {/* GENERAL AUDIT HEADERS */}
                        {['day', 'week', 'month', 'general'].includes(activeReport) && (
                          <>
                            <th onClick={() => handleRequestSort('modulo')} className="p-4 text-xs font-bold uppercase text-v-gray tracking-wider cursor-pointer hover:text-v-white select-none">
                              Módulo {tableSort.column === 'modulo' && (tableSort.direction === 'asc' ? '▲' : '▼')}
                            </th>
                            <th onClick={() => handleRequestSort('detalle')} className="p-4 text-xs font-bold uppercase text-v-gray tracking-wider cursor-pointer hover:text-v-white select-none">
                              Actividad / Detalle {tableSort.column === 'detalle' && (tableSort.direction === 'asc' ? '▲' : '▼')}
                            </th>
                            <th onClick={() => handleRequestSort('fecha')} className="p-4 text-xs font-bold uppercase text-v-gray tracking-wider cursor-pointer hover:text-v-white select-none">
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
                            {/* VEHICLES CELLS */}
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

                            {/* DRIVERS CELLS */}
                            {activeReport === 'drivers' && (
                              <>
                                <td className="p-4">
                                  <div className="font-semibold text-v-white text-sm">{item.nombre_conductor} {item.apellido_conductor}</div>
                                  <div className="text-v-gray text-[11px] font-mono">ID: {item.id_conductor?.slice(0,8)}</div>
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

                            {/* ROUTES CELLS */}
                            {activeReport === 'routes' && (
                              <>
                                <td className="p-4 font-mono text-xs font-bold text-primary">{item.codigo_ruta}</td>
                                <td className="p-4 text-v-white text-sm font-semibold">{item.nombre_ruta}</td>
                                <td className="p-4 space-y-0.5">
                                  <div className="text-xs text-v-white font-medium flex items-center gap-1">
                                    <Users size={12} className="text-primary" /> {driversMap[item.id_conductor] || 'Sin asignar'}
                                  </div>
                                  <div className="text-[11px] text-v-gray flex items-center gap-1">
                                    <Truck size={12} /> {vehiclesMap[item.id_vehiculo] || 'Sin vehículo'}
                                  </div>
                                </td>
                                <td className="p-4 space-y-0.5 max-w-[200px] truncate">
                                  <div className="text-xs text-v-white truncate">O: {item.origen}</div>
                                  <div className="text-[11px] text-v-gray truncate">D: {item.destino}</div>
                                </td>
                                <td className="p-4 text-v-gray text-xs font-medium">{item.fecha_programada?.replace('T', ' ')}</td>
                                <td className="p-4">
                                  <span className={cn("text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider border", STATUS_STYLES[item.estado_ruta])}>
                                    {item.estado_ruta}
                                  </span>
                                </td>
                              </>
                            )}

                            {/* MAINTENANCE CELLS */}
                            {activeReport === 'maintenances' && (
                              <>
                                <td className="p-4">
                                  <div className="font-semibold text-v-white text-xs">{vehiclesMap[item.id_vehiculo] || 'Unidad Externa'}</div>
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

                            {/* GENERAL AUDIT CELLS */}
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
                                <td className="p-4 text-v-gray text-xs">{item.fecha?.replace('T', ' ')}</td>
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
                      onClick={handlePrevPage}
                      disabled={currentPage === 1}
                      className="p-1.5 rounded-lg border border-v-dark-border bg-v-dark text-v-gray hover:text-v-white disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <span className="flex items-center px-3 font-semibold text-v-white text-xs">
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
          </motion.section>
        ) : (
          /* Landing/Selection Prompt card */
          <motion.div
            key="empty-prompt"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center min-h-[300px] border border-dashed border-v-dark-border rounded-3xl p-12 text-center bg-v-dark-soft/40"
          >
            <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-5 shadow-inner">
              <BarChart3 size={28} />
            </div>
            <h4 className="text-xl font-bold text-v-white mb-2">{t('reports.selectReport')}</h4>
            <p className="text-v-gray text-xs sm:text-sm max-w-sm leading-relaxed">
              Haga clic sobre cualquiera de los módulos o periodos de tiempo en la parte superior para cargar el panel de filtros y la vista previa interactiva.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Reports;
