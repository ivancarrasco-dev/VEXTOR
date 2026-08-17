# Referencia de API REST y WebSockets - VEXTOR

La API de VEXTOR está desarrollada con **FastAPI** (Python 3.12). Todos los endpoints están precedidos por la ruta base `/api`.

---

## 1. Módulo de Autenticación (`/api/auth`)

### `POST /api/auth/register`
- **Descripción:** Registra un nuevo usuario en la plataforma.
- **Autenticación:** Pública.
- **Roles:** Cualquiera.
- **Request Body (`UserCreate`):**
  ```json
  {
    "nombre_usuario": "Juan Pérez",
    "correo_electronico": "juan.perez@ejemplo.com",
    "contrasena": "Password123!",
    "id_rol": "11111111-2222-3333-4444-555555555552"
  }
  ```
- **Response (200 OK):** `UserResponse` object.
- **Errores:** `400 Bad Request` (Correo ya registrado).

### `POST /api/auth/login`
- **Descripción:** Inicia sesión, valida contraseña mediante `bcrypt`, crea una sesión en `sesion_usuario` y devuelve un token JWT en cookie `HttpOnly` (`vextor_auth_token`).
- **Autenticación:** Pública.
- **Request Body (`LoginRequest`):**
  ```json
  {
    "correo_electronico": "juan.perez@ejemplo.com",
    "contrasena": "Password123!"
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "message": "Inicio de sesión exitoso",
    "user": {
      "id_usuario": "uuid-v4-string",
      "nombre_usuario": "Juan Pérez",
      "correo_electronico": "juan.perez@ejemplo.com",
      "id_rol": "uuid-v4-string",
      "rol_nombre": "Administrador",
      "foto_perfil": null
    }
  }
  ```

### `POST /api/auth/logout`
- **Descripción:** Revoca la sesión en la BD (`estado_sesion = 'FINALIZADA'`) y elimina la cookie HttpOnly.
- **Autenticación:** Requerida JWT.

### `GET /api/auth/me`
- **Descripción:** Obtiene los datos del usuario actualmente autenticado verificando la cookie JWT y la validez de la sesión en BD.
- **Autenticación:** Requerida JWT.

### `PUT /api/auth/profile`
- **Descripción:** Actualiza los datos del perfil (nombre, teléfono, cédula, foto de perfil) del usuario logueado.
- **Autenticación:** Requerida JWT.

### `POST /api/auth/forgot-password`
- **Descripción:** Solicita un enlace de recuperación de contraseña enviado por correo electrónico (o generado en log en dev).

### `POST /api/auth/reset-password`
- **Descripción:** Restablece la contraseña utilizando el token de recuperación recibido por correo.

---

## 2. Módulo de Vehículos (`/api/vehicles`)

### `GET /api/vehicles`
- **Descripción:** Lista los vehículos registrados con sus detalles de marca, modelo, placa, estado y capacidad.
- **Autenticación:** Requerida JWT.
- **Query Params:** `search` (opcional), `estado` (opcional).

### `POST /api/vehicles`
- **Descripción:** Registra un nuevo vehículo.
- **Autenticación:** Requerida JWT (Rol: Administrador).
- **Request Body (`VehicleCreate`):**
  ```json
  {
    "placa": "ABC-123",
    "marca": "Chevrolet",
    "modelo": "N300",
    "anio": 2022,
    "tipo_vehiculo": "Carga",
    "capacidad_carga_kg": 1200.0,
    "estado_vehiculo": "DISPONIBLE"
  }
  ```

### `PUT /api/vehicles/{id_vehiculo}`
- **Descripción:** Actualiza la información de un vehículo existente.

### `DELETE /api/vehicles/{id_vehiculo}`
- **Descripción:** Elimina un vehículo. Intercepta dependencias activas (rutas o mantenimientos en proceso) devolviendo HTTP 400 en lugar de fallo de BD.

---

## 3. Módulo de Conductores (`/api/drivers`)

### `GET /api/drivers`
- **Descripción:** Retorna la lista de conductores con sus licencias, celular, cédula y estado operativo.
- **Autenticación:** Requerida JWT.

### `POST /api/drivers`
- **Descripción:** Crea un nuevo perfil de conductor.
- **Request Body (`DriverCreate`):**
  ```json
  {
    "nombre": "Carlos Mendoza",
    "cedula": "1098765432",
    "celular": "3101234567",
    "categoria_licencia": "C2",
    "numero_licencia": "1098765432",
    "fecha_vencimiento_licencia": "2026-12-31"
  }
  ```

### `PUT /api/drivers/{id_conductor}`
- **Descripción:** Edita los datos del conductor.

### `DELETE /api/drivers/{id_conductor}`
- **Descripción:** Elimina un conductor si no tiene rutas activas asignadas.

---

## 4. Módulo de Rutas y Seguimiento GPS (`/api/routes`)

### `GET /api/routes`
- **Descripción:** Obtiene las rutas programadas, en curso, completadas o canceladas.
- **Autenticación:** Requerida JWT.

### `GET /api/routes/driver/my-routes`
- **Descripción:** Retorna las rutas asignadas al conductor logueado.

### `POST /api/routes`
- **Descripción:** Crea y asigna una nueva ruta con origen, destino y fecha programada.

### `POST /api/routes/{id_ruta}/start`
- **Descripción:** Transiciona el estado de la ruta a `EN_RUTA` y el conductor a `EN_RUTA`.

### `POST /api/routes/{id_ruta}/complete`
- **Descripción:** Finaliza la ruta (`COMPLETADA`) y libera al conductor (`DISPONIBLE`).

### `POST /api/routes/{id_ruta}/location`
- **Descripción:** Endpoint HTTP fallback para enviar coordenadas GPS (`latitud`, `longitud`, `velocidad_kmh`, `rumbo_grados`).

### `WS /ws/tracking` (WebSocket)
- **Descripción:** Canal WebSocket duplex para streaming de posición GPS. Transmite eventos `location_update` a los clientes administradores en tiempo real.

---

## 5. Módulo de Mantenimientos (`/api/maintenance`)

### `GET /api/maintenance`
- **Descripción:** Consulta los registros de mantenimiento preventivo y correctivo.

### `POST /api/maintenance`
- **Descripción:** Programa un nuevo mantenimiento para un vehículo especificando costo en COP, taller y descripción.

### `PUT /api/maintenance/{id_mantenimiento}`
- **Descripción:** Modifica el estado del mantenimiento (`PROGRAMADO`, `EN_PROCESO`, `COMPLETADO`, `CANCELADO`).

---

## 6. Módulo de Reportes (`/api/reports`)

### `GET /api/reports/data`
- **Descripción:** Retorna los datos agregados y tabulares filtrados por rango de fechas, módulo y formato.

### `GET /api/reports/export`
- **Descripción:** Exporta los reportes generados en formatos binarios reales: PDF, CSV o Excel (XLSX).

---

## 7. Módulo de Configuración y Seguridad (`/api/company`, `/api/security`, `/api/users`)

### `GET /api/company` / `PUT /api/company`
- **Descripción:** Consulta y actualiza los datos corporativos de la empresa (NIT, Razón Social, Dirección, Teléfono).

### `GET /api/security/sessions` / `DELETE /api/security/sessions/{id_sesion}`
- **Descripción:** Gestión de sesiones activas del usuario, permitiendo revocación remota de dispositivos.
