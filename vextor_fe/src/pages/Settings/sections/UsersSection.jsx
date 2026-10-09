import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Badge } from '../../../components/ui/Badge';
import { cn } from '../../../utils/cn';

const UsersSection = ({
  usersList,
  rolesList = [],
  handleUserToggleStatus,
  handleOpenAddUser,
  handleOpenEditUser,
  handleDeleteUser,
  userModalOpen,
  setUserModalOpen,
  isEditingUser,
  userForm,
  setUserForm,
  handleSaveUser
}) => {
  const getRoleName = (id_rol) => {
    const r = rolesList.find(role => role.id_rol === id_rol);
    return r ? r.nombre_rol : 'Usuario';
  };
  return (
    <div className="space-y-6 text-left">
      <div className="flex justify-between items-center bg-v-dark/20 p-4 rounded-2xl border border-v-dark-border">
        <div>
          <h4 className="font-bold text-v-white text-sm">Gestión de Accesos de Usuarios</h4>
          <p className="text-xs text-v-gray mt-0.5">Cuentas activas con permisos de administración u operación en la plataforma.</p>
        </div>
        <Button variant="primary" size="sm" onClick={handleOpenAddUser} className="flex items-center gap-1.5 shrink-0 cursor-pointer">
          <Plus size={16} /> Crear Usuario
        </Button>
      </div>

      {/* Users List Table */}
      <div className="border border-v-dark-border rounded-2xl overflow-hidden shadow-lg bg-v-dark-soft">
        <div className="overflow-x-auto w-full custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[550px]">
            <thead>
              <tr className="bg-v-dark/40 border-b border-v-dark-border text-xs font-bold uppercase text-v-gray font-mono tracking-wider">
                <th className="p-3.5">Nombre</th>
                <th className="p-3.5">Correo Electrónico</th>
                <th className="p-3.5">Rol</th>
                <th className="p-3.5">Estado</th>
                <th className="p-3.5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-v-dark-border">
              {usersList.map((usr) => {
                const isUserActive = (usr.estado_usuario === 'ACTIVO');
                const roleName = getRoleName(usr.id_rol);
                return (
                  <tr key={usr.id_usuario} className="hover:bg-v-dark/20 transition-colors">
                    <td className="p-3.5 font-bold text-v-white text-sm">
                      {usr.nombres_usuario} {usr.apellidos_usuario}
                    </td>
                    <td className="p-3.5 text-v-gray text-xs font-mono">{usr.correo_usuario}</td>
                    <td className="p-3.5 text-v-white text-sm">
                      <Badge variant={roleName === 'Administrador' ? 'primary' : 'neutral'} size="xs">
                        {roleName}
                      </Badge>
                    </td>
                    <td className="p-3.5">
                      <button
                        type="button"
                        onClick={() => handleUserToggleStatus(usr)}
                        className="cursor-pointer border-none bg-transparent"
                        title="Haga clic para cambiar estado"
                      >
                        <Badge variant={isUserActive ? 'success' : 'danger'} pulse={isUserActive} size="xs">
                          {isUserActive ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </button>
                    </td>
                    <td className="p-3.5 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleOpenEditUser(usr)}
                          className="px-2.5 py-1 hover:bg-v-dark border border-transparent hover:border-v-dark-border rounded-lg text-v-gray hover:text-v-white transition-all text-xs font-bold cursor-pointer"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDeleteUser(usr.id_usuario)}
                          className="p-1.5 hover:bg-red-500/10 rounded-lg text-v-gray hover:text-red-400 transition-colors cursor-pointer"
                          title="Eliminar Usuario"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Add/Edit User */}
      <AnimatePresence>
        {userModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-v-dark-soft border border-v-dark-border p-6 rounded-2xl w-full max-w-md shadow-2xl space-y-4"
            >
              <h4 className="text-lg font-extrabold text-v-white">
                {isEditingUser ? 'Editar Usuario' : 'Crear Nuevo Usuario'}
              </h4>
              <form onSubmit={handleSaveUser} className="space-y-4">
                <Input
                  label="Nombres del Usuario"
                  required
                  value={userForm.nombres_usuario}
                  onChange={(e) => setUserForm({ ...userForm, nombres_usuario: e.target.value })}
                />
                <Input
                  label="Apellidos del Usuario"
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
                {!isEditingUser && (
                  <Input
                    label="Contraseña"
                    type="password"
                    required
                    value={userForm.contrasenia_usuario || ''}
                    onChange={(e) => setUserForm({ ...userForm, contrasenia_usuario: e.target.value })}
                  />
                )}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-v-gray font-mono">Rol del Sistema</label>
                  <Select
                    value={userForm.id_rol}
                    onChange={(e) => setUserForm({ ...userForm, id_rol: e.target.value })}
                  >
                    {rolesList.map(r => (
                      <option key={r.id_rol} value={r.id_rol}>{r.nombre_rol}</option>
                    ))}
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-v-gray font-mono">Estado</label>
                  <Select
                    value={userForm.estado_usuario}
                    onChange={(e) => setUserForm({ ...userForm, estado_usuario: e.target.value })}
                  >
                    <option value="ACTIVO">Activo</option>
                    <option value="INACTIVO">Inactivo</option>
                  </Select>
                </div>
                <div className="flex justify-end gap-2.5 pt-2">
                  <Button type="button" variant="ghost" onClick={() => setUserModalOpen(false)} className="cursor-pointer">Cancelar</Button>
                  <Button type="submit" variant="primary" className="cursor-pointer">Guardar</Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default UsersSection;
