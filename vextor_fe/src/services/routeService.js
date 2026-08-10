import axios from 'axios';

const API_URL = 'http://localhost:8000/api/routes';

export const routeService = {
  async getRoutes() {
    try {
      const response = await axios.get(API_URL);
      return response.data;
    } catch (error) {
      const message = error.response?.data?.detail || 'Error al obtener las rutas.';
      throw new Error(message);
    }
  },

  async createRoute(routeData) {
    try {
      const formattedData = {
        codigo_ruta: routeData.codigo_ruta.trim().toUpperCase(),
        nombre_ruta: routeData.nombre_ruta.trim(),
        origen: routeData.origen.trim(),
        destino: routeData.destino.trim(),
        fecha_programada: routeData.fecha_programada,
        hora_inicio_real: routeData.hora_inicio_real || null,
        hora_fin_real: routeData.hora_fin_real || null,
        estado_ruta: routeData.estado_ruta || 'PROGRAMADA',
        motivo_suspension: routeData.motivo_suspension || '',
        id_conductor: routeData.id_conductor,
        id_vehiculo: routeData.id_vehiculo
      };
      
      const response = await axios.post(API_URL, formattedData);
      return response.data;
    } catch (error) {
      const message = error.response?.data?.detail || 'Error al crear la ruta.';
      throw new Error(message);
    }
  },

  async updateRoute(id_ruta, routeData) {
    try {
      const formattedData = {
        codigo_ruta: routeData.codigo_ruta.trim().toUpperCase(),
        nombre_ruta: routeData.nombre_ruta.trim(),
        origen: routeData.origen.trim(),
        destino: routeData.destino.trim(),
        fecha_programada: routeData.fecha_programada,
        hora_inicio_real: routeData.hora_inicio_real || null,
        hora_fin_real: routeData.hora_fin_real || null,
        estado_ruta: routeData.estado_ruta || 'PROGRAMADA',
        motivo_suspension: routeData.estado_ruta === 'SUSPENDIDA' ? routeData.motivo_suspension : '',
        id_conductor: routeData.id_conductor,
        id_vehiculo: routeData.id_vehiculo
      };
      const response = await axios.put(`${API_URL}/${id_ruta}`, formattedData);
      return response.data;
    } catch (error) {
      const message = error.response?.data?.detail || 'Error al actualizar la ruta.';
      throw new Error(message);
    }
  },

  async deleteRoute(id_ruta) {
    try {
      await axios.delete(`${API_URL}/${id_ruta}`);
      return true;
    } catch (error) {
      const message = error.response?.data?.detail || 'Error al eliminar la ruta.';
      throw new Error(message);
    }
  }
};
