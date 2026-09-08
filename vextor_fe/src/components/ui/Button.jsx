import React from 'react';
import { cn } from '../../utils/cn';
import { Loader2 } from 'lucide-react';

/**
 * Button Component - VEXTOR UI System
 */
const Button = React.forwardRef(({
  className,
  variant = 'primary',
  size = 'default',
  isLoading,
  children,
  disabled,
  ...props
}, ref) => {
  const variants = {
    primary: 'bg-primary text-white dark:text-[#0B3522] font-extrabold hover:opacity-90 shadow-[0_2px_10px_var(--primary-color-shadow)]',
    secondary: 'bg-[#DDEBD5] text-[#124A2F] dark:bg-[#1A5235] dark:text-[#A6C98F] font-bold hover:opacity-90',
    outline: 'border border-v-dark-border bg-transparent hover:bg-v-dark-border/50 text-v-white font-semibold',
    ghost: 'bg-transparent hover:bg-v-dark-border/40 text-v-gray hover:text-v-white font-medium',
    link: 'text-primary underline-offset-4 hover:underline font-semibold p-0 h-auto'
  };

  const sizes = {
    default: 'h-10 px-5 py-2 text-xs sm:text-sm',
    sm: 'h-8 px-3 text-xs',
    lg: 'h-12 px-7 text-sm sm:text-base font-bold',
    icon: 'h-9 w-9 p-0',
  };

  return (
    <button
      className={cn(
        'inline-flex items-center justify-center rounded-xl font-sans transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98] cursor-pointer shrink-0 select-none',
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
