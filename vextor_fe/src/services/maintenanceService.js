import { initializeDatabase, generateUUID } from './db';

// Ensure DB is initialized
initializeDatabase();

const delay = (ms = 400) => new Promise(resolve => setTimeout(resolve, ms));

export const maintenanceService = {
  async getMaintenances() {
    await delay();
    return JSON.parse(localStorage.getItem('vextor_db_maintenance') || '[]');
  },

  async createMaintenance(maintenanceData) {
    await delay();
    const maintenances = JSON.parse(localStorage.getItem('vextor_db_maintenance') || '[]');

    const newMaintenance = {
      id_mantenimiento: generateUUID(),
      ...maintenanceData,
      costo_mantenimiento: parseFloat(maintenanceData.costo_mantenimiento),
      kilometraje_mantenimiento: parseInt(maintenanceData.kilometraje_mantenimiento, 10)
    };

    maintenances.unshift(newMaintenance);
    localStorage.setItem('vextor_db_maintenance', JSON.stringify(maintenances));

    // Side effect: if maintenance is EN_PROCESO, maybe we set vehicle's state to MANTENIMIENTO
    if (newMaintenance.estado_mantenimiento === 'EN_PROCESO') {
      const vehicles = JSON.parse(localStorage.getItem('vextor_db_vehicles') || '[]');
      const vIndex = vehicles.findIndex(v => v.id_vehiculo === newMaintenance.id_vehiculo);
      if (vIndex !== -1) {
        vehicles[vIndex].estado_vehiculo = 'MANTENIMIENTO';
        localStorage.setItem('vextor_db_vehicles', JSON.stringify(vehicles));
      }
    }

    return newMaintenance;
  },

  async updateMaintenance(id_mantenimiento, maintenanceData) {
    await delay();
    const maintenances = JSON.parse(localStorage.getItem('vextor_db_maintenance') || '[]');
    const index = maintenances.findIndex(m => m.id_mantenimiento === id_mantenimiento);
    if (index === -1) {
      throw new Error('Registro de mantenimiento no encontrado.');
    }

    const updatedMaintenance = {
      ...maintenances[index],
      ...maintenanceData,
      costo_mantenimiento: parseFloat(maintenanceData.costo_mantenimiento),
      kilometraje_mantenimiento: parseInt(maintenanceData.kilometraje_mantenimiento, 10)
    };

    maintenances[index] = updatedMaintenance;
    localStorage.setItem('vextor_db_maintenance', JSON.stringify(maintenances));

    // Side effect: if maintenance is EN_PROCESO, we can set vehicle's state to MANTENIMIENTO
    if (updatedMaintenance.estado_mantenimiento === 'EN_PROCESO') {
      const vehicles = JSON.parse(localStorage.getItem('vextor_db_vehicles') || '[]');
      const vIndex = vehicles.findIndex(v => v.id_vehiculo === updatedMaintenance.id_vehiculo);
      if (vIndex !== -1) {
        vehicles[vIndex].estado_vehiculo = 'MANTENIMIENTO';
        localStorage.setItem('vextor_db_vehicles', JSON.stringify(vehicles));
      }
    }

    return updatedMaintenance;
  },

  async deleteMaintenance(id_mantenimiento) {
    await delay();
    let maintenances = JSON.parse(localStorage.getItem('vextor_db_maintenance') || '[]');
    const exists = maintenances.some(m => m.id_mantenimiento === id_mantenimiento);
    if (!exists) {
      throw new Error('Registro de mantenimiento no encontrado.');
    }

    maintenances = maintenances.filter(m => m.id_mantenimiento !== id_mantenimiento);
    localStorage.setItem('vextor_db_maintenance', JSON.stringify(maintenances));
    return true;
  }
};
