import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { isNativePlatform } from '../utils/platform';

// Public Pages
const Landing = lazy(() => import('../pages/Landing/Landing'));
const Contact = lazy(() => import('../pages/Contact/Contact'));
const UserManual = lazy(() => import('../pages/UserManual/UserManual'));
const Login = lazy(() => import('../pages/Login/Login'));
const Register = lazy(() => import('../pages/Register/Register'));
const ForgotPassword = lazy(() => import('../pages/ForgotPassword/ForgotPassword'));
const ResetPassword = lazy(() => import('../pages/ResetPassword/ResetPassword'));

// Admin / Core Dashboard Pages
const Dashboard = lazy(() => import('../pages/Dashboard/Dashboard'));
const Vehicles = lazy(() => import('../pages/Vehicles/Vehicles'));
const Drivers = lazy(() => import('../pages/Drivers/Drivers'));
const RoutesPage = lazy(() => import('../pages/Routes/Routes'));
const Maintenance = lazy(() => import('../pages/Maintenance/Maintenance'));
const Reports = lazy(() => import('../pages/Reports/Reports'));
const Settings = lazy(() => import('../pages/Settings/Settings'));
const UsersPage = lazy(() => import('../pages/Users/UsersPage'));
const TripsMonitoringPage = lazy(() => import('../pages/Trips/TripsMonitoringPage'));

// Driver Pages
const MyRoutes = lazy(() => import('../pages/Driver/MyRoutes'));
const ActiveRoutePage = lazy(() => import('../pages/Driver/ActiveRoutePage'));
const DriverBusInfo = lazy(() => import('../pages/Driver/DriverBusInfo'));

// User / Client Pages
const UserHome = lazy(() => import('../pages/User/UserHome'));
const UserBuses = lazy(() => import('../pages/User/UserBuses'));
const UserRoutes = lazy(() => import('../pages/User/UserRoutes'));
const UserSchedules = lazy(() => import('../pages/User/UserSchedules'));
const UserHistory = lazy(() => import('../pages/User/UserHistory'));
const UserNotifications = lazy(() => import('../pages/User/UserNotifications'));
const UserProfile = lazy(() => import('../pages/User/UserProfile'));

import DashboardLayout from '../layouts/DashboardLayout';
import ProtectedRoute from './ProtectedRoute';

const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[50vh] w-full">
    <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
);

const RootRedirect = () => {
  const { isAuthenticated, user } = useAuth();
  const isNative = isNativePlatform();

  if (isNative) {
    if (isAuthenticated) {
      const roleLower = (user?.role || '').toLowerCase();
      if (roleLower.includes('conductor')) {
        return <Navigate to="/driver/my-routes" replace />;
      }
    }
    return <Navigate to="/login" replace />;
  }

  // En la web, si está autenticado redirige según rol
  if (isAuthenticated) {
    const roleLower = (user?.role || '').toLowerCase();
    if (roleLower.includes('conductor')) {
      return <Navigate to="/driver/my-routes" replace />;
    } else if (roleLower.includes('usuario')) {
      return <Navigate to="/user/home" replace />;
    } else {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return <Landing />;
};

const WildcardRedirect = () => {
  const { isAuthenticated } = useAuth();
  const isNative = isNativePlatform();

  if (isNative) {
    if (isAuthenticated) {
      return <Navigate to="/driver/my-routes" replace />;
    }
    return <Navigate to="/login" replace />;
  }
  return <Navigate to="/" replace />;
};

/**
 * AppRouter Component
 *
 * Responsabilidad:
 * Centralizar la lógica de enrutamiento con carga diferida (lazy loading).
 * En la APK móvil nativa, enfocar el flujo directamente hacia la experiencia del conductor.
 */
const AppRouter = () => {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Public Landing Page & Root Routing */}
        <Route path="/" element={<RootRedirect />} />
        <Route path="/contacto" element={<Contact />} />
        <Route path="/manual-usuario" element={<UserManual />} />

        {/* Public Auth Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Private Routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<DashboardLayout />}>
            {/* Admin Only Routes */}
            <Route element={<ProtectedRoute adminOnly />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/users" element={<UsersPage />} />
              <Route path="/recorridos" element={<TripsMonitoringPage />} />
              <Route path="/vehicles" element={<Vehicles />} />
              <Route path="/drivers" element={<Drivers />} />
              <Route path="/routes" element={<RoutesPage />} />
              <Route path="/maintenance" element={<Maintenance />} />
              <Route path="/reports" element={<Reports />} />
            </Route>

            {/* User Routes */}
            <Route path="/user/home" element={<UserHome />} />
            <Route path="/user/buses" element={<UserBuses />} />
            <Route path="/user/routes" element={<UserRoutes />} />
            <Route path="/user/schedules" element={<UserSchedules />} />
            <Route path="/user/history" element={<UserHistory />} />
            <Route path="/user/notifications" element={<UserNotifications />} />
            <Route path="/user/profile" element={<UserProfile />} />

            {/* Common / Driver Routes */}
            <Route path="/settings" element={<Settings />} />
            <Route path="/driver" element={<Navigate to="/driver/my-routes" replace />} />
            <Route path="/driver/dashboard" element={<Navigate to="/driver/my-routes" replace />} />
            <Route path="/driver/my-routes" element={<MyRoutes />} />
            <Route path="/driver/my-bus" element={<DriverBusInfo />} />
            <Route path="/driver/active-route/:idRuta?" element={<ActiveRoutePage />} />
            <Route path="/driver/notifications" element={<UserNotifications />} />
          </Route>
        </Route>

        {/* Redirects */}
        <Route path="*" element={<WildcardRedirect />} />
      </Routes>
    </Suspense>
  );
};

export default AppRouter;
