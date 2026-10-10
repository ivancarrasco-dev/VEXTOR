import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Calendar, X } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { cn } from '../../../utils/cn';

const DocumentsSection = ({ documentsState, setDocumentsState, showToast }) => {
  const [modalConfig, setModalConfig] = useState(null);
  const [inputValue, setInputValue] = useState('');

  const labels = {
    soat: 'SOAT Nacional',
    insurance: 'Seguro de Responsabilidad Civil Extracontractual',
    techno: 'Revisión Técnico Mecánica obligatoria',
    licenses: 'Licencias de Operación / Tarjetas de Operación'
  };

  const statuses = {
    'Vigente': 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    'Próximo a Vencer': 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    'Vencido': 'bg-red-500/10 text-red-500 border-red-500/20'
  };

  const handleOpenEditNumber = (key, doc) => {
    setInputValue(doc.number || '');
    setModalConfig({
      key,
      title: `Editar Número - ${labels[key]}`,
      label: 'Número de Documento',
      type: 'text',
      onSave: (val) => {
        setDocumentsState(prev => ({
          ...prev,
          [key]: { ...doc, number: val }
        }));
        showToast('Número de documento editado correctamente.');
      }
    });
  };

  const handleOpenEditExpiry = (key, doc) => {
    setInputValue(doc.expiry || '');
    setModalConfig({
      key,
      title: `Actualizar Vencimiento - ${labels[key]}`,
      label: 'Fecha de Vencimiento',
      type: 'date',
      onSave: (val) => {
        const isVigente = new Date(val) > new Date();
        setDocumentsState(prev => ({
          ...prev,
          [key]: {
            ...doc,
            expiry: val,
            status: isVigente ? 'Vigente' : 'Vencido'
          }
        }));
        showToast('Fecha de vencimiento actualizada.');
      }
    });
  };

  const handleModalSubmit = (e) => {
    e.preventDefault();
    if (modalConfig && inputValue.trim()) {
      modalConfig.onSave(inputValue.trim());
      setModalConfig(null);
    }
  };

  return (
    <div className="space-y-6 text-left">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {Object.keys(documentsState).map((key) => {
          const doc = documentsState[key];
          return (
            <div key={key} className="p-4 border border-v-dark-border bg-v-dark/20 rounded-xl space-y-3 relative">
              <span className={cn("absolute top-3 right-3 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase border", statuses[doc.status])}>
                {doc.status}
              </span>
              <h4 className="font-bold text-sm text-v-white pr-24">{labels[key]}</h4>
              <div className="space-y-1 mt-1 text-xs text-v-gray">
                <p>No. Documento: <strong className="text-v-white">{doc.number}</strong></p>
                <p>Vence el: <strong className="text-v-white">{doc.expiry}</strong></p>
              </div>

              <div className="flex gap-2 pt-2 border-t border-v-dark-border/40 justify-end">
                <button
                  type="button"
                  onClick={() => handleOpenEditNumber(key, doc)}
                  className="text-xs font-semibold text-primary hover:underline cursor-pointer"
                >
                  Editar
                </button>
                <span className="text-v-dark-border">|</span>
                <button
                  type="button"
                  onClick={() => handleOpenEditExpiry(key, doc)}
                  className="text-xs font-semibold text-primary hover:underline cursor-pointer"
                >
                  Actualizar Vence
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Styled Dialog Modal for Document Updating */}
      <AnimatePresence>
        {modalConfig && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-v-dark-soft border border-v-dark-border p-6 rounded-2xl w-full max-w-md shadow-2xl space-y-5"
            >
              <div className="flex justify-between items-center border-b border-v-dark-border pb-3">
                <div className="flex items-center gap-2 text-v-white font-extrabold text-sm">
                  {modalConfig.type === 'date' ? <Calendar size={18} className="text-primary" /> : <FileText size={18} className="text-primary" />}
                  <span>{modalConfig.title}</span>
                </div>
                <button
                  onClick={() => setModalConfig(null)}
                  className="p-1 text-v-gray hover:text-v-white hover:bg-v-dark-border/40 rounded-lg transition-colors cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleModalSubmit} className="space-y-4">
                <Input
                  label={modalConfig.label}
                  type={modalConfig.type}
                  required
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  autoFocus
                />

                <div className="flex justify-end gap-2.5 pt-2">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setModalConfig(null)}
                    className="cursor-pointer"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    className="cursor-pointer font-bold"
                  >
                    Guardar Cambios
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DocumentsSection;
