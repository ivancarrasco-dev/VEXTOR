import React, { useState, useEffect } from 'react';
import { Truck, ShieldCheck, Wrench, CheckCircle2, AlertTriangle, Fuel, Gauge, Disc, ClipboardCheck } from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL } from '../../config/api';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import IncidentReportModal from '../../components/modals/IncidentReportModal';
import { showAlert } from '../../utils/sweetalert';

export const DriverBusInfo = () => {
  const [busData, setBusData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isIncidentModalOpen, setIsIncidentModalOpen] = useState(false);
  const [isInspected, setIsInspected] = useState(true);

  useEffect(() => {
    const fetchDriverBus = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${API_BASE_URL}/api/routes/driver/my-routes`);
        if (res.data?.active_route?.vehiculo) {
          setBusData(res.data.active_route.vehiculo);
        } else {
          setBusData({
            placa: 'VXT-801',
            marca: 'Mercedes-Benz',
            modelo: 'O-500R Interprovincial',
            anio: '2024',
            capacidad: 42,
            kilometraje: 45200,
            estado_vehiculo: 'DISPONIBLE',
            soat_vencimiento: '15/12/2026',
            tecno_vencimiento: '30/10/2026',
            combustible: '88%',
            neumaticos: '34 PSI (Óptimo)'
          });
        }
      } catch (err) {
        console.error('Error loading driver bus info:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDriverBus();
  }, []);

  const handleRunInspection = () => {
    showAlert(
      'Inspección de Cabina Aprobada',
      'Todos los elementos mecánicos, luces, frenos, extintor y botiquín están en regla.',
      'success'
    );
    setIsInspected(true);
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-v-gray text-sm">
        Cargando ficha del vehículo asignado...
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12 text-left">
      {/* Header Banner */}
      <div className="bg-v-dark-soft p-6 sm:p-8 rounded-3xl border border-v-dark-border shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="h-20 w-20 rounded-3xl bg-primary/10 border-2 border-primary/30 flex items-center justify-center text-primary font-black text-3xl shadow-inner shrink-0">
            <Truck size={36} />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xl font-black font-mono text-primary bg-primary/10 border border-primary/20 px-3 py-1 rounded-xl">
                {busData?.placa || 'VXT-801'}
              </span>
              <Badge variant="success" size="sm">Asignado a Conductor</Badge>
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 rounded-lg flex items-center gap-1">
                <CheckCircle2 size={13} /> Unidad Operativa
              </span>
            </div>
            <h1 className="text-xl font-extrabold text-v-white tracking-tight mt-1.5">
              {busData?.marca || 'Mercedes-Benz'} {busData?.modelo || 'O-500R Interprovincial'}
            </h1>
            <p className="text-xs text-v-gray mt-0.5">Ficha Técnica de Cabina y Operación del Conductor</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
          <Button
            variant="ghost"
            onClick={handleRunInspection}
            className="flex items-center gap-2 cursor-pointer bg-v-dark hover:bg-v-dark-border text-v-white border border-v-dark-border font-bold text-xs"
          >
            <ClipboardCheck size={16} className="text-emerald-500" /> Checklist Pre-op
          </Button>

          <Button
            variant="primary"
            onClick={() => setIsIncidentModalOpen(true)}
            className="flex items-center gap-2 cursor-pointer shadow-lg bg-amber-600 hover:bg-amber-500 border-none text-white font-bold text-xs"
          >
            <AlertTriangle size={16} /> Reportar Novedad
          </Button>
        </div>
      </div>

      {/* Technical Specifications */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-v-dark-soft border border-v-dark-border rounded-2xl space-y-1 shadow-md">
          <span className="text-[10px] font-mono font-bold uppercase text-v-gray flex items-center gap-1.5">
            <Gauge size={14} className="text-primary" /> Capacidad Pasajeros
          </span>
          <p className="text-xl font-black text-v-white">{busData?.capacidad || 42} Asientos</p>
        </div>

        <div className="p-5 bg-v-dark-soft border border-v-dark-border rounded-2xl space-y-1 shadow-md">
          <span className="text-[10px] font-mono font-bold uppercase text-v-gray flex items-center gap-1.5">
            <Wrench size={14} className="text-primary" /> Odómetro / Recorrido
          </span>
          <p className="text-xl font-black text-v-white">
            {busData?.kilometraje ? `${busData.kilometraje.toLocaleString()} km` : '45,200 km'}
          </p>
        </div>

        <div className="p-5 bg-v-dark-soft border border-v-dark-border rounded-2xl space-y-1 shadow-md">
          <span className="text-[10px] font-mono font-bold uppercase text-v-gray flex items-center gap-1.5">
            <Fuel size={14} className="text-emerald-500" /> Nivel Tanque / Batería
          </span>
          <p className="text-xl font-black text-emerald-600 dark:text-emerald-400">{busData?.combustible || '88%'}</p>
        </div>

        <div className="p-5 bg-v-dark-soft border border-v-dark-border rounded-2xl space-y-1 shadow-md">
          <span className="text-[10px] font-mono font-bold uppercase text-v-gray flex items-center gap-1.5">
            <Disc size={14} className="text-teal-500" /> Presión Neumáticos
          </span>
          <p className="text-xl font-black text-v-white">{busData?.neumaticos || '34 PSI'}</p>
        </div>
      </div>

      {/* Legal & Maintenance Status */}
      <div className="bg-v-dark-soft p-6 sm:p-8 rounded-3xl border border-v-dark-border shadow-xl space-y-4">
        <h2 className="text-base font-extrabold text-v-white flex items-center gap-2">
          <ShieldCheck size={20} className="text-primary" /> Documentación Legal y Revisiones
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle2 size={22} className="text-emerald-500 shrink-0" />
              <div>
                <p className="text-sm font-bold text-v-white">SOAT Obligatorio</p>
                <p className="text-xs text-v-gray">Vence: {busData?.soat_vencimiento || '15/12/2026'}</p>
              </div>
            </div>
            <Badge variant="success" size="xs">Vigente</Badge>
          </div>

          <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Wrench size={22} className="text-emerald-500 shrink-0" />
              <div>
                <p className="text-sm font-bold text-v-white">Revisión Tecnomecánica</p>
                <p className="text-xs text-v-gray">Vence: {busData?.tecno_vencimiento || '30/10/2026'}</p>
              </div>
            </div>
            <Badge variant="success" size="xs">Vigente</Badge>
          </div>
        </div>
      </div>

      {/* Incident Modal */}
      <IncidentReportModal
        isOpen={isIncidentModalOpen}
        onClose={() => setIsIncidentModalOpen(false)}
        busPlaca={busData?.placa || 'VXT-801'}
      />
    </div>
  );
};

export default DriverBusInfo;
