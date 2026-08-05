import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '../../utils/cn';

const getStatusConfig = (value, label) => {
  const val = String(value).toUpperCase();
  const lbl = String(label).toUpperCase();

  // Disponible / Activo / Completado -> Green
  if (
    val === 'DISPONIBLE' || val === 'ACTIVO' || val === 'COMPLETADO' || val === 'COMPLETADA' ||
    lbl === 'DISPONIBLE' || lbl === 'ACTIVO' || lbl === 'COMPLETADO' || lbl === 'COMPLETADA'
  ) {
    return { dotClass: 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' };
  }

  // En Ruta -> Blue
  if (
    val === 'EN_RUTA' || lbl === 'EN RUTA'
  ) {
    return { dotClass: 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]' };
  }

  // Mantenimiento / Suspendido / En Proceso / Programado / Programada -> Orange/Amber
  if (
    val === 'MANTENIMIENTO' || val === 'SUSPENDIDO' || val === 'EN_PROCESO' || val === 'PROGRAMADO' || val === 'PROGRAMADA' ||
    lbl === 'MANTENIMIENTO' || lbl === 'SUSPENDIDO' || lbl === 'EN PROCESO' || lbl === 'PROGRAMADO' || lbl === 'PROGRAMADA'
  ) {
    return { dotClass: 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]' };
  }

  // Inactivo / Cancelado / Cancelada / Suspendida -> Red
  if (
    val === 'INACTIVO' || val === 'CANCELADO' || val === 'CANCELADA' || val === 'SUSPENDIDA' ||
    lbl === 'INACTIVO' || lbl === 'CANCELADO' || lbl === 'CANCELADA' || lbl === 'SUSPENDIDA'
  ) {
    return { dotClass: 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' };
  }

  return null;
};

const extractOptions = (children) => {
  const options = [];
  const recurse = (node) => {
    if (!node) return;
    React.Children.forEach(node, (child) => {
      if (!child) return;
      if (child.type === 'option') {
        options.push({
          value: child.props.value ?? '',
          label: child.props.children,
          disabled: child.props.disabled,
        });
      } else if (child.props && child.props.children) {
        recurse(child.props.children);
      }
    });
  };
  recurse(children);
  return options;
};

const Select = React.forwardRef(({
  name,
  value,
  onChange,
  disabled,
  className,
  children,
  ...props
}, ref) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);
  const options = extractOptions(children);

  // Find currently selected option
  const selectedOption = options.find(opt => String(opt.value) === String(value)) || options[0];

  // Close dropdown when clicked outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSelect = (newValue) => {
    if (disabled) return;
    if (onChange) {
      onChange({
        target: {
          name,
          value: newValue,
        },
      });
    }
    setIsOpen(false);
  };

  // Keyboard navigation
  const handleKeyDown = (e) => {
    if (disabled) return;
    
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setIsOpen(!isOpen);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    } else if (e.key === 'ArrowDown' && isOpen) {
      e.preventDefault();
      const currentIndex = options.findIndex(opt => String(opt.value) === String(value));
      const nextIndex = (currentIndex + 1) % options.length;
      handleSelect(options[nextIndex].value);
    } else if (e.key === 'ArrowUp' && isOpen) {
      e.preventDefault();
      const currentIndex = options.findIndex(opt => String(opt.value) === String(value));
      const prevIndex = (currentIndex - 1 + options.length) % options.length;
      handleSelect(options[prevIndex].value);
    }
  };

  const selectedStatus = selectedOption ? getStatusConfig(selectedOption.value, selectedOption.label) : null;

  return (
    <div
      ref={containerRef}
      className={cn("relative w-full text-left", className)}
      onKeyDown={handleKeyDown}
    >
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center justify-between w-full h-11 px-4 rounded-xl border bg-v-dark-soft text-sm font-semibold text-v-white shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/20",
          isOpen ? "border-primary" : "border-v-dark-border",
          disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:bg-v-dark-soft/85 hover:border-v-dark-border"
        )}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className="flex items-center gap-2 truncate">
          {selectedStatus && (
            <span className={cn("h-2.5 w-2.5 rounded-full shrink-0", selectedStatus.dotClass)} />
          )}
          <span className="truncate">{selectedOption?.label || ''}</span>
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 text-v-gray transition-transform duration-200 shrink-0 ml-2",
            isOpen && "rotate-180"
          )}
        />
      </button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -4 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute left-0 right-0 z-[100] mt-2 max-h-60 overflow-y-auto rounded-xl border border-v-dark-border bg-v-dark-soft/95 backdrop-blur-md p-1.5 shadow-xl shadow-black/40 custom-scrollbar focus:outline-none"
            role="listbox"
          >
            <div className="flex flex-col gap-1">
              {options.map((option) => {
                const isSelected = String(option.value) === String(value);
                const status = getStatusConfig(option.value, option.label);
                
                return (
                  <button
                    key={option.value}
                    type="button"
                    disabled={option.disabled}
                    onClick={() => handleSelect(option.value)}
                    className={cn(
                      "flex items-center justify-between w-full px-3 py-2.5 text-sm rounded-lg transition-all duration-150 text-left cursor-pointer",
                      isSelected
                        ? "bg-primary/10 text-primary font-semibold"
                        : "text-v-white hover:bg-v-dark-border/40 hover:text-v-white hover:translate-x-0.5",
                      option.disabled && "opacity-40 cursor-not-allowed"
                    )}
                    role="option"
                    aria-selected={isSelected}
                  >
                    <div className="flex items-center gap-2 truncate">
                      {/* Checkmark Slot */}
                      <div className="w-4 h-4 flex items-center justify-center shrink-0">
                        {isSelected && (
                          <Check className="h-4 w-4 text-primary animate-in fade-in duration-200" />
                        )}
                      </div>

                      {/* Status Dot Slot */}
                      {status && (
                        <div className="w-3 h-3 flex items-center justify-center shrink-0">
                          <span className={cn("h-2 w-2 rounded-full", status.dotClass)} />
                        </div>
                      )}

                      <span className="truncate">{option.label}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hidden native select for standard form compliance and integration */}
      <select
        ref={ref}
        name={name}
        value={value}
        onChange={onChange}
        disabled={disabled}
        tabIndex={-1}
        className="sr-only"
        {...props}
      >
        {children}
      </select>
    </div>
  );
});

Select.displayName = 'Select';

export { Select };
