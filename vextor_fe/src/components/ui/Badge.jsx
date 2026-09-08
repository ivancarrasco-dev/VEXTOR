import React from 'react';
import { cn } from '../../utils/cn';

/**
 * Badge Component - VEXTOR UI System
 */
const Badge = React.forwardRef(({
  className,
  variant = 'neutral',
  size = 'sm',
  pulse = false,
  dot = false,
  children,
  ...props
}, ref) => {
  const variants = {
    success: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20',
    info: 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20',
    warning: 'bg-amber-500/10 text-amber-800 dark:text-amber-300 border-amber-500/20',
    danger: 'bg-red-500/10 text-red-700 dark:text-red-300 border-red-500/20',
    purple: 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20',
    neutral: 'bg-v-dark-border/50 text-v-gray border-v-dark-border',
    primary: 'bg-primary/10 text-primary border-primary/25'
  };

  const dotColors = {
    success: 'bg-emerald-500 dark:bg-emerald-400',
    info: 'bg-blue-500 dark:bg-blue-400',
    warning: 'bg-amber-500 dark:bg-amber-400',
    danger: 'bg-red-500 dark:bg-red-400',
    purple: 'bg-purple-500 dark:bg-purple-400',
    neutral: 'bg-v-gray',
    primary: 'bg-primary'
  };

  const sizes = {
    xs: 'text-[10px] px-2 py-0.5 gap-1 font-bold',
    sm: 'text-xs px-2.5 py-1 gap-1.5 font-bold',
    md: 'text-xs sm:text-sm px-3 py-1.5 gap-2 font-bold'
  };

  return (
    <span
      ref={ref}
      className={cn(
        'inline-flex items-center rounded-lg border uppercase tracking-wider transition-colors shrink-0 select-none font-mono',
        variants[variant] || variants.neutral,
        sizes[size] || sizes.sm,
        className
      )}
      {...props}
    >
      {(pulse || dot) && (
        <span className="relative flex h-2 w-2 shrink-0 items-center justify-center">
          {pulse && (
            <span
              className={cn(
                'absolute inline-flex h-full w-full animate-ping rounded-full opacity-75',
                dotColors[variant] || dotColors.neutral
              )}
            />
          )}
          <span
            className={cn(
              'relative inline-flex h-1.5 w-1.5 rounded-full',
              dotColors[variant] || dotColors.neutral
            )}
          />
        </span>
      )}
      <span>{children}</span>
    </span>
  );
});

Badge.displayName = 'Badge';

export { Badge };
