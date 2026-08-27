-- =============================================================================
-- VEXTOR - SCRIPT DE CREACIÓN DEL ADMINISTRADOR INICIAL
-- =============================================================================
-- Credenciales:
--   Correo: JAdmin@gmail.com
--   Contraseña temporal: JAdmin2026!
--   Algoritmo: bcrypt (Salting con factor de coste 12)
--   Hash almacenado: $2b$12$MgZNhC/kOXWIiax9vBxHzurU1ZVyfVdo9bmc7zQ7DeeUdbokFI7w6
--   Exigir cambio de clave: Sí (requiere_cambio_clave = TRUE en primera inserción).
-- =============================================================================

-- 1. Asegurar la existencia de los roles básicos en la tabla ROL
INSERT INTO ROL (id_rol, nombre_rol, descripcion_rol)
VALUES
    ('11111111-2222-3333-4444-555555555551', 'Administrador', 'Administrador del sistema con control total de la flota y usuarios'),
    ('11111111-2222-3333-4444-555555555552', 'Conductor', 'Conductor asignado a vehículos y rutas operativas'),
    ('11111111-2222-3333-4444-555555555555', 'Usuario', 'Usuario registrado normal con permisos básicos')
ON CONFLICT (nombre_rol) DO UPDATE
SET id_rol = EXCLUDED.id_rol, descripcion_rol = EXCLUDED.descripcion_rol;

-- 2. Insertar o actualizar el usuario Administrador Inicial JAdmin@gmail.com
-- NOTA DE SEGURIDAD: ON CONFLICT NO actualiza contrasenia_usuario ni requiere_cambio_clave
-- para evitar sobrescribir una contraseña que el administrador ya haya modificado.
INSERT INTO USUARIO (
    id_usuario,
    id_rol,
    nombres_usuario,
    apellidos_usuario,
    correo_usuario,
    contrasenia_usuario,
    telefono_usuario,
    estado_usuario,
    requiere_cambio_clave,
    fecha_creacion
)
VALUES (
    gen_random_uuid(),
    '11111111-2222-3333-4444-555555555551',
    'Administrador',
    'VEXTOR',
    'JAdmin@gmail.com',
    '$2b$12$MgZNhC/kOXWIiax9vBxHzurU1ZVyfVdo9bmc7zQ7DeeUdbokFI7w6',
    '+573000000000',
    'ACTIVO',
    TRUE,
    CURRENT_TIMESTAMP
)
ON CONFLICT (correo_usuario) DO UPDATE
SET
    id_rol = '11111111-2222-3333-4444-555555555551',
    nombres_usuario = EXCLUDED.nombres_usuario,
    apellidos_usuario = EXCLUDED.apellidos_usuario,
    estado_usuario = 'ACTIVO';
