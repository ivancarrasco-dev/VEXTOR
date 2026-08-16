import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, ArrowRight, ArrowLeft, CheckCircle2, ShieldCheck, Truck, Activity, BarChart3 } from 'lucide-react';
import axios from 'axios';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Logo } from '../../components/ui/Logo';

/**
 * ForgotPassword Page
 *
 * Responsabilidad:
 * Permitir solicitar un enlace seguro para restablecer la contraseña.
 */
const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('El correo electrónico es obligatorio');
      return;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Ingrese un correo electrónico válido');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      const response = await axios.post('http://localhost:8000/api/auth/forgot-password', {
        email: email.trim()
      });
      setMessage(response.data?.message || 'Si existe una cuenta asociada a este correo, recibirás instrucciones para restablecer tu contraseña.');
      setIsSubmitted(true);
    } catch (err) {
      setError(err.response?.data?.detail || 'Ocurrió un error al procesar la solicitud.');
    } finally {
      setIsLoading(false);
    }
  };

  const features = [
    { icon: Truck, text: 'Gestión inteligente de flotas' },
    { icon: Activity, text: 'Seguimiento operativo en tiempo real' },
    { icon: ShieldCheck, text: 'Control de mantenimiento preventivo' },
    { icon: BarChart3, text: 'Reportes y analítica avanzada' }
  ];

  return (
    <div className="flex min-h-screen bg-v-dark overflow-hidden">
      {/* Left Side - Branding & Info */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(0,209,102,0.1),transparent)]" />

        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="relative z-10">
          <Link to="/" className="inline-block">
            <Logo />
          </Link>
        </motion.div>

        <div className="relative z-10">
          <motion.h1 initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.2 }} className="text-5xl font-bold text-v-white leading-tight mb-6">
            Recupera el acceso a <br />
            <span className="text-primary">tu cuenta de Vextor</span>
          </motion.h1>

          <div className="space-y-6">
            {features.map((feature, index) => (
              <motion.div key={index} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4, delay: 0.4 + index * 0.1 }} className="flex items-center gap-4 group">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-v-gray-dark border border-white/5 text-primary group-hover:scale-110 transition-transform duration-300">
                  <feature.icon size={20} />
                </div>
                <span className="text-v-gray text-lg group-hover:text-v-white transition-colors">{feature.text}</span>
              </motion.div>
            ))}
          </div>
        </div>

        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1, delay: 1 }} className="text-v-gray text-sm">
          © 2026 Vextor Technologies. Todos los derechos reservados.
        </motion.p>
      </div>

      {/* Right Side - Request Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-6 sm:p-12 bg-v-dark-soft lg:rounded-l-[40px] shadow-[-20px_0_40px_rgba(0,0,0,0.5)] border-l border-white/5">
        <div className="w-full max-w-md space-y-8">
          <div className="lg:hidden mb-8 flex justify-center">
            <Link to="/">
              <Logo />
            </Link>
          </div>

          <div className="space-y-2 text-center lg:text-left">
            <h2 className="text-3xl font-bold text-v-white tracking-tight">¿Olvidaste tu contraseña?</h2>
            <p className="text-v-gray text-sm">
              Ingresa el correo electrónico asociado a tu cuenta. Te enviaremos las instrucciones para restablecerla.
            </p>
          </div>

          {isSubmitted ? (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="p-6 bg-v-dark-gray/40 border border-primary/20 rounded-2xl text-center space-y-4">
              <div className="flex justify-center">
                <div className="h-12 w-12 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center text-primary">
                  <CheckCircle2 size={28} />
                </div>
              </div>
              <p className="text-v-white text-sm leading-relaxed">{message}</p>
              <Link to="/login" className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline pt-2">
                <ArrowLeft size={16} /> Volver al inicio de sesión
              </Link>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl">
                  {error}
                </div>
              )}

              <Input
                label="Correo electrónico"
                name="email"
                type="email"
                placeholder="juan@empresa.com"
                icon={Mail}
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError('');
                }}
                error={error}
              />

              <Button type="submit" className="w-full" isLoading={isLoading}>
                Enviar instrucciones <ArrowRight size={18} className="ml-2" />
              </Button>

              <div className="text-center pt-2">
                <Link to="/login" className="inline-flex items-center gap-2 text-sm text-v-gray hover:text-v-white transition-colors">
                  <ArrowLeft size={16} /> Volver al inicio de sesión
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
