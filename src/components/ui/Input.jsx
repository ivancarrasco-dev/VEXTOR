import React, { useId } from 'react';
import { cn } from '../../utils/cn';

/**
 * Input Component
 *
 * Responsabilidad:
 * Campo de texto estándar para recolección de datos con soporte para iconos y errores.
 *
 * Utilizado en:
 * * Login page
 * * Register page
 * * Formularios generales
 *
 * Funcionalidades:
 * * Soporte para iconos a la izquierda.
 * * Soporte para elementos personalizados a la derecha (ej. toggle password).
 * * Visualización de mensajes de error.
 * * Estados focus con colores de marca.
 */
const Input = React.forwardRef(({ className, type, label, error, icon: Icon, rightElement, ...props }, ref) => {
  const id = useId();
  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label
          htmlFor={id}
          className="text-sm font-medium text-v-gray leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          {label}
        </label>
      )}
      <div className="relative group">
        {Icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-v-gray group-focus-within:text-primary transition-colors duration-200">
            <Icon size={18} />
          </div>
        )}
        <input
          id={id}
          type={type}
          className={cn(
            'flex h-11 w-full rounded-lg border border-v-gray-dark bg-v-dark-soft px-3 py-2 text-sm text-v-white ring-offset-v-dark file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-v-gray focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50',
            Icon && 'pl-10',
            rightElement && 'pr-10',
            error && 'border-red-500 focus-visible:ring-red-500/20 focus-visible:border-red-500',
            className
          )}
          ref={ref}
          {...props}
        />
        {rightElement && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center">
            {rightElement}
          </div>
        )}
      </div>
      {error && (
        <p className="text-xs font-medium text-red-500 animate-in fade-in slide-in-from-top-1">
          {error}
        </p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export { Input };
