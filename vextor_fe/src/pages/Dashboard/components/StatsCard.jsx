import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '../../../utils/cn';
import { Badge } from '../../../components/ui/Badge';

/**
 * StatsCard Component - VEXTOR Fleet Dashboard
 */
const StatsCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendValue,
  variant = 'primary',
  delay = 0
}) => {
  const iconGlows = {
    primary: 'bg-primary/10 text-primary border-primary/25',
    blue: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
    emerald: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    amber: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    purple: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.25 }}
      className="bg-v-dark-soft border border-v-dark-border p-5 rounded-2xl hover:border-v-dark-border/80 transition-all duration-200 group text-left relative overflow-hidden shadow-sm"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className={cn(
          "h-11 w-11 rounded-xl border flex items-center justify-center transition-all duration-200 shrink-0",
          iconGlows[variant] || iconGlows.primary
        )}>
          <Icon size={20} />
        </div>

        {trendValue !== null && trendValue !== undefined && (
          <div className="shrink-0">
            <Badge
              variant={trend === 'up' ? 'success' : 'danger'}
              size="xs"
              className="font-mono"
            >
              {trend === 'up' ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
              <span>{trendValue}%</span>
            </Badge>
          </div>
        )}
      </div>

      <div className="space-y-1">
        <p className="text-v-gray text-xs font-bold uppercase tracking-wider font-mono">
          {title}
        </p>
        <h3 className="text-2xl sm:text-3xl font-extrabold text-v-white tracking-tight">
          {value}
        </h3>
        {subtitle && (
          <p className="text-[11px] text-v-gray font-medium leading-snug">
            {subtitle}
          </p>
        )}
      </div>
    </motion.div>
  );
};

export default StatsCard;
