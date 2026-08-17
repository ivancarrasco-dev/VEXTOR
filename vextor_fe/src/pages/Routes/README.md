# Módulo de Rutas (`src/pages/Routes/`)

## 1. Visión General
Módulo avanzado para la programación de rutas logísticas y monitoreo geográfico en tiempo real de vehículos en circulación.

## 2. Archivos del Módulo

| Archivo | Tipo | Función | Utilizado por |
| :--- | :--- | :--- | :--- |
| `Routes.jsx` | Página | Vista principal de gestión de rutas y mapa en vivo para administradores. | `AppRouter.jsx` |
| `components/MapComponent.jsx` | Componente | Mapa Leaflet interactivo que cambia automáticamente a modo oscuro y dibuja la geometría entregada por FastAPI. | `Routes.jsx`, `ActiveRoutePage.jsx` |
| `components/NominatimAutocomplete.jsx` | Componente | Input con autocompletado de geocodificación mediante OpenStreetMap Nominatim. | `Routes.jsx` |
| `services/routeService.js` | Servicio | Peticiones HTTP a `/api/routes` y a `/api/routing/route`; el navegador no accede a OSRM directamente. | `Routes.jsx`, `MapComponent.jsx` |

## 3. Representación Visual (`¿Dónde se muestra?`)
- **Ruta:** `/rutas`
- **Ubicación en UI:** Menú lateral -> Opción "Rutas"
- **Elementos Visibles:**
  - Selector superior de vista: "Programación de Rutas" o "Conductores en Ruta (GPS Real-Time)".
  - Mapa interactivo Leaflet centrado en Colombia con marcadores personalizados de origen/destino y vehículos en movimiento.
  - Tabla de asignación de rutas con filtros de estado.

## 4. Integración con WebSockets y GPS
El componente `Routes.jsx` se conecta al WebSocket `ws://.../ws/tracking` cuando está abierta la pestaña de rastreo. Al recibir paquetes de telemetría de un conductor, actualiza en tiempo real el marcador en el mapa y la métrica de velocidad.
