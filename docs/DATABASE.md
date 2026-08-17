# Modelo de Base de Datos - VEXTOR (PostgreSQL)

La base de datos de VEXTOR está implementada en **PostgreSQL** mediante scripts SQL DDL nativos (`vextor_bd/vextor_bd.sql`) y mapeada en el backend mediante SQLAlchemy ORM (`vextor_be/models.py`).

---

## 1. Esquema Entidad-Relación (ER Diagram - ASCII)

```text
┌──────────────┐         ┌──────────────┐         ┌──────────────────┐
│     ROL      │1       *│   USUARIO    │1       *│  SESION_USUARIO  │
├──────────────┤─────────├──────────────┤─────────├──────────────────┤
│ id_rol (PK)  │         │ id_usuario PK│         │ id_sesion (PK)   │
│ nombre_rol   │         │ id_rol (FK)  │         │ id_usuario (FK)  │
└──────────────┘         └──────┬───────┘         └──────────────────┘
                                │1
                                │
                                │*
                         ┌──────┴───────┐
                         │  ACTIVIDAD   │
                         ├──────────────┤
                         │ id_actividad │
                         │ id_usuario FK│
                         └──────────────┘

┌──────────────┐         ┌──────────────────────┐         ┌──────────────┐
│  CONDUCTOR   │1       *│  ASIGNACION_VEHICULO │*       1│   VEHICULO   │
├──────────────┤─────────├──────────────────────┼─────────├──────────────┤
│id_conductorPK│         │ id_asignacion (PK)   │         │id_vehiculo PK│
│id_usuario FK │         │ id_conductor (FK)    │         │ placa (UQ)   │
└──────┬───────┘         │ id_vehiculo (FK)     │         └──────┬───────┘
       │1                └──────────────────────┘                │1
       │                                                         │
       │*                                                        │*
┌──────┴───────┐                                          ┌──────┴───────┐
│     RUTA     │                                          │MANTENIMIENTO │
├──────────────┤                                          ├──────────────┤
│ id_ruta (PK) │                                          │id_mantenimien│
│id_conductorFK│                                          │id_vehiculo FK│
│id_vehiculo FK│                                          └──────────────┘
└──────┬───────┘
       │1
       │*
┌──────┴────────────────┐
│ SEGUIMIENTO_RUTA      │
├───────────────────────┤
│ id_seguimiento (PK)   │
│ id_ruta (FK)          │
│ latitud, longitud     │
└───────────────────────┘
```

---

## 2. Descripción Tablas Principales

### 2.1 `rol`
- **Propósito:** Almacena los roles de acceso del sistema.
- **Columnas:**
  - `id_rol` (UUID, PK)
  - `nombre_rol` (VARCHAR(50), UNIQUE) - Valores: `'Administrador'`, `'Conductor'`, `'Mantenimiento'`, `'Auditor'`.

### 2.2 `usuario`
- **Propósito:** Credenciales y perfiles de usuarios.
- **Columnas:**
  - `id_usuario` (UUID, PK, Default: `gen_random_uuid()`)
  - `nombre_usuario` (VARCHAR(100))
  - `correo_electronico` (VARCHAR(150), UNIQUE)
  - `contrasena_hash` (VARCHAR(255))
  - `id_rol` (UUID, FK -> `rol.id_rol`)
  - `foto_perfil` (TEXT, Opcional - Base64 o URL)
  - `token_recuperacion` (VARCHAR(255), Opcional)
  - `fecha_expiracion_token` (TIMESTAMP)

### 2.3 `vehiculo`
- **Propósito:** Parque automotor registrado en la flota.
- **Columnas:**
  - `id_vehiculo` (UUID, PK)
  - `placa` (VARCHAR(10), UNIQUE) - Formato colombiano (ej: `ABC-123`)
  - `marca` (VARCHAR(50))
  - `modelo` (VARCHAR(50))
  - `anio` (INTEGER)
  - `tipo_vehiculo` (VARCHAR(50))
  - `capacidad_carga_kg` (NUMERIC(10,2))
  - `estado_vehiculo` (VARCHAR(20)) - `'DISPONIBLE'`, `'EN_RUTA'`, `'EN_MANTENIMIENTO'`, `'INACTIVO'`.

### 2.4 `conductor`
- **Propósito:** Perfil operativo de conductores vinculados a un usuario.
- **Columnas:**
  - `id_conductor` (UUID, PK)
  - `id_usuario` (UUID, FK -> `usuario.id_usuario`, Opcional)
  - `nombre` (VARCHAR(100))
  - `cedula` (VARCHAR(20), UNIQUE)
  - `celular` (VARCHAR(20))
  - `categoria_licencia` (VARCHAR(10)) - Ej: `C1`, `C2`, `C3`, `B1`, `B2`.
  - `numero_licencia` (VARCHAR(50))
  - `estado_conductor` (VARCHAR(20)) - `'DISPONIBLE'`, `'EN_RUTA'`, `'NO_DISPONIBLE'`.

### 2.5 `ruta`
- **Propósito:** Rutas logísticas programadas y ejecutadas.
- **Columnas:**
  - `id_ruta` (UUID, PK)
  - `codigo_ruta` (VARCHAR(20), UNIQUE)
  - `nombre_ruta` (VARCHAR(150))
  - `origen` (TEXT) - Coordenadas `lat,lng` o dirección
  - `destino` (TEXT)
  - `id_conductor` (UUID, FK -> `conductor.id_conductor`)
  - `id_vehiculo` (UUID, FK -> `vehiculo.id_vehiculo`)
  - `estado_ruta` (VARCHAR(20)) - `'PROGRAMADA'`, `'EN_RUTA'`, `'COMPLETADA'`, `'CANCELADA'`.

### 2.6 `seguimiento_ruta` / `historial_ubicacion`
- **Propósito:** Almacenamiento de puntos GPS emitidos en tiempo real.
- **Columnas:**
  - `id_seguimiento` (UUID, PK)
  - `id_ruta` (UUID, FK -> `ruta.id_ruta`)
  - `latitud` (NUMERIC(10,8))
  - `longitud` (NUMERIC(11,8))
  - `velocidad_kmh` (NUMERIC(5,2))
  - `rumbo_grados` (NUMERIC(5,2))
  - `fecha_registro` (TIMESTAMP DEFAULT CURRENT_TIMESTAMP)

### 2.7 `mantenimiento`
- **Propósito:** Registro de intervenciones mecánicas.
- **Columnas:**
  - `id_mantenimiento` (UUID, PK)
  - `id_vehiculo` (UUID, FK -> `vehiculo.id_vehiculo`)
  - `tipo_mantenimiento` (VARCHAR(30)) - `'PREVENTIVO'`, `'CORRECTIVO'`.
  - `costo` (NUMERIC(12,2)) - Valor en COP.
  - `estado_mantenimiento` (VARCHAR(20))

### 2.8 `actividad`
- **Propósito:** Auditoría del sistema.
- **Columnas:**
  - `id_actividad` (UUID, PK)
  - `id_usuario` (UUID, FK -> `usuario.id_usuario`)
  - `accion` (VARCHAR(100))
  - `modulo` (VARCHAR(50))
  - `detalles` (TEXT)
  - `fecha_registro` (TIMESTAMP)

### 2.9 `notificacion`
- **Propósito:** Alerta a usuarios en el Notification Center.
- **Columnas:**
  - `id_notificacion` (UUID, PK)
  - `id_usuario` (UUID, FK)
  - `titulo` (VARCHAR(150))
  - `mensaje` (TEXT)
  - `leida` (BOOLEAN DEFAULT FALSE)
