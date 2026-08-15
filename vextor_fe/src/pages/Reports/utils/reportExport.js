import { reportService } from '../../../services/reportService';

/**
 * Executes full export workflow with error handling and backend logging.
 */
export const runReportExport = async ({
  reportName,
  reportType,
  format,
  filters = {},
  onStart,
  onProgress,
  onSuccess,
  onError
}) => {
  try {
    if (onStart) onStart();

    const steps = [
      'Consultando registros del sistema...',
      'Filtrando matriz de datos...',
      `Compilando formato ${format.toUpperCase()}...`,
      'Generando documento...',
      'Finalizando...'
    ];

    for (let i = 0; i < steps.length; i++) {
      if (onProgress) onProgress(steps[i]);
      await new Promise((r) => setTimeout(r, 250));
    }

    // Call real backend export
    await reportService.exportReport({
      report_type: reportType,
      format: format,
      status: filters.status || undefined,
      search: filters.search || undefined,
      date_start: filters.dateStart || undefined,
      date_end: filters.dateEnd || undefined,
      type_filter: filters.type || undefined
    });

    if (onSuccess) onSuccess(`Reporte "${reportName}" exportado con éxito en formato ${format.toUpperCase()}`);
  } catch (err) {
    console.error("Export failure:", err);
    if (onError) onError(err.message || 'Error al generar el archivo del reporte.');
  }
};
