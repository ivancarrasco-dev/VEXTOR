import React from 'react';
import { Globe } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export const LanguageToggle = ({ className = '' }) => {
  const { language, setLanguage } = useTheme();

  const toggleLanguage = () => {
    setLanguage(language === 'es' ? 'en' : 'es');
  };

  return (
    <button
      onClick={toggleLanguage}
      className={`p-2.5 rounded-xl bg-v-dark/40 border border-v-dark-border/80 text-v-gray hover:text-v-white hover:bg-v-dark-border/50 transition-all cursor-pointer flex items-center gap-1.5 text-xs font-bold font-mono ${className}`}
      title={language === 'es' ? 'Switch to English' : 'Cambiar a Español'}
      aria-label="Toggle Language"
    >
      <Globe size={16} className="text-primary" />
      <span className="uppercase">{language}</span>
    </button>
  );
};
