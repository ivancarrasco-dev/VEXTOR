-- =============================================================================
-- BASE DE DATOS POSTGRESQL PARA SUPABASE - PROYECTO VEXTOR
-- DDL COMPLETO CON UUID Y POLÍTICAS DE SEGURIDAD (RLS - ROW LEVEL SECURITY)
-- Motor: PostgreSQL 14+ / Supabase
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- 0. EXTENSIONES REQUERIDAS Y CONFIGURACIÓN
-- -----------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS btree_gist;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- -----------------------------------------------------------------------------
-- 1. TABLA EMPRESA (AISLADA / SIN CONEXIONES NI FK)
-- -----------------------------------------------------------------------------
CREATE TABLE empresa (
    id_empresa UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nit_identificacion VARCHAR(20) NOT NULL,
    razon_social VARCHAR(150) NOT NULL,
    estado VARCHAR(20) NOT NULL DEFAULT 'ACTIVO',
    fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uk_empresa_nit UNIQUE (nit_identificacion),
    CONSTRAINT chk_empresa_estado CHECK (estado IN ('ACTIVO', 'SUSPENDIDO', 'INACTIVO'))
);

COMMENT ON TABLE empresa IS 'Tabla independiente para la gestión multi-tenant futura (sin relaciones activas)';

-- -----------------------------------------------------------------------------
-- 2. TABLAS CORE Y GESTIÓN DE USUARIOS
-- -----------------------------------------------------------------------------

-- Rol (Catálogo Global)
CREATE TABLE rol (
    id_rol INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    codigo VARCHAR(30) NOT NULL UNIQUE,
    nombre VARCHAR(50) NOT NULL,
    descripcion VARCHAR(255)
);

INSERT INTO rol (codigo, nombre, descripcion) VALUES
('ADMINISTRADOR', 'Administrador de Empresa', 'Acceso total a la configuración y gestión del sistema'),
('OPERADOR', 'Operador de Logística', 'Gestión de rutas, viajes, asignaciones y novedades'),
('CONDUCTOR', 'Conductor Operativo', 'Acceso a viajes asignados, reportes de estado y novedades'),
('AUDITOR', 'Auditor de Sistema', 'Acceso de solo lectura a reportes, trazabilidad y bitácoras'),
('INVITADO', 'Usuario Invitado / Demo', 'Acceso de solo lectura para exploración del aplicativo y vistas previas');

-- Usuario
CREATE TABLE usuario (
    id_usuario UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_empresa UUID NOT NULL,
    id_rol INT NOT NULL,
    nombres VARCHAR(100) NOT NULL,
    apellidos VARCHAR(100) NOT NULL,
    correo_electronico VARCHAR(150) NOT NULL UNIQUE,
    contrasena_hash VARCHAR(255) NOT NULL,
    estado VARCHAR(20) NOT NULL DEFAULT 'ACTIVO',
    fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uk_usuario_empresa UNIQUE (id_empresa, id_usuario),
    CONSTRAINT fk_usuario_rol FOREIGN KEY (id_rol)
        REFERENCES rol (id_rol) ON DELETE RESTRICT,
    CONSTRAINT chk_usuario_estado CHECK (estado IN ('ACTIVO', 'INACTIVO', 'BLOQUEADO'))
);

-- Sesión de Usuario (Revocación JWT y Control de Dispositivos)
CREATE TABLE sesion_usuario (
    id_sesion UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_usuario UUID NOT NULL,
    token_jti VARCHAR(100) NOT NULL UNIQUE,
    ip_conexion VARCHAR(45) NOT NULL,
    user_agent TEXT,
    fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_expiracion TIMESTAMPTZ NOT NULL,
    fecha_revocacion TIMESTAMPTZ,
    estado_sesion VARCHAR(20) NOT NULL DEFAULT 'ACTIVA',

    CONSTRAINT fk_sesion_usuario FOREIGN KEY (id_usuario)
        REFERENCES usuario (id_usuario) ON DELETE CASCADE,
    CONSTRAINT chk_sesion_estado CHECK (estado_sesion IN ('ACTIVA', 'REVOCADA', 'EXPIRADA')),
    CONSTRAINT chk_sesion_fechas CHECK (fecha_expiracion > fecha_creacion)
);

