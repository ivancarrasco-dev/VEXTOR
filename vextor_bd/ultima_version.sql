-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.rol (
  id_rol uuid NOT NULL DEFAULT gen_random_uuid(),
  nombre_rol character varying NOT NULL UNIQUE,
  descripcion_rol character varying,
  CONSTRAINT rol_pkey PRIMARY KEY (id_rol)
);
CREATE TABLE public.usuario (
  id_usuario uuid NOT NULL DEFAULT gen_random_uuid(),
  id_rol uuid NOT NULL,
  nombres_usuario character varying NOT NULL,
  apellidos_usuario character varying NOT NULL,
  correo_usuario character varying NOT NULL UNIQUE,
  contrasenia_usuario character varying NOT NULL,
  telefono_usuario character varying,
  estado_usuario character varying NOT NULL DEFAULT 'ACTIVO'::character varying CHECK (estado_usuario::text = ANY (ARRAY['ACTIVO'::text, 'INACTIVO'::text])),
  fecha_creacion timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  token_recuperacion character varying,
  foto_perfil text,
  requiere_cambio_clave boolean DEFAULT false,
  CONSTRAINT usuario_pkey PRIMARY KEY (id_usuario),
  CONSTRAINT fk_usuario_rol FOREIGN KEY (id_rol) REFERENCES public.rol(id_rol)
);
CREATE TABLE public.conductor (
  id_conductor uuid NOT NULL DEFAULT gen_random_uuid(),
  id_usuario uuid NOT NULL UNIQUE,
  nombre_conductor character varying NOT NULL,
  apellido_conductor character varying NOT NULL,
  cedula_conductor character varying NOT NULL UNIQUE,
  telefono_conductor character varying,
  licencia character varying NOT NULL,
  estado_conductor character varying NOT NULL DEFAULT 'ACTIVO'::character varying CHECK (estado_conductor::text = ANY (ARRAY['DISPONIBLE'::text, 'EN_RUTA'::text, 'NO_DISPONIBLE'::text, 'ACTIVO'::text, 'INACTIVO'::text, 'SUSPENDIDO'::text])),
  fecha_ingreso date NOT NULL,
  CONSTRAINT conductor_pkey PRIMARY KEY (id_conductor),
  CONSTRAINT fk_conductor_usuario FOREIGN KEY (id_usuario) REFERENCES public.usuario(id_usuario)
);
CREATE TABLE public.empresa (
  id_empresa uuid NOT NULL DEFAULT gen_random_uuid(),
  name character varying NOT NULL,
  nit character varying NOT NULL UNIQUE,
  address character varying,
  city character varying,
  email character varying,
  phone character varying,
  retention_days integer DEFAULT 30,
  estado boolean NOT NULL DEFAULT true,
  fecha_creacion timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT empresa_pkey PRIMARY KEY (id_empresa)
);
CREATE TABLE public.marca (
  id_marca uuid NOT NULL DEFAULT gen_random_uuid(),
  nombre_marca character varying NOT NULL UNIQUE,
  CONSTRAINT marca_pkey PRIMARY KEY (id_marca)
);
CREATE TABLE public.modelo (
  id_modelo uuid NOT NULL DEFAULT gen_random_uuid(),
  id_marca uuid NOT NULL,
  nombre_modelo character varying NOT NULL,
  capacidad_pasajeros integer,
  anio integer,
  CONSTRAINT modelo_pkey PRIMARY KEY (id_modelo),
  CONSTRAINT fk_modelo_marca FOREIGN KEY (id_marca) REFERENCES public.marca(id_marca)
);
CREATE TABLE public.vehiculo (
  id_vehiculo uuid NOT NULL DEFAULT gen_random_uuid(),
  id_modelo uuid,
  placa character varying NOT NULL UNIQUE,
  color character varying,
  tipo_vehiculo character varying NOT NULL,
  capacidad_pasajeros integer NOT NULL,
  kilometraje_actual integer NOT NULL DEFAULT 0,
  kilometraje_limite_mantenimiento integer NOT NULL,
  estado_vehiculo character varying NOT NULL DEFAULT 'DISPONIBLE'::character varying CHECK (estado_vehiculo::text = ANY (ARRAY['DISPONIBLE'::text, 'EN_RUTA'::text, 'MANTENIMIENTO'::text, 'INACTIVO'::text])),
  documentacion_vehiculo character varying,
  CONSTRAINT vehiculo_pkey PRIMARY KEY (id_vehiculo),
  CONSTRAINT fk_vehiculo_modelo FOREIGN KEY (id_modelo) REFERENCES public.modelo(id_modelo)
);
CREATE TABLE public.documento_vehiculo (
  id_documento uuid NOT NULL DEFAULT gen_random_uuid(),
  id_vehiculo uuid NOT NULL,
  tipo_documento character varying NOT NULL,
  numero_documento character varying NOT NULL,
  fecha_vencimiento date NOT NULL,
  CONSTRAINT documento_vehiculo_pkey PRIMARY KEY (id_documento),
  CONSTRAINT fk_doc_vehiculo FOREIGN KEY (id_vehiculo) REFERENCES public.vehiculo(id_vehiculo)
);
CREATE TABLE public.ruta_definicion (
  id_ruta uuid NOT NULL DEFAULT gen_random_uuid(),
  codigo_ruta character varying NOT NULL UNIQUE,
  nombre_ruta character varying NOT NULL,
  origen character varying NOT NULL,
  destino character varying NOT NULL,
  CONSTRAINT ruta_definicion_pkey PRIMARY KEY (id_ruta)
);
CREATE TABLE public.viaje (
  id_viaje uuid NOT NULL DEFAULT gen_random_uuid(),
  id_conductor uuid NOT NULL,
  id_vehiculo uuid NOT NULL,
  id_ruta uuid,
  estado_viaje character varying NOT NULL DEFAULT 'PROGRAMADO'::character varying CHECK (estado_viaje::text = ANY (ARRAY['PROGRAMADO'::text, 'EN_PROCESO'::text, 'FINALIZADO'::text, 'CANCELADO'::text])),
  fecha_hora_salida_programada timestamp without time zone NOT NULL,
  fecha_hora_llegada_programada timestamp without time zone NOT NULL,
  CONSTRAINT viaje_pkey PRIMARY KEY (id_viaje),
  CONSTRAINT fk_viaje_conductor FOREIGN KEY (id_conductor) REFERENCES public.conductor(id_conductor),
  CONSTRAINT fk_viaje_vehiculo FOREIGN KEY (id_vehiculo) REFERENCES public.vehiculo(id_vehiculo),
  CONSTRAINT fk_viaje_ruta FOREIGN KEY (id_ruta) REFERENCES public.ruta_definicion(id_ruta)
);
CREATE TABLE public.historial_ubicacion_viaje (
  id_historial uuid NOT NULL DEFAULT gen_random_uuid(),
  id_viaje uuid NOT NULL,
  latitud numeric NOT NULL,
  longitud numeric NOT NULL,
  velocidad numeric,
  fecha_hora timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT historial_ubicacion_viaje_pkey PRIMARY KEY (id_historial),
  CONSTRAINT fk_historial_viaje FOREIGN KEY (id_viaje) REFERENCES public.viaje(id_viaje)
);
CREATE TABLE public.novedad (
  id_novedad uuid NOT NULL DEFAULT gen_random_uuid(),
  id_conductor uuid NOT NULL,
  id_viaje uuid,
  id_vehiculo uuid,
  id_usuario uuid NOT NULL,
  tipo_novedad character varying NOT NULL,
  descripcion_novedad text NOT NULL,
  fecha_hora_reporte timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  evidencia_adjunta character varying,
  estado_novedad character varying NOT NULL DEFAULT 'PENDIENTE'::character varying CHECK (estado_novedad::text = ANY (ARRAY['PENDIENTE'::text, 'EN_REVISION'::text, 'RESUELTA'::text, 'RECHAZADA'::text])),
  CONSTRAINT novedad_pkey PRIMARY KEY (id_novedad),
  CONSTRAINT fk_novedad_conductor FOREIGN KEY (id_conductor) REFERENCES public.conductor(id_conductor),
  CONSTRAINT fk_novedad_viaje FOREIGN KEY (id_viaje) REFERENCES public.viaje(id_viaje),
  CONSTRAINT fk_novedad_vehiculo FOREIGN KEY (id_vehiculo) REFERENCES public.vehiculo(id_vehiculo),
  CONSTRAINT fk_novedad_usuario FOREIGN KEY (id_usuario) REFERENCES public.usuario(id_usuario)
);
CREATE TABLE public.mantenimiento (
  id_mantenimiento uuid NOT NULL DEFAULT gen_random_uuid(),
  id_vehiculo uuid NOT NULL,
  id_conductor uuid,
  id_novedad uuid,
  tipo_mantenimiento character varying NOT NULL,
  descripcion_mantenimiento text NOT NULL,
  fecha_mantenimiento date NOT NULL,
  costo_mantenimiento numeric NOT NULL DEFAULT 0,
  kilometraje_mantenimiento integer,
  estado_mantenimiento character varying NOT NULL DEFAULT 'PROGRAMADO'::character varying CHECK (estado_mantenimiento::text = ANY (ARRAY['PROGRAMADO'::text, 'EN_PROCESO'::text, 'COMPLETADA'::text, 'CANCELADO'::text])),
  CONSTRAINT mantenimiento_pkey PRIMARY KEY (id_mantenimiento),
  CONSTRAINT fk_mantenimiento_vehiculo FOREIGN KEY (id_vehiculo) REFERENCES public.vehiculo(id_vehiculo),
  CONSTRAINT fk_mantenimiento_conductor FOREIGN KEY (id_conductor) REFERENCES public.conductor(id_conductor),
  CONSTRAINT fk_mantenimiento_novedad FOREIGN KEY (id_novedad) REFERENCES public.novedad(id_novedad)
);
CREATE TABLE public.inspeccion_unidad (
  id_inspeccion uuid NOT NULL DEFAULT gen_random_uuid(),
  id_vehiculo uuid NOT NULL,
  id_usuario uuid NOT NULL,
  resultado character varying NOT NULL CHECK (resultado::text = ANY (ARRAY['APROBADO'::text, 'RECHAZADO'::text, 'CON_OBSERVACIONES'::text])),
  observaciones text,
  fecha_inspeccion timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT inspeccion_unidad_pkey PRIMARY KEY (id_inspeccion),
  CONSTRAINT fk_inspeccion_vehiculo FOREIGN KEY (id_vehiculo) REFERENCES public.vehiculo(id_vehiculo),
  CONSTRAINT fk_inspeccion_usuario FOREIGN KEY (id_usuario) REFERENCES public.usuario(id_usuario)
);
CREATE TABLE public.reporte (
  id_reporte uuid NOT NULL DEFAULT gen_random_uuid(),
  id_usuario uuid NOT NULL,
  tipo_reporte character varying NOT NULL,
  fecha_generacion timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  fecha_rango_inicio date NOT NULL,
  fecha_rango_fin date NOT NULL,
  formato_exportacion character varying NOT NULL DEFAULT 'PDF'::character varying CHECK (formato_exportacion::text = ANY (ARRAY['PDF'::text, 'EXCEL'::text, 'CSV'::text])),
  CONSTRAINT reporte_pkey PRIMARY KEY (id_reporte),
  CONSTRAINT fk_reporte_usuario FOREIGN KEY (id_usuario) REFERENCES public.usuario(id_usuario)
);
CREATE TABLE public.actividad (
  id_actividad uuid NOT NULL DEFAULT gen_random_uuid(),
  id_usuario uuid,
  nombres_usuario character varying,
  tipo_accion character varying NOT NULL,
  modulo character varying NOT NULL,
  descripcion text NOT NULL,
  fecha_hora timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  id_registro_afectado character varying,
  ip_origen character varying,
  resultado character varying DEFAULT 'EXITOSO'::character varying,
  CONSTRAINT actividad_pkey PRIMARY KEY (id_actividad),
  CONSTRAINT fk_actividad_usuario FOREIGN KEY (id_usuario) REFERENCES public.usuario(id_usuario)
);
CREATE TABLE public.notificacion_envio (
  id_notificacion uuid NOT NULL DEFAULT gen_random_uuid(),
  id_usuario uuid NOT NULL,
  id_viaje uuid,
  titulo character varying NOT NULL,
  descripcion text NOT NULL,
  estado_envio character varying NOT NULL DEFAULT 'PENDIENTE'::character varying CHECK (estado_envio::text = ANY (ARRAY['PENDIENTE'::text, 'ENVIADO'::text, 'FALLIDO'::text])),
  fecha_hora timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  leido boolean NOT NULL DEFAULT false,
  CONSTRAINT notificacion_envio_pkey PRIMARY KEY (id_notificacion),
  CONSTRAINT fk_notificacion_usuario FOREIGN KEY (id_usuario) REFERENCES public.usuario(id_usuario),
  CONSTRAINT fk_notificacion_viaje FOREIGN KEY (id_viaje) REFERENCES public.viaje(id_viaje)
);
CREATE TABLE public.sesion_usuario (
  id_sesion uuid NOT NULL DEFAULT gen_random_uuid(),
  id_usuario uuid NOT NULL,
  token character varying DEFAULT 'active_session_token'::character varying,
  ip_origen character varying,
  dispositivo character varying,
  user_agent text,
  fecha_inicio timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ultima_actividad timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  estado_sesion character varying NOT NULL DEFAULT 'ACTIVA'::character varying CHECK (estado_sesion::text = ANY (ARRAY['ACTIVA'::text, 'CERRADA'::text, 'REVOCADA'::text, 'EXPIRADA'::text])),
  CONSTRAINT sesion_usuario_pkey PRIMARY KEY (id_sesion),
  CONSTRAINT fk_sesion_usuario FOREIGN KEY (id_usuario) REFERENCES public.usuario(id_usuario)
);
CREATE TABLE public.ruta (
  id_ruta uuid NOT NULL,
  codigo_ruta character varying NOT NULL UNIQUE,
  nombre_ruta character varying NOT NULL,
  origen character varying NOT NULL,
  destino character varying NOT NULL,
  paradas text,
  fecha_programada timestamp without time zone NOT NULL,
  hora_inicio_real timestamp without time zone,
  hora_fin_real timestamp without time zone,
  estado_ruta character varying NOT NULL CHECK (estado_ruta::text = ANY (ARRAY['PROGRAMADA'::character varying, 'EN_PROCESO'::character varying, 'COMPLETADA'::character varying, 'SUSPENDIDA'::character varying, 'CANCELADA'::character varying]::text[])),
  motivo_suspension character varying,
  CONSTRAINT ruta_pkey PRIMARY KEY (id_ruta)
);
CREATE TABLE public.notificacion (
  id_notificacion uuid NOT NULL,
  id_usuario uuid,
  titulo character varying NOT NULL,
  descripcion text NOT NULL,
  fecha_hora timestamp without time zone NOT NULL DEFAULT now(),
  leido boolean NOT NULL,
  tipo character varying NOT NULL,
  CONSTRAINT notificacion_pkey PRIMARY KEY (id_notificacion),
  CONSTRAINT notificacion_id_usuario_fkey FOREIGN KEY (id_usuario) REFERENCES public.usuario(id_usuario)
);
CREATE TABLE public.asignacion_conductor (
  id_asignacion_conductor uuid NOT NULL,
  id_conductor uuid NOT NULL,
  id_ruta uuid NOT NULL,
  fecha_asignacion timestamp without time zone NOT NULL DEFAULT now(),
  estado_asignacion character varying NOT NULL CHECK (estado_asignacion::text = ANY (ARRAY['ACTIVA'::character varying, 'INACTIVA'::character varying, 'FINALIZADA'::character varying]::text[])),
  motivo_cambio character varying,
  CONSTRAINT asignacion_conductor_pkey PRIMARY KEY (id_asignacion_conductor),
  CONSTRAINT asignacion_conductor_id_conductor_fkey FOREIGN KEY (id_conductor) REFERENCES public.conductor(id_conductor),
  CONSTRAINT asignacion_conductor_id_ruta_fkey FOREIGN KEY (id_ruta) REFERENCES public.ruta(id_ruta)
);
CREATE TABLE public.asignacion_vehiculo (
  id_asignacion_vehiculo uuid NOT NULL,
  id_vehiculo uuid NOT NULL,
  id_ruta uuid NOT NULL,
  fecha_asignacion timestamp without time zone NOT NULL DEFAULT now(),
  estado_asignacion character varying NOT NULL CHECK (estado_asignacion::text = ANY (ARRAY['ACTIVA'::character varying, 'INACTIVA'::character varying, 'FINALIZADA'::character varying]::text[])),
  CONSTRAINT asignacion_vehiculo_pkey PRIMARY KEY (id_asignacion_vehiculo),
  CONSTRAINT asignacion_vehiculo_id_vehiculo_fkey FOREIGN KEY (id_vehiculo) REFERENCES public.vehiculo(id_vehiculo),
  CONSTRAINT asignacion_vehiculo_id_ruta_fkey FOREIGN KEY (id_ruta) REFERENCES public.ruta(id_ruta)
);
CREATE TABLE public.seguimiento_ruta (
  id_seguimiento uuid NOT NULL,
  id_ruta uuid NOT NULL UNIQUE,
  id_conductor uuid NOT NULL,
  id_vehiculo uuid NOT NULL,
  latitud numeric NOT NULL,
  longitud numeric NOT NULL,
  velocidad numeric,
  heading numeric,
  ultima_actualizacion timestamp without time zone NOT NULL DEFAULT now(),
  estado_seguimiento character varying NOT NULL CHECK (estado_seguimiento::text = ANY (ARRAY['ACTIVO'::character varying, 'FINALIZADO'::character varying]::text[])),
  CONSTRAINT seguimiento_ruta_pkey PRIMARY KEY (id_seguimiento),
  CONSTRAINT seguimiento_ruta_id_ruta_fkey FOREIGN KEY (id_ruta) REFERENCES public.ruta(id_ruta),
  CONSTRAINT seguimiento_ruta_id_conductor_fkey FOREIGN KEY (id_conductor) REFERENCES public.conductor(id_conductor),
  CONSTRAINT seguimiento_ruta_id_vehiculo_fkey FOREIGN KEY (id_vehiculo) REFERENCES public.vehiculo(id_vehiculo)
);
CREATE TABLE public.historial_ubicacion (
  id_historial uuid NOT NULL,
  id_seguimiento uuid NOT NULL,
  id_ruta uuid NOT NULL,
  latitud numeric NOT NULL,
  longitud numeric NOT NULL,
  velocidad numeric,
  fecha_hora timestamp without time zone NOT NULL DEFAULT now(),
  CONSTRAINT historial_ubicacion_pkey PRIMARY KEY (id_historial),
  CONSTRAINT historial_ubicacion_id_seguimiento_fkey FOREIGN KEY (id_seguimiento) REFERENCES public.seguimiento_ruta(id_seguimiento),
  CONSTRAINT historial_ubicacion_id_ruta_fkey FOREIGN KEY (id_ruta) REFERENCES public.ruta(id_ruta)
);