import { PlusCircle } from 'lucide-react';
import { motion } from 'framer-motion';

/**
 * QuickActionCard Component - VEXTOR UI System
 */
const QuickActionCard = ({ title, description, icon: Icon, onClick, delay = 0 }) => {
  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, duration: 0.2 }}
      onClick={onClick}
      className="flex items-center gap-4 p-4 rounded-2xl bg-v-dark-soft border border-v-dark-border hover:border-primary hover:bg-primary/5 transition-all group text-left w-full cursor-pointer shadow-sm"
    >
      <div className="h-11 w-11 rounded-xl bg-v-dark border border-v-dark-border flex items-center justify-center text-v-gray group-hover:text-primary transition-colors shrink-0">
        <Icon size={20} />
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="text-xs sm:text-sm font-bold text-v-white group-hover:text-primary transition-colors truncate">{title}</h4>
        <p className="text-[11px] sm:text-xs text-v-gray truncate mt-0.5">{description}</p>
      </div>
      <PlusCircle size={18} className="text-v-gray group-hover:text-primary transition-colors shrink-0" />
    </motion.button>
  );
};

export default QuickActionCard;
