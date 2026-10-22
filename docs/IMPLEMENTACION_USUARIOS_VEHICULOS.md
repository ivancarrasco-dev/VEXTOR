# Documentación de Implementación: Gestión de Usuarios, Imágenes de Vehículos y Eliminación Masiva

Este documento explica de forma detallada las implementaciones realizadas en el proyecto VEXTOR para dar cumplimiento a los requerimientos de ampliación de formularios de usuarios, gestión e imágenes de vehículos, modal detallado flotante, y eliminación masiva de vehículos y conductores.

---

## 1. Resumen de Cambios Realizados

### 1.1. Ampliación de Formularios de Usuario y Autenticación
- **Backend (`vextor_be`)**:
  - Modelo `Usuario` (`app/models/user.py`): Se mapearon las columnas `cedula_usuario`, `tipo_documento` y `telefono_usuario`.
  - Esquemas Pydantic (`app/schemas/user.py` y `app/schemas/__init__.py`): Se añadieron los campos `cedula_usuario`, `tipo_documento` y `telefono_usuario` a `UserCreate`, `UserUpdate`, `UserResponse`, `UserRegistration` y `UserDetailResponse`.
  - Servicio de Autenticación (`app/services/auth_service.py`): Se habilitó la búsqueda unificada del usuario por correo (`correo_usuario`), cédula (`cedula_usuario`) o teléfono (`telefono_usuario`).
  - Endpoint de Registro (`app/api/routes/auth.py`): Se actualizó para registrar y validar teléfono, tipo de documento y número de cédula.
- **Frontend (`vextor_fe`)**:
  - Gestión de Usuarios (`src/pages/UsersPage.jsx`): Se incorporaron los campos de teléfono, tipo de documento y número de documento en los formularios de creación y edición. Se implementó la visualización de tipo de documento y cédula en la tabla de usuarios.
  - Registro (`src/pages/Register.jsx`): Se añadieron inputs con validaciones para teléfono, tipo de documento (`CEDULA_CIUDADANIA`, `CEDULA_EXTRANJERIA`, `PASAPORTE`, `PERMISO_ESPECIAL_PERMANENCIA`, `NIT`) y número de documento.

### 1.2. Módulo de Vehículos: Imágenes Persistentes y Vista Flotante Detallada
- **Backend (`vextor_be`)**:
  - Modelo `ImagenVehiculo` (`app/models/vehicle.py`): Creación del modelo ORM mapeado a la tabla `imagen_vehiculo` (`id_imagen`, `id_vehiculo`, `url_imagen`, `es_principal`, `fecha_creacion`).
  - Esquemas Pydantic (`app/schemas/vehicle.py`): Esquemas `VehicleImageResponse`, `VehicleImageCreate`, `VehicleDetailResponse`.
  - Endpoints de Vehículos (`app/api/routes/vehicles.py`):
    - Archivos estáticos montados en `/uploads` para servir imágenes guardadas en el sistema de archivos (`vextor_be/uploads/vehicles/`).
    - `POST /api/vehicles/{id_vehiculo}/images`: Endpoint para subir múltiples archivos de imagen con validación de tipo MIME y tamaño máximo (10MB).
    - `DELETE /api/vehicles/{id_vehiculo}/images/{id_imagen}`: Endpoint para eliminar una imagen individual de la base de datos y del disco.
- **Frontend (`vextor_fe`)**:
  - Formulario de Vehículo (`src/pages/Vehicles.jsx`): Soporte para selección de múltiples imágenes con vista previa, eliminación individual previa al envío, carga multipart en backend al guardar el vehículo y galería de imágenes existentes en el modal de edición.
  - Vista Flotante / Modal Detallado (`src/pages/Vehicles.jsx`):
    - Overlay modal accesible con tecla `Escape` o clic fuera del contenedor.
    - Galería con visor principal, miniaturas navegables, controles de avance/retroceso, contador numérico de imágenes y soporte para estado sin fotografías (placeholder elegante VEXTOR).
    - Despliegue completo de especificaciones técnicas (Placa, Marca, Modelo, Color, Tipo, Capacidad, Kilometraje actual/límite, Estado y Documentación asociada con fechas de vencimiento).

### 1.3. Selección Múltiple y Eliminación Masiva (Vehículos y Conductores)
- **Backend (`vextor_be`)**:
  - Endpoints Batch (`app/api/routes/vehicles.py` y `app/api/routes/drivers.py`):
    - `POST /api/vehicles/batch-delete`
    - `POST /api/drivers/batch-delete`
  - Control Transaccional y Verificación Referencial: Revisa si los vehículos o conductores seleccionados poseen dependencias asociadas (viajes activos/históricos, mantenimientos, novedades, asignaciones de ruta) antes de su eliminación. Procesa registros seguros de forma transaccional e informa detalladamente cuáles no pudieron eliminarse y por qué causa.
- **Frontend (`vextor_fe`)**:
  - Módulo de Vehículos (`src/pages/Vehicles.jsx`): Casillas de selección individuales por fila, casilla global "Seleccionar todos", contador flotante de selecciones, botón de eliminación masiva, modal de confirmación con detalle de cantidad y reporte de resultados de la operación.
  - Módulo de Conductores (`src/pages/Drivers.jsx`): Casillas de selección en tarjetas y vista en tabla, casilla global, contador, confirmación y procesamiento masivo seguro.

---

## 2. Archivos Modificados y Creados

