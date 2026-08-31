# Arquitectura del Sistema VEXTOR

## 1. Visión General de la Arquitectura

VEXTOR está estructurado bajo una arquitectura de **Single Page Application (SPA) en el Frontend + REST API & WebSockets en el Backend + PostgreSQL en la Capa de Datos + Motor de Routing OSRM**.

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                            CAPA DE PRESENTACIÓN                             │
│                     React 19 + Vite + Tailwind CSS v4                       │
│      (Single Page Application consumiendo REST API & WebSockets)            │
└──────────────────────┬──────────────────────────────▲───────────────────────┘
                       │                              │
             HTTP REST │ JSON                     WS  │ GPS Real-time
            (/api/*)   │                          │   (/ws/tracking)
                       ▼                              │
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CAPA DE NEGOCIO                                │
│                          FastAPI + Python 3.12                              │
│  Routers ──► Pydantic Schemas ──► ORM (SQLAlchemy) ──► Services / WS Manager│
└───────────┬─────────────────────────────────────────▲───────────────────────┘
            │                                         │
HTTP Local  │ Routing Requests                        │ Connection Pool (psycopg)
(Port 5000) ▼                                         ▼
┌──────────────────────────┐             ┌────────────────────────────────────┐
│      MOTOR DE ROUTING    │             │        PERSISTENCIA DE DATOS       │
│     OSRM Docker Container│             │       PostgreSQL (Supabase)        │
│   (Grafo Vial Colombia)  │             │ (Usuarios, Vehículos, Rutas, etc.) │
└──────────────────────────┘             └────────────────────────────────────┘
```

---

## 2. Responsabilidad de Cada Componente

| Componente | Tecnología | Responsabilidad Principal |
| :--- | :--- | :--- |
| **Frontend UI** | React 19, Vite, Tailwind CSS v4 | Renderizado de la interfaz de usuario, gestión de estado de sesión (`AuthContext`), mapas interactivos (`MapComponent` con capas OSRM y TomTom Traffic), gráficos de dashboard y formularios responsive. |
| **Backend API** | FastAPI, Python 3.12, Uvicorn | Exposición de endpoints REST, validación de schemas con Pydantic, encriptación bcrypt, emisión y verificación de JWT, manejo de WebSockets para GPS y fachada/proxy seguro hacia OSRM. |
| **Base de Datos** | Supabase PostgreSQL | Persistencia relacional de datos de negocio: tablas de usuarios, roles, vehículos, conductores, asignación de rutas, mantenimientos, actividades de auditoría y registros de seguimiento GPS. |
| **Motor OSRM** | Docker Container (`osrm-backend`) | Servidor local dedicado al cálculo de rutas sobre el grafo vial de Colombia. Procesa algoritmos MLD para devolver distancias, tiempos e indicaciones giro a giro. |

---

## 3. Flujo Detallado de Solicitud de Ruta (Enrutamiento)

Cuando un usuario (Administrador o Conductor) selecciona o visualiza una ruta entre un Origen y un Destino, se ejecuta el siguiente flujo paso a paso:

```text
[1. Usuario] ──► Selecciona Origen/Destino en MapComponent (React)
                        │
                        ▼
[2. Frontend] ──► `routeService.calculateRoute({ origin, destination })`
                        │
                        ▼ (HTTP POST /api/routing/route)
[3. FastAPI]  ──► `router_routing.py` procesa la petición
                        │
                        ▼ (`OsrmClient().route(...)`)
[4. OSRM Local]─► Consulta grafo vial en `http://localhost:5000/route/v1/driving/...`
                        │
                        ▼ (Devuelve JSON con distancia, duración, geometría LineString)
[5. FastAPI]  ──► Formatea la respuesta mediante `RoutingRouteResponse` Pydantic Schema
                        │
                        ▼ (HTTP 200 OK con GeoJSON y pasos giro a giro)
[6. Frontend] ──► `MapComponent` recibe GeoJSON y dibuja la Polyline vial en el mapa
```

### Explicación técnica:
1. **Solicitud en Frontend:** El componente React (`MapComponent.jsx`) utiliza `routeService.calculateRoute()` para enviar las coordenadas geográficas de origen `[lat, lng]` y destino `[lat, lng]`.
2. **Proxy Backend:** La solicitud HTTP POST llega al router `/api/routing/route` de FastAPI. El navegador **nunca** se comunica directamente con OSRM ni conoce su dirección IP/puerto interno.
3. **Consulta OSRM:** FastAPI invoca la clase `OsrmClient` (`services/osrm_client.py`), la cual realiza una llamada HTTP interna hacia `OSRM_URL` (`http://localhost:5000/route/v1/driving/...`).
4. **Respuesta de OSRM:** OSRM calcula el camino óptimo sobre el grafo de carreteras de Colombia y retorna un JSON con distancia en metros, duración en segundos, maniobras giro a giro y las coordenadas en formato GeoJSON `LineString`.
5. **Normalización:** FastAPI valida los datos devueltos por OSRM, estructura las indicaciones giro a giro en español ("Gira a la derecha por la Carrera 7") y envía una respuesta estandarizada al cliente React.
6. **Renderizado:** El componente React recibe la geometría GeoJSON y renderiza una línea azul (`L.polyline`) sobre el mapa interactivo de Leaflet, ajustando los límites del mapa (`fitBounds`) para mostrar todo el recorrido.

---

## 4. Capa de Tráfico en Tiempo Real (TomTom Traffic)

Adicionalmente al cálculo de geometría OSRM, el cliente React en `MapComponent.jsx` consume directamente la API pública de **TomTom Traffic Raster Flow Tiles** para renderizar el estado del tráfico vehicular en tiempo real:

- **Protocolo & Formato:** Tile layer de Leaflet (`L.tileLayer`) mediante peticiones GET de mosaicos raster transparentes.
- **Configuración:** La clave de API se configura mediante la variable de entorno `VITE_TOMTOM_API_KEY`.
- **Modos de Visualización:** Se aplican automáticamente los estilos nítidos `relative0` (modo claro) y `relative0-dark` (modo oscuro) para mantener la definición sobre la jerarquía de vías sin generar efectos difuminados de mapa de calor.
- **Desacoplamiento:** El tráfico opera en una capa independiente de Leaflet con su propio control e indicador de estado, sin depender de OSRM ni intervenir en la base de datos PostgreSQL.

## 5. Flujo de Telemetría y Tracking GPS en Tiempo Real

Diferente al enrutamiento estático, el **tracking** es el proceso dinámico mediante el cual se monitorea la posición real de un vehículo en movimiento:

```text
[1. Conductor en Viaje] ──► Dispositivo móvil captura coordenadas GPS (HTML5 Geolocation)
                                     │
                                     ▼ (WebSocket /ws/tracking o POST /api/routes/{id}/location)
[2. Backend FastAPI]    ──► Valida la sesión y persiste la ubicación en `seguimiento_ruta`
                                     │
                                     ├──────────────────────────────┐
                                     ▼                              ▼
                        [3. PostgreSQL Supabase]       [4. Broadcast WebSocket]
                        Guarda punto en historial      Transmite a Admins conectados
                                                                    │
                                                                    ▼
                                                       [5. Panel Admin React]
                                                       Actualiza marcador de vehículo
                                                       rotando según ángulo de rumbo
```

---

## 6. Diferencia Clave entre Enrutamiento (Routing) y Seguimiento (Tracking)

| Aspecto | Enrutamiento (Routing) | Seguimiento (Tracking) |
| :--- | :--- | :--- |
| **Propósito** | Calcular la trayectoria vial planificada entre dos puntos fijos. | Monitorear la posición geográfica actual y velocidad del vehículo en tiempo real. |
| **Componente Principal** | Motor OSRM (`http://localhost:5000`) | Servidor WebSocket de FastAPI (`/ws/tracking`) |
| **Protocolo** | HTTP POST (`/api/routing/route`) | WebSockets o HTTP POST (`/api/routes/{id}/location`) |
| **Frecuencia** | Se ejecuta al planificar, consultar o modificar una ruta. | Transmisión continua a intervalos regulares (ej. cada 5-10 segundos). |
| **Persistencia** | Se almacena la ruta planificada en la tabla `ruta`. | Cada coordenada GPS se guarda en `seguimiento_ruta` e `historial_ubicacion`. |
| **Representación Visual** | Línea vial estática (`Polyline`) en el mapa. | Marcador dinámico del vehículo con rotación de rumbo y velocímetro. |
