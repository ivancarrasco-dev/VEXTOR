import { motion } from 'framer-motion';
import { Layers, ShieldCheck, Route, Wrench, BarChart3, CheckCircle } from 'lucide-react';

/**
 * SolutionsSection Component
 *
 * Responsabilidad:
 * Responder a la pregunta: "¿Qué problemas resuelve VEXTOR?"
 *
 * Presentación rápida, compacta y comercial de las principales propuestas de valor y beneficios
 * de VEXTOR. Sin intentar mostrar la interfaz de la plataforma ni repetir elementos visuales
 * o mockups de la sección de demostración.
 */
const valuePropositions = [
  {
    title: "Gestión centralizada de la operación",
    desc: "Unifica los procesos administrativos y elimina la dispersión de documentos en carpetas o planillas aisladas.",
    icon: Layers,
    tag: "Eficiencia Administrativa"
  },
  {
    title: "Control de vehículos y conductores",
    desc: "Asegura la vigencia de SOAT, RTM y licencias, reduciendo riesgos legales y sanciones en carretera.",
    icon: ShieldCheck,
    tag: "Cumplimiento y Regla"
  },
  {
    title: "Seguimiento de rutas",
    desc: "Garantiza la trazabilidad de los itinerarios y el cumplimiento puntual de trayectos de origen a destino.",
    icon: Route,
    tag: "Trazabilidad Operativa"
  },
  {
    title: "Gestión del mantenimiento",
    desc: "Organiza servicios preventivos periódicos para evitar varadas costosas y tiempos inactivos no planificados.",
    icon: Wrench,
    tag: "Continuidad Operativa"
  },
  {
    title: "Información operativa organizada",
    desc: "Consolida indicadores clave de rendimiento para facilitar la toma de decisiones estratégicas rápidas.",
    icon: BarChart3,
    tag: "Decisiones Informadas"
  }
];

const SolutionsSection = () => {
  return (
    <section id="soluciones" className="py-12 sm:py-16 bg-v-dark-soft/40 border-b border-v-dark-border/70 transition-colors duration-300">
      <div className="container mx-auto px-4 sm:px-6">

        {/* ENCABEZADO DE LA SECCIÓN */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-[#124A2F] dark:text-[#A6C98F] font-bold tracking-wider uppercase text-xs mb-2.5"
          >
            Soluciones Integrales
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-v-white mb-3 tracking-tight leading-snug"
          >
            ¿Qué problemas resuelve <span className="text-[#124A2F] dark:text-[#A6C98F]">VEXTOR?</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-xs sm:text-sm text-v-gray leading-relaxed font-normal"
          >
            Capacidades clave enfocadas en optimizar el control de su flota, reducir sobrecostos y eliminar la desorganización operativa.
          </motion.p>
        </div>

        {/* GRID DE PROPUESTAS DE VALOR Y BENEFICIOS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {valuePropositions.map((item, index) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.07, duration: 0.35 }}
                className="p-5 rounded-xl bg-v-dark border border-v-dark-border hover:border-[#124A2F]/50 dark:hover:border-[#A6C98F]/50 transition-all duration-300 shadow-2xs hover:shadow-xs flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-3.5">
                    <div className="w-9 h-9 rounded-lg bg-[#124A2F]/10 dark:bg-[#A6C98F]/10 text-[#124A2F] dark:text-[#A6C98F] border border-[#124A2F]/20 dark:border-[#A6C98F]/20 flex items-center justify-center group-hover:bg-[#124A2F] group-hover:text-white group-hover:border-[#124A2F] transition-colors duration-300">
                      <Icon size={18} />
                    </div>
                    <span className="text-[10px] font-bold text-[#124A2F] dark:text-[#A6C98F] bg-[#124A2F]/10 dark:bg-[#A6C98F]/10 px-2 py-0.5 rounded border border-[#124A2F]/20 dark:border-[#A6C98F]/20">
                      {item.tag}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-v-white mb-2 group-hover:text-[#124A2F] dark:group-hover:text-[#A6C98F] transition-colors leading-snug">
                    {item.title}
                  </h3>

                  <p className="text-xs text-v-gray leading-relaxed font-normal">
                    {item.desc}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-v-dark-border/50 flex items-center gap-1.5 text-[11px] font-semibold text-[#124A2F] dark:text-[#A6C98F]">
                  <CheckCircle size={13} className="shrink-0" />
                  <span>Beneficio directo</span>
                </div>
              </motion.div>
            );
          })}
        </div>

      </div>
    </section>
  );
};

export default SolutionsSection;
