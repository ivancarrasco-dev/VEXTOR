import React from 'react';
import { Check } from 'lucide-react';
import { Select } from '../../../components/ui/Select';
import { cn } from '../../../utils/cn';
import { useTranslation } from 'react-i18next';

const AppearanceSection = ({
  theme,
  setTheme,
  appearanceColor,
  setAppearanceColor,
  appearanceLang,
  setAppearanceLang,
  showToast
}) => {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      {/* Theme Select */}
      <div className="space-y-3">
        <label className="text-sm font-bold text-v-white">{t('settings.appearance.themeMode')}</label>
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
                <p className="font-bold text-sm text-v-white">{t('settings.appearance.themeDark')}</p>
                <p className="text-xs text-v-gray mt-0.5">{t('settings.appearance.themeDarkDesc')}</p>
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
                <p className="font-bold text-sm text-v-white">{t('settings.appearance.themeLight')}</p>
                <p className="text-xs text-v-gray mt-0.5">{t('settings.appearance.themeLightDesc')}</p>
              </div>
            </div>
            {theme === 'light' && <Check size={18} className="text-primary" />}
          </button>
        </div>
      </div>

      {/* Primary Color Palette */}
      <div className="space-y-3">
        <label className="text-sm font-bold text-v-white">{t('settings.appearance.accentColor')}</label>
        <div className="flex gap-4 p-4 border border-v-dark-border bg-v-dark/20 rounded-xl">
          {[
            { name: 'emerald', label: t('settings.appearance.emerald'), hex: 'bg-emerald-500' },
            { name: 'blue', label: t('settings.appearance.blue'), hex: 'bg-blue-500' },
            { name: 'purple', label: t('settings.appearance.purple'), hex: 'bg-purple-500' },
            { name: 'amber', label: t('settings.appearance.amber'), hex: 'bg-amber-500' }
          ].map((col) => (
            <button
              key={col.name}
              type="button"
              onClick={() => {
                setAppearanceColor(col.name);
                showToast(t('settings.appearance.toastColor', { color: col.label }));
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
        <label className="text-sm font-medium text-v-gray">{t('settings.appearance.language')}</label>
        <Select
          value={appearanceLang}
          onChange={(e) => {
            setAppearanceLang(e.target.value);
            showToast(t('settings.appearance.toastLang'));
          }}
          className="max-w-xs"
        >
          <option value="es">{t('settings.appearance.langEs')}</option>
          <option value="en">{t('settings.appearance.langEn')}</option>
        </Select>
      </div>
    </div>
  );
};

export default AppearanceSection;
