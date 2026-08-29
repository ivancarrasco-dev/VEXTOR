import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  Building2,
  Users,
  Truck,
  Compass,
  Wrench,
  Bell,
  FileText,
  Palette,
  Lock,
  Database,
  Sliders,
  History,
  Check
} from 'lucide-react';

import { useTheme } from '../../context/ThemeContext';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../utils/cn';
import axios from 'axios';
import { API_BASE_URL } from '../../config/api';

// Import modular sections
import ProfileSection from './sections/ProfileSection';
import CompanySection from './sections/CompanySection';
import UsersSection from './sections/UsersSection';
import VehiclesSection from './sections/VehiclesSection';
import RoutesSection from './sections/RoutesSection';
import MaintenanceSection from './sections/MaintenanceSection';
import NotificationsSection from './sections/NotificationsSection';
import DocumentsSection from './sections/DocumentsSection';
import AppearanceSection from './sections/AppearanceSection';
import SecuritySection from './sections/SecuritySection';
import BackupSection from './sections/BackupSection';
import SystemSection from './sections/SystemSection';
import AuditSection from './sections/AuditSection';

// Sidebar Categories definition
const categories = [
  { id: 'profile', name: 'Mi Perfil', icon: User, desc: 'Gestione su información de usuario y credenciales.' },
  { id: 'company', name: 'Empresa', icon: Building2, desc: 'Configure la información legal e institucional de su entidad.' },
  { id: 'users', name: 'Usuarios y Roles', icon: Users, desc: 'Gestione el acceso y nivel de permisos de los colaboradores.' },
  { id: 'vehicles', name: 'Vehículos', icon: Truck, desc: 'Parámetros de marcas, modelos, combustibles y flota.' },
  { id: 'routes', name: 'Rutas', icon: Compass, desc: 'Zonas, centros de distribución y parámetros geográficos.' },
  { id: 'maintenance', name: 'Mantenimientos', icon: Wrench, desc: 'Frecuencias, alertas automáticas e inventario de talleres.' },
  { id: 'notifications', name: 'Notificaciones', icon: Bell, desc: 'Configure las vías, alertas de eventos y recordatorios.' },
  { id: 'documents', name: 'Documentos', icon: FileText, desc: 'Soporte, licencias y control de vencimientos del SOAT.' },
  { id: 'appearance', name: 'Apariencia', icon: Palette, desc: 'Sistemas de temas, paleta de colores corporativa e idioma.' },
  { id: 'security', name: 'Seguridad', icon: Lock, desc: 'Control de sesiones activas y seguridad en dos factores (2FA).' },
  { id: 'backup', name: 'Copias de Seguridad', icon: Database, desc: 'Políticas de respaldos, históricos de backups y restauración.' },
  { id: 'system', name: 'Sistema', icon: Sliders, desc: 'Zona horaria, tipo de moneda local y registros de listados.' },
  { id: 'audit', name: 'Auditoría', icon: History, desc: 'Historial detallado del registro de operaciones del sistema.' }
];