-- Conductor (Extensión 1:0..1 de Usuario)
CREATE TABLE conductor (
    id_conductor UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_empresa UUID NOT NULL,
    id_usuario UUID NOT NULL UNIQUE,
    numero_identificacion VARCHAR(20) NOT NULL,
    numero_licencia VARCHAR(30) NOT NULL,
    categoria_licencia VARCHAR(10) NOT NULL,
    fecha_vencimiento_licencia DATE NOT NULL,
    estado_operativo VARCHAR(25) NOT NULL DEFAULT 'DISPONIBLE',

    CONSTRAINT uk_conductor_empresa UNIQUE (id_empresa, id_conductor),
    CONSTRAINT uk_conductor_identificacion UNIQUE (id_empresa, numero_identificacion),
    CONSTRAINT fk_conductor_usuario_empresa FOREIGN KEY (id_empresa, id_usuario)
        REFERENCES usuario (id_empresa, id_usuario) ON DELETE RESTRICT,
    CONSTRAINT chk_conductor_estado CHECK (estado_operativo IN ('DISPONIBLE', 'EN_VIAJE', 'LICENCIA_VENCIDA', 'INACTIVO'))
);

-- -----------------------------------------------------------------------------
-- 3. GESTIÓN DE FLOTA Y DOCUMENTACIÓN
-- -----------------------------------------------------------------------------

-- Vehículo
CREATE TABLE vehiculo (
    id_vehiculo UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_empresa UUID NOT NULL,
    placa VARCHAR(10) NOT NULL UNIQUE,
    marca VARCHAR(50) NOT NULL,
    modelo VARCHAR(50) NOT NULL,
    anio INT NOT NULL,
    numero_chasis VARCHAR(50),
    numero_motor VARCHAR(50),
    kilometraje_actual INT NOT NULL DEFAULT 0,
    estado_operativo VARCHAR(25) NOT NULL DEFAULT 'DISPONIBLE',

    CONSTRAINT uk_vehiculo_empresa UNIQUE (id_empresa, id_vehiculo),
    CONSTRAINT chk_vehiculo_marca CHECK (marca IN (
        'CHEVROLET', 'RENAULT', 'TOYOTA', 'NISSAN', 'MERCEDES-BENZ', 
        'VOLKSWAGEN', 'FORD', 'HYUNDAI', 'KIA', 'HINO', 'INTERNATIONAL', 
        'KENWORTH', 'FOTON', 'JAK', 'OTRO'
    )),
    CONSTRAINT chk_vehiculo_kilometraje CHECK (kilometraje_actual >= 0),
    CONSTRAINT chk_vehiculo_estado CHECK (estado_operativo IN ('DISPONIBLE', 'EN_VIAJE', 'EN_MANTENIMIENTO', 'FUERA_DE_SERVICIO', 'RETIRADO'))
);

COMMENT ON COLUMN vehiculo.marca IS 'Fabricante o compañía que construye el vehículo (e.g., Toyota, Renault)';
COMMENT ON COLUMN vehiculo.modelo IS 'Línea o diseño específico del vehículo (e.g., Corolla, Sandero, Onix)';

-- Documento de Vehículo
CREATE TABLE documento_vehiculo (
    id_documento_vehiculo UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_empresa UUID NOT NULL,
    id_vehiculo UUID NOT NULL,
    tipo_documento VARCHAR(40) NOT NULL,
    numero_documento VARCHAR(50),
    entidad_emisora VARCHAR(100),
    fecha_emision DATE,
    fecha_vencimiento DATE,
    ruta_archivo_storage VARCHAR(255),
    descripcion TEXT,
    origen_datos VARCHAR(30) NOT NULL DEFAULT 'SISTEMA',
    estado_vigencia VARCHAR(20) NOT NULL DEFAULT 'VIGENTE',

    CONSTRAINT fk_documento_vehiculo_padre FOREIGN KEY (id_empresa, id_vehiculo)
        REFERENCES vehiculo (id_empresa, id_vehiculo) ON DELETE RESTRICT,
    CONSTRAINT chk_documento_fechas CHECK (fecha_vencimiento IS NULL OR fecha_emision IS NULL OR fecha_vencimiento >= fecha_emision),
    CONSTRAINT chk_documento_vigencia CHECK (estado_vigencia IN ('VIGENTE', 'POR_VENCER', 'VENCIDO', 'REEMPLAZADO'))
);

