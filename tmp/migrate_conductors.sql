-- ============================================
-- MIGRACIÓN DE CONDUCTORES HUÉRFANOS - VEXTOR
-- ============================================

-- PASO 1: DIAGNOSTICAR (Solo lectura)
-- Ver usuarios con rol "rol-conductor" que NO tienen registro en conductor
SELECT 
  u.id_usuario,
  u.nombres_usuario,
  u.apellidos_usuario,
  u.correo_usuario,
  CASE WHEN c.id_conductor IS NULL THEN 'SIN REGISTRO' ELSE 'CON REGISTRO' END as estado
FROM usuario u
JOIN rol r ON u.id_rol = r.id_rol
LEFT JOIN conductor c ON u.id_usuario = c.id_usuario
WHERE r.nombre_rol = 'rol-conductor'
ORDER BY u.fecha_creacion DESC;

-- PASO 2: MIGRACIÓN (Insertar registros faltantes)
-- Obtener ID del rol "rol-conductor"
WITH conductor_role AS (
  SELECT id_rol FROM rol WHERE nombre_rol = 'rol-conductor' LIMIT 1
)
-- Insertar solo usuarios sin registro en conductor
INSERT INTO conductor (
  id_conductor,
  id_usuario,
  nombre_conductor,
  apellido_conductor,
  cedula_conductor,
  telefono_conductor,
  licencia,
  estado_conductor,
  fecha_ingreso
)
SELECT 
  gen_random_uuid(),
  u.id_usuario,
  u.nombres_usuario,
  u.apellidos_usuario,
  COALESCE(u.telefono_usuario, 'SIN_DOCUMENTO_' || EXTRACT(EPOCH FROM NOW())::text),
  u.telefono_usuario,
  'C2',
  'ACTIVO',
  DATE(u.fecha_creacion)
FROM usuario u
JOIN conductor_role cr ON true
WHERE 
  u.id_rol = cr.id_rol
  AND u.id_usuario NOT IN (
    SELECT id_usuario FROM conductor WHERE id_usuario IS NOT NULL
  )
ON CONFLICT (id_usuario) DO NOTHING;

-- PASO 3: VERIFICAR MIGRACIÓN
SELECT 
  COUNT(*) as total_usuarios_conductor,
  COUNT(CASE WHEN c.id_conductor IS NOT NULL THEN 1 END) as con_registro_conductor,
  COUNT(CASE WHEN c.id_conductor IS NULL THEN 1 END) as sin_registro_conductor
FROM usuario u
JOIN rol r ON u.id_rol = r.id_rol
LEFT JOIN conductor c ON u.id_usuario = c.id_usuario
WHERE r.nombre_rol = 'rol-conductor';

-- PASO 4: Ver conductores con cédula temporal
SELECT 
  c.id_conductor,
  u.nombres_usuario,
  u.apellidos_usuario,
  u.correo_usuario,
  c.cedula_conductor,
  c.licencia
FROM conductor c
JOIN usuario u ON c.id_usuario = u.id_usuario
WHERE c.cedula_conductor LIKE 'SIN_DOCUMENTO_%'
ORDER BY c.fecha_ingreso DESC;
