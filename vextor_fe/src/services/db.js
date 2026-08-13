/**
 * Mock Database System for Vextor
 *
 * This file centralizes initial data generation and storage in localStorage
 * to simulate a real PostgreSQL database with full integrity.
 */

export const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};


const BRANDS_MODELS = [
  { brand: 'Toyota', model: 'Hilux', type: 'Camioneta', capacity: 5 },
  { brand: 'Chevrolet', model: 'Onix', type: 'Automóvil', capacity: 5 },
  { brand: 'Hyundai', model: 'Accent', type: 'Automóvil', capacity: 5 },
  { brand: 'Ford', model: 'F-150', type: 'Camioneta', capacity: 5 },
  { brand: 'Mercedes-Benz', model: 'Sprinter', type: 'Furgón', capacity: 15 },
  { brand: 'Hino', model: 'Dutro 300', type: 'Camión', capacity: 3 },
  { brand: 'Scania', model: 'G410', type: 'Camión', capacity: 2 },
  { brand: 'Volvo', model: 'FH16', type: 'Camión', capacity: 2 },
  { brand: 'Volkswagen', model: 'Constellation', type: 'Camión', capacity: 3 },
  { brand: 'Nissan', model: 'Urvan', type: 'Bus', capacity: 18 }
];

const COLORS = ['Blanco', 'Negro', 'Gris', 'Plateado', 'Azul', 'Rojo', 'Amarillo'];
const VEHICLE_STATUSES = ['DISPONIBLE', 'EN_RUTA', 'MANTENIMIENTO', 'INACTIVO'];

const FIRST_NAMES = [
  'Juan', 'Carlos', 'Luis', 'Andrés', 'Jorge', 'José', 'Miguel', 'Santiago', 'Manuel', 'Pedro',
  'David', 'Fernando', 'Sofía', 'María', 'Alejandro', 'Gabriel', 'Daniel', 'Javier', 'Francisco', 'Ricardo'
];

const LAST_NAMES = [
  'Pérez', 'Mendoza', 'Rodríguez', 'Gómez', 'Castillo', 'Altamirano', 'Sánchez', 'López', 'Martínez', 'Ramírez',
  'González', 'Alvarez', 'Torres', 'Fernández', 'Vargas', 'Herrera', 'Castro', 'Ríos', 'Guerrero', 'Ortega'
];

const LICENSES = ['A1', 'A2', 'B1', 'B2', 'B3', 'C1', 'C2', 'C3'];
const DRIVER_STATUSES = ['ACTIVO', 'INACTIVO', 'SUSPENDIDO'];

