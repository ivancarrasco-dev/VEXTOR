import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { motion } from 'framer-motion';

/**
 * ThemeToggle Component
 *
 * Responsabilidad:
 * Proporcionar un botón interactivo para alternar entre el modo claro y el modo oscuro.
 *
 * Funcionalidades:
 * * Icono de Sol / Luna con animación de entrada suave para una micro-interacción premium.
 * * Accesibilidad completa (aria-label y title descriptivos).
 * * Diseño moderno, consistente con los botones del Dashboard y de la Landing.
 */
export const ThemeToggle = ({ className }) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={`p-2.5 rounded-xl text-v-gray hover:text-v-white hover:bg-v-dark-border/50 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-300 relative flex items-center justify-center cursor-pointer ${className}`}
      title={theme === 'dark' ? '☀️ Cambiar a Modo Claro' : '🌙 Cambiar a Modo Oscuro'}
      aria-label="Alternar modo de tema"
    >
      <motion.div
        key={theme}
        initial={{ scale: 0.5, rotate: -90, opacity: 0 }}
        animate={{ scale: 1, rotate: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 12 }}
      >
        {theme === 'dark' ? (
          <Sun size={20} className="text-amber-400" />
        ) : (
          <Moon size={20} className="text-indigo-600" />
        )}
      </motion.div>
    </button>
  );
};

export default ThemeToggle;
