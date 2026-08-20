/**
 * Configuración centralizada de Endpoints y URLs de VEXTOR Frontend
 */

const getApiBaseUrl = () => {
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL.replace(/\/$/, '');
  }
  return 'http://localhost:8000';
};

const getWsBaseUrl = () => {
  if (import.meta.env.VITE_WS_BASE_URL) {
    return import.meta.env.VITE_WS_BASE_URL.replace(/\/$/, '');
  }
  const apiBase = getApiBaseUrl();
  return apiBase.replace(/^http:/, 'ws:').replace(/^https:/, 'wss:');
};

export const API_BASE_URL = getApiBaseUrl();
export const WS_BASE_URL = getWsBaseUrl();
