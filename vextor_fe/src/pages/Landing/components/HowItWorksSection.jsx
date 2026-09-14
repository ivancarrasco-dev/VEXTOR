import { motion } from 'framer-motion';
import { UserPlus, Settings2, ShieldCheck, ArrowRight } from 'lucide-react';

/**
 * HowItWorksSection Component
 *
 * Responsabilidad:
 * Sección muy compacta con 3 pasos:
 * 01 — Registra (Organiza la información de tu operación)
 * 02 — Gestiona (Administra vehículos, conductores y procesos)
 * 03 — Supervisa (Consulta y controla la operación desde un solo lugar)
 *
 * Diseño horizontal en escritorio y vertical en móvil.
 */
const steps = [
  {
    number: "01",
    title: "Registra",
    description: "Organiza la información de tu operación.",
    icon: UserPlus
  },
  {
    number: "02",
    title: "Gestiona",
    description: "Administra vehículos, conductores y procesos.",
    icon: Settings2
  },
  {
    number: "03",
    title: "Supervisa",
    description: "Consulta y controla la operación desde un solo lugar.",
    icon: ShieldCheck
  }
];

const HowItWorksSection = () => {
  return (
    <section id="como-funciona" className="py-16 sm:py-20 bg-v-dark-soft/30 border-b border-v-dark-border transition-colors duration-300">
      <div className="container mx-auto px-4 sm:px-6">

        {/* ENCABEZADO */}
        <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-12">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-[#124A2F] dark:text-[#A6C98F] font-bold tracking-wider uppercase text-xs mb-2.5"
          >
            Paso a Paso
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-v-white mb-3 tracking-tight leading-snug"
          >
            ¿Cómo funciona <span className="text-[#124A2F] dark:text-[#A6C98F]">VEXTOR?</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-xs sm:text-sm text-v-gray leading-relaxed font-normal max-w-lg mx-auto"
          >
            Tres pasos sencillos para transformar el control de su transporte en un proceso ágil y predecible.
          </motion.p>
        </div>

        {/* GRID HORIZONTAL EN ESCRITORIO / VERTICAL EN MÓVIL */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative max-w-5xl mx-auto">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.4 }}
                className="relative p-6 rounded-2xl bg-v-dark border border-v-dark-border shadow-2xs hover:border-[#124A2F]/40 dark:hover:border-[#A6C98F]/40 transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <span className="text-2xl font-black font-mono text-[#124A2F] dark:text-[#A6C98F] opacity-90">
                      {step.number}
                    </span>
                    <div className="p-2.5 rounded-xl bg-v-dark-soft border border-v-dark-border text-[#124A2F] dark:text-[#A6C98F] group-hover:bg-[#124A2F] group-hover:text-white transition-colors duration-300">
                      <Icon size={20} />
                    </div>
                  </div>

                  <h3 className="text-lg font-bold text-v-white mb-2 leading-snug flex items-center gap-2">
                    <span>{step.title}</span>
                  </h3>

                  <p className="text-xs text-v-gray leading-relaxed font-normal">
                    {step.description}
                  </p>
                </div>

                {/* Connector Arrow for Desktop */}
                {index < steps.length - 1 && (
                  <div className="hidden md:flex absolute -right-3.5 top-1/2 -translate-y-1/2 z-10 w-7 h-7 rounded-full bg-v-dark-soft border border-v-dark-border items-center justify-center text-[#124A2F] dark:text-[#A6C98F]">
                    <ArrowRight size={13} />
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

      </div>
    </section>
  );
};

export default HowItWorksSection;
