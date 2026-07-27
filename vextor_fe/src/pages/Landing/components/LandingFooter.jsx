import { Mail, Phone, MapPin, Globe, Share2 } from 'lucide-react';
import { Logo } from '../../../components/ui/Logo';

const LandingFooter = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-v-dark border-t border-v-dark-border pt-20 pb-10">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-20">
          {/* Brand Info */}
          <div className="col-span-1 lg:col-span-1">
            <div className="mb-6">
              <Logo size="sm" />
            </div>
            <p className="text-v-gray mb-8 leading-relaxed">
              La plataforma líder en gestión operativa para empresas de transporte especial. Digitalización, control y eficiencia en una sola solución.
            </p>
            <div className="flex items-center gap-4">
              <SocialIcon icon={Globe} />
              <SocialIcon icon={Share2} />
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-v-white font-bold mb-6">Plataforma</h4>
            <ul className="space-y-4">
              <FooterLink label="Inicio" />
              <FooterLink label="Funciones" />
              <FooterLink label="Mantenimiento" />
              <FooterLink label="Gestión de Flotas" />
              <FooterLink label="Reportes" />
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-v-white font-bold mb-6">Empresa</h4>
            <ul className="space-y-4">
              <FooterLink label="Sobre Nosotros" />
              <FooterLink label="Casos de Éxito" />
              <FooterLink label="Precios" />
              <FooterLink label="Blog" />
              <FooterLink label="Contacto" />
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-v-white font-bold mb-6">Contacto</h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3 text-v-gray">
                <Mail className="w-5 h-5 text-primary shrink-0" />
                <span>contacto@vextor.com</span>
              </li>
              <li className="flex items-start gap-3 text-v-gray">
                <Phone className="w-5 h-5 text-primary shrink-0" />
                <span>+57 (601) 123-4567</span>
              </li>
              <li className="flex items-start gap-3 text-v-gray">
                <MapPin className="w-5 h-5 text-primary shrink-0" />
                <span>Bogotá, Colombia</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-10 border-t border-v-dark-border flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-v-gray/60 text-sm">
            © {currentYear} Vextor - Todos los derechos reservados.
          </p>
          <div className="flex items-center gap-8 text-sm text-v-gray/60">
            <a href="#" className="hover:text-primary transition-colors">Política de Privacidad</a>
            <a href="#" className="hover:text-primary transition-colors">Términos de Servicio</a>
            <a href="#" className="hover:text-primary transition-colors">Cookies</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

const SocialIcon = ({ icon: Icon }) => (
  <a href="#" className="w-10 h-10 rounded-full bg-v-dark-soft border border-v-dark-border flex items-center justify-center text-v-gray hover:text-primary hover:border-primary/30 transition-all">
    <Icon size={18} />
  </a>
);

const FooterLink = ({ label }) => (
  <li>
    <a href="#" className="text-v-gray hover:text-primary transition-colors">
      {label}
    </a>
  </li>
);

export default LandingFooter;
