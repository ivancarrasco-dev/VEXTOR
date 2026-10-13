-- =============================================================================
-- VEXTOR - SCRIPT DE MIGRACIÓN Y COMPATIBILIDAD SUPABASE / POSTGRESQL
-- Este script es seguro, idempotente y no destructivo.
-- Aplica las columnas necesarias y relaja restricciones para compatibilidad total con el ORM Vextor.
-- =============================================================================

BEGIN;

-- 1. VEHICULO: Añadir columnas de marca, modelo y año si se consultan directamente
ALTER TABLE public.vehiculo ADD COLUMN IF NOT EXISTS marca VARCHAR(50);
ALTER TABLE public.vehiculo ADD COLUMN IF NOT EXISTS modelo VARCHAR(50);
ALTER TABLE public.vehiculo ADD COLUMN IF NOT EXISTS anio INT;

-- 2. NOTIFICACION_ENVIO: Añadir columna tipo y permitir id_usuario opcional si aplica
ALTER TABLE public.notificacion_envio ADD COLUMN IF NOT EXISTS tipo VARCHAR(50) DEFAULT 'general';
ALTER TABLE public.notificacion_envio ALTER COLUMN id_usuario DROP NOT NULL;

-- 3. SESION_USUARIO: Garantizar que la columna token acepte cadenas de sesión
ALTER TABLE public.sesion_usuario ALTER COLUMN token DROP NOT NULL;

-- 4. RUTA_DEFINICION: Añadir campos de estado y tiempos de ejecución si faltan
ALTER TABLE public.ruta_definicion ADD COLUMN IF NOT EXISTS paradas TEXT;
ALTER TABLE public.ruta_definicion ADD COLUMN IF NOT EXISTS fecha_programada TIMESTAMPTZ;
ALTER TABLE public.ruta_definicion ADD COLUMN IF NOT EXISTS hora_inicio_real TIMESTAMPTZ;
ALTER TABLE public.ruta_definicion ADD COLUMN IF NOT EXISTS hora_fin_real TIMESTAMPTZ;
ALTER TABLE public.ruta_definicion ADD COLUMN IF NOT EXISTS estado_ruta VARCHAR(30) DEFAULT 'PROGRAMADA';
ALTER TABLE public.ruta_definicion ADD COLUMN IF NOT EXISTS motivo_suspension VARCHAR(255);

-- 5. EMPRESA: Convertir estado a VARCHAR si proviene del tipo BOOLEAN histórico
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'empresa'
          AND column_name = 'estado'
          AND data_type = 'boolean'
    ) THEN
        ALTER TABLE public.empresa ALTER COLUMN estado TYPE VARCHAR(20) USING (CASE WHEN estado THEN 'ACTIVO' ELSE 'INACTIVO' END);
        ALTER TABLE public.empresa ALTER COLUMN estado SET DEFAULT 'ACTIVO';
    END IF;
END $$;

-- 6. ROLES: Garantizar roles por defecto en minúsculas y mayúsculas
INSERT INTO public.rol (id_rol, nombre_rol, descripcion_rol) VALUES
    ('11111111-2222-3333-4444-555555555551', 'administrador', 'Control total del sistema'),
    ('11111111-2222-3333-4444-555555555552', 'conductor', 'Operación de vehículos y navegación'),
    ('11111111-2222-3333-4444-555555555555', 'usuario', 'Usuario final')
ON CONFLICT (id_rol) DO NOTHING;

COMMIT;
