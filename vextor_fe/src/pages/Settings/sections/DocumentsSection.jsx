import React from 'react';
import { cn } from '../../../utils/cn';

const DocumentsSection = ({ documentsState, setDocumentsState, showToast }) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {Object.keys(documentsState).map((key) => {
          const doc = documentsState[key];
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
                  onClick={() => {
                    const newNum = prompt(`Editar número para ${labels[key]}:`, doc.number);
                    if (newNum) {
                      setDocumentsState({
                        ...documentsState,
                        [key]: { ...doc, number: newNum }
                      });
                      showToast('Documento editado.');
                    }
                  }}
                  className="text-xs font-semibold text-primary hover:underline cursor-pointer"
                >
                  Editar
                </button>
                <span className="text-v-dark-border">|</span>
                <button
                  type="button"
                  onClick={() => {
                    const newDate = prompt(`Establecer nueva fecha de vencimiento (AAAA-MM-DD):`, doc.expiry);
                    if (newDate) {
                      setDocumentsState({
                        ...documentsState,
                        [key]: { ...doc, expiry: newDate, status: new Date(newDate) > new Date() ? 'Vigente' : 'Vencido' }
                      });
                      showToast('Vencimiento actualizado.');
                    }
                  }}
                  className="text-xs font-semibold text-primary hover:underline cursor-pointer"
                >
                  Actualizar Vence
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DocumentsSection;
