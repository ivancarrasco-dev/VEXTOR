# Base de Datos de VEXTOR (`vextor_bd`)

La capa de almacenamiento relacional de **VEXTOR** está diseñada sobre **PostgreSQL** (alojada en Supabase o instancia local), aprovechando sus capacidades de integridad referencial, soporte para identificadores únicos globales (UUID v4), índices optimizados y consultas de auditoría y telemetría logísticas.

---

## 1. Estructura del Módulo de Base de Datos

```text
vextor_bd/
├── vextor_bd.sql    # Script SQL DDL con esquemas de tablas, restricciones (CheckConstraints), FKs y roles iniciales
└── Readme.md        # Documentación de la arquitectura de base de datos (Este archivo)
```

---

## 2. Definición del Esquema DDL

### 2.1 Claves Primarias e Identificadores
Todas las tablas del sistema utilizan identificadores **UUID v4** generados mediante la función nativa de PostgreSQL `gen_random_uuid()`. Esto previene ataques de enumeración secuencial y facilita la integración en sistemas SaaS multi-tenant.

### 2.2 Roles Predefinidos en el Sistema
El script DDL insere los siguientes roles con UUIDs estáticos para garantizar coherencia en el código backend y frontend:

| ID Rol (UUID) | Nombre del Rol | Descripción |
| :--- | :--- | :--- |
| `11111111-2222-3333-4444-555555555551` | `Administrador` | Control total del sistema, administración de usuarios, flotas, rutas, mantenimientos, reportes y configuración corporativa. |
| `11111111-2222-3333-4444-555555555552` | `Conductor` | Operación de vehículos, visualización de rutas asignadas, navegación y emisión de telemetría GPS. |
| `11111111-2222-3333-4444-555555555555` | `Usuario` | Rol predeterminado asignado en el registro público. Acceso restringido a perfil personal. |

---

## 3. Diccionario de Tablas e Integridad Referencial

### 3.1 Tabla `rol`
- Almacena la jerarquía de perfiles de acceso del sistema.
- **Campos principales:** `id_rol`, `nombre_rol`, `descripcion_rol`.
- **Restricción:** `nombre_rol` UNIQUE NOT NULL.

### 3.2 Tabla `usuario`
- Registra las cuentas de usuario, hashes de contraseña (bcrypt), perfil y datos de contacto.
- **Campos principales:** `id_usuario`, `id_rol`, `nombres_usuario`, `apellidos_usuario`, `correo_usuario`, `contrasenia_usuario`, `telefono_usuario`, `foto_perfil`, `estado_usuario`, `requiere_cambio_clave`, `token_recuperacion`.
- **Clave Foránea:** `id_rol` ➔ `rol(id_rol)` ON DELETE RESTRICT.
- **Restricción:** `correo_usuario` UNIQUE NOT NULL.

### 3.3 Tabla `sesion_usuario`
- Mantiene las sesiones JWT activas para permitir la revocación remota de dispositivos.
- **Campos principales:** `id_sesion`, `id_usuario`, `ip_origen`, `dispositivo`, `user_agent`, `fecha_inicio`, `ultima_actividad`, `estado_sesion`.
- **Clave Foránea:** `id_usuario` ➔ `usuario(id_usuario)` ON DELETE CASCADE.

### 3.4 Tabla `vehiculo`
- Registra la flota de vehículos de la empresa.
- **Campos principales:** `id_vehiculo`, `placa`, `marca`, `modelo`, `anio`, `color`, `tipo_vehiculo`, `capacidad_pasajeros`, `kilometraje_actual`, `kilometraje_limite_mantenimiento`, `estado_vehiculo`, `documentacion_vehiculo`.
- **Restricciones:** `placa` UNIQUE NOT NULL (Formato colombiano `AAA-123`).
- **Check Constraint:** `estado_vehiculo IN ('DISPONIBLE', 'EN_RUTA', 'MANTENIMIENTO', 'INACTIVO')`.

### 3.5 Tabla `conductor`
- Mantiene la información operativa y licencias de conducción.
- **Campos principales:** `id_conductor`, `id_usuario`, `nombre_conductor`, `apellido_conductor`, `cedula_conductor`, `telefono_conductor`, `licencia`, `estado_conductor`, `fecha_ingreso`.
- **Clave Foránea:** `id_usuario` ➔ `usuario(id_usuario)` ON DELETE RESTRICT / SET NULL.
- **Restricciones:** `cedula_conductor` UNIQUE NOT NULL.
- **Check Constraint:** `estado_conductor IN ('DISPONIBLE', 'EN_RUTA', 'NO_DISPONIBLE', 'ACTIVO', 'INACTIVO', 'SUSPENDIDO')`.

### 3.6 Tabla `ruta`, `asignacion_conductor` y `asignacion_vehiculo`
- Almacena las programaciones logísticas y las asignaciones activas de vehículo y conductor a cada ruta.
- **Campos principales:** `id_ruta`, `codigo_ruta`, `nombre_ruta`, `origen`, `destino`, `fecha_programada`, `hora_inicio_real`, `hora_fin_real`, `estado_ruta`, `motivo_suspension`.
- **Check Constraint:** `estado_ruta IN ('PROGRAMADA', 'EN_PROCESO', 'COMPLETADA', 'SUSPENDIDA', 'CANCELADA')`.

### 3.7 Tabla `seguimiento_ruta` y `historial_ubicacion`
- Registra la telemetría GPS (latitud, longitud, velocidad en km/h, rumbo/heading) enviada vía WebSocket por los conductores durante la ruta.
- **Claves Foráneas:** `id_ruta` ➔ `ruta(id_ruta)` ON DELETE CASCADE.

### 3.8 Tabla `mantenimiento`
- Controla las órdenes de trabajo del taller (preventivas/correctivas) y costos en Pesos Colombianos (`COP`).
- **Clave Foránea:** `id_vehiculo` ➔ `vehiculo(id_vehiculo)` ON DELETE RESTRICT.

### 3.9 Tablas `actividad`, `notificacion` y `empresa`
- **`actividad`:** Bitácora de auditoría de acciones del sistema (Login, Registro, Ediciones, Eliminaciones, Reportes).
- **`notificacion`:** Alertas del sistema dirigidas a usuarios específicos.
- **`empresa`:** Información corporativa de la empresa (NIT, Razón Social, Dirección, Teléfono).

---

## 4. Instrucciones de Inicialización Manual

Para restaurar o inicializar la base de datos localmente utilizando PostgreSQL CLI:

```bash
# Crear la base de datos en PostgreSQL
createdb -U postgres vextor_db

# Ejecutar el script DDL ejecutable
psql -U postgres -d vextor_db -f vextor_bd/vextor_bd.sql
```
