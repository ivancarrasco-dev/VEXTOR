import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext(undefined);

/**
 * ThemeProvider Component
 *
 * Responsabilidad:
 * Gestionar el estado global del tema (claro/oscuro) de toda la aplicación Vextor.
 *
 * Funcionalidades:
 * * Mantener el estado del tema actual ('light' o 'dark').
 * * Persistencia del tema mediante localStorage.
 * * Detección automática del tema preferido del sistema operativo (prefers-color-scheme) si no hay preferencia guardada.
 * * Sincronización automática de la clase 'dark' en el elemento <html> para soporte nativo en Tailwind CSS v4.
 */
export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    // 1. Intentar obtener el tema guardado en localStorage
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light' || savedTheme === 'dark') {
      return savedTheme;
    }

    // 2. Si no hay tema guardado, detectar la preferencia del sistema
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    return systemPrefersDark ? 'dark' : 'light';
  });

  // Efecto para sincronizar el tema con la clase del documento HTML y localStorage
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Listener para reaccionar a cambios en las preferencias de tema del sistema (si el usuario no tiene preferencia manual)
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e) => {
      // Solo aplicar la preferencia del sistema si el usuario no ha guardado una de forma manual
      if (!localStorage.getItem('theme')) {
        setTheme(e.matches ? 'dark' : 'light');
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === 'dark' ? 'light' : 'dark'));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

/**
 * useTheme Hook
 * Permite acceder al contexto del tema de forma sencilla.
 */
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme debe ser usado dentro de un ThemeProvider');
  }
  return context;
};
