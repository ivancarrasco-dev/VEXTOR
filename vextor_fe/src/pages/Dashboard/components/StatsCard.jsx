import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '../../../utils/cn';

/**
 * StatsCard Component
 *
 * Responsabilidad:
 * Mostrar indicadores clave de rendimiento (KPIs) con visualización de tendencias.
 *
 * Utilizado en:
 * * Dashboard
 *
 * Funcionalidades:
 * * Visualización de valores numéricos o estados.
 * * Indicador de tendencia (arriba/abajo) con porcentajes.
 * * Animaciones de entrada.
 */
const StatsCard = ({ title, value, icon: Icon, trend, trendValue, delay = 0 }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="bg-v-dark-soft border border-v-dark-border p-6 rounded-2xl hover:border-primary/50 transition-colors group"
    >
      <div className="flex justify-between items-start mb-4">
        <div className="p-3 rounded-xl bg-v-dark border border-v-dark-border text-primary group-hover:scale-110 transition-transform">
          <Icon size={24} />
        </div>
        {trend && (
          <div className={cn(
            "flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full",
            trend === 'up' ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"
          )}>
            {trendValue !== null && trendValue !== undefined ? (
              <>
                {trend === 'up' ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                <span>{trendValue}%</span>
              </>
            ) : (
              <span className="text-[10px] text-v-gray font-normal">S/D</span>
            )}
          </div>
        )}
      </div>
      <div>
        <p className="text-v-gray text-sm font-medium mb-1">{title}</p>
        <h3 className="text-3xl font-bold text-v-white">{value}</h3>
      </div>
    </motion.div>
  );
};

export default StatsCard;
