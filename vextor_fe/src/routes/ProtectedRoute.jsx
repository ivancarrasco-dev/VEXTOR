import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Logo } from '../components/ui/Logo';
import { isNativePlatform } from '../utils/platform';
import { ShieldAlert, LogOut, ArrowRight } from 'lucide-react';
import { Button } from '../components/ui/Button';

/**
 * ProtectedRoute Component
 *
 * Responsabilidad:
 * Restringir el acceso a rutas que requieren autenticación.
 * En la APK móvil (Capacitor), garantiza que únicamente los usuarios con rol Conductor puedan operar.
 */
const ProtectedRoute = ({ adminOnly = false }) => {
  const { isAuthenticated, isLoading, user, logout } = useAuth();
  const isNative = isNativePlatform();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-v-dark flex flex-col items-center justify-center p-4">
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

  const roleLower = (user?.role || '').toLowerCase();
  const isConductor = roleLower.includes('conductor');
  const isUsuario = roleLower.includes('usuario');

  // En la APK móvil nativa, bloquear acceso si el usuario NO es conductor
  if (isNative && !isConductor) {
    return (
      <div className="min-h-screen bg-v-dark flex items-center justify-center p-6 text-center">
        <div className="max-w-md w-full bg-v-dark-soft border border-v-dark-border rounded-3xl p-8 space-y-6 shadow-2xl">
          <div className="h-16 w-16 bg-amber-500/10 border-2 border-amber-500/30 rounded-2xl flex items-center justify-center mx-auto text-amber-500">
            <ShieldAlert size={36} />
          </div>

          <div className="space-y-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 inline-block">
              Acceso Restringido en App Móvil
            </span>
            <h1 className="text-xl font-bold text-v-white">Aplicación Exclusiva para Conductores</h1>
            <p className="text-xs text-v-gray leading-relaxed pt-2">
              Hola <strong className="text-v-white">{user?.name}</strong> (Rol: <strong className="text-v-white">{user?.role}</strong>). Esta aplicación móvil Android está configurada exclusivamente para la operación en ruta de los conductores.
            </p>
            <p className="text-xs text-v-gray leading-relaxed">
              Para acceder a las funciones administrativas o de usuario, ingresa a través del portal web de VEXTOR desde un navegador.
            </p>
          </div>

          <Button
            onClick={logout}
            className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded-2xl text-xs flex items-center justify-center gap-2 cursor-pointer shadow-lg border-none"
          >
            <LogOut size={16} />
            Cerrar Sesión
          </Button>
        </div>
      </div>
    );
  }

  // En la plataforma web regular
  if (adminOnly && (isConductor || isUsuario)) {
    if (isConductor) return <Navigate to="/driver/my-routes" replace />;
    if (isUsuario) return <Navigate to="/user/home" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
