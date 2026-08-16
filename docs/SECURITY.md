# Seguridad, Autenticación y Autorización - VEXTOR

---

## 1. Arquitectura de Seguridad

VEXTOR implementa un modelo de seguridad por capas que incluye **autenticación basada en cookies HttpOnly con JWT**, **control de acceso basado en roles (RBAC)**, **gestión y revocación activa de sesiones en PostgreSQL** y **encriptación de contraseñas con bcrypt**.

---

## 2. Autenticación JWT y Sesiones en BD

### 2.1 Almacenamiento y Transmisión del Token
- **Cookie Segura:** El token JWT no se almacena en `localStorage` ni `sessionStorage` para mitigar ataques XSS (Cross-Site Scripting). Se envía en una cookie `HttpOnly`, `SameSite=Lax` (o `Strict` en prod) con la clave `vextor_auth_token`.
- **Estructura del Payload JWT:**
  ```json
  {
    "sub": "user_uuid_12345",
    "email": "usuario@vextor.com",
    "role": "Administrador",
    "sid": "session_uuid_67890",
    "exp": 1740000000
  }
  ```

### 2.2 Validación de Sesión Dinámica (`sesion_usuario`)
Cada solicitud protegida pasa por el middleware `get_current_user` en `vextor_be/router_auth.py`:
1. Decodifica el JWT con la clave secreta `SECRET_KEY`.
2. Extrae el `sid` (ID de sesión).
3. Consulta la tabla `sesion_usuario` en PostgreSQL.
4. Si la sesión no existe o su `estado_sesion != 'ACTIVA'`, la petición es rechazada inmediatamente con `HTTP 401 Unauthorized`, revocando el acceso aunque el token JWT siga numéricamente vigente.

---

## 3. Control de Acceso Basado en Roles (RBAC)

Existen roles definidos en la tabla `rol` del sistema:

| Rol | UUID de Referencia | Descripción de Permisos |
| :--- | :--- | :--- |
| **Administrador** | `11111111-2222-3333-4444-555555555551` | Acceso total al sistema: CRUD de Usuarios, Vehículos, Conductores, Rutas, Mantenimientos, Reportes y Configuración Corporativa. |
| **Conductor** | `11111111-2222-3333-4444-555555555552` | Acceso exclusivo a sus rutas asignadas (`/driver/my-routes`), ejecución de rutas en tiempo real (`/driver/active-route/:id`), transmisión de coordenadas GPS y actualización del perfil propio. |
| **Mantenimiento** | `11111111-2222-3333-4444-555555555553` | Acceso a la sección de mantenimientos vehiculares y reportes técnicos. |
| **Auditor** | `11111111-2222-3333-4444-555555555554` | Acceso de solo lectura a la bitácora de actividad (`actividad`) y reportes consolidados. |

---

## 4. Validaciones Específicas para Colombia

Tanto en el Frontend como en el Backend, VEXTOR aplica expresiones regulares estrictas:

- **Placa Vehicular:** `^[a-zA-Z]{3}-?([0-9]{3}|[0-9]{2}[a-zA-Z])$` (Ejemplo: `ABC-123` o `ABC-12D`).
- **Número Celular:** `^(\+57|57)?3[0-9]{9}$` (10 dígitos iniciando por 3).
- **Cédula de Ciudadanía:** `^[0-9]{3,10}$` (3 a 10 dígitos numéricos).
- **Categoría Licencia de Conducir:** Normalizado a categorías colombianas: `A1`, `A2`, `B1`, `B2`, `B3`, `C1`, `C2`, `C3`.
