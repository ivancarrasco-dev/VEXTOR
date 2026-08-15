import { Calendar, Clock, TrendingUp, BarChart3 } from 'lucide-react';
import { cn } from '../../../utils/cn';
import { useTranslation } from 'react-i18next';

export const QuickReportsSection = ({ activeReport, onSelectReport, isExporting }) => {
  const { t } = useTranslation();

  return (
    <section className="space-y-4">
      <h3 className="text-lg font-bold text-v-white flex items-center gap-2">
        <Clock size={18} className="text-primary" /> {t('reports.selectReport', 'Seleccionar Tipo de Reporte')}
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <button
          type="button"
          onClick={() => onSelectReport('day')}
          className={cn(
            "flex items-start gap-4 p-5 rounded-2xl border text-left transition-all duration-200 group relative overflow-hidden cursor-pointer",
            activeReport === 'day'
              ? "bg-primary/5 border-primary shadow-[0_0_15px_rgba(16,185,129,0.08)]"
              : "bg-v-dark-soft border-v-dark-border hover:border-v-gray/50 hover:bg-v-dark-border/10"
          )}
          disabled={isExporting}
        >
          <div className="p-3 rounded-xl bg-v-dark border border-v-dark-border text-primary group-hover:scale-105 transition-transform shrink-0">
            <Calendar size={18} />
          </div>
          <div className="space-y-1">
            <h4 className="font-bold text-sm text-v-white group-hover:text-primary transition-colors">{t('reports.dayReport', 'Reporte del día')}</h4>
            <p className="text-xs text-v-gray leading-snug">Rutas y mantenimientos planificados para hoy.</p>
          </div>
        </button>

        <button
          type="button"
          onClick={() => onSelectReport('week')}
          className={cn(
            "flex items-start gap-4 p-5 rounded-2xl border text-left transition-all duration-200 group relative overflow-hidden cursor-pointer",
            activeReport === 'week'
              ? "bg-primary/5 border-primary shadow-[0_0_15px_rgba(16,185,129,0.08)]"
              : "bg-v-dark-soft border-v-dark-border hover:border-v-gray/50 hover:bg-v-dark-border/10"
          )}
          disabled={isExporting}
        >
          <div className="p-3 rounded-xl bg-v-dark border border-v-dark-border text-primary group-hover:scale-105 transition-transform shrink-0">
            <Clock size={18} />
          </div>
          <div className="space-y-1">
            <h4 className="font-bold text-sm text-v-white group-hover:text-primary transition-colors">{t('reports.weekReport', 'Reporte de esta semana')}</h4>
            <p className="text-xs text-v-gray leading-snug">Consolidado operativo de los últimos 7 días.</p>
          </div>
        </button>

        <button
          type="button"
          onClick={() => onSelectReport('month')}
          className={cn(
            "flex items-start gap-4 p-5 rounded-2xl border text-left transition-all duration-200 group relative overflow-hidden cursor-pointer",
            activeReport === 'month'
              ? "bg-primary/5 border-primary shadow-[0_0_15px_rgba(16,185,129,0.08)]"
              : "bg-v-dark-soft border-v-dark-border hover:border-v-gray/50 hover:bg-v-dark-border/10"
          )}
          disabled={isExporting}
        >
          <div className="p-3 rounded-xl bg-v-dark border border-v-dark-border text-primary group-hover:scale-105 transition-transform shrink-0">
            <TrendingUp size={18} />
          </div>
          <div className="space-y-1">
            <h4 className="font-bold text-sm text-v-white group-hover:text-primary transition-colors">{t('reports.monthReport', 'Reporte del mes')}</h4>
            <p className="text-xs text-v-gray leading-snug">Análisis de rendimiento mensual de la flota.</p>
          </div>
        </button>

        <button
          type="button"
          onClick={() => onSelectReport('general')}
          className={cn(
            "flex items-start gap-4 p-5 rounded-2xl border text-left transition-all duration-200 group relative overflow-hidden cursor-pointer",
            activeReport === 'general'
              ? "bg-primary/5 border-primary shadow-[0_0_15px_rgba(16,185,129,0.08)]"
              : "bg-v-dark-soft border-v-dark-border hover:border-v-gray/50 hover:bg-v-dark-border/10"
          )}
          disabled={isExporting}
        >
          <div className="p-3 rounded-xl bg-v-dark border border-v-dark-border text-primary group-hover:scale-105 transition-transform shrink-0">
            <BarChart3 size={18} />
          </div>
          <div className="space-y-1">
            <h4 className="font-bold text-sm text-v-white group-hover:text-primary transition-colors">{t('reports.generalReport', 'Resumen general')}</h4>
            <p className="text-xs text-v-gray leading-snug">Base consolidada total de auditorías y estados.</p>
          </div>
        </button>
      </div>
    </section>
  );
};
