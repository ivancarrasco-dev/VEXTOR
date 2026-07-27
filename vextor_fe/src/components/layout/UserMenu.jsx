import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, User, Settings, LogOut, Shield } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

/**
 * UserMenu Component
 *
 * Responsabilidad:
 * Proporcionar acceso al perfil del usuario, ajustes y cierre de sesión.
 *
 * Utilizado en:
 * * Navbar
 *
 * Funcionalidades:
 * * Toggle de menú con información del usuario.
 * * Dropdown animado con opciones administrativas.
 * * Botón de cierre de sesión con estilo de alerta.
 */
const UserMenu = () => {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  if (!user) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 p-1.5 rounded-xl hover:bg-v-dark-border transition-all duration-200"
      >
        <div className="h-10 w-10 rounded-lg bg-primary/20 flex items-center justify-center text-primary font-bold border border-primary/20">
          {user.avatar}
        </div>
        <div className="hidden lg:block text-left">
          <p className="text-sm font-semibold text-v-white leading-none mb-1">{user.name}</p>
          <p className="text-[11px] text-v-gray font-medium uppercase tracking-wider">{user.role}</p>
        </div>
        <ChevronDown size={16} className={`text-v-gray transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute right-0 mt-2 w-56 bg-v-dark-soft border border-v-dark-border rounded-2xl shadow-2xl z-20 overflow-hidden py-2"
            >
              <div className="px-4 py-3 border-b border-v-dark-border mb-2">
                <p className="text-xs text-v-gray font-medium uppercase tracking-widest mb-1">Cuenta</p>
                <p className="text-sm text-v-white truncate">{user.email}</p>
              </div>

              <button className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-v-gray hover:text-v-white hover:bg-v-dark-border transition-colors">
                <User size={18} />
                <span>Mi Perfil</span>
              </button>
              <button className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-v-gray hover:text-v-white hover:bg-v-dark-border transition-colors">
                <Shield size={18} />
                <span>Seguridad</span>
              </button>
              <button className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-v-gray hover:text-v-white hover:bg-v-dark-border transition-colors">
                <Settings size={18} />
                <span>Ajustes</span>
              </button>

              <div className="h-px bg-v-dark-border my-2" />

              <button
                onClick={logout}
                className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
              >
                <LogOut size={18} />
                <span>Cerrar Sesión</span>
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default UserMenu;
