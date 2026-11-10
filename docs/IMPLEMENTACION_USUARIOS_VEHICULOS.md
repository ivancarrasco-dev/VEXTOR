# Documentación de Implementación: Formularios, Imágenes de Vehículos y Eliminación Masiva en VEXTOR

## 1. Resumen de Cambios Implementados

### 1.1. Gestión de Usuarios y Autenticación
- **Campos de Identificación**: Se extendieron la tabla `usuario` en PostgreSQL/Supabase, los modelos ORM SQLAlchemy y los esquemas Pydantic para incluir `cedula_usuario` (VARCHAR UNIQUE) y `tipo_documento` (CHECK con valores `CEDULA_CIUDADANIA`, `CEDULA_EXTRANJERIA`, `PASAPORTE`, `PERMISO_ESPECIAL_PERMANENCIA`, `NIT`).
- **Autenticación Unificada**: `AuthService.login_user` permite iniciar sesión ingresando correo electrónico, número de cédula/documento o teléfono.
- **Registro Ampliado**: `Register.jsx` y `AuthContext.jsx` incorporan los campos de teléfono, tipo de documento y número de documento con validaciones en cliente y servidor.
- **Gestión Administrativa de Usuarios**: `UsersPage.jsx`, `UsersSection.jsx` y `Settings.jsx` muestran, permiten crear y precargan correctamente los datos de teléfono y documento al editar usuarios sin sobrescribirlos accidentalmente.

### 1.2. Almacenamiento Persistente e Imágenes de Vehículos
- **Modelo y Tabla Relacionada**: Se creó la tabla `imagen_vehiculo` con identificador único `id_imagen`, clave foránea `id_vehiculo`, URL del archivo, nombre original y flag `es_principal`.
- **Endpoints de Carga Estática**:
  - `POST /api/vehicles/{id_vehiculo}/images`: Permite cargar múltiples archivos (JPG, PNG, WEBP de hasta 5MB) servidos bajo la ruta `/uploads/vehicles/`.
  - `DELETE /api/vehicles/images/{id_imagen}`: Elimina el registro y el archivo físico del servidor.
- **Selector y Vista Previa en Frontend**: `Vehicles.jsx` incluye un dropzone de archivos, vista previa con opción de desmarcar antes de subir y gestión de imágenes guardadas.
- **Ficha Flotante y Galería**: Se actualizó `BusDetailModal.jsx` con panel superpuesto responsive, ficha técnica completa, estado operativo y galería interactiva con miniaturas, navegación previo/siguiente, modal de zoom a pantalla completa y soporte de teclas de acceso rápido (`Esc`, flechas).

### 1.3. Selección Múltiple y Eliminación Masiva
- **Batch Delete Vehículos (`POST /api/vehicles/batch-delete`)**:
  - Valida dependencias en asignaciones de ruta (`AsignacionVehiculo`), mantenimientos (`Mantenimiento`), viajes históricos (`Viaje`) y novedades (`Novedad`).
  - Previene eliminaciones en cascada ciega y reporta los ítems que no pudieron ser eliminados con sus razones exactas.
- **Batch Delete Conductores (`POST /api/drivers/batch-delete`)**:
  - Comprueba integridad referencial en asignaciones (`AsignacionConductor`), viajes, mantenimientos y novedades.
- **Interfaz de Usuario**:
  - Agregadas casillas de selección individual y casilla global "Seleccionar Todos Visibles" en `Vehicles.jsx` y `Drivers.jsx`.
  - Contador dinámico de elementos seleccionados, botón de acción "Eliminar (N)", modal de confirmación con detalle de éxito parcial/total.

---

## 2. Archivos Creados y Modificados

