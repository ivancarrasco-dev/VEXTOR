-- =============================================================================
-- SISTEMA VEXTOR - SCRIPT DE CREACIÓN DE BASE DE DATOS DE PRODUCCIÓN
-- Motor: PostgreSQL 13+ | Arquitectura de Identificadores Únicos Universales (UUID v4)
-- =============================================================================

-- Habilitar extensión pgcrypto para gen_random_uuid() si no está habilitada
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- -----------------------------------------------------------------------------
-- 1. Tabla: ROL
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ROL (
    id_rol UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre_rol VARCHAR(50) NOT NULL UNIQUE,
    descripcion_rol VARCHAR(255) NULL
);

-- -----------------------------------------------------------------------------
-- 2. Tabla: USUARIO
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS USUARIO (
    id_usuario UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_rol UUID NOT NULL,
    nombres_usuario VARCHAR(100) NOT NULL,
    apellidos_usuario VARCHAR(100) NOT NULL,
    correo_usuario VARCHAR(150) NOT NULL UNIQUE,
    contrasenia_usuario VARCHAR(255) NOT NULL,
    telefono_usuario VARCHAR(20) NULL,
    estado_usuario VARCHAR(20) NOT NULL DEFAULT 'ACTIVO',
    fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    token_recuperacion VARCHAR(255) NULL,
    foto_perfil TEXT NULL,
    CONSTRAINT fk_usuario_rol FOREIGN KEY (id_rol) 
        REFERENCES ROL (id_rol) 
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT chk_estado_usuario CHECK (estado_usuario IN ('ACTIVO', 'INACTIVO'))
);

-- -----------------------------------------------------------------------------
-- 3. Tabla: SESION_USUARIO
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS SESION_USUARIO (
    id_sesion UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_usuario UUID NOT NULL,
    ip_origen VARCHAR(45) NULL,
    dispositivo VARCHAR(255) NULL,
    user_agent TEXT NULL,
    fecha_inicio TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ultima_actividad TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    estado_sesion VARCHAR(20) NOT NULL DEFAULT 'ACTIVA',
    CONSTRAINT fk_sesion_usuario FOREIGN KEY (id_usuario)
        REFERENCES USUARIO (id_usuario)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT chk_estado_sesion CHECK (estado_sesion IN ('ACTIVA', 'CERRADA', 'REVOCADA', 'EXPIRADA'))
);

-- -----------------------------------------------------------------------------
-- 4. Tabla: CONDUCTOR
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS CONDUCTOR (
    id_conductor UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_usuario UUID NOT NULL UNIQUE,
    nombre_conductor VARCHAR(100) NOT NULL,
    apellido_conductor VARCHAR(100) NOT NULL,
    cedula_conductor VARCHAR(20) NOT NULL UNIQUE,
    telefono_conductor VARCHAR(20) NULL,
    licencia VARCHAR(50) NOT NULL,
    estado_conductor VARCHAR(20) NOT NULL DEFAULT 'DISPONIBLE',
    fecha_ingreso DATE NOT NULL,
    CONSTRAINT fk_conductor_usuario FOREIGN KEY (id_usuario) 
        REFERENCES USUARIO (id_usuario) 
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT chk_estado_conductor CHECK (estado_conductor IN ('DISPONIBLE', 'EN_RUTA', 'NO_DISPONIBLE', 'ACTIVO', 'INACTIVO', 'SUSPENDIDO'))
);

-- -----------------------------------------------------------------------------
-- 5. Tabla: VEHICULO
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS VEHICULO (
    id_vehiculo UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    placa VARCHAR(15) NOT NULL UNIQUE,
    marca VARCHAR(50) NOT NULL,
    modelo VARCHAR(50) NOT NULL,
    anio INT NOT NULL,
    color VARCHAR(30) NULL,
    tipo_vehiculo VARCHAR(50) NOT NULL,
    capacidad_pasajeros INT NOT NULL,
    kilometraje_actual INT NOT NULL DEFAULT 0,
    kilometraje_limite_mantenimiento INT NOT NULL,
    estado_vehiculo VARCHAR(20) NOT NULL DEFAULT 'DISPONIBLE',
    documentacion_vehiculo VARCHAR(255) NULL,
    CONSTRAINT chk_estado_vehiculo CHECK (estado_vehiculo IN ('DISPONIBLE', 'EN_RUTA', 'MANTENIMIENTO', 'INACTIVO'))
);

