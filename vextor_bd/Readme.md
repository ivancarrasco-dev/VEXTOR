# Base de Datos de VEXTOR (`vextor_bd`)

La capa de almacenamiento de **VEXTOR** está diseñada sobre **PostgreSQL**, aprovechando sus capacidades de integridad relacional, soporte para UUIDs nativos, índices de búsqueda y rendimiento de consultas geográficas.

---

## 1. Estructura del Módulo de Base de Datos

```text
vextor_bd/
├── vextor_bd.sql    # Script ejecutable SQL DDL con esquemas de tablas, restricciones, funciones y datos semilla
└── Readme.md        # Documentación de la base de datos (Este archivo)
```

---

## 2. Definición del Esquema DDL

### 2.1 Claves Primarias e Identificadores
Todas las tablas del sistema utilizan identificadores **UUID v4** generados mediante la función nativa de PostgreSQL `gen_random_uuid()`. Esto previene ataques de enumeración y simplifica la replicación de datos en entornos distribuidos o entornos SaaS multi-tenant.

### 2.2 Roles Semilla Predefinidos
El script `vextor_bd.sql` inserta automáticamente los siguientes roles con UUIDs estáticos para garantizar coherencia en todo el código backend y frontend:

| ID Rol (UUID) | Nombre del Rol | Descripción |
| :--- | :--- | :--- |
| `11111111-2222-3333-4444-555555555551` | `Administrador` | Control total del sistema y gestión de usuarios/configuración. |
| `11111111-2222-3333-4444-555555555552` | `Conductor` | Operación de vehículos, visualización de rutas asignadas y GPS. |
| `11111111-2222-3333-4444-555555555553` | `Mantenimiento` | Gestión del taller y registro de intervenciones preventivas/correctivas. |
| `11111111-2222-3333-4444-555555555554` | `Auditor` | Lectura de bitácoras de actividad y reportes generales. |

---

## 3. Diccionario de Tablas e Integridad Referencial

### 3.1 Tabla `rol`
- Almacena la jerarquía de perfiles de acceso.
- **Restricción:** `nombre_rol` UNIQUE NOT NULL.

### 3.2 Tabla `usuario`
- Registra la cuenta de usuario, hash de clave y perfil.
- **Clave Foránea:** `id_rol` -> `rol(id_rol)` ON DELETE RESTRICT.
- **Restricción:** `correo_electronico` UNIQUE NOT NULL.

### 3.3 Tabla `sesion_usuario`
- Mantiene el estado activo de cada token JWT para revocación remota.
- **Clave Foránea:** `id_usuario` -> `usuario(id_usuario)` ON DELETE CASCADE.

### 3.4 Tabla `vehiculo`
- Registra el parque automotor de la empresa.
- **Restricción:** `placa` UNIQUE NOT NULL (Validado en formato colombiano `AAA-123`).

### 3.5 Tabla `conductor`
- Mantiene la información operativa y licencias de conducción.
- **Clave Foránea:** `id_usuario` -> `usuario(id_usuario)` ON DELETE SET NULL.
- **Restricción:** `cedula` UNIQUE NOT NULL.

### 3.6 Tabla `ruta`
- Almacena las asignaciones de rutas entre un conductor y un vehículo.
- **Claves Foráneas:**
  - `id_conductor` -> `conductor(id_conductor)` ON DELETE RESTRICT.
  - `id_vehiculo` -> `vehiculo(id_vehiculo)` ON DELETE RESTRICT.

### 3.7 Tabla `seguimiento_ruta` / `historial_ubicacion`
- Registra la telemetría GPS transmitida por los conductores.
- **Clave Foránea:** `id_ruta` -> `ruta(id_ruta)` ON DELETE CASCADE.

### 3.8 Tabla `mantenimiento`
- Controla los costos y programas de mantenimiento.
- **Clave Foránea:** `id_vehiculo` -> `vehiculo(id_vehiculo)` ON DELETE RESTRICT.

---

## 4. Instrucciones de Inicialización

Para restaurar o inicializar la base de datos localmente utilizando PostgreSQL CLI:

```bash
# Crear base de datos en PostgreSQL
createdb -U postgres vextor_db

# Ejecutar el script DDL
psql -U postgres -d vextor_db -f vextor_bd/vextor_bd.sql
```
