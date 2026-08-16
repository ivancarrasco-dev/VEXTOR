# Flujos Principales del Sistema - VEXTOR

---

## 1. Flujo de Autenticación e Inicio de Sesión (Login)

```text
Usuario               Login.jsx             AuthContext          router_auth.py        PostgreSQL
  │                      │                      │                      │                   │
  ├── Credenciales ─────►│                      │                      │                   │
  │                      ├── login(email,pass) ─►                      │                   │
  │                      │                      ├── POST /api/auth/login ─────────────────►│ Validar
  │                      │                      │                      │                   │ Hash Bcrypt
  │                      │                      │                      ├── Crear Sesión ──►│ Insertar en
  │                      │                      │                      │   sesion_usuario  │ sesion_usuario
  │                      │                      │                      ├── Set-Cookie ────►│
  │                      │                      │◄── Token HttpOnly ───┤ (HttpOnly JWT)    │
  │                      │◄── Sesión Activa ────┤                      │                   │
  │                      │                      │                      │                   │
  └── Redirección ──────►│ /dashboard           │                      │                   │
```

1. **Usuario ingresa credenciales:** En `Login.jsx`, el usuario digita correo y contraseña.
2. **Llamada a AuthContext:** Se ejecuta `login()` que llama a `POST /api/auth/login`.
3. **Verificación Backend:** FastAPI recibe la petición en `router_auth.py`, valida las credenciales contra la BD PostgreSQL usando `bcrypt`.
4. **Registro de Sesión:** Se inserta un registro en la tabla `sesion_usuario` guardando IP y User-Agent.
5. **Emisión de JWT:** El backend emite un JWT firmado con el claim `sid` (ID de sesión) en una cookie `HttpOnly` segura de nombre `vextor_auth_token`.
6. **Redirección:** El cliente React recibe la respuesta exitosa y redirige al dashboard correspondiente según su rol.

---

## 2. Flujo de Creación y Asignación de Vehículos

```text
Administrador          Vehicles.jsx          vehicleService.js     router_vehicles.py    PostgreSQL
  │                      │                      │                      │                   │
  ├── Formulario ───────►│                      │                      │                   │
  │   Vehículo           ├── crearVehiculo() ──►│                      │                   │
  │                      │                      ├── POST /api/vehicles ───────────────────►│ Check Placa
  │                      │                      │                      ├── Insert ────────►│ Insertar en
  │                      │                      │                      │                   │ vehiculo
  │                      │                      │                      ├── Auditar ───────►│ Insertar en
  │                      │                      │                      │                   │ actividad
  │                      │◄── 201 Created ──────┴──────────────────────┤                   │
  └── UI Re-render ─────►│ Actualiza Tabla      │                      │                   │
```

---

## 3. Flujo Operativo de Rutas y GPS en Tiempo Real

```text
Administrador / Conductor           Frontend (MyRoutes / Routes)         Backend (FastAPI WS)        Database / Maps
         │                                    │                                 │                            │
         ├── Admin asigna Ruta ──────────────►│ POST /api/routes                │                            │
         │                                    ├─────────────────────────────────┼───────────────────────────►│ Guarda Ruta
         │                                    │                                 │                            │ (ESTADO: PROGRAMADA)
         ├── Conductor click "Iniciar Ruta" ──►│ POST /api/routes/{id}/start     │                            │
         │                                    ├─────────────────────────────────┼───────────────────────────►│ Estado RUTA = EN_RUTA
         │                                    │                                 │                            │ Estado Conductor = EN_RUTA
         ├── Streaming GPS (HTML5 Geolocation)│                                 │                            │
         │   `navigator.geolocation.watchPosition`                               │                            │
         │   │                                │                                 │                            │
         │   ├── Emit Position ──────────────►│ WS WebSocket `/ws/tracking`      │                            │
         │   │                                ├─────────────────────────────────┼───────────────────────────►│ Inserta en
         │   │                                │                                 │                            │ seguimiento_ruta
         │   │                                │                                 │                            │ y historial_ubicacion
         │   │                                ├── Broadcast a Admins ──────────►│                            │
         │   │                                │   (Conductores en Ruta)         │                            │
         │   │                                │   │                             │                            │
         │   │                                │   └── Update Marker en Mapa ───►│ Leaflet Map Re-render      │
         │   │                                │                                 │                            │
         └── Conductor click "Finalizar Ruta"─►│ POST /api/routes/{id}/complete  │                            │
                                              ├─────────────────────────────────┼───────────────────────────►│ Estado RUTA = COMPLETADA
                                              │                                 │                            │ Estado Conductor = DISPONIBLE
```

---

## 4. Flujo de Notificaciones

1. **Disparo de Evento Backend:** Al ejecutarse acciones críticas (ej: asignación de ruta, cambio de mantenimiento, creación de usuario), el router emite un registro en la tabla `notificacion`.
2. **Consulta Frontend:** El componente `NotificationButton.jsx` consulta `GET /api/notifications` al montar o al recibir acciones del usuario.
3. **Representación:** Muestra el badge flotante con la cantidad de notificaciones no leídas. Un portal de React despliega el panel emergente sin interferir con el layout visual.
