import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Download, AlertTriangle, X } from 'lucide-react';
import axios from 'axios';
import { Button } from '../../../components/ui/Button';
import { API_BASE_URL } from '../../../config/api';

const BackupSection = ({
  handleCreateBackup,
  isBackingUp,
  backupList,
  fetchBackups,
  showToast,
}) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedBackupToRestore, setSelectedBackupToRestore] = useState(null);
  const [restoreConfirmation, setRestoreConfirmation] = useState('');
  const [isRestoring, setIsRestoring] = useState(false);
  const [backupStatus, setBackupStatus] = useState(null);

  useEffect(() => {
    axios.get(`${API_BASE_URL}/api/backup/status`)
      .then((response) => setBackupStatus(response.data))
      .catch((error) => {
        console.error('Error loading backup status:', error);
        setBackupStatus({ storage_configured: false, automatic_enabled: false });
      });
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.sql')) {
      showToast('Solamente se permiten archivos con extensión .sql');
      e.target.value = '';
      return;
    }
    setSelectedFile(file);
  };

  const handleUploadBackup = async () => {
    if (!selectedFile) return;
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      const response = await axios.post(`${API_BASE_URL}/api/backup/upload`, formData);
      showToast(response.data?.message || 'Respaldo subido correctamente.');
      setSelectedFile(null);
      await fetchBackups();
    } catch (error) {
      showToast(error.response?.data?.detail || 'No fue posible subir el archivo SQL.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleExecuteRestore = async () => {
    if (!selectedBackupToRestore || restoreConfirmation !== 'RESTAURAR') return;
    setIsRestoring(true);
    try {
      const formData = new FormData();
      if (selectedBackupToRestore.fileObj) {
        formData.append('file', selectedBackupToRestore.fileObj);
      } else {
        formData.append('filename', selectedBackupToRestore.filename);
      }
      const response = await axios.post(`${API_BASE_URL}/api/backup/restore`, formData);
      showToast(response.data?.message || 'Restauración completada.');
      setSelectedBackupToRestore(null);
      setSelectedFile(null);
      setRestoreConfirmation('');
      await fetchBackups();
    } catch (error) {
      showToast(error.response?.data?.detail || 'No fue posible completar la restauración.');
      // La copia previa puede haberse guardado aunque la restauración haya fallado.
      await fetchBackups();
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <div className="space-y-6 text-left">
      {/* Estado del scheduler diario configurado en el backend. */}
      <div className="bg-v-dark/20 p-4 border border-v-dark-border rounded-xl">
        <p className="font-bold text-v-white text-sm">Respaldos automáticos</p>
        <p className="text-xs text-v-gray mt-0.5">
          {!backupStatus
            ? 'Consultando configuración de respaldos...'
            : !backupStatus.storage_configured
              ? 'Storage no está disponible. Verifica las credenciales del backend y que el bucket vextor-backups exista y sea privado.'
              : backupStatus.automatic_enabled
                ? `Activo: todos los días a las ${String(backupStatus.hour).padStart(2, '0')}:${String(backupStatus.minute).padStart(2, '0')} (${backupStatus.timezone}).`
                : 'La programación diaria está desactivada. Puedes activarla con BACKUP_AUTO_ENABLED=true en el entorno del backend.'}
        </p>
      </div>

      {/* On demand backup actions and Upload Restore */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col justify-between p-4 bg-v-dark/10 border border-v-dark-border/40 rounded-xl gap-4">
          <div>
            <h4 className="font-bold text-v-white text-sm">Respaldo Manual</h4>
            <p className="text-xs text-v-gray mt-0.5">Genera un archivo SQL real y lo guarda en Supabase Storage. Después podrás descargarlo desde el historial.</p>
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
            <h4 className="font-bold text-v-white text-sm">Guardar Respaldo SQL</h4>
            <p className="text-xs text-v-gray mt-0.5">Puedes guardar el archivo en Storage o solicitar una restauración protegida. La restauración crea y verifica una copia previa de la base de datos.</p>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <Button
              variant="outline"
              onClick={handleUploadBackup}
              isLoading={isUploading}
              disabled={!selectedFile || isUploading}
              className="w-full font-semibold"
            >
              Guardar en Supabase Storage
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                if (selectedFile) {
                  setSelectedBackupToRestore({ filename: selectedFile.name, fileObj: selectedFile });
                  setRestoreConfirmation('');
                }
              }}
              disabled={!selectedFile || isRestoring}
              className="w-full font-semibold"
            >
              Restaurar archivo local
            </Button>
          </div>
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
                  Peso: {Number.isFinite(Number(bk.size)) ? `${(Number(bk.size) / 1024 / 1024).toFixed(2)} MB` : (bk.size || 'No disponible')}
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
                      window.setTimeout(() => window.URL.revokeObjectURL(url), 1000);
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
                  className="text-xs h-8 px-3 font-semibold"
                  onClick={() => {
                    setSelectedBackupToRestore(bk);
                    setRestoreConfirmation('');
                  }}
                >
                  Restaurar
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {selectedBackupToRestore && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="w-full max-w-lg space-y-5 rounded-2xl border border-v-dark-border bg-v-dark-soft p-6 shadow-2xl"
            >
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-amber-500/20 bg-amber-500/10 text-amber-400">
                  <AlertTriangle size={22} />
                </div>
                <div className="min-w-0">
                  <h3 className="text-lg font-bold text-v-white">Confirmar restauración</h3>
                  <p className="mt-1 text-xs leading-relaxed text-v-gray">
                    Se restaurará la base de datos desde este archivo. Antes de ejecutar el SQL, VEXTOR generará una copia del estado actual y verificará su integridad en Supabase Storage. Si esa copia falla, la restauración se cancela.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedBackupToRestore(null);
                    setRestoreConfirmation('');
                  }}
                  disabled={isRestoring}
                  className="text-v-gray hover:text-v-white"
                  aria-label="Cerrar"
                >
                  <X size={18} />
                </button>
              </div>
              <p className="break-all rounded-lg border border-v-dark-border bg-v-dark p-3 font-mono text-xs font-bold text-primary">
                {selectedBackupToRestore.filename}
              </p>
              <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-xs leading-relaxed text-amber-300">
                Esta operación modifica datos actuales. No cierres el servidor ni interrumpas la conexión mientras se ejecuta.
              </div>
              <label className="block space-y-2 text-xs text-v-gray">
                Escribe <strong className="text-v-white">RESTAURAR</strong> para habilitar la operación.
                <input
                  value={restoreConfirmation}
                  onChange={(event) => setRestoreConfirmation(event.target.value)}
                  autoComplete="off"
                  className="w-full rounded-lg border border-v-dark-border bg-v-dark px-3 py-2 text-sm text-v-white outline-none focus:border-primary"
                  placeholder="RESTAURAR"
                  disabled={isRestoring}
                />
              </label>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  disabled={isRestoring}
                  onClick={() => {
                    setSelectedBackupToRestore(null);
                    setRestoreConfirmation('');
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  variant="primary"
                  onClick={handleExecuteRestore}
                  isLoading={isRestoring}
                  disabled={restoreConfirmation !== 'RESTAURAR' || isRestoring}
                  className="bg-amber-500 font-bold text-black hover:bg-amber-600"
                >
                  Restaurar ahora
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
