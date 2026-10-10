-- =============================================================================
-- BASE DE DATOS POSTGRESQL PARA SUPABASE/PRODUCCIÓN - PROYECTO VEXTOR
-- DDL COMPLETO CON UUID Y RESTRICCIONES OFICIALES VEXTOR
-- =============================================================================

BEGIN;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. EMPRESA
CREATE TABLE IF NOT EXISTS empresa (
    id_empresa UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    nit VARCHAR(50) NOT NULL UNIQUE,
    address VARCHAR(255) NULL,
    city VARCHAR(100) NULL,
    email VARCHAR(150) NULL,
    phone VARCHAR(50) NULL,
    retention_days INT NULL DEFAULT 30,
    estado VARCHAR(20) NOT NULL DEFAULT 'ACTIVO',
    fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_empresa_estado CHECK (estado IN ('ACTIVO', 'SUSPENDIDO', 'INACTIVO'))
);

-- 2. ROL
CREATE TABLE IF NOT EXISTS rol (
    id_rol UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre_rol VARCHAR(50) NOT NULL UNIQUE,
    descripcion_rol VARCHAR(255) NULL,
    CONSTRAINT chk_nombre_rol CHECK (LOWER(nombre_rol) IN ('conductor', 'administrador', 'usuario'))
);

INSERT INTO rol (id_rol, nombre_rol, descripcion_rol) VALUES
    ('11111111-2222-3333-4444-555555555551', 'administrador', 'Control total del sistema'),
    ('11111111-2222-3333-4444-555555555552', 'conductor', 'Operación de vehículos y navegación'),
    ('11111111-2222-3333-4444-555555555555', 'usuario', 'Usuario final')
ON CONFLICT (id_rol) DO NOTHING;

-- 3. USUARIO
CREATE TABLE IF NOT EXISTS usuario (
    id_usuario UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_rol UUID NOT NULL,
    nombres_usuario VARCHAR(100) NOT NULL,
    apellidos_usuario VARCHAR(100) NOT NULL,
    correo_usuario VARCHAR(150) NOT NULL UNIQUE,
    contrasenia_usuario VARCHAR(255) NOT NULL,
    telefono_usuario VARCHAR(20) NULL,
    estado_usuario VARCHAR(20) NOT NULL DEFAULT 'ACTIVO',
    fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    token_recuperacion VARCHAR(255) NULL,
    foto_perfil TEXT NULL,
    requiere_cambio_clave BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT fk_usuario_rol FOREIGN KEY (id_rol) REFERENCES rol (id_rol) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT chk_usuario_estado CHECK (estado_usuario IN ('ACTIVO', 'INACTIVO'))
);

-- 4. SESION_USUARIO
CREATE TABLE IF NOT EXISTS sesion_usuario (
    id_sesion UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_usuario UUID NOT NULL,
    token VARCHAR(255) NULL,
    ip_origen VARCHAR(45) NULL,
    dispositivo VARCHAR(255) NULL,
    user_agent TEXT NULL,
    fecha_inicio TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ultima_actividad TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    estado_sesion VARCHAR(20) NOT NULL DEFAULT 'ACTIVA',
    CONSTRAINT fk_sesion_usuario FOREIGN KEY (id_usuario) REFERENCES usuario (id_usuario) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT chk_sesion_estado CHECK (estado_sesion IN ('ACTIVA', 'CERRADA', 'REVOCADA', 'EXPIRADA'))
);

-- 5. CONDUCTOR
CREATE TABLE IF NOT EXISTS conductor (
    id_conductor UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_usuario UUID NOT NULL UNIQUE,
    nombre_conductor VARCHAR(100) NOT NULL,
    apellido_conductor VARCHAR(100) NOT NULL,
    cedula_conductor VARCHAR(20) NOT NULL UNIQUE,
    telefono_conductor VARCHAR(20) NULL,
    licencia VARCHAR(50) NOT NULL,
    estado_conductor VARCHAR(20) NOT NULL DEFAULT 'DISPONIBLE',
    fecha_ingreso DATE NOT NULL,
    CONSTRAINT fk_conductor_usuario FOREIGN KEY (id_usuario) REFERENCES usuario (id_usuario) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT chk_conductor_estado CHECK (estado_conductor IN ('DISPONIBLE', 'EN_RUTA', 'NO_DISPONIBLE', 'ACTIVO', 'INACTIVO', 'SUSPENDIDO'))
);

