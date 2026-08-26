import { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, ShieldAlert, ArrowRight } from 'lucide-react';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import { API_BASE_URL } from '../../config/api';

const ForcedPasswordModal = () => {
  const { user, setUser } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('La confirmación de la nueva contraseña no coincide.');
      return;
    }

    if (newPassword.length < 8) {
      setError('La nueva contraseña debe tener al menos 8 caracteres.');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      await axios.post(`${API_BASE_URL}/api/auth/change-password`, {
        current_password: currentPassword,
        new_password: newPassword
      });

      // Update current user state
      if (user) {
        setUser({ ...user, must_change_password: false });
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al cambiar la contraseña.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-v-dark-soft border border-amber-500/30 p-6 sm:p-8 rounded-2xl w-full max-w-md shadow-2xl space-y-6"
      >
        <div className="flex items-center gap-3 border-b border-v-dark-border pb-4">
          <div className="p-3 bg-amber-500/10 text-amber-500 rounded-xl">
            <ShieldAlert size={24} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-v-white">Cambio de Contraseña Requerido</h3>
            <p className="text-xs text-v-gray mt-0.5">
              Por razones de seguridad, debes actualizar tu contraseña temporal antes de continuar.
            </p>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Contraseña Actual / Temporal"
            type="password"
            icon={Lock}
            required
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
          />

          <Input
            label="Nueva Contraseña"
            type="password"
            icon={Lock}
            required
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Mínimo 8 caracteres (A-z, 0-9)"
          />

          <Input
            label="Confirmar Nueva Contraseña"
            type="password"
            icon={Lock}
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />

          <Button type="submit" variant="primary" className="w-full mt-2" isLoading={isLoading}>
            Actualizar y Continuar <ArrowRight size={18} className="ml-2" />
          </Button>
        </form>
      </motion.div>
    </div>
  );
};

export default ForcedPasswordModal;
