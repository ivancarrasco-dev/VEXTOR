import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { cn } from '../../../utils/cn';

const UsersSection = ({
  usersList,
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
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-v-dark/20 p-4 rounded-xl border border-v-dark-border/40">
        <div>
          <h4 className="font-bold text-v-white text-sm">Listado General</h4>
          <p className="text-xs text-v-gray mt-0.5">Colaboradores con acceso activo al software de gestión.</p>
        </div>
        <Button variant="primary" size="sm" onClick={handleOpenAddUser} className="flex items-center gap-1.5 shrink-0">
          <Plus size={16} /> Crear Usuario
        </Button>
      </div>

      {/* Users List Table */}
      <div className="border border-v-dark-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-v-dark/40 border-b border-v-dark-border">
                <th className="p-3 text-xs font-bold uppercase text-v-gray">Nombre</th>
                <th className="p-3 text-xs font-bold uppercase text-v-gray">Correo Electrónico</th>
                <th className="p-3 text-xs font-bold uppercase text-v-gray">Rol</th>
                <th className="p-3 text-xs font-bold uppercase text-v-gray">Estado</th>
                <th className="p-3 text-xs font-bold uppercase text-v-gray text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-v-dark-border">
              {usersList.map((usr) => (
                <tr key={usr.id} className="hover:bg-v-dark/10 transition-colors">
                  <td className="p-3 font-semibold text-v-white text-sm">{usr.name}</td>
                  <td className="p-3 text-v-gray text-sm">{usr.email}</td>
                  <td className="p-3 text-v-white text-sm">
                    <span className="px-2.5 py-1 bg-v-dark border border-v-dark-border rounded-lg text-xs font-medium text-primary">
                      {usr.role}
                    </span>
                  </td>
                  <td className="p-3">
                    <button
                      type="button"
                      onClick={() => handleUserToggleStatus(usr.id)}
                      className={cn(
                        "text-xs font-bold px-2 py-0.5 rounded-full uppercase border cursor-pointer",
                        usr.status === 'ACTIVO'
                          ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                          : "bg-red-500/10 text-red-500 border-red-500/20"
                      )}
                    >
                      {usr.status === 'ACTIVO' ? 'Activo' : 'Inactivo'}
                    </button>
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex justify-end gap-1.5">
                      <button
                        onClick={() => handleOpenEditUser(usr)}
                        className="p-1 hover:bg-v-dark rounded text-v-gray hover:text-v-white transition-colors text-xs font-medium"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDeleteUser(usr.id)}
                        className="p-1 hover:bg-red-500/10 rounded text-red-400 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
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
              <h4 className="text-lg font-bold text-v-white">
                {isEditingUser ? 'Editar Usuario' : 'Crear Nuevo Usuario'}
              </h4>
              <form onSubmit={handleSaveUser} className="space-y-4">
                <Input
                  label="Nombre Completo"
                  required
                  value={userForm.name}
                  onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                />
                <Input
                  label="Correo Electrónico"
                  type="email"
                  required
                  value={userForm.email}
                  onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                />
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-v-gray">Rol del Sistema</label>
                  <Select
                    value={userForm.role}
                    onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
                  >
                    <option value="Administrador">Administrador</option>
                    <option value="Gestor de Flota">Gestor de Flota</option>
                    <option value="Conductor">Conductor</option>
                    <option value="Auditor">Auditor</option>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-v-gray">Estado</label>
                  <Select
                    value={userForm.status}
                    onChange={(e) => setUserForm({ ...userForm, status: e.target.value })}
                  >
                    <option value="ACTIVO">Activo</option>
                    <option value="INACTIVO">Inactivo</option>
                  </Select>
                </div>
                <div className="flex justify-end gap-2.5 pt-2">
                  <Button type="button" variant="ghost" onClick={() => setUserModalOpen(false)}>Cancelar</Button>
                  <Button type="submit" variant="primary">Guardar</Button>
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
