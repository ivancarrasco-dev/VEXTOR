import { motion } from 'framer-motion';
import {
  Truck,
  Users,
  MapPin,
  Wrench,
  BarChart3,
  Bell,
  ShieldCheck,
  Smartphone
} from 'lucide-react';

/**
 * FeaturesSection Component
 *
 * Responsabilidad:
 * Mostrar las funcionalidades clave de la plataforma Vextor.
 *
 * Funcionalidades:
 * * Cuadrícula de características con iconos y descripciones.
 * * Efectos de hover para resaltar capacidades técnicas.
 * * Panel de previsualización de interfaz para demostrar UX/UI.
 * * Listado de beneficios específicos de usabilidad.
 */
const features = [
  {
    title: "Gestión de Vehículos",
    description: "Control total de su flota: documentos, seguros, estado y especificaciones técnicas en un solo lugar.",
    icon: Truck
  },
  {
    title: "Control de Conductores",
    description: "Expedientes digitales, vencimiento de licencias, capacitaciones y seguimiento de desempeño.",
    icon: Users
  },
  {
    title: "Optimización de Rutas",
    description: "Planifique y asigne rutas de manera inteligente. Visualice recorridos y estados en tiempo real.",
    icon: MapPin
  },
  {
    title: "Mantenimiento Inteligente",
    description: "Alertas automáticas para cambios de aceite, revisiones técnico-mecánicas y preventivos.",
    icon: Wrench
  },
  {
    title: "Reportes Avanzados",
    description: "Tome decisiones basadas en datos reales. Gráficos de eficiencia, costos y operatividad.",
    icon: BarChart3
  },
  {
    title: "Sistema de Alertas",
    description: "Notificaciones instantáneas sobre vencimientos, excesos de velocidad o novedades en ruta.",
    icon: Bell
  },
  {
    title: "Seguridad de Datos",
    description: "Información protegida con estándares bancarios. Roles de usuario y permisos granulares.",
    icon: ShieldCheck
  },
  {
    title: "Acceso Multiplataforma",
    description: "Gestione su empresa desde cualquier lugar. Compatible con móviles, tablets y ordenadores.",
    icon: Smartphone
  }
];

const FeaturesSection = () => {
  return (
    <section id="funciones" className="py-24 bg-v-dark-soft relative">
      <div className="container mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-primary font-bold tracking-widest uppercase text-sm mb-4"
          >
            Funcionalidades Premium
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl font-bold text-v-white mb-6"
          >
            Todo lo que necesita para <span className="text-primary">dominar su operación.</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-lg text-v-gray"
          >
            Vextor ha sido construido escuchando las necesidades reales de los jefes de flota y coordinadores operativos.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
              className="p-6 rounded-2xl bg-v-dark border border-v-dark-border hover:border-primary/30 transition-all duration-300 group"
            >
              <div className="w-12 h-12 rounded-xl bg-v-dark-soft text-v-white flex items-center justify-center mb-6 group-hover:bg-primary group-hover:text-v-dark-constant transition-colors duration-300">
                <feature.icon size={24} />
              </div>
              <h3 className="text-lg font-bold text-v-white mb-3">{feature.title}</h3>
              <p className="text-v-gray text-sm leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Feature Preview Card */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-24 bg-v-dark border border-v-dark-border rounded-[40px] overflow-hidden"
        >
          <div className="grid grid-cols-1 lg:grid-cols-2">
            <div className="p-12 md:p-20 flex flex-col justify-center">
              <h3 className="text-3xl md:text-4xl font-bold text-v-white mb-6">
                Interfaz diseñada para la <span className="text-primary">productividad.</span>
              </h3>
              <p className="text-v-gray text-lg mb-8 leading-relaxed">
                No pierda tiempo buscando información. Nuestra interfaz estilo "SaaS Premium" permite acceder a cualquier dato en menos de 3 clics.
              </p>
              <ul className="space-y-4">
                {[
                  "Dashboard intuitivo con métricas clave",
                  "Buscador global ultra-rápido",
                  "Gestión de archivos por arrastrar y soltar",
                  "Modo oscuro optimizado para la vista"
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-v-white/80">
                    <div className="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center">
                      <ShieldCheck size={12} />
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-gradient-to-br from-primary/10 to-transparent p-12 flex items-center justify-center">
              <div className="relative w-full max-w-md aspect-square bg-v-dark-soft rounded-3xl border border-v-dark-border shadow-2xl overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
                <div className="relative p-8 h-full flex flex-col">
                  <div className="flex justify-between items-center mb-8">
                    <div className="h-6 w-24 bg-v-dark-border rounded-full" />
                    <div className="h-10 w-10 rounded-full bg-primary" />
                  </div>
                  <div className="space-y-4 flex-1">
                    <div className="h-20 bg-v-dark border border-v-dark-border rounded-2xl" />
                    <div className="h-20 bg-v-dark border border-v-dark-border rounded-2xl" />
                    <div className="h-20 bg-v-dark border border-v-dark-border rounded-2xl" />
                  </div>
                  <div className="mt-8 flex gap-4">
                    <div className="h-10 flex-1 bg-v-dark-border rounded-xl" />
                    <div className="h-10 w-10 bg-v-dark-border rounded-xl" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default FeaturesSection;
