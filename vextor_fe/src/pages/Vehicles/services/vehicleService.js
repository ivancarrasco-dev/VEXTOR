import axios from 'axios';
import { API_BASE_URL } from '../../../config/api';

const API_URL = `${API_BASE_URL}/api/vehicles`;

export const vehicleService = {
  async getVehicles() {
    try {
      const response = await axios.get(API_URL);
      return response.data;
    } catch (error) {
      const message = error.response?.data?.detail || 'Error al obtener los vehículos.';
      throw new Error(message);
    }
  },

  async createVehicle(vehicleData) {
    try {
      const formattedData = {
        ...vehicleData,
        placa: vehicleData.placa.toUpperCase(),
        anio: parseInt(vehicleData.anio, 10),
        capacidad_pasajeros: parseInt(vehicleData.capacidad_pasajeros, 10),
        kilometraje_actual: parseInt(vehicleData.kilometraje_actual, 10) || 0,
        kilometraje_limite_mantenimiento: parseInt(vehicleData.kilometraje_limite_mantenimiento, 10)
      };
      const response = await axios.post(API_URL, formattedData);
      return response.data;
    } catch (error) {
      const message = error.response?.data?.detail || 'Error al crear el vehículo.';
      throw new Error(message);
    }
  },
  

  async updateVehicle(id_vehiculo, vehicleData) {
    try {
      const formattedData = {
        ...vehicleData,
        placa: vehicleData.placa.toUpperCase(),
        anio: parseInt(vehicleData.anio, 10),
        capacidad_pasajeros: parseInt(vehicleData.capacidad_pasajeros, 10),
        kilometraje_actual: parseInt(vehicleData.kilometraje_actual, 10) || 0,
        kilometraje_limite_mantenimiento: parseInt(vehicleData.kilometraje_limite_mantenimiento, 10)
      };
      const response = await axios.put(`${API_URL}/${id_vehiculo}`, formattedData);
      return response.data;
    } catch (error) {
      const message = error.response?.data?.detail || 'Error al actualizar el vehículo.';
      throw new Error(message);
    }
  },

  async deleteVehicle(id_vehiculo) {
    try {
      await axios.delete(`${API_URL}/${id_vehiculo}`);
      return true;
    } catch (error) {
      const message = error.response?.data?.detail || 'Error al eliminar el vehículo.';
      throw new Error(message);
    }
  }
};
