import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Upload, Download } from 'lucide-react';
import axios from 'axios';
import { Button } from '../../../components/ui/Button';
import { API_BASE_URL } from '../../../config/api';
import { cn } from '../../../utils/cn';

const BackupSection = ({
  isAutoBackup,
  setIsAutoBackup,
  handleCreateBackup,
  isBackingUp,
  backupList,
  setBackupList,
  fetchBackups,
  showToast
}) => {
  const [selectedBackupToRestore, setSelectedBackupToRestore] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isRestoring, setIsRestoring] = useState(false);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.name.toLowerCase().endsWith('.sql')) {
        showToast('Solamente se permiten archivos con extensión .sql');
        return;
      }
      setSelectedFile(file);
      setSelectedBackupToRestore({ filename: file.name, fileObj: file });
    }
  };

  const handleExecuteRestore = async () => {
    if (!selectedBackupToRestore) return;
    setIsRestoring(true);
    try {
      const formData = new FormData();
      if (selectedBackupToRestore.fileObj) {
        formData.append('file', selectedBackupToRestore.fileObj);
      } else {
        formData.append('filename', selectedBackupToRestore.filename);
      }

      const res = await axios.post(`${API_BASE_URL}/api/backup/restore`, formData);
      showToast(res.data.message || '¡Sistema y base de datos restaurados con éxito!');
      setSelectedBackupToRestore(null);
      setSelectedFile(null);
    } catch (err) {
      console.error('Error during restore:', err);
      const detail = err.response?.data?.detail || err.response?.data?.error?.message;
      showToast(detail || 'Error al ejecutar la restauración.');
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <div className="space-y-6 text-left">
      {/* La programación automática se habilitará cuando exista un scheduler persistente. */}
      <div className="bg-v-dark/20 p-4 border border-v-dark-border rounded-xl">
        <p className="font-bold text-v-white text-sm">Respaldos automáticos</p>
        <p className="text-xs text-v-gray mt-0.5">
          La programación automática todavía no está activa. Los respaldos manuales sí se generan y almacenan en el bucket privado de Supabase.
        </p>
      </div>

      {/* On demand backup actions and Upload Restore */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col justify-between p-4 bg-v-dark/10 border border-v-dark-border/40 rounded-xl gap-4">
          <div>
            <h4 className="font-bold text-v-white text-sm">Respaldo Manual</h4>
            <p className="text-xs text-v-gray mt-0.5">Genere una descarga instantánea de la base de datos de Vextor.</p>
          </div>
          <Button
            variant="primary"
            onClick={handleCreateBackup}
            isLoading={isBackingUp}
            className="w-full font-semibold cursor-pointer"
          >
            Crear Respaldo
          </Button>
        </div>

        <div className="flex flex-col justify-between p-4 bg-v-dark/10 border border-v-dark-border/40 rounded-xl gap-4">
          <div>
            <h4 className="font-bold text-v-white text-sm">Restaurar desde Archivo Local</h4>
            <p className="text-xs text-v-gray mt-0.5">Suba un archivo de copia de seguridad (.sql) para restaurar la base de datos.</p>
          </div>
          <label className="cursor-pointer inline-flex items-center justify-center gap-2 px-4 py-2 bg-v-dark border border-v-dark-border hover:border-primary/50 text-v-white text-xs font-semibold rounded-lg transition-colors">
            <Upload size={16} className="text-primary" />
            <span>{selectedFile ? selectedFile.name : "Seleccionar archivo .sql"}</span>
            <input
              type="file"
              accept=".sql"
              className="hidden"
              onChange={handleFileChange}
            />
          </label>
        </div>
      </div>

      {/* Backups List */}
      <div className="space-y-3">
        <h4 className="font-bold text-sm text-v-white">Copias Guardadas</h4>
        <div className="border border-v-dark-border rounded-xl bg-v-dark/10 divide-y divide-v-dark-border">
          {backupList.length === 0 && (
            <p className="p-4 text-xs text-v-gray">No hay respaldos guardados en Supabase Storage.</p>
          )}
          {backupList.map((bk) => (
            <div key={bk.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between text-sm gap-3 animate-in fade-in">
              <div>
                <p className="font-mono text-xs text-v-white font-bold">{bk.filename}</p>
                <p className="text-xs text-v-gray mt-1">
                  Peso: {typeof bk.size === 'number' ? `${(bk.size / 1024 / 1024).toFixed(2)} MB` : (bk.size || 'No disponible')}
                  {' • '}Creado el: {bk.date ? new Date(bk.date).toLocaleString() : 'Fecha no disponible'}
                </p>
              </div>

              <div className="flex gap-2 shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs h-8 px-3 font-semibold cursor-pointer"
                  onClick={async () => {
                    try {
                      const response = await axios.get(
                        `${API_BASE_URL}/api/backup/${encodeURIComponent(bk.filename)}/download`,
                        { responseType: 'blob' }
                      );
                      const url = window.URL.createObjectURL(response.data);
                      const anchor = document.createElement('a');
                      anchor.href = url;
                      anchor.download = bk.filename;
                      document.body.appendChild(anchor);
                      anchor.click();
                      anchor.remove();
                      window.URL.revokeObjectURL(url);
                    } catch (error) {
                      showToast(error.response?.data?.detail || 'No fue posible descargar el respaldo.');
                    }
                  }}
                >
                  <Download size={14} className="mr-1" /> Descargar
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled
                  title="La restauración desde Storage se habilitará tras implementar y probar el respaldo previo obligatorio."
                  className="text-xs h-8 px-3 font-semibold"
                >
                  Restaurar
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Restore Confirmation Modal */}
      <AnimatePresence>
        {selectedBackupToRestore && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-v-dark-soft border border-v-dark-border p-6 rounded-2xl w-full max-w-md shadow-2xl space-y-5 text-left"
            >
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center shrink-0">
                  <AlertTriangle size={24} />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-extrabold text-v-white">¿Confirmar restauración de datos?</h3>
                  <p className="text-xs text-v-gray leading-relaxed">
                    Está a punto de restaurar la base de datos al estado del respaldo:
                  </p>
                  <p className="text-xs font-mono text-primary font-bold bg-v-dark p-2 rounded-lg border border-v-dark-border mt-2">
                    {selectedBackupToRestore.filename}
                  </p>
                </div>
              </div>

              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400 text-xs leading-relaxed">
                ⚠️ Esta acción reemplazará la información actual por el snapshot seleccionado en la base de datos SQL.
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setSelectedBackupToRestore(null);
                    setSelectedFile(null);
                  }}
                  disabled={isRestoring}
                  className="cursor-pointer"
                >
                  Cancelar
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  onClick={handleExecuteRestore}
                  isLoading={isRestoring}
                  className="cursor-pointer font-bold bg-amber-500 hover:bg-amber-600 text-black border-none"
                >
                  Restaurar Ahora
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default BackupSection;
