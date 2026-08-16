import axios from 'axios';

const API_URL = 'http://localhost:8000/api/drivers';

export const driverService = {
  async getDrivers() {
    try {
      const response = await axios.get(API_URL);
      return response.data;
    } catch (error) {
      const message = error.response?.data?.detail || 'Error al obtener los conductores.';
      throw new Error(message);
    }
  },

  async createDriver(driverData) {
    try {
      const response = await axios.post(API_URL, driverData);
      return response.data;
    } catch (error) {
      const message = error.response?.data?.detail || 'Error al crear el conductor.';
      throw new Error(message);
    }
  },

  
  async updateDriver(id_conductor, driverData) {
    try {
      const response = await axios.put(`${API_URL}/${id_conductor}`, driverData);
      return response.data;
    } catch (error) {
      const message = error.response?.data?.detail || 'Error al actualizar el conductor.';
      throw new Error(message);
    }
  },

  async deleteDriver(id_conductor) {
    try {
      await axios.delete(`${API_URL}/${id_conductor}`);
      return true;
    } catch (error) {
      const message = error.response?.data?.detail || 'Error al eliminar el conductor.';
      throw new Error(message);
    }
  }
};
