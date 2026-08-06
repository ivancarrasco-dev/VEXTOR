import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import esTranslation from './es.json';
import enTranslation from './en.json';

// Detect initial language
const getInitialLanguage = () => {
  try {
    const prefs = localStorage.getItem('vextor_preferences');
    if (prefs) {
      const parsed = JSON.parse(prefs);
      if (parsed.language === 'es' || parsed.language === 'en') {
        return parsed.language;
      }
    }
  } catch (e) {
    console.error('Error parsing vextor_preferences for language', e);
  }

  const langKey = localStorage.getItem('language');
  if (langKey === 'es' || langKey === 'en') {
    return langKey;
  }

  // Fallback to Spanish as default
  return 'es';
};

const resources = {
  es: { translation: esTranslation },
  en: { translation: enTranslation }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: getInitialLanguage(),
    fallbackLng: 'es',
    interpolation: {
      escapeValue: false // react already safes from xss
    }
  });

export default i18n;