const Settings = () => {
  const { theme, setTheme, themeColor, setThemeColor, language, setLanguage } = useTheme();
  const { user } = useAuth();
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();

  const isConductor = user?.role === 'rol-conductor' || user?.role === 'Conductor';
  const isNormalUser = user?.role === 'Usuario' || user?.role === 'rol-usuario';
  const limitedCategories = ['profile', 'notifications', 'appearance', 'security'];
  const visibleCategories = (isConductor || isNormalUser)
    ? categories.filter(cat => limitedCategories.includes(cat.id))
    : categories;

  const [activeCategory, setActiveCategory] = useState(() => {
    const locState = location.state?.section;
    if (locState && visibleCategories.some(cat => cat.id === locState)) {
      return locState;
    }
    const savedTab = localStorage.getItem('vextor_active_settings_tab');
    if (savedTab && visibleCategories.some(cat => cat.id === savedTab)) {
      return savedTab;
    }
    return 'profile';
  });

  useEffect(() => {
    if (isConductor && !driverCategories.includes(activeCategory)) {
      setActiveCategory('profile');
    }
  }, [isConductor, activeCategory]);

  useEffect(() => {
    if (location.state?.section && categories.some(cat => cat.id === location.state.section)) {
      const targetSec = location.state.section;
      setActiveCategory(targetSec);
      localStorage.setItem('vextor_active_settings_tab', targetSec);
      // Clear location state after consumption
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, location.pathname, navigate]);
  const [successMessage, setSuccessMessage] = useState('');

  // Toast helper
  const showToast = (message) => {
    setSuccessMessage(message);
    setTimeout(() => {
      setSuccessMessage('');
    }, 4000);
  };

  // 1. Profile State
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    role: user?.role || '',
    photo: user?.photo || null
  });

  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        role: user.role || '',
        photo: user.photo || null
      });
    }
  }, [user]);

  const handleProfileSave = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.put(`${API_BASE_URL}/api/auth/profile?name=${encodeURIComponent(profileData.name)}&email=${encodeURIComponent(profileData.email)}&phone=${encodeURIComponent(profileData.phone)}&photo=${profileData.photo ? encodeURIComponent(profileData.photo) : ''}`);
      if (response.data) {
        showToast('¡Información de perfil actualizada con éxito!');
        // Update local session
        const updated = {
          ...user,
          name: response.data.name,
          email: response.data.email,
          phone: response.data.phone,
          photo: response.data.photo,
          avatar: response.data.avatar
        };
        localStorage.setItem('vextor_user', JSON.stringify(updated));
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      showToast('Error al actualizar el perfil.');
    }
  };

  // 2. Company State
  const [companyData, setCompanyData] = useState({
    name: '',
    nit: '',
    address: '',
    city: '',
    email: '',
    phone: '',
    logo: null
  });

  useEffect(() => {
    const fetchCompanyData = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/company`);
        if (response.data) {
          setCompanyData(response.data);
        }
      } catch (error) {
        console.error('Error fetching company data:', error);
      }
    };
    fetchCompanyData();
  }, []);

  const handleCompanySave = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.put(`${API_BASE_URL}/api/company`, companyData);
      if (response.data) {
        setCompanyData(response.data);
        showToast('¡Datos de la empresa actualizados correctamente!');
      }
    } catch (error) {
      console.error('Error updating company data:', error);
      showToast('Error al actualizar los datos de la empresa.');
    }
  };

  // 3. Users and Roles State
  const [usersList, setUsersList] = useState([]);
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [isEditingUser, setIsEditingUser] = useState(false);
  const [userForm, setUserForm] = useState({
    id_usuario: '',
    nombres_usuario: '',
    apellidos_usuario: '',
    correo_usuario: '',
    contrasenia_usuario: '',
    id_rol: '11111111-2222-3333-4444-555555555552',
    estado_usuario: 'ACTIVO'
  });

  const fetchUsers = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/users`);
      setUsersList(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleUserToggleStatus = async (usr) => {
    try {
      const nextStatus = usr.estado_usuario === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO';
      const response = await axios.put(`${API_BASE_URL}/api/users/${usr.id_usuario}`, {
        estado_usuario: nextStatus
      });
      if (response.data) {
        showToast('Estado del usuario actualizado.');
        fetchUsers();
      }
    } catch (error) {
      console.error('Error toggling user status:', error);
      showToast('Error al actualizar el estado del usuario.');
    }
  };

  const handleOpenAddUser = () => {
    setIsEditingUser(false);
    setUserForm({
      id_usuario: '',
      nombres_usuario: '',
      apellidos_usuario: '',
      correo_usuario: '',
      contrasenia_usuario: '',
      id_rol: '11111111-2222-3333-4444-555555555552',
      estado_usuario: 'ACTIVO'
    });
    setUserModalOpen(true);
  };

  const handleOpenEditUser = (u) => {
    setIsEditingUser(true);
    setUserForm(u);
    setUserModalOpen(true);
  };

  const handleSaveUser = async (e) => {
    e.preventDefault();
    try {
      if (isEditingUser) {
        await axios.put(`${API_BASE_URL}/api/users/${userForm.id_usuario}`, {
          nombres_usuario: userForm.nombres_usuario,
          apellidos_usuario: userForm.apellidos_usuario,
          correo_usuario: userForm.correo_usuario,
          id_rol: userForm.id_rol,
          estado_usuario: userForm.estado_usuario
        });
        showToast('Usuario editado correctamente.');
      } else {
        await axios.post(`${API_BASE_URL}/api/users`, {
          nombres_usuario: userForm.nombres_usuario,
          apellidos_usuario: userForm.apellidos_usuario,
          correo_usuario: userForm.correo_usuario,
          contrasenia_usuario: userForm.contrasenia_usuario,
          id_rol: userForm.id_rol,
          estado_usuario: userForm.estado_usuario
        });
        showToast('Usuario creado correctamente.');
      }
      setUserModalOpen(false);
      fetchUsers();
    } catch (error) {
      console.error('Error saving user:', error);
      showToast(error.response?.data?.detail || 'Error al guardar el usuario.');
    }
  };

  const handleDeleteUser = async (id) => {
    try {
      await axios.delete(`${API_BASE_URL}/api/users/${id}`);
      showToast('Usuario eliminado del sistema.');
      fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      showToast(error.response?.data?.detail || 'Error al eliminar el usuario.');
    }
  };

  // 4. Vehicles Config State
  const [vehicleConfigs, setVehicleConfigs] = useState({
    types: ['Automóvil', 'Camioneta', 'Furgón', 'Camión', 'Bus'],
    brands: ['Toyota', 'Chevrolet', 'Hyundai', 'Ford', 'Mercedes-Benz', 'Hino', 'Volvo'],
    models: ['Hilux', 'Onix', 'Accent', 'F-150', 'Sprinter', 'Dutro 300', 'FH16'],
    colors: ['Blanco', 'Negro', 'Gris', 'Plateado', 'Azul', 'Rojo'],
    fuels: ['Gasolina', 'Diésel', 'Híbrido', 'Eléctrico', 'Gas (GNV)'],
    maxCapacity: '40',
    maxKm: '300000'
  });

  const [newTagInput, setNewTagInput] = useState({ type: '', value: '' });

  const handleAddTag = (category) => {
    const val = newTagInput.value.trim();
    if (!val) return;
    setVehicleConfigs({
      ...vehicleConfigs,
      [category]: [...vehicleConfigs[category], val]
    });
    setNewTagInput({ type: '', value: '' });
    showToast(`Elemento agregado a ${category}.`);
  };

  const handleRemoveTag = (category, item) => {
    setVehicleConfigs({
      ...vehicleConfigs,
      [category]: vehicleConfigs[category].filter(i => i !== item)
    });
    showToast('Elemento removido.');
  };

  // 5. Routes Config State
  const [routeConfigs, setRouteConfigs] = useState({
    zones: ['Zona Norte', 'Zona Sur', 'Zona Centro', 'Occidente', 'Oriente', 'Área Metropolitana'],
    cities: ['Bogotá', 'Medellín', 'Cali', 'Barranquilla', 'Bucaramanga', 'Cartagena'],
    centers: ['CEDI Principal Calle 80', 'CEDI Fontibón', 'Bodega Norte Express', 'Terminal Carga Puerto']
  });

  const handleAddRouteConfig = (category) => {
    const val = newTagInput.value.trim();
    if (!val) return;
    setRouteConfigs({
      ...routeConfigs,
      [category]: [...routeConfigs[category], val]
    });
    setNewTagInput({ type: '', value: '' });
    showToast(`Configuración de rutas actualizada.`);
  };

  const handleRemoveRouteConfig = (category, item) => {
    setRouteConfigs({
      ...routeConfigs,
      [category]: routeConfigs[category].filter(i => i !== item)
    });
  };

  // 6. Maintenance Config State
  const [maintenanceConfigs, setMaintenanceConfigs] = useState({
    frequencyKm: '10000',
    frequencyDays: '180',
    alertThresholdKm: '1000',
    alertThresholdDays: '15',
    types: ['Preventivo', 'Correctivo', 'Predictivo', 'Garantía'],
    workshops: [
      { name: 'Taller Central Vextor', address: 'Av. Américas # 45-12', phone: '3157894561' },
      { name: 'Mantenimientos Autorizados Toyota', address: 'Autopista Norte # 120', phone: '3204561234' }
    ]
  });

  const [workshopForm, setWorkshopForm] = useState({ name: '', address: '', phone: '' });

  const handleAddWorkshop = (e) => {
    e.preventDefault();
    if (!workshopForm.name) return;
    setMaintenanceConfigs({
      ...maintenanceConfigs,
      workshops: [...maintenanceConfigs.workshops, workshopForm]
    });
    setWorkshopForm({ name: '', address: '', phone: '' });
    showToast('Taller registrado con éxito.');
  };

  const handleRemoveWorkshop = (name) => {
    setMaintenanceConfigs({
      ...maintenanceConfigs,
      workshops: maintenanceConfigs.workshops.filter(w => w.name !== name)
    });
    showToast('Taller eliminado.');
  };

  // 7. Notifications State
  const [notificationToggles, setNotificationToggles] = useState({
    email: true,
    reminders: true,
    alerts: true,
    internal: true
  });

  const handleToggleNotification = (key) => {
    setNotificationToggles({
      ...notificationToggles,
      [key]: !notificationToggles[key]
    });
    showToast('Preferencia de notificación actualizada.');
  };

  // 8. Documents State
  const [documentsState, setDocumentsState] = useState({
    soat: { number: 'SOAT-2025-45812', expiry: '2026-12-15', status: 'Vigente' },
    insurance: { number: 'POL-CH-7890', expiry: '2026-05-30', status: 'Vigente' },
    techno: { number: 'RTM-458912', expiry: '2025-10-20', status: 'Próximo a Vencer' },
    licenses: { number: 'LIC-C3-1002', expiry: '2025-02-28', status: 'Vencido' }
  });

  // 9. Appearance State
  const appearanceColor = themeColor;
  const setAppearanceColor = setThemeColor;
  const appearanceLang = language;
  const setAppearanceLang = setLanguage;

  // 10. Security State
  const [passwordForm, setPasswordForm] = useState({ current: '', next: '', confirm: '' });
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);
  const [activeSessions, setActiveSessions] = useState([
    { id: 's1', browser: 'Chrome on macOS (M2)', location: 'Bogotá, Colombia', ip: '186.112.45.19', isCurrent: true },
    { id: 's2', browser: 'Safari on iPhone 15 Pro', location: 'Bogotá, Colombia', ip: '186.112.45.22', isCurrent: false },
    { id: 's3', browser: 'Firefox on Windows 11', location: 'Medellín, Colombia', ip: '190.15.89.14', isCurrent: false }
  ]);

  const handleRevokeSession = (id) => {
    setActiveSessions(activeSessions.filter(s => s.id !== id));
    showToast('Sesión revocada correctamente.');
  };

  const handlePasswordChange = (e) => {
    e.preventDefault();
    if (passwordForm.next !== passwordForm.confirm) {
      alert('La confirmación de la contraseña no coincide.');
      return;
    }
    showToast('Contraseña cambiada exitosamente.');
    setPasswordForm({ current: '', next: '', confirm: '' });
  };

  // 11. Backup State
  const [backupList, setBackupList] = useState([
    { id: 'b1', filename: 'backup_vextor_20260805_0400.sql', size: '14.2 MB', date: '2026-08-05 04:00 AM', status: 'Completado' },
    { id: 'b2', filename: 'backup_vextor_20260804_0400.sql', size: '14.1 MB', date: '2026-08-04 04:00 AM', status: 'Completado' },
    { id: 'b3', filename: 'backup_vextor_20260803_0400.sql', size: '14.0 MB', date: '2026-08-03 04:00 AM', status: 'Completado' }
  ]);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isAutoBackup, setIsAutoBackup] = useState(true);

  const handleCreateBackup = () => {
    setIsBackingUp(true);
    setTimeout(() => {
      const now = new Date();
      const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
      const newBackup = {
        id: Date.now().toString(),
        filename: `backup_vextor_${dateStr}_manual.sql`,
        size: '14.5 MB',
        date: now.toLocaleString(),
        status: 'Completado'
      };
      setBackupList([newBackup, ...backupList]);
      setIsBackingUp(false);
      showToast('Respaldo del sistema generado correctamente.');
    }, 2000);
  };

  // 12. System Settings
  const [systemSettings, setSystemSettings] = useState({
    timezone: 'America/Bogota',
    currency: 'COP',
    dateFormat: 'DD/MM/YYYY',
    recordsPerPage: '10'
  });

  // 13. Audit logs (Initial Mock logs)
  const [auditLogs, setAuditLogs] = useState([
    { id: 'a1', action: 'Inicio de Sesión', desc: 'El usuario Admin Vextor ha ingresado al sistema.', user: 'Admin Vextor', date: '2026-08-05 18:32:15', ip: '186.112.45.19' },
    { id: 'a2', action: 'Actualización de Vehículo', desc: 'Se actualizaron los datos del vehículo de placa ABC-1234.', user: 'María Gómez', date: '2026-08-05 15:12:44', ip: '186.112.45.22' },
    { id: 'a3', action: 'Creación de Ruta', desc: 'Nueva ruta programada RUT-101 registrada.', user: 'Admin Vextor', date: '2026-08-05 11:05:10', ip: '186.112.45.19' },
    { id: 'a4', action: 'Cierre de Mantenimiento', desc: 'Mantenimiento del vehículo HINO-458 marcado como Completado.', user: 'Juan Pérez', date: '2026-08-04 17:40:55', ip: '190.15.89.14' },
    { id: 'a5', action: 'Generación de Reporte', desc: 'Reporte mensual de consumo descargado en PDF.', user: 'Sofía Rodríguez', date: '2026-08-04 09:15:30', ip: '186.112.45.30' }
  ]);

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      <AnimatePresence>
        {successMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-24 right-6 z-50 flex items-center gap-3 bg-emerald-500 text-v-dark-constant font-semibold px-4 py-3.5 rounded-xl shadow-2xl shadow-emerald-500/20"
          >
            <Check size={18} strokeWidth={3} />
            <span>{successMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-v-dark-soft p-6 rounded-2xl border border-v-dark-border">
        <div>
          <h2 className="text-2xl font-bold text-v-white">{t('settings.title')}</h2>
          <p className="text-v-gray text-sm mt-0.5">{t('settings.subtitle')}</p>
        </div>
      </div>

      {/* Main Container: Sidebar + Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

        {/* LEFT SIDEBAR: Categories */}
        <div className="lg:col-span-3 bg-v-dark-soft border border-v-dark-border rounded-2xl p-3 sm:p-4 overflow-hidden">
          <p className="text-xs font-bold text-v-gray uppercase tracking-wider px-3 mb-3 hidden lg:block">{t('common.all')}</p>
          <div className="flex lg:flex-col gap-1.5 overflow-x-auto lg:overflow-y-auto lg:max-h-[70vh] custom-scrollbar pb-2 lg:pb-0 pr-1">
            {visibleCategories.map((cat) => {
              const Icon = cat.icon;
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => {
                    setActiveCategory(cat.id);
                    localStorage.setItem('vextor_active_settings_tab', cat.id);
                  }}
                  className={cn(
                    "flex items-center gap-2 sm:gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-200 group relative cursor-pointer shrink-0 lg:shrink whitespace-nowrap lg:whitespace-normal",
                    isActive
                      ? "bg-primary/10 text-primary font-semibold"
                      : "text-v-gray hover:text-v-white hover:bg-v-dark/40"
                  )}
                >
                  <Icon
                    size={18}
                    className={cn(
                      "shrink-0 transition-transform duration-200",
                      isActive ? "text-primary" : "text-v-gray group-hover:text-v-white group-hover:scale-105"
                    )}
                  />
                  <span className="text-xs sm:text-sm truncate">{t(`settings.categories.${cat.id}`)}</span>

                  {isActive && (
                    <motion.div
                      layoutId="active-setting-pill"
                      className="absolute bottom-0 lg:bottom-auto lg:left-0 left-2 right-2 lg:right-auto h-0.5 lg:h-5 lg:w-1 bg-primary rounded-full lg:rounded-r-full"
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* RIGHT PANEL: Content Details */}
        <div className="lg:col-span-9">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeCategory}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
              className="bg-v-dark-soft border border-v-dark-border rounded-2xl p-6 shadow-xl"
            >
              {/* Category Info Header */}
              <div className="border-b border-v-dark-border pb-5 mb-6">
                <div className="flex items-center gap-2.5 mb-1.5">
                  <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary animate-in zoom-in duration-300">
                    {React.createElement(categories.find(c => c.id === activeCategory).icon, { size: 18 })}
                  </div>
                  <h3 className="text-xl font-bold text-v-white">
                    {t(`settings.categories.${activeCategory}`)}
                  </h3>
                </div>
                <p className="text-sm text-v-gray">
                  {t(`settings.${activeCategory}.desc`)}
                </p>
              </div>

              {/* CARD CONTENTS BY CATEGORY */}

              {/* 1. Mi Perfil */}
              {activeCategory === 'profile' && (
                <ProfileSection
                  profileData={profileData}
                  setProfileData={setProfileData}
                  handleProfileSave={handleProfileSave}
                  showToast={showToast}
                />
              )}

              {/* 2. Empresa */}
              {activeCategory === 'company' && (
                <CompanySection
                  companyData={companyData}
                  setCompanyData={setCompanyData}
                  handleCompanySave={handleCompanySave}
                  showToast={showToast}
                />
              )}

              {/* 3. Usuarios y Roles */}
              {activeCategory === 'users' && (
                <UsersSection
                  usersList={usersList}
                  handleUserToggleStatus={handleUserToggleStatus}
                  handleOpenAddUser={handleOpenAddUser}
                  handleOpenEditUser={handleOpenEditUser}
                  handleDeleteUser={handleDeleteUser}
                  userModalOpen={userModalOpen}
                  setUserModalOpen={setUserModalOpen}
                  isEditingUser={isEditingUser}
                  userForm={userForm}
                  setUserForm={setUserForm}
                  handleSaveUser={handleSaveUser}
                />
              )}

              {/* 4. Vehículos Config */}
              {activeCategory === 'vehicles' && (
                <VehiclesSection
                  vehicleConfigs={vehicleConfigs}
                  setVehicleConfigs={setVehicleConfigs}
                  newTagInput={newTagInput}
                  setNewTagInput={setNewTagInput}
                  handleAddTag={handleAddTag}
                  handleRemoveTag={handleRemoveTag}
                />
              )}

              {/* 5. Rutas Config */}
              {activeCategory === 'routes' && (
                <RoutesSection
                  routeConfigs={routeConfigs}
                  newTagInput={newTagInput}
                  setNewTagInput={setNewTagInput}
                  handleAddRouteConfig={handleAddRouteConfig}
                  handleRemoveRouteConfig={handleRemoveRouteConfig}
                />
              )}

              {/* 6. Mantenimientos */}
              {activeCategory === 'maintenance' && (
                <MaintenanceSection
                  maintenanceConfigs={maintenanceConfigs}
                  setMaintenanceConfigs={setMaintenanceConfigs}
                  workshopForm={workshopForm}
                  setWorkshopForm={setWorkshopForm}
                  handleAddWorkshop={handleAddWorkshop}
                  handleRemoveWorkshop={handleRemoveWorkshop}
                />
              )}

              {/* 7. Notificaciones */}
              {activeCategory === 'notifications' && (
                <NotificationsSection
                  notificationToggles={notificationToggles}
                  handleToggleNotification={handleToggleNotification}
                />
              )}

              {/* 8. Documentos */}
              {activeCategory === 'documents' && (
                <DocumentsSection
                  documentsState={documentsState}
                  setDocumentsState={setDocumentsState}
                  showToast={showToast}
                />
              )}

              {/* 9. Apariencia */}
              {activeCategory === 'appearance' && (
                <AppearanceSection
                  theme={theme}
                  setTheme={setTheme}
                  appearanceColor={appearanceColor}
                  setAppearanceColor={setAppearanceColor}
                  appearanceLang={appearanceLang}
                  setAppearanceLang={setAppearanceLang}
                  showToast={showToast}
                />
              )}

              {/* 10. Seguridad */}
              {activeCategory === 'security' && (
                <SecuritySection
                  is2FAEnabled={is2FAEnabled}
                  setIs2FAEnabled={setIs2FAEnabled}
                  showToast={showToast}
                />
              )}

              {/* 11. Copias de Seguridad */}
              {activeCategory === 'backup' && (
                <BackupSection
                  isAutoBackup={isAutoBackup}
                  setIsAutoBackup={setIsAutoBackup}
                  handleCreateBackup={handleCreateBackup}
                  isBackingUp={isBackingUp}
                  backupList={backupList}
                  setBackupList={setBackupList}
                  showToast={showToast}
                />
              )}

              {/* 12. Sistema */}
              {activeCategory === 'system' && (
                <SystemSection
                  systemSettings={systemSettings}
                  setSystemSettings={setSystemSettings}
                  showToast={showToast}
                />
              )}

              {/* 13. Auditoría */}
              {activeCategory === 'audit' && (
                <AuditSection
                  showToast={showToast}
                />
              )}

            </motion.div>
          </AnimatePresence>
        </div>

      </div>
    </div>
  );
};

export default Settings;
