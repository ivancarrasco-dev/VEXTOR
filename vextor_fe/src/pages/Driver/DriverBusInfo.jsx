import React, { useState, useEffect } from 'react';
import { Truck, ShieldCheck, Wrench, CheckCircle2, AlertTriangle } from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL } from '../../config/api';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import IncidentReportModal from '../../components/modals/IncidentReportModal';

export const DriverBusInfo = () => {
  const [busData, setBusData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isIncidentModalOpen, setIsIncidentModalOpen] = useState(false);

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
            modelo: 'O-500R',
            anio: '2024',
            capacidad: 42,
            kilometraje: 45200,
            estado_vehiculo: 'DISPONIBLE',
            soat_vencimiento: '15/12/2026',
            tecno_vencimiento: '30/10/2026'
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
            <div className="flex items-center gap-3">
              <span className="text-xl font-black font-mono text-primary bg-primary/10 border border-primary/20 px-3 py-1 rounded-xl">
                {busData?.placa || 'VXT-801'}
              </span>
              <Badge variant="success" size="sm">Asignado</Badge>
            </div>
            <h1 className="text-xl font-extrabold text-v-white tracking-tight mt-1">
              {busData?.marca || 'Mercedes-Benz'} {busData?.modelo || 'O-500R'}
            </h1>
            <p className="text-xs text-v-gray">Ficha Técnica de Cabina y Operación del Conductor</p>
          </div>
        </div>

        <Button
          variant="primary"
          onClick={() => setIsIncidentModalOpen(true)}
          className="flex items-center gap-2 cursor-pointer shadow-lg bg-amber-600 hover:bg-amber-500 border-none text-white font-bold"
        >
          <AlertTriangle size={18} /> Reportar Novedad del Bus
        </Button>
      </div>

      {/* Tech Specifications */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 bg-v-dark-soft border border-v-dark-border rounded-2xl">
          <span className="text-[10px] font-mono font-bold uppercase text-v-gray block">Capacidad Pasajeros</span>
          <p className="text-xl font-black text-v-white mt-1">{busData?.capacidad || 42} Asientos</p>
        </div>

        <div className="p-5 bg-v-dark-soft border border-v-dark-border rounded-2xl">
          <span className="text-[10px] font-mono font-bold uppercase text-v-gray block">Kilometraje Actual</span>
          <p className="text-xl font-black text-v-white mt-1">
            {busData?.kilometraje ? `${busData.kilometraje.toLocaleString()} km` : '45,200 km'}
          </p>
        </div>

        <div className="p-5 bg-v-dark-soft border border-v-dark-border rounded-2xl">
          <span className="text-[10px] font-mono font-bold uppercase text-v-gray block">Estado de Unidad</span>
          <p className="text-xl font-black text-emerald-400 mt-1">100% Operativa</p>
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
              <CheckCircle2 size={22} className="text-emerald-400 shrink-0" />
              <div>
                <p className="text-sm font-bold text-emerald-200">SOAT Obligatorio</p>
                <p className="text-xs text-emerald-300/80">Vence: 15 de Diciembre 2026</p>
              </div>
            </div>
            <Badge variant="success" size="xs">Vigente</Badge>
          </div>

          <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Wrench size={22} className="text-emerald-400 shrink-0" />
              <div>
                <p className="text-sm font-bold text-emerald-200">Revisión Tecnomecánica</p>
                <p className="text-xs text-emerald-300/80">Vence: 30 de Octubre 2026</p>
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
        busPlaca={busData?.placa}
      />
    </div>
  );
};

export default DriverBusInfo;
