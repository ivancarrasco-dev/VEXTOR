import { initializeDatabase, generateUUID } from './db';

// Ensure DB is initialized
initializeDatabase();

const delay = (ms = 400) => new Promise(resolve => setTimeout(resolve, ms));

export const vehicleService = {
  async getVehicles() {
    await delay();
    return JSON.parse(localStorage.getItem('vextor_db_vehicles') || '[]');
  },

  async createVehicle(vehicleData) {
    await delay();
    const vehicles = JSON.parse(localStorage.getItem('vextor_db_vehicles') || '[]');

    // Check for duplicate plates
    const plateExists = vehicles.some(v => v.placa.toUpperCase() === vehicleData.placa.toUpperCase());
    if (plateExists) {
      throw new Error('La placa ingresada ya existe en el sistema.');
    }

    const newVehicle = {
      id_vehiculo: generateUUID(),
      ...vehicleData,
      placa: vehicleData.placa.toUpperCase(),
      anio: parseInt(vehicleData.anio, 10),
      capacidad_pasajeros: parseInt(vehicleData.capacidad_pasajeros, 10),
      kilometraje_actual: parseInt(vehicleData.kilometraje_actual, 10) || 0,
      kilometraje_limite_mantenimiento: parseInt(vehicleData.kilometraje_limite_mantenimiento, 10)
    };

    vehicles.unshift(newVehicle);
    localStorage.setItem('vextor_db_vehicles', JSON.stringify(vehicles));
    return newVehicle;
  },

  async updateVehicle(id_vehiculo, vehicleData) {
    await delay();
    const vehicles = JSON.parse(localStorage.getItem('vextor_db_vehicles') || '[]');
    const index = vehicles.findIndex(v => v.id_vehiculo === id_vehiculo);
    if (index === -1) {
      throw new Error('Vehículo no encontrado.');
    }

    // Check duplicate plate (excluding itself)
    const plateExists = vehicles.some(v => v.id_vehiculo !== id_vehiculo && v.placa.toUpperCase() === vehicleData.placa.toUpperCase());
    if (plateExists) {
      throw new Error('La placa ingresada ya está registrada en otro vehículo.');
    }

    const updatedVehicle = {
      ...vehicles[index],
      ...vehicleData,
      placa: vehicleData.placa.toUpperCase(),
      anio: parseInt(vehicleData.anio, 10),
      capacidad_pasajeros: parseInt(vehicleData.capacidad_pasajeros, 10),
      kilometraje_actual: parseInt(vehicleData.kilometraje_actual, 10) || 0,
      kilometraje_limite_mantenimiento: parseInt(vehicleData.kilometraje_limite_mantenimiento, 10)
    };

    vehicles[index] = updatedVehicle;
    localStorage.setItem('vextor_db_vehicles', JSON.stringify(vehicles));
    return updatedVehicle;
  },

  async deleteVehicle(id_vehiculo) {
    await delay();
    let vehicles = JSON.parse(localStorage.getItem('vextor_db_vehicles') || '[]');
    const exists = vehicles.some(v => v.id_vehiculo === id_vehiculo);
    if (!exists) {
      throw new Error('Vehículo no encontrado.');
    }

    // Optional Check: Is this vehicle referenced by a maintenance record?
    const maintenances = JSON.parse(localStorage.getItem('vextor_db_maintenance') || '[]');
    const hasMaintenance = maintenances.some(m => m.id_vehiculo === id_vehiculo);
    if (hasMaintenance) {
      throw new Error('No se puede eliminar el vehículo porque tiene registros de mantenimiento asociados.');
    }

    vehicles = vehicles.filter(v => v.id_vehiculo !== id_vehiculo);
    localStorage.setItem('vextor_db_vehicles', JSON.stringify(vehicles));
    return true;
  }
};
