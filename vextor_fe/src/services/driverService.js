import { initializeDatabase, generateUUID } from './db';

// Ensure DB is initialized
initializeDatabase();

const delay = (ms = 400) => new Promise(resolve => setTimeout(resolve, ms));

export const driverService = {
  async getDrivers() {
    await delay();
    return JSON.parse(localStorage.getItem('vextor_db_drivers') || '[]');
  },

  async createDriver(driverData) {
    await delay();
    const drivers = JSON.parse(localStorage.getItem('vextor_db_drivers') || '[]');
    const users = JSON.parse(localStorage.getItem('vextor_db_users') || '[]');

    // Check duplicate cedula
    const cedulaExists = drivers.some(d => d.cedula_conductor === driverData.cedula_conductor);
    if (cedulaExists) {
      throw new Error('La cédula ingresada ya está registrada.');
    }

    // Auto-generate associated user account
    const id_usuario = generateUUID();
    const email = `${driverData.nombre_conductor.toLowerCase()}.${driverData.apellido_conductor.toLowerCase()}@vextor.com`.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    const newUser = {
      id_usuario,
      id_rol: 'rol-conductor',
      nombres_usuario: driverData.nombre_conductor,
      apellidos_usuario: driverData.apellido_conductor,
      correo_usuario: email,
      telefono_usuario: driverData.telefono_conductor || '',
      estado_usuario: driverData.estado_conductor === 'INACTIVO' ? 'INACTIVO' : 'ACTIVO',
      fecha_creacion: new Date().toISOString()
    };

    const newDriver = {
      id_conductor: generateUUID(),
      id_usuario,
      nombre_conductor: driverData.nombre_conductor,
      apellido_conductor: driverData.apellido_conductor,
      cedula_conductor: driverData.cedula_conductor,
      telefono_conductor: driverData.telefono_conductor || '',
      licencia: driverData.licencia,
      estado_conductor: driverData.estado_conductor,
      fecha_ingreso: driverData.fecha_ingreso
    };

    users.push(newUser);
    drivers.unshift(newDriver);

    localStorage.setItem('vextor_db_users', JSON.stringify(users));
    localStorage.setItem('vextor_db_drivers', JSON.stringify(drivers));

    return newDriver;
  },

  async updateDriver(id_conductor, driverData) {
    await delay();
    const drivers = JSON.parse(localStorage.getItem('vextor_db_drivers') || '[]');
    const index = drivers.findIndex(d => d.id_conductor === id_conductor);
    if (index === -1) {
      throw new Error('Conductor no encontrado.');
    }

    // Check duplicate cedula (excluding itself)
    const cedulaExists = drivers.some(d => d.id_conductor !== id_conductor && d.cedula_conductor === driverData.cedula_conductor);
    if (cedulaExists) {
      throw new Error('La cédula ingresada ya está registrada en otro conductor.');
    }

    const updatedDriver = {
      ...drivers[index],
      nombre_conductor: driverData.nombre_conductor,
      apellido_conductor: driverData.apellido_conductor,
      cedula_conductor: driverData.cedula_conductor,
      telefono_conductor: driverData.telefono_conductor || '',
      licencia: driverData.licencia,
      estado_conductor: driverData.estado_conductor,
      fecha_ingreso: driverData.fecha_ingreso
    };

    // Keep associated user account in sync
    const users = JSON.parse(localStorage.getItem('vextor_db_users') || '[]');
    const userIndex = users.findIndex(u => u.id_usuario === updatedDriver.id_usuario);
    if (userIndex !== -1) {
      users[userIndex] = {
        ...users[userIndex],
        nombres_usuario: driverData.nombre_conductor,
        apellidos_usuario: driverData.apellido_conductor,
        telefono_usuario: driverData.telefono_conductor || '',
        estado_usuario: driverData.estado_conductor === 'INACTIVO' ? 'INACTIVO' : 'ACTIVO'
      };
    }

    drivers[index] = updatedDriver;

    localStorage.setItem('vextor_db_users', JSON.stringify(users));
    localStorage.setItem('vextor_db_drivers', JSON.stringify(drivers));

    return updatedDriver;
  },

  async deleteDriver(id_conductor) {
    await delay();
    let drivers = JSON.parse(localStorage.getItem('vextor_db_drivers') || '[]');
    const driver = drivers.find(d => d.id_conductor === id_conductor);
    if (!driver) {
      throw new Error('Conductor no encontrado.');
    }

    // Filter out the driver
    drivers = drivers.filter(d => d.id_conductor !== id_conductor);

    // Also remove the associated user account
    let users = JSON.parse(localStorage.getItem('vextor_db_users') || '[]');
    users = users.filter(u => u.id_usuario !== driver.id_usuario);

    localStorage.setItem('vextor_db_users', JSON.stringify(users));
    localStorage.setItem('vextor_db_drivers', JSON.stringify(drivers));

    return true;
  }
};
