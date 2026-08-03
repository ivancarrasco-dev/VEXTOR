import React, { useId } from 'react';
import { cn } from '../../utils/cn';
import { Check } from 'lucide-react';

/**
 * Checkbox Component
 *
 * Responsabilidad:
 * Permitir al usuario seleccionar opciones booleanas (activado/desactivado).
 *
 * Utilizado en:
 * * Login page (Recordarme)
 *
 * Funcionalidades:
 * * Input personalizado con estilos de la marca.
 * * Soporta etiqueta (label) vinculada por ID único.
 * * Animaciones de transición para el estado checked.
 */
const Checkbox = React.forwardRef(({ className, label, ...props }, ref) => {
  const id = useId();
  return (
    <div className="flex items-center space-x-2">
      <div className="relative flex items-center">
        <input
          type="checkbox"
          id={id}
          className={cn(
            "peer h-5 w-5 appearance-none rounded border border-v-gray-dark bg-v-dark-soft checked:bg-primary checked:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200 cursor-pointer",
            className
          )}
          ref={ref}
          {...props}
        />
        <Check
          className="absolute h-3.5 w-3.5 text-v-dark-constant pointer-events-none opacity-0 peer-checked:opacity-100 left-0.5 transition-opacity duration-200"
          strokeWidth={3}
        />
      </div>
      {label && (
        <label
          htmlFor={id}
          className="text-sm font-medium text-v-gray cursor-pointer select-none"
        >
          {label}
        </label>
      )}
    </div>
  );
});

Checkbox.displayName = 'Checkbox';

export { Checkbox };
