# Vextor - Gestión Inteligente de Flotas

Vextor es una plataforma SaaS premium diseñada para modernizar la gestión operativa de empresas de transporte especial. Este proyecto reemplaza procesos manuales (papel, Excel, WhatsApp) con un sistema centralizado, seguro y eficiente.

## 🚀 Tecnologías Core
* **React 19:** Biblioteca base para la interfaz.
* **Tailwind CSS v4:** Motor de estilos de última generación para un diseño ultra-rápido y mantenible.
* **Framer Motion:** Animaciones suaves y microinteracciones de nivel premium.
* **Lucide React:** Set de iconos consistente y moderno.
* **React Router v7:** Gestión de navegación y protección de rutas.

## 🎨 Identidad Visual
Vextor utiliza una paleta de colores basada en **"Emerald & Slate"**:
* **Emerald-500:** Utilizado exclusivamente para acciones primarias, estados positivos e indicadores visuales.
* **Slate-900/800:** Tonos oscuros que transmiten confianza, estabilidad y profesionalismo empresarial.

## 📂 Arquitectura del Proyecto
El proyecto sigue una estructura modular y escalable:

* `src/assets/`: Recursos estáticos (Logos, imágenes).
* `src/components/`:
    * `ui/`: Componentes atómicos reutilizables (Botones, Inputs).
    * `layout/`: Estructura global (Sidebar, Navbar).
    * `dashboard/`: Componentes específicos del panel operativo.
* `src/pages/`: Contenedores de página organizados por módulo funcional.
* `src/layouts/`: Plantillas de estructura de alto nivel.
* `src/routes/`: Configuración centralizada de navegación.
* `src/utils/`: Funciones de ayuda y lógica compartida.
* `src/styles/`: Configuración global de estilos y temas.

## 🛠️ Ejecución y Desarrollo

### Instalación de dependencias
```bash
npm install
```

### Iniciar servidor de desarrollo
```bash
npm run dev
```

### Construcción para producción
```bash
npm run build
```

## 🔒 Próximos Pasos
1. Implementación de módulos de gestión individual (Vehículos, Conductores).
2. Integración de servicios de Backend / API.
3. Configuración de estados globales (Context API / Redux).
4. Implementación de notificaciones en tiempo real.

Prueba de mi fork