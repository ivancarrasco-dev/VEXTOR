import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle, Send } from 'lucide-react';
import { Button } from '../ui/Button';
import { Select } from '../ui/Select';
import { showAlert } from '../../utils/sweetalert';

export const IncidentReportModal = ({ isOpen, onClose, busPlaca, rutaCodigo }) => {
  const [incidentType, setIncidentType] = useState('mecanico');
  const [severity, setSeverity] = useState('media');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!description.trim()) {
      showAlert('Atención', 'Por favor describe la novedad antes de enviar.', 'warning');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      showAlert('Novedad Registrada', 'El reporte ha sido enviado al centro de control VEXTOR.', 'success');
      setDescription('');
      onClose();
    }, 600);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="bg-v-dark-soft border border-v-dark-border rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="p-6 border-b border-v-dark-border bg-v-dark/40 flex items-center justify-between">
            <div className="flex items-center gap-3.5 text-left">
              <div className="h-12 w-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
                <AlertTriangle size={24} />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-v-white tracking-tight">Reporte de Novedades e Incidentes</h3>
                <p className="text-xs text-v-gray mt-0.5">Notificación inmediata a logística y centro de mando.</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-v-gray hover:text-v-white hover:bg-v-dark-border/40 rounded-xl transition-colors cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4 text-left">
            {(busPlaca || rutaCodigo) && (
              <div className="p-3 bg-v-dark/50 border border-v-dark-border rounded-xl text-xs text-v-gray flex items-center justify-between">
                <span>Vehículo: <strong className="text-v-white">{busPlaca || 'Sin asignar'}</strong></span>
                <span>Ruta: <strong className="text-primary">{rutaCodigo || 'General'}</strong></span>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-v-gray font-mono">Tipo de Novedad</label>
              <Select
                value={incidentType}
                onChange={(e) => setIncidentType(e.target.value)}
              >
                <option value="mecanico">Avería o Falla Mecánica</option>
                <option value="trafico">Tráfico Pesado / Bloqueo de Vía</option>
                <option value="accidente">Incidente / Colisión de Tránsito</option>
                <option value="desvio">Desvío Obligatorio de Ruta</option>
                <option value="pasajero">Situación con Pasajero</option>
                <option value="otro">Otra Novedad Operativa</option>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-v-gray font-mono">Nivel de Gravedad</label>
              <Select
                value={severity}
                onChange={(e) => setSeverity(e.target.value)}
              >
                <option value="baja">Baja - Informativa / Retraso Menor</option>
                <option value="media">Media - Requiere Asistencia Cercana</option>
                <option value="alta">Alta - Parada Inmediata / Apoyo Urgente</option>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-v-gray font-mono">Descripción del Suceso</label>
              <textarea
                rows={4}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Detalla lo sucedido, ubicación aproximada y medidas tomadas..."
                className="w-full bg-v-dark border border-v-dark-border rounded-xl p-3 text-sm text-v-white placeholder-v-gray focus:outline-none focus:border-primary transition-colors resize-none"
              />
            </div>

            <div className="pt-3 border-t border-v-dark-border flex justify-end gap-3">
              <Button type="button" variant="ghost" onClick={onClose} className="cursor-pointer">
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="primary"
                isLoading={isSubmitting}
                className="flex items-center gap-2 cursor-pointer shadow-md"
              >
                <Send size={16} /> Enviar Inmediato
              </Button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default IncidentReportModal;
