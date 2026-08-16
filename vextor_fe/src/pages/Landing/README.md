# Página Comercial de Presentación (`src/pages/Landing/`)

## 1. Visión General
Página pública de aterrizaje comercial que presenta las características principales de VEXTOR, propuesta de valor, llamado a la acción y accesos rápidos a inicio de sesión y registro.

## 2. Archivos del Módulo

| Archivo | Tipo | Función | Utilizado por |
| :--- | :--- | :--- | :--- |
| `Landing.jsx` | Página | Estructura contenedora de la landing page. | `AppRouter.jsx` |
| `components/LandingNavbar.jsx` | Componente | Barra de navegación superior con logo y accesos a Login/Registro. | `Landing.jsx` |
| `components/HeroSection.jsx` | Componente | Sección principal con titular de impacto y demo de la app. | `Landing.jsx` |
| `components/ProblemSection.jsx` | Componente | Presentación de problemas comunes de flota y soluciones VEXTOR. | `Landing.jsx` |
| `components/FeaturesSection.jsx` | Componente | Grilla de características clave (Rastreo GPS, Mantenimiento, Reportes). | `Landing.jsx` |
| `components/CTASection.jsx` | Componente | Banner con llamado a la acción para prueba gratuita. | `Landing.jsx` |
| `components/LandingFooter.jsx` | Componente | Pie de página institucional y enlaces de contacto. | `Landing.jsx` |

## 3. Representación Visual (`¿Dónde se muestra?`)
- **Ruta:** `/`
- **Ubicación en UI:** Vista pública inicial al navegar sin sesión iniciada.
