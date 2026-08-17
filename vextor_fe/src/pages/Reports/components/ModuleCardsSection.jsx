import { Truck, Users, MapPin, Wrench, Sliders } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { cn } from '../../../utils/cn';
import { useTranslation } from 'react-i18next';

export const ModuleCardsSection = ({
  activeReport,
  counts,
  isLoadingCounts,
  onSelectReport,
  isExporting
}) => {
  const { t } = useTranslation();

  return (
    <section className="space-y-4">
      <h3 className="text-lg font-bold text-v-white flex items-center gap-2">
        <Sliders size={18} className="text-primary" /> Reportes por módulo
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* VEHICLES MODULE CARD */}
        <div
          className={cn(
            "bg-v-dark-soft border p-6 rounded-2xl flex flex-col justify-between transition-colors group relative overflow-hidden",
            activeReport === 'vehicles' ? "border-primary shadow-[0_0_15px_rgba(16,185,129,0.08)]" : "border-v-dark-border hover:border-primary/50"
          )}
        >
          <div>
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 rounded-xl bg-v-dark border border-v-dark-border text-primary group-hover:scale-110 transition-transform shrink-0">
                <Truck size={24} />
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold text-primary uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/10">
                  {t('sidebar.vehicles', 'Vehículos')}
                </span>
              </div>
            </div>
            <div className="mb-5">
              <p className="text-v-gray text-xs font-medium mb-0.5">{t('reports.stats.totalRecords', 'Total registrados')}</p>
              <h3 className="text-3xl font-bold text-v-white">
                {isLoadingCounts ? '...' : counts.vehicles}
              </h3>
              <p className="text-v-gray text-xs mt-1.5 leading-snug">Monitoreo de estado operativo, marca, kilometraje y tipos de flota.</p>
            </div>
          </div>
          <Button
            variant={activeReport === 'vehicles' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => onSelectReport('vehicles')}
            className="w-full font-bold mt-auto cursor-pointer"
            disabled={isExporting}
          >
            {t('reports.btnGenerate', 'Generar Vista Previa')}
          </Button>
        </div>

        {/* DRIVERS MODULE CARD */}
        <div
          className={cn(
            "bg-v-dark-soft border p-6 rounded-2xl flex flex-col justify-between transition-colors group relative overflow-hidden",
            activeReport === 'drivers' ? "border-primary shadow-[0_0_15px_rgba(16,185,129,0.08)]" : "border-v-dark-border hover:border-primary/50"
          )}
        >
          <div>
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 rounded-xl bg-v-dark border border-v-dark-border text-primary group-hover:scale-110 transition-transform shrink-0">
                <Users size={24} />
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold text-primary uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/10">
                  Conductores
                </span>
              </div>
            </div>
            <div className="mb-5">
              <p className="text-v-gray text-xs font-medium mb-0.5">Total registrados</p>
              <h3 className="text-3xl font-bold text-v-white">
                {isLoadingCounts ? '...' : counts.drivers}
              </h3>
              <p className="text-v-gray text-xs mt-1.5 leading-snug">Información de licencias, cédulas de identidad, teléfono y estados.</p>
            </div>
          </div>
          <Button
            variant={activeReport === 'drivers' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => onSelectReport('drivers')}
            className="w-full font-bold mt-auto cursor-pointer"
            disabled={isExporting}
          >
            Generar Vista Previa
          </Button>
        </div>

        {/* ROUTES MODULE CARD */}
        <div
          className={cn(
            "bg-v-dark-soft border p-6 rounded-2xl flex flex-col justify-between transition-colors group relative overflow-hidden",
            activeReport === 'routes' ? "border-primary shadow-[0_0_15px_rgba(16,185,129,0.08)]" : "border-v-dark-border hover:border-primary/50"
          )}
        >
          <div>
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 rounded-xl bg-v-dark border border-v-dark-border text-primary group-hover:scale-110 transition-transform shrink-0">
                <MapPin size={24} />
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold text-primary uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/10">
                  Rutas
                </span>
              </div>
            </div>
            <div className="mb-5">
              <p className="text-v-gray text-xs font-medium mb-0.5">Total registradas</p>
              <h3 className="text-3xl font-bold text-v-white">
                {isLoadingCounts ? '...' : counts.routes}
              </h3>
              <p className="text-v-gray text-xs mt-1.5 leading-snug">Asignación de choferes, vehículos, coordenadas y progreso del viaje.</p>
            </div>
          </div>
          <Button
            variant={activeReport === 'routes' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => onSelectReport('routes')}
            className="w-full font-bold mt-auto cursor-pointer"
            disabled={isExporting}
          >
            Generar Vista Previa
          </Button>
        </div>

        {/* MAINTENANCE MODULE CARD */}
        <div
          className={cn(
            "bg-v-dark-soft border p-6 rounded-2xl flex flex-col justify-between transition-colors group relative overflow-hidden",
            activeReport === 'maintenances' ? "border-primary shadow-[0_0_15px_rgba(16,185,129,0.08)]" : "border-v-dark-border hover:border-primary/50"
          )}
        >
          <div>
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 rounded-xl bg-v-dark border border-v-dark-border text-primary group-hover:scale-110 transition-transform shrink-0">
                <Wrench size={24} />
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold text-primary uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/10">
                  Mantenimientos
                </span>
              </div>
            </div>
            <div className="mb-5">
              <p className="text-v-gray text-xs font-medium mb-0.5">Total registrados</p>
              <h3 className="text-3xl font-bold text-v-white">
                {isLoadingCounts ? '...' : counts.maintenances}
              </h3>
              <p className="text-v-gray text-xs mt-1.5 leading-snug">Seguimiento de costos operativos, tipos preventivos y programaciones.</p>
            </div>
          </div>
          <Button
            variant={activeReport === 'maintenances' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => onSelectReport('maintenances')}
            className="w-full font-bold mt-auto cursor-pointer"
            disabled={isExporting}
          >
            Generar Vista Previa
          </Button>
        </div>
      </div>
    </section>
  );
};