-- Mantenimiento
CREATE TABLE mantenimiento (
    id_mantenimiento UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_empresa UUID NOT NULL,
    id_vehiculo UUID NOT NULL,
    tipo_mantenimiento VARCHAR(20) NOT NULL,
    descripcion TEXT NOT NULL,
    fecha_inicio TIMESTAMPTZ NOT NULL,
    fecha_fin TIMESTAMPTZ,
    kilometraje_entrada INT NOT NULL,
    kilometraje_salida INT,
    costo_total NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    estado VARCHAR(20) NOT NULL DEFAULT 'PROGRAMADO',

    CONSTRAINT fk_mantenimiento_vehiculo FOREIGN KEY (id_empresa, id_vehiculo)
        REFERENCES vehiculo (id_empresa, id_vehiculo) ON DELETE RESTRICT,
    CONSTRAINT chk_mantenimiento_tipo CHECK (tipo_mantenimiento IN ('PREVENTIVO', 'CORRECTIVO')),
    CONSTRAINT chk_mantenimiento_estado CHECK (estado IN ('PROGRAMADO', 'EN_PROCESO', 'FINALIZADO', 'CANCELADO')),
    CONSTRAINT chk_mantenimiento_km CHECK (kilometraje_salida IS NULL OR kilometraje_salida >= kilometraje_entrada),
    CONSTRAINT chk_mantenimiento_costo CHECK (costo_total >= 0),
    CONSTRAINT chk_mantenimiento_fechas CHECK (fecha_fin IS NULL OR fecha_fin >= fecha_inicio)
);

-- -----------------------------------------------------------------------------
-- 4. OPERACIÓN DE RUTAS, VIAJES Y ASIGNACIONES
-- -----------------------------------------------------------------------------

-- Ruta Definición
CREATE TABLE ruta_definicion (
    id_ruta_definicion UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_empresa UUID NOT NULL,
    codigo_ruta VARCHAR(30) NOT NULL,
    nombre_ruta VARCHAR(100) NOT NULL,
    origen_predeterminado VARCHAR(150) NOT NULL,
    destino_predeterminado VARCHAR(150) NOT NULL,
    distancia_estimada_km NUMERIC(8, 2),
    duracion_estimada_minutos INT,
    estado VARCHAR(20) NOT NULL DEFAULT 'ACTIVA',

    CONSTRAINT uk_ruta_definicion_empresa UNIQUE (id_empresa, id_ruta_definicion),
    CONSTRAINT uk_ruta_definicion_codigo UNIQUE (id_empresa, codigo_ruta),
    CONSTRAINT chk_ruta_estado CHECK (estado IN ('ACTIVA', 'INACTIVA'))
);

-- Viaje
CREATE TABLE viaje (
    id_viaje UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_empresa UUID NOT NULL,
    id_ruta_definicion UUID,
    codigo_viaje VARCHAR(30) NOT NULL,
    origen VARCHAR(150) NOT NULL,
    destino VARCHAR(150) NOT NULL,
    fecha_hora_salida_programada TIMESTAMPTZ NOT NULL,
    fecha_hora_llegada_programada TIMESTAMPTZ NOT NULL,
    fecha_hora_salida_real TIMESTAMPTZ,
    fecha_hora_llegada_real TIMESTAMPTZ,
    es_adhoc BOOLEAN NOT NULL DEFAULT FALSE,
    estado_viaje VARCHAR(20) NOT NULL DEFAULT 'PROGRAMADO',

    CONSTRAINT uk_viaje_empresa UNIQUE (id_empresa, id_viaje),
    CONSTRAINT uk_viaje_codigo UNIQUE (id_empresa, codigo_viaje),
    CONSTRAINT fk_viaje_ruta FOREIGN KEY (id_empresa, id_ruta_definicion)
        REFERENCES ruta_definicion (id_empresa, id_ruta_definicion) ON DELETE RESTRICT,
    CONSTRAINT chk_viaje_fechas_prog CHECK (fecha_hora_llegada_programada > fecha_hora_salida_programada),
    CONSTRAINT chk_viaje_fechas_real CHECK (fecha_hora_llegada_real IS NULL OR fecha_hora_salida_real IS NULL OR fecha_hora_llegada_real >= fecha_hora_salida_real),
    CONSTRAINT chk_viaje_estado CHECK (estado_viaje IN ('PROGRAMADO', 'EN_PROCESO', 'FINALIZADO', 'CANCELADO'))
);

