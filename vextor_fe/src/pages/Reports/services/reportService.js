import axios from 'axios';

const API_URL = 'http://localhost:8000/api/reports';

export const reportService = {
  /**
   * Log a report generation activity in the database.
   */
  async logReport(reportName, format) {
    try {
      const response = await axios.post(`${API_URL}/log`, {
        report_name: reportName,
        format: format
      }, {
        withCredentials: true
      });
      return response.data;
    } catch (error) {
      console.warn("Error logging report activity:", error);
      return null;
    }
  },

  /**
   * Get dynamic report dataset from backend.
   */
  async getReportData(params) {
    try {
      const response = await axios.get(`${API_URL}/data`, {
        params,
        withCredentials: true
      });
      return response.data;
    } catch (error) {
      const message = error.response?.data?.detail || 'Error al obtener datos del reporte.';
      throw new Error(message);
    }
  },

  /**
   * Export report file as PDF, CSV, or Excel blob or printable document window.
   */
  async exportReport(params) {
    try {
      const { report_type = 'general', format = 'pdf' } = params;
      const url = `${API_URL}/export`;

      if (format === 'pdf') {
        const response = await axios.get(url, {
          params,
          responseType: 'text',
          withCredentials: true
        });

        // Open printable HTML window
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(response.data);
          printWindow.document.close();
        } else {
          // Fallback if popup blocked: download as HTML/PDF report
          const blob = new Blob([response.data], { type: 'text/html' });
          const downloadUrl = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = downloadUrl;
          link.setAttribute('download', `VEXTOR_Reporte_${report_type.toUpperCase()}.html`);
          document.body.appendChild(link);
          link.click();
          link.remove();
        }
      } else {
        // CSV or Excel binary download
        const response = await axios.get(url, {
          params,
          responseType: 'blob',
          withCredentials: true
        });

        const mimeType = format === 'csv' ? 'text/csv' : 'application/vnd.ms-excel';
        const blob = new Blob([response.data], { type: mimeType });
        const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.setAttribute('download', `VEXTOR_Reporte_${report_type.toUpperCase()}.${format === 'csv' ? 'csv' : 'xlsx'}`);
        document.body.appendChild(link);
        link.click();
        link.remove();
      }

      return true;
    } catch (error) {
      let message = 'Error al exportar el archivo del reporte.';
      if (error.response?.data instanceof Blob) {
        try {
          const text = await error.response.data.text();
          const json = JSON.parse(text);
          message = json.detail || message;
        } catch {
          // Keep default message
        }
      } else if (error.response?.data?.detail) {
        message = error.response.data.detail;
      }
      throw new Error(message);
    }
  }
};
