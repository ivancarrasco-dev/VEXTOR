# VEXTOR — Plan seguro de reparación de respaldos

## Alcance

Este trabajo se desarrolla en la rama `fix/backup-supabase-storage`. No modifica `main`, el esquema de PostgreSQL, los datos existentes ni la URL de conexión de la aplicación.

El almacenamiento objetivo es un bucket privado de Supabase Storage. Las operaciones de Storage se ejecutarán exclusivamente desde FastAPI; nunca desde React con una clave privilegiada.

## Fases y criterios de aceptación

### Fase 1 — Base segura y configuración
- Definir variables opcionales de Storage sin alterar `DATABASE_URL`.
- Comprobar que la aplicación sigue iniciando cuando la integración de respaldos no está configurada.
- Rechazar operaciones de respaldo con un mensaje claro si faltan credenciales, sin afectar el resto de VEXTOR.

### Fase 2 — Generación e historial
- Generar un dump PostgreSQL real mediante `pg_dump`.
- Subirlo a un bucket privado con nombre único y metadatos verificables.
- Listar únicamente objetos del bucket de respaldos.
- Permitir descargar a través del backend autenticado y autorizado.
- No devolver ni registrar claves, contraseñas o URLs de conexión.

### Fase 3 — Restauración protegida
- Aceptar archivos SQL subidos y respaldos guardados en Storage.
- Validar extensión, tamaño y contenido antes de iniciar.
- Crear y verificar una copia de seguridad previa en Storage antes de cualquier restauración.
- Ejecutar `psql` con parada ante el primer error y parámetros SSL compatibles con PostgreSQL/Supabase.
- No ejecutar restauraciones en el arranque ni durante pruebas automáticas.

### Fase 4 — Interfaz
- Eliminar datos ficticios del historial.
- Conectar crear, listar, descargar, subir y restaurar a endpoints reales.
- Mostrar estados y errores del servidor sin afirmar que una operación terminó cuando falló.

### Fase 5 — Pruebas y entrega
- Ejecutar pruebas automatizadas sin apuntar a la base de datos real.
- Verificar permisos de administrador y rechazos de archivos inválidos.
- Revisar el diff completo y abrir un Pull Request hacia `main`.
- La integración a `main` y cualquier restauración real requieren validación explícita.

## Configuración de despliegue

1. En Supabase Storage crea manualmente el bucket `vextor-backups` y déjalo como **Private**.
2. En los secretos del entorno del backend configura `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY`.
3. No pongas la clave privilegiada en variables `VITE_*`, en el frontend ni en Git.
4. Para activar respaldos diarios configura `BACKUP_AUTO_ENABLED=true`. Por defecto queda desactivado.
5. La programación usa la zona horaria `America/Bogota` y se ejecuta a las 04:00; puedes cambiar hora y zona horaria mediante las variables documentadas en `.env.example`.
6. El scheduler usa un advisory lock de PostgreSQL para evitar respaldos duplicados entre réplicas. No modifica tablas ni datos de negocio.
7. Si la URL normal de la aplicación usa el transaction pooler, configura `BACKUP_DATABASE_URL` con una URL de sesión/directa compatible con `pg_dump` y `psql`. Esto no cambia `DATABASE_URL` ni la conexión normal de VEXTOR.

Variables nuevas previstas para el backend:

- `SUPABASE_URL`: URL del proyecto Supabase.
- `SUPABASE_SERVICE_ROLE_KEY`: clave privilegiada, solo en secretos del servidor.
- `SUPABASE_BACKUP_BUCKET`: nombre del bucket privado (por defecto `vextor-backups`).
- `BACKUP_DATABASE_URL`: URL opcional de sesión/directa para `pg_dump` y `psql`; si queda vacía usa `DATABASE_URL`.
- `BACKUP_MAX_SIZE_BYTES` y `BACKUP_STORAGE_TIMEOUT_SECONDS`: límites de tamaño y tiempo de Storage.
- `BACKUP_AUTO_ENABLED`, `BACKUP_AUTO_HOUR`, `BACKUP_AUTO_MINUTE` y `BACKUP_AUTO_TIMEZONE`: programación diaria opcional.

El bucket debe permanecer privado. No configurar estas variables en `VITE_*` ni incluir sus valores en Git. La ausencia de estas variables deshabilita solo las operaciones de respaldo, no el resto de la API.

## Endpoints implementados

- `GET /api/backup/status`: estado de Storage y programación diaria (solo administrador).
- `GET /api/backup`: historial real del bucket privado.
- `POST /api/backup/create`: genera dump de `public` con `pg_dump` y lo almacena.
- `POST /api/backup/upload`: almacena un SQL manual sin ejecutarlo.
- `GET /api/backup/{filename}/download`: descarga autenticada.
- `POST /api/backup/restore`: restaura un archivo local o un nombre de respaldo de Storage. Para PostgreSQL exige snapshot previo verificado y ejecuta con `ON_ERROR_STOP` y transacción única.

Los dumps cubren el esquema de aplicación `public`; no sustituyen los respaldos administrados de Supabase para los esquemas internos `auth` y `storage`. No se realizan operaciones contra la base real desde las pruebas.

## Reglas de seguridad

- No cambiar `DATABASE_URL`, credenciales, tablas ni políticas de negocio.
- No borrar respaldos automáticamente.
- No sobrescribir objetos existentes.
- No restaurar sobre Supabase como parte de CI o pruebas.
- Mantener autorización exclusiva para administradores.
- Una restauración es una operación destructiva: exigir confirmación explícita en la interfaz y respaldo previo verificado.
