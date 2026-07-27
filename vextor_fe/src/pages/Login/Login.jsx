import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Truck,
  Activity,
  BarChart3,
  ShieldCheck
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Logo } from '../../components/ui/Logo';
import { Checkbox } from '../../components/ui/Checkbox';
import { useAuth } from '../../context/AuthContext';

/**
 * Login Page
 *
 * Responsabilidad:
 * Proporcionar acceso seguro a los usuarios registrados.
 *
 * Funcionalidades:
 * * Formulario de autenticación (Email/Password).
 * * Validación de campos en tiempo real y al enviar.
 * * Toggle para visualizar contraseña.
 * * Persistencia opcional (Recordarme).
 * * Diseño dividido (Split view) con branding en desktop.
 * * Manejo de estados de carga (Loading) durante el login.
 */
const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};
    if (!formData.email) {
      newErrors.email = 'El correo es obligatorio';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Correo inválido';
    }
    if (!formData.password) {
      newErrors.password = 'La contraseña es obligatoria';
    }
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = validateForm();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setIsLoading(true);

    try {
      await login(formData.email, formData.password);
      navigate('/dashboard');
    } catch {
      setErrors({ form: 'Error al iniciar sesión. Intente de nuevo.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
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
      {/* Left Side - Branding & Info (Hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(0,209,102,0.1),transparent)]" />

        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Logo />
        </motion.div>

        <div className="relative z-10">
          <motion.h1
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-5xl font-bold text-v-white leading-tight mb-6"
          >
            Bienvenido de nuevo a <br />
            <span className="text-primary">Vextor Fleet</span>
          </motion.h1>

          <div className="space-y-6">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.4 + (index * 0.1) }}
                className="flex items-center gap-4 group"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-v-gray-dark border border-white/5 text-primary group-hover:scale-110 transition-transform duration-300">
                  <feature.icon size={20} />
                </div>
                <span className="text-v-gray text-lg group-hover:text-v-white transition-colors">
                  {feature.text}
                </span>
              </motion.div>
            ))}
          </div>
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1 }}
          className="text-v-gray text-sm"
        >
          © 2024 Vextor Technologies. Todos los derechos reservados.
        </motion.p>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-6 sm:p-12 bg-v-dark-soft lg:rounded-l-[40px] shadow-[-20px_0_40px_rgba(0,0,0,0.5)] border-l border-white/5">
        <div className="w-full max-w-md space-y-8">
          <div className="lg:hidden mb-8 flex justify-center">
            <Logo />
          </div>

          <div className="space-y-2 text-center lg:text-left">
            <h2 className="text-3xl font-bold text-v-white tracking-tight">Iniciar sesión</h2>
            <p className="text-v-gray">
              Ingresa tus credenciales para acceder a tu panel de control.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Input
                label="Correo electrónico"
                name="email"
                type="email"
                placeholder="juan@empresa.com"
                icon={Mail}
                value={formData.email}
                onChange={handleChange}
                error={errors.email}
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Input
                label="Contraseña"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                icon={Lock}
                value={formData.password}
                onChange={handleChange}
                error={errors.password}
                rightElement={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-v-gray hover:text-v-white transition-colors focus:outline-none"
                    aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                    tabIndex="-1"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                }
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex items-center justify-between"
            >
              <Checkbox
                label="Recordarme"
                name="rememberMe"
                checked={formData.rememberMe}
                onChange={handleChange}
              />
              <Link to="/forgot-password" size="sm" className="text-sm font-medium text-primary hover:underline">
                ¿Olvidaste tu contraseña?
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="pt-2"
            >
              <Button
                type="submit"
                className="w-full"
                isLoading={isLoading}
              >
                Iniciar sesión <ArrowRight size={18} className="ml-2" />
              </Button>
            </motion.div>
          </form>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-center text-sm text-v-gray"
          >
            ¿No tienes una cuenta?{' '}
            <Link to="/register" className="text-primary hover:underline font-medium">
              Regístrate gratis
            </Link>
          </motion.p>
        </div>
      </div>
    </div>
  );
};

export default Login;