COMMENT ON COLUMN viaje.es_adhoc IS 'Indica si el viaje es un servicio especial imprevisto (TRUE) o de ruta fija programada (FALSE)';

-- Asignación de Viaje (Con Exclusión GIST por Rango Temporal)
CREATE TABLE asignacion_viaje (
    id_asignacion_viaje UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_empresa UUID NOT NULL,
    id_viaje UUID NOT NULL,
    id_conductor UUID NOT NULL,
    id_vehiculo UUID NOT NULL,
    fecha_inicio TIMESTAMPTZ NOT NULL,
    fecha_fin TIMESTAMPTZ,
    rango_tiempo tstzrange GENERATED ALWAYS AS (
        tstzrange(fecha_inicio, COALESCE(fecha_fin, 'infinity'::timestamptz), '[)')
    ) STORED,
    estado_asignacion VARCHAR(20) NOT NULL DEFAULT 'PROGRAMADA',
    motivo_cambio TEXT,

    CONSTRAINT fk_asignacion_viaje_padre FOREIGN KEY (id_empresa, id_viaje)
        REFERENCES viaje (id_empresa, id_viaje) ON DELETE RESTRICT,
    CONSTRAINT fk_asignacion_conductor FOREIGN KEY (id_empresa, id_conductor)
        REFERENCES conductor (id_empresa, id_conductor) ON DELETE RESTRICT,
    CONSTRAINT fk_asignacion_vehiculo FOREIGN KEY (id_empresa, id_vehiculo)
        REFERENCES vehiculo (id_empresa, id_vehiculo) ON DELETE RESTRICT,
    CONSTRAINT chk_asignacion_fechas CHECK (fecha_fin IS NULL OR fecha_fin > fecha_inicio),
    CONSTRAINT chk_asignacion_estado CHECK (estado_asignacion IN ('PROGRAMADA', 'EN_PROCESO', 'COMPLETADA', 'REEMPLAZADA', 'CANCELADA')),

    CONSTRAINT ex_asignacion_conductor_solapamiento EXCLUDE USING GIST (
        id_conductor WITH =,
        rango_tiempo WITH &&
    ) WHERE (estado_asignacion IN ('PROGRAMADA', 'EN_PROCESO')),

    CONSTRAINT ex_asignacion_vehiculo_solapamiento EXCLUDE USING GIST (
        id_vehiculo WITH =,
        rango_tiempo WITH &&
    ) WHERE (estado_asignacion IN ('PROGRAMADA', 'EN_PROCESO'))
);

-- Novedad
CREATE TABLE novedad (
    id_novedad UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_empresa UUID NOT NULL,
    id_viaje UUID NOT NULL,
    id_usuario_reporta UUID NOT NULL,
    tipo_novedad VARCHAR(50) NOT NULL,
    descripcion TEXT NOT NULL,
    fecha_hora_novedad TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    nivel_prioridad VARCHAR(15) NOT NULL DEFAULT 'MEDIA',
    requiere_cambio_recurso BOOLEAN NOT NULL DEFAULT FALSE,

    CONSTRAINT fk_novedad_viaje FOREIGN KEY (id_empresa, id_viaje)
        REFERENCES viaje (id_empresa, id_viaje) ON DELETE RESTRICT,
    CONSTRAINT fk_novedad_usuario FOREIGN KEY (id_empresa, id_usuario_reporta)
        REFERENCES usuario (id_empresa, id_usuario) ON DELETE RESTRICT,
    CONSTRAINT chk_novedad_prioridad CHECK (nivel_prioridad IN ('BAJA', 'MEDIA', 'ALTA', 'CRITICA'))
);

-- -----------------------------------------------------------------------------
-- 5. TELEMETRÍA Y GPS (HOT & COLD STORAGE)
-- -----------------------------------------------------------------------------

