import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Logo } from '../components/ui/Logo';

/**
 * ProtectedRoute Component
 *
 * Responsabilidad:
 * Restringir el acceso a rutas que requieren autenticación.
 *
 * Comportamiento:
 * * Si está cargando, muestra una pantalla de splash simple.
 * * Si no está autenticado, redirige al /login.
 * * Si está autenticado, renderiza los componentes hijos (Outlet).
 */
const ProtectedRoute = ({ adminOnly = false }) => {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-v-dark flex flex-col items-center justify-center">
        <Logo className="animate-pulse mb-8" />
        <div className="w-48 h-1 bg-v-dark-border rounded-full overflow-hidden">
          <div className="h-full bg-primary animate-[loading_1.5s_infinite_linear]" />
        </div>
        <style>
          {`
            @keyframes loading {
              0% { transform: translateX(-100%); }
              100% { transform: translateX(100%); }
            }
          `}
        </style>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const isConductor = user?.role === 'rol-conductor' || user?.role === 'Conductor';
  if (adminOnly && isConductor) {
    return <Navigate to="/driver/my-routes" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
