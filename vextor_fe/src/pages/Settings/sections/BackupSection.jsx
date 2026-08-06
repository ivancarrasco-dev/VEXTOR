import React from 'react';
import { Button } from '../../../components/ui/Button';
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
  return (
    <div className="space-y-6">
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
          className="w-full sm:w-auto font-semibold"
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
                  className="text-xs h-8 px-3 font-semibold"
                  onClick={() => {
                    if (window.confirm(`¿Confirmar restauración de la base de datos al punto: ${bk.filename}?`)) {
                      showToast('¡Sistema restaurado con éxito!');
                    }
                  }}
                >
                  Restaurar
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs h-8 px-3 text-red-400 hover:text-red-300 hover:bg-red-500/10 font-semibold"
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
    </div>
  );
};

export default BackupSection;
