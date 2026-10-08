import axios from 'axios';
import { API_BASE_URL } from '../../../config/api';

const API_URL = `${API_BASE_URL}/api/routes`;
const ROUTING_API_URL = `${API_BASE_URL}/api/routing`;

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
      const paradasVal = typeof routeData.paradas === 'object'
        ? JSON.stringify(routeData.paradas)
        : (routeData.paradas || null);

      const formattedData = {
        codigo_ruta: routeData.codigo_ruta.trim().toUpperCase(),
        nombre_ruta: routeData.nombre_ruta.trim(),
        origen: routeData.origen.trim(),
        destino: routeData.destino.trim(),
        paradas: paradasVal,
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
      const paradasVal = typeof routeData.paradas === 'object'
        ? JSON.stringify(routeData.paradas)
        : (routeData.paradas || null);

      const formattedData = {
        codigo_ruta: routeData.codigo_ruta.trim().toUpperCase(),
        nombre_ruta: routeData.nombre_ruta.trim(),
        origen: routeData.origen.trim(),
        destino: routeData.destino.trim(),
        paradas: paradasVal,
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
  },

  async getActiveTracking() {
    try {
      const response = await axios.get(`${API_URL}/active-tracking`);
      return response.data;
    } catch (error) {
      console.warn('Error fetching active trackings:', error);
      return [];
    }
  },

  async calculateRoute({ origin, destination, waypoints, profile = 'driving' }) {
    try {
      let payload = { profile };

      if (waypoints && Array.isArray(waypoints) && waypoints.length >= 2) {
        payload.waypoints = waypoints.map(pt => {
          if (Array.isArray(pt)) {
            return { lat: pt[0], lng: pt[1] };
          }
          return pt;
        });
      } else if (origin && destination) {
        payload.origin = { lat: origin[0], lng: origin[1] };
        payload.destination = { lat: destination[0], lng: destination[1] };
      } else {
        throw new Error('Se requieren al menos 2 puntos para calcular la ruta.');
      }

      const response = await axios.post(`${ROUTING_API_URL}/route`, payload);
      return response.data;
    } catch (error) {
      const message = error.response?.data?.detail || 'No fue posible calcular la ruta.';
      throw new Error(message);
    }
  }
};
