import React from 'react';
import { RefreshCw, History } from 'lucide-react';

const AuditSection = ({ auditLogs, setAuditLogs, showToast }) => {
  return (
    <div className="space-y-6">
      {/* Audit list feed */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <p className="text-xs font-bold text-v-gray uppercase tracking-wider">Historial de Transacciones Recientes</p>
          <button
            type="button"
            onClick={() => {
              setAuditLogs([
                {
                  id: Date.now().toString(),
                  action: 'Consulta de Auditoría',
                  desc: 'El log de transacciones generales fue auditado y exportado en vista temporal.',
                  user: 'Admin Vextor',
                  date: new Date().toLocaleString(),
                  ip: '186.112.45.19'
                },
                ...auditLogs
              ]);
              showToast('Log de auditoría refrescado.');
            }}
            className="text-xs font-bold text-primary hover:underline flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw size={13} /> Refrescar Logs
          </button>
        </div>

        <div className="space-y-3">
          {auditLogs.map((log) => (
            <div key={log.id} className="p-4 border border-v-dark-border bg-v-dark/10 rounded-xl flex items-start gap-3 text-sm animate-in fade-in">
              <div className="h-8 w-8 rounded bg-v-dark border border-v-dark-border flex items-center justify-center shrink-0 text-v-gray">
                <History size={16} />
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                  <span className="font-bold text-v-white">{log.action}</span>
                  <span className="text-[11px] text-v-gray">{log.date}</span>
                </div>
                <p className="text-xs text-v-gray leading-relaxed">{log.desc}</p>
                <div className="flex items-center gap-2 pt-1 text-[11px] text-v-gray">
                  <span>Actor: <strong className="text-v-white">{log.user}</strong></span>
                  <span>•</span>
                  <span>IP: <strong className="text-v-white font-mono">{log.ip}</strong></span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AuditSection;
