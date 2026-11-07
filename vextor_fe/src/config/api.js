/**
 * Configuración centralizada de Endpoints y URLs de VEXTOR Frontend
 */

const getApiBaseUrl = () => {
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL.replace(/\/$/, '');
  }
  if (typeof window !== 'undefined' && window.location) {
    // Si estamos en un navegador en producción (ej. Nginx sirviendo en el puerto 80),
    // usar el mismo origen para permitir que el proxy inverso dirija /api/
    if (window.location.port === '' || window.location.port === '80' || window.location.port === '443') {
      return window.location.origin.replace(/\/$/, '');
    }
  }
  return 'http://localhost:8000';
};

const getWsBaseUrl = () => {
  if (import.meta.env.VITE_WS_BASE_URL) {
    return import.meta.env.VITE_WS_BASE_URL.replace(/\/$/, '');
  }
  if (typeof window !== 'undefined' && window.location) {
    if (window.location.port === '' || window.location.port === '80' || window.location.port === '443') {
      const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      return `${proto}//${window.location.host}`.replace(/\/$/, '');
    }
  }
  const apiBase = getApiBaseUrl();
  return apiBase.replace(/^http:/, 'ws:').replace(/^https:/, 'wss:');
};

export const API_BASE_URL = getApiBaseUrl();
export const WS_BASE_URL = getWsBaseUrl();
export const TOMTOM_API_KEY = (import.meta.env.VITE_TOMTOM_API_KEY || '').trim();
