# Módulo de Rutas (`src/pages/Routes/`)

## 1. Visión General
Módulo avanzado para la programación de rutas logísticas y monitoreo geográfico en tiempo real de vehículos en circulación.

## 2. Archivos del Módulo

| Archivo | Tipo | Función | Utilizado por |
| :--- | :--- | :--- | :--- |
| `Routes.jsx` | Página | Vista principal de gestión de rutas y mapa en vivo para administradores. | `AppRouter.jsx` |
| `components/MapComponent.jsx` | Componente | Mapa Leaflet interactivo que cambia automáticamente a modo oscuro, dibuja la geometría OSRM y superpone opcionalmente la capa de tráfico en tiempo real de TomTom. | `Routes.jsx`, `ActiveRoutePage.jsx` |
| `components/NominatimAutocomplete.jsx` | Componente | Input con autocompletado de geocodificación mediante OpenStreetMap Nominatim. | `Routes.jsx` |
| `services/routeService.js` | Servicio | Peticiones HTTP a `/api/routes` y a `/api/routing/route`; el navegador no accede a OSRM directamente. | `Routes.jsx`, `MapComponent.jsx` |

## 3. Representación Visual
- **Ruta SPA:** `/routes`
- **Ubicación en UI:** Menú lateral ➔ Opción "Rutas"
- **Acceso:** Exclusivo Administrador (Monitoreo e inicio)
- **Elementos Visibles:**
  - Selector superior de vista: "Programación de Rutas" o "Conductores en Ruta (GPS Real-Time)".
  - Mapa interactivo Leaflet centrado en Colombia con marcadores personalizados de origen/destino y vehículos en movimiento.
  - Tabla de asignación de rutas con filtros de estado.

## 4. Integración con TomTom Traffic Flow
- **Propósito:** Mostrar flujo de tráfico en vivo (fluido, moderado, congestionado) mediante raster tiles de TomTom.
- **Configuración:** Requiere `VITE_TOMTOM_API_KEY` en el archivo `.env`.
- **Control e Independencia:** Funciona como una capa independiente que puede activarse/desactivarse en la UI sin afectar el cálculo de rutas de OSRM ni los marcadores GPS.