### Backend (`vextor_be`)
- `app/models/user.py`: Agregados campos `cedula_usuario`, `tipo_documento`, `telefono_usuario`.
- `app/models/vehicle.py`: Agregada clase `ImagenVehiculo` y relación `imagenes` en `Vehiculo`.
- `app/schemas/user.py`: Actualizados esquemas Pydantic de usuario.
- `app/schemas/vehicle.py`: Creados esquemas para imágenes de vehículo y `VehicleBatchDeleteRequest`/`Response`.
- `app/schemas/driver.py`: Creados esquemas `DriverBatchDeleteRequest`/`Response`.
- `app/api/routes/auth.py`: Actualizado registro y esquemas de Auth.
- `app/api/routes/vehicles.py`: Endpoints de carga/eliminación de imágenes y `POST /api/vehicles/batch-delete`.
- `app/api/routes/drivers.py`: Endpoint `POST /api/drivers/batch-delete`.
- `app/services/crud_services.py`: Funciones CRUD de imágenes de vehículos, lógica de batch delete con verificación de clave foránea.
- `app/main.py`: Montaje de ruta estática `/uploads`.
- `tests/test_batch_delete_and_images.py`: Pruebas de integración automatizadas.

### Frontend (`vextor_fe`)
- `src/pages/UsersPage.jsx`: Formulario de usuario ampliado y tabla actualizada.
- `src/pages/Register.jsx`: Formulario de registro ampliado.
- `src/pages/Vehicles.jsx`: Carga de imágenes, galería modal flotante y eliminación masiva.
- `src/pages/Drivers.jsx`: Eliminación masiva de conductores con selección múltiple.
- `src/services/vehicleService.js`: Funciones de API para imágenes y eliminación masiva de vehículos.
- `src/services/driverService.js`: Función de API para eliminación masiva de conductores.

### Base de Datos (`vextor_bd`)
- `vextor_bd/migrations/001_create_imagen_vehiculo.sql`: Script de migración SQL para la tabla `imagen_vehiculo`.

---

## 3. Migraciones SQL

La tabla de imágenes de vehículos se define con el siguiente DDL (`vextor_bd/migrations/001_create_imagen_vehiculo.sql`):

```sql
CREATE TABLE IF NOT EXISTS imagen_vehiculo (
    id_imagen SERIAL PRIMARY KEY,
    id_vehiculo INT NOT NULL REFERENCES vehiculo(id_vehiculo) ON DELETE CASCADE,
    url_imagen VARCHAR(255) NOT NULL,
    es_principal BOOLEAN DEFAULT FALSE,
    fecha_creacion TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_imagen_vehiculo_id_vehiculo ON imagen_vehiculo(id_vehiculo);
```

---

## 4. Configuración del Almacenamiento Persistente de Imágenes

Las imágenes subidas a la plataforma se almacenan físicamente en el directorio `vextor_be/uploads/vehicles/` y son servidas a través de FastAPI en el endpoint estático `/uploads/...`.

### Requisitos y Configuración para Docker / Producción
1. **Volumen de Docker**: En el archivo `docker-compose.yml`, el servicio del backend debe mapear un volumen persistente hacia la carpeta `/app/uploads`:
   ```yaml
   services:
     backend:
       volumes:
         - vextor_uploads:/app/uploads

   volumes:
     vextor_uploads:
   ```
2. **Permisos de Directorio**: El directorio `vextor_be/uploads/vehicles` se crea automáticamente por la aplicación al iniciar si no existe.

---

## 5. Pruebas Ejecutadas y Resultados

### 5.1. Backend Unit/Integration Tests
Comando ejecutado:
```bash
DATABASE_URL="sqlite:///:memory:" JWT_SECRET_KEY="testsecret" PYTHONPATH=vextor_be python3 -m pytest vextor_be/tests
```
**Resultado:** `53 passed in 1.48s`.

Pruebas cubiertas:
- Subida y consulta de imágenes de vehículos (`test_upload_and_get_vehicle_images`).
- Eliminación masiva de vehículos seguros (`test_batch_delete_vehicles_success`).
- Bloqueo de eliminación masiva por dependencias referenciales en vehículos (`test_batch_delete_vehicles_blocked_by_trip`).
- Eliminación masiva de conductores seguros (`test_batch_delete_drivers_success`).
- Bloqueo de eliminación masiva por dependencias referenciales en conductores (`test_batch_delete_drivers_blocked_by_trip`).
- Registro con teléfono, tipo de documento y cédula.
- Recuperación de contraseña y autenticación de usuarios.

### 5.2. Frontend Build
Comando ejecutado:
```bash
cd vextor_fe && pnpm build
```
**Resultado:** Compilación exitosa en `9.02s` sin errores de TypeScript/JSX.

### 5.3. Frontend Visual Verification (Playwright)
Se ejecutaron scripts de Playwright para capturar y verificar los componentes en navegadores reales:
- Capturas de pantalla generadas y verificadas: `users_page.png`, `vehicles_page.png`, `vehicles_table.png`, `drivers_page.png`.

---

## 6. Decisiones de Diseño e Integridad de Datos

1. **Protección Contra Cascadas Indiscriminadas**: Se evitó la eliminación automática en cascada de viajes, mantenimientos y novedades históricas. Si un vehículo o conductor tiene viajes o mantenimientos registrados en la base de datos, el sistema aborta su eliminación específica e informa al administrador exactamente qué dependencias previenen el borrado.
2. **Consistencia de Unicidad**: Se mantuvieron las restricciones `UNIQUE` sobre `correo_usuario`, `cedula_usuario`, `placa` y `cedula_conductor`, retornando mensajes descriptivos en español cuando ocurre un conflicto de duplicidad.
3. **Manejo de Transacciones**: Cada registro en los endpoints de eliminación masiva se procesa de forma individual dentro de su bloque de transacción/savepoint para asegurar que un fallo en un registro específico no altere el estado de los demás registros que sí cumplen con las reglas del negocio.