export const initializeDatabase = () => {
  // 1. Initialize Vehicles if not exists
  if (!localStorage.getItem('vextor_db_vehicles')) {
    const vehicles = [];
    const usedPlates = new Set();

    // Standard pre-defined vehicle to match the activity feed in Dashboard
    const specialVehicle = {
      id_vehiculo: 'abc12345-6789-4000-a000-000000000001',
      placa: 'ABC-1234',
      marca: 'Toyota',
      modelo: 'Hilux',
      anio: 2022,
      color: 'Gris',
      tipo_vehiculo: 'Camioneta',
      capacidad_pasajeros: 5,
      kilometraje_actual: 45200,
      kilometraje_limite_mantenimiento: 50000,
      estado_vehiculo: 'DISPONIBLE',
      documentacion_vehiculo: 'SOAT vigente hasta Dic 2026'
    };
    vehicles.push(specialVehicle);
    usedPlates.add('ABC-1234');

    // Generate remaining 41 vehicles to total 42
    for (let i = 1; i < 42; i++) {
      let placa;
      do {
        const letters = Array.from({ length: 3 }, () => String.fromCharCode(65 + Math.floor(Math.random() * 26))).join('');
        const numbers = Math.floor(1000 + Math.random() * 9000);
        placa = `${letters}-${numbers}`;
      } while (usedPlates.has(placa));
      usedPlates.add(placa);

      const brandModel = BRANDS_MODELS[Math.floor(Math.random() * BRANDS_MODELS.length)];
      const currentKm = Math.floor(5000 + Math.random() * 250000);
      const limitKm = currentKm + Math.floor(3000 + Math.random() * 7000);

      vehicles.push({
        id_vehiculo: generateUUID(),
        placa,
        marca: brandModel.brand,
        modelo: brandModel.model,
        anio: Math.floor(2015 + Math.random() * 11), // 2015-2025
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        tipo_vehiculo: brandModel.type,
        capacidad_pasajeros: brandModel.capacity,
        kilometraje_actual: currentKm,
        kilometraje_limite_mantenimiento: limitKm,
        estado_vehiculo: VEHICLE_STATUSES[Math.floor(Math.random() * VEHICLE_STATUSES.length)],
        documentacion_vehiculo: Math.random() > 0.15 ? 'SOAT vigente hasta Fin de Año' : 'Revisión técnica pendiente'
      });
    }
    localStorage.setItem('vextor_db_vehicles', JSON.stringify(vehicles));
  }

  // 2. Initialize Users & Drivers if not exists
  if (!localStorage.getItem('vextor_db_drivers')) {
    const drivers = [];
    const users = JSON.parse(localStorage.getItem('vextor_db_users') || '[]');
    const usedCid = new Set();

    // Standard user to match Dashboard recent activity
    const specialUserId = 'abc12345-6789-4000-b000-000000000001';
    const specialDriverId = 'abc12345-6789-4000-c000-000000000001';

    const specialUserObj = {
      id_usuario: specialUserId,
      id_rol: 'rol-conductor',
      nombres_usuario: 'Juan',
      apellidos_usuario: 'Pérez',
      correo_usuario: 'juan.perez@vextor.com',
      telefono_usuario: '+593 98 765 4321',
      estado_usuario: 'ACTIVO',
      fecha_creacion: new Date().toISOString()
    };
    users.push(specialUserObj);

    const specialDriverObj = {
      id_conductor: specialDriverId,
      id_usuario: specialUserId,
      nombre_conductor: 'Juan',
      apellido_conductor: 'Pérez',
      cedula_conductor: '1723456789',
      telefono_conductor: '+593 98 765 4321',
      licencia: 'C2',
      estado_conductor: 'ACTIVO',
      fecha_ingreso: '2021-03-15'
    };
    drivers.push(specialDriverObj);
    usedCid.add('1723456789');

    // Generate remaining 37 drivers to total 38
    for (let i = 1; i < 38; i++) {
      const fName = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
      const lName = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];

      let cedula;
      do {
        cedula = Math.floor(1000000000 + Math.random() * 9000000000).toString();
      } while (usedCid.has(cedula));
      usedCid.add(cedula);

      const userId = generateUUID();
      const driverId = generateUUID();
      const email = `${fName.toLowerCase()}.${lName.toLowerCase()}@vextor.com`.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      const phone = `+593 9${Math.floor(10000000 + Math.random() * 90000000)}`;

      users.push({
        id_usuario: userId,
        id_rol: 'rol-conductor',
        nombres_usuario: fName,
        apellidos_usuario: lName,
        correo_usuario: email,
        telefono_usuario: phone,
        estado_usuario: 'ACTIVO',
        fecha_creacion: new Date().toISOString()
      });

      drivers.push({
        id_conductor: driverId,
        id_usuario: userId,
        nombre_conductor: fName,
        apellido_conductor: lName,
        cedula_conductor: cedula,
        telefono_conductor: phone,
        licencia: LICENSES[Math.floor(Math.random() * LICENSES.length)],
        estado_conductor: DRIVER_STATUSES[Math.floor(Math.random() * DRIVER_STATUSES.length)],
        fecha_ingreso: new Date(Date.now() - Math.floor(Math.random() * 1000 * 24 * 3600 * 365)).toISOString().split('T')[0] // last 3 years
      });
    }

    localStorage.setItem('vextor_db_users', JSON.stringify(users));
    localStorage.setItem('vextor_db_drivers', JSON.stringify(drivers));
  }

  // 3. Initialize Maintenances if not exists
  if (!localStorage.getItem('vextor_db_maintenance')) {
    const maintenance = [];
    const vehicles = JSON.parse(localStorage.getItem('vextor_db_vehicles') || '[]');

    // Generate 4 maintenance records (to match the "4" in the dashboard card)
    const mTypes = ['PREVENTIVO', 'CORRECTIVO', 'PREDICTIVO'];
    const mDescs = [
      'Cambio de aceite, filtros y chequeo general',
      'Reemplazo de pastillas de freno delanteras',
      'Rotación y balanceo de neumáticos',
      'Reparación del sistema eléctrico de luces'
    ];
    const mStatuses = ['PROGRAMADO', 'EN_PROCESO', 'COMPLETADO', 'CANCELADO'];

    for (let i = 0; i < 4; i++) {
      const vehicle = vehicles[Math.floor(Math.random() * vehicles.length)] || { id_vehiculo: generateUUID(), kilometraje_actual: 50000 };
      maintenance.push({
        id_mantenimiento: generateUUID(),
        id_vehiculo: vehicle.id_vehiculo,
        tipo_mantenimiento: mTypes[i % mTypes.length],
        descripcion_mantenimiento: mDescs[i % mDescs.length],
        fecha_mantenimiento: new Date(Date.now() + Math.floor((i - 1) * 3 * 24 * 3600 * 1000)).toISOString().split('T')[0], // around today
        costo_mantenimiento: parseFloat((100 + Math.random() * 500).toFixed(2)),
        kilometraje_mantenimiento: vehicle.kilometraje_actual - Math.floor(Math.random() * 5000),
        estado_mantenimiento: mStatuses[i % mStatuses.length]
      });
    }
    localStorage.setItem('vextor_db_maintenance', JSON.stringify(maintenance));
  }

  // 4. Initialize Routes if not exists
  if (!localStorage.getItem('vextor_db_routes')) {
    const vehicles = JSON.parse(localStorage.getItem('vextor_db_vehicles') || '[]');
    const drivers = JSON.parse(localStorage.getItem('vextor_db_drivers') || '[]');

    const sampleDriverId = drivers[0]?.id_conductor || generateUUID();
    const sampleVehicleId = vehicles[0]?.id_vehiculo || generateUUID();

    const routes = [
      {
        id_ruta: 'route1111-1111-4000-a000-000000000001',
        codigo_ruta: 'RUT-101',
        nombre_ruta: 'Ruta Portal Norte a Andino',
        origen: '4.7554, -74.0463',
        destino: '4.6669, -74.0528',
        fecha_programada: new Date(Date.now() + 24 * 3600 * 1000).toISOString().slice(0, 16), // tomorrow
        hora_inicio_real: '',
        hora_fin_real: '',
        estado_ruta: 'PROGRAMADA',
        motivo_suspension: '',
        id_conductor: sampleDriverId,
        id_vehiculo: sampleVehicleId
      },
      {
        id_ruta: 'route2222-2222-4000-a000-000000000002',
        codigo_ruta: 'RUT-102',
        nombre_ruta: 'Ruta Portal 80 a Parque de la 93',
        origen: '4.7100, -74.1120',
        destino: '4.6768, -74.0483',
        fecha_programada: new Date().toISOString().slice(0, 16), // nowish
        hora_inicio_real: new Date(Date.now() - 3600 * 1000).toISOString().slice(0, 16),
        hora_fin_real: '',
        estado_ruta: 'EN_PROCESO',
        motivo_suspension: '',
        id_conductor: drivers[1]?.id_conductor || sampleDriverId,
        id_vehiculo: vehicles[1]?.id_vehiculo || sampleVehicleId
      },
      {
        id_ruta: 'route3333-3333-4000-a000-000000000003',
        codigo_ruta: 'RUT-103',
        nombre_ruta: 'Ruta Terminal Salitre a Aeropuerto',
        origen: '4.6534, -74.1158',
        destino: '4.6975, -74.1411',
        fecha_programada: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString().slice(0, 16), // 2 days ago
        hora_inicio_real: new Date(Date.now() - 2 * 24 * 3600 * 1000 + 15 * 60 * 1000).toISOString().slice(0, 16),
        hora_fin_real: new Date(Date.now() - 2 * 24 * 3600 * 1000 + 45 * 60 * 1000).toISOString().slice(0, 16),
        estado_ruta: 'COMPLETADA',
        motivo_suspension: '',
        id_conductor: drivers[2]?.id_conductor || sampleDriverId,
        id_vehiculo: vehicles[2]?.id_vehiculo || sampleVehicleId
      }
    ];

    localStorage.setItem('vextor_db_routes', JSON.stringify(routes));
  }
};
