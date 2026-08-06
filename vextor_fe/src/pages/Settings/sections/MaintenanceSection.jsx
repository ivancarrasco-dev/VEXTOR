import React from 'react';
import { Trash2 } from 'lucide-react';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';

const MaintenanceSection = ({
  maintenanceConfigs,
  setMaintenanceConfigs,
  workshopForm,
  setWorkshopForm,
  handleAddWorkshop,
  handleRemoveWorkshop
}) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-v-dark/20 p-4 rounded-xl border border-v-dark-border/40">
        <Input
          label="Intervalo de Mantenimiento Preventivo (km)"
          type="number"
          value={maintenanceConfigs.frequencyKm}
          onChange={(e) => setMaintenanceConfigs({ ...maintenanceConfigs, frequencyKm: e.target.value })}
        />
        <Input
          label="Intervalo de Mantenimiento Preventivo (días)"
          type="number"
          value={maintenanceConfigs.frequencyDays}
          onChange={(e) => setMaintenanceConfigs({ ...maintenanceConfigs, frequencyDays: e.target.value })}
        />
        <Input
          label="Alertar anticipadamente (km)"
          type="number"
          value={maintenanceConfigs.alertThresholdKm}
          onChange={(e) => setMaintenanceConfigs({ ...maintenanceConfigs, alertThresholdKm: e.target.value })}
        />
        <Input
          label="Alertar anticipadamente (días antes)"
          type="number"
          value={maintenanceConfigs.alertThresholdDays}
          onChange={(e) => setMaintenanceConfigs({ ...maintenanceConfigs, alertThresholdDays: e.target.value })}
        />
      </div>

      {/* Workshops lists */}
      <div className="space-y-4">
        <h4 className="font-bold text-v-white text-sm">Talleres de Convenio</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {maintenanceConfigs.workshops.map((w) => (
            <div key={w.name} className="p-3 border border-v-dark-border bg-v-dark/10 rounded-xl relative group animate-in fade-in">
              <button
                type="button"
                onClick={() => handleRemoveWorkshop(w.name)}
                className="absolute top-2 right-2 text-red-400 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer p-1"
              >
                <Trash2 size={14} />
              </button>
              <p className="font-bold text-sm text-v-white">{w.name}</p>
              <p className="text-xs text-v-gray mt-1">Dir: {w.address}</p>
              <p className="text-xs text-v-gray">Tlf: {w.phone}</p>
            </div>
          ))}
        </div>

        {/* Add workshop form */}
        <form onSubmit={handleAddWorkshop} className="bg-v-dark/30 p-4 border border-v-dark-border rounded-xl space-y-3">
          <p className="text-xs font-bold text-v-gray uppercase tracking-wider">Registrar Nuevo Taller de Convenio</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input
              type="text"
              placeholder="Nombre del Taller"
              required
              value={workshopForm.name}
              onChange={(e) => setWorkshopForm({ ...workshopForm, name: e.target.value })}
              className="bg-v-dark border border-v-dark-border rounded-lg px-3 py-2 text-xs text-v-white focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
            />
            <input
              type="text"
              placeholder="Dirección del Taller"
              value={workshopForm.address}
              onChange={(e) => setWorkshopForm({ ...workshopForm, address: e.target.value })}
              className="bg-v-dark border border-v-dark-border rounded-lg px-3 py-2 text-xs text-v-white focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
            />
            <input
              type="text"
              placeholder="Teléfono"
              value={workshopForm.phone}
              onChange={(e) => setWorkshopForm({ ...workshopForm, phone: e.target.value })}
              className="bg-v-dark border border-v-dark-border rounded-lg px-3 py-2 text-xs text-v-white focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
            />
          </div>
          <div className="flex justify-end">
            <Button type="submit" variant="primary" size="sm" className="text-xs h-8 px-4 font-semibold">Agregar Taller</Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MaintenanceSection;
