import { motion } from 'framer-motion';
import { Shield, Cpu, Activity } from 'lucide-react';

/**
 * AboutSection Component
 *
 * Responsabilidad:
 * Sección breve y compacta que explica qué es VEXTOR en pocos segundos:
 * Plataforma SaaS orientada a la gestión y supervisión de operaciones de transporte.
 */
const AboutSection = () => {
  return (
    <section id="que-es" className="py-12 sm:py-16 bg-v-dark border-b border-v-dark-border/60 transition-colors duration-300">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="max-w-4xl mx-auto rounded-2xl bg-v-dark-soft border border-v-dark-border p-6 sm:p-8 md:p-10 shadow-xs relative overflow-hidden">

          {/* Subtle background gradient glow */}
          <div className="absolute -right-20 -top-20 w-64 h-64 bg-[#124A2F]/10 dark:bg-[#A6C98F]/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col md:flex-row items-center gap-6 md:gap-10 relative z-10">
            {/* Context Badge & Text */}
            <div className="flex-1 text-center md:text-left">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#124A2F]/10 dark:bg-[#A6C98F]/10 border border-[#124A2F]/20 dark:border-[#A6C98F]/20 text-[#124A2F] dark:text-[#A6C98F] text-[11px] font-bold uppercase tracking-wider mb-3"
              >
                ¿Qué es VEXTOR?
              </motion.div>

              <motion.h2
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-2xl sm:text-3xl font-extrabold text-v-white mb-3 tracking-tight leading-snug"
              >
                Plataforma integral para la <span className="text-[#124A2F] dark:text-[#A6C98F]">gestión de flotas y transporte</span>
              </motion.h2>

              <motion.p
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="text-xs sm:text-sm text-v-gray leading-relaxed font-normal"
              >
                VEXTOR es una solución SaaS diseñada para organizar, digitalizar y supervisar toda su operación de transporte. Centralice el control de sus vehículos, personal, rutas y mantenimientos en una interfaz moderna y ágil.
              </motion.p>
            </div>

            {/* Quick highlight pillars */}
            <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-1 gap-3 w-full md:w-64 shrink-0">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-v-dark border border-v-dark-border">
                <div className="p-2 rounded-lg bg-[#124A2F]/10 dark:bg-[#A6C98F]/10 text-[#124A2F] dark:text-[#A6C98F] shrink-0">
                  <Cpu size={18} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-v-white">Centralización digital</h4>
                  <p className="text-[11px] text-v-gray">Cero carpetas dispersas</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-xl bg-v-dark border border-v-dark-border">
                <div className="p-2 rounded-lg bg-[#124A2F]/10 dark:bg-[#A6C98F]/10 text-[#124A2F] dark:text-[#A6C98F] shrink-0">
                  <Activity size={18} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-v-white">Control en tiempo real</h4>
                  <p className="text-[11px] text-v-gray">Supervisión operativa</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-xl bg-v-dark border border-v-dark-border">
                <div className="p-2 rounded-lg bg-[#124A2F]/10 dark:bg-[#A6C98F]/10 text-[#124A2F] dark:text-[#A6C98F] shrink-0">
                  <Shield size={18} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-v-white">Prevención de riesgos</h4>
                  <p className="text-[11px] text-v-gray">Alertas y vencimientos</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
