import axios from 'axios';
import { API_BASE_URL } from '../../../config/api';

const API_URL = `${API_BASE_URL}/api/maintenance`;

export const maintenanceService = {
  async getMaintenances() {
    try {
      const response = await axios.get(API_URL);
      return response.data;
    } catch (error) {
      const message = error.response?.data?.detail || 'Error al obtener los registros de mantenimiento.';
      throw new Error(message);
    }
  },

  async createMaintenance(maintenanceData) {
    try {
      const formattedData = {
        ...maintenanceData,
        costo_mantenimiento: parseFloat(maintenanceData.costo_mantenimiento),
        kilometraje_mantenimiento: parseInt(maintenanceData.kilometraje_mantenimiento, 10)
      };
      const response = await axios.post(API_URL, formattedData);
      return response.data;
    } catch (error) {
      let message = 'Error al crear el registro de mantenimiento.';
      const detail = error.response?.data?.detail;
      if (Array.isArray(detail)) {
        message = detail.map(err => `${err.loc ? err.loc.slice(-1)[0] : 'campo'}: ${err.msg}`).join(', ');
      } else if (typeof detail === 'string') {
        message = detail;
      }
      throw new Error(message);
    }
  },

  async updateMaintenance(id_mantenimiento, maintenanceData) {
    try {
      const formattedData = {
        ...maintenanceData,
        costo_mantenimiento: parseFloat(maintenanceData.costo_mantenimiento),
        kilometraje_mantenimiento: parseInt(maintenanceData.kilometraje_mantenimiento, 10)
      };
      const response = await axios.put(`${API_URL}/${id_mantenimiento}`, formattedData);
      return response.data;
    } catch (error) {
      let message = 'Error al actualizar el registro de mantenimiento.';
      const detail = error.response?.data?.detail;
      if (Array.isArray(detail)) {
        message = detail.map(err => `${err.loc ? err.loc.slice(-1)[0] : 'campo'}: ${err.msg}`).join(', ');
      } else if (typeof detail === 'string') {
        message = detail;
      }
      throw new Error(message);
    }
  },

  async deleteMaintenance(id_mantenimiento) {
    try {
      await axios.delete(`${API_URL}/${id_mantenimiento}`);
      return true;
    } catch (error) {
      const message = error.response?.data?.detail || 'Error al eliminar el registro de mantenimiento.';
      throw new Error(message);
    }
  }
};
