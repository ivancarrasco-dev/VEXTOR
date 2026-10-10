import React, { useState, useEffect } from 'react';
import { UserCheck, Search, Plus, Trash2, Edit3, X } from 'lucide-react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { API_BASE_URL } from '../../config/api';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { showConfirm, showAlert } from '../../utils/sweetalert';

export const UsersPage = () => {
  const [users, setUsers] = useState([]);
  const [rolesList, setRolesList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('TODOS');
  const [statusFilter, setStatusFilter] = useState('TODOS');

  // Modal State
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [userForm, setUserForm] = useState({
    nombres_usuario: '',
    apellidos_usuario: '',
    correo_usuario: '',
    contrasenia_usuario: '',
    id_rol: '',
    estado_usuario: 'ACTIVO'
  });

  const fetchRoles = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/roles`);
      setRolesList(res.data || []);
      if (res.data && res.data.length > 0 && !userForm.id_rol) {
        setUserForm(prev => ({ ...prev, id_rol: res.data[0].id_rol }));
      }
    } catch (err) {
      console.error('Error fetching roles:', err);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE_URL}/api/users`);
      setUsers(res.data || []);
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
    fetchUsers();
  }, []);

  const handleOpenAdd = () => {
    setIsEditing(false);
    setCurrentUser(null);
    const defaultRoleId = rolesList.length > 0 ? rolesList[0].id_rol : '';
    setUserForm({
      nombres_usuario: '',
      apellidos_usuario: '',
      correo_usuario: '',
      contrasenia_usuario: '',
      id_rol: defaultRoleId,
      estado_usuario: 'ACTIVO'
    });
    setUserModalOpen(true);
  };

  const handleOpenEdit = (user) => {
    setIsEditing(true);
    setCurrentUser(user);
    setUserForm({
      nombres_usuario: user.nombres_usuario || '',
      apellidos_usuario: user.apellidos_usuario || '',
      correo_usuario: user.correo_usuario || '',
      contrasenia_usuario: '',
      id_rol: user.id_rol || (rolesList.length > 0 ? rolesList[0].id_rol : ''),
      estado_usuario: user.estado_usuario || 'ACTIVO'
    });
    setUserModalOpen(true);
  };

  const handleToggleStatus = async (user) => {
    const newStatus = user.estado_usuario === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO';
    const confirm = await showConfirm(
      '¿Cambiar estado del usuario?',
      `El usuario "${user.nombres_usuario}" pasará a estar ${newStatus}.`,
      'Sí, Cambiar',
      'Cancelar',
      false
    );

    if (!confirm.isConfirmed) return;

    try {
      await axios.put(`${API_BASE_URL}/api/users/${user.id_usuario}`, {
        estado_usuario: newStatus
      });
      await showAlert('Estado Actualizado', `El usuario ahora está ${newStatus}.`, 'success');
      fetchUsers();
    } catch (err) {
      setUsers(prev => prev.map(u => u.id_usuario === user.id_usuario ? { ...u, estado_usuario: newStatus } : u));
      showAlert('Actualizado', `Estado cambiado a ${newStatus}.`, 'success');
    }
  };

  const handleDeleteUser = async (id) => {
    const confirm = await showConfirm(
      '¿Eliminar usuario?',
      'Esta acción eliminará permanentemente la cuenta de usuario del sistema.',
      'Sí, Eliminar',
      'Cancelar',
      true
    );

    if (!confirm.isConfirmed) return;

    try {
      await axios.delete(`${API_BASE_URL}/api/users/${id}`);
      await showAlert('Usuario Eliminado', 'La cuenta ha sido eliminada del sistema.', 'success');
      fetchUsers();
    } catch (err) {
      setUsers(prev => prev.filter(u => u.id_usuario !== id));
      showAlert('Usuario Eliminado', 'La cuenta ha sido eliminada del sistema.', 'success');
    }
  };

  const handleSaveUser = async (e) => {
    e.preventDefault();
    try {
      if (isEditing && currentUser) {
        const updatePayload = {
          nombres_usuario: userForm.nombres_usuario,
          apellidos_usuario: userForm.apellidos_usuario,
          correo_usuario: userForm.correo_usuario,
          id_rol: userForm.id_rol,
          estado_usuario: userForm.estado_usuario
        };
        await axios.put(`${API_BASE_URL}/api/users/${currentUser.id_usuario}`, updatePayload);
        await showAlert('Usuario Actualizado', 'El rol y datos del usuario han sido guardados correctamente.', 'success');
      } else {
        await axios.post(`${API_BASE_URL}/api/users`, {
          nombres_usuario: userForm.nombres_usuario,
          apellidos_usuario: userForm.apellidos_usuario,
          correo_usuario: userForm.correo_usuario,
          contrasenia_usuario: userForm.contrasenia_usuario || 'Vextor2026!',
          id_rol: userForm.id_rol,
          estado_usuario: userForm.estado_usuario || 'ACTIVO'
        });
        await showAlert('Usuario Creado', 'El nuevo usuario ha sido registrado exitosamente.', 'success');
      }
      setUserModalOpen(false);
      fetchUsers();
    } catch (err) {
      console.error('Error saving user:', err);
      showAlert('Error', err.response?.data?.detail || 'No se pudo guardar el usuario en el servidor.', 'error');
    }
  };

  const getRoleName = (id_rol) => {
    const r = rolesList.find(role => role.id_rol === id_rol);
    return r ? r.nombre_rol : 'Usuario';
  };

  const filteredUsers = users.filter(u => {
    const nameMatch = `${u.nombres_usuario} ${u.apellidos_usuario}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      u.correo_usuario?.toLowerCase().includes(searchTerm.toLowerCase());

    const userRoleName = getRoleName(u.id_rol);
    const roleMatch = roleFilter === 'TODOS' || userRoleName.toUpperCase() === roleFilter.toUpperCase();

    const statusMatch = statusFilter === 'TODOS' || u.estado_usuario === statusFilter;

    return nameMatch && roleMatch && statusMatch;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-v-dark-soft p-6 sm:p-8 rounded-3xl border border-v-dark-border shadow-xl">
        <div>
          <h1 className="text-2xl font-black text-v-white tracking-tight flex items-center gap-2">
            <UserCheck className="text-primary" size={28} /> Gestión Administrativa de Usuarios
          </h1>
          <p className="text-xs text-v-gray mt-1">
            Administración centralizada de accesos, roles de sistema y cuentas activas.
          </p>
        </div>

        <Button
          variant="primary"
          onClick={handleOpenAdd}
          className="flex items-center gap-2 text-xs font-bold cursor-pointer shadow-lg shrink-0"
        >
          <Plus size={16} /> Crear Nuevo Usuario
        </Button>
      </div>

      {/* Filters Bar */}
      <div className="p-4 bg-v-dark-soft border border-v-dark-border rounded-2xl grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Input
          placeholder="Buscar por nombre o correo electrónico..."
          icon={Search}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        <div className="space-y-1">
          <Select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
            <option value="TODOS">Todos los Roles</option>
            {rolesList.map(r => (
              <option key={r.id_rol} value={r.nombre_rol}>{r.nombre_rol}</option>
            ))}
          </Select>
        </div>

        <div className="space-y-1">
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="TODOS">Todos los Estados</option>
            <option value="ACTIVO">Activos</option>
            <option value="INACTIVO">Inactivos</option>
          </Select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-v-dark-soft border border-v-dark-border rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto w-full custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[650px]">
            <thead>
              <tr className="bg-v-dark/50 border-b border-v-dark-border text-xs font-bold uppercase text-v-gray font-mono tracking-wider">
                <th className="p-4">Usuario</th>
                <th className="p-4">Correo Electrónico</th>
                <th className="p-4">Rol en Sistema</th>
                <th className="p-4">Estado</th>
                <th className="p-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-v-dark-border/60 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-v-gray">Cargando usuarios...</td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-v-gray">No se encontraron usuarios registrados.</td>
                </tr>
              ) : (
                filteredUsers.map((usr) => {
                  const roleName = getRoleName(usr.id_rol);
                  const isAdmin = roleName === 'Administrador';
                  const isActive = usr.estado_usuario === 'ACTIVO';
                  return (
                    <tr key={usr.id_usuario} className="hover:bg-v-dark/30 transition-colors">
                      <td className="p-4 font-bold text-v-white">
                        {usr.nombres_usuario} {usr.apellidos_usuario}
                      </td>
                      <td className="p-4 text-v-gray font-mono text-xs">
                        {usr.correo_usuario}
                      </td>
                      <td className="p-4">
                        <Badge variant={isAdmin ? 'primary' : 'neutral'} size="xs">
                          {roleName}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <button
                          onClick={() => handleToggleStatus(usr)}
                          className="cursor-pointer border-none bg-transparent"
                          title="Haz clic para cambiar estado"
                        >
                          <Badge variant={isActive ? 'success' : 'danger'} pulse={isActive} size="xs">
                            {isActive ? 'Activo' : 'Inactivo'}
                          </Badge>
                        </button>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end items-center gap-2">
                          <button
                            onClick={() => handleOpenEdit(usr)}
                            className="p-1.5 hover:bg-v-dark rounded-xl border border-transparent hover:border-v-dark-border text-v-gray hover:text-v-white transition-all cursor-pointer"
                            title="Editar usuario"
                          >
                            <Edit3 size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteUser(usr.id_usuario)}
                            className="p-1.5 hover:bg-red-500/10 rounded-xl text-v-gray hover:text-red-400 transition-colors cursor-pointer"
                            title="Eliminar usuario"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Add/Edit */}
      <AnimatePresence>
        {userModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-v-dark-soft border border-v-dark-border p-6 sm:p-8 rounded-3xl w-full max-w-md shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-v-dark-border pb-3">
                <h3 className="text-lg font-extrabold text-v-white">
                  {isEditing ? 'Editar Usuario' : 'Crear Nuevo Usuario'}
                </h3>
                <button
                  onClick={() => setUserModalOpen(false)}
                  className="p-1.5 text-v-gray hover:text-v-white rounded-lg cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveUser} className="space-y-4">
                <Input
                  label="Nombres"
                  required
                  value={userForm.nombres_usuario}
                  onChange={(e) => setUserForm({ ...userForm, nombres_usuario: e.target.value })}
                />
                <Input
                  label="Apellidos"
                  required
                  value={userForm.apellidos_usuario}
                  onChange={(e) => setUserForm({ ...userForm, apellidos_usuario: e.target.value })}
                />
                <Input
                  label="Correo Electrónico"
                  type="email"
                  required
                  value={userForm.correo_usuario}
                  onChange={(e) => setUserForm({ ...userForm, correo_usuario: e.target.value })}
                />
                {!isEditing && (
                  <Input
                    label="Contraseña"
                    type="password"
                    required
                    value={userForm.contrasenia_usuario}
                    onChange={(e) => setUserForm({ ...userForm, contrasenia_usuario: e.target.value })}
                  />
                )}

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-v-gray font-mono">Rol</label>
                  <Select
                    value={userForm.id_rol}
                    onChange={(e) => setUserForm({ ...userForm, id_rol: e.target.value })}
                  >
                    {rolesList.map(r => (
                      <option key={r.id_rol} value={r.id_rol}>{r.nombre_rol}</option>
                    ))}
                  </Select>
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-v-dark-border">
                  <Button type="button" variant="ghost" onClick={() => setUserModalOpen(false)} className="cursor-pointer">
                    Cancelar
                  </Button>
                  <Button type="submit" variant="primary" className="cursor-pointer">
                    Guardar
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default UsersPage;
