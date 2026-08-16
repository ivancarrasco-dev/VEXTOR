import { useState, useEffect } from 'react';
import { vehicleService } from '../../Vehicles/services/vehicleService';
import { driverService } from '../../Drivers/services/driverService';
import { routeService } from '../../Routes/services/routeService';
import { maintenanceService } from '../../Maintenance/services/maintenanceService';

export const useReports = () => {
  const [activeReport, setActiveReport] = useState(null);

  const [counts, setCounts] = useState({
    vehicles: 0,
    drivers: 0,
    routes: 0,
    maintenances: 0
  });

  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [maintenances, setMaintenances] = useState([]);

  const [vehiclesMap, setVehiclesMap] = useState({});
  const [driversMap, setDriversMap] = useState({});

  const [isLoadingCounts, setIsLoadingCounts] = useState(true);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);

  const [filters, setFilters] = useState({
    dateStart: '',
    dateEnd: '',
    status: '',
    search: '',
    sort: 'recent',
    type: ''
  });

  const [tableSort, setTableSort] = useState({ column: '', direction: 'asc' });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  const loadSystemStats = async () => {
    setIsLoadingCounts(true);
    try {
      const [vehList, drvList, rtList, maintList] = await Promise.all([
        vehicleService.getVehicles().catch(() => []),
        driverService.getDrivers().catch(() => []),
        routeService.getRoutes().catch(() => []),
        maintenanceService.getMaintenances().catch(() => [])
      ]);

      const vArr = Array.isArray(vehList) ? vehList : [];
      const dArr = Array.isArray(drvList) ? drvList : [];
      const rArr = Array.isArray(rtList) ? rtList : [];
      const mArr = Array.isArray(maintList) ? maintList : [];

      setVehicles(vArr);
      setDrivers(dArr);
      setRoutes(rArr);
      setMaintenances(mArr);

      setCounts({
        vehicles: vArr.length,
        drivers: dArr.length,
        routes: rArr.length,
        maintenances: mArr.length
      });

      const vMap = {};
      vArr.forEach(v => {
        if (v && v.id_vehiculo) {
          vMap[v.id_vehiculo] = `${v.marca || ''} ${v.modelo || ''} [${v.placa || ''}]`.trim();
        }
      });
      setVehiclesMap(vMap);

      const dMap = {};
      dArr.forEach(d => {
        if (d && d.id_conductor) {
          dMap[d.id_conductor] = `${d.nombre_conductor || ''} ${d.apellido_conductor || ''}`.trim();
        }
      });
      setDriversMap(dMap);

    } catch (err) {
      console.error('Error cargando datos de reportes:', err);
    } finally {
      setIsLoadingCounts(false);
    }
  };

  useEffect(() => {
    loadSystemStats();
  }, []);

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

    setIsLoadingPreview(true);
    setTimeout(() => {
      setIsLoadingPreview(false);
    }, 400);
  };

  const getFilteredData = () => {
    if (!activeReport) return [];

    let rawList = [];

    if (activeReport === 'vehicles') {
      rawList = vehicles.map(v => ({
        ...v,
        _searchString: `${v.placa || ''} ${v.marca || ''} ${v.modelo || ''} ${v.tipo_vehiculo || ''}`.toLowerCase()
      }));
    } else if (activeReport === 'drivers') {
      rawList = drivers.map(d => ({
        ...d,
        _searchString: `${d.nombre_conductor || ''} ${d.apellido_conductor || ''} ${d.cedula_conductor || ''} ${d.licencia || ''}`.toLowerCase()
      }));
    } else if (activeReport === 'routes') {
      rawList = routes.map(r => ({
        ...r,
        _searchString: `${r.codigo_ruta || ''} ${r.nombre_ruta || ''} ${vehiclesMap[r.id_vehiculo] || ''} ${driversMap[r.id_conductor] || ''}`.toLowerCase()
      }));
    } else if (activeReport === 'maintenances') {
      rawList = maintenances.map(m => ({
        ...m,
        _searchString: `${m.tipo_mantenimiento || ''} ${m.descripcion_mantenimiento || ''} ${vehiclesMap[m.id_vehiculo] || ''}`.toLowerCase()
      }));
    } else if (['day', 'week', 'month', 'general'].includes(activeReport)) {
      const allEvents = [];

      routes.forEach(r => {
        allEvents.push({
          id: r.id_ruta,
          modulo: 'Rutas',
          detalle: `Ruta ${r.codigo_ruta || ''}: ${r.nombre_ruta || ''}`,
          fecha: r.fecha_programada || '',
          estado: r.estado_ruta || 'PROGRAMADA',
          responsable: driversMap[r.id_conductor] || 'Sin asignar',
          extra: vehiclesMap[r.id_vehiculo] || 'Sin vehículo'
        });
      });

      maintenances.forEach(m => {
        allEvents.push({
          id: m.id_mantenimiento,
          modulo: 'Mantenimientos',
          detalle: `Mantenimiento ${m.tipo_mantenimiento || ''}: ${m.descripcion_mantenimiento || ''}`,
          fecha: m.fecha_mantenimiento || '',
          estado: m.estado_mantenimiento || 'PROGRAMADO',
          responsable: 'Taller Autorizado',
          extra: vehiclesMap[m.id_vehiculo] || 'Sin vehículo'
        });
      });

      drivers.forEach(d => {
        allEvents.push({
          id: d.id_conductor,
          modulo: 'Conductores',
          detalle: `Ingreso Conductor: ${d.nombre_conductor || ''} ${d.apellido_conductor || ''}`,
          fecha: d.fecha_ingreso || '',
          estado: d.estado_conductor || 'ACTIVO',
          responsable: 'Recursos Humanos',
          extra: `Cédula: ${d.cedula_conductor || ''}`
        });
      });

      const now = new Date();
      rawList = allEvents.filter(evt => {
        if (!evt.fecha) return true;
        const evtDate = new Date(evt.fecha);
        if (isNaN(evtDate.getTime())) return true;

        const diffTime = now.getTime() - evtDate.getTime();
        const diffDays = diffTime / (1000 * 60 * 60 * 24);

        if (activeReport === 'day') {
          return diffDays >= -1 && diffDays <= 1;
        }
        if (activeReport === 'week') {
          return diffDays >= -1 && diffDays <= 7;
        }
        if (activeReport === 'month') {
          return diffDays >= -1 && diffDays <= 30;
        }
        return true;
      });

      rawList = rawList.map(e => ({
        ...e,
        _searchString: `${e.modulo} ${e.detalle} ${e.responsable} ${e.extra}`.toLowerCase()
      }));
    }

    if (filters.search) {
      const q = filters.search.trim().toLowerCase();
      rawList = rawList.filter(item => item._searchString?.includes(q));
    }

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

    if (filters.dateStart) {
      const startLimit = new Date(filters.dateStart);
      rawList = rawList.filter(item => {
        const itemDateVal = item.fecha_programada || item.fecha_mantenimiento || item.fecha_ingreso || item.fecha;
        if (!itemDateVal) return true;
        const itemDate = new Date(itemDateVal);
        return isNaN(itemDate.getTime()) || itemDate >= startLimit;
      });
    }

    if (filters.dateEnd) {
      const endLimit = new Date(filters.dateEnd);
      endLimit.setHours(23, 59, 59, 999);
      rawList = rawList.filter(item => {
        const itemDateVal = item.fecha_programada || item.fecha_mantenimiento || item.fecha_ingreso || item.fecha;
        if (!itemDateVal) return true;
        const itemDate = new Date(itemDateVal);
        return isNaN(itemDate.getTime()) || itemDate <= endLimit;
      });
    }

    if (filters.type) {
      if (activeReport === 'vehicles') {
        rawList = rawList.filter(item => item.tipo_vehiculo === filters.type);
      } else if (activeReport === 'drivers') {
        rawList = rawList.filter(item => item.licencia?.includes(filters.type));
      } else if (activeReport === 'maintenances') {
        rawList = rawList.filter(item => item.tipo_mantenimiento === filters.type);
      } else if (['day', 'week', 'month', 'general'].includes(activeReport)) {
        rawList = rawList.filter(item => item.modulo === filters.type);
      }
    }

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
  const totalItems = processedData.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentItems = processedData.slice(startIndex, startIndex + itemsPerPage);

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  const handleRequestSort = (columnKey) => {
    let direction = 'asc';
    if (tableSort.column === columnKey && tableSort.direction === 'asc') {
      direction = 'desc';
    }
    setTableSort({ column: columnKey, direction });
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

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

  return {
    activeReport,
    handleSelectReport,
    counts,
    isLoadingCounts,
    isLoadingPreview,
    filters,
    setFilters,
    tableSort,
    handleRequestSort,
    currentPage,
    totalPages,
    totalItems,
    startIndex,
    itemsPerPage,
    currentItems,
    handlePrevPage,
    handleNextPage,
    getActiveReportLabel,
    vehiclesMap,
    driversMap
  };
};
