# Código Fuente Frontend - `src/`

Esta carpeta contiene la implementación completa de la interfaz de usuario de VEXTOR.

## Organización de Archivos y Responsabilidades

| Carpeta | Responsabilidad |
| :--- | :--- |
| `assets/` | Recursos estáticos como logotipos, isotipos e íconos. |
| `components/` | Componentes visuales reutilizables categorizados en `ui/` y `layout/`. |
| `context/` | Proveedores de contexto global (`AuthContext.jsx`, `ThemeContext.jsx`). |
| `hooks/` | Hooks personalizados (`useTheme.js`, etc.). |
| `i18n/` | Configuración de localización e idiomas. |
| `layouts/` | Estructura visual envolvente para rutas protegidas (`DashboardLayout.jsx`). |
| `pages/` | Módulos funcionales de la plataforma y vistas de usuario. |
| `routes/` | Enrutamiento principal (`AppRouter.jsx`) y control de acceso (`ProtectedRoute.jsx`). |
| `services/` | Servicios globales y clientes HTTP. |
| `styles/` | Hojas de estilo globales CSS. |
| `utils/` | Funciones utilitarias (`cn.js`, `sweetalert.js`). |

---

## Procedimiento para Agregar un Nuevo Módulo

1. **Crear carpeta del módulo:** En `src/pages/NuevoModulo/`.
2. **Definir el componente principal:** `NuevoModulo.jsx`.
3. **Crear componentes locales:** En `src/pages/NuevoModulo/components/`.
4. **Crear servicio de datos:** En `src/pages/NuevoModulo/services/nuevoModuloService.js`.
5. **Registrar la ruta:** En `src/routes/AppRouter.jsx`.
6. **Agregar enlace de navegación:** En `src/components/layout/Sidebar.jsx`.
7. **Documentar el módulo:** Crear un `README.md` explicativo dentro de `src/pages/NuevoModulo/`.