-- Estado Viaje Tiempo Real (HOT STORAGE)
CREATE TABLE estado_viaje_tiempo_real (
    id_viaje UUID PRIMARY KEY,
    id_empresa UUID NOT NULL,
    ultima_latitud NUMERIC(10, 7) NOT NULL,
    ultima_longitud NUMERIC(10, 7) NOT NULL,
    velocidad_kmh NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
    rumbo_grados NUMERIC(5, 2),
    ultima_actualizacion_gps TIMESTAMPTZ NOT NULL,
    porcentaje_bateria_gps INT,

    CONSTRAINT fk_estado_tiempo_real_viaje FOREIGN KEY (id_empresa, id_viaje)
        REFERENCES viaje (id_empresa, id_viaje) ON DELETE CASCADE,
    CONSTRAINT chk_gps_latitud CHECK (ultima_latitud BETWEEN -90 AND 90),
    CONSTRAINT chk_gps_longitud CHECK (ultima_longitud BETWEEN -180 AND 180),
    CONSTRAINT chk_gps_velocidad CHECK (velocidad_kmh >= 0)
);

-- Historial Ubicación Viaje (COLD STORAGE - PARTICIONADO)
CREATE TABLE historial_ubicacion_viaje (
    id_historial_ubicacion UUID DEFAULT gen_random_uuid(),
    fecha_registro TIMESTAMPTZ NOT NULL,
    id_empresa UUID NOT NULL,
    id_viaje UUID NOT NULL,
    latitud NUMERIC(10, 7) NOT NULL,
    longitud NUMERIC(10, 7) NOT NULL,
    velocidad_kmh NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
    rumbo_grados NUMERIC(5, 2),

    CONSTRAINT pk_historial_ubicacion PRIMARY KEY (fecha_registro, id_historial_ubicacion),
    CONSTRAINT fk_historial_gps_viaje FOREIGN KEY (id_empresa, id_viaje)
        REFERENCES viaje (id_empresa, id_viaje) ON DELETE RESTRICT,
    CONSTRAINT chk_hist_latitud CHECK (latitud BETWEEN -90 AND 90),
    CONSTRAINT chk_hist_longitud CHECK (longitud BETWEEN -180 AND 180),
    CONSTRAINT chk_hist_velocidad CHECK (velocidad_kmh >= 0)
) PARTITION BY RANGE (fecha_registro);

-- Particiones de Ejemplo
CREATE TABLE historial_ubicacion_y2026m09 PARTITION OF historial_ubicacion_viaje
    FOR VALUES FROM ('2026-09-01 00:00:00+00') TO ('2026-10-01 00:00:00+00');

CREATE TABLE historial_ubicacion_y2026m10 PARTITION OF historial_ubicacion_viaje
    FOR VALUES FROM ('2026-10-01 00:00:00+00') TO ('2026-11-01 00:00:00+00');

-- -----------------------------------------------------------------------------
-- 6. SERVICIOS TRANSACCIONALES
-- -----------------------------------------------------------------------------

CREATE TABLE solicitud_recuperacion_clave (
    id_solicitud_recuperacion UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_usuario UUID NOT NULL,
    token_hash VARCHAR(255) NOT NULL,
    fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_expiracion TIMESTAMPTZ NOT NULL,
    fecha_uso TIMESTAMPTZ,
    ip_solicitante VARCHAR(45) NOT NULL,
    estado VARCHAR(20) NOT NULL DEFAULT 'PENDIENTE',

    CONSTRAINT fk_solicitud_usuario FOREIGN KEY (id_usuario)
        REFERENCES usuario (id_usuario) ON DELETE CASCADE,
    CONSTRAINT chk_recuperacion_fechas CHECK (fecha_expiracion > fecha_creacion),
    CONSTRAINT chk_recuperacion_estado CHECK (estado IN ('PENDIENTE', 'USADO', 'EXPIRADO', 'CANCELADO'))
);

CREATE TABLE notificacion_envio (
    id_notificacion_envio UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_empresa UUID NOT NULL,
    id_usuario_destinatario UUID,
    canal VARCHAR(20) NOT NULL DEFAULT 'EMAIL',
    tipo_evento VARCHAR(50) NOT NULL,
    correo_destino VARCHAR(150) NOT NULL,
    asunto VARCHAR(200) NOT NULL,
    resumen_cuerpo TEXT NOT NULL,
    estado_envio VARCHAR(20) NOT NULL DEFAULT 'PENDIENTE',
    intentos INT NOT NULL DEFAULT 0,
    fecha_ultimo_intento TIMESTAMPTZ,
    proximo_reintento TIMESTAMPTZ,
    mensaje_error TEXT,
    id_proveedor_externo VARCHAR(100),
    fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_notificacion_usuario FOREIGN KEY (id_usuario_destinatario)
        REFERENCES usuario (id_usuario) ON DELETE SET NULL,
    CONSTRAINT chk_notificacion_intentos CHECK (intentos >= 0),
    CONSTRAINT chk_notificacion_estado CHECK (estado_envio IN ('PENDIENTE', 'EN_PROCESO', 'ENVIADO', 'REINTENTAR', 'FALLIDO_DEFINITIVO'))
);

