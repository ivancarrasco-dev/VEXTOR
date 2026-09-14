import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FileText,
  Search,
  MessageSquare,
  AlertTriangle,
  Clock,
  ArrowRight,
  CheckCircle2
} from 'lucide-react';
import { Button } from '../../../components/ui/Button';

/**
 * ProblemSection Component
 *
 * Responsabilidad:
 * Demostrar los problemas críticos de la gestión manual de flotas y posicionar a VEXTOR como la solución definitiva.
 */
const painPoints = [
  {
    problem: "Información dispersa y desactualizada",
    consequence: "Registros en papel y planillas desincronizadas generan errores y falta de visibilidad en tiempo real.",
    solution: "VEXTOR unifica hojas de vida de vehículos, conductores e itinerarios en una única base de datos accesible.",
    icon: FileText
  },
  {
    problem: "Vencimientos de documentos desapercibidos",
    consequence: "SOAT o licencias vencidas derivan en inmovilizaciones, multas severas e interrupción de servicios.",
    solution: "Alertas automáticas y semaforización proactiva que notifican con días de anticipación.",
    icon: AlertTriangle
  },
  {
    problem: "Mantenimientos correctivos y varadas",
    consequence: "Reparaciones de emergencia no planificadas elevan sustancialmente los costos operativos.",
    solution: "Programación preventiva automatizada por kilometraje y fecha antes de que ocurran fallas.",
    icon: Search
  },
  {
    problem: "Coordinación informal de itinerarios",
    consequence: "Despachos por chats o teléfono provocan confusión en el cumplimiento de horarios y asignaciones.",
    solution: "Gestión digital con asignación explícita de vehículo, conductor, horario y estado del viaje.",
    icon: MessageSquare
  },
  {
    problem: "Dificultad para evaluar costos",
    consequence: "Imposibilidad de conocer con certeza el costo de taller y el nivel real de utilización de la flota.",
    solution: "Reportes consolidados e indicadores clave (KPIs) para tomar decisiones fundamentadas.",
    icon: Clock
  }
];

const ProblemSection = () => {
  return (
    <section className="py-20 lg:py-28 bg-v-dark-soft/30 border-b border-v-dark-border transition-colors duration-300 relative overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 relative z-10">

        {/* ENCABEZADO DE SECCIÓN */}
        <div className="max-w-3xl mb-14 lg:mb-16">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-[#124A2F] dark:text-[#A6C98F] font-bold tracking-wider uppercase text-xs sm:text-sm mb-3"
          >
            Retos de la Gestión Operativa
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-v-white mb-5 leading-[1.18] tracking-tight"
          >
            ¿Identifica estos desafíos en su <span className="text-[#124A2F] dark:text-[#A6C98F]">operación diaria?</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-base sm:text-lg text-v-gray leading-relaxed font-normal"
          >
            Gestionar una flota sin una herramienta especializada genera fricción administrativa y sobrecostos. Conozca cómo VEXTOR lo resuelve.
          </motion.p>
        </div>

        {/* GRID DE PROBLEMA → CONSECUENCIA → SOLUCIÓN */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {painPoints.map((point, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.08, duration: 0.5 }}
              className="p-6 sm:p-8 rounded-2xl bg-v-dark border border-v-dark-border hover:border-[#124A2F]/40 dark:hover:border-[#A6C98F]/40 hover:-translate-y-1 transition-all duration-300 shadow-xs hover:shadow-md flex flex-col justify-between"
            >
              <div>
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center justify-center mb-5 shadow-2xs">
                  <point.icon size={20} />
                </div>

                <span className="text-[10px] font-bold text-amber-500 uppercase tracking-wider block mb-1">
                  Desafío común
                </span>
                <h3 className="text-lg font-bold text-v-white mb-3 leading-snug">
                  {point.problem}
                </h3>

                <div className="mb-5 p-3 rounded-xl bg-v-dark-soft border border-v-dark-border/80">
                  <span className="text-[10px] font-bold text-v-gray uppercase tracking-wider block mb-1">
                    Consecuencia:
                  </span>
                  <p className="text-v-gray text-xs leading-relaxed font-normal">
                    {point.consequence}
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-v-dark-border">
                <span className="text-[10px] font-bold text-[#124A2F] dark:text-[#A6C98F] uppercase tracking-wider block mb-1">
                  Solución VEXTOR:
                </span>
                <p className="text-v-white text-xs font-semibold leading-relaxed">
                  {point.solution}
                </p>
              </div>
            </motion.div>
          ))}

          {/* TARJETA DESTACADA SOLUCIÓN VEXTOR */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="p-6 sm:p-8 rounded-2xl bg-[#124A2F] text-white flex flex-col justify-between shadow-md hover:-translate-y-1 transition-all duration-300"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center mb-5 shadow-2xs">
                <CheckCircle2 size={22} className="text-white" />
              </div>
              <h3 className="text-xl sm:text-2xl font-extrabold mb-3 leading-snug">
                Transforme sus riesgos en control operacional.
              </h3>
              <p className="font-normal text-white/90 text-xs sm:text-sm leading-relaxed">
                VEXTOR elimina la improvisación al integrar vehículos, conductores, itinerarios y talleres en un único entorno digital centralizado.
              </p>
            </div>

            <Link to="/contacto" className="mt-6">
              <Button variant="secondary" className="w-full justify-center font-semibold text-xs sm:text-sm h-11">
                Solicitar Demostración
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
          </motion.div>

        </div>
      </div>
    </section>
  );
};

export default ProblemSection;
