import { Routes, Route, Navigate } from 'react-router-dom';
import Landing from '../pages/Landing/Landing';
import Login from '../pages/Login/Login';
import Register from '../pages/Register/Register';
import ForgotPassword from '../pages/ForgotPassword/ForgotPassword';
import ResetPassword from '../pages/ResetPassword/ResetPassword';
import Dashboard from '../pages/Dashboard/Dashboard';
import Vehicles from '../pages/Vehicles/Vehicles';
import Drivers from '../pages/Drivers/Drivers';
import RoutesPage from '../pages/Routes/Routes';
import Maintenance from '../pages/Maintenance/Maintenance';
import Reports from '../pages/Reports/Reports';
import Settings from '../pages/Settings/Settings';
import MyRoutes from '../pages/Driver/MyRoutes';
import ActiveRoutePage from '../pages/Driver/ActiveRoutePage';
import DashboardLayout from '../layouts/DashboardLayout';
import ProtectedRoute from './ProtectedRoute';

/**
 * AppRouter Component
 *
 * Responsabilidad:
 * Centralizar la lógica de enrutamiento de toda la aplicación.
 *
 * Funcionalidades:
 * * Definición de rutas públicas (Landing, Auth).
 * * Definición de rutas privadas protegidas por DashboardLayout.
 * * Manejo de redirecciones para rutas no encontradas (*).
 * * Inyección de componentes de página según el path.
 */
const AppRouter = () => {
  return (
    <Routes>
      {/* Public Landing Page */}
      <Route path="/" element={<Landing />} />

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
            <Route path="/vehicles" element={<Vehicles />} />
            <Route path="/drivers" element={<Drivers />} />
            <Route path="/routes" element={<RoutesPage />} />
            <Route path="/maintenance" element={<Maintenance />} />
            <Route path="/reports" element={<Reports />} />
          </Route>

          {/* Common / Driver Routes */}
          <Route path="/settings" element={<Settings />} />
          <Route path="/driver/my-routes" element={<MyRoutes />} />
          <Route path="/driver/active-route/:idRuta?" element={<ActiveRoutePage />} />
        </Route>
      </Route>

      {/* Redirects */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRouter;
