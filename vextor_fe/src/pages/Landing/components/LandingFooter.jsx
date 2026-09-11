import { Mail, Phone, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Logo } from '../../../components/ui/Logo';

/**
 * LandingFooter Component
 *
 * Responsabilidad:
 * Pie de página oficial de VEXTOR con enlaces navegables, datos corporativos e identidad de marca.
 */
const LandingFooter = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-v-dark-soft border-t border-v-dark-border pt-16 pb-12 transition-colors duration-300">
      <div className="container mx-auto px-4 sm:px-6">

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-12 mb-14">

          {/* MARCA E INFORMACIÓN */}
          <div className="col-span-1 lg:col-span-1">
            <Link to="/" className="inline-block mb-4">
              <Logo size="sm" />
            </Link>
            <p className="text-v-gray text-xs sm:text-sm leading-relaxed mb-6 font-normal">
              Plataforma tecnológica para la gestión integral de flotas, control de conductores, programación de rutas y mantenimiento preventivo.
            </p>
          </div>

          {/* NAVEGACIÓN RÁPIDA */}
          <div>
            <h4 className="text-v-white font-bold text-xs uppercase tracking-wider mb-4">Navegación</h4>
            <ul className="space-y-2.5 text-xs sm:text-sm">
              <li>
                <a href="/#inicio" className="text-v-gray hover:text-[#124A2F] dark:hover:text-[#A6C98F] transition-colors font-medium">
                  Inicio
                </a>
              </li>
              <li>
                <a href="/#funciones" className="text-v-gray hover:text-[#124A2F] dark:hover:text-[#A6C98F] transition-colors font-medium">
                  Funciones
                </a>
              </li>
              <li>
                <a href="/#beneficios" className="text-v-gray hover:text-[#124A2F] dark:hover:text-[#A6C98F] transition-colors font-medium">
                  Beneficios
                </a>
              </li>
              <li>
                <Link to="/contacto" className="text-v-gray hover:text-[#124A2F] dark:hover:text-[#A6C98F] transition-colors font-medium">
                  Contacto
                </Link>
              </li>
            </ul>
          </div>

          {/* ACCESO A PLATAFORMA */}
          <div>
            <h4 className="text-v-white font-bold text-xs uppercase tracking-wider mb-4">Plataforma</h4>
            <ul className="space-y-2.5 text-xs sm:text-sm">
              <li>
                <Link to="/login" className="text-v-gray hover:text-[#124A2F] dark:hover:text-[#A6C98F] transition-colors font-medium">
                  Iniciar Sesión
                </Link>
              </li>
              <li>
                <Link to="/register" className="text-v-gray hover:text-[#124A2F] dark:hover:text-[#A6C98F] transition-colors font-medium">
                  Crear Cuenta
                </Link>
              </li>
              <li>
                <a href="/#producto" className="text-v-gray hover:text-[#124A2F] dark:hover:text-[#A6C98F] transition-colors font-medium">
                  Demostración de Módulos
                </a>
              </li>
            </ul>
          </div>

          {/* INFORMACIÓN DE CONTACTO */}
          <div>
            <h4 className="text-v-white font-bold text-xs uppercase tracking-wider mb-4">Contacto</h4>
            <ul className="space-y-3 text-xs sm:text-sm">
              <li className="flex items-center gap-2.5 text-v-gray font-medium">
                <Mail className="w-4 h-4 text-[#124A2F] dark:text-[#A6C98F] shrink-0" />
                <span>contacto@vextor.com</span>
              </li>
              <li className="flex items-center gap-2.5 text-v-gray font-medium">
                <Phone className="w-4 h-4 text-[#124A2F] dark:text-[#A6C98F] shrink-0" />
                <span>+57 (601) 123-4567</span>
              </li>
              <li className="flex items-center gap-2.5 text-v-gray font-medium">
                <MapPin className="w-4 h-4 text-[#124A2F] dark:text-[#A6C98F] shrink-0" />
                <span>Bogotá, Colombia</span>
              </li>
            </ul>
          </div>

        </div>

        {/* COPYRIGHT */}
        <div className="pt-8 border-t border-v-dark-border flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-v-gray font-medium">
          <p>© {currentYear} VEXTOR. Todos los derechos reservados.</p>
          <div className="flex items-center gap-6">
            <span className="hover:text-v-white cursor-pointer transition-colors">Términos y Condiciones</span>
            <span className="hover:text-v-white cursor-pointer transition-colors">Política de Privacidad</span>
          </div>
        </div>

      </div>
    </footer>
  );
};

export default LandingFooter;
