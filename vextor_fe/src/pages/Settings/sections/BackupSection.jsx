import React, { useState } from 'react';
import { Upload, Download } from 'lucide-react';
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

  return (
    <div className="space-y-6 text-left">
      {/* La programación automática se habilitará cuando exista un scheduler persistente. */}
      <div className="bg-v-dark/20 p-4 border border-v-dark-border rounded-xl">
        <p className="font-bold text-v-white text-sm">Respaldos automáticos</p>
        <p className="text-xs text-v-gray mt-0.5">
          La programación automática todavía no está activa. Puedes generar respaldos desde el sistema o guardar archivos SQL existentes en el bucket privado.
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
            <p className="text-xs text-v-gray mt-0.5">Guarde un archivo SQL existente en el almacenamiento privado. Subirlo no ejecuta ni restaura su contenido.</p>
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
          <Button
            variant="outline"
            onClick={handleUploadBackup}
            isLoading={isUploading}
            disabled={!selectedFile || isUploading}
            className="w-full font-semibold"
          >
            Guardar en Supabase Storage
          </Button>
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

    </div>
  );
};

export default BackupSection;
