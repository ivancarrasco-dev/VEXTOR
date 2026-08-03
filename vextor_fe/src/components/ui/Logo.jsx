import { cn } from '../../utils/cn';
import logoFull from '../../assets/brand/logo-full.png';
import logoFullBlack from '../../assets/brand/logo Negro Vextor Sin Fondo.png';
import isotipo from '../../assets/brand/isotipo.png';
import { useTheme } from '../../context/ThemeContext';

/**
 * Logo Component
 *
 * Responsabilidad:
 * Renderizar la identidad visual oficial de Vextor de forma consistente,
 * adaptando el color del logotipo completo al modo de tema actual (claro/oscuro).
 *
 * Utilizado en:
 * * LandingNavbar
 * * LandingFooter
 * * Login / Register pages
 * * Sidebar (Modo colapsado y expandido)
 *
 * Funcionalidades:
 * * Variantes: 'full' (Logo completo) e 'iso' (Isotipo solo).
 * * Tamaños: 'sm', 'md', 'lg'.
 * * Adaptabilidad: cambia automáticamente entre logotipo blanco (dark mode) y logotipo negro (light mode).
 * * Centraliza la ruta de los assets de marca.
 */
const Logo = ({ className, variant = 'full', size = 'md' }) => {
  const { theme } = useTheme();

  const sizes = {
    sm: variant === 'iso' ? 'h-8 w-8' : 'h-8',
    md: variant === 'iso' ? 'h-10 w-10' : 'h-10',
    lg: variant === 'iso' ? 'h-16 w-16' : 'h-16',
  };

  const logoSrc = variant === 'iso'
    ? isotipo
    : (theme === 'dark' ? logoFull : logoFullBlack);

  return (
    <div className={cn("flex items-center", className)}>
      <img
        src={logoSrc}
        alt={variant === 'full' ? "Vextor Logo" : "Vextor Isotipo"}
        className={cn("object-contain", sizes[size])}
      />
    </div>
  );
};

export { Logo };
