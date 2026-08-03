import { motion } from 'framer-motion';
import {
  FileText,
  Search,
  MessageSquare,
  AlertCircle,
  Clock,
  ArrowRight
} from 'lucide-react';

/**
 * ProblemSection Component
 *
 * Responsabilidad:
 * Sección de agitación de problemas (Problem/Agitation) para la Landing Page.
 *
 * Funcionalidades:
 * * Listado de puntos de dolor comunes en la gestión de flotas manual.
 * * Tarjetas interactivas con iconos representativos.
 * * Llamada a la acción destacada (Digitalización).
 * * Contraste visual fuerte para resaltar la necesidad de cambio.
 */
const problems = [
  {
    title: "Uso excesivo de papel",
    description: "Reportes físicos que se pierden, se dañan o son difíciles de archivar y consultar.",
    icon: FileText,
    color: "text-amber-500",
    bg: "bg-amber-500/10"
  },
  {
    title: "Información dispersa",
    description: "Datos en múltiples hojas de cálculo de Excel que nadie logra consolidar a tiempo.",
    icon: Search,
    color: "text-blue-500",
    bg: "bg-blue-500/10"
  },
  {
    title: "Gestión por WhatsApp",
    description: "Operaciones críticas decididas en chats informales sin historial ni estructura operativa.",
    icon: MessageSquare,
    color: "text-emerald-500",
    bg: "bg-emerald-500/10"
  },
  {
    title: "Mantenimientos olvidados",
    description: "Falta de alertas preventivas que resultan en vehículos varados y costos correctivos altos.",
    icon: AlertCircle,
    color: "text-rose-500",
    bg: "bg-rose-500/10"
  },
  {
    title: "Falta de control real",
    description: "Dificultad para saber exactamente dónde están sus vehículos o qué hacen sus conductores.",
    icon: Clock,
    color: "text-purple-500",
    bg: "bg-purple-500/10"
  }
];

const ProblemSection = () => {
  return (
    <section className="py-24 bg-v-dark relative overflow-hidden">
      <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-3xl mb-20">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-bold text-v-white mb-6"
          >
            ¿Su operación depende de <span className="text-rose-500">procesos manuales?</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-xl text-v-gray leading-relaxed"
          >
            Las empresas de transporte más competitivas ya dejaron atrás el papel. Si aún gestiona su flota de forma manual, está perdiendo dinero y control.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {problems.map((problem, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="group p-8 rounded-3xl bg-v-dark-soft border border-v-dark-border hover:border-v-white/20 transition-all duration-300"
            >
              <div className={`w-14 h-14 rounded-2xl ${problem.bg} ${problem.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                <problem.icon size={28} />
              </div>
              <h3 className="text-xl font-bold text-v-white mb-3">{problem.title}</h3>
              <p className="text-v-gray leading-relaxed mb-6">
                {problem.description}
              </p>
              <div className="flex items-center text-sm font-bold text-v-white/40 group-hover:text-primary transition-colors">
                Digitalizar proceso <ArrowRight className="ml-2 w-4 h-4" />
              </div>
            </motion.div>
          ))}

          {/* Special Solution Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5 }}
            className="p-8 rounded-3xl bg-primary flex flex-col justify-between"
          >
            <div>
              <h3 className="text-2xl font-bold text-v-dark-constant mb-4">Vextor es la solución que su empresa necesita.</h3>
              <p className="text-v-dark-constant/80 font-medium leading-relaxed">
                Centralizamos toda su operación en una plataforma intuitiva, profesional y diseñada para el crecimiento.
              </p>
            </div>
            <button className="mt-8 bg-v-dark text-v-white font-bold py-4 px-6 rounded-xl flex items-center justify-center hover:bg-v-dark/90 transition-colors">
              Descubrir cómo
              <ArrowRight className="ml-2 w-5 h-5" />
            </button>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default ProblemSection;
