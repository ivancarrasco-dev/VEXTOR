# Módulo de Vehículos (`src/pages/Vehicles/`)

## 1. Visión General
El módulo de Vehículos permite administrar el parque automotor de la flota. Soporta la creación, edición, filtrado en tiempo real, cambio de estado y eliminación controlada.

## 2. Archivos del Módulo

| Archivo | Tipo | Función | Utilizado por |
| :--- | :--- | :--- | :--- |
| `Vehicles.jsx` | Página | Interfaz principal con tabla de vehículos, modales de formulario y filtros. | `AppRouter.jsx` |
| `services/vehicleService.js` | Servicio | Cliente API para consumir endpoints `/api/vehicles`. | `Vehicles.jsx`, `Routes.jsx`, `Maintenance.jsx` |

## 3. Representación Visual (`¿Dónde se muestra?`)
- **Ruta:** `/vehiculos`
- **Ubicación en UI:** Menú lateral -> Opción "Vehículos"
- **Elementos Visibles:**
  - Encabezado con buscador rápido y botón "Nuevo Vehículo".
  - Tarjetas de resumen de flota (Disponibles, En Ruta, En Mantenimiento, Inactivos).
  - Tabla de vehículos con placa, marca, modelo, año, capacidad en kg y menú de acciones.

## 4. Flujo de Datos
```text
Componente (Vehicles.jsx)
        ↓
  vehicleService.js
        ↓
 HTTP GET/POST/PUT/DELETE
        ↓
 FastAPI (/api/vehicles)
        ↓
 PostgreSQL (tabla vehiculo)
```

## 5. ¿Cómo modificar este módulo?
- **Para cambiar campos de vehículo:** Modificar el formulario en `Vehicles.jsx` y actualizar la interfaz Pydantic en `vextor_be/schemas.py`.
- **Para cambiar reglas de borrado:** La lógica de interceptación de eliminación está en `vextor_be/router_vehicles.py`.
