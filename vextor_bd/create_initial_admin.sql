-- =============================================================================
-- VEXTOR - SCRIPT DE CREACIÓN DEL ADMINISTRADOR INICIAL
-- =============================================================================
-- Credenciales:
--   Correo: JAdmin@gmail.com
--   Contraseña temporal: JAdmin2026!
--   Algoritmo: bcrypt (Salting con factor de coste 12)
--   Hash almacenado: $2b$12$DQmqm5Ok.0CXMzP1ff4c4ujVXC17.KQ9w7Y93H7cdUEvbM1/xDsbq
--   Exigir cambio de clave: Sí, recomendado en el primer inicio de sesión.
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
INSERT INTO USUARIO (
    id_usuario,
    id_rol,
    nombres_usuario,
    apellidos_usuario,
    correo_usuario,
    contrasenia_usuario,
    telefono_usuario,
    estado_usuario,
    fecha_creacion
)
VALUES (
    gen_random_uuid(),
    '11111111-2222-3333-4444-555555555551',
    'Jules',
    'Admin',
    'JAdmin@gmail.com',
    '$2b$12$DQmqm5Ok.0CXMzP1ff4c4ujVXC17.KQ9w7Y93H7cdUEvbM1/xDsbq',
    '+573000000000',
    'ACTIVO',
    CURRENT_TIMESTAMP
)
ON CONFLICT (correo_usuario) DO UPDATE
SET
    id_rol = '11111111-2222-3333-4444-555555555551',
    nombres_usuario = EXCLUDED.nombres_usuario,
    apellidos_usuario = EXCLUDED.apellidos_usuario,
    contrasenia_usuario = '$2b$12$DQmqm5Ok.0CXMzP1ff4c4ujVXC17.KQ9w7Y93H7cdUEvbM1/xDsbq',
    estado_usuario = 'ACTIVO';
