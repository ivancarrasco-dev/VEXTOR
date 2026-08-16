# Componentes Visuales Reutilizables (`src/components/`)

Esta carpeta agrupa los componentes de interfaz de usuario desacoplados y reutilizables en toda la aplicación.

## 1. Subdirectorios

- `components/ui/`: Atómicos de formulario y marca (`Button.jsx`, `Input.jsx`, `Select.jsx`, `Checkbox.jsx`, `Logo.jsx`, `ThemeToggle.jsx`).
- `components/layout/`: Elementos del envoltorio estructural (`Sidebar.jsx`, `Navbar.jsx`, `NavbarSearch.jsx`, `UserMenu.jsx`, `NotificationButton.jsx`).

---

## 2. Inventario de Componentes UI (`src/components/ui/`)

### `Select.jsx`
- **Propósito:** Reemplaza los `<select>` nativos por un selector customizado de alta accesibilidad con animaciones Tailwind CSS v4.
- **Props:** `label`, `value`, `onChange`, `options`, `error`, `placeholder`, `disabled`.
- **Utilizado por:** `Vehicles.jsx`, `Drivers.jsx`, `Routes.jsx`, `Maintenance.jsx`.
- **Representación Visual:**
  ```text
  ┌───────────────────────────────┐
  │ Selección de Estado         ▼ │
  └───────────────────────────────┘
  ```

### `Button.jsx`
- **Propósito:** Botón con variantes visuales (`primary`, `secondary`, `outline`, `danger`) y estados de carga (`loading`).
- **Props:** `variant`, `size`, `children`, `disabled`, `onClick`, `type`.
- **Utilizado por:** Todos los módulos.

### `Logo.jsx`
- **Propósito:** Isotipo y marca VEXTOR que adapta automáticamente el color del logo (blanco/negro) según el tema activo (`ThemeContext`).
- **Props:** `variant` (`full`, `icon`), `className`.

### `Input.jsx`
- **Propósito:** Campo de texto estilizado con soporte para íconos, validación de error y etiquetas.

---

## 3. Inventario de Componentes Layout (`src/components/layout/`)

### `Sidebar.jsx`
- **Propósito:** Menú de navegación lateral con colapso animado mediante Framer Motion (260px expandido / 80px colapsado) y responsive móvil.
- **Representación Visual:**
  ```text
  ┌────────────────┐
  │ [Logo VEXTOR]  │
  ├────────────────┤
  │ 📊 Dashboard   │
  │ 🚛 Vehículos   │
  │ 👨‍✈️ Conductores │
  │ 🗺️ Rutas       │
  │ 🔧 Mantenim.   │
  │ 📈 Reportes    │
  │ ⚙️ Config.     │
  └────────────────┘
  ```

### `NavbarSearch.jsx`
- **Propósito:** Barra de búsqueda global que realiza consultas en tiempo real sobre vehículos, conductores y rutas desde el encabezado principal.

### `NotificationButton.jsx`
- **Propósito:** Botón de campana con contador de alertas no leídas y panel desplegable mediante `React.createPortal` conectado a la BD PostgreSQL via `/api/notifications`.
