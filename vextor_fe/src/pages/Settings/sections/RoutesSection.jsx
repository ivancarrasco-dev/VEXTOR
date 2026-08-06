import React from 'react';
import { Button } from '../../../components/ui/Button';

const RoutesSection = ({
  routeConfigs,
  newTagInput,
  setNewTagInput,
  handleAddRouteConfig,
  handleRemoveRouteConfig
}) => {
  return (
    <div className="space-y-6">
      {['zones', 'cities', 'centers'].map((cat) => {
        const labels = {
          zones: 'Zonas Operativas',
          cities: 'Ciudades de Operación',
          centers: 'Centros Logísticos y Bodegas'
        };
        return (
          <div key={cat} className="space-y-2 border border-v-dark-border/50 p-4 rounded-xl bg-v-dark/10">
            <label className="text-xs font-bold text-v-gray uppercase tracking-wider">{labels[cat]}</label>
            <div className="flex flex-wrap gap-1.5 py-1">
              {routeConfigs[cat].map((item) => (
                <span key={item} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-v-dark text-v-white border border-v-dark-border rounded-lg text-xs font-medium">
                  {item}
                  <button type="button" onClick={() => handleRemoveRouteConfig(cat, item)} className="text-red-400 hover:text-red-300 transition-colors cursor-pointer">
                    ×
                  </button>
                </span>
              ))}
            </div>

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
                    handleAddRouteConfig(cat);
                  } else {
                    setNewTagInput({ type: cat, value: newTagInput.value });
                    setTimeout(() => handleAddRouteConfig(cat), 50);
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
  );
};

export default RoutesSection;
