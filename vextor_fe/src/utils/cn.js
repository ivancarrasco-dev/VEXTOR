import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * cn (Class Names) Utility
 *
 * Propósito:
 * Combinar clases de Tailwind CSS de forma condicional y segura,
 * resolviendo conflictos mediante tailwind-merge.
 *
 * @param {...any} inputs - Clases, objetos o arreglos de clases.
 * @returns {string} - Cadena de clases procesada.
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
