import { createContext, useContext, useState, useEffect } from 'react';
import i18n from '../i18n/i18n.js';

const ThemeContext = createContext(undefined);

/**
 * ThemeProvider Component
 *
 * Responsabilidad:
 * Gestionar el estado global del tema (claro/oscuro), color de énfasis e idioma de toda la aplicación Vextor.
 *
 * Funcionalidades:
 * * Mantener el estado del tema actual ('light' o 'dark').
 * * Mantener el color de énfasis actual ('emerald', 'blue', 'purple', 'amber').
 * * Mantener el idioma actual de la interfaz ('es', 'en').
 * * Persistencia mediante localStorage unificado y claves individuales.
 * * Sincronización automática de clases en el elemento <html> y cambio dinámico en i18next.
 */
export const ThemeProvider = ({ children }) => {
  // 1. Detectar tema oscuro/claro inicial
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light' || savedTheme === 'dark') {
      return savedTheme;
    }
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    return systemPrefersDark ? 'dark' : 'light';
  });

  // Helper para recuperar las preferencias del usuario (color e idioma)
  const getInitialPreferences = () => {
    let themeColor = 'emerald';
    let language = 'es';

    try {
      const savedPrefs = localStorage.getItem('vextor_preferences');
      if (savedPrefs) {
        const parsed = JSON.parse(savedPrefs);
        if (parsed.themeColor) themeColor = parsed.themeColor;
        if (parsed.language) language = parsed.language;
      } else {
        // Buscar individualmente como fallback
        const savedColor = localStorage.getItem('themeColor');
        if (savedColor) themeColor = savedColor;
        const savedLang = localStorage.getItem('language');
        if (savedLang) language = savedLang;
      }
    } catch (e) {
      console.error('Error al parsear vextor_preferences', e);
    }

    return { themeColor, language };
  };

  const [themeColor, setThemeColor] = useState(() => getInitialPreferences().themeColor);
  const [language, setLanguage] = useState(() => getInitialPreferences().language);

  // Sincronizar el tema claro/oscuro
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Sincronizar el color de énfasis
  useEffect(() => {
    const root = window.document.documentElement;
    // Eliminar clases de tema existentes de forma segura
    root.className.split(' ').forEach((cls) => {
      if (cls.startsWith('theme-')) {
        root.classList.remove(cls);
      }
    });
    // Agregar la clase de color de énfasis
    root.classList.add(`theme-${themeColor}`);

    // Persistir color individualmente y en objeto unificado
    localStorage.setItem('themeColor', themeColor);
    try {
      const savedPrefs = localStorage.getItem('vextor_preferences');
      const parsed = savedPrefs ? JSON.parse(savedPrefs) : {};
      parsed.themeColor = themeColor;
      localStorage.setItem('vextor_preferences', JSON.stringify(parsed));
    } catch (e) {
      console.error('Error persistiendo tema color', e);
    }
  }, [themeColor]);

  // Sincronizar el idioma
  useEffect(() => {
    if (i18n.language !== language) {
      i18n.changeLanguage(language);
    }

    // Persistir idioma individualmente y en objeto unificado
    localStorage.setItem('language', language);
    try {
      const savedPrefs = localStorage.getItem('vextor_preferences');
      const parsed = savedPrefs ? JSON.parse(savedPrefs) : {};
      parsed.language = language;
      localStorage.setItem('vextor_preferences', JSON.stringify(parsed));
    } catch (e) {
      console.error('Error persistiendo idioma', e);
    }
  }, [language]);

  // Listener para el esquema de colores del sistema
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e) => {
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
    <ThemeContext.Provider value={{
      theme,
      setTheme,
      toggleTheme,
      themeColor,
      setThemeColor,
      language,
      setLanguage
    }}>
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
