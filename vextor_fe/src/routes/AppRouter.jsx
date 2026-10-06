import { Routes, Route, Navigate } from 'react-router-dom';
import Landing from '../pages/Landing/Landing';
import Contact from '../pages/Contact/Contact';
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
import UsersPage from '../pages/Users/UsersPage';
import TripsMonitoringPage from '../pages/Trips/TripsMonitoringPage';

// Driver Pages
import MyRoutes from '../pages/Driver/MyRoutes';
import ActiveRoutePage from '../pages/Driver/ActiveRoutePage';
import DriverBusInfo from '../pages/Driver/DriverBusInfo';

// User / Client Pages
import UserHome from '../pages/User/UserHome';
import UserBuses from '../pages/User/UserBuses';
import UserRoutes from '../pages/User/UserRoutes';
import UserSchedules from '../pages/User/UserSchedules';
import UserHistory from '../pages/User/UserHistory';
import UserNotifications from '../pages/User/UserNotifications';
import UserProfile from '../pages/User/UserProfile';

import DashboardLayout from '../layouts/DashboardLayout';
import ProtectedRoute from './ProtectedRoute';

/**
 * AppRouter Component
 *
 * Responsabilidad:
 * Centralizar la lógica de enrutamiento de toda la aplicación.
 */
const AppRouter = () => {
  return (
    <Routes>
      {/* Public Landing Page */}
      <Route path="/" element={<Landing />} />
      <Route path="/contacto" element={<Contact />} />

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
          <Route path="/driver/my-routes" element={<MyRoutes />} />
          <Route path="/driver/my-bus" element={<DriverBusInfo />} />
          <Route path="/driver/active-route/:idRuta?" element={<ActiveRoutePage />} />
          <Route path="/driver/notifications" element={<UserNotifications />} />
        </Route>
      </Route>

      {/* Redirects */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRouter;
