import { initializeDatabase, generateUUID } from './db';

// Ensure DB is initialized
initializeDatabase();

const delay = (ms = 400) => new Promise(resolve => setTimeout(resolve, ms));

export const routeService = {
  async getRoutes() {
    await delay();
    return JSON.parse(localStorage.getItem('vextor_db_routes') || '[]');
  },

  async createRoute(routeData) {
    await delay();
    const routes = JSON.parse(localStorage.getItem('vextor_db_routes') || '[]');

    // Check duplicate code
    const codeExists = routes.some(r => r.codigo_ruta.trim().toUpperCase() === routeData.codigo_ruta.trim().toUpperCase());
    if (codeExists) {
      throw new Error('El código de ruta ya está registrado.');
    }

    const newRoute = {
      id_ruta: generateUUID(),
      codigo_ruta: routeData.codigo_ruta.trim().toUpperCase(),
      nombre_ruta: routeData.nombre_ruta.trim(),
      origen: routeData.origen.trim(),
      destino: routeData.destino.trim(),
      fecha_programada: routeData.fecha_programada,
      hora_inicio_real: routeData.hora_inicio_real || '',
      hora_fin_real: routeData.hora_fin_real || '',
      estado_ruta: routeData.estado_ruta || 'PROGRAMADA',
      motivo_suspension: routeData.motivo_suspension || '',
      id_conductor: routeData.id_conductor,
      id_vehiculo: routeData.id_vehiculo
    };

    routes.unshift(newRoute);
    localStorage.setItem('vextor_db_routes', JSON.stringify(routes));

    return newRoute;
  },

  async updateRoute(id_ruta, routeData) {
    await delay();
    const routes = JSON.parse(localStorage.getItem('vextor_db_routes') || '[]');
    const index = routes.findIndex(r => r.id_ruta === id_ruta);
    if (index === -1) {
      throw new Error('Ruta no encontrada.');
    }

    // Check duplicate code (excluding itself)
    const codeExists = routes.some(r => r.id_ruta !== id_ruta && r.codigo_ruta.trim().toUpperCase() === routeData.codigo_ruta.trim().toUpperCase());
    if (codeExists) {
      throw new Error('El código de ruta ya está registrado en otra ruta.');
    }

    const updatedRoute = {
      ...routes[index],
      codigo_ruta: routeData.codigo_ruta.trim().toUpperCase(),
      nombre_ruta: routeData.nombre_ruta.trim(),
      origen: routeData.origen.trim(),
      destino: routeData.destino.trim(),
      fecha_programada: routeData.fecha_programada,
      hora_inicio_real: routeData.hora_inicio_real || '',
      hora_fin_real: routeData.hora_fin_real || '',
      estado_ruta: routeData.estado_ruta || 'PROGRAMADA',
      motivo_suspension: routeData.estado_ruta === 'SUSPENDIDA' ? routeData.motivo_suspension : '',
      id_conductor: routeData.id_conductor,
      id_vehiculo: routeData.id_vehiculo
    };

    routes[index] = updatedRoute;
    localStorage.setItem('vextor_db_routes', JSON.stringify(routes));

    return updatedRoute;
  },

  async deleteRoute(id_ruta) {
    await delay();
    let routes = JSON.parse(localStorage.getItem('vextor_db_routes') || '[]');
    const routeIndex = routes.findIndex(r => r.id_ruta === id_ruta);
    if (routeIndex === -1) {
      throw new Error('Ruta no encontrada.');
    }

    routes = routes.filter(r => r.id_ruta !== id_ruta);
    localStorage.setItem('vextor_db_routes', JSON.stringify(routes));

    return true;
  }
};
