import React from 'react';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';

const VehiclesSection = ({
  vehicleConfigs,
  setVehicleConfigs,
  newTagInput,
  setNewTagInput,
  handleAddTag,
  handleRemoveTag
}) => {
  return (
    <div className="space-y-6">
      {/* General settings input block */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-v-dark/20 p-4 rounded-xl border border-v-dark-border/40">
        <Input
          label="Capacidad de pasajeros máxima permitida"
          type="number"
          value={vehicleConfigs.maxCapacity}
          onChange={(e) => setVehicleConfigs({ ...vehicleConfigs, maxCapacity: e.target.value })}
        />
        <Input
          label="Kilometraje máximo límite del sistema"
          type="number"
          value={vehicleConfigs.maxKm}
          onChange={(e) => setVehicleConfigs({ ...vehicleConfigs, maxKm: e.target.value })}
        />
      </div>

      {/* Tags manager */}
      <div className="space-y-4">
        <h4 className="font-bold text-v-white text-sm">Gestión de Parámetros Globales</h4>

        {['types', 'brands', 'models', 'colors', 'fuels'].map((cat) => {
          const labels = {
            types: 'Tipos de Vehículo',
            brands: 'Marcas Registradas',
            models: 'Modelos Habilitados',
            colors: 'Colores Homologados',
            fuels: 'Tipos de Combustible'
          };
          return (
            <div key={cat} className="space-y-2 border border-v-dark-border/50 p-4 rounded-xl bg-v-dark/10">
              <label className="text-xs font-bold text-v-gray uppercase tracking-wider">{labels[cat]}</label>
              <div className="flex flex-wrap gap-1.5 py-1">
                {vehicleConfigs[cat].map((tag) => (
                  <span key={tag} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-v-dark text-v-white border border-v-dark-border rounded-lg text-xs font-medium">
                    {tag}
                    <button type="button" onClick={() => handleRemoveTag(cat, tag)} className="text-red-400 hover:text-red-300 transition-colors cursor-pointer">
                      ×
                    </button>
                  </span>
                ))}
              </div>

              {/* Inline add item */}
              <div className="flex gap-2 max-w-sm mt-2">
                <input
                  type="text"
                  placeholder="Agregar elemento..."
                  value={newTagInput.type === cat ? newTagInput.value : ''}
                  onChange={(e) => setNewTagInput({ type: cat, value: e.target.value })}
                  className="bg-v-dark border border-v-dark-border rounded-lg px-2.5 py-1 text-xs text-v-white focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary flex-1"
                />
                <Button
                  variant="primary"
                  size="sm"
                  type="button"
                  onClick={() => {
                    if (newTagInput.type === cat) {
                      handleAddTag(cat);
                    } else {
                      setNewTagInput({ type: cat, value: newTagInput.value });
                      setTimeout(() => handleAddTag(cat), 50);
                    }
                  }}
                  className="h-8 px-3 text-xs font-semibold"
                >
                  Agregar
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default VehiclesSection;
