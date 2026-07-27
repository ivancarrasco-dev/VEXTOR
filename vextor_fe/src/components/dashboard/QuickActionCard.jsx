import { PlusCircle } from 'lucide-react';
import { motion } from 'framer-motion';

/**
 * QuickActionCard Component
 *
 * Responsabilidad:
 * Proporcionar un acceso rápido a funciones operativas del sistema.
 *
 * Utilizado en:
 * * Dashboard
 *
 * Funcionalidades:
 * * Botón interactivo con hover effects.
 * * Soporta iconos de Lucide.
 * * Animación de entrada con motion.
 */
const QuickActionCard = ({ title, description, icon: Icon, onClick, delay = 0 }) => {
  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay }}
      onClick={onClick}
      className="flex items-center gap-4 p-4 rounded-2xl bg-v-dark-soft border border-v-dark-border hover:border-primary hover:bg-primary/5 transition-all group text-left w-full"
    >
      <div className="h-12 w-12 rounded-xl bg-v-dark flex items-center justify-center text-v-gray group-hover:text-primary transition-colors">
        <Icon size={24} />
      </div>
      <div className="flex-1">
        <h4 className="text-sm font-bold text-v-white group-hover:text-primary transition-colors">{title}</h4>
        <p className="text-xs text-v-gray">{description}</p>
      </div>
      <PlusCircle size={18} className="text-v-dark-border group-hover:text-primary transition-colors" />
    </motion.button>
  );
};

export default QuickActionCard;
