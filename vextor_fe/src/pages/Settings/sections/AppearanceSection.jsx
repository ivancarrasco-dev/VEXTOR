import React from 'react';
import { Check } from 'lucide-react';
import { Select } from '../../../components/ui/Select';
import { cn } from '../../../utils/cn';

const AppearanceSection = ({
  theme,
  setTheme,
  appearanceColor,
  setAppearanceColor,
  appearanceLang,
  setAppearanceLang,
  showToast
}) => {
  return (
    <div className="space-y-6">
      {/* Theme Select */}
      <div className="space-y-3">
        <label className="text-sm font-bold text-v-white">Modo del Tema</label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Theme Card Dark */}
          <button
            type="button"
            onClick={() => setTheme('dark')}
            className={cn(
              "p-4 rounded-xl border text-left flex items-center justify-between cursor-pointer transition-all duration-200",
              theme === 'dark'
                ? "border-primary bg-primary/5 shadow-lg shadow-primary/5"
                : "border-v-dark-border bg-v-dark/20 hover:bg-v-dark/40"
            )}
          >
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-v-white">
                🌙
              </div>
              <div>
                <p className="font-bold text-sm text-v-white">Tema Oscuro</p>
                <p className="text-xs text-v-gray mt-0.5">Optimizado para entornos nocturnos.</p>
              </div>
            </div>
            {theme === 'dark' && <Check size={18} className="text-primary" />}
          </button>

          {/* Theme Card Light */}
          <button
            type="button"
            onClick={() => setTheme('light')}
            className={cn(
              "p-4 rounded-xl border text-left flex items-center justify-between cursor-pointer transition-all duration-200",
              theme === 'light'
                ? "border-primary bg-primary/5 shadow-lg shadow-primary/5"
                : "border-v-dark-border bg-v-dark/20 hover:bg-v-dark/40"
            )}
          >
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center text-v-dark-constant">
                ☀️
              </div>
              <div>
                <p className="font-bold text-sm text-v-white">Tema Claro</p>
                <p className="text-xs text-v-gray mt-0.5">Diseño de alta fidelidad para luz solar.</p>
              </div>
            </div>
            {theme === 'light' && <Check size={18} className="text-primary" />}
          </button>
        </div>
      </div>

      {/* Primary Color Palette */}
      <div className="space-y-3">
        <label className="text-sm font-bold text-v-white">Color de Énfasis / Marca</label>
        <div className="flex gap-4 p-4 border border-v-dark-border bg-v-dark/20 rounded-xl">
          {[
            { name: 'emerald', label: 'Esmeralda', hex: 'bg-emerald-500' },
            { name: 'blue', label: 'Azul Real', hex: 'bg-blue-500' },
            { name: 'purple', label: 'Morado Vextor', hex: 'bg-purple-500' },
            { name: 'amber', label: 'Ámbar', hex: 'bg-amber-500' }
          ].map((col) => (
            <button
              key={col.name}
              type="button"
              onClick={() => {
                setAppearanceColor(col.name);
                showToast(`Color de acento cambiado a ${col.label}.`);
              }}
              className={cn(
                "flex flex-col items-center gap-1.5 p-2 rounded-lg border text-center cursor-pointer transition-all",
                appearanceColor === col.name ? "border-primary/50 bg-primary/5" : "border-transparent hover:bg-v-dark"
              )}
            >
              <span className={cn("h-6 w-6 rounded-full block border border-white/10", col.hex)} />
              <span className="text-[10px] font-semibold text-v-white">{col.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Language */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-v-gray">Idioma de la Interfaz</label>
        <Select
          value={appearanceLang}
          onChange={(e) => {
            setAppearanceLang(e.target.value);
            showToast('Idioma del sistema configurado.');
          }}
          className="max-w-xs"
        >
          <option value="es">Español (América Latina)</option>
          <option value="en">English (US)</option>
          <option value="pt">Português (Brasil)</option>
        </Select>
      </div>
    </div>
  );
};

export default AppearanceSection;
