import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  Truck,
  Activity,
  BarChart3
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Logo } from '../../components/ui/Logo';
import { HeroMapPanel } from '../../components/ui/HeroMapPanel';
import { useAuth } from '../../context/AuthContext';

/**
 * Register Page
 *
 * Responsabilidad:
 * Permitir el alta de nuevos usuarios en la plataforma Vextor.
 *
 * Funcionalidades:
 * * Formulario de registro a la izquierda (Nombre, Email, Password, Confirmación).
 * * Lado derecho ocupado por el mapa interactivo/visual con la misma implementación del Hero.
 * * Validación de coincidencia de contraseñas.
 * * Validación de formato de correo y longitud de contraseña.
 * * Toggle global para visibilidad de contraseñas.
 * * Diseño dividido (Split view) responsive.
 * * Microinteracciones y estados de carga.
 */
const Register = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};
    if (!formData.fullName.trim() || formData.fullName.trim().length < 2) {
      newErrors.fullName = 'El nombre completo es obligatorio (mínimo 2 caracteres)';
    }
    if (!formData.email.trim()) {
      newErrors.email = 'El correo es obligatorio';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      newErrors.email = 'Ingrese un correo electrónico válido';
    }
    if (!formData.password) {
      newErrors.password = 'La contraseña es obligatoria';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Mínimo 8 caracteres';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = 'Debe incluir al menos una mayúscula, minúscula y número';
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Las contraseñas no coinciden';
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
      await register({
        fullName: formData.fullName,
        email: formData.email,
        password: formData.password
      });
      navigate('/dashboard');
    } catch (err) {
      setErrors({ form: err.message || 'Error al crear la cuenta.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
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
      {/* Left Side - Registration Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-between p-6 sm:p-12 bg-v-dark-soft z-10 border-r border-white/5 relative">
        <div className="flex items-center justify-between mb-8">
          <Link to="/" className="inline-block">
            <Logo />
          </Link>
        </div>

        <div className="w-full max-w-md mx-auto space-y-8 my-auto">
          <div className="space-y-2 text-center lg:text-left">
            <h2 className="text-3xl font-bold text-v-white tracking-tight">Crear cuenta</h2>
            <p className="text-v-gray">
              Empieza a gestionar tu flota de manera profesional hoy mismo.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {errors.form && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl">
                {errors.form}
              </div>
            )}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Input
                label="Nombre completo"
                name="fullName"
                placeholder="Juan Pérez"
                icon={User}
                value={formData.fullName}
                onChange={handleChange}
                error={errors.fullName}
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
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
              transition={{ delay: 0.3 }}
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
              transition={{ delay: 0.4 }}
            >
              <Input
                label="Confirmar contraseña"
                name="confirmPassword"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                icon={ShieldCheck}
                value={formData.confirmPassword}
                onChange={handleChange}
                error={errors.confirmPassword}
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="pt-2"
            >
              <Button
                type="submit"
                className="w-full"
                isLoading={isLoading}
              >
                Crear cuenta <ArrowRight size={18} className="ml-2" />
              </Button>
            </motion.div>
          </form>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-center text-sm text-v-gray"
          >
            ¿Ya tienes una cuenta?{' '}
            <Link to="/login" className="text-primary hover:underline font-medium">
              Inicia sesión
            </Link>
          </motion.p>
        </div>

        <div className="mt-8 pt-4 text-center lg:text-left text-v-gray text-xs">
          © 2026 Vextor Technologies. Todos los derechos reservados.
        </div>
      </div>

      {/* Right Side - Hero Map Background */}
      <div className="hidden lg:flex lg:w-1/2 relative flex-col justify-between p-12 overflow-hidden">
        {/* Componente del mapa exacto del Hero */}
        <div className="absolute inset-0 z-0">
          <HeroMapPanel />
        </div>

        {/* Overlay con contenido informativo sobre el mapa */}
        <div className="relative z-10 flex flex-col justify-between h-full pointer-events-none">
          <div></div>

          <div>
            <motion.h1
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-4xl xl:text-5xl font-bold text-v-white leading-tight mb-6"
            >
              Optimiza tu flota con <br />
              <span className="text-[#124A2F] dark:text-[#A6C98F]">inteligencia operativa</span>
            </motion.h1>

            <div className="space-y-4 max-w-lg">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.4 + (index * 0.1) }}
                  className="flex items-center gap-3.5 group bg-v-dark/40 dark:bg-v-dark/60 backdrop-blur-md p-3 rounded-xl border border-white/10"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#124A2F]/20 dark:bg-[#A6C98F]/20 text-[#124A2F] dark:text-[#A6C98F] border border-[#124A2F]/30 dark:border-[#A6C98F]/30 shrink-0">
                    <feature.icon size={18} />
                  </div>
                  <span className="text-v-gray text-sm xl:text-base font-medium group-hover:text-v-white transition-colors">
                    {feature.text}
                  </span>
                </motion.div>
              ))}
            </div>
          </div>

          <div></div>
        </div>
      </div>
    </div>
  );
};

export default Register;
