import React, { useId } from 'react';
import { cn } from '../../utils/cn';

/**
 * Input Component - VEXTOR UI System
 */
const Input = React.forwardRef(({ className, type, label, error, icon: Icon, rightElement, ...props }, ref) => {
  const id = useId();
  return (
    <div className="w-full space-y-1.5 text-left">
      {label && (
        <label
          htmlFor={id}
          className="text-xs font-bold uppercase tracking-wider text-v-gray font-mono block"
        >
          {label}
        </label>
      )}
      <div className="relative group">
        {Icon && (
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-v-gray group-focus-within:text-primary transition-colors duration-200">
            <Icon size={18} />
          </div>
        )}
        <input
          id={id}
          type={type}
          className={cn(
            'flex h-10 sm:h-11 w-full rounded-xl border border-v-dark-border bg-v-dark-soft px-3.5 py-2 text-sm text-v-white font-medium placeholder:text-v-gray/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50 shadow-sm',
            Icon && 'pl-10',
            rightElement && 'pr-10',
            error && 'border-red-500 focus-visible:ring-red-500/20 focus-visible:border-red-500',
            className
          )}
          ref={ref}
          {...props}
        />
        {rightElement && (
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center justify-center">
            {rightElement}
          </div>
        )}
      </div>
      {error && (
        <p className="text-xs font-semibold text-red-500 animate-in fade-in slide-in-from-top-1">
          {error}
        </p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export { Input };
