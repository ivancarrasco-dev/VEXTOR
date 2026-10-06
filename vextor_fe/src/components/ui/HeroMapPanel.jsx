import { motion } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext';

/**
 * HeroMapPanel Component
 *
 * Responsabilidad:
 * Renderizar la misma implementación visual del mapa del Hero para su uso en paneles laterales
 * como en Iniciar Sesión y Crear Cuenta.
 *
 * Características:
 * * Reutiliza las imágenes existentes en `/HeroMap/bogot_ciudad_dark.png` y `/HeroMap/bogot_ciudad_light.png`.
 * * Conmuta automáticamente según el modo claro/oscuro del `ThemeContext`.
 * * Aplica exactamente los mismos overlays de gradiente, SVG con líneas/puntos animados, escala, opacidad y transiciones.
 */
export const HeroMapPanel = ({ className = '' }) => {
  const { theme } = useTheme();

  const mapBgImage = theme === 'dark'
    ? '/HeroMap/bogot_ciudad_dark.png'
    : '/HeroMap/bogot_ciudad_light.png';

  return (
    <div className={`relative w-full h-full overflow-hidden bg-v-dark select-none pointer-events-none ${className}`}>
      {/* IMAGEN DEL MAPA */}
      <img
        src={mapBgImage}
        alt="Mapa urbano VEXTOR"
        className="w-full h-full object-cover object-center transition-opacity duration-700 opacity-80 dark:opacity-80"
      />

      {/* OVERLAYS DE GRADIENTES PARA DEGRADADO Y LEGIBILIDAD (Adaptado para panel derecho en split view) */}
      <div className="absolute inset-0 bg-gradient-to-r from-v-dark via-v-dark/80 to-transparent dark:from-v-dark dark:via-v-dark/60 dark:to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-b from-v-dark/60 via-transparent to-v-dark/80" />

      {/* PUNTOS Y LÍNEAS SUTILES DE CONEXIÓN INSPIRADOS EN EL ISOTIPO DE VEXTOR */}
      <div className="absolute inset-0 overflow-hidden opacity-35 dark:opacity-45">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="vextor-map-panel-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#124A2F" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#A6C98F" stopOpacity="0.25" />
            </linearGradient>
          </defs>
          <path d="M 50 150 Q 280 260 450 180 T 800 360" fill="none" stroke="url(#vextor-map-panel-grad)" strokeWidth="2" strokeDasharray="6 6" />
          <circle cx="280" cy="260" r="4" fill="#124A2F" className="animate-ping" />
          <circle cx="280" cy="260" r="4" fill="#A6C98F" />
          <circle cx="450" cy="180" r="4.5" fill="#124A2F" />
        </svg>
      </div>
    </div>
  );
};

export default HeroMapPanel;
