import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, AlertTriangle, Database, X } from 'lucide-react';
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
  showToast
}) => {
  const [selectedBackupToRestore, setSelectedBackupToRestore] = useState(null);
  const [isRestoring, setIsRestoring] = useState(false);

  const handleExecuteRestore = async () => {
    if (!selectedBackupToRestore) return;
    setIsRestoring(true);
    try {
      const res = await axios.post(`${API_BASE_URL}/api/backup/restore`, {
        filename: selectedBackupToRestore.filename
      });
      showToast(res.data.message || '¡Sistema y base de datos restaurados con éxito!');
      setSelectedBackupToRestore(null);
    } catch (err) {
      console.error('Error during restore:', err);
      showToast(err.response?.data?.detail || 'Error al ejecutar la restauración.');
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <div className="space-y-6 text-left">
      {/* Automated Backups block */}
      <div className="flex justify-between items-center bg-v-dark/20 p-4 border border-v-dark-border rounded-xl">
        <div>
          <p className="font-bold text-v-white text-sm">Respaldos Automáticos Diarios</p>
          <p className="text-xs text-v-gray mt-0.5">Guardar automáticamente una copia de la base de datos cada noche en la nube de Vextor.</p>
        </div>
        <button
          type="button"
          onClick={() => {
            setIsAutoBackup(!isAutoBackup);
            showToast(isAutoBackup ? 'Backups automáticos deshabilitados.' : 'Backups automáticos habilitados.');
          }}
          className={cn(
            "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
            isAutoBackup ? "bg-primary" : "bg-v-dark-border"
          )}
        >
          <span
            className={cn(
              "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-v-dark shadow ring-0 transition duration-200 ease-in-out",
              isAutoBackup ? "translate-x-5 bg-v-dark-constant" : "translate-x-0 bg-v-gray"
            )}
          />
        </button>
      </div>

      {/* On demand backup actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 bg-v-dark/10 border border-v-dark-border/40 rounded-xl gap-4">
        <div>
          <h4 className="font-bold text-v-white text-sm">Respaldo Manual</h4>
          <p className="text-xs text-v-gray mt-0.5">Genere una descarga instantánea de la base de datos de Vextor.</p>
        </div>
        <Button
          variant="primary"
          onClick={handleCreateBackup}
          isLoading={isBackingUp}
          className="w-full sm:w-auto font-semibold cursor-pointer"
        >
          Crear Respaldo
        </Button>
      </div>

      {/* Backups List */}
      <div className="space-y-3">
        <h4 className="font-bold text-sm text-v-white">Copias Guardadas</h4>
        <div className="border border-v-dark-border rounded-xl bg-v-dark/10 divide-y divide-v-dark-border">
          {backupList.map((bk) => (
            <div key={bk.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between text-sm gap-3 animate-in fade-in">
              <div>
                <p className="font-mono text-xs text-v-white font-bold">{bk.filename}</p>
                <p className="text-xs text-v-gray mt-1">Peso: {bk.size} • Creado el: {bk.date}</p>
              </div>

              <div className="flex gap-2 shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs h-8 px-3 font-semibold cursor-pointer"
                  onClick={() => setSelectedBackupToRestore(bk)}
                >
                  Restaurar
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs h-8 px-3 text-red-400 hover:text-red-300 hover:bg-red-500/10 font-semibold cursor-pointer"
                  onClick={() => {
                    setBackupList(backupList.filter(b => b.id !== bk.id));
                    showToast('Copia eliminada.');
                  }}
                >
                  Eliminar
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
                  onClick={() => setSelectedBackupToRestore(null)}
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
