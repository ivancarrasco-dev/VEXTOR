-- =============================================================================
-- SISTEMA VEXTOR - SCRIPT DE CREACIÓN DE BASE DE DATOS 
-- Motor: PostgreSQL 13+ | Arquitectura de Identificadores Únicos Universales (UUID v4)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Tabla: ROL
-- -----------------------------------------------------------------------------
CREATE TABLE ROL (
    id_rol UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre_rol VARCHAR(50) NOT NULL UNIQUE,
    descripcion_rol VARCHAR(255) NULL
);

-- -----------------------------------------------------------------------------
-- 2. Tabla: USUARIO
-- -----------------------------------------------------------------------------
CREATE TABLE USUARIO (
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
    CONSTRAINT fk_usuario_rol FOREIGN KEY (id_rol) 
        REFERENCES ROL (id_rol) 
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT chk_estado_usuario CHECK (estado_usuario IN ('ACTIVO', 'INACTIVO'))
);

-- -----------------------------------------------------------------------------
-- 3. Tabla: CONDUCTOR
-- -----------------------------------------------------------------------------
CREATE TABLE CONDUCTOR (
    id_conductor UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_usuario UUID NOT NULL UNIQUE,
    nombre_conductor VARCHAR(100) NOT NULL,
    apellido_conductor VARCHAR(100) NOT NULL,
    cedula_conductor VARCHAR(20) NOT NULL UNIQUE,
    telefono_conductor VARCHAR(20) NULL,
    licencia VARCHAR(50) NOT NULL,
    estado_conductor VARCHAR(20) NOT NULL DEFAULT 'ACTIVO',
    fecha_ingreso DATE NOT NULL,
    CONSTRAINT fk_conductor_usuario FOREIGN KEY (id_usuario) 
        REFERENCES USUARIO (id_usuario) 
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT chk_estado_conductor CHECK (estado_conductor IN ('ACTIVO', 'INACTIVO', 'SUSPENDIDO'))
);

-- -----------------------------------------------------------------------------
-- 4. Tabla: VEHICULO
-- -----------------------------------------------------------------------------
CREATE TABLE VEHICULO (
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
-- 5. Tabla: RUTA
-- -----------------------------------------------------------------------------
CREATE TABLE RUTA (
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
-- 6. Tabla: ASIGNACION_CONDUCTOR
-- -----------------------------------------------------------------------------
CREATE TABLE ASIGNACION_CONDUCTOR (
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
-- 7. Tabla: ASIGNACION_VEHICULO
-- -----------------------------------------------------------------------------
CREATE TABLE ASIGNACION_VEHICULO (
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
-- 8. Tabla: NOVEDAD
-- -----------------------------------------------------------------------------
CREATE TABLE NOVEDAD (
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
-- 9. Tabla: REPORTE
-- -----------------------------------------------------------------------------
CREATE TABLE REPORTE (
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
-- 10. Tabla: MANTENIMIENTO
-- -----------------------------------------------------------------------------
CREATE TABLE MANTENIMIENTO (
    id_mantenimiento UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_vehiculo UUID NOT NULL,
    tipo_mantenimiento VARCHAR(50) NOT NULL,
   
    descripcion_mantenimiento TEXT NOT NULL,
    fecha_mantenimiento DATE NOT NULL,
    costo_mantenimiento NUMERIC(10,2) NOT NULL,
    kilometraje_mantenimiento INT NOT NULL,
    estado_mantenimiento VARCHAR(20) NOT NULL DEFAULT 'PROGRAMADO',
    CONSTRAINT fk_mantenimiento_vehiculo FOREIGN KEY (id_vehiculo)
        REFERENCES VEHICULO (id_vehiculo)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT chk_estado_mantenimiento CHECK (estado_mantenimiento IN ('PROGRAMADO', 'EN_PROCESO', 'COMPLETADA', 'CANCELADO'))
);