CREATE TABLE auditoria_bitacora (
    id_auditoria UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_empresa UUID,
    id_usuario UUID,
    snapshot_usuario_nombre VARCHAR(200) NOT NULL,
    snapshot_usuario_rol VARCHAR(50) NOT NULL,
    accion VARCHAR(50) NOT NULL,
    modulo VARCHAR(50) NOT NULL,
    tabla_afectada VARCHAR(50) NOT NULL,
    id_registro_afectado VARCHAR(50),
    direccion_ip VARCHAR(45) NOT NULL,
    fecha_hora TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    resultado VARCHAR(20) NOT NULL DEFAULT 'EXITO',
    datos_contexto_jsonb JSONB,

    CONSTRAINT fk_auditoria_usuario FOREIGN KEY (id_usuario)
        REFERENCES usuario (id_usuario) ON DELETE SET NULL,
    CONSTRAINT chk_auditoria_resultado CHECK (resultado IN ('EXITO', 'DENEGADO', 'ERROR'))
);

CREATE TABLE staging_errores_migracion (
    id_error_migracion UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tabla_origen VARCHAR(50) NOT NULL,
    id_registro_origen VARCHAR(50),
    tipo_error VARCHAR(50) NOT NULL,
    datos_registro_original JSONB NOT NULL,
    motivo_rechazo TEXT NOT NULL,
    fecha_registro TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------------------------------
-- 7. ÍNDICES DE RENDIMIENTO Y OPTIMIZACIÓN
-- -----------------------------------------------------------------------------
CREATE INDEX idx_usuario_empresa ON usuario (id_empresa);
CREATE INDEX idx_sesion_usuario ON sesion_usuario (id_usuario, estado_sesion);
CREATE INDEX idx_conductor_empresa_usuario ON conductor (id_empresa, id_usuario);
CREATE INDEX idx_vehiculo_empresa_estado ON vehiculo (id_empresa, estado_operativo);
CREATE INDEX idx_documento_vehiculo_vencimiento ON documento_vehiculo (id_empresa, fecha_vencimiento);
CREATE INDEX idx_mantenimiento_vehiculo ON mantenimiento (id_empresa, id_vehiculo, estado);
CREATE INDEX idx_viaje_empresa_fechas ON viaje (id_empresa, fecha_hora_salida_programada);
CREATE INDEX idx_viaje_estado ON viaje (id_empresa, estado_viaje);
CREATE INDEX idx_asignacion_viaje_busqueda ON asignacion_viaje (id_empresa, id_viaje, estado_asignacion);
CREATE INDEX idx_novedad_viaje ON novedad (id_empresa, id_viaje);
CREATE INDEX idx_asignacion_rango_tiempo ON asignacion_viaje USING GIST (rango_tiempo);
CREATE INDEX idx_historial_gps_viaje_fecha ON historial_ubicacion_viaje (id_viaje, fecha_registro);

CREATE INDEX idx_notificacion_pendientes ON notificacion_envio (proximo_reintento, fecha_creacion)
    WHERE estado_envio IN ('PENDIENTE', 'REINTENTAR');

CREATE INDEX idx_vehiculo_placa_trgm ON vehiculo USING GIN (placa gin_trgm_ops);
CREATE INDEX idx_usuario_nombre_trgm ON usuario USING GIN ((nombres || ' ' || apellidos) gin_trgm_ops);

-- -----------------------------------------------------------------------------
-- 8. FUNCIONES AUXILIARES DE SEGURIDAD PARA SUPABASE (JWT HELPER)
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION auth.get_user_empresa_id()
RETURNS UUID AS $$
    SELECT NULLIF(
        COALESCE(
            current_setting('request.jwt.claims', true)::jsonb ->> 'id_empresa',
            (current_setting('request.jwt.claims', true)::jsonb -> 'app_metadata' ->> 'id_empresa')
        ),
        ''
    )::UUID;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- -----------------------------------------------------------------------------
-- 9. POLÍTICAS DE SEGURIDAD POR FILA (ROW LEVEL SECURITY - RLS)
-- -----------------------------------------------------------------------------

ALTER TABLE usuario ENABLE ROW LEVEL SECURITY;
ALTER TABLE conductor ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehiculo ENABLE ROW LEVEL SECURITY;
ALTER TABLE documento_vehiculo ENABLE ROW LEVEL SECURITY;
ALTER TABLE mantenimiento ENABLE ROW LEVEL SECURITY;
ALTER TABLE ruta_definicion ENABLE ROW LEVEL SECURITY;
ALTER TABLE viaje ENABLE ROW LEVEL SECURITY;
ALTER TABLE asignacion_viaje ENABLE ROW LEVEL SECURITY;
ALTER TABLE novedad ENABLE ROW LEVEL SECURITY;
ALTER TABLE estado_viaje_tiempo_real ENABLE ROW LEVEL SECURITY;
ALTER TABLE historial_ubicacion_viaje ENABLE ROW LEVEL SECURITY;
ALTER TABLE notificacion_envio ENABLE ROW LEVEL SECURITY;
ALTER TABLE auditoria_bitacora ENABLE ROW LEVEL SECURITY;

CREATE POLICY rls_usuario_tenant ON usuario FOR ALL
    USING (id_empresa = auth.get_user_empresa_id()) WITH CHECK (id_empresa = auth.get_user_empresa_id());

CREATE POLICY rls_conductor_tenant ON conductor FOR ALL
    USING (id_empresa = auth.get_user_empresa_id()) WITH CHECK (id_empresa = auth.get_user_empresa_id());

CREATE POLICY rls_vehiculo_tenant ON vehiculo FOR ALL
    USING (id_empresa = auth.get_user_empresa_id()) WITH CHECK (id_empresa = auth.get_user_empresa_id());

CREATE POLICY rls_documento_vehiculo_tenant ON documento_vehiculo FOR ALL
    USING (id_empresa = auth.get_user_empresa_id()) WITH CHECK (id_empresa = auth.get_user_empresa_id());

CREATE POLICY rls_mantenimiento_tenant ON mantenimiento FOR ALL
    USING (id_empresa = auth.get_user_empresa_id()) WITH CHECK (id_empresa = auth.get_user_empresa_id());

CREATE POLICY rls_ruta_definicion_tenant ON ruta_definicion FOR ALL
    USING (id_empresa = auth.get_user_empresa_id()) WITH CHECK (id_empresa = auth.get_user_empresa_id());

CREATE POLICY rls_viaje_tenant ON viaje FOR ALL
    USING (id_empresa = auth.get_user_empresa_id()) WITH CHECK (id_empresa = auth.get_user_empresa_id());

CREATE POLICY rls_asignacion_viaje_tenant ON asignacion_viaje FOR ALL
    USING (id_empresa = auth.get_user_empresa_id()) WITH CHECK (id_empresa = auth.get_user_empresa_id());

CREATE POLICY rls_novedad_tenant ON novedad FOR ALL
    USING (id_empresa = auth.get_user_empresa_id()) WITH CHECK (id_empresa = auth.get_user_empresa_id());

CREATE POLICY rls_estado_viaje_tiempo_real_tenant ON estado_viaje_tiempo_real FOR ALL
    USING (id_empresa = auth.get_user_empresa_id()) WITH CHECK (id_empresa = auth.get_user_empresa_id());

CREATE POLICY rls_historial_ubicacion_viaje_tenant ON historial_ubicacion_viaje FOR ALL
    USING (id_empresa = auth.get_user_empresa_id()) WITH CHECK (id_empresa = auth.get_user_empresa_id());

CREATE POLICY rls_notificacion_envio_tenant ON notificacion_envio FOR ALL
    USING (id_empresa = auth.get_user_empresa_id()) WITH CHECK (id_empresa = auth.get_user_empresa_id());

CREATE POLICY rls_auditoria_bitacora_tenant ON auditoria_bitacora FOR SELECT
    USING (id_empresa = auth.get_user_empresa_id());

COMMIT;


NO RECOMENDABLE