### Backend (`vextor_be`)
- `app/models/user.py`: Añadidas columnas `cedula_usuario` y `tipo_documento` a `Usuario`.
- `app/models/vehicle.py`: Añadida entidad `ImagenVehiculo` y relación en `Vehiculo`.
- `app/models/__init__.py`: Exportado `ImagenVehiculo`.
- `app/schemas/__init__.py`: Actualizados esquemas `UsuarioBase`, `UsuarioCreate`, `UsuarioUpdate`, `RegisterRequest`, `Vehiculo`, e integrados `ImagenVehiculoBase`, `ImagenVehiculoCreate`, `ImagenVehiculo`.
- `app/services/auth_service.py`: Registro con documento/teléfono y consulta flexible OR de login (correo/cedula/telefono).
- `app/services/crud_services.py`: Unicidad de cédula/documento en usuarios.
- `app/api/routes/crud.py`: Endpoints `/api/vehicles/{id_vehiculo}/images`, `/api/vehicles/images/{id_imagen}`, `/api/vehicles/batch-delete` y `/api/drivers/batch-delete`.
- `app/main.py`: Montado directorio estático `/uploads` mediante `StaticFiles`.
- `tests/test_new_features.py`: Pruebas de integración automatizadas para nuevas funciones.

### Base de Datos (`vextor_bd`)
- `vextor_bd/migrations/01_add_user_docs_and_vehicle_images.sql`: Script de migración con restricciones DDL.

### Frontend (`vextor_fe`)
- `src/context/AuthContext.jsx`: Envío de teléfono y documento en `register`.
- `src/pages/Login/Login.jsx`: Entrada unificada de login por correo, cédula o teléfono.
- `src/pages/Register/Register.jsx`: Selector de tipo de documento y campos de teléfono/número.
- `src/pages/Users/UsersPage.jsx`: Formulario de usuarios admin con precarga de documento y teléfono.
- `src/pages/Settings/sections/UsersSection.jsx`: Componente de usuarios en configuración.
- `src/pages/Settings/Settings.jsx`: Manejo de estado de edición/creación de usuarios.
- `src/pages/Vehicles/services/vehicleService.js`: Métodos HTTP `uploadVehicleImages`, `deleteVehicleImage` y `batchDeleteVehicles`.
- `src/pages/Drivers/services/driverService.js`: Método HTTP `batchDeleteDrivers`.
- `src/components/modals/BusDetailModal.jsx`: Modal flotante con galería interactiva y ficha completa.
- `src/pages/Vehicles/Vehicles.jsx`: Dropzone de imágenes, checkboxes de selección múltiple, contador y modal batch delete.
- `src/pages/Drivers/Drivers.jsx`: Checkboxes de selección múltiple, contador y modal batch delete.

---

## 3. Guía de Migraciones y Configuración de Almacenamiento

### 3.1. Migración SQL
Ejecute el script en Supabase o PostgreSQL:
```sql
\i vextor_bd/migrations/01_add_user_docs_and_vehicle_images.sql
```

### 3.2. Almacenamiento Persistente
Las imágenes se guardan físicamente en el directorio `vextor_be/uploads/vehicles/`. Para despliegues con Docker Compose, asegúrese de montar un volumen persistente:
```yaml
volumes:
  - ./vextor_be/uploads:/app/uploads
```

---

## 4. Resultados de Pruebas

### Backend (`pytest`)
Se ejecutaron 54 pruebas unitarias e integrales que pasaron exitosamente (100% de éxito):
```bash
DATABASE_URL="sqlite:///:memory:" JWT_SECRET_KEY="testsecret" PYTHONPATH=vextor_be pytest vextor_be/tests
```
- `test_register_and_multi_login`: PASÓ
- `test_vehicle_images_and_batch_delete`: PASÓ
- `test_driver_batch_delete`: PASÓ

### Frontend Build (`vite build`)
Se ejecutó la compilación de producción con Vite/pnpm en `vextor_fe` obteniendo 0 errores de compilación:
```bash
cd vextor_fe && pnpm build
```

---

## 5. Decisiones Tomadas e Integridad de Datos

1. **Sin Eliminaciones en Cascada Ciega**: Se validaron explícitamente las claves foráneas en backend antes de borrar vehículos o conductores. Si existen viajes o mantenimientos, la API retorna una respuesta parcial informando los motivos para evitar la pérdida de registros históricos operativos.
2. **Compatibilidad Estricta de Roles**: Se conservaron intactos los tres roles únicos del sistema ('administrador', 'conductor', 'usuario').
