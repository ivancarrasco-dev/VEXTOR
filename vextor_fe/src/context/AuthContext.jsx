import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';

const AuthContext = createContext(undefined);

// Axios Global Configuration
axios.defaults.withCredentials = true; // Support HTTP-only cookies

/**
 * AuthProvider Component
 *
 * Responsabilidad:
 * Gestionar el estado global de autenticación de la plataforma Vextor.
 *
 * Funcionalidades:
 * * Mantener el estado del usuario actual y su estado de autenticación.
 * * Proveer métodos para iniciar sesión, cerrar sesión y registrarse.
 * * Persistencia de sesión mediante cookie/JWT o consulta directa de /api/auth/me.
 * * Manejo de estados de carga durante la verificación de sesión.
 */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Verificación real de sesión al cargar mediante endpoint /me
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Fallback or explicit authorization header if token is stored in localStorage
        const storedToken = localStorage.getItem('vextor_auth_token');
        if (storedToken) {
          axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
        }

        const response = await axios.get(`${API_BASE_URL}/api/auth/me`);
        if (response.data) {
          setUser(response.data);
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.warn('Sesión no activa o expirada:', error.response?.data?.detail || error.message);
        // Clear authorization if invalid
        delete axios.defaults.headers.common['Authorization'];
        localStorage.removeItem('vextor_auth_token');
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (email, password) => {
    setIsLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/api/auth/login`, {
        email,
        password
      });
      const data = response.data;

      // Store token in localStorage as fallback, and also set authorization headers
      if (data.token) {
        localStorage.setItem('vextor_auth_token', data.token);
        axios.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
      }

      setUser(data.user);
      setIsAuthenticated(true);
      setIsLoading(false);
      return data.user;
    } catch (error) {
      setIsLoading(false);
      const message = error.response?.data?.detail || 'Error al iniciar sesión.';
      throw new Error(message);
    }
  };

  const register = async (userData) => {
    setIsLoading(true);
    try {
      // Registrar usuario
      await axios.post(`${API_BASE_URL}/api/auth/register`, {
        fullName: userData.fullName,
        email: userData.email,
        password: userData.password
      });

      // Hacer login automático inmediatamente después del registro
      const loggedUser = await login(userData.email, userData.password);
      return loggedUser;
    } catch (error) {
      setIsLoading(false);
      const message = error.response?.data?.detail || 'Error al crear la cuenta.';
      throw new Error(message);
    }
  };

  const logout = async () => {
    try {
      await axios.post(`${API_BASE_URL}/api/auth/logout`);
    } catch (error) {
      console.error('Error logging out on backend:', error);
    } finally {
      delete axios.defaults.headers.common['Authorization'];
      localStorage.removeItem('vextor_auth_token');
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        login,
        logout,
        register,
        setUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

/**
 * useAuth Hook
 * Permite acceder al contexto de autenticación de forma sencilla.
 */
// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};