-- -----------------------------------------------------------------------------
-- 6. Tabla: RUTA
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS RUTA (
    id_ruta UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo_ruta VARCHAR(50) NOT NULL UNIQUE,
    nombre_ruta VARCHAR(100) NOT NULL,
    origen VARCHAR(150) NOT NULL,
    destino VARCHAR(150) NOT NULL,
    fecha_programada TIMESTAMP NOT NULL,
    hora_inicio_real TIMESTAMP NULL,
    hora_fin_real TIMESTAMP NULL,
    estado_ruta VARCHAR(30) NOT NULL DEFAULT 'PROGRAMADA',
    motivo_suspension VARCHAR(255) NULL,
    CONSTRAINT chk_estado_ruta CHECK (estado_ruta IN ('PROGRAMADA', 'EN_PROCESO', 'COMPLETADA', 'SUSPENDIDA', 'CANCELADA'))
);

-- -----------------------------------------------------------------------------
-- 7. Tabla: ASIGNACION_CONDUCTOR
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ASIGNACION_CONDUCTOR (
    id_asignacion_conductor UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_conductor UUID NOT NULL,
    id_ruta UUID NOT NULL,
    fecha_asignacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    estado_asignacion VARCHAR(20) NOT NULL DEFAULT 'ACTIVA',
    motivo_cambio VARCHAR(255) NULL,
    CONSTRAINT fk_asig_cond_conductor FOREIGN KEY (id_conductor) 
        REFERENCES CONDUCTOR (id_conductor) 
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_asig_cond_ruta FOREIGN KEY (id_ruta) 
        REFERENCES RUTA (id_ruta) 
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT chk_estado_asig_cond CHECK (estado_asignacion IN ('ACTIVA', 'INACTIVA', 'FINALIZADA'))
);

-- -----------------------------------------------------------------------------
-- 8. Tabla: ASIGNACION_VEHICULO
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ASIGNACION_VEHICULO (
    id_asignacion_vehiculo UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_vehiculo UUID NOT NULL,
    id_ruta UUID NOT NULL,
    fecha_asignacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    estado_asignacion VARCHAR(20) NOT NULL DEFAULT 'ACTIVA',
    CONSTRAINT fk_asig_veh_vehiculo FOREIGN KEY (id_vehiculo) 
        REFERENCES VEHICULO (id_vehiculo) 
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_asig_veh_ruta FOREIGN KEY (id_ruta) 
        REFERENCES RUTA (id_ruta) 
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT chk_estado_asig_veh CHECK (estado_asignacion IN ('ACTIVA', 'INACTIVA', 'FINALIZADA'))
);

-- -----------------------------------------------------------------------------
-- 9. Tabla: SEGUIMIENTO_RUTA
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS SEGUIMIENTO_RUTA (
    id_seguimiento UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_ruta UUID NOT NULL UNIQUE,
    id_conductor UUID NOT NULL,
    id_vehiculo UUID NOT NULL,
    latitud NUMERIC(10, 6) NOT NULL,
    longitud NUMERIC(10, 6) NOT NULL,
    velocidad NUMERIC(5, 2) NULL DEFAULT 0.0,
    heading NUMERIC(5, 2) NULL DEFAULT 0.0,
    ultima_actualizacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    estado_seguimiento VARCHAR(20) NOT NULL DEFAULT 'ACTIVO',
    CONSTRAINT fk_seguimiento_ruta FOREIGN KEY (id_ruta)
        REFERENCES RUTA (id_ruta)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_seguimiento_conductor FOREIGN KEY (id_conductor)
        REFERENCES CONDUCTOR (id_conductor)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_seguimiento_vehiculo FOREIGN KEY (id_vehiculo)
        REFERENCES VEHICULO (id_vehiculo)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT chk_estado_seguimiento CHECK (estado_seguimiento IN ('ACTIVO', 'FINALIZADO'))
);

