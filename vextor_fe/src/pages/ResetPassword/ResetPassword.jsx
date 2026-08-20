import { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, Eye, EyeOff, ShieldCheck, ArrowRight, CheckCircle2, AlertCircle, Check, X } from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL } from '../../config/api';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Logo } from '../../components/ui/Logo';

/**
 * ResetPassword Page
 *
 * Responsabilidad:
 * Permitir ingresar una nueva contraseña validando el token de recuperación.
 */
const ResetPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [isVerifying, setIsVerifying] = useState(true);
  const [isTokenValid, setIsTokenValid] = useState(false);
  const [tokenError, setTokenError] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [formError, setFormError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Validate token on component mount
  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setIsTokenValid(false);
        setTokenError('El enlace de recuperación es inválido o no contiene un token.');
        setIsVerifying(false);
        return;
      }

      try {
        await axios.post(`${API_BASE_URL}/api/auth/verify-reset-token`, { token });
        setIsTokenValid(true);
      } catch (err) {
        setIsTokenValid(false);
        setTokenError(err.response?.data?.detail || 'El enlace de recuperación es inválido o ha expirado.');
      } finally {
        setIsVerifying(false);
      }
    };

    verifyToken();
  }, [token]);

  // Password requirements rules
  const requirements = [
    { label: 'Al menos 8 caracteres', pass: newPassword.length >= 8 },
    { label: 'Una letra mayúscula', pass: /[A-Z]/.test(newPassword) },
    { label: 'Una letra minúscula', pass: /[a-z]/.test(newPassword) },
    { label: 'Un número', pass: /\d/.test(newPassword) },
    { label: 'Las contraseñas coinciden', pass: newPassword.length > 0 && newPassword === confirmPassword }
  ];

  const allRequirementsMet = requirements.every(r => r.pass);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!allRequirementsMet) {
      setFormError('Cumpla con todos los requisitos de contraseña antes de continuar.');
      return;
    }

    setFormError('');
    setIsLoading(true);

    try {
      await axios.post(`${API_BASE_URL}/api/auth/reset-password`, {
        token,
        newPassword
      });
      setIsSuccess(true);
    } catch (err) {
      setFormError(err.response?.data?.detail || 'No se pudo restablecer la contraseña. Intente nuevamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-v-dark overflow-hidden">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(0,209,102,0.1),transparent)]" />

        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="relative z-10">
          <Link to="/" className="inline-block">
            <Logo />
          </Link>
        </motion.div>

        <div className="relative z-10">
          <motion.h1 initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.2 }} className="text-5xl font-bold text-v-white leading-tight mb-6">
            Establece tu <br />
            <span className="text-primary">nueva contraseña</span>
          </motion.h1>
          <p className="text-v-gray text-lg max-w-md">
            Garantiza la seguridad de tu flota actualizando tu clave de acceso con nuestros estándares de protección.
          </p>
        </div>

        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1, delay: 1 }} className="text-v-gray text-sm">
          © 2026 Vextor Technologies. Todos los derechos reservados.
        </motion.p>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-6 sm:p-12 bg-v-dark-soft lg:rounded-l-[40px] shadow-[-20px_0_40px_rgba(0,0,0,0.5)] border-l border-white/5">
        <div className="w-full max-w-md space-y-8">
          <div className="lg:hidden mb-8 flex justify-center">
            <Link to="/">
              <Logo />
            </Link>
          </div>

          <div className="space-y-2 text-center lg:text-left">
            <h2 className="text-3xl font-bold text-v-white tracking-tight">Restablecer contraseña</h2>
            <p className="text-v-gray text-sm">
              Crea una contraseña segura para tu cuenta en Vextor.
            </p>
          </div>

          {/* Verification Loading */}
          {isVerifying ? (
            <div className="p-8 text-center text-v-gray space-y-3">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
              <p className="text-sm">Verificando enlace de recuperación...</p>
            </div>
          ) : !isTokenValid ? (
            /* Invalid or Expired Token Alert */
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="p-6 bg-red-500/10 border border-red-500/20 rounded-2xl text-center space-y-4">
              <div className="flex justify-center">
                <div className="h-12 w-12 rounded-full bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400">
                  <AlertCircle size={28} />
                </div>
              </div>
              <h3 className="text-lg font-bold text-v-white">Enlace no válido</h3>
              <p className="text-v-gray text-sm leading-relaxed">{tokenError}</p>
              <div className="pt-2">
                <Button onClick={() => navigate('/forgot-password')} className="w-full">
                  Solicitar un nuevo enlace
                </Button>
              </div>
            </motion.div>
          ) : isSuccess ? (
            /* Success Card */
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="p-6 bg-v-dark-gray/40 border border-primary/20 rounded-2xl text-center space-y-4">
              <div className="flex justify-center">
                <div className="h-12 w-12 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center text-primary">
                  <CheckCircle2 size={28} />
                </div>
              </div>
              <h3 className="text-lg font-bold text-v-white">¡Contraseña actualizada!</h3>
              <p className="text-v-gray text-sm leading-relaxed">
                Tu contraseña ha sido restablecida exitosamente. Todas las sesiones activas han sido cerradas por seguridad.
              </p>
              <div className="pt-2">
                <Button onClick={() => navigate('/login')} className="w-full">
                  Iniciar sesión <ArrowRight size={18} className="ml-2" />
                </Button>
              </div>
            </motion.div>
          ) : (
            /* Reset Form */
            <form onSubmit={handleSubmit} className="space-y-5">
              {formError && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl">
                  {formError}
                </div>
              )}

              <Input
                label="Nueva contraseña"
                name="newPassword"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                icon={Lock}
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  setFormError('');
                }}
                rightElement={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-v-gray hover:text-v-white transition-colors focus:outline-none"
                    aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    tabIndex="-1"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                }
              />

              <Input
                label="Confirmar nueva contraseña"
                name="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                icon={ShieldCheck}
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setFormError('');
                }}
              />

              {/* Security indicators */}
              <div className="p-4 bg-v-dark/40 border border-v-dark-border rounded-xl space-y-2">
                <p className="text-xs font-semibold text-v-gray uppercase tracking-wider mb-2">Requisitos de la contraseña:</p>
                {requirements.map((req, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-xs">
                    {req.pass ? (
                      <Check size={14} className="text-primary shrink-0" />
                    ) : (
                      <X size={14} className="text-v-gray/40 shrink-0" />
                    )}
                    <span className={req.pass ? 'text-v-white font-medium' : 'text-v-gray'}>
                      {req.label}
                    </span>
                  </div>
                ))}
              </div>

              <Button type="submit" className="w-full" isLoading={isLoading} disabled={!allRequirementsMet}>
                Actualizar contraseña <ArrowRight size={18} className="ml-2" />
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
