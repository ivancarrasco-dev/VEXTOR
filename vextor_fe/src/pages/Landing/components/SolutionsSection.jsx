import { motion } from 'framer-motion';
import { Truck, Users, Route, Wrench } from 'lucide-react';

/**
 * SolutionsSection Component
 *
 * Responsabilidad:
 * Consolidar en aproximadamente 4 tarjetas compactas las soluciones y funcionalidades principales:
 * 1. Gestión de vehículos
 * 2. Conductores
 * 3. Rutas y seguimiento
 * 4. Mantenimiento y reportes
 */
const solutions = [
  {
    title: "Gestión de vehículos",
    desc: "Gestión y organización de la flota, hojas de vida técnicas y control de documentación (SOAT, RTM y pólizas).",
    icon: Truck,
    badge: "Flota Centralizada"
  },
  {
    title: "Conductores",
    desc: "Información y administración de conductores, expedientes digitales, vigencia de licencias y asignaciones.",
    icon: Users,
    badge: "Personal en Regla"
  },
  {
    title: "Rutas y seguimiento",
    desc: "Supervisión y control de las rutas, itinarios de origen a destino y cumplimiento de itinerarios en tiempo real.",
    icon: Route,
    badge: "Monitoreo Operativo"
  },
  {
    title: "Mantenimiento y reportes",
    desc: "Control del mantenimiento preventivo en taller y consulta de información operativa e indicadores clave (KPIs).",
    icon: Wrench,
    badge: "Previsión y Costos"
  }
];

const SolutionsSection = () => {
  return (
    <section id="soluciones" className="py-16 sm:py-20 bg-v-dark-soft/40 border-b border-v-dark-border/70 transition-colors duration-300">
      <div className="container mx-auto px-4 sm:px-6">

        {/* ENCABEZADO */}
        <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-12">
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
            Todo lo que su empresa necesita en <span className="text-[#124A2F] dark:text-[#A6C98F]">4 módulos principales</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-xs sm:text-sm text-v-gray leading-relaxed font-normal"
          >
            Simplifique la gestión diaria sin duplicar tareas ni saturar a su equipo administrativo.
          </motion.p>
        </div>

        {/* GRID DE 4 CARDS COMPACTAS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {solutions.map((item, index) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.08, duration: 0.4 }}
                className="p-5 sm:p-6 rounded-xl bg-v-dark border border-v-dark-border hover:border-[#124A2F]/40 dark:hover:border-[#A6C98F]/40 transition-all duration-300 shadow-2xs hover:shadow-sm flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 rounded-lg bg-v-dark-soft border border-v-dark-border text-v-white flex items-center justify-center group-hover:bg-[#124A2F] group-hover:text-white group-hover:border-[#124A2F] transition-colors duration-300">
                      <Icon size={20} />
                    </div>
                    <span className="text-[10px] font-bold text-[#124A2F] dark:text-[#A6C98F] bg-[#124A2F]/10 dark:bg-[#A6C98F]/10 px-2 py-0.5 rounded border border-[#124A2F]/20 dark:border-[#A6C98F]/20">
                      {item.badge}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-v-white mb-2 group-hover:text-[#124A2F] dark:group-hover:text-[#A6C98F] transition-colors">
                    {item.title}
                  </h3>

                  <p className="text-xs text-v-gray leading-relaxed font-normal">
                    {item.desc}
                  </p>
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