-- -----------------------------------------------------------------------------
-- 10. Tabla: HISTORIAL_UBICACION
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS HISTORIAL_UBICACION (
    id_historial UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_seguimiento UUID NOT NULL,
    id_ruta UUID NOT NULL,
    latitud NUMERIC(10, 6) NOT NULL,
    longitud NUMERIC(10, 6) NOT NULL,
    velocidad NUMERIC(5, 2) NULL,
    fecha_hora TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_historial_seguimiento FOREIGN KEY (id_seguimiento)
        REFERENCES SEGUIMIENTO_RUTA (id_seguimiento)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_historial_ruta FOREIGN KEY (id_ruta)
        REFERENCES RUTA (id_ruta)
        ON DELETE CASCADE ON UPDATE CASCADE
);

-- -----------------------------------------------------------------------------
-- 11. Tabla: NOVEDAD
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS NOVEDAD (
    id_novedad UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_conductor UUID NOT NULL,
    id_ruta UUID NULL,
    tipo_novedad VARCHAR(50) NOT NULL,
    descripcion_novedad TEXT NOT NULL,
    fecha_hora_reporte TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    evidencia_adjunta VARCHAR(255) NULL,
    estado_novedad VARCHAR(20) NOT NULL DEFAULT 'PENDIENTE',
    CONSTRAINT fk_novedad_conductor FOREIGN KEY (id_conductor) 
        REFERENCES CONDUCTOR (id_conductor) 
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_novedad_ruta FOREIGN KEY (id_ruta) 
        REFERENCES RUTA (id_ruta) 
        ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT chk_estado_novedad CHECK (estado_novedad IN ('PENDIENTE', 'EN_REVISION', 'RESUELTA', 'RECHAZADA'))
);

-- -----------------------------------------------------------------------------
-- 12. Tabla: MANTENIMIENTO
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS MANTENIMIENTO (
    id_mantenimiento UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_vehiculo UUID NOT NULL,
    tipo_mantenimiento VARCHAR(50) NOT NULL,
    descripcion_mantenimiento TEXT NOT NULL,
    fecha_mantenimiento DATE NOT NULL,
    costo_mantenimiento NUMERIC(10,2) NOT NULL,
    kilometraje_mantenimiento VARCHAR(20) NOT NULL,
    estado_mantenimiento VARCHAR(20) NOT NULL DEFAULT 'PROGRAMADO',
    CONSTRAINT fk_mantenimiento_vehiculo FOREIGN KEY (id_vehiculo)
        REFERENCES VEHICULO (id_vehiculo)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT chk_estado_mantenimiento CHECK (estado_mantenimiento IN ('PROGRAMADO', 'EN_PROCESO', 'COMPLETADA', 'CANCELADO'))
);

-- -----------------------------------------------------------------------------
-- 13. Tabla: REPORTE
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS REPORTE (
    id_reporte UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_usuario UUID NOT NULL,
    tipo_reporte VARCHAR(50) NOT NULL,
    fecha_generacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_rango_inicio DATE NOT NULL,
    fecha_rango_fin DATE NOT NULL,
    formato_exportacion VARCHAR(10) NOT NULL DEFAULT 'PDF',
    CONSTRAINT fk_reporte_usuario FOREIGN KEY (id_usuario) 
        REFERENCES USUARIO (id_usuario) 
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT chk_formato_exportacion CHECK (formato_exportacion IN ('PDF', 'EXCEL', 'CSV'))
);