-- 6. MARCA & MODELO
CREATE TABLE IF NOT EXISTS marca (
    id_marca UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre_marca VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS modelo (
    id_modelo UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_marca UUID NOT NULL,
    nombre_modelo VARCHAR(100) NOT NULL,
    capacidad_pasajeros INT NOT NULL DEFAULT 4,
    anio INT NOT NULL,
    CONSTRAINT fk_modelo_marca FOREIGN KEY (id_marca) REFERENCES marca (id_marca) ON DELETE RESTRICT ON UPDATE CASCADE
);

-- 7. VEHICULO
CREATE TABLE IF NOT EXISTS vehiculo (
    id_vehiculo UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_modelo UUID NULL,
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
    CONSTRAINT fk_vehiculo_modelo FOREIGN KEY (id_modelo) REFERENCES modelo (id_modelo) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT chk_vehiculo_estado CHECK (estado_vehiculo IN ('DISPONIBLE', 'EN_RUTA', 'MANTENIMIENTO', 'INACTIVO'))
);

-- 8. DOCUMENTO_VEHICULO
CREATE TABLE IF NOT EXISTS documento_vehiculo (
    id_documento UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_vehiculo UUID NOT NULL,
    tipo_documento VARCHAR(50) NOT NULL,
    numero_documento VARCHAR(50) NULL,
    fecha_vencimiento DATE NOT NULL,
    CONSTRAINT fk_documento_vehiculo FOREIGN KEY (id_vehiculo) REFERENCES vehiculo (id_vehiculo) ON DELETE CASCADE ON UPDATE CASCADE
);

-- 9. RUTA_DEFINICION
CREATE TABLE IF NOT EXISTS ruta_definicion (
    id_ruta UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo_ruta VARCHAR(50) NOT NULL UNIQUE,
    nombre_ruta VARCHAR(100) NOT NULL,
    origen VARCHAR(150) NOT NULL,
    destino VARCHAR(150) NOT NULL,
    paradas TEXT NULL,
    fecha_programada TIMESTAMPTZ NULL,
    hora_inicio_real TIMESTAMPTZ NULL,
    hora_fin_real TIMESTAMPTZ NULL,
    estado_ruta VARCHAR(30) NOT NULL DEFAULT 'PROGRAMADA',
    motivo_suspension VARCHAR(255) NULL,
    CONSTRAINT chk_ruta_estado CHECK (estado_ruta IN ('PROGRAMADA', 'EN_PROCESO', 'COMPLETADA', 'SUSPENDIDA', 'CANCELADA'))
);

-- 10. VIAJE
CREATE TABLE IF NOT EXISTS viaje (
    id_viaje UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_conductor UUID NOT NULL,
    id_vehiculo UUID NOT NULL,
    id_ruta UUID NOT NULL,
    estado_viaje VARCHAR(20) NOT NULL DEFAULT 'PROGRAMADO',
    fecha_hora_salida_programada TIMESTAMPTZ NOT NULL,
    fecha_hora_llegada_programada TIMESTAMPTZ NOT NULL,
    CONSTRAINT fk_viaje_conductor FOREIGN KEY (id_conductor) REFERENCES conductor (id_conductor) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_viaje_vehiculo FOREIGN KEY (id_vehiculo) REFERENCES vehiculo (id_vehiculo) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_viaje_ruta FOREIGN KEY (id_ruta) REFERENCES ruta_definicion (id_ruta) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT chk_viaje_estado CHECK (estado_viaje IN ('PROGRAMADO', 'EN_PROCESO', 'FINALIZADO', 'CANCELADO'))
);

-- 11. HISTORIAL_UBICACION_VIAJE
CREATE TABLE IF NOT EXISTS historial_ubicacion_viaje (
    id_historial UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_viaje UUID NULL,
    latitud NUMERIC(10, 6) NOT NULL,
    longitud NUMERIC(10, 6) NOT NULL,
    velocidad NUMERIC(5, 2) NULL DEFAULT 0.0,
    fecha_hora TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_historial_viaje FOREIGN KEY (id_viaje) REFERENCES viaje (id_viaje) ON DELETE CASCADE ON UPDATE CASCADE
);

-- 12. NOVEDAD
CREATE TABLE IF NOT EXISTS novedad (
    id_novedad UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_conductor UUID NOT NULL,
    id_viaje UUID NULL,
    id_vehiculo UUID NULL,
    id_usuario UUID NULL,
    tipo_novedad VARCHAR(50) NOT NULL,
    descripcion_novedad TEXT NOT NULL,
    fecha_hora_reporte TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    evidencia_adjunta VARCHAR(255) NULL,
    estado_novedad VARCHAR(20) NOT NULL DEFAULT 'PENDIENTE',
    CONSTRAINT fk_novedad_conductor FOREIGN KEY (id_conductor) REFERENCES conductor (id_conductor) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_novedad_viaje FOREIGN KEY (id_viaje) REFERENCES viaje (id_viaje) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_novedad_vehiculo FOREIGN KEY (id_vehiculo) REFERENCES vehiculo (id_vehiculo) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_novedad_usuario FOREIGN KEY (id_usuario) REFERENCES usuario (id_usuario) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT chk_novedad_estado CHECK (estado_novedad IN ('PENDIENTE', 'EN_REVISION', 'RESUELTA', 'RECHAZADA'))
);

-- 13. MANTENIMIENTO
CREATE TABLE IF NOT EXISTS mantenimiento (
    id_mantenimiento UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_vehiculo UUID NOT NULL,
    id_conductor UUID NULL,
    id_novedad UUID NULL,
    tipo_mantenimiento VARCHAR(50) NOT NULL,
    descripcion_mantenimiento TEXT NOT NULL,
    fecha_mantenimiento DATE NOT NULL,
    costo_mantenimiento NUMERIC(10, 2) NOT NULL,
    kilometraje_mantenimiento INT NOT NULL,
    estado_mantenimiento VARCHAR(20) NOT NULL DEFAULT 'PROGRAMADO',
    CONSTRAINT fk_mantenimiento_vehiculo FOREIGN KEY (id_vehiculo) REFERENCES vehiculo (id_vehiculo) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_mantenimiento_conductor FOREIGN KEY (id_conductor) REFERENCES conductor (id_conductor) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_mantenimiento_novedad FOREIGN KEY (id_novedad) REFERENCES novedad (id_novedad) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT chk_mantenimiento_estado CHECK (estado_mantenimiento IN ('PROGRAMADO', 'EN_PROCESO', 'COMPLETADA', 'CANCELADO'))
);

-- 14. INSPECCION_UNIDAD
CREATE TABLE IF NOT EXISTS inspeccion_unidad (
    id_inspeccion UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_vehiculo UUID NOT NULL,
    id_usuario UUID NOT NULL,
    resultado VARCHAR(30) NOT NULL,
    observaciones TEXT NULL,
    fecha_inspeccion TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_inspeccion_vehiculo FOREIGN KEY (id_vehiculo) REFERENCES vehiculo (id_vehiculo) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_inspeccion_usuario FOREIGN KEY (id_usuario) REFERENCES usuario (id_usuario) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT chk_inspeccion_resultado CHECK (resultado IN ('APROBADO', 'RECHAZADO', 'CON_OBSERVACIONES'))
);

-- 15. REPORTE
CREATE TABLE IF NOT EXISTS reporte (
    id_reporte UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_usuario UUID NOT NULL,
    tipo_reporte VARCHAR(50) NOT NULL,
    fecha_generacion TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_rango_inicio DATE NOT NULL,
    fecha_rango_fin DATE NOT NULL,
    formato_exportacion VARCHAR(10) NOT NULL DEFAULT 'PDF',
    CONSTRAINT fk_reporte_usuario FOREIGN KEY (id_usuario) REFERENCES usuario (id_usuario) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT chk_formato_exportacion CHECK (formato_exportacion IN ('PDF', 'EXCEL', 'CSV'))
);

-- 16. ACTIVIDAD
CREATE TABLE IF NOT EXISTS actividad (
    id_actividad UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_usuario UUID NULL,
    nombres_usuario VARCHAR(150) NULL,
    tipo_accion VARCHAR(50) NOT NULL,
    modulo VARCHAR(50) NOT NULL,
    descripcion TEXT NOT NULL,
    fecha_hora TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    id_registro_afectado VARCHAR(100) NULL,
    ip_origen VARCHAR(45) NULL,
    resultado VARCHAR(20) NOT NULL DEFAULT 'EXITOSO',
    CONSTRAINT fk_actividad_usuario FOREIGN KEY (id_usuario) REFERENCES usuario (id_usuario) ON DELETE SET NULL ON UPDATE CASCADE
);

-- 17. NOTIFICACION_ENVIO
CREATE TABLE IF NOT EXISTS notificacion_envio (
    id_notificacion UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_usuario UUID NULL,
    id_viaje UUID NULL,
    titulo VARCHAR(150) NOT NULL,
    descripcion TEXT NOT NULL,
    estado_envio VARCHAR(20) NOT NULL DEFAULT 'PENDIENTE',
    fecha_hora TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    leido BOOLEAN NOT NULL DEFAULT FALSE,
    tipo VARCHAR(50) NULL DEFAULT 'general',
    CONSTRAINT fk_notificacion_usuario FOREIGN KEY (id_usuario) REFERENCES usuario (id_usuario) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_notificacion_viaje FOREIGN KEY (id_viaje) REFERENCES viaje (id_viaje) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT chk_estado_envio CHECK (estado_envio IN ('PENDIENTE', 'ENVIADO', 'FALLIDO'))
);

COMMIT;
