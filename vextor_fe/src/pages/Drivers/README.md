# Módulo de Conductores (`src/pages/Drivers/`)

## 1. Visión General
Gestión del personal de conducción de la flota. Permite registrar datos personales, cédulas colombianas, licencias con su correspondiente categoría (A1, A2, B1, B2, B3, C1, C2, C3) y controlar su estado de disponibilidad operativo.

## 2. Archivos del Módulo

| Archivo | Tipo | Función | Utilizado por |
| :--- | :--- | :--- | :--- |
| `Drivers.jsx` | Página | Tabla de conductores, filtros por estado y formulario modal de creación/edición. | `AppRouter.jsx` |
| `services/driverService.js` | Servicio | Cliente HTTP que conecta con `/api/drivers`. | `Drivers.jsx`, `Routes.jsx` |

## 3. Representación Visual (`¿Dónde se muestra?`)
- **Ruta:** `/conductores`
- **Ubicación en UI:** Menú lateral -> Opción "Conductores"
- **Elementos Visibles:**
  - Métricas de estado (Disponibles, En Ruta, Inactivos).
  - Tabla interactiva con cédula, teléfono, categoría de licencia, vencimiento y badge de estado.

## 4. Validaciones Aplicadas
- **Cédula:** `^[0-9]{3,10}$` (3 a 10 dígitos numéricos).
- **Celular:** `^(\+57|57)?3[0-9]{9}$` (Formato móvil colombiano).
