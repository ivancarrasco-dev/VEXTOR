import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Truck,
  Users,
  Route,
  Wrench,
  Bell,
  BarChart3,
  CheckCircle2,
  Clock,
  ChevronRight,
  MapPin,
  AlertTriangle,
  Monitor
} from 'lucide-react';

import {
  mockVehiclesData,
  mockDriversData,
  mockRoutesData,
  mockMaintenanceData,
  mockAlertsData,
  mockReportsData,
} from '../mockData';

/**
 * ProductPreviewSection Component
 *
 * Responsabilidad:
 * Responder a la pregunta: "¿Cómo se ve VEXTOR?"
 *
 * Sección de demostración visual e interactiva del producto VEXTOR.
 * Permite al cliente B2B visualizar el aspecto de la interfaz, dashboard, módulos,
 * vehículos, rutas e información operativa del sistema.
 *
 * ⚠️ AISLAMIENTO DE DATOS:
 * Utiliza única y exclusivamente datos ficticios (mock data) importados desde `mockData.js`.
 * No se conecta a backend, base de datos, sesiones ni APIs reales.
 */
const ProductPreviewSection = () => {
  const [activeTab, setActiveTab] = useState('vehicles');

  const tabs = [
    { id: 'vehicles', name: 'Vehículos', icon: Truck, badge: 'Flota' },
    { id: 'drivers', name: 'Conductores', icon: Users, badge: 'Personal' },
    { id: 'routes', name: 'Rutas', icon: Route, badge: 'Itinerarios' },
    { id: 'maintenance', name: 'Mantenimiento', icon: Wrench, badge: 'Taller' },
    { id: 'alerts', name: 'Alertas', icon: Bell, badge: 'En Vivo' },
    { id: 'reports', name: 'Reportes', icon: BarChart3, badge: 'KPIs' },
  ];

  return (
    <section id="demo" className="py-16 sm:py-20 lg:py-24 bg-v-dark border-b border-v-dark-border relative overflow-hidden transition-colors duration-300">
      {/* Background glow effect sutil */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[640px] h-[640px] bg-[#124A2F]/8 dark:bg-[#A6C98F]/8 blur-3xl rounded-full pointer-events-none -z-0" />

      <div className="container mx-auto px-4 sm:px-6 relative z-10">

        {/* ENCABEZADO DE LA SECCIÓN */}
        <div className="text-center max-w-3xl mx-auto mb-12 lg:mb-16">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#124A2F]/10 dark:bg-[#A6C98F]/10 border border-[#124A2F]/20 dark:border-[#A6C98F]/20 text-[#124A2F] dark:text-[#A6C98F] text-xs font-bold uppercase tracking-wider mb-4"
          >
            <Monitor size={16} />
            Demostración de Plataforma
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-v-white mb-5 tracking-tight leading-[1.18]"
          >
            Así se ve la plataforma <br className="hidden sm:inline" />
            que <span className="text-[#124A2F] dark:text-[#A6C98F]">su empresa utilizará</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-base sm:text-lg text-v-gray leading-relaxed max-w-2xl mx-auto font-normal"
          >
            Explore la interfaz, paneles interactivos, estados de flota y módulos operativos con datos de prueba diseñados para la gestión real.
          </motion.p>
        </div>

        {/* TAB SELECTOR / PESTAÑAS */}
        <div className="flex items-center justify-start lg:justify-center gap-2 overflow-x-auto pb-4 mb-8 no-scrollbar">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-semibold text-xs sm:text-sm whitespace-nowrap transition-all duration-200 cursor-pointer ${
                  isActive
                    ? 'bg-[#124A2F] text-white shadow-sm'
                    : 'bg-v-dark-soft border border-v-dark-border text-v-gray hover:text-v-white hover:border-[#124A2F]/40'
                }`}
              >
                <Icon size={17} className={isActive ? 'text-white' : 'text-[#124A2F] dark:text-[#A6C98F]'} />
                <span>{tab.name}</span>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-md uppercase tracking-wider font-bold ${
                    isActive ? 'bg-white/20 text-white' : 'bg-v-dark text-v-gray'
                  }`}
                >
                  {tab.badge}
                </span>
              </button>
            );
          })}
        </div>

        {/* CONTAINER MOCKUP DEL DASHBOARD */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-5xl mx-auto bg-v-dark-soft border border-v-dark-border rounded-2xl p-4 sm:p-6 lg:p-8 shadow-md relative overflow-hidden"
        >
          {/* TOP BAR SIMULATOR */}
          <div className="flex items-center justify-between pb-4 mb-6 border-b border-v-dark-border flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-400 inline-block" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
              </div>
              <span className="text-xs font-mono text-v-gray pl-2 border-l border-v-dark-border">
                app.vextor.com / modulo-operativo
              </span>
            </div>

            <div className="flex items-center gap-3 text-xs">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#124A2F]/10 dark:bg-[#A6C98F]/10 text-[#124A2F] dark:text-[#A6C98F] font-bold border border-[#124A2F]/20 dark:border-[#A6C98F]/20">
                <span className="w-2 h-2 rounded-full bg-[#124A2F] dark:bg-[#A6C98F] animate-pulse" />
                Sistema Operativo VEXTOR activo
              </span>
            </div>
          </div>

          {/* TAB CONTENT PANEL */}
          <div className="min-h-[380px] sm:min-h-[420px] flex flex-col justify-between">
            <AnimatePresence mode="wait">
              {/* VISTA VEHÍCULOS */}
              {activeTab === 'vehicles' && (
                <motion.div
                  key="vehicles"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-6"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h3 className="text-xl font-bold text-v-white">Hoja de Vida y Estado de Flota</h3>
                      <p className="text-xs sm:text-sm text-v-gray">Control técnico y documental de cada unidad de transporte especial.</p>
                    </div>
                    <span className="text-xs font-semibold text-[#124A2F] dark:text-[#A6C98F] bg-[#124A2F]/10 dark:bg-[#A6C98F]/10 px-3 py-1 rounded-lg border border-[#124A2F]/20 dark:border-[#A6C98F]/20 self-start sm:self-auto">
                      {mockVehiclesData.summary.totalRegistered} Vehículos Registrados
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {mockVehiclesData.items.map((veh) => (
                      <div key={veh.id} className="p-4 rounded-xl bg-v-dark border border-v-dark-border hover:border-[#124A2F]/40 dark:hover:border-[#A6C98F]/40 transition-colors shadow-2xs">
                        <div className="flex items-center justify-between mb-3">
                          <span className="font-mono text-xs font-bold text-v-white bg-v-dark-soft px-2.5 py-1 rounded border border-v-dark-border">
                            {veh.code} ({veh.plate})
                          </span>
                          <span
                            className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                              veh.statusType === 'warning'
                                ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                                : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                            }`}
                          >
                            {veh.status}
                          </span>
                        </div>
                        <p className="text-xs text-v-gray font-medium mb-1">{veh.model} • Cap. {veh.capacity}</p>
                        <p className="text-[11px] text-v-gray/80 mb-3">{veh.company}</p>
                        <div className="space-y-1.5 text-xs text-v-gray">
                          {veh.documents.soat && (
                            <div className="flex justify-between">
                              <span>SOAT:</span>
                              <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                                <CheckCircle2 size={12}/> {veh.documents.soat.status} ({veh.documents.soat.days} días)
                              </span>
                            </div>
                          )}
                          {veh.documents.techno && (
                            <div className="flex justify-between">
                              <span>Tecno-mecánica:</span>
                              <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                                <CheckCircle2 size={12}/> {veh.documents.techno.status} ({veh.documents.techno.days} días)
                              </span>
                            </div>
                          )}
                          {veh.documents.oilCheck && (
                            <div className="flex justify-between">
                              <span>Revisión Aceite:</span>
                              <span className="text-amber-500 font-semibold flex items-center gap-1">
                                <Clock size={12}/> {veh.documents.oilCheck.status}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* VISTA CONDUCTORES */}
              {activeTab === 'drivers' && (
                <motion.div
                  key="drivers"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-6"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h3 className="text-xl font-bold text-v-white">Expediente de Conductores y Asignaciones</h3>
                      <p className="text-xs sm:text-sm text-v-gray">Asegure que su personal cuente con licencias vigentes y asignación clara.</p>
                    </div>
                    <span className="text-xs font-semibold text-[#124A2F] dark:text-[#A6C98F] bg-[#124A2F]/10 dark:bg-[#A6C98F]/10 px-3 py-1 rounded-lg border border-[#124A2F]/20 dark:border-[#A6C98F]/20 self-start sm:self-auto">
                      {mockDriversData.summary.totalActive} Conductores Activos
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {mockDriversData.items.map((drv) => (
                      <div key={drv.id} className="p-4 rounded-xl bg-v-dark border border-v-dark-border flex items-center justify-between shadow-2xs">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-[#124A2F]/10 dark:bg-[#A6C98F]/10 border border-[#124A2F]/20 dark:border-[#A6C98F]/20 text-[#124A2F] dark:text-[#A6C98F] flex items-center justify-center font-bold text-xs">
                            {drv.initials}
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-v-white">{drv.name}</h4>
                            <p className="text-xs text-v-gray">{drv.licenseCategory} • Vence: {drv.licenseExpiry}</p>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/20">
                            {drv.assignedVehicle ? `Vehículo: ${drv.assignedVehicle}` : drv.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* VISTA RUTAS */}
              {activeTab === 'routes' && (
                <motion.div
                  key="routes"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-6"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h3 className="text-xl font-bold text-v-white">Programación e Itinerarios de Transporte</h3>
                      <p className="text-xs sm:text-sm text-v-gray">Control de origen, destino y tiempos de cumplimiento de cada trayecto.</p>
                    </div>
                    <span className="text-xs font-semibold text-[#124A2F] dark:text-[#A6C98F] bg-[#124A2F]/10 dark:bg-[#A6C98F]/10 px-3 py-1 rounded-lg border border-[#124A2F]/20 dark:border-[#A6C98F]/20 self-start sm:self-auto">
                      {mockRoutesData.summary.scheduledToday} Rutas en Programación Hoy
                    </span>
                  </div>

                  <div className="space-y-3">
                    {mockRoutesData.items.map((rt) => (
                      <div key={rt.id} className="p-4 rounded-xl bg-v-dark border border-v-dark-border flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-2xs">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-[#124A2F]/10 dark:bg-[#A6C98F]/10 text-[#124A2F] dark:text-[#A6C98F] border border-[#124A2F]/20">
                            <MapPin size={18} />
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-v-white">{rt.name}</h4>
                            <p className="text-xs text-v-gray">
                              Vehículo: <span className="font-mono text-v-white">{rt.vehicle}</span> • Conductor: {rt.driver}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 text-xs">
                          <span className="text-v-gray flex items-center gap-1 font-medium"><Clock size={14}/> {rt.schedule}</span>
                          <span
                            className={`px-2.5 py-1 rounded-full font-semibold ${
                              rt.statusType === 'success'
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                                : 'bg-v-dark-soft text-v-gray border border-v-dark-border'
                            }`}
                          >
                            {rt.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* VISTA MANTENIMIENTO */}
              {activeTab === 'maintenance' && (
                <motion.div
                  key="maintenance"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-6"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h3 className="text-xl font-bold text-v-white">Plan Preventivo y Control de Taller</h3>
                      <p className="text-xs sm:text-sm text-v-gray">Evite varadas imprevistas mediante mantenimiento preventivo automatizado.</p>
                    </div>
                    <span className="text-xs font-semibold text-amber-500 bg-amber-500/10 px-3 py-1 rounded-lg border border-amber-500/20 self-start sm:self-auto">
                      {mockMaintenanceData.summary.scheduledThisWeek} Servicio Programado Esta Semana
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {mockMaintenanceData.items.map((maint) => (
                      <div key={maint.id} className="p-4 rounded-xl bg-v-dark border border-v-dark-border space-y-2 shadow-2xs">
                        <div className="flex items-center justify-between">
                          <span
                            className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1 ${
                              maint.statusType === 'warning' ? 'text-amber-500' : 'text-emerald-600 dark:text-emerald-400'
                            }`}
                          >
                            {maint.statusType === 'warning' ? <Wrench size={14} /> : <CheckCircle2 size={14} />}
                            {maint.title}
                          </span>
                          <span className="text-xs font-mono text-v-white font-bold">{maint.vehicle}</span>
                        </div>
                        <p className="text-sm font-bold text-v-white">{maint.mileageTarget}</p>
                        <p className="text-xs text-v-gray">{maint.details}</p>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* VISTA ALERTAS */}
              {activeTab === 'alerts' && (
                <motion.div
                  key="alerts"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-6"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h3 className="text-xl font-bold text-v-white">Centro de Alertas y Notificaciones Preventivas</h3>
                      <p className="text-xs sm:text-sm text-v-gray">Reciba avisos automáticos antes de que ocurran vencimientos o imprevistos.</p>
                    </div>
                    <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-lg border border-emerald-500/20 self-start sm:self-auto">
                      Operación Sin Riesgos Documentales
                    </span>
                  </div>

                  <div className="space-y-3">
                    {mockAlertsData.items.map((alt) => (
                      <div
                        key={alt.id}
                        className={`p-4 rounded-xl flex items-start gap-3 border shadow-2xs ${
                          alt.type === 'warning'
                            ? 'bg-amber-500/10 border-amber-500/30'
                            : 'bg-[#124A2F]/10 dark:bg-[#A6C98F]/10 border-[#124A2F]/20 dark:border-[#A6C98F]/20'
                        }`}
                      >
                        {alt.type === 'warning' ? (
                          <AlertTriangle className="text-amber-500 shrink-0 mt-0.5" size={18} />
                        ) : (
                          <Bell className="text-[#124A2F] dark:text-[#A6C98F] shrink-0 mt-0.5" size={18} />
                        )}
                        <div>
                          <h4 className="text-sm font-bold text-v-white">{alt.title}</h4>
                          <p className="text-xs text-v-gray mt-0.5">{alt.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* VISTA REPORTES */}
              {activeTab === 'reports' && (
                <motion.div
                  key="reports"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-6"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h3 className="text-xl font-bold text-v-white">Indicadores Operativos y Toma de Decisiones</h3>
                      <p className="text-xs sm:text-sm text-v-gray">Información consolidada de disponibilidad de flota, eficiencia e itinerarios.</p>
                    </div>
                    <span className="text-xs font-semibold text-[#124A2F] dark:text-[#A6C98F] bg-[#124A2F]/10 dark:bg-[#A6C98F]/10 px-3 py-1 rounded-lg border border-[#124A2F]/20 dark:border-[#A6C98F]/20 self-start sm:self-auto">
                      Actualización en Tiempo Real
                    </span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {mockReportsData.kpis.map((kpi) => (
                      <div key={kpi.id} className="p-4 rounded-xl bg-v-dark border border-v-dark-border text-center shadow-2xs">
                        <span className="text-xs text-v-gray font-medium">{kpi.label}</span>
                        <p className="text-2xl font-extrabold mt-1 text-[#124A2F] dark:text-[#A6C98F]">
                          {kpi.value}
                        </p>
                        <span className="text-[10px] text-v-gray">{kpi.subtext}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* BARRA INFERIOR DE CONVERSIÓN */}
            <div className="mt-8 pt-6 border-t border-v-dark-border flex flex-col sm:flex-row items-center justify-between gap-4">
              <span className="text-xs sm:text-sm text-v-gray text-center sm:text-left font-medium">
                ¿Desea ver cómo funcionaría VEXTOR adaptado a la cantidad de vehículos de su empresa?
              </span>
              <Link to="/contacto" className="shrink-0 w-full sm:w-auto">
                <button className="w-full sm:w-auto bg-[#124A2F] text-white font-semibold text-xs sm:text-sm px-5 py-2.5 rounded-lg hover:bg-[#0B3522] transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-xs hover:shadow-md">
                  <span>Solicitar demostración</span>
                  <ChevronRight size={16} />
                </button>
              </Link>
            </div>
          </div>
        </motion.div>

      </div>
    </section>
  );
};

export default ProductPreviewSection;
