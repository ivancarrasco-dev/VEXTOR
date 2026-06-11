import React from 'react';
import { cn } from '../../utils/cn';
import { Loader2 } from 'lucide-react';

/**
 * Button Component
 *
 * Responsabilidad:
 * Proporcionar un elemento de acción interactivo con múltiples variantes visuales y estados.
 *
 * Utilizado en:
 * * LandingNavbar
 * * HeroSection
 * * CTASection
 * * Login / Register pages
 * * Sidebar
 *
 * Funcionalidades:
 * * Variantes: primary, outline, ghost, link.
 * * Tamaños: default, sm, lg, icon.
 * * Estado de carga (Loading) con spinner.
 * * Micro-interacción de escalado al hacer click.
 */
const Button = React.forwardRef(({ className, variant = 'primary', size = 'default', isLoading, children, disabled, ...props }, ref) => {
  const variants = {
    primary: 'bg-primary text-v-dark hover:bg-primary-hover shadow-[0_0_15px_rgba(0,209,102,0.3)]',
    outline: 'border border-v-gray-dark bg-transparent hover:bg-v-gray-dark text-v-white',
    ghost: 'bg-transparent hover:bg-v-gray-dark/50 text-v-gray',
    link: 'text-primary underline-offset-4 hover:underline'
  };

  const sizes = {
    default: 'h-11 px-6 py-2',
    sm: 'h-9 px-3',
    lg: 'h-12 px-8 text-lg',
    icon: 'h-10 w-10',
  };

  return (
    <button
      className={cn(
        'inline-flex items-center justify-center rounded-lg text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]',
        variants[variant],
        sizes[size],
        className
      )}
      ref={ref}
      disabled={isLoading || disabled}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : null}
      {children}
    </button>
  );
});

Button.displayName = 'Button';

export { Button };