-- -----------------------------------------------------------------------------
-- 14. Tabla: ACTIVIDAD
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ACTIVIDAD (
    id_actividad UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_usuario UUID NULL,
    nombres_usuario VARCHAR(150) NULL,
    tipo_accion VARCHAR(50) NOT NULL,
    modulo VARCHAR(50) NOT NULL,
    descripcion TEXT NOT NULL,
    fecha_hora TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    id_registro_afectado VARCHAR(100) NULL,
    ip_origen VARCHAR(45) NULL,
    resultado VARCHAR(20) NOT NULL DEFAULT 'EXITOSO',
    CONSTRAINT fk_actividad_usuario FOREIGN KEY (id_usuario)
        REFERENCES USUARIO (id_usuario)
        ON DELETE SET NULL ON UPDATE CASCADE
);

-- -----------------------------------------------------------------------------
-- 15. Tabla: NOTIFICACION
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS NOTIFICACION (
    id_notificacion UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_usuario UUID NULL,
    titulo VARCHAR(150) NOT NULL,
    descripcion TEXT NOT NULL,
    fecha_hora TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    leido BOOLEAN NOT NULL DEFAULT FALSE,
    tipo VARCHAR(50) NOT NULL,
    CONSTRAINT fk_notificacion_usuario FOREIGN KEY (id_usuario)
        REFERENCES USUARIO (id_usuario)
        ON DELETE CASCADE ON UPDATE CASCADE
);

-- -----------------------------------------------------------------------------
-- 16. Tabla: EMPRESA
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS EMPRESA (
    id_empresa UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    nit VARCHAR(50) NOT NULL UNIQUE,
    address VARCHAR(255) NULL,
    city VARCHAR(100) NULL,
    email VARCHAR(150) NULL,
    phone VARCHAR(50) NULL,
    retention_days INT NULL DEFAULT 30
);

-- =============================================================================
-- DATOS INICIALES DE SISTEMA (ROLES)
-- =============================================================================
INSERT INTO ROL (id_rol, nombre_rol, descripcion_rol) VALUES
    ('11111111-2222-3333-4444-555555555551', 'Administrador', 'Control total del sistema, administración de usuarios, flotas, rutas, mantenimientos, reportes y configuración corporativa.'),
    ('11111111-2222-3333-4444-555555555552', 'Conductor', 'Operación de vehículos, visualización de rutas asignadas, navegación y emisión de telemetría GPS.'),
    ('11111111-2222-3333-4444-555555555555', 'Usuario', 'Rol predeterminado asignado en el registro público. Acceso restringido a perfil personal.')
ON CONFLICT (id_rol) DO NOTHING;

-- =============================================================================
-- ÍNDICES PARA OPTIMIZACIÓN DE CONSULTAS Y INTEGRIDAD REFERENCIAL
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_usuario_id_rol ON USUARIO (id_rol);
CREATE INDEX IF NOT EXISTS idx_sesion_usuario_id_usuario ON SESION_USUARIO (id_usuario);
CREATE INDEX IF NOT EXISTS idx_conductor_id_usuario ON CONDUCTOR (id_usuario);
CREATE INDEX IF NOT EXISTS idx_asig_cond_conductor_ruta ON ASIGNACION_CONDUCTOR (id_conductor, id_ruta);
CREATE INDEX IF NOT EXISTS idx_asig_veh_vehiculo_ruta ON ASIGNACION_VEHICULO (id_vehiculo, id_ruta);
CREATE INDEX IF NOT EXISTS idx_mantenimiento_id_vehiculo ON MANTENIMIENTO (id_vehiculo);
CREATE INDEX IF NOT EXISTS idx_actividad_fecha_hora ON ACTIVIDAD (fecha_hora DESC);
CREATE INDEX IF NOT EXISTS idx_notificacion_id_usuario_leido ON NOTIFICACION (id_usuario, leido);
CREATE INDEX IF NOT EXISTS idx_historial_ubicacion_seguimiento ON HISTORIAL_UBICACION (id_seguimiento, fecha_hora);
