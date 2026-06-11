import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(undefined);

/**
 * AuthProvider Component
 *
 * Responsabilidad:
 * Gestionar el estado global de autenticación de la plataforma Vextor.
 *
 * Funcionalidades:
 * * Mantener el estado del usuario actual y su estado de autenticación.
 * * Proveer métodos para iniciar sesión, cerrar sesión y registrarse.
 * * Persistencia de sesión mediante localStorage.
 * * Manejo de estados de carga durante la verificación de sesión.
 */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Simular verificación de sesión al cargar
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const storedUser = localStorage.getItem('vextor_user');
        if (storedUser) {
          setUser(JSON.parse(storedUser));
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error('Error loading session:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (email) => {
    setIsLoading(true);
    // Simulación de API call
    return new Promise((resolve) => {
      setTimeout(() => {
        const userData = {
          id: '1',
          name: 'Admin Vextor',
          email: email,
          role: 'Super Administrador',
          avatar: 'AV'
        };
        setUser(userData);
        setIsAuthenticated(true);
        localStorage.setItem('vextor_user', JSON.stringify(userData));
        setIsLoading(false);
        resolve(userData);
      }, 1000);
    });
  };

  const register = async (userData) => {
    setIsLoading(true);
    // Simulación de API call
    return new Promise((resolve) => {
      setTimeout(() => {
        const newUser = {
          id: Math.random().toString(36).substr(2, 9),
          ...userData,
          role: 'Administrador',
          avatar: userData.fullName.split(' ').map(n => n[0]).join('').toUpperCase()
        };
        setUser(newUser);
        setIsAuthenticated(true);
        localStorage.setItem('vextor_user', JSON.stringify(newUser));
        setIsLoading(false);
        resolve(newUser);
      }, 1000);
    });
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('vextor_user');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        login,
        logout,
        register
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
