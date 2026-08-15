import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart3,
  Check,
  Info,
  X,
  SlidersHorizontal,
  FileDown
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../utils/cn';
import { useTranslation } from 'react-i18next';

import { useReports } from './hooks/useReports';
import { runReportExport } from './utils/reportExport';
import { ReportHeader } from './components/ReportHeader';
import { QuickReportsSection } from './components/QuickReportsSection';
import { ModuleCardsSection } from './components/ModuleCardsSection';
import { ReportFilters } from './components/ReportFilters';
import { ReportPreviewTable } from './components/ReportPreviewTable';

const Reports = () => {
  const { t } = useTranslation();
  const { user } = useAuth();

  const {
    activeReport,
    handleSelectReport,
    counts,
    isLoadingCounts,
    isLoadingPreview,
    filters,
    setFilters,
    tableSort,
    handleRequestSort,
    currentPage,
    totalPages,
    totalItems,
    startIndex,
    itemsPerPage,
    currentItems,
    handlePrevPage,
    handleNextPage,
    getActiveReportLabel
  } = useReports();

  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState('');
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const handleExport = (reportName, reportType, format) => {
    runReportExport({
      reportName,
      reportType: reportType || activeReport || 'general',
      format,
      filters,
      onStart: () => setIsExporting(true),
      onProgress: (msg) => setExportProgress(msg),
      onSuccess: (msg) => {
        setIsExporting(false);
        setExportProgress('');
        addToast(msg, 'success');
      },
      onError: (errMessage) => {
        setIsExporting(false);
        setExportProgress('');
        addToast(errMessage, 'error');
      }
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700 relative">
      {/* Toast Manager Overlay */}
      <div className="fixed top-6 right-6 z-[120] flex flex-col gap-3 pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: -20, scale: 0.9, x: 20 }}
              animate={{ opacity: 1, y: 0, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.95, x: 20 }}
              className={cn(
                "p-4 rounded-xl shadow-2xl border flex items-center gap-3 w-80 pointer-events-auto backdrop-blur-md",
                toast.type === 'error'
                  ? 'bg-red-500/10 border-red-500/20 text-red-400'
                  : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
              )}
            >
              <div className="shrink-0">
                {toast.type === 'error' ? (
                  <Info size={18} className="text-red-400 animate-pulse" />
                ) : (
                  <Check size={18} className="text-emerald-400 animate-bounce" />
                )}
              </div>
              <p className="text-sm font-medium flex-1 leading-snug text-v-white">{toast.message}</p>
              <button
                type="button"
                onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
                className="text-v-gray hover:text-v-white p-1 rounded-lg hover:bg-v-dark-border/40 transition-colors"
              >
                <X size={14} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Global progress overlay for export action */}
      <AnimatePresence>
        {isExporting && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="bg-v-dark-soft border border-v-dark-border rounded-2xl shadow-2xl p-8 max-w-sm w-full text-center space-y-5"
            >
              <div className="relative inline-flex items-center justify-center">
                <div className="h-16 w-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                <FileDown className="absolute h-6 w-6 text-primary animate-pulse" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-v-white">Generando archivo de reporte</h4>
                <p className="text-v-gray text-xs mt-1">Por favor espere mientras se procesan los datos...</p>
              </div>
              <div className="bg-v-dark p-3.5 rounded-xl border border-v-dark-border font-mono text-xs text-primary font-bold animate-pulse">
                {exportProgress || 'Procesando registros...'}
              </div>
              <div className="w-full bg-v-dark-border h-1.5 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: '5%' }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 1.5, ease: 'easeInOut' }}
                  className="bg-primary h-full"
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Section */}
      <ReportHeader
        onExport={handleExport}
        isExporting={isExporting}
      />

      {/* QUICK PERIOD REPORTS BUTTONS SECTION */}
      <QuickReportsSection
        activeReport={activeReport}
        onSelectReport={handleSelectReport}
        isExporting={isExporting}
      />

      {/* MODULE REPORTS CARD LIST */}
      <ModuleCardsSection
        activeReport={activeReport}
        counts={counts}
        isLoadingCounts={isLoadingCounts}
        onSelectReport={handleSelectReport}
        isExporting={isExporting}
      />

      {/* FILTER PANEL AND PREVIEW VIEW */}
      <AnimatePresence mode="wait">
        {activeReport ? (
          <motion.section
            key={activeReport}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="space-y-6"
          >
            <div className="border-t border-v-dark-border/60 my-6" />

            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2.5">
                <SlidersHorizontal size={18} className="text-primary animate-pulse" />
                <h3 className="text-xl font-bold text-v-white">
                  Filtros & Vista Previa: <span className="text-primary font-extrabold">{getActiveReportLabel()}</span>
                </h3>
              </div>
              <p className="text-v-gray text-xs">
                Ajuste las dimensiones deseadas. Los resultados en la vista previa se actualizan en tiempo real.
              </p>
            </div>

            {/* Form Filters Bar */}
            <ReportFilters
              activeReport={activeReport}
              filters={filters}
              setFilters={setFilters}
              isExporting={isExporting}
            />

            {/* Preview Table */}
            <ReportPreviewTable
              activeReport={activeReport}
              reportLabel={getActiveReportLabel()}
              currentItems={currentItems}
              totalItems={totalItems}
              startIndex={startIndex}
              itemsPerPage={itemsPerPage}
              currentPage={currentPage}
              totalPages={totalPages}
              isLoadingPreview={isLoadingPreview}
              tableSort={tableSort}
              onRequestSort={handleRequestSort}
              onPrevPage={handlePrevPage}
              onNextPage={handleNextPage}
              onExport={handleExport}
              isExporting={isExporting}
              user={user}
            />
          </motion.section>
        ) : (
          <motion.div
            key="empty-prompt"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center min-h-[300px] border border-dashed border-v-dark-border rounded-3xl p-12 text-center bg-v-dark-soft/40"
          >
            <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-5 shadow-inner">
              <BarChart3 size={28} />
            </div>
            <h4 className="text-xl font-bold text-v-white mb-2">{t('reports.selectReport', 'Seleccionar Tipo de Reporte')}</h4>
            <p className="text-v-gray text-xs sm:text-sm max-w-sm leading-relaxed">
              Haga clic sobre cualquiera de los módulos o periodos de tiempo en la parte superior para cargar el panel de filtros y la vista previa interactiva.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Reports;
