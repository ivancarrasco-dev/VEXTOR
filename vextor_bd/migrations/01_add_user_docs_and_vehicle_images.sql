-- Migration: 01_add_user_docs_and_vehicle_images.sql
-- Description: Adds document columns to usuario table and creates imagen_vehiculo table

-- 1. Add cedula_usuario and tipo_documento columns to usuario table if they do not exist
ALTER TABLE public.usuario
  ADD COLUMN IF NOT EXISTS cedula_usuario character varying(50),
  ADD COLUMN IF NOT EXISTS tipo_documento character varying(50);

-- 2. Add UNIQUE constraint on cedula_usuario if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'usuario_cedula_usuario_key'
    ) THEN
        ALTER TABLE public.usuario ADD CONSTRAINT usuario_cedula_usuario_key UNIQUE (cedula_usuario);
    END IF;
END $$;

-- 3. Add CHECK constraint for allowed document types on usuario table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'chk_usuario_tipo_documento'
    ) THEN
        ALTER TABLE public.usuario ADD CONSTRAINT chk_usuario_tipo_documento
        CHECK (tipo_documento IS NULL OR tipo_documento IN ('CEDULA_CIUDADANIA', 'CEDULA_EXTRANJERIA', 'PASAPORTE', 'PERMISO_ESPECIAL_PERMANENCIA', 'NIT'));
    END IF;
END $$;

-- 4. Create imagen_vehiculo table for multi-image vehicle support
CREATE TABLE IF NOT EXISTS public.imagen_vehiculo (
  id_imagen uuid NOT NULL DEFAULT gen_random_uuid(),
  id_vehiculo uuid NOT NULL,
  url_imagen text NOT NULL,
  nombre_archivo character varying(255),
  es_principal boolean NOT NULL DEFAULT false,
  fecha_subida timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT imagen_vehiculo_pkey PRIMARY KEY (id_imagen),
  CONSTRAINT fk_imagen_vehiculo FOREIGN KEY (id_vehiculo) REFERENCES public.vehiculo(id_vehiculo) ON DELETE CASCADE
);
