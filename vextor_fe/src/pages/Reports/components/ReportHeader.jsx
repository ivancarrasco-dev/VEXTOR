import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart3, Download, ChevronDown, Truck, Users } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { cn } from '../../../utils/cn';
import { useTranslation } from 'react-i18next';

export const ReportHeader = ({ onExport, isExporting }) => {
  const { t } = useTranslation();
  const [isQuickExportOpen, setIsQuickExportOpen] = useState(false);
  const quickExportRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (quickExportRef.current && !quickExportRef.current.contains(event.target)) {
        setIsQuickExportOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAction = (name, type, format) => {
    setIsQuickExportOpen(false);
    onExport(name, type, format);
  };

  return (
    <section className="relative rounded-3xl p-5 sm:p-8 bg-v-dark-soft border border-v-dark-border flex flex-col md:flex-row justify-between items-start md:items-center gap-6 text-left">
      {/* Background glow in absolute container with pointer-events-none */}
      <div className="absolute inset-0 rounded-3xl overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 blur-[100px] -mr-32 -mt-32" />
      </div>

      <div className="relative z-10 space-y-2 max-w-2xl">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shadow-[0_0_15px_rgba(16,185,129,0.15)]">
            <BarChart3 size={20} />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-v-white">{t('reports.title', 'Centro de Reportes')}</h2>
        </div>
        <p className="text-v-gray text-sm md:text-base leading-relaxed">
          {t('reports.subtitle', 'Monitoreo consolidado, métricas en tiempo real y exportación en múltiples formatos para toda la flota.')}
        </p>
      </div>

      {/* Quick Export Button Dropdown Container */}
      <div className="relative z-30 self-stretch md:self-auto shrink-0" ref={quickExportRef}>
        <Button
          variant="primary"
          onClick={() => setIsQuickExportOpen(!isQuickExportOpen)}
          className="flex items-center gap-2.5 w-full md:w-auto font-bold cursor-pointer"
          disabled={isExporting}
        >
          <Download size={16} /> {t('reports.btnExport', 'Exportar Reporte')} <ChevronDown size={14} className={cn("transition-transform duration-200", isQuickExportOpen && "rotate-180")} />
        </Button>

        <AnimatePresence>
          {isQuickExportOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 mt-2 w-64 bg-v-dark-soft/95 backdrop-blur-md border border-v-dark-border rounded-xl shadow-2xl p-2 z-50 flex flex-col gap-1 focus:outline-none"
            >
              <div className="px-3 py-2 text-[11px] font-bold text-v-gray uppercase tracking-wider border-b border-v-dark-border/60 mb-1">
                Descargas directas (PDF)
              </div>
              <button
                type="button"
                onClick={() => handleAction('Resumen General de Flota', 'general', 'pdf')}
                className="flex items-center gap-2.5 w-full px-3 py-2 text-sm rounded-lg text-v-white hover:bg-primary/10 hover:text-primary hover:translate-x-1 transition-all duration-150 text-left cursor-pointer"
              >
                <BarChart3 size={15} /> Resumen General (PDF)
              </button>
              <button
                type="button"
                onClick={() => handleAction('Listado de Vehículos', 'vehicles', 'pdf')}
                className="flex items-center gap-2.5 w-full px-3 py-2 text-sm rounded-lg text-v-white hover:bg-primary/10 hover:text-primary hover:translate-x-1 transition-all duration-150 text-left cursor-pointer"
              >
                <Truck size={15} /> Todos los Vehículos (PDF)
              </button>
              <button
                type="button"
                onClick={() => handleAction('Listado de Conductores', 'drivers', 'pdf')}
                className="flex items-center gap-2.5 w-full px-3 py-2 text-sm rounded-lg text-v-white hover:bg-primary/10 hover:text-primary hover:translate-x-1 transition-all duration-150 text-left cursor-pointer"
              >
                <Users size={15} /> Todos los Conductores (PDF)
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
};
