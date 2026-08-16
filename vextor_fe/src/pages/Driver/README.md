# Módulo Operativo del Conductor (`src/pages/Driver/`)

## 1. Visión General
Interfaz optimizada para dispositivos móviles y tablets utilizada por los conductores asignados. Permite visualizar rutas pendientes, iniciarlas, recibir indicaciones paso a paso en el mapa y transmitir coordenadas GPS automáticamente.

## 2. Archivos del Módulo

| Archivo | Tipo | Función | Utilizado por |
| :--- | :--- | :--- | :--- |
| `MyRoutes.jsx` | Página | Lista de rutas asignadas al conductor con estado y botón para iniciar viaje. | `AppRouter.jsx` |
| `ActiveRoutePage.jsx` | Página | Pantalla de navegación en ejecución con mapa Leaflet, instrucciones OSRM y emisor GPS. | `AppRouter.jsx` |

## 3. Representación Visual (`¿Dónde se muestra?`)
- **Ruta:** `/driver/my-routes` y `/driver/active-route/:idRuta`
- **Ubicación en UI:** Interfaz exclusiva para usuarios con rol `Conductor`.
- **Elementos Visibles:**
  - Tarjetas grandes touch-friendly con código de ruta, origen y destino.
  - Botón prominente "Iniciar Ruta" / "Finalizar Ruta".
  - Mapa de navegación con trazado de ruta OSRM y velocímetro GPS.